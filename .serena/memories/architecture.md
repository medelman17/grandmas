# Architecture Overview

## Multi-Agent Parallel Streaming
```
User Question
     ↓
5 Parallel Fetch Requests → /api/chat (mode: "single")
     ↓
Each grandma streams response with personality delays
     ↓
Messages appear iMessage-style after streaming completes
```

## Debate System Flow
```
Initial Responses Complete
     ↓
Coordinator Call → /api/chat (mode: "coordinator")
     ↓
Analyzes for disagreements → Returns DebateInstruction[]
     ↓
Auto-debate rounds (up to MAX_AUTO_DEBATE_ROUNDS = 4)
     ↓
User can: "Let them cook" (continue) or "Order in the council!" (end)
```

## API Route Modes (`app/api/chat/route.ts`)
| Mode | Purpose |
|------|---------|
| `single` | Individual grandma response with persona system prompt |
| `coordinator` | Analyzes all responses, returns JSON with debate instructions |
| `context.debateReaction` | Checks if grandma wants to react to debate message |

## Core Files
| File | Purpose |
|------|---------|
| `lib/grandmas.ts` | 5 persona configs (prompts, colors, emoji) |
| `lib/types.ts` | TypeScript types for the domain |
| `hooks/use-counsel.ts` | Main orchestration hook (state, streaming, debates) |
| `app/api/chat/route.ts` | Edge API route using Vercel AI Gateway |

## Key Types
- `GrandmaId`: Union of 5 grandma IDs
- `CounselMessage`: Message with grandma attribution
- `DebateInstruction`: Who should respond to whom
- `CoordinatorResponse`: Debate analysis result

## State Management
All state managed in `useCounsel` hook:
- `messages`: All conversation messages
- `typingGrandmas`: Currently typing indicators
- `debateRound`: Current debate round number
- `isDebating`: Whether debate is active
