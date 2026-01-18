import { streamText, stepCountIs } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { GRANDMAS } from "@/lib/grandmas";
import { PrivateChatRequest } from "@/lib/types";
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
function getPrivateChatPrompt(grandmaId: string, proactiveContext?: { groupDiscussion: string; triggerReason: string }): string {
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
  }

  return basePrompt;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as PrivateChatRequest;
    const { messages, grandmaId, userId, proactiveContext } = body;

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
    let systemPrompt = getPrivateChatPrompt(grandmaId, proactiveContext);

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
