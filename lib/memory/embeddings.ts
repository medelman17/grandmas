import { embed } from "ai";

/**
 * Generate an embedding vector for text using OpenAI's text-embedding-3-small model.
 * Uses Vercel AI Gateway (same as chat completions) - no separate OpenAI key needed.
 * Returns a 1536-dimensional vector for semantic similarity search.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: "openai/text-embedding-3-small",
    value: text,
  });

  return embedding;
}

/**
 * Format an embedding array for Postgres pgvector storage
 */
export function formatEmbeddingForPostgres(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
