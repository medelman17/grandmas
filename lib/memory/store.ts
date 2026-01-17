import { neon } from "@neondatabase/serverless";
import { GrandmaId } from "../types";
import {
  Memory,
  MemoryWithScore,
  CreateMemoryInput,
  SearchMemoriesOptions,
} from "./types";
import { generateEmbedding, formatEmbeddingForPostgres } from "./embeddings";

/**
 * Get a SQL client. Returns null if DATABASE_URL is not configured.
 * This allows graceful degradation when the database is unavailable.
 */
function getClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return null;
  }
  return neon(databaseUrl);
}

/**
 * Create a new memory for a user from a specific grandma.
 * Generates an embedding for semantic search.
 */
export async function createMemory(input: CreateMemoryInput): Promise<Memory | null> {
  const sql = getClient();
  if (!sql) {
    console.warn("Memory store: DATABASE_URL not configured, skipping memory creation");
    return null;
  }

  try {
    // Generate embedding for the memory content
    const embedding = await generateEmbedding(input.content);
    const embeddingStr = formatEmbeddingForPostgres(embedding);

    const result = await sql`
      INSERT INTO memories (user_id, grandma_id, content, embedding)
      VALUES (${input.userId}::uuid, ${input.grandmaId}, ${input.content}, ${embeddingStr}::vector)
      RETURNING id, user_id, grandma_id, content, created_at, updated_at
    `;

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      id: row.id,
      userId: row.user_id,
      grandmaId: row.grandma_id as GrandmaId,
      content: row.content,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  } catch (error) {
    console.error("Error creating memory:", error);
    return null;
  }
}

/**
 * Search memories using semantic similarity.
 * Returns memories sorted by relevance to the query.
 */
export async function searchMemories(
  options: SearchMemoriesOptions
): Promise<MemoryWithScore[]> {
  const sql = getClient();
  if (!sql) {
    console.warn("Memory store: DATABASE_URL not configured, returning empty results");
    return [];
  }

  const {
    userId,
    grandmaId,
    query,
    limit = 5,
    minSimilarity = 0.5,
  } = options;

  try {
    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);
    const embeddingStr = formatEmbeddingForPostgres(queryEmbedding);

    // Cosine similarity search using pgvector
    // The <=> operator returns cosine distance, so we convert to similarity: 1 - distance
    const result = await sql`
      SELECT
        id,
        user_id,
        grandma_id,
        content,
        created_at,
        updated_at,
        1 - (embedding <=> ${embeddingStr}::vector) as similarity
      FROM memories
      WHERE user_id = ${userId}::uuid
        AND grandma_id = ${grandmaId}
        AND 1 - (embedding <=> ${embeddingStr}::vector) >= ${minSimilarity}
      ORDER BY embedding <=> ${embeddingStr}::vector
      LIMIT ${limit}
    `;

    return result.map((row) => ({
      id: row.id,
      userId: row.user_id,
      grandmaId: row.grandma_id as GrandmaId,
      content: row.content,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      similarity: parseFloat(row.similarity),
    }));
  } catch (error) {
    console.error("Error searching memories:", error);
    return [];
  }
}

/**
 * Get all memories for a user from a specific grandma.
 * Useful for debugging or memory management UI.
 */
export async function getMemoriesForUser(
  userId: string,
  grandmaId: GrandmaId
): Promise<Memory[]> {
  const sql = getClient();
  if (!sql) {
    return [];
  }

  try {
    const result = await sql`
      SELECT id, user_id, grandma_id, content, created_at, updated_at
      FROM memories
      WHERE user_id = ${userId}::uuid
        AND grandma_id = ${grandmaId}
      ORDER BY created_at DESC
    `;

    return result.map((row) => ({
      id: row.id,
      userId: row.user_id,
      grandmaId: row.grandma_id as GrandmaId,
      content: row.content,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  } catch (error) {
    console.error("Error getting memories:", error);
    return [];
  }
}

/**
 * Delete a specific memory by ID.
 */
export async function deleteMemory(memoryId: string): Promise<boolean> {
  const sql = getClient();
  if (!sql) {
    return false;
  }

  try {
    await sql`DELETE FROM memories WHERE id = ${memoryId}::uuid`;
    return true;
  } catch (error) {
    console.error("Error deleting memory:", error);
    return false;
  }
}

/**
 * Check if the memory store is available (database is configured)
 */
export function isMemoryStoreAvailable(): boolean {
  return !!process.env.DATABASE_URL;
}
