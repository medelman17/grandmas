import { GrandmaId } from "../types";

/**
 * A memory stored by a grandma about a user
 */
export interface Memory {
  id: string;
  userId: string;
  grandmaId: GrandmaId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Memory with similarity score from vector search
 */
export interface MemoryWithScore extends Memory {
  similarity: number;
}

/**
 * Input for creating a new memory
 */
export interface CreateMemoryInput {
  userId: string;
  grandmaId: GrandmaId;
  content: string;
}

/**
 * Options for searching memories
 */
export interface SearchMemoriesOptions {
  userId: string;
  grandmaId: GrandmaId;
  query: string;
  limit?: number;
  minSimilarity?: number;
}
