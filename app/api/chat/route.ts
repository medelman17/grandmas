import { streamText } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { GRANDMAS, DEBATE_COORDINATOR_PROMPT, getDebateResponsePrompt } from "@/lib/grandmas";
import { ChatRequest, GrandmaId } from "@/lib/types";

// Use edge runtime for faster cold starts
export const runtime = "edge";

// Use Vercel AI Gateway for model access
const model = gateway("anthropic/claude-sonnet-4");

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequest;
    const { messages, grandmaId, mode, context } = body;

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

ADDITIONAL CONTEXT: This is a debate reaction check. A grandma just spoke and you need to determine if another grandma would want to jump in and respond.

The grandma who can NOT respond (because they just spoke): ${GRANDMAS[lastSpeaker].name}
${lastTarget ? `The grandma being addressed: ${GRANDMAS[lastTarget].name}` : ""}

Consider: Would any OTHER grandma be triggered enough to respond? Remember these grandmas are SHORT-FUSED. But also don't force it - if the statement doesn't warrant a response, say so.`;

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
    if (context?.replyingTo && GRANDMAS[context.replyingTo]) {
      const target = GRANDMAS[context.replyingTo];
      // The reason should be in the last user message for debate context
      const reason = messages[messages.length - 1]?.content || "a different perspective";
      systemPrompt = getDebateResponsePrompt(grandma, target, reason);
    }

    // Use plain string model ID - AI SDK auto-routes through AI Gateway
    const result = streamText({
      model,
      system: systemPrompt,
      messages,
      maxOutputTokens: 300,
    });

    return result.toTextStreamResponse();
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
