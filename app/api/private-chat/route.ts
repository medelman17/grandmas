import { streamText, stepCountIs } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { GRANDMAS, getRelationship } from "@/lib/grandmas";
import { PrivateChatRequest, GrandmaId, AllianceTriggerType } from "@/lib/types";
import { createMemoryTools } from "@/lib/memory";
import { getOrCreateUser } from "@/lib/user/store";

// Use edge runtime for faster cold starts
export const runtime = "edge";

// Use Vercel AI Gateway for model access
const model = gateway("anthropic/claude-sonnet-4");

/**
 * Get private chat system prompt for a grandma
 * This is more intimate/personal than the group chat prompt
 */
function getPrivateChatPrompt(
  grandmaId: string,
  proactiveContext?: { groupDiscussion: string; triggerReason: string },
  groupChatContext?: string
): string {
  const grandma = GRANDMAS[grandmaId as keyof typeof GRANDMAS];
  if (!grandma) return "";

  let basePrompt = grandma.systemPrompt;

  // Modify for private chat context
  const privateModifier = `

PRIVATE CHAT MODE: You're now in a private 1:1 conversation with this person, separate from the group counsel.
- You can be more personal and less performative than in the group chat
- You can share things you wouldn't say in front of the other grandmas
- You can ask follow-up questions and go deeper
- You can be more vulnerable or honest about your own experiences
- Keep responses conversational but still SHORT - 2-3 sentences max
- You can acknowledge the group discussion if relevant, but this is your private moment with them`;

  basePrompt += privateModifier;

  // Add proactive context if this is a grandma-initiated message
  if (proactiveContext) {
    basePrompt += `

PROACTIVE OUTREACH: You're reaching out to this person privately because something in the group discussion made you want to connect with them one-on-one.

What happened in the group chat:
${proactiveContext.groupDiscussion}

Why you're reaching out privately:
${proactiveContext.triggerReason}

Start your message naturally - you might reference what happened in the group, share something you didn't want to say in front of the others, or just check in on them. Be genuine and caring in your own unique way.`;
  } else if (groupChatContext) {
    // Add group chat context for user-initiated private chats
    basePrompt += `

GROUP CHAT CONTEXT: Here's what was recently discussed in the group counsel chat. You were part of this conversation and remember it well. If the user references something from the group chat, you can discuss it naturally.

Recent group discussion:
${groupChatContext}

You can reference specific things you or other grandmas said, share follow-up thoughts you didn't mention in the group, or discuss any topic from the group chat. Be natural - you remember all of this as if you were just there (because you were!).`;
  }

  return basePrompt;
}

/**
 * Build system prompt for alliance gossip messages
 * Uses relationship data to create personality-specific gossip
 */
