# Counsel of Grandmas

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vercel_AI_SDK-6.x-000?style=flat-square&logo=vercel" alt="Vercel AI SDK" />
  <img src="https://img.shields.io/badge/Tailwind-4.x-38B2AC?style=flat-square&logo=tailwindcss" alt="Tailwind CSS" />
</p>

<p align="center">
  <strong>A multi-agent AI chat application demonstrating advanced streaming patterns, real-time orchestration, and emergent social dynamics.</strong>
</p>

<p align="center">
  <a href="https://bubbeh.vercel.app"><strong>Live Demo</strong></a> ·
  <a href="#architecture"><strong>Architecture</strong></a> ·
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#technical-highlights"><strong>Technical Highlights</strong></a>
</p>

---

## The Concept

Five AI grandmas with distinct personalities, cultural backgrounds, and relationship dynamics provide advice on life's questions. What starts as parallel responses can evolve into heated debates, private side conversations, and secret gossip — creating an emergent social simulation that feels surprisingly alive.

> *"Should I quit my job to pursue my passion?"*
>
> Watch as Bibi Amara (Lagos CEO) and Abuela Carmen (Mexico City restaurateur) clash over spreadsheets vs. soul, while Bà Nguyen (Saigon survivor) delivers a cutting one-liner that ends the debate entirely.

---

## Technical Highlights

This project demonstrates solutions to several non-trivial engineering challenges:

| Challenge | Solution |
|-----------|----------|
| **5 parallel AI streams** | Custom orchestration with personality-based timing variance, `AbortController` cleanup, and race condition handling |
| **Multi-agent coordination** | Coordinator AI analyzes all responses for disagreements, triggers debate chains up to 5 rounds automatically |
| **Persistent memory** | Per-user memory storage with grandma-specific recall patterns (Bà Nguyen remembers silently, Abuela Carmen references recipes) |
| **Social dynamics simulation** | 20 inter-grandma relationships drive gossip triggers, alliance formation, and rivalry behaviors |
| **@Mention targeting** | Autocomplete UI with keyboard navigation, partial text filtering, cursor-aware trigger detection |
| **Real-time state management** | Complex state machine handling typing indicators, debate queues, proactive messaging, and alliance timers simultaneously |
| **Edge-optimized streaming** | Custom data stream parsing for tool events (memory operations) interleaved with text generation |

### By the Numbers

```
├── 5 distinct AI personas with 200+ line system prompts each
├── 20 inter-grandma relationships (ally, frenemy, irritated, worried, dismissive)
├── 4 trigger types for alliance gossip (post-debate, outnumbered, harsh-criticism, random)
├── 3 API modes (single response, coordinator, summary generation)
├── ~2,500 lines of orchestration logic across hooks
└── Real-time coordination of 10+ concurrent state variables
```

---

## Features

### Multi-Agent Parallel Responses
Five grandmas respond simultaneously with personality-driven timing. Abuela Carmen fires off quick, passionate takes while Bibi Amara takes her time crafting strategic advice.

### @Mention Targeting
Type `@` to open an autocomplete dropdown and direct questions to specific grandmas. Only mentioned grandmas respond initially, though others may jump in if debates get heated or their expertise is challenged. Mentions render as styled badges with each grandma's colors and emoji.

### Intelligent Debate System
A coordinator AI detects disagreements and known tension points, triggering realistic back-and-forth arguments. The system respects natural conversation flow with `shouldPause` signals.

### Private Messaging with Context
Click any grandma's avatar to open a private 1:1 chat. She knows what happened in the group discussion and can share things she wouldn't say in front of the others.

### Proactive Outreach
After emotionally charged discussions, grandmas may reach out privately — not because you asked, but because they sensed you needed to talk.

### Secret Alliances & Gossip
Grandmas have private opinions about each other. After debates, allies may send you gossip about what happened:
> *"🤫 Between you and me... Carmen means well, but not everything needs to be a cooking metaphor."*

