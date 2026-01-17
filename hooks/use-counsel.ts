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

      // Add initial message (streaming state)
      setMessages((prev) => [
        ...prev,
        {
          id: messageId,
          type: "grandma",
          content: "",
          grandmaId,
          replyingTo,
          timestamp: Date.now(),
          isStreaming: true,
        },
      ]);

      // Remove from typing
      setTypingGrandmas((prev) =>
        prev.filter((t) => t.grandmaId !== grandmaId)
      );

      let fullContent = "";

      try {
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

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader available");

        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });

          if (text) {
            fullContent += text;
            // Update message content
            setMessages((prev) =>
              prev.map((m) =>
                m.id === messageId ? { ...m, content: fullContent } : m
              )
            );
          }
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          // Request was cancelled
          return fullContent;
        }
        console.error(`Error streaming ${grandmaId}:`, error);
        fullContent = `*${GRANDMAS[grandmaId].name} is having technical difficulties*`;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, content: fullContent } : m
          )
        );
      } finally {
        // Mark as done streaming
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, isStreaming: false } : m
          )
        );
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

      // Show staggered typing indicators
      const typingDelays: number[] = GRANDMA_IDS.map(() =>
        randomDelay(150, 350)
      );

      for (let i = 0; i < GRANDMA_IDS.length; i++) {
        setTimeout(() => {
          setTypingGrandmas((prev) => [
            ...prev,
            { grandmaId: GRANDMA_IDS[i], startedAt: Date.now() },
          ]);
        }, typingDelays.slice(0, i + 1).reduce((a, b) => a + b, 0));
      }

      // Fire parallel requests with varied start delays
      const responsePromises: Promise<{ id: GrandmaId; content: string }>[] =
        GRANDMA_IDS.map(async (grandmaId) => {
          // Add variance to when each grandma "starts typing"
          await new Promise((r) => setTimeout(r, randomDelay(400, 1200)));
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

    // Show typing indicator for the responder
    setTypingGrandmas([
      {
        grandmaId: nextDebate.responderId,
        replyingTo: nextDebate.targetId,
        startedAt: Date.now(),
      },
    ]);

    // Small delay for natural feel
    await new Promise((r) => setTimeout(r, randomDelay(500, 1000)));

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
