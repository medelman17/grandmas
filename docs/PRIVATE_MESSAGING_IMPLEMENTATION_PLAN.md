# Private Messaging Feature - Implementation Plan

## Feature Overview

Enable users to have private 1:1 conversations with individual grandmas by clicking on their avatars in the header. Grandmas can also proactively message users privately during group discussions.

### User Stories
1. **As a user**, I want to click on a grandma's avatar to open a private chat with just that grandma
2. **As a user**, I want to see a badge on grandma avatars when I have unread private messages
3. **As a user**, I want grandmas to be able to message me privately during group discussions (proactive messaging)

---

## Current Architecture Summary

### Key Files
- `lib/types.ts` - TypeScript type definitions
- `lib/grandmas.ts` - 5 grandma persona configs with system prompts
- `hooks/use-counsel.ts` - Main orchestration hook for group chat
- `app/api/chat/route.ts` - API endpoint for group chat (modes: single, coordinator, summary)
- `components/council-header.tsx` - Header with grandma avatars (currently non-clickable)
- `components/counsel-chat.tsx` - Main chat component

### Existing Patterns
- Messages stream using Vercel AI SDK data stream format (`0:`, `9:`, `a:` type codes)
- Memory tools (search_memories, create_memory) via `lib/memory/tools.ts`
- Personality-based delays in `GRANDMA_RESPONSE_DELAYS` for realistic timing
- AbortController tracking for clean cancellation
- iMessage-style rendering (full message appears at once after streaming completes)

---

## Implementation Steps

### Step 1: Update Type Definitions
**File:** `lib/types.ts`

Add these new types after `MemoryActivity`:

```typescript
/**
 * A private message between a user and a single grandma
 */
export interface PrivateMessage {
  id: string;
  grandmaId: GrandmaId;
  role: "user" | "grandma";
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  /** True if this message was initiated proactively by the grandma */
  isProactive?: boolean;
}

/**
 * State for private conversations with each grandma
 */
export interface PrivateConversation {
  grandmaId: GrandmaId;
  messages: PrivateMessage[];
  unreadCount: number;
  isTyping: boolean;
  lastActivity: number;
}

/**
 * Proactive message trigger - when a grandma wants to message the user privately
 */
export interface ProactiveMessageTrigger {
  grandmaId: GrandmaId;
  reason: string;
  /** Context from the group chat that triggered this */
  groupContext?: string;
}

/**
 * API request body for private chat endpoint
 */
export interface PrivateChatRequest {
  messages: { role: "user" | "assistant"; content: string }[];
  grandmaId: GrandmaId;
  userId?: string;
  /** Context for proactive messages (what triggered the grandma to reach out) */
  proactiveContext?: {
    groupDiscussion: string;
    triggerReason: string;
  };
}
```

**Status:** ✅ PARTIALLY DONE - Types have been added to `lib/types.ts`

---

### Step 2: Create Private Chat API Endpoint
**File:** `app/api/private-chat/route.ts` (NEW FILE)

Create a new API route for private chat that:
1. Uses Edge runtime like the main chat route
2. Accepts `PrivateChatRequest` body
3. Uses modified system prompt for private chat context
4. Supports proactive messaging context
5. Includes memory tools for personalization
6. Uses same stream format as main chat (`0:`, `9:`, `a:` type codes)

**Key Implementation Details:**

```typescript
import { streamText, stepCountIs } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { GRANDMAS } from "@/lib/grandmas";
import { PrivateChatRequest } from "@/lib/types";
import { createMemoryTools } from "@/lib/memory";
import { getOrCreateUser } from "@/lib/user/store";

export const runtime = "edge";
const model = gateway("anthropic/claude-sonnet-4");

function getPrivateChatPrompt(grandmaId: string, proactiveContext?: {...}): string {
  // Start with grandma's base system prompt
  // Add private chat modifier:
  // - More personal/less performative than group
  // - Can share things they wouldn't say in front of other grandmas
  // - Can ask follow-up questions
  // - 2-3 sentences max (slightly longer than group)

  // If proactiveContext provided, add:
  // - The group discussion context
  // - Why grandma is reaching out privately
  // - Instructions to start message naturally
}

export async function POST(req: Request) {
  // 1. Parse and validate PrivateChatRequest
  // 2. Get/create user for memory tools
  // 3. Build system prompt with private chat modifier
  // 4. Add memory behavior instructions
  // 5. Stream response using same format as main chat
  // 6. Return response with tool events interleaved
}
```

**Status:** ✅ PARTIALLY DONE - Basic structure created at `app/api/private-chat/route.ts`

---

### Step 3: Create Private Messages Hook
**File:** `hooks/use-private-messages.ts` (NEW FILE)