### Memory System
Grandmas remember you across sessions. Nana Ruth recalls your career aspirations. Abuela Carmen remembers you mentioned your grandmother's recipes. Bà Nguyen remembers silently but reveals it when relevant.

### Meeting Minutes
End a session with formal corporate-style meeting minutes summarizing the advice, key tensions, and action items.

---

## Architecture

### Multi-Agent Orchestration Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           User Question                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    5 Parallel Streaming Requests                         │
│                                                                          │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│   │  Ruth   │  │ Carmen  │  │   Bà    │  │  Edith  │  │  Bibi   │      │
│   │ 1.2-3s  │  │ 0.8-2s  │  │ 1.7-3.7s│  │  1-2.5s │  │  2-5s   │      │
│   └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │
│                     (personality-based timing variance)                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  Coordinator Analysis (mode: "coordinator")              │
│                                                                          │
│   • Analyzes all 5 responses for disagreements                          │
│   • Checks known tension points (Bibi vs Abuela, Bà vs drama, etc.)     │
│   • Returns DebateInstruction[] or signals natural pause                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
             [No Debates]                    [Debates Found]
                    │                               │
                    ▼                               ▼
┌──────────────────────────┐       ┌──────────────────────────────────────┐
│   Proactive Check        │       │         Automatic Debate Loop         │
│   (35% per grandma)      │       │                                       │
│                          │       │   Round 1 → Check reactions → Round 2 │
│   "Should I reach out    │       │   → ... up to 5 rounds → Pause check  │
│    privately?"           │       │                                       │
└──────────────────────────┘       └──────────────────────────────────────┘
                    │                               │
                    ▼                               ▼
