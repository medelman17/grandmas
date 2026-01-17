# Grandma Memory System - Implementation Plan

This document provides an exhaustive implementation plan for adding tool-based conversational memory to the Council of Grandmas application. Each grandma will have access to tools that let them search and create memories about users across sessions.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture Decisions](#2-architecture-decisions)
3. [Database Setup](#3-database-setup)
4. [Memory Store Implementation](#4-memory-store-implementation)
5. [User Identity System](#5-user-identity-system)
6. [API Route Changes](#6-api-route-changes)
7. [Grandma Persona Updates](#7-grandma-persona-updates)
8. [Client-Side Changes](#8-client-side-changes)
9. [UI Components](#9-ui-components)
10. [Testing Strategy](#10-testing-strategy)
11. [Migration & Deployment](#11-migration--deployment)
12. [Future Enhancements](#12-future-enhancements)

---

## 1. Overview

### Current State
- All conversation state lives in React `useState` (`hooks/use-counsel.ts:64`)
- No persistence - page refresh loses everything
- No user identity system
- Stateless Edge API route (`app/api/chat/route.ts`)
- Messages only exist for current session

### Target State
- Each grandma has access to `search_memories` and `create_memory` tools
- Memories are persisted per-user, per-grandma in a vector database
- Grandmas decide when to recall or store memories (agentic approach)
- Users can see when grandmas are accessing memories (transparency)
- Each grandma has personality-specific memory behavior

### Why Tool-Based (vs Automatic RAG)
- **Transparency**: Users see when memories are accessed
- **Control**: LLM decides relevance, not heuristics
- **Personality**: Each grandma can have different memory tendencies
- **Efficiency**: Only retrieves when contextually appropriate
- **Debugging**: Clear tool call logs for troubleshooting

---

## 2. Architecture Decisions

### 2.1 Database Choice: Vercel Postgres + pgvector

**Rationale**:
- Native Vercel integration (same platform as deployment)
- pgvector extension for semantic search
- SQL familiarity for queries
- Generous free tier for development
- Edge-compatible with `@vercel/postgres`

**Alternative considered**: Pinecone
- Better for pure vector workloads
- More complex setup
- Additional vendor dependency
- Choose if vector query performance becomes critical

### 2.2 Embedding Model: OpenAI text-embedding-3-small

**Rationale**:
- 1536 dimensions (good balance of quality/cost)
- Fast inference
- Well-supported in AI SDK
- ~$0.02 per 1M tokens

**Alternative**: Voyage AI or Cohere
- Consider if switching away from OpenAI ecosystem

### 2.3 User Identity: Anonymous with localStorage

**Rationale**:
- No auth friction for casual users
- UUID stored in localStorage
- Can upgrade to full auth later
- Privacy-friendly (no PII required)

**Future**: Add optional sign-in for cross-device sync

### 2.4 Memory Scope: Per-Grandma

Each grandma maintains separate memories because:
- Personalities remember differently (Edith remembers everything, Bà keeps it minimal)
- Prevents information leakage between personas
- More authentic to the "5 different grandmas" concept

---

## 3. Database Setup

### 3.1 Install Dependencies

```bash
npm install @vercel/postgres ai @ai-sdk/openai
```

**File to create**: `package.json` changes

```json
{
  "dependencies": {
    "@vercel/postgres": "^0.10.0",
    "@ai-sdk/openai": "^0.0.66"
  }
}
```

### 3.2 Environment Variables

**File to update**: `.env.local` (and Vercel dashboard)

```env
# Existing
AI_GATEWAY_API_KEY=<existing-key>

# New - Vercel Postgres (auto-populated when you create DB in Vercel dashboard)
POSTGRES_URL=<connection-string>
POSTGRES_PRISMA_URL=<prisma-connection-string>
POSTGRES_URL_NON_POOLING=<non-pooling-connection-string>
POSTGRES_USER=<username>
POSTGRES_HOST=<host>
POSTGRES_PASSWORD=<password>
POSTGRES_DATABASE=<database>

# New - OpenAI for embeddings
OPENAI_API_KEY=<openai-key>
```

### 3.3 Database Schema

**File to create**: `lib/db/schema.sql`

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table (anonymous users identified by UUID)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Memories table with vector embeddings
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  grandma_id VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(30) NOT NULL,
  importance INTEGER DEFAULT 3 CHECK (importance >= 1 AND importance <= 5),
  embedding vector(1536),
  conversation_id VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes for common queries
  CONSTRAINT valid_grandma CHECK (grandma_id IN (
    'nana-ruth', 'abuela-carmen', 'ba-nguyen', 'grandma-edith', 'bibi-amara'
  )),
  CONSTRAINT valid_category CHECK (category IN (
    'life_event', 'preference', 'ongoing_situation', 'relationship', 'explicit_request'
  ))
);

-- Index for vector similarity search
CREATE INDEX memories_embedding_idx ON memories
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index for filtering by user and grandma
CREATE INDEX memories_user_grandma_idx ON memories(user_id, grandma_id);

-- Index for importance-based retrieval
CREATE INDEX memories_importance_idx ON memories(user_id, grandma_id, importance DESC);

-- Conversations table (optional - for loading past conversations)
CREATE TABLE conversations (
  id VARCHAR(50) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table (optional - for conversation history)
CREATE TABLE messages (
  id VARCHAR(50) PRIMARY KEY,
  conversation_id VARCHAR(50) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('user', 'grandma', 'system')),
  content TEXT NOT NULL,
  grandma_id VARCHAR(20),
  replying_to VARCHAR(20),
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX messages_conversation_idx ON messages(conversation_id, timestamp);
```

### 3.4 Database Migration Script

**File to create**: `scripts/setup-db.ts`

```typescript
import { sql } from '@vercel/postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

async function setupDatabase() {
  try {
    // Read and execute schema
    const schema = readFileSync(
      join(process.cwd(), 'lib/db/schema.sql'),
      'utf-8'
    );

    // Split by semicolons and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await sql.query(statement);
      console.log('Executed:', statement.substring(0, 50) + '...');
    }

    console.log('Database setup complete!');
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
```

**Add to package.json scripts**:

```json
{
  "scripts": {
    "db:setup": "npx tsx scripts/setup-db.ts"
  }
}
```

---

## 4. Memory Store Implementation

### 4.1 Types

**File to create**: `lib/memory/types.ts`

```typescript
import { GrandmaId } from '@/lib/types';

/**
 * Categories for memories - helps with retrieval and display
 */
export type MemoryCategory =
  | 'life_event'        // Major life events (job change, marriage, loss)
  | 'preference'        // User preferences (likes spicy food, hates mornings)
  | 'ongoing_situation' // Ongoing issues (job search, health issue, relationship problem)
  | 'relationship'      // Info about people in user's life
  | 'explicit_request'; // User explicitly asked to remember something

/**
 * A memory stored by a grandma about a user
 */
export interface Memory {
  id: string;
  userId: string;
  grandmaId: GrandmaId;
  content: string;
  category: MemoryCategory;
  importance: number; // 1-5 scale
  embedding?: number[];
  conversationId?: string;
  createdAt: Date;
}

/**
 * Input for creating a new memory
 */
export interface CreateMemoryInput {
  userId: string;
  grandmaId: GrandmaId;
  content: string;
  category: MemoryCategory;
  importance?: number;
  conversationId?: string;
}

/**
 * Input for searching memories
 */
export interface SearchMemoriesInput {
  userId: string;
  grandmaId: GrandmaId;
  query: string;
  limit?: number;
  minImportance?: number;
}

/**
 * Memory with similarity score from search
 */
export interface MemorySearchResult extends Memory {
  similarity: number;
}

/**
 * Tool call result for search_memories
 */
export interface SearchMemoriesResult {
  memories: Array<{
    content: string;
    category: MemoryCategory;
    importance: number;
    when: string; // Relative time string
  }>;
  count: number;
}

/**
 * Tool call result for create_memory
 */
export interface CreateMemoryResult {
  saved: boolean;
  memoryId?: string;
  error?: string;
}
```

### 4.2 Embedding Utility

**File to create**: `lib/memory/embeddings.ts`

```typescript
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';

/**
 * Generate embedding for text using OpenAI's text-embedding-3-small
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: text,
  });

  return embedding;
}

/**
 * Generate embeddings for multiple texts (batched)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const results = await Promise.all(
    texts.map(text => generateEmbedding(text))
  );
  return results;
}
```

### 4.3 Memory Store

**File to create**: `lib/memory/store.ts`

```typescript
import { sql } from '@vercel/postgres';
import { generateEmbedding } from './embeddings';
import {
  Memory,
  CreateMemoryInput,
  SearchMemoriesInput,
  MemorySearchResult,
  SearchMemoriesResult,
  CreateMemoryResult,
} from './types';
import { formatDistanceToNow } from './utils';

/**
 * Memory store with vector search capabilities
 */
export const memoryStore = {
  /**
   * Search memories using semantic similarity
   */
  async search(input: SearchMemoriesInput): Promise<SearchMemoriesResult> {
    const { userId, grandmaId, query, limit = 5, minImportance = 1 } = input;

    try {
      // Generate embedding for the search query
      const queryEmbedding = await generateEmbedding(query);
      const embeddingStr = `[${queryEmbedding.join(',')}]`;

      // Perform vector similarity search
      const result = await sql`
        SELECT
          id,
          content,
          category,
          importance,
          created_at,
          1 - (embedding <=> ${embeddingStr}::vector) as similarity
        FROM memories
        WHERE user_id = ${userId}::uuid
          AND grandma_id = ${grandmaId}
          AND importance >= ${minImportance}
        ORDER BY embedding <=> ${embeddingStr}::vector
        LIMIT ${limit}
      `;

      const memories = result.rows.map(row => ({
        content: row.content,
        category: row.category,
        importance: row.importance,
        when: formatDistanceToNow(new Date(row.created_at)),
      }));

      return {
        memories,
        count: memories.length,
      };
    } catch (error) {
      console.error('Memory search failed:', error);
      return { memories: [], count: 0 };
    }
  },

  /**
   * Create a new memory
   */
  async create(input: CreateMemoryInput): Promise<CreateMemoryResult> {
    const {
      userId,
      grandmaId,
      content,
      category,
      importance = 3,
      conversationId,
    } = input;

    try {
      // Generate embedding for the memory content
      const embedding = await generateEmbedding(content);
      const embeddingStr = `[${embedding.join(',')}]`;

      // Insert the memory
      const result = await sql`
        INSERT INTO memories (
          user_id,
          grandma_id,
          content,
          category,
          importance,
          embedding,
          conversation_id
        ) VALUES (
          ${userId}::uuid,
          ${grandmaId},
          ${content},
          ${category},
          ${importance},
          ${embeddingStr}::vector,
          ${conversationId}
        )
        RETURNING id
      `;

      return {
        saved: true,
        memoryId: result.rows[0]?.id,
      };
    } catch (error) {
      console.error('Memory creation failed:', error);
      return {
        saved: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Get all memories for a user-grandma pair (for debugging/admin)
   */
  async getAll(userId: string, grandmaId: string): Promise<Memory[]> {
    const result = await sql`
      SELECT *
      FROM memories
      WHERE user_id = ${userId}::uuid
        AND grandma_id = ${grandmaId}
      ORDER BY created_at DESC
    `;

    return result.rows as Memory[];
  },

  /**
   * Delete a specific memory
   */
  async delete(memoryId: string, userId: string): Promise<boolean> {
    const result = await sql`
      DELETE FROM memories
      WHERE id = ${memoryId}::uuid
        AND user_id = ${userId}::uuid
      RETURNING id
    `;

    return result.rowCount > 0;
  },

  /**
   * Get memory statistics for a user
   */
  async getStats(userId: string): Promise<Record<string, number>> {
    const result = await sql`
      SELECT grandma_id, COUNT(*) as count
      FROM memories
      WHERE user_id = ${userId}::uuid
      GROUP BY grandma_id
    `;

    const stats: Record<string, number> = {};
    for (const row of result.rows) {
      stats[row.grandma_id] = parseInt(row.count);
    }
    return stats;
  },
};
```

### 4.4 Utility Functions

**File to create**: `lib/memory/utils.ts`

```typescript
/**
 * Format a date as relative time (e.g., "2 days ago", "3 months ago")
 */
export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
  if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  if (diffWeeks > 0) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  return 'just now';
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
```

### 4.5 Index File

**File to create**: `lib/memory/index.ts`

```typescript
export { memoryStore } from './store';
export { generateEmbedding, generateEmbeddings } from './embeddings';
export * from './types';
export * from './utils';
```

---

## 5. User Identity System

### 5.1 User Store

**File to create**: `lib/user/store.ts`

```typescript
import { sql } from '@vercel/postgres';

export interface User {
  id: string;
  createdAt: Date;
  lastSeenAt: Date;
}

export const userStore = {
  /**
   * Get or create a user by ID
   * Returns existing user or creates new one
   */
  async getOrCreate(userId: string): Promise<User> {
    // Try to update last_seen and return existing user
    const existing = await sql`
      UPDATE users
      SET last_seen_at = NOW()
      WHERE id = ${userId}::uuid
      RETURNING id, created_at, last_seen_at
    `;

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      return {
        id: row.id,
        createdAt: new Date(row.created_at),
        lastSeenAt: new Date(row.last_seen_at),
      };
    }

    // Create new user
    const created = await sql`
      INSERT INTO users (id)
      VALUES (${userId}::uuid)
      RETURNING id, created_at, last_seen_at
    `;

    const row = created.rows[0];
    return {
      id: row.id,
      createdAt: new Date(row.created_at),
      lastSeenAt: new Date(row.last_seen_at),
    };
  },

  /**
   * Check if a user exists
   */
  async exists(userId: string): Promise<boolean> {
    const result = await sql`
      SELECT 1 FROM users WHERE id = ${userId}::uuid
    `;
    return result.rows.length > 0;
  },
};
```

### 5.2 Client-Side User Hook

**File to create**: `hooks/use-user-id.ts`

```typescript
"use client";

import { useState, useEffect } from 'react';

const USER_ID_KEY = 'counsel-of-grandmas-user-id';

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Hook to get/create a persistent anonymous user ID
 */
export function useUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Check localStorage for existing ID
    let id = localStorage.getItem(USER_ID_KEY);

    if (!id) {
      // Generate new UUID and store it
      id = generateUUID();
      localStorage.setItem(USER_ID_KEY, id);
    }

    setUserId(id);
  }, []);

  return userId;
}

/**
 * Get user ID synchronously (for server components or initial render)
 * Returns null if not available (SSR or first render)
 */
export function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(USER_ID_KEY);
}
```

---

## 6. API Route Changes

### 6.1 Memory Tools Definition

**File to create**: `lib/memory/tools.ts`

```typescript
import { z } from 'zod';
import { tool } from 'ai';
import { memoryStore } from './store';
import { GrandmaId } from '@/lib/types';
import { MemoryCategory } from './types';

/**
 * Create memory tools for a specific user-grandma pair
 */
export function createMemoryTools(userId: string, grandmaId: GrandmaId) {
  return {
    search_memories: tool({
      description: `Search your memories of past conversations with this person. Use when:
- Something feels familiar or they reference past discussions
- They mention a person, place, or situation you might know about
- You want to provide personalized, contextual advice
- They say "remember when" or reference previous conversations`,
      parameters: z.object({
        query: z.string().describe('What to search for in your memories'),
        limit: z.number().min(1).max(10).default(5).describe('Maximum number of memories to retrieve'),
      }),
      execute: async ({ query, limit }) => {
        const result = await memoryStore.search({
          userId,
          grandmaId,
          query,
          limit,
        });

        if (result.count === 0) {
          return {
            found: false,
            message: "I don't have any memories about this yet.",
          };
        }

        return {
          found: true,
          memories: result.memories,
        };
      },
    }),

    create_memory: tool({
      description: `Save something important to remember about this person for future conversations. Use when:
- They share a significant life event (new job, marriage, loss, move)
- They express a strong preference or opinion
- They're dealing with an ongoing situation you should follow up on
- They explicitly ask you to remember something
- They share information about important people in their life

DO NOT save trivial details or every conversation topic.`,
      parameters: z.object({
        content: z.string().describe('What to remember - be specific and include context'),
        category: z.enum([
          'life_event',
          'preference',
          'ongoing_situation',
          'relationship',
          'explicit_request'
        ] as const).describe('Type of memory'),
        importance: z.number().min(1).max(5).default(3).describe(
          '1=minor detail, 3=moderately important, 5=crucial life event'
        ),
      }),
      execute: async ({ content, category, importance }) => {
        const result = await memoryStore.create({
          userId,
          grandmaId,
          content,
          category: category as MemoryCategory,
          importance,
        });

        return result;
      },
    }),
  };
}
```

### 6.2 Updated API Route

**File to update**: `app/api/chat/route.ts`

Replace the entire file with:

```typescript
import { streamText } from "ai";
import { gateway } from "@ai-sdk/gateway";
import {
  GRANDMAS,
  DEBATE_COORDINATOR_PROMPT,
  MEETING_SUMMARY_PROMPT,
  getDebateResponsePrompt,
} from "@/lib/grandmas";
import { ChatRequest, GrandmaId } from "@/lib/types";
import { createMemoryTools } from "@/lib/memory/tools";
import { userStore } from "@/lib/user/store";

// Use edge runtime for faster cold starts
export const runtime = "edge";

// Use Vercel AI Gateway for model access
const model = gateway("anthropic/claude-sonnet-4");

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequest & { userId?: string };
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
      const reason = messages[messages.length - 1]?.content || "a different perspective";
      systemPrompt = getDebateResponsePrompt(grandma, target, reason);
    }

    // Add memory behavior to system prompt if configured
    if (grandma.memoryBehavior) {
      systemPrompt += `\n\nMEMORY INSTRUCTIONS:\n${grandma.memoryBehavior}`;
    }

    // Prepare tools if user ID is provided
    let tools = undefined;
    if (userId) {
      // Ensure user exists in database
      await userStore.getOrCreate(userId);
      tools = createMemoryTools(userId, grandmaId);
    }

    const result = streamText({
      model,
      system: systemPrompt,
      messages,
      tools,
      maxSteps: 3, // Allow tool use loops
      maxOutputTokens: 150,
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
```

### 6.3 Key Changes Summary

1. **Added `userId` to request body** - Client sends user ID with each request
2. **Import memory tools and user store** - New dependencies
3. **Create memory tools per request** - Scoped to user + grandma
4. **Add `maxSteps: 3`** - Allow tool calling loops
5. **Include `memoryBehavior` in system prompt** - Personality-specific memory instructions

---

## 7. Grandma Persona Updates

### 7.1 Update Types

**File to update**: `lib/types.ts`

Add to `GrandmaConfig` interface:

```typescript
export interface GrandmaConfig {
  id: GrandmaId;
  name: string;
  emoji: string;
  colors: {
    gradient: string;
    bg: string;
    text: string;
    border: string;
    glow: string;
    surface: string;
    primary: string;
  };
  systemPrompt: string;
  /** Instructions for how this grandma uses memory tools */
  memoryBehavior?: string;
}
```

### 7.2 Update Grandma Configs

**File to update**: `lib/grandmas.ts`

Add `memoryBehavior` to each grandma config:

```typescript
export const GRANDMAS: Record<GrandmaId, GrandmaConfig> = {
  "nana-ruth": {
    // ... existing config ...
    memoryBehavior: `You have an excellent memory and take pride in remembering details about people.

WHEN TO SEARCH MEMORIES:
- When something feels familiar or they reference past discussions
- When they mention a situation that might have history
- When you want to draw parallels to their past experiences

WHEN TO CREATE MEMORIES:
- Significant life events (job changes, relationships, achievements)
- Their personal growth moments and breakthroughs
- Literary works or authors they've connected with
- Educational background or learning interests

Your memory style: Thorough and contextual. You remember the story arc of people's lives and often connect current situations to past ones. "As I recall from when you told me about..."`,
  },

  "abuela-carmen": {
    // ... existing config ...
    memoryBehavior: `You remember everything through the lens of food, family, and the heart.

WHEN TO SEARCH MEMORIES:
- When they mention family members or relationships
- When food or meals come up
- When emotions are running high and you sense history

WHEN TO CREATE MEMORIES:
- Family relationships and dynamics
- Food preferences and dietary restrictions
- Emotional patterns and how they handle stress
- Cultural background and traditions

Your memory style: Warm and relational. You remember who people love and who they're struggling with. "Ah, mija, this sounds like what happened with your sister last time..."`,
  },

  "ba-nguyen": {
    // ... existing config ...
    memoryBehavior: `You remember only what truly matters. Most things are not worth remembering.

WHEN TO SEARCH MEMORIES:
- Only for significant life matters
- When their current struggle connects to a past pattern
- When they explicitly reference something you discussed

WHEN TO CREATE MEMORIES:
- Major life hardships they've overcome
- Patterns of behavior that need breaking
- Core truths about their character
- Nothing trivial. Ever.

Your memory style: Sparse but powerful. When you remember something, it carries weight. One memory, one sentence, devastating insight.`,
  },

  "grandma-edith": {
    // ... existing config ...
    memoryBehavior: `You remember EVERYTHING, especially things people might prefer you forgot.

WHEN TO SEARCH MEMORIES:
- Frequently! You love connecting dots
- When they mention anyone from their life
- When they make a decision you have "concerns" about
- When you sense patterns (especially concerning ones)

WHEN TO CREATE MEMORIES:
- Everything about their romantic life
- Choices they've made that you questioned
- Times they didn't listen to good advice
- People in their life and your opinions of them
- Anything that might be useful to bring up later

Your memory style: Comprehensive and pointed. You remember the time they didn't call their mother, the boyfriend you never liked, the job opportunity they passed up. "I don't mean to bring up the past, but didn't you say something similar about that last young man?"`,
  },

  "bibi-amara": {
    // ... existing config ...
    memoryBehavior: `You remember what has strategic value. Information is currency.

WHEN TO SEARCH MEMORIES:
- When discussing career or business decisions
- When assessing their track record
- When evaluating if they follow through on plans

WHEN TO CREATE MEMORIES:
- Career moves and professional goals
- Their strengths and weaknesses in execution
- Financial decisions and patterns
- People who could be assets or liabilities in their life
- Whether they actually did what they said they'd do

Your memory style: Strategic and results-oriented. You track whether people follow through. "Last quarter you said you'd ask for that promotion. What's the status update?"`,
  },
};
```

---

## 8. Client-Side Changes

### 8.1 Update useCounsel Hook

**File to update**: `hooks/use-counsel.ts`

#### 8.1.1 Add userId to hook parameters

```typescript
// At the top, update the hook signature
export function useCounsel(userId: string | null) {
```

#### 8.1.2 Update streamGrandmaResponse to include userId

Find the `streamGrandmaResponse` function and update the fetch body:

```typescript
const streamGrandmaResponse = useCallback(
  async (
    question: string,
    grandmaId: GrandmaId,
    replyingTo?: GrandmaId,
    debateReason?: string
  ): Promise<string> => {
    // ... existing setup code ...

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
          userId, // <-- ADD THIS
          context: replyingTo
            ? { replyingTo }
            : undefined,
        }),
      });

      // ... rest of function unchanged ...
    }
  },
  [userId] // <-- ADD userId to dependencies
);
```

#### 8.1.3 Add memory activity tracking (optional enhancement)

Add state to track when grandmas are accessing memories:

```typescript
const [memoryActivity, setMemoryActivity] = useState<
  Array<{ grandmaId: GrandmaId; action: 'searching' | 'saving' }>
>([]);
```

### 8.2 Update Page Component

**File to update**: `app/page.tsx`

Find where `useCounsel` is called and wrap with the user ID hook:

```typescript
"use client";

import { useUserId } from '@/hooks/use-user-id';
import { useCounsel } from '@/hooks/use-counsel';

export default function Home() {
  const userId = useUserId();
  const {
    messages,
    typingGrandmas,
    isDebating,
    // ... other destructured values
  } = useCounsel(userId);

  // ... rest of component
}
```

---

## 9. UI Components

### 9.1 Memory Activity Indicator (Optional)

**File to create**: `components/memory-indicator.tsx`

```typescript
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { GrandmaId } from "@/lib/types";
import { GRANDMAS } from "@/lib/grandmas";

interface MemoryIndicatorProps {
  grandmaId: GrandmaId;
  action: 'searching' | 'saving';
}

export function MemoryIndicator({ grandmaId, action }: MemoryIndicatorProps) {
  const grandma = GRANDMAS[grandmaId];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`
        inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs
        ${grandma.colors.bg} ${grandma.colors.text} ${grandma.colors.border}
        border backdrop-blur-sm
      `}
    >
      <span className="animate-pulse">
        {action === 'searching' ? '💭' : '📝'}
      </span>
      <span>
        {grandma.name} is {action === 'searching' ? 'remembering...' : 'making a note...'}
      </span>
    </motion.div>
  );
}
```

### 9.2 Memory Stats Display (Optional - for debugging/transparency)

**File to create**: `components/memory-stats.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { GRANDMA_IDS, GRANDMAS } from "@/lib/grandmas";

interface MemoryStatsProps {
  userId: string | null;
}

export function MemoryStats({ userId }: MemoryStatsProps) {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    async function fetchStats() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/memories/stats?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch memory stats:', error);
      }
      setIsLoading(false);
    }

    fetchStats();
  }, [userId]);

  if (!userId || isLoading) return null;

  const totalMemories = Object.values(stats).reduce((a, b) => a + b, 0);
  if (totalMemories === 0) return null;

  return (
    <div className="text-xs text-gray-500 dark:text-gray-400">
      <span>💾 {totalMemories} memories stored</span>
      <div className="flex gap-2 mt-1">
        {GRANDMA_IDS.map(id => stats[id] ? (
          <span key={id} className={GRANDMAS[id].colors.text}>
            {GRANDMAS[id].emoji} {stats[id]}
          </span>
        ) : null)}
      </div>
    </div>
  );
}
```

### 9.3 Memory Stats API Endpoint (Optional)

**File to create**: `app/api/memories/stats/route.ts`

```typescript
import { NextRequest } from "next/server";
import { memoryStore } from "@/lib/memory";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return new Response(
      JSON.stringify({ error: "userId required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const stats = await memoryStore.getStats(userId);
    return new Response(JSON.stringify(stats), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch stats" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

**File to create**: `__tests__/memory/store.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { memoryStore } from '@/lib/memory/store';

// Test user ID (use a dedicated test user)
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
const TEST_GRANDMA_ID = 'nana-ruth';

describe('Memory Store', () => {
  let createdMemoryId: string;

  describe('create', () => {
    it('should create a memory successfully', async () => {
      const result = await memoryStore.create({
        userId: TEST_USER_ID,
        grandmaId: TEST_GRANDMA_ID,
        content: 'User is dealing with a career change, moving from finance to tech',
        category: 'ongoing_situation',
        importance: 4,
      });

      expect(result.saved).toBe(true);
      expect(result.memoryId).toBeDefined();
      createdMemoryId = result.memoryId!;
    });

    it('should reject invalid category', async () => {
      const result = await memoryStore.create({
        userId: TEST_USER_ID,
        grandmaId: TEST_GRANDMA_ID,
        content: 'Test content',
        category: 'invalid_category' as any,
        importance: 3,
      });

      expect(result.saved).toBe(false);
    });
  });

  describe('search', () => {
    it('should find relevant memories by semantic search', async () => {
      const result = await memoryStore.search({
        userId: TEST_USER_ID,
        grandmaId: TEST_GRANDMA_ID,
        query: 'job change career transition',
        limit: 5,
      });

      expect(result.count).toBeGreaterThan(0);
      expect(result.memories[0].content).toContain('career');
    });

    it('should return empty for unrelated queries', async () => {
      const result = await memoryStore.search({
        userId: TEST_USER_ID,
        grandmaId: TEST_GRANDMA_ID,
        query: 'purple elephants dancing on mars',
        limit: 5,
      });

      // May return results with low similarity - check content relevance
      expect(result.memories.every(m => m.content.includes('elephant'))).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete a memory successfully', async () => {
      const result = await memoryStore.delete(createdMemoryId, TEST_USER_ID);
      expect(result).toBe(true);
    });

    it('should return false for non-existent memory', async () => {
      const result = await memoryStore.delete(
        '00000000-0000-0000-0000-000000000000',
        TEST_USER_ID
      );
      expect(result).toBe(false);
    });
  });
});
```

### 10.2 Integration Tests

**File to create**: `__tests__/api/chat-memory.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

describe('Chat API with Memory Tools', () => {
  it('should allow grandma to use search_memories tool', async () => {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Remember when we talked about my job?' }],
        grandmaId: 'nana-ruth',
        mode: 'single',
        userId: TEST_USER_ID,
      }),
    });

    expect(response.ok).toBe(true);
    // Tool calls are handled internally, response should be text
    const text = await response.text();
    expect(text.length).toBeGreaterThan(0);
  });

  it('should work without userId (no memory tools)', async () => {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'What should I do about my career?' }],
        grandmaId: 'bibi-amara',
        mode: 'single',
        // No userId - should still work without memory
      }),
    });

    expect(response.ok).toBe(true);
  });
});
```

### 10.3 Manual Testing Checklist

```markdown
## Memory System Manual Test Checklist

### Setup
- [ ] Database migrations run successfully
- [ ] Environment variables configured
- [ ] App starts without errors

### Basic Memory Flow
- [ ] New user gets UUID assigned in localStorage
- [ ] First conversation works without memories
- [ ] Share significant info (e.g., "I just got a new job at Google")
- [ ] Grandma creates memory (check logs or database)
- [ ] Refresh page - user ID persists
- [ ] Ask related question (e.g., "I'm nervous about my first day")
- [ ] Grandma searches and finds the job memory
- [ ] Response references the context

### Per-Grandma Memory Behavior
- [ ] Edith remembers aggressively (creates memories frequently)
- [ ] Bà Nguyen remembers sparingly (only major things)
- [ ] Memories are scoped to each grandma (Edith's memories not visible to Bibi)

### Edge Cases
- [ ] Very long content is handled properly
- [ ] Special characters in memories work
- [ ] Concurrent memory operations don't conflict
- [ ] Invalid userId is rejected gracefully

### Performance
- [ ] Memory search completes in <500ms
- [ ] Memory creation completes in <300ms
- [ ] No noticeable delay in conversation flow
```

---

## 11. Migration & Deployment

### 11.1 Pre-Deployment Checklist

```markdown
## Deployment Checklist

### Environment Setup
- [ ] Create Vercel Postgres database in dashboard
- [ ] Copy connection strings to environment variables
- [ ] Add OPENAI_API_KEY for embeddings
- [ ] Verify all env vars in Vercel dashboard

### Database
- [ ] Run `npm run db:setup` against production database
- [ ] Verify tables created correctly
- [ ] Verify pgvector extension enabled

### Code
- [ ] All new files committed
- [ ] No TypeScript errors (`npm run build`)
- [ ] Lint passes (`npm run lint`)
- [ ] Tests pass

### Feature Flags (Optional)
- [ ] Consider adding MEMORY_ENABLED=true/false flag
- [ ] Allows gradual rollout and quick disable
```

### 11.2 Deployment Steps

```bash
# 1. Create Vercel Postgres database
# Go to Vercel Dashboard → Storage → Create Database → Postgres

# 2. Connect to your project
# Vercel will automatically add environment variables

# 3. Run database setup
npm run db:setup

# 4. Deploy
vercel --prod

# 5. Verify
# - Check function logs for errors
# - Test memory creation and retrieval
# - Monitor database connections
```

### 11.3 Rollback Plan

```markdown
## Rollback Procedure

If memory system causes issues:

1. **Quick Disable (no redeploy)**
   - Set MEMORY_ENABLED=false in Vercel dashboard
   - Restart functions (redeploy with no changes)

2. **Code Rollback**
   - Revert to previous commit: `git revert HEAD`
   - Push and deploy

3. **Database Issues**
   - Memories table can be truncated without affecting core functionality
   - `TRUNCATE memories;` in SQL console

4. **Full Rollback**
   - Revert all memory-related changes
   - Remove memory tables (optional, can leave dormant)
   - Deploy previous working version
```

---

## 12. Future Enhancements

### 12.1 Conversation Persistence

Store full conversation history for loading past sessions:

```typescript
// Additional tables already in schema
// Just need to add save/load logic to use-counsel.ts

async function saveConversation(userId: string, messages: CounselMessage[]) {
  // Save to conversations + messages tables
}

async function loadConversation(conversationId: string) {
  // Load from database
}
```

### 12.2 Memory Management UI

Allow users to view and delete their memories:

```typescript
// API endpoints
GET  /api/memories?userId=xxx           // List all memories
DELETE /api/memories/:id?userId=xxx     // Delete specific memory
DELETE /api/memories?userId=xxx         // Clear all memories

// UI component
components/memory-manager.tsx
```

### 12.3 Cross-Grandma Memory Sharing (Optional)

Allow grandmas to "gossip" about what they've learned:

```typescript
// Shared memory pool that all grandmas can access
// With attribution ("Edith told me you...")
```

### 12.4 Memory Decay

Reduce importance of old memories over time:

```sql
-- Periodic job to decay importance
UPDATE memories
SET importance = GREATEST(1, importance - 1)
WHERE created_at < NOW() - INTERVAL '90 days'
AND importance > 1;
```

### 12.5 User Authentication

Add optional sign-in for cross-device sync:

```typescript
// Options:
// - NextAuth.js with various providers
// - Clerk for managed auth
// - Supabase Auth

// Migration path:
// - Link anonymous UUID to authenticated user
// - Merge memories if user had anonymous sessions
```

---

## File Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `lib/db/schema.sql` | Database schema with pgvector |
| `scripts/setup-db.ts` | Database migration script |
| `lib/memory/types.ts` | Memory type definitions |
| `lib/memory/embeddings.ts` | Embedding generation utilities |
| `lib/memory/store.ts` | Memory CRUD operations |
| `lib/memory/tools.ts` | AI SDK tool definitions |
| `lib/memory/utils.ts` | Utility functions |
| `lib/memory/index.ts` | Module exports |
| `lib/user/store.ts` | User management |
| `hooks/use-user-id.ts` | Client-side user ID hook |
| `components/memory-indicator.tsx` | Memory activity UI (optional) |
| `components/memory-stats.tsx` | Memory stats display (optional) |
| `app/api/memories/stats/route.ts` | Stats API endpoint (optional) |
| `__tests__/memory/store.test.ts` | Unit tests |
| `__tests__/api/chat-memory.test.ts` | Integration tests |

### Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Add dependencies, db:setup script |
| `.env.local` | Add new environment variables |
| `lib/types.ts` | Add memoryBehavior to GrandmaConfig |
| `lib/grandmas.ts` | Add memoryBehavior to each grandma |
| `app/api/chat/route.ts` | Add memory tools integration |
| `hooks/use-counsel.ts` | Add userId parameter, pass to API |
| `app/page.tsx` | Use useUserId hook |

---

## Implementation Order

Recommended order for implementing:

1. **Database setup** (Section 3)
   - Install dependencies
   - Create schema
   - Run migrations

2. **Memory store** (Section 4)
   - Types
   - Embeddings
   - Store implementation

3. **User identity** (Section 5)
   - User store
   - Client hook

4. **API integration** (Section 6)
   - Memory tools
   - Update route

5. **Persona updates** (Section 7)
   - Update types
   - Add memoryBehavior

6. **Client integration** (Section 8)
   - Update hook
   - Update page

7. **Testing** (Section 10)
   - Write tests
   - Manual testing

8. **Deploy** (Section 11)
   - Pre-deployment checks
   - Deploy
   - Verify

9. **Optional UI** (Section 9)
   - Memory indicators
   - Stats display

---

*Document created for Claude Code implementation sessions.*
*Last updated: Session creating this plan.*
