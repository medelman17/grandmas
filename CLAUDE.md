# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run start    # Start production server
```

For deployment:
```bash
vercel --prod    # Deploy to Vercel production
```

## Architecture Overview

This is **Counsel of Grandmas**, a multi-agent AI chat application where 5 AI grandma personas respond in parallel with debate capabilities.

### Tech Stack
- Next.js 16+ (App Router, Edge Runtime)
- React 19
- Tailwind CSS v4 (CSS-first config via `@import "tailwindcss"`)
- Vercel AI SDK v6+ with AI Gateway
- Framer Motion for animations

### Key Architectural Patterns

**Multi-Agent Parallel Streaming**
- User submits question → 5 parallel fetch requests fire to `/api/chat`
- Each grandma has personality-based delays (typing indicator timing, response delays)
- Messages appear "iMessage-style" - full content renders at once after streaming completes
- `AbortController` tracking enables clean cancellation

**Debate System**
- After initial responses, a "coordinator" call analyzes all responses for disagreements
- Coordinator returns `DebateInstruction[]` identifying which grandma should respond to whom
- Automatic debate rounds (up to `MAX_AUTO_DEBATE_ROUNDS = 4`) run without user intervention
- User can continue debates ("Let them cook") or end them ("Order in the council!")

**API Route Modes** (`app/api/chat/route.ts`)
- `mode: "single"` - Individual grandma response with persona-specific system prompt
- `mode: "coordinator"` - Analyzes responses for disagreements, returns JSON with debate instructions
- `context.debateReaction` - Checks if any grandma wants to react to a specific debate message

### Core Files

- `lib/grandmas.ts` - 5 persona configs with system prompts, colors, emoji
- `lib/types.ts` - TypeScript types (`GrandmaId`, `CounselMessage`, `DebateInstruction`, etc.)
- `hooks/use-counsel.ts` - Main orchestration hook managing state, streaming, debates
- `app/api/chat/route.ts` - Edge API route using Vercel AI Gateway

### Environment Variables

```
AI_GATEWAY_API_KEY=<vercel-ai-gateway-key>
```

Get from: Vercel Dashboard → AI Gateway → API Keys

### The 5 Grandmas

| ID | Name | Personality |
|----|------|-------------|
| `nana-ruth` | Nana Ruth | Brooklyn teacher, literary references, grammar corrections |
| `abuela-carmen` | Abuela Carmen | Mexico City chef, food metaphors, Spanish phrases |
| `ba-nguyen` | Bà Nguyen | Saigon survivor, stoic brevity (1-2 sentences) |
| `grandma-edith` | Grandma Edith | Minnesota organist, passive-aggressive concern |
| `bibi-amara` | Bibi Amara | Lagos businesswoman, strategic no-nonsense |

Each has unique timing characteristics defined in `GRANDMA_RESPONSE_DELAYS` affecting typing indicator and message appearance delays.