┌──────────────────────────┐       ┌──────────────────────────────────────┐
│   Alliance Trigger       │       │   Alliance Trigger Detection          │
│   Detection              │       │                                       │
│                          │       │   • Post-debate: ally was attacked    │
│   Delayed gossip         │       │   • Outnumbered: ally was ganged up   │
│   (2-5 min queue)        │       │   • Harsh criticism: rival got roasted│
└──────────────────────────┘       └──────────────────────────────────────┘
```

### State Management Complexity

The `useCounsel` hook manages:
- Message history with 3 message types
- 5 concurrent typing indicators with reply targets
- Debate queue with automatic round progression
- Pause state with coordinator-provided reasons
- Summary generation flow
- Memory activity tracking (searching/saving indicators)

The `usePrivateMessages` hook manages:
- 5 separate conversation histories
- Unread counts per grandma
- Typing states for private chats
- Proactive message triggers
- Group chat context injection

The `useAllianceQueue` hook manages:
- Delayed delivery queue with timers
- Daily limits and cooldown tracking
- Per-grandma cooldowns
- Global gossip cooldowns
- Probability-gated trigger filtering

---

## The Grandmas

| | Name | Background | Signature Style |
|---|------|-----------|-----------------|
| 💬 | **Nana Ruth** | Brooklyn teacher, 40 years | Literary references, grammar corrections, withering when challenged |
| 🌶️ | **Abuela Carmen** | Mexico City restaurateur | Food metaphors, Spanish phrases, scorching when provoked |
| 🌿 | **Bà Nguyen** | Saigon war survivor | Stoic brevity (1-2 sentences MAX), cutting wisdom |
| ⛪ | **Grandma Edith** | Minnesota church organist | Passive-aggressive concern, weaponized worry |
| 👑 | **Bibi Amara** | Lagos CEO, self-made | Strategic no-nonsense, imperious when questioned |

### Relationship Web

Each grandma has 4 defined relationships with the others:

- **Ruth ↔ Bà**: Mutual allies (intellectual respect)
- **Carmen ↔ Edith**: Frenemies (food vs faith tension)
- **Bibi → Carmen**: Dismissive ("Feelings don't pay bills")
- **Edith → Bibi**: Worried ("I pray for your work-life balance")
- **Bà → Carmen**: Dismissive ("Survived war without empanadas")

These relationships drive gossip content and alliance triggers.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | Next.js 16 (App Router) | Server components, Edge runtime |
| **UI** | React 19 | Concurrent features, transitions |
| **Styling** | Tailwind CSS 4 | CSS-first config, glassmorphism |
| **Animation** | Framer Motion 12 | Spring physics, gesture handling |
| **AI** | Vercel AI SDK 6 | Streaming, tool calling |
| **Gateway** | Vercel AI Gateway | Model routing, rate limiting |
| **Model** | Claude Sonnet 4 | All persona and coordinator responses |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Vercel account (for AI Gateway access)

### Installation

```bash
git clone https://github.com/medelman17/grandmas.git
cd grandmas
npm install
cp .env.example .env.local
# Add your AI_GATEWAY_API_KEY to .env.local
npm run dev
```

### Environment Variables

```bash
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key
```

---

## Project Structure

```
grandmas/
├── app/
│   ├── api/
│   │   ├── chat/route.ts           # Main API (single, coordinator, summary, proactive-check)
│   │   └── private-chat/route.ts   # Private messaging API (proactive, alliance modes)
│   ├── page.tsx
│   └── globals.css                 # Dark theme, glassmorphism, noise textures
├── components/
│   ├── counsel-chat.tsx            # Main orchestration component
│   ├── private-chat-modal.tsx      # Slide-in private conversation panel
│   ├── grandma-message.tsx         # Message bubbles with quote threading
│   └── ...
├── hooks/
│   ├── use-counsel.ts              # Group chat orchestration (~700 lines)
│   ├── use-private-messages.ts     # Private chat state management (~450 lines)
│   ├── use-alliance-queue.ts       # Delayed gossip delivery (~250 lines)
│   └── use-mention-autocomplete.ts # @mention autocomplete state management
├── lib/
│   ├── grandmas.ts                 # Personas, relationships, prompts
│   ├── alliance-triggers.ts        # Gossip trigger detection logic
│   ├── social-config.ts            # Timing and probability constants
│   ├── memory.ts                   # Memory tool definitions
│   ├── mention-utils.ts            # @mention parsing and filtering
│   └── types.ts                    # TypeScript definitions
└── ...
```

---

## API Reference

### `POST /api/chat`

| Mode | Purpose |
|------|---------|
| `single` | Get response from one grandma with persona-specific prompt |
| `coordinator` | Analyze responses for disagreements, return debate instructions |
| `summary` | Generate meeting minutes from conversation transcript |
| `proactive-check` | Determine if grandma should reach out privately |

### `POST /api/private-chat`

Handles private 1:1 conversations with context awareness:
- `proactiveContext`: Grandma-initiated outreach with group chat reference
- `groupChatContext`: User-initiated chat with group discussion context
- `allianceContext`: Gossip messages about other grandmas

---

## Performance Optimizations

| Technique | Implementation |
|-----------|----------------|
| Edge Runtime | All API routes for minimal cold start |
| Content Visibility | Off-screen messages deferred with `content-visibility: auto` |
| Batched Updates | `requestAnimationFrame` for scroll, `startTransition` for typing |
| Request Cancellation | `AbortController` tracking for clean cleanup |
| Package Optimization | Tree-shaking for framer-motion via `optimizePackageImports` |

---

## Deployment

```bash
vercel --prod
```

Required environment variables in Vercel dashboard:
- `AI_GATEWAY_API_KEY`

---

## Development Tools

This project includes configuration for:

- **[Serena MCP](https://github.com/oraios/serena)**: Semantic code navigation and refactoring
- **[Backlog.md MCP](https://github.com/backlog-md/backlog)**: Task management with markdown files
- **Claude Code**: AI-assisted development with project context

See `.serena/`, `backlog/`, and `CLAUDE.md` for configurations.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Always online. Always judging. Sometimes gossiping.</strong>
  <br /><br />
  <a href="https://bubbeh.vercel.app">bubbeh.vercel.app</a>
  <br /><br />
  Built by <a href="https://github.com/medelman17">@medelman17</a>
</p>
