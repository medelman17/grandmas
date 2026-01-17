"use client";

import { useState, useCallback, useRef, startTransition } from "react";
import {
  CounselMessage,
  TypingState,
  DebateInstruction,
  GrandmaId,
  CoordinatorResponse,
} from "@/lib/types";
import { GRANDMAS, GRANDMA_IDS } from "@/lib/grandmas";

/**
 * Generate a unique ID for messages
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * With toTextStreamResponse(), chunks are plain text - no parsing needed
 */

/**
 * Random delay within a range
 */
function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Validate that a debate instruction has valid grandma IDs
 */
function isValidDebate(debate: DebateInstruction): boolean {
  return (
    GRANDMA_IDS.includes(debate.responderId) &&
    GRANDMA_IDS.includes(debate.targetId)
  );
}

/**
 * Rounds before asking user if they want to keep listening
 * This allows natural debate flow with human check-ins at good stopping points
 */
const ROUNDS_BEFORE_CHECKIN = 5;

/**
 * Each grandma has different "typing speed" characteristics
 * This affects how long their typing indicator shows before message appears
 * Increased ~2.5x for slower, more readable pacing
 */
const GRANDMA_RESPONSE_DELAYS: Record<GrandmaId, { min: number; max: number }> = {
  "nana-ruth": { min: 500, max: 1500 },      // Nana Ruth is measured and thoughtful
  "abuela-carmen": { min: 300, max: 1000 },  // Abuela Carmen is quick and passionate
  "ba-nguyen": { min: 750, max: 2000 },      // Bà Nguyen takes her time, considered
  "grandma-edith": { min: 400, max: 1250 },  // Grandma Edith has steady rhythm
  "bibi-amara": { min: 1000, max: 2500 },    // Bibi Amara is dramatic, takes longest
};

/**
 * Hook for managing the counsel of grandmas chat
 */
