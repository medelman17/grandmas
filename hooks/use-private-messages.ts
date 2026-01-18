"use client";

import { useState, useCallback, useRef } from "react";
import {
  GrandmaId,
  PrivateMessage,
  PrivateConversation,
  MemoryActivity,
  CounselMessage,
  AllianceTrigger,
} from "@/lib/types";
import { GRANDMAS, GRANDMA_IDS } from "@/lib/grandmas";

/**
 * Generate a unique ID for messages
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Parse events from Vercel AI SDK's data stream format.
 */
interface DataStreamEvent {
  type: "text-delta" | "tool-call" | "tool-result" | "unknown";
  data: unknown;
}

function parseDataStreamChunk(chunk: string): DataStreamEvent[] {
  const events: DataStreamEvent[] = [];
  const lines = chunk.split("\n").filter((line) => line.trim());

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const typeCode = line.slice(0, colonIndex);
    const jsonPart = line.slice(colonIndex + 1);

    try {
      const data = JSON.parse(jsonPart);
      switch (typeCode) {
        case "0":
          events.push({ type: "text-delta", data: data });
          break;
        case "9":
          events.push({ type: "tool-call", data });
          break;
        case "a":
          events.push({ type: "tool-result", data });
          break;
        default:
          break;
      }
    } catch {
      // Not valid JSON - might be partial chunk, skip
    }
  }

  return events;
}

/**
 * Random delay within a range
 */
function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a transcript from group chat messages for context
 */
