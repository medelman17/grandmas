"use client";

import { useState, useCallback, useRef } from "react";
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
 * Each grandma has different "typing speed" characteristics
 * This affects how long their typing indicator shows before message appears
 */
const GRANDMA_RESPONSE_DELAYS: Record<GrandmaId, { min: number; max: number }> = {
  "nana-ruth": { min: 200, max: 600 },      // Nana Ruth is measured and thoughtful
  "abuela-carmen": { min: 100, max: 400 },  // Abuela Carmen is quick and passionate
  "ba-nguyen": { min: 300, max: 800 },      // Bà Nguyen takes her time, considered
  "grandma-edith": { min: 150, max: 500 },  // Grandma Edith has steady rhythm
  "bibi-amara": { min: 400, max: 1000 },    // Bibi Amara is dramatic, takes longest
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
   * Send a question to all grandmas
   */
  const sendQuestion = useCallback(
    async (question: string) => {
      if (!question.trim() || isLoading) return;

      setIsLoading(true);
      setIsDebating(false);
      setDebateQueue([]);

      // Add user message
      const userMessage: CounselMessage = {
        id: generateId(),
        type: "user",
        content: question,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Show staggered typing indicators with personality-based timing
      // Each grandma "notices" the question at different times
      const typingAppearanceDelays: Record<GrandmaId, number> = {
        "abuela-carmen": randomDelay(100, 300),  // Abuela Carmen is quick to engage
        "nana-ruth": randomDelay(200, 500),      // Nana Ruth is attentive
        "grandma-edith": randomDelay(300, 700),  // Grandma Edith takes a moment
        "ba-nguyen": randomDelay(400, 900),      // Bà Nguyen is more deliberate
        "bibi-amara": randomDelay(600, 1200),    // Bibi Amara makes an entrance
      };

      // Stagger the typing indicator appearances
      for (const grandmaId of GRANDMA_IDS) {
        setTimeout(() => {
          setTypingGrandmas((prev) => [
            ...prev,
            { grandmaId, startedAt: Date.now() },
          ]);
        }, typingAppearanceDelays[grandmaId]);
      }

      // Fire parallel requests with personality-based "thinking" delays
      // Wider variance creates more syncopated message arrival
      const thinkingDelays: Record<GrandmaId, { min: number; max: number }> = {
        "abuela-carmen": { min: 300, max: 800 },   // Quick thinker, passionate
        "nana-ruth": { min: 500, max: 1200 },      // Thoughtful, composed
        "grandma-edith": { min: 400, max: 1000 },  // Steady, reliable
        "ba-nguyen": { min: 700, max: 1500 },      // Deliberate, wise
        "bibi-amara": { min: 800, max: 2000 },     // Takes her time, dramatic
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

      // Check for debates
      const debates = await checkForDebates(question, responses);

      if (debates.length > 0) {
        setDebateQueue(debates);
        setIsDebating(true);
      }

      setIsLoading(false);
    },
    [isLoading, streamGrandmaResponse, checkForDebates]
  );

  /**
   * Continue the debate with the next grandma
   */
  const continueDebate = useCallback(async () => {
    if (debateQueue.length === 0 || isLoading) return;

    setIsLoading(true);

    const [nextDebate, ...remainingDebates] = debateQueue;
    setDebateQueue(remainingDebates);

    // Personality-based delay before showing typing indicator
    // (time to "read" the other grandma's message)
    const readingDelays: Record<GrandmaId, { min: number; max: number }> = {
      "abuela-carmen": { min: 200, max: 500 },  // Quick to jump in
      "nana-ruth": { min: 300, max: 700 },      // Reads carefully
      "grandma-edith": { min: 250, max: 600 },  // Steady pace
      "ba-nguyen": { min: 400, max: 900 },      // Considers before responding
      "bibi-amara": { min: 500, max: 1100 },    // Dramatic pause
    };
    const readDelay = readingDelays[nextDebate.responderId];
    await new Promise((r) => setTimeout(r, randomDelay(readDelay.min, readDelay.max)));

    // Show typing indicator for the responder
    setTypingGrandmas([
      {
        grandmaId: nextDebate.responderId,
        replyingTo: nextDebate.targetId,
        startedAt: Date.now(),
      },
    ]);

    // Stream the debate response
    await streamGrandmaResponse(
      nextDebate.reason,
      nextDebate.responderId,
      nextDebate.targetId,
      nextDebate.reason
    );

    // Check if more debates
    if (remainingDebates.length === 0) {
      setIsDebating(false);
    }

    setIsLoading(false);
  }, [debateQueue, isLoading, streamGrandmaResponse]);

  /**
   * End the debate early
   */
  const endDebate = useCallback(() => {
    // Cancel any ongoing requests
    abortControllersRef.current.forEach((controller) => controller.abort());
    abortControllersRef.current.clear();

    setDebateQueue([]);
    setIsDebating(false);
    setTypingGrandmas([]);
    setIsLoading(false);

    // Add system message
    setMessages((prev) => [
      ...prev,
      {
        id: generateId(),
        type: "system",
        content: "🔨 The council has been gaveled to order.",
        timestamp: Date.now(),
      },
    ]);
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
    setIsLoading(false);
  }, []);

  return {
    messages,
    typingGrandmas,
    isDebating,
    isLoading,
    hasQueuedDebates: debateQueue.length > 0,
    sendQuestion,
    continueDebate,
    endDebate,
    clearChat,
  };
}