export function useCounsel() {
  const [messages, setMessages] = useState<CounselMessage[]>([]);
  const [typingGrandmas, setTypingGrandmas] = useState<TypingState[]>([]);
  const [isDebating, setIsDebating] = useState(false);
  const [debateQueue, setDebateQueue] = useState<DebateInstruction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debateRound, setDebateRound] = useState(0);
  const [debatePauseReason, setDebatePauseReason] = useState<string>("");
  const [recentDebateMessages, setRecentDebateMessages] = useState<
    Array<{ grandmaId: GrandmaId; content: string; targetId?: GrandmaId }>
  >([]);
  const [showSummaryPrompt, setShowSummaryPrompt] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Track active streaming controllers for cleanup
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  /**
   * Stream a response from a single grandma
   */
  const streamGrandmaResponse = useCallback(
    async (
      question: string,
      grandmaId: GrandmaId,
      replyingTo?: GrandmaId,
      debateReason?: string
    ): Promise<string> => {
      const controller = new AbortController();
      const messageId = generateId();
      abortControllersRef.current.set(messageId, controller);

      // Keep typing indicator visible - don't add message until ready
      let fullContent = "";

      try {
        console.log(`[${grandmaId}] Starting fetch...`);
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: debateReason || question,
              },
            ],
            grandmaId,
            mode: "single",
            context: replyingTo
              ? { replyingTo }
              : undefined,
          }),
        });

        console.log(`[${grandmaId}] Response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[${grandmaId}] Error response:`, errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          console.error(`[${grandmaId}] No reader available`);
          throw new Error("No reader available");
        }

        const decoder = new TextDecoder();
        console.log(`[${grandmaId}] Starting stream read...`);

        // Collect full response (don't display until complete - like iMessage)
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log(`[${grandmaId}] Stream complete. Total: ${fullContent.length} chars`);
            break;
          }

          const text = decoder.decode(value, { stream: true });
          if (text) {
            fullContent += text;
          }
        }

        // Add personality-based delay before showing message (simulates send lag)
        const delays = GRANDMA_RESPONSE_DELAYS[grandmaId];
        const postDelay = randomDelay(delays.min, delays.max);
        await new Promise((r) => setTimeout(r, postDelay));

        // Remove typing indicator
        setTypingGrandmas((prev) =>
          prev.filter((t) => t.grandmaId !== grandmaId)
        );

        // Now add the complete message all at once (like iMessage)
        setMessages((prev) => [
          ...prev,
          {
            id: messageId,
            type: "grandma",
            content: fullContent,
            grandmaId,
            replyingTo,
            timestamp: Date.now(),
            isStreaming: false,
          },
        ]);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          // Request was cancelled - clean up typing indicator
          setTypingGrandmas((prev) =>
            prev.filter((t) => t.grandmaId !== grandmaId)
          );
          return fullContent;
        }
        console.error(`Error streaming ${grandmaId}:`, error);
        fullContent = `*${GRANDMAS[grandmaId].name} is having technical difficulties*`;

        // Remove typing and show error message
        setTypingGrandmas((prev) =>
          prev.filter((t) => t.grandmaId !== grandmaId)
        );
        setMessages((prev) => [
          ...prev,
          {
            id: messageId,
            type: "grandma",
            content: fullContent,
            grandmaId,
            replyingTo,
            timestamp: Date.now(),
            isStreaming: false,
          },
        ]);
      } finally {
        abortControllersRef.current.delete(messageId);
      }

      return fullContent;
    },
    []
  );

  /**
   * Check for reactions to a specific debate message
   * Used for automatic back-and-forth
   * Returns both the next debate instruction and whether to pause
   */
  const checkForDebateReaction = useCallback(
    async (
      speakerId: GrandmaId,
      speakerContent: string,
      targetId?: GrandmaId
    ): Promise<{ debate: DebateInstruction | null; shouldPause: boolean; pauseReason?: string }> => {
      try {
        const context = targetId
          ? `${GRANDMAS[speakerId].name} just said (replying to ${GRANDMAS[targetId].name}): "${speakerContent}"`
          : `${GRANDMAS[speakerId].name} just said: "${speakerContent}"`;

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: context }],
            mode: "coordinator",
            context: {
              debateReaction: true,
              lastSpeaker: speakerId,
              lastTarget: targetId,
            },
          }),
        });

        if (!response.ok) return { debate: null, shouldPause: false };

        const reader = response.body?.getReader();
        if (!reader) return { debate: null, shouldPause: false };

        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullContent += decoder.decode(value, { stream: true });
        }

        const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return { debate: null, shouldPause: false };

        const parsed = JSON.parse(jsonMatch[0]) as CoordinatorResponse;

        // Check for shouldPause first
        if (parsed.shouldPause) {
          return {
            debate: parsed.debates?.[0] || null,
            shouldPause: true,
            pauseReason: parsed.pauseReason || "The grandmas seem to be winding down..."
          };
        }

        if (parsed.hasDisagreement && parsed.debates?.length > 0) {
          // Return just the first reaction - we'll check again after
          return { debate: parsed.debates[0], shouldPause: false };
        }
      } catch (error) {
        console.error("Error checking for debate reaction:", error);
      }

      return { debate: null, shouldPause: false };
    },
    []
  );

  /**
   * Check for debates after all grandmas respond
   */
  const checkForDebates = useCallback(
    async (
      question: string,
      responses: Record<GrandmaId, string>
    ): Promise<DebateInstruction[]> => {
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: question }],
            mode: "coordinator",
            context: { allResponses: responses },
          }),
        });

        if (!response.ok) return [];

        const reader = response.body?.getReader();
        if (!reader) return [];

        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          fullContent += text;
        }

        // Parse JSON response
        const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return [];

        const parsed = JSON.parse(jsonMatch[0]) as CoordinatorResponse;
        if (parsed.hasDisagreement && parsed.debates?.length > 0) {
          return parsed.debates;
        }
      } catch (error) {
        console.error("Error checking for debates:", error);
      }

      return [];
    },
    []
  );

  /**
   * Run automatic debate rounds - grandmas respond to each other
   * without user intervention until a natural pause or check-in point
   */
  const runAutomaticDebates = useCallback(
    async (initialDebates: DebateInstruction[], startRound: number) => {
      let currentDebates = [...initialDebates];
      let round = startRound;
      let coordinatorSaysPause = false;
      let coordinatorPauseReason = "";

      while (currentDebates.length > 0 && round < ROUNDS_BEFORE_CHECKIN && !coordinatorSaysPause) {
        const debate = currentDebates.shift()!;

        // Skip invalid debates (coordinator may return malformed responses)
        if (!isValidDebate(debate)) {
          console.warn("Skipping invalid debate instruction:", debate);
          continue;
        }

        round++;
        setDebateRound(round);

        // Personality-based delay before showing typing indicator (~2.5x for slower pacing)
        const readingDelays: Record<GrandmaId, { min: number; max: number }> = {
          "abuela-carmen": { min: 600, max: 1500 },
          "nana-ruth": { min: 900, max: 2100 },
          "grandma-edith": { min: 750, max: 1800 },
          "ba-nguyen": { min: 1200, max: 2700 },
          "bibi-amara": { min: 1500, max: 3300 },
        };
        const readDelay = readingDelays[debate.responderId];
        await new Promise((r) => setTimeout(r, randomDelay(readDelay.min, readDelay.max)));

        // Show typing indicator (non-urgent visual update)
        startTransition(() => {
          setTypingGrandmas([
            {
              grandmaId: debate.responderId,
              replyingTo: debate.targetId,
              startedAt: Date.now(),
            },
          ]);
        });

        // Stream the debate response
        const responseContent = await streamGrandmaResponse(
          debate.reason,
          debate.responderId,
          debate.targetId,
          debate.reason
        );

        // Track this message for reaction checking
        setRecentDebateMessages((prev) => [
          ...prev,
          {
            grandmaId: debate.responderId,
            content: responseContent,
            targetId: debate.targetId,
          },
        ]);

        // Check if anyone wants to react to this response
        if (round < ROUNDS_BEFORE_CHECKIN && !coordinatorSaysPause) {
          const reactionResult = await checkForDebateReaction(
            debate.responderId,
            responseContent,
            debate.targetId
          );

          if (reactionResult.shouldPause) {
            coordinatorSaysPause = true;
            coordinatorPauseReason = reactionResult.pauseReason || "The grandmas seem to be winding down...";
            if (reactionResult.debate && isValidDebate(reactionResult.debate)) {
              currentDebates.push(reactionResult.debate);
            }
          } else if (reactionResult.debate && isValidDebate(reactionResult.debate)) {
            // Someone wants to respond! Add to queue
            currentDebates.push(reactionResult.debate);
          }
        }

        // Longer pause between debate rounds for readability (~2.5x)
        if (currentDebates.length > 0) {
          await new Promise((r) => setTimeout(r, randomDelay(1200, 2400)));
        }
      }

      // After auto-rounds, check if there are still pending debates or we hit a natural pause
      if (currentDebates.length > 0 || round >= ROUNDS_BEFORE_CHECKIN || coordinatorSaysPause) {
        setDebateQueue(currentDebates);
        if (coordinatorSaysPause) {
          setDebatePauseReason(coordinatorPauseReason);
        } else if (round >= ROUNDS_BEFORE_CHECKIN) {
          setDebatePauseReason("The grandmas are really going at it...");
        }
        // User will need to click continue for more
      } else {
        setIsDebating(false);
        setDebateQueue([]);
        setDebatePauseReason("");
      }
    },
    [streamGrandmaResponse, checkForDebateReaction]
  );

  /**
   * Send a question to all grandmas
   */
  const sendQuestion = useCallback(
    async (question: string) => {
      if (!question.trim() || isLoading) return;

      setIsLoading(true);
      setIsDebating(false);
      setDebateQueue([]);
      setDebateRound(0);
      setRecentDebateMessages([]);

      // Add user message
      const userMessage: CounselMessage = {
        id: generateId(),
        type: "user",
        content: question,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Show staggered typing indicators with personality-based timing (~2.5x for slower pacing)
      // Each grandma "notices" the question at different times
      const typingAppearanceDelays: Record<GrandmaId, number> = {
        "abuela-carmen": randomDelay(300, 900),   // Abuela Carmen is quick to engage
        "nana-ruth": randomDelay(600, 1500),      // Nana Ruth is attentive
        "grandma-edith": randomDelay(900, 2100),  // Grandma Edith takes a moment
        "ba-nguyen": randomDelay(1200, 2700),     // Bà Nguyen is more deliberate
        "bibi-amara": randomDelay(1800, 3600),    // Bibi Amara makes an entrance
      };

      // Stagger the typing indicator appearances
      // Use startTransition since these are non-urgent visual updates
      for (const grandmaId of GRANDMA_IDS) {
        setTimeout(() => {
          startTransition(() => {
            setTypingGrandmas((prev) => [
              ...prev,
              { grandmaId, startedAt: Date.now() },
            ]);
          });
        }, typingAppearanceDelays[grandmaId]);
      }

      // Fire parallel requests with personality-based "thinking" delays (~2.5x for slower pacing)
      // Wider variance creates more syncopated message arrival
      const thinkingDelays: Record<GrandmaId, { min: number; max: number }> = {
        "abuela-carmen": { min: 800, max: 2000 },   // Quick thinker, passionate
        "nana-ruth": { min: 1250, max: 3000 },      // Thoughtful, composed
        "grandma-edith": { min: 1000, max: 2500 },  // Steady, reliable
        "ba-nguyen": { min: 1750, max: 3750 },      // Deliberate, wise
        "bibi-amara": { min: 2000, max: 5000 },     // Takes her time, dramatic
      };

      const responsePromises: Promise<{ id: GrandmaId; content: string }>[] =
        GRANDMA_IDS.map(async (grandmaId) => {
          // Add personality-based variance to when each grandma starts
          const delays = thinkingDelays[grandmaId];
          await new Promise((r) => setTimeout(r, randomDelay(delays.min, delays.max)));
          const content = await streamGrandmaResponse(question, grandmaId);
          return { id: grandmaId, content };
        });

      // Wait for all responses
      const results = await Promise.all(responsePromises);

      // Collect responses for debate analysis
      const responses: Record<GrandmaId, string> = {} as Record<
        GrandmaId,
        string
      >;
      for (const result of results) {
        responses[result.id] = result.content;
      }

      // Give user time to read all 5 responses before debates start
      await new Promise((r) => setTimeout(r, randomDelay(1500, 3000)));

      // Check for debates
      const rawDebates = await checkForDebates(question, responses);
      // Filter out any invalid debates from coordinator
      const debates = rawDebates.filter(isValidDebate);

      if (debates.length > 0) {
        setIsDebating(true);
        // Start automatic debate rounds
        await runAutomaticDebates(debates, 0);
      }

      setIsLoading(false);
    },
    [isLoading, streamGrandmaResponse, checkForDebates, runAutomaticDebates]
  );

  /**
   * Continue the debate - runs another round of automatic back-and-forth
   */
  const continueDebate = useCallback(async () => {
    if (debateQueue.length === 0 || isLoading) return;

    setIsLoading(true);

    // Reset round counter for a fresh set of auto-rounds
    setDebateRound(0);

    // Run automatic debates with the queued items
    await runAutomaticDebates(debateQueue, 0);

    setIsLoading(false);
  }, [debateQueue, isLoading, runAutomaticDebates]);

  /**
   * Generate a conversation transcript for the summary
   */
  const generateTranscript = useCallback((msgs: CounselMessage[]): string => {
    return msgs
      .map((msg) => {
        if (msg.type === "user") {
          return `USER: ${msg.content}`;
        }
        if (msg.type === "grandma" && msg.grandmaId) {
          const grandma = GRANDMAS[msg.grandmaId];
          const prefix = msg.replyingTo
            ? `${grandma.name} (replying to ${GRANDMAS[msg.replyingTo].name})`
            : grandma.name;
          return `${prefix}: ${msg.content}`;
        }
        return null;
      })
      .filter(Boolean)
      .join("\n\n");
  }, []);

  /**
   * Generate meeting summary from the conversation
   */
  const generateSummary = useCallback(async (transcript: string): Promise<string> => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [],
          mode: "summary",
          context: { conversationTranscript: transcript },
        }),
      });

      if (!response.ok) return "";

      const reader = response.body?.getReader();
      if (!reader) return "";

      const decoder = new TextDecoder();
      let summary = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        summary += decoder.decode(value, { stream: true });
      }

      return summary;
    } catch (error) {
      console.error("Error generating summary:", error);
      return "";
    }
  }, []);

  /**
   * End the debate and show summary prompt
   */
  const endDebate = useCallback(() => {
    // Cancel any ongoing requests
    abortControllersRef.current.forEach((controller) => controller.abort());
    abortControllersRef.current.clear();

    setDebateQueue([]);
    setIsDebating(false);
    setTypingGrandmas([]);
    setDebatePauseReason("");

    // Add gavel message
    setMessages((prev) => [
      ...prev,
      {
        id: generateId(),
        type: "system",
        content: "🔨 The council has been gaveled to order.",
        timestamp: Date.now(),
      },
    ]);

    // Show prompt asking if user wants a summary
    setShowSummaryPrompt(true);
  }, []);

  /**
   * Generate and add meeting summary (called from prompt)
   */
  const requestMeetingSummary = useCallback(async () => {
    setShowSummaryPrompt(false);
    setIsGeneratingSummary(true);

    const transcript = generateTranscript(messages);
    if (transcript) {
      const summary = await generateSummary(transcript);
      if (summary) {
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            type: "system",
            content: summary,
            timestamp: Date.now(),
          },
        ]);
      }
    }

    setIsGeneratingSummary(false);
  }, [messages, generateTranscript, generateSummary]);

  /**
   * Dismiss the summary prompt without generating
   */
  const dismissSummaryPrompt = useCallback(() => {
    setShowSummaryPrompt(false);
  }, []);

  /**
   * Clear all messages and reset state
   */
  const clearChat = useCallback(() => {
    abortControllersRef.current.forEach((controller) => controller.abort());
    abortControllersRef.current.clear();
    setMessages([]);
    setTypingGrandmas([]);
    setIsDebating(false);
    setDebateQueue([]);
    setDebateRound(0);
    setRecentDebateMessages([]);
    setIsLoading(false);
    setShowSummaryPrompt(false);
    setIsGeneratingSummary(false);
  }, []);

  return {
    messages,
    typingGrandmas,
    isDebating,
    isLoading,
    debateRound,
    roundsBeforeCheckin: ROUNDS_BEFORE_CHECKIN,
    hasQueuedDebates: debateQueue.length > 0,
    debatePauseReason,
    showSummaryPrompt,
    isGeneratingSummary,
    sendQuestion,
    continueDebate,
    endDebate,
    requestMeetingSummary,
    dismissSummaryPrompt,
    clearChat,
  };
}