Create a hook to manage private conversation state:

```typescript
export function usePrivateMessages(userId?: string | null) {
  // STATE
  const [conversations, setConversations] = useState<Record<GrandmaId, PrivateConversation>>();
  const [activeGrandma, setActiveGrandma] = useState<GrandmaId | null>(null);
  const [memoryActivities, setMemoryActivities] = useState<MemoryActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // COMPUTED
  const totalUnreadCount = // sum of all unread counts
  const unreadCounts: Record<GrandmaId, number> = // per-grandma unread counts

  // METHODS
  const openPrivateChat = (grandmaId: GrandmaId) => {
    // Set active grandma
    // Clear unread count for that grandma
  };

  const closePrivateChat = () => {
    // Set activeGrandma to null
  };

  const streamPrivateResponse = async (
    grandmaId: GrandmaId,
    userMessage: string,
    conversationHistory: PrivateMessage[],
    proactiveContext?: { groupDiscussion: string; triggerReason: string }
  ): Promise<string> => {
    // 1. Create AbortController
    // 2. Set grandma typing state
    // 3. Build API messages from history
    // 4. POST to /api/private-chat
    // 5. Parse stream (same format as main chat)
    // 6. Track memory activities
    // 7. Add personality delay before showing message
    // 8. Add message to conversation
    // 9. Increment unread if chat not currently open
  };

  const sendPrivateMessage = async (message: string) => {
    // 1. Validate active grandma and message
    // 2. Add user message to conversation
    // 3. Call streamPrivateResponse
  };

  const triggerProactiveMessage = async (
    grandmaId: GrandmaId,
    groupDiscussion: string,
    triggerReason: string
  ) => {
    // Call streamPrivateResponse with proactive context
    // (no user message, grandma initiates)
  };

  const clearConversation = (grandmaId: GrandmaId) => {...};
  const clearAllConversations = () => {...};

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
    clearConversation,
    clearAllConversations,
  };
}
```

**Personality-based delays (faster than group chat):**
```typescript
const PRIVATE_RESPONSE_DELAYS: Record<GrandmaId, { min: number; max: number }> = {
  "nana-ruth": { min: 400, max: 1200 },
  "abuela-carmen": { min: 250, max: 800 },
  "ba-nguyen": { min: 600, max: 1600 },
  "grandma-edith": { min: 350, max: 1000 },
  "bibi-amara": { min: 800, max: 2000 },
};
```

**Status:** ✅ PARTIALLY DONE - Basic structure created at `hooks/use-private-messages.ts`

---

### Step 4: Update CouncilHeader Component
**File:** `components/council-header.tsx`

Modify the header to:
1. Accept unread counts and click handler props
2. Make avatars clickable with cursor pointer
3. Show notification badges on avatars with unread messages
4. Add visual feedback on hover (scale + glow)

**New Props Interface:**
```typescript
interface CouncilHeaderProps {
  isDebating: boolean;
  unreadCounts: Record<GrandmaId, number>;
  onGrandmaClick: (grandmaId: GrandmaId) => void;
}
```

**Avatar Changes:**
```tsx
{GRANDMA_IDS.map((id) => {
  const grandma = GRANDMAS[id];
  const unreadCount = unreadCounts[id];

  return (
    <motion.button
      key={id}
      className="relative"
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onGrandmaClick(id)}
      title={`Chat privately with ${grandma.name}`}
    >
      {/* Avatar circle */}
      <div className={cn(
        "relative w-7 h-7 rounded-full flex items-center justify-center",
        "bg-gradient-to-br shadow-md border border-white/10 cursor-pointer",
        "hover:shadow-lg transition-shadow",
        grandma.colors.gradient
      )}>
        <span className="text-xs">{grandma.emoji}</span>
      </div>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            "absolute -top-1 -right-1 min-w-[18px] h-[18px]",
            "rounded-full bg-red-500 text-white text-[10px] font-bold",
            "flex items-center justify-center px-1",
            "border-2 border-zinc-900"
          )}
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </motion.div>
      )}
    </motion.button>
  );
})}
```

**Status:** ❌ NOT STARTED

---

### Step 5: Create PrivateChatModal Component
**File:** `components/private-chat-modal.tsx` (NEW FILE)

Create a modal/slide-out panel for private conversations:

