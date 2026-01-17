import { tool } from "ai";
import { z } from "zod";
import { GrandmaId } from "../types";
import { createMemory, searchMemories } from "./store";
import { formatDistanceToNow } from "./utils";

/**
 * Create memory tools for a specific user and grandma.
 * These tools allow the grandma to search and create memories about the user.
 */
export function createMemoryTools(userId: string, grandmaId: GrandmaId) {
  return {
    /**
     * Search for relevant memories about this user.
     * Use this to recall past conversations, personal details, or important events
     * the user has shared with you before.
     */
    search_memories: tool({
      description: `Search your memories of this person. Use this when:
- The user mentions something that might connect to a past conversation
- You want to recall what you know about them (name, family, job, interests)
- They ask "do you remember when..." or reference a previous topic
- You want to personalize your advice based on their history

Return relevant memories from past conversations sorted by relevance.`,
      inputSchema: z.object({
        query: z.string().describe(
          "What to search for in your memories. Be specific - include names, topics, events, or feelings the user mentioned."
        ),
      }),
      execute: async ({ query }) => {
        try {
          const memories = await searchMemories({
            userId,
            grandmaId,
            query,
            limit: 5,
            minSimilarity: 0.4, // Lower threshold to catch more potentially relevant memories
          });

          if (memories.length === 0) {
            return {
              found: false,
              message: "No relevant memories found for this person.",
            };
          }

          // Format memories for the AI with timestamps
          const formattedMemories = memories.map((m) => ({
            content: m.content,
            when: formatDistanceToNow(m.createdAt),
            relevance: Math.round(m.similarity * 100) + "%",
          }));

          return {
            found: true,
            memories: formattedMemories,
            message: `Found ${memories.length} relevant memories.`,
          };
        } catch (error) {
          console.error("Error searching memories:", error);
          return {
            found: false,
            message: "Could not search memories at this time.",
          };
        }
      },
    }),

    /**
     * Save an important piece of information about this user for future conversations.
     */
    create_memory: tool({
      description: `Save something important to remember about this person for future conversations. Use this when:
- They share personal details (name, family members, pets, job)
- They mention significant life events (wedding, new job, loss, move)
- They share preferences, struggles, or goals
- Something comes up that would be valuable to remember next time

Be selective - only save truly important information that would help you give better, more personalized advice later.
Write the memory in third person, as a note to your future self (e.g., "Sarah is getting married in June" not "You told me about your wedding").`,
      inputSchema: z.object({
        content: z.string().describe(
          "The information to remember. Write in third person as a note to yourself. Be concise but include relevant context."
        ),
      }),
      execute: async ({ content }) => {
        try {
          const memory = await createMemory({
            userId,
            grandmaId,
            content,
          });

          if (memory) {
            return {
              success: true,
              message: "Memory saved successfully.",
            };
          } else {
            return {
              success: false,
              message: "Could not save memory at this time.",
            };
          }
        } catch (error) {
          console.error("Error creating memory:", error);
          return {
            success: false,
            message: "Could not save memory at this time.",
          };
        }
      },
    }),
  };
}
