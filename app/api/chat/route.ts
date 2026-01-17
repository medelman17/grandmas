import { streamText, stepCountIs } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { GRANDMAS, DEBATE_COORDINATOR_PROMPT, MEETING_SUMMARY_PROMPT, getDebateResponsePrompt } from "@/lib/grandmas";
import { ChatRequest, GrandmaId } from "@/lib/types";
import { createMemoryTools } from "@/lib/memory";
import { getOrCreateUser } from "@/lib/user/store";

// Use edge runtime for faster cold starts
export const runtime = "edge";

// Use Vercel AI Gateway for model access
const model = gateway("anthropic/claude-sonnet-4");

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequest;
    const { messages, grandmaId, mode, context, userId } = body;

    // Validate request
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Coordinator mode: Analyze responses for disagreements
    if (mode === "coordinator") {
      // Check if this is a debate reaction check (single message) or initial check (all responses)
      if (context?.debateReaction) {
        // Analyze a single debate message for reactions
        const lastSpeaker = context.lastSpeaker as GrandmaId;
        const lastTarget = context.lastTarget as GrandmaId | undefined;
        const messageContent = messages.find((m) => m.role === "user")?.content || "";

        const reactionPrompt = `${DEBATE_COORDINATOR_PROMPT}

ADDITIONAL CONTEXT: This is a debate reaction check. A grandma just spoke and you need to determine if another grandma would want to jump in.

The grandma who can NOT respond (just spoke): ${GRANDMAS[lastSpeaker].name}
${lastTarget ? `The grandma being addressed: ${GRANDMAS[lastTarget].name}` : ""}

These grandmas CAN'T RESIST jumping in. Look for ANY of these triggers:
- A grandma's values were attacked (food vs books, emotion vs logic, faith vs business)
- Someone said something another grandma finds weak, cold, or naive
- A grandma was left out and would HATE not having the last word
- There's an opening for a devastating one-liner

Be trigger-happy! These grandmas live for the drama.`;

        const result = streamText({
          model,
          system: reactionPrompt,
          messages: [
            {
              role: "user",
              content: `${messageContent}

Would any grandma (other than ${GRANDMAS[lastSpeaker].name}) want to respond to this? Analyze and respond with JSON only.`,
            },
          ],
          maxOutputTokens: 500,
        });

        return result.toTextStreamResponse();
      }

      // Initial debate check - analyze all responses
      const allResponses = context?.allResponses;
      if (!allResponses) {
        return new Response(
          JSON.stringify({ error: "allResponses required for coordinator mode" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Format the responses for analysis
      const responseSummary = Object.entries(allResponses)
        .map(([id, content]) => `${GRANDMAS[id as GrandmaId].name}: ${content}`)
        .join("\n\n");

      const userQuestion = messages.find((m) => m.role === "user")?.content || "";

      // Use plain string model ID - AI SDK auto-routes through AI Gateway
      const result = streamText({
        model,
        system: DEBATE_COORDINATOR_PROMPT,
        messages: [
          {
            role: "user",
            content: `User's question: "${userQuestion}"

The grandmas responded:

${responseSummary}

Analyze for disagreements and respond with JSON only.`,
          },
        ],
        maxOutputTokens: 500,
      });

      return result.toTextStreamResponse();
    }

    // Summary mode: Generate meeting minutes from conversation
    if (mode === "summary") {
      const transcript = context?.conversationTranscript;
      if (!transcript) {
        return new Response(
          JSON.stringify({ error: "conversationTranscript required for summary mode" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const result = streamText({
        model,
        system: MEETING_SUMMARY_PROMPT,
        messages: [
          {
            role: "user",
            content: `Please generate meeting minutes for this Council of Grandmas session:\n\n${transcript}`,
          },
        ],
        maxOutputTokens: 600,
      });

      return result.toTextStreamResponse();
    }

    // Single grandma mode
    if (!grandmaId || !GRANDMAS[grandmaId]) {
      return new Response(
        JSON.stringify({ error: "Valid grandmaId is required for single mode" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const grandma = GRANDMAS[grandmaId];
    let systemPrompt = grandma.systemPrompt;

    // If this is a debate response, modify the prompt
    // Note: No memory tools during debates - they're fast-paced exchanges
    if (context?.replyingTo && GRANDMAS[context.replyingTo]) {
      const target = GRANDMAS[context.replyingTo];
      // The reason should be in the last user message for debate context
      const reason = messages[messages.length - 1]?.content || "a different perspective";
      systemPrompt = getDebateResponsePrompt(grandma, target, reason);

      // Debate mode - no tools, quick response
      const result = streamText({
        model,
        system: systemPrompt,
        messages,
        maxOutputTokens: 150,
      });

      return result.toTextStreamResponse();
    }

    // Regular response mode - with memory tools if userId is provided
    // Validate user and get/create their record
    let validatedUserId: string | null = null;
    if (userId) {
      validatedUserId = await getOrCreateUser(userId);
    }

    // Add memory behavior instructions to system prompt if grandma has them
    if (grandma.memoryBehavior) {
      systemPrompt += `\n\nMEMORY INSTRUCTIONS:\n${grandma.memoryBehavior}`;
    }

    // Create memory tools if we have a valid user
    const tools = validatedUserId ? createMemoryTools(validatedUserId, grandmaId) : undefined;

    // Use plain string model ID - AI SDK auto-routes through AI Gateway
    const result = streamText({
      model,
      system: systemPrompt,
      messages,
      tools,
      // Allow tool calling loops only if tools are available
      ...(tools && { stopWhen: stepCountIs(3) }),
      maxOutputTokens: 150,
    });

    // Create custom data stream that exposes tool events for memory indicators
    // This emits SSE events: text-delta, tool-call, tool-result
    const encoder = new TextEncoder();
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        switch (chunk.type) {
          case "text-delta":
            // Format: 0:{text}\n (text-delta)
            // Note: AI SDK v5+ uses 'delta' not 'textDelta'
            controller.enqueue(encoder.encode(`0:${JSON.stringify(chunk.delta)}\n`));
            break;
          case "tool-call":
            // Format: 9:{toolCallId, toolName}\n (tool-call)
            controller.enqueue(encoder.encode(`9:${JSON.stringify({
              toolCallId: chunk.toolCallId,
              toolName: chunk.toolName,
            })}\n`));
            break;
          case "tool-result":
            // Format: a:{toolCallId}\n (tool-result)
            controller.enqueue(encoder.encode(`a:${JSON.stringify({
              toolCallId: chunk.toolCallId,
            })}\n`));
            break;
          // Ignore other event types (step-start, step-finish, etc.)
        }
      },
    });

    return new Response(result.fullStream.pipeThrough(transformStream), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