**Component Structure:**
```tsx
interface PrivateChatModalProps {
  grandmaId: GrandmaId | null;
  conversation: PrivateConversation | null;
  memoryActivities: MemoryActivity[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onClose: () => void;
}

export function PrivateChatModal({...}: PrivateChatModalProps) {
  // Return null if no grandmaId (modal closed)

  return (
    <AnimatePresence>
      {grandmaId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className={cn(
              "absolute right-0 top-0 bottom-0 w-full max-w-md",
              "bg-zinc-900 border-l border-white/10",
              "flex flex-col"
            )}
          >
            {/* Header */}
            <PrivateChatHeader grandmaId={grandmaId} onClose={onClose} />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Empty state if no messages */}
              {conversation?.messages.length === 0 && (
                <PrivateChatEmptyState grandmaId={grandmaId} />
              )}

              {/* Message list */}
              {conversation?.messages.map((msg) => (
                <PrivateMessageBubble key={msg.id} message={msg} />
              ))}

              {/* Typing indicator */}
              {conversation?.isTyping && (
                <PrivateTypingIndicator grandmaId={grandmaId} />
              )}

              {/* Memory indicators */}
              {memoryActivities.filter(a => a.grandmaId === grandmaId).map(activity => (
                <MemoryIndicator key={activity.toolCallId} activity={activity} />
              ))}
            </div>

            {/* Input */}
            <PrivateChatInput
              onSend={onSendMessage}
              isLoading={isLoading}
              grandmaName={GRANDMAS[grandmaId].name}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Sub-components needed:**

1. **PrivateChatHeader** - Shows grandma avatar, name, close button
2. **PrivateChatEmptyState** - Friendly prompt to start conversation
3. **PrivateMessageBubble** - Styled message bubble (different for user vs grandma)
4. **PrivateTypingIndicator** - Bouncing dots with grandma avatar
5. **PrivateChatInput** - Text input with send button

**Styling Notes:**
- Use grandma's colors for their messages
- User messages: right-aligned, neutral color
- Grandma messages: left-aligned, gradient background matching their theme
- Proactive messages: subtle indicator (e.g., small "reached out to you" label)

**Status:** ❌ NOT STARTED

---

### Step 6: Add Proactive Messaging to Group Chat
**File:** `hooks/use-counsel.ts`

Add logic for grandmas to proactively message users during group discussions.

**Add new state:**
```typescript
const [proactiveMessageCallback, setProactiveMessageCallback] =
  useState<((grandmaId: GrandmaId, groupDiscussion: string, reason: string) => void) | null>(null);
```

**Add proactive check after debate responses:**
After a grandma responds in a debate, check if she wants to privately reach out:

```typescript
const checkForProactiveMessage = useCallback(
  async (
    grandmaId: GrandmaId,
    responseContent: string,
    userQuestion: string
  ): Promise<{ shouldReach: boolean; reason: string } | null> => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: userQuestion }],
          mode: "proactive-check",  // New mode
          context: {
            grandmaId,
            grandmaResponse: responseContent,
          },
        }),
      });

      // Parse response for { shouldReach: boolean, reason: string }
    } catch {
      return null;
    }
  },
  []
);
```

**Trigger conditions for proactive messages:**
- After a grandma gives advice that might need private follow-up
- When grandma notices user seems troubled (from memory)
- When grandma has sensitive advice she doesn't want others to hear
- Random chance (~10%) after meaningful exchanges

**Add to `useCounsel` return:**
```typescript
return {
  // ... existing returns
  setProactiveMessageCallback,  // To wire up with usePrivateMessages
};
```

**Status:** ❌ NOT STARTED

---

### Step 7: Update API for Proactive Check Mode
**File:** `app/api/chat/route.ts`

Add new mode `"proactive-check"` to analyze if grandma should reach out privately:

```typescript
// Add after coordinator mode handling
if (mode === "proactive-check") {
  const { grandmaId, grandmaResponse } = context || {};

  const proactivePrompt = `You are analyzing whether ${GRANDMAS[grandmaId].name} should reach out privately to the user.

The grandma just said in the group chat: "${grandmaResponse}"

Consider if ${GRANDMAS[grandmaId].name} would want to:
- Share something more personal privately
- Follow up on sensitive topics away from others
- Check in on the user's emotional state
- Offer advice she wouldn't give in front of the other grandmas

Respond with JSON only:
{
  "shouldReach": true/false,
  "reason": "Brief explanation of why she wants to reach out privately"
}

Be selective - only return shouldReach: true for ~20% of messages where private follow-up makes sense.`;

  const result = streamText({
    model,
    system: proactivePrompt,
    messages,
    maxOutputTokens: 150,
  });

  return result.toTextStreamResponse();
}
```

**Status:** ❌ NOT STARTED

---

### Step 8: Wire Everything Together in CounselChat
**File:** `components/counsel-chat.tsx`

**Add imports:**
```typescript
import { usePrivateMessages } from "@/hooks/use-private-messages";
import { PrivateChatModal } from "./private-chat-modal";
```

**Add private messages hook:**
```typescript
const {
  conversations,
  activeGrandma,
  memoryActivities: privateMemoryActivities,
  isLoading: isPrivateLoading,
  unreadCounts,
  openPrivateChat,
  closePrivateChat,
  sendPrivateMessage,
  triggerProactiveMessage,
} = usePrivateMessages(userId);
```

**Update CouncilHeader usage:**
```tsx
<CouncilHeader
  isDebating={isDebating}
  unreadCounts={unreadCounts}
  onGrandmaClick={openPrivateChat}