function getAllianceGossipPrompt(
  grandmaId: GrandmaId,
  aboutGrandma: GrandmaId,
  triggerType: AllianceTriggerType,
  context: string,
  debateSnippet?: string
): string {
  const grandma = GRANDMAS[grandmaId];
  const targetGrandma = GRANDMAS[aboutGrandma];
  const relationship = getRelationship(grandmaId, aboutGrandma);

  if (!grandma || !targetGrandma || !relationship) {
    return "";
  }

  let basePrompt = grandma.systemPrompt;

  // Determine gossip tone based on trigger type and relationship
  let gossipTone = "";
  switch (triggerType) {
    case "post-debate":
      if (relationship.type === "ally") {
        gossipTone = `You're reaching out to privately support your friend ${targetGrandma.name}. You saw how she was treated in the debate and it bothered you. Share your sympathy and solidarity.`;
      }
      break;
    case "outnumbered":
      gossipTone = `${targetGrandma.name} was ganged up on by multiple grandmas. You feel protective and want to privately reassure this person that ${targetGrandma.name} didn't deserve that.`;
      break;
    case "harsh-criticism":
      if (relationship.type === "irritated" || relationship.type === "frenemy") {
        gossipTone = `You're secretly pleased that ${targetGrandma.name} got called out. Share a bit of gleeful gossip with this person - nothing too mean, but let them know you noticed and maybe weren't too sad about it.`;
      }
      break;
    case "random":
      gossipTone = `You're just thinking about ${targetGrandma.name} and want to share a private thought or observation about her with this person.`;
      break;
  }

  const allianceModifier = `

ALLIANCE GOSSIP MODE: You're sending a private gossip message about ${targetGrandma.name}.

Your private opinion of ${targetGrandma.name}: "${relationship.privateOpinion}"

${gossipTone}

${context}

${debateSnippet ? `What was said: "${debateSnippet}..."` : ""}

IMPORTANT GUIDELINES:
- Start with something like "Between you and me..." or "Can I tell you something?" or "Just between us..."
- Keep it SHORT - 1-2 sentences of actual gossip
- Stay in character - your gossip should sound like YOU
- Don't be too mean - this is grandma gossip, not bullying
- Make it feel like a secret shared between friends
- This is a 🤫 moment - you wouldn't say this in front of the other grandmas`;

  return basePrompt + allianceModifier;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as PrivateChatRequest;
    const { messages, grandmaId, userId, proactiveContext, groupChatContext, allianceContext } = body;

    // Validate request
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!grandmaId || !GRANDMAS[grandmaId]) {
      return new Response(
        JSON.stringify({ error: "Valid grandmaId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const grandma = GRANDMAS[grandmaId];

    // Determine which system prompt to use based on context type
    let systemPrompt: string;
    if (allianceContext) {
      // Alliance gossip message - use gossip-specific prompt
      systemPrompt = getAllianceGossipPrompt(
        grandmaId,
        allianceContext.aboutGrandma,
        allianceContext.triggerType,
        allianceContext.context,
        allianceContext.debateSnippet
      );
    } else {
      // Regular private chat or proactive message (with optional group context)
      systemPrompt = getPrivateChatPrompt(grandmaId, proactiveContext, groupChatContext);
    }

    // Validate user and get/create their record
    let validatedUserId: string | null = null;
    if (userId) {
      validatedUserId = await getOrCreateUser(userId);
    }

    // Add memory behavior instructions if grandma has them
    if (grandma.memoryBehavior) {
      systemPrompt += `\n\nMEMORY INSTRUCTIONS:\n${grandma.memoryBehavior}`;
    }

    // Create memory tools if we have a valid user
    const tools = validatedUserId ? createMemoryTools(validatedUserId, grandmaId) : undefined;

    // Track tool events
    const toolEvents: string[] = [];
    const encoder = new TextEncoder();

    const result = streamText({
      model,
      system: systemPrompt,
      messages,
      tools,
      ...(tools && { stopWhen: stepCountIs(3) }),
      // Slightly more tokens for private chat since it can be more conversational
      maxOutputTokens: 200,
      onChunk: ({ chunk }) => {
        if (chunk.type === "tool-call") {
          toolEvents.push(`9:${JSON.stringify({
            toolCallId: chunk.toolCallId,
            toolName: chunk.toolName,
          })}\n`);
        } else if (chunk.type === "tool-result") {
          toolEvents.push(`a:${JSON.stringify({
            toolCallId: chunk.toolCallId,
          })}\n`);
        }
      },
    });

    // Create a custom stream that interleaves tool events with text
    const transformStream = new TransformStream({
      transform(textChunk, controller) {
        // First, flush any pending tool events
        while (toolEvents.length > 0) {
          controller.enqueue(encoder.encode(toolEvents.shift()!));
        }
        // Then send the text chunk
        controller.enqueue(encoder.encode(`0:${JSON.stringify(textChunk)}\n`));
      },
      flush(controller) {
        // Flush remaining tool events at the end
        while (toolEvents.length > 0) {
          controller.enqueue(encoder.encode(toolEvents.shift()!));
        }
      },
    });

    return new Response(result.textStream.pipeThrough(transformStream), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Private chat API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
