import { streamText, stepCountIs } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { GRANDMAS, DEBATE_COORDINATOR_PROMPT, MEETING_SUMMARY_PROMPT, getDebateResponsePrompt, getProactiveCheckPrompt } from "@/lib/grandmas";
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

    // Proactive check mode: Determine if a grandma should reach out privately
    if (mode === "proactive-check") {
      if (!grandmaId || !GRANDMAS[grandmaId]) {
        return new Response(
          JSON.stringify({ error: "grandmaId required for proactive-check mode" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const recentGroupMessages = context?.recentGroupMessages;
      if (!recentGroupMessages) {
        return new Response(
          JSON.stringify({ error: "recentGroupMessages required for proactive-check mode" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const grandma = GRANDMAS[grandmaId];
      const proactivePrompt = getProactiveCheckPrompt(grandma);

      const result = streamText({
        model,
        system: proactivePrompt,
        messages: [
          {
            role: "user",
            content: `Here's the recent group conversation:\n\n${recentGroupMessages}\n\nShould ${grandma.name} reach out to the user privately? Respond with JSON only.`,
          },
        ],
        maxOutputTokens: 200,
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

      // Use same format as regular responses for client compatibility
      const encoder = new TextEncoder();
      const transformStream = new TransformStream({
        transform(textChunk, controller) {
          controller.enqueue(encoder.encode(`0:${JSON.stringify(textChunk)}\n`));
        },
      });

      return new Response(result.textStream.pipeThrough(transformStream), {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // Regular response mode - with memory tools if userId is provided
    // Start user validation early (don't await yet) - async-api-routes pattern
    const userPromise = userId ? getOrCreateUser(userId) : null;

    // Add memory behavior instructions to system prompt while user validation runs
    if (grandma.memoryBehavior) {
      systemPrompt += `\n\nMEMORY INSTRUCTIONS:\n${grandma.memoryBehavior}`;
    }

    // Now await user validation (it's been running in parallel with prompt prep)
    const validatedUserId = userPromise ? await userPromise : null;

    // Create memory tools if we have a valid user
    const tools = validatedUserId ? createMemoryTools(validatedUserId, grandmaId) : undefined;

    // Use plain string model ID - AI SDK auto-routes through AI Gateway
    // Track tool events in a queue that we'll interleave with text
    const toolEvents: string[] = [];
    const encoder = new TextEncoder();

    const result = streamText({
      model,
      system: systemPrompt,
      messages,
      tools,
      // Allow tool calling loops only if tools are available
      ...(tools && { stopWhen: stepCountIs(3) }),
      maxOutputTokens: 150,
      onChunk: ({ chunk }) => {
        // Capture tool events as they happen
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