/>
```

**Add PrivateChatModal:**
```tsx
<PrivateChatModal
  grandmaId={activeGrandma}
  conversation={activeGrandma ? conversations[activeGrandma] : null}
  memoryActivities={privateMemoryActivities}
  isLoading={isPrivateLoading}
  onSendMessage={sendPrivateMessage}
  onClose={closePrivateChat}
/>
```

**Wire proactive messaging (optional advanced feature):**
```typescript
// In useCounsel hook setup
useEffect(() => {
  setProactiveMessageCallback(() => triggerProactiveMessage);
}, [triggerProactiveMessage, setProactiveMessageCallback]);
```

**Status:** ❌ NOT STARTED

---

## File Summary

| File | Action | Status |
|------|--------|--------|
| `lib/types.ts` | Add new types | ✅ Done |
| `app/api/private-chat/route.ts` | Create new file | ✅ Created |
| `hooks/use-private-messages.ts` | Create new file | ✅ Created |
| `components/council-header.tsx` | Modify for clickable avatars + badges | ❌ Not started |
| `components/private-chat-modal.tsx` | Create new file | ❌ Not started |
| `hooks/use-counsel.ts` | Add proactive messaging support | ❌ Not started |
| `app/api/chat/route.ts` | Add proactive-check mode | ❌ Not started |
| `components/counsel-chat.tsx` | Wire everything together | ❌ Not started |

---

## Testing Checklist

### Basic Private Chat
- [ ] Clicking grandma avatar opens private chat modal
- [ ] Private chat modal shows correct grandma name/avatar
- [ ] User can send messages in private chat
- [ ] Grandma responds with personality-appropriate delays
- [ ] Messages render correctly (user right, grandma left)
- [ ] Memory tools work in private chat (remembering indicator)
- [ ] Close button/backdrop click closes modal
- [ ] Conversation history persists while modal is closed

### Unread Badges
- [ ] Badge appears when grandma sends message while chat closed
- [ ] Badge shows correct count (caps at 9+)
- [ ] Badge animates in with scale effect
- [ ] Badge clears when opening that grandma's chat
- [ ] Multiple grandmas can have badges simultaneously

### Proactive Messaging
- [ ] Grandmas occasionally reach out during/after group discussions
- [ ] Proactive messages appear in the correct grandma's private chat
- [ ] Badge appears for proactive messages
- [ ] Proactive messages have appropriate context
- [ ] Not too frequent (selective triggering)

### Edge Cases
- [ ] Rapid switching between grandma chats works
- [ ] Canceling mid-stream works correctly
- [ ] Error states handled gracefully
- [ ] Works on mobile viewport sizes
- [ ] Keyboard navigation works (Escape to close)

---

## UI/UX Considerations

### Modal Behavior
- Slide in from right (like iMessage)
- Backdrop blur for focus
- Click outside to close
- Escape key to close
- Preserve scroll position in group chat

### Visual Hierarchy
- Private chat feels more intimate than group
- Grandma's personality colors prominent
- Clear distinction from group chat styling
- Proactive messages subtly indicated

### Animations
- Badge pulse/scale on new message
- Smooth modal transitions
- Typing indicator bounce
- Message appear animation

---

## Future Enhancements (Out of Scope)

1. **Push notifications** for proactive messages when tab not focused
2. **Sound effects** for new private messages
3. **Read receipts** showing grandma "saw" your message
4. **Conversation search** within private chats
5. **Export** private conversation history
6. **Quick replies** suggested by grandma

---

## Dependencies

No new npm packages required. Uses existing:
- `framer-motion` for animations
- `ai` SDK for streaming
- `@ai-sdk/gateway` for model access
- `tailwindcss` for styling

---

## Implementation Order (Recommended)

1. ✅ Types (`lib/types.ts`)
2. ✅ API endpoint (`app/api/private-chat/route.ts`)
3. ✅ Private messages hook (`hooks/use-private-messages.ts`)
4. **NEXT:** CouncilHeader updates (clickable + badges)
5. PrivateChatModal component
6. Wire into CounselChat
7. Test basic flow
8. Add proactive messaging (API mode + hook integration)
9. Final testing

---

*Last updated: Implementation in progress*
