# Counsel of Grandmas

> **5 AI grandmas with very different perspectives, ready to give you advice about life, love, and that thing you're definitely overthinking.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmedelman17%2Fgrandmas)

**Live Demo:** [bubbeh.vercel.app](https://bubbeh.vercel.app)

---

## Overview

Counsel of Grandmas is a multi-agent AI chat application where five distinct grandma personas respond to your questions in parallel, then engage in dynamic debates when they disagree. Built with Next.js 16, React 19, and the Vercel AI SDK, it showcases advanced streaming patterns, personality-driven AI orchestration, and real-time message management.

### Key Features

- **Multi-Agent Parallel Responses** — 5 grandmas answer simultaneously with personality-based timing
- **Intelligent Debate System** — Coordinator AI detects disagreements and triggers realistic arguments
- **iMessage-Style Messaging** — Messages appear complete for better readability
- **Reply Threading** — Quote previews show who's responding to whom
- **Meeting Minutes Generator** — Formal corporate-style summary of advice sessions
- **Glassmorphic Dark UI** — Modern blur effects with persona-specific glow colors

---

## Table of Contents

- [The Grandmas](#the-grandmas)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
  - [Multi-Agent Parallel Streaming](#multi-agent-parallel-streaming)
  - [Debate System](#debate-system)
  - [Message Flow](#message-flow)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Components](#components)
- [Hooks](#hooks)
- [Type Definitions](#type-definitions)
- [Styling & Theme](#styling--theme)
- [Deployment](#deployment)
- [Performance Optimizations](#performance-optimizations)
- [Contributing](#contributing)
- [License](#license)

---

## The Grandmas

Each grandma has a unique personality, response style, and debate triggers:

| ID | Name | Emoji | Personality | Signature Style |
|----|------|-------|-------------|-----------------|
| `nana-ruth` | **Nana Ruth** | 💬 | Brooklyn teacher, 40 years | Literary references, grammar corrections, withering when challenged |
| `abuela-carmen` | **Abuela Carmen** | 🌶️ | Mexico City restaurateur | Food metaphors, Spanish phrases, scorching when provoked |
| `ba-nguyen` | **Bà Nguyen** | 🌿 | Saigon war survivor | Stoic brevity (1-2 sentences MAX), cutting wisdom |
| `grandma-edith` | **Grandma Edith** | ⛪ | Minnesota church organist | Passive-aggressive concern, moral judgment, weaponized worry |
| `bibi-amara` | **Bibi Amara** | 👑 | Lagos businesswoman, CEO | Strategic no-nonsense, imperious when questioned |

### Known Debate Tensions

The AI coordinator is aware of these relationship dynamics and will trigger arguments:

- **Bibi vs Abuela**: "Spreadsheets can't measure love" vs "Feelings don't pay bills"
- **Bà vs Anyone Dramatic**: One cutting sentence destroys paragraphs of emotion
- **Grandma Edith vs Bibi**: "I worry about your soul" vs "Worry is not a strategy"
- **Nana Ruth vs Bibi**: "Shakespeare understood profit's limits" vs "Shakespeare died broke"
- **Abuela vs Bà**: "Have you no heart?!" vs "Survived war without crying"

---

## Tech Stack

### Core Framework
| Package | Version | Purpose |
|---------|---------|---------|
| Next.js | 16.1.3 | App Router, Edge Runtime |
| React | 19.x | Concurrent features |
| TypeScript | 5.x | Type safety |

### AI & Streaming
| Package | Version | Purpose |
|---------|---------|---------|
| `ai` (Vercel AI SDK) | 6.x | Unified AI interface |
| `@ai-sdk/gateway` | 3.x | Vercel AI Gateway routing |
| `@ai-sdk/anthropic` | 3.x | Claude model access |

### Styling & UI
| Package | Version | Purpose |
|---------|---------|---------|
| Tailwind CSS | 4.x | CSS-first configuration |
| `@tailwindcss/typography` | 0.5.x | Prose styling for markdown |
| Framer Motion | 12.x | Animations and transitions |
| `react-markdown` | 10.x | Markdown rendering |

---

## Architecture

### Multi-Agent Parallel Streaming

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Question                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   5 Parallel Fetch Requests                      │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │Nana Ruth │ │ Abuela   │ │    Bà    │ │  Edith   │ │  Bibi  ││
│  │ 1.2-3s   │ │ 0.8-2s   │ │ 1.7-3.7s │ │  1-2.5s  │ │ 2-5s   ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Coordinator Analyzes All 5 Responses                │
│                                                                  │
│   • Detects disagreements between grandmas                       │
│   • Identifies known tension points                              │
│   • Returns DebateInstruction[] if conflicts found               │
└─────────────────────────────────────────────────────────────────┘
                              │
                     ┌────────┴────────┐
                     ▼                 ▼
              [No Debates]      [Debates Found]
                     │                 │
                     ▼                 ▼
                  Done           Debate Loop
```

**Key characteristics:**
- Personality-based "thinking" delays create realistic staggered responses
- Messages stream completely, then appear all-at-once (iMessage-style)
- `AbortController` tracking enables clean cancellation

### Debate System

```
┌─────────────────────────────────────────────────────────────────┐
│                      Automatic Debate Loop                       │
│                                                                  │
│   Round 1: Grandma A responds to Grandma B                       │
│            ↓                                                     │
│   Coordinator checks: Does anyone want to react?                 │
│            ↓                                                     │
│   Round 2: Grandma C jumps in defending Grandma B                │
│            ↓                                                     │
│   ... continues up to 5 rounds ...                               │
│            ↓                                                     │
│   Coordinator: "They're winding down" (shouldPause: true)        │
│            ↓                                                     │
│   User prompt: "Let them cook" or "Order in the council!"        │
└─────────────────────────────────────────────────────────────────┘
```

**Debate flow:**
1. Coordinator returns `DebateInstruction[]` with responderId, targetId, reason
2. Up to 5 automatic rounds run without user intervention
3. After each response, coordinator checks if others want to react
4. System respects `shouldPause` signal for natural conversation breaks
5. User can continue debates or gavel the council to order

### Message Flow

```typescript
// User submits question
sendQuestion("Should I quit my job?")

// 1. Add user message to state
// 2. Show 5 typing indicators (staggered by personality)
// 3. Fire 5 parallel requests to /api/chat?mode=single
// 4. Collect complete responses (no incremental display)
// 5. Remove typing indicators, add messages with post-delays
// 6. Call coordinator to check for debates
// 7. If debates found, enter automatic debate loop
// 8. On gavel, show summary prompt
// 9. Generate meeting minutes if requested
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Vercel account (for AI Gateway access)

### Installation

```bash
# Clone the repository
git clone https://github.com/medelman17/grandmas.git
cd grandmas

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your AI Gateway key

# Start development server
npm run dev
```

### Environment Variables

```bash
# Required: Vercel AI Gateway API Key
AI_GATEWAY_API_KEY=your_key_here
```

**To get your AI Gateway key:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to Settings → AI Gateway
3. Create or copy your API key

---

## Project Structure

```
grandmas/
├── app/
│   ├── api/chat/
│   │   └── route.ts           # Main API (3 modes: single, coordinator, summary)
│   ├── page.tsx               # Home page
│   ├── layout.tsx             # Root layout + metadata
│   ├── globals.css            # Dark theme, glassmorphism, animations
│   ├── icon.tsx               # Dynamic favicon
│   ├── apple-icon.tsx         # Apple touch icon
│   ├── opengraph-image.tsx    # OG image for social sharing
│   └── twitter-image.tsx      # Twitter card image
├── components/
│   ├── counsel-chat.tsx       # Main chat container
│   ├── grandma-message.tsx    # Grandma message bubbles
│   ├── user-message.tsx       # User message bubbles
│   ├── chat-input.tsx         # Input + debate controls
│   ├── council-header.tsx     # Header with avatars + debate badge
│   ├── typing-indicators.tsx  # Animated typing status
│   ├── summary-prompt.tsx     # Post-debate summary request
│   └── markdown.tsx           # Markdown renderer
├── hooks/
│   └── use-counsel.ts         # Main orchestration hook (500+ lines)
├── lib/
│   ├── grandmas.ts            # Persona configs + system prompts
│   ├── types.ts               # TypeScript definitions
│   └── utils.ts               # Utility functions
├── public/                    # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

---

## API Reference

### `POST /api/chat`

**Runtime:** Edge

#### Mode: `single`

Get a response from a single grandma.

```typescript
// Request
{
  messages: [{ role: "user", content: "Should I quit my job?" }],
  grandmaId: "nana-ruth",
  mode: "single",
  context?: {
    replyingTo?: "abuela-carmen"  // For debate responses
  }
}

// Response: Text stream of grandma's response
```

#### Mode: `coordinator`

Analyze responses for disagreements.

```typescript
// Initial check (after all 5 respond)
{
  messages: [{ role: "user", content: "Original question" }],
  mode: "coordinator",
  context: {
    allResponses: {
      "nana-ruth": "Her response...",
      "abuela-carmen": "Her response...",
      // ... all 5
    }
  }
}

// Debate reaction check (after each debate message)
{
  messages: [{ role: "user", content: "Last debate message" }],
  mode: "coordinator",
  context: {
    debateReaction: true,
    lastSpeaker: "nana-ruth",
    lastTarget: "abuela-carmen"
  }
}

// Response (parsed from text stream)
{
  "hasDisagreement": true,
  "debates": [
    {
      "responderId": "abuela-carmen",
      "targetId": "nana-ruth",
      "reason": "Disagrees with cold literary analysis"
    }
  ],
  "shouldPause": false,
  "pauseReason": null
}
```

#### Mode: `summary`

Generate meeting minutes.

```typescript
// Request
{
  messages: [],
  mode: "summary",
  context: {
    conversationTranscript: "Full conversation text..."
  }
}

// Response: Markdown-formatted meeting minutes
```

---

## Components

### `<CounselChat />`

Main chat container managing the entire conversation UI.

**Responsibilities:**
- Renders messages (user, grandma, system)
- Handles auto-scroll with buffer for input area
- Shows typing indicators (initial pinned, debate inline)
- Displays summary prompt after gaveling
- Quote preview for threaded debate replies

### `<GrandmaMessage />`

Individual grandma message bubble.

**Props:**
```typescript
interface GrandmaMessageProps {
  content: string;
  grandmaId: GrandmaId;
  replyingTo?: GrandmaId;        // Shows quote preview
  replyingToContent?: string;    // Content being replied to
  isStreaming?: boolean;         // Shows pulsing indicator
}
```

**Features:**
- Persona-specific avatar with gradient background
- Glassmorphic message bubble with subtle gradient overlay
- Optional streaming indicator ring
- Quote preview with thread connector line
- Markdown rendering

### `<ChatInput />`

Fixed bottom input area with debate controls.

**Props:**
```typescript
interface ChatInputProps {
  onSubmit: (question: string) => void;
  isLoading: boolean;
  hasMessages: boolean;
  isDebating: boolean;
  hasQueuedDebates: boolean;
  debatePauseReason: string;
  onContinueDebate: () => void;
  onEndDebate: () => void;
}
```

**Features:**
- Quick prompt buttons on empty state
- Textarea with send button
- "Let them cook" button (amber, flame icon)
- "Order in the council!" button (gavel icon)
- Loading state with animated dots

### `<TypingIndicators />`

Shows which grandmas are currently "thinking."

**Props:**
```typescript
interface TypingIndicatorsProps {
  typingGrandmas: TypingState[];
}
```

**Features:**
- Staggered entrance animations
- Shows reply target with arrow
- Persona-colored bouncing dots
- Spring physics for smooth motion

---

## Hooks

### `useCounsel()`

Main orchestration hook managing all chat logic.

**Returns:**
```typescript
{
  // State
  messages: CounselMessage[];
  typingGrandmas: TypingState[];
  isDebating: boolean;
  isLoading: boolean;
  debateRound: number;
  hasQueuedDebates: boolean;
  debatePauseReason: string;
  showSummaryPrompt: boolean;
  isGeneratingSummary: boolean;

  // Actions
  sendQuestion: (question: string) => Promise<void>;
  continueDebate: () => Promise<void>;
  endDebate: () => void;
  requestMeetingSummary: () => Promise<void>;
  dismissSummaryPrompt: () => void;
  clearChat: () => void;
}
```

**Key internal methods:**
- `streamGrandmaResponse()` — Handles single grandma fetch with streaming
- `checkForDebates()` — Calls coordinator after initial responses
- `checkForDebateReaction()` — Checks if grandmas want to react
- `runAutomaticDebates()` — Manages debate loop up to 5 rounds
- `generateTranscript()` — Formats conversation for summary
- `generateSummary()` — Calls summary API mode

---

## Type Definitions

```typescript
// Grandma identifier
type GrandmaId =
  | "nana-ruth"
  | "abuela-carmen"
  | "ba-nguyen"
  | "grandma-edith"
  | "bibi-amara";

// Message in conversation
interface CounselMessage {
  id: string;
  type: "user" | "grandma" | "system";
  content: string;
  grandmaId?: GrandmaId;
  replyingTo?: GrandmaId;
  timestamp: number;
  isStreaming?: boolean;
}

// Typing indicator state
interface TypingState {
  grandmaId: GrandmaId;
  replyingTo?: GrandmaId;
  startedAt: number;
}

// Debate instruction from coordinator
interface DebateInstruction {
  responderId: GrandmaId;
  targetId: GrandmaId;
  reason: string;
}

// Coordinator response
interface CoordinatorResponse {
  hasDisagreement: boolean;
  debates: DebateInstruction[];
  shouldPause?: boolean;
  pauseReason?: string;
}
```

---

## Styling & Theme

### Dark Mode Design System

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0a0a0f` | Main background |
| `--bg-secondary` | `#12121a` | Elevated surfaces |
| `--glass-bg` | `rgba(255,255,255,0.03)` | Glassmorphic panels |
| `--glass-border` | `rgba(255,255,255,0.08)` | Subtle borders |
| `--text-primary` | `#f5f5f7` | Main text |
| `--text-secondary` | `#a1a1aa` | Muted text |

### Persona Colors

| Grandma | Gradient | Glow |
|---------|----------|------|
| Nana Ruth | `purple-500 → indigo-600` | `rgba(168,85,247,0.3)` |
| Abuela Carmen | `orange-500 → red-600` | `rgba(249,115,22,0.3)` |
| Bà Nguyen | `emerald-500 → teal-600` | `rgba(16,185,129,0.3)` |
| Grandma Edith | `sky-500 → blue-600` | `rgba(14,165,233,0.3)` |
| Bibi Amara | `amber-500 → yellow-600` | `rgba(245,158,11,0.3)` |

### Glassmorphism Classes

```css
.glass {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.glass-subtle {
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
```

---

## Deployment

### Vercel (Recommended)

```bash
# Deploy to production
vercel --prod
```

**Required environment variables in Vercel:**
- `AI_GATEWAY_API_KEY` — Your Vercel AI Gateway key

### Build Commands

```bash
npm run dev      # Development server (localhost:3000)
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
```

---

## Performance Optimizations

| Optimization | Implementation |
|--------------|----------------|
| **Edge Runtime** | All API routes use edge for fast cold starts |
| **Package Tree-Shaking** | `optimizePackageImports` for framer-motion |
| **Content Visibility** | `content-visibility: auto` defers off-screen messages |
| **Layout Stability** | `contain-intrinsic-size` prevents CLS |
| **Batched Scrolling** | `requestAnimationFrame` for scroll updates |
| **Non-Urgent Updates** | `startTransition` for typing indicators |
| **Request Cancellation** | `AbortController` for clean cleanup |

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Always online. Always judging.</strong>
  <br />
  <a href="https://bubbeh.vercel.app">bubbeh.vercel.app</a>
</p>