function generateGroupChatTranscript(messages: CounselMessage[]): string {
  // Get last 15 messages for good context
  const recentMsgs = messages.slice(-15);
  return recentMsgs
    .map((msg) => {
      if (msg.type === "user") {
        return `User: ${msg.content}`;
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
}

/**
 * Response delays for each grandma in private chat (slightly faster than group)
 */
const PRIVATE_RESPONSE_DELAYS: Record<GrandmaId, { min: number; max: number }> = {
  "nana-ruth": { min: 400, max: 1200 },
  "abuela-carmen": { min: 250, max: 800 },
  "ba-nguyen": { min: 600, max: 1600 },
  "grandma-edith": { min: 350, max: 1000 },
  "bibi-amara": { min: 800, max: 2000 },
};

/**
 * Initialize empty conversations for all grandmas
 */
function initializeConversations(): Record<GrandmaId, PrivateConversation> {
  const conversations: Partial<Record<GrandmaId, PrivateConversation>> = {};
  for (const id of GRANDMA_IDS) {
    conversations[id] = {
      grandmaId: id,
      messages: [],
      unreadCount: 0,
      isTyping: false,
      lastActivity: 0,
    };
  }
  return conversations as Record<GrandmaId, PrivateConversation>;
}

/**
 * Options for the usePrivateMessages hook
 */
interface UsePrivateMessagesOptions {
  userId?: string | null;
  /** Group chat messages for context - grandmas will know what was discussed */
  groupMessages?: CounselMessage[];
}

/**
 * Hook for managing private conversations with individual grandmas
 */
export function usePrivateMessages(options: UsePrivateMessagesOptions = {}) {
  const { userId, groupMessages = [] } = options;
  const [conversations, setConversations] = useState<Record<GrandmaId, PrivateConversation>>(
    initializeConversations
  );
  const [activeGrandma, setActiveGrandma] = useState<GrandmaId | null>(null);
  const [memoryActivities, setMemoryActivities] = useState<MemoryActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Track active streaming controllers for cleanup
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // Keep group messages in a ref to avoid stale closures in callbacks
  const groupMessagesRef = useRef<CounselMessage[]>(groupMessages);
  groupMessagesRef.current = groupMessages;

  /**
   * Get total unread count across all grandmas
   */
  const totalUnreadCount = Object.values(conversations).reduce(
    (sum, conv) => sum + conv.unreadCount,
    0
  );

  /**
   * Get unread counts per grandma
   */
  const unreadCounts: Record<GrandmaId, number> = GRANDMA_IDS.reduce(
    (acc, id) => ({ ...acc, [id]: conversations[id].unreadCount }),
    {} as Record<GrandmaId, number>
  );

  /**
   * Open a private chat with a grandma (clears unread for that grandma)
   */
  const openPrivateChat = useCallback((grandmaId: GrandmaId) => {
    setActiveGrandma(grandmaId);
    setConversations((prev) => ({
      ...prev,
      [grandmaId]: {
        ...prev[grandmaId],
        unreadCount: 0,
      },
    }));
  }, []);

  /**
   * Close the active private chat
   */
  const closePrivateChat = useCallback(() => {
    setActiveGrandma(null);
  }, []);

  /**
   * Stream a private message response from a grandma
   */
  const streamPrivateResponse = useCallback(
    async (
      grandmaId: GrandmaId,
      userMessage: string,
      conversationHistory: PrivateMessage[],
      proactiveContext?: { groupDiscussion: string; triggerReason: string },
      allianceContext?: {
        aboutGrandma: GrandmaId;
        triggerType: string;
        context: string;
        debateSnippet?: string;
      }
    ): Promise<string> => {
      const controller = new AbortController();
      const messageId = generateId();
      abortControllersRef.current.set(messageId, controller);

      let fullContent = "";

      // Mark grandma as typing
      setConversations((prev) => ({
        ...prev,
        [grandmaId]: {
          ...prev[grandmaId],
          isTyping: true,
        },
      }));

      try {
        // Build message history for API
        const apiMessages = conversationHistory.map((msg) => ({
          role: msg.role === "user" ? "user" as const : "assistant" as const,
          content: msg.content,
        }));

        // Add current message if not proactive
        if (userMessage) {
          apiMessages.push({ role: "user" as const, content: userMessage });
        }

        // Generate group chat context for user-initiated messages (not proactive)
        // This gives the grandma knowledge of what was discussed in the group
        const groupChatContext = !proactiveContext && groupMessagesRef.current.length > 0
          ? generateGroupChatTranscript(groupMessagesRef.current)
          : undefined;

        const response = await fetch("/api/private-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            messages: apiMessages,
            grandmaId,
            userId: userId || undefined,
            proactiveContext,
            groupChatContext,
            allianceContext,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Private ${grandmaId}] Error response:`, errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No reader available");
        }

        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          if (!chunk) continue;

          const events = parseDataStreamChunk(chunk);

          for (const event of events) {
            if (event.type === "text-delta") {
              fullContent += event.data as string;
            } else if (event.type === "tool-call") {
              const toolCall = event.data as { toolCallId: string; toolName: string };
              if (toolCall.toolName === "search_memories") {
                setMemoryActivities((prev) => [
                  ...prev,
                  {
                    grandmaId,
                    type: "searching",
                    toolCallId: toolCall.toolCallId,
                    startedAt: Date.now(),
                  },
                ]);
              } else if (toolCall.toolName === "create_memory") {
                setMemoryActivities((prev) => [
                  ...prev,
                  {
                    grandmaId,
                    type: "saving",
                    toolCallId: toolCall.toolCallId,
                    startedAt: Date.now(),
                  },
                ]);
              }
            } else if (event.type === "tool-result") {
              const toolResult = event.data as { toolCallId: string };
              setMemoryActivities((prev) =>
                prev.filter((a) => a.toolCallId !== toolResult.toolCallId)
              );
            }
          }
        }

        // Add personality-based delay before showing message
        const delays = PRIVATE_RESPONSE_DELAYS[grandmaId];
        const postDelay = randomDelay(delays.min, delays.max);
        await new Promise((r) => setTimeout(r, postDelay));

        // Add the complete message
        const newMessage: PrivateMessage = {
          id: messageId,
          grandmaId,
          role: "grandma",
          content: fullContent,
          timestamp: Date.now(),
          isProactive: !!proactiveContext,
          isAlliance: !!allianceContext,
        };

        setConversations((prev) => ({
          ...prev,
          [grandmaId]: {
            ...prev[grandmaId],
            messages: [...prev[grandmaId].messages, newMessage],
            isTyping: false,
            lastActivity: Date.now(),
            // Increment unread if this chat isn't currently open
            unreadCount:
              grandmaId !== activeGrandma
                ? prev[grandmaId].unreadCount + 1
                : prev[grandmaId].unreadCount,
          },
        }));
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          setConversations((prev) => ({
            ...prev,
            [grandmaId]: {
              ...prev[grandmaId],
              isTyping: false,
            },
          }));
          setMemoryActivities((prev) =>
            prev.filter((a) => a.grandmaId !== grandmaId)
          );
          return fullContent;
        }
        console.error(`Error streaming private message from ${grandmaId}:`, error);
        fullContent = `*${GRANDMAS[grandmaId].name} is having technical difficulties*`;

        setConversations((prev) => ({
          ...prev,
          [grandmaId]: {
            ...prev[grandmaId],
            messages: [
              ...prev[grandmaId].messages,
              {
                id: messageId,
                grandmaId,
                role: "grandma",
                content: fullContent,
                timestamp: Date.now(),
              },
            ],
            isTyping: false,
            lastActivity: Date.now(),
          },
        }));
        setMemoryActivities((prev) =>
          prev.filter((a) => a.grandmaId !== grandmaId)
        );
      } finally {
        abortControllersRef.current.delete(messageId);
      }

      return fullContent;
    },
    [userId, activeGrandma]
  );

  /**
   * Send a private message to the active grandma
   */
  const sendPrivateMessage = useCallback(
    async (message: string) => {
      if (!activeGrandma || !message.trim() || isLoading) return;

      setIsLoading(true);

      // Add user message
      const userMessage: PrivateMessage = {
        id: generateId(),
        grandmaId: activeGrandma,
        role: "user",
        content: message,
        timestamp: Date.now(),
      };

      setConversations((prev) => ({
        ...prev,
        [activeGrandma]: {
          ...prev[activeGrandma],
          messages: [...prev[activeGrandma].messages, userMessage],
          lastActivity: Date.now(),
        },
      }));

      // Get conversation history for context
      const history = conversations[activeGrandma].messages;

      // Stream grandma's response
      await streamPrivateResponse(activeGrandma, message, history);

      setIsLoading(false);
    },
    [activeGrandma, isLoading, conversations, streamPrivateResponse]
  );

  /**
   * Trigger a proactive private message from a grandma
   * (called when grandma wants to reach out based on group discussion)
   */
  const triggerProactiveMessage = useCallback(
    async (
      grandmaId: GrandmaId,
      groupDiscussion: string,
      triggerReason: string
    ) => {
      const history = conversations[grandmaId].messages;

      await streamPrivateResponse(grandmaId, "", history, {
        groupDiscussion,
        triggerReason,
      });
    },
    [conversations, streamPrivateResponse]
  );

  /**
   * Trigger an alliance gossip message from a grandma
   * (called when grandma wants to share gossip about another grandma)
   */
  const triggerAllianceMessage = useCallback(
    async (trigger: AllianceTrigger) => {
      const history = conversations[trigger.fromGrandma].messages;

      await streamPrivateResponse(
        trigger.fromGrandma,
        "",
        history,
        undefined, // no proactive context
        {
          aboutGrandma: trigger.aboutGrandma,
          triggerType: trigger.triggerType,
          context: trigger.context,
          debateSnippet: trigger.debateSnippet,
        }
      );
    },
    [conversations, streamPrivateResponse]
  );

  /**
   * Clear conversation with a specific grandma
   */
  const clearConversation = useCallback((grandmaId: GrandmaId) => {
    setConversations((prev) => ({
      ...prev,
      [grandmaId]: {
        ...prev[grandmaId],
        messages: [],
        unreadCount: 0,
        lastActivity: 0,
      },
    }));
  }, []);

  /**
   * Clear all private conversations
   */
  const clearAllConversations = useCallback(() => {
    setConversations(initializeConversations());
    setMemoryActivities([]);
  }, []);

  return {
    conversations,
    activeGrandma,
    memoryActivities,
    isLoading,
    totalUnreadCount,
    unreadCounts,
    openPrivateChat,
    closePrivateChat,
    sendPrivateMessage,
    triggerProactiveMessage,
    triggerAllianceMessage,
    clearConversation,
    clearAllConversations,
  };
}
