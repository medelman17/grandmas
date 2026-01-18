# @Mention Feature Implementation Plan

This document provides an exhaustive implementation plan for adding @mention functionality to the Counsel of Grandmas application. Another Claude Code instance should be able to follow this plan to implement the feature completely.

---

## Feature Requirements

1. **Only @mentioned grandmas respond initially** - If user types `@nana-ruth @abuela-carmen`, only those two respond first
2. **Other grandmas can weigh in during debates** - After initial responses, any grandma can join the debate (not restricted to mentioned ones)
3. **@mentions are NOT required** - If no grandmas are mentioned, all 5 respond (current behavior)
4. **Undecided: Strip mentions from text** - Leave `@nana-ruth` in the text sent to Claude for now (don't strip)

---

## Implementation Overview

### Files to Modify

| File | Changes |
|------|---------|
| `lib/types.ts` | Add `mentionedGrandmas` field to types |
| `lib/grandmas.ts` | Add mention pattern constant and helper functions |
| `hooks/use-counsel.ts` | Parse mentions in `sendQuestion()`, filter initial responders |
| `components/chat-input.tsx` | Add autocomplete dropdown UI |
| `components/user-message.tsx` | Render @mentions with styled badges |

### New Files to Create

| File | Purpose |
|------|---------|
| `components/mention-autocomplete.tsx` | Autocomplete dropdown component |

### Dependencies to Install

```bash
npm install react-mentions-ts
```

**Alternative**: If you prefer no dependencies, follow the "Custom Implementation" section instead.

---

## Part 1: Type System Changes

### File: `lib/types.ts`

#### 1.1 Add `mentionedGrandmas` to `CounselMessage`

Find the `CounselMessage` interface (lines 43-51) and add the field:

```typescript
export interface CounselMessage {
  id: string;
  type: MessageType;
  content: string;
  grandmaId?: GrandmaId;
  replyingTo?: GrandmaId;
  timestamp: number;
  isStreaming?: boolean;
  /** Grandmas explicitly @mentioned in this message (only for user messages) */
  mentionedGrandmas?: GrandmaId[];
}
```

#### 1.2 Add `mentionedGrandmas` to `ChatRequest`

Find the `ChatRequest` interface (lines 74-90) and add to context:

```typescript
export interface ChatRequest {
  messages: { role: "user" | "assistant"; content: string }[];
  grandmaId?: GrandmaId;
  mode: "single" | "coordinator" | "summary";
  userId?: string;
  context?: {
    replyingTo?: GrandmaId;
    allResponses?: Record<GrandmaId, string>;
    debateReaction?: boolean;
    lastSpeaker?: GrandmaId;
    lastTarget?: GrandmaId;
    conversationTranscript?: string;
    /** Grandmas that were @mentioned in the original question */
    mentionedGrandmas?: GrandmaId[];
  };
}
```

---

## Part 2: Mention Parsing Utilities

### File: `lib/grandmas.ts`

Add these exports at the end of the file (after line 391):

```typescript
/**
 * Regex pattern to match @mentions of grandma IDs
 * Matches: @nana-ruth, @abuela-carmen, @ba-nguyen, @grandma-edith, @bibi-amara
 */
export const MENTION_PATTERN = /@(nana-ruth|abuela-carmen|ba-nguyen|grandma-edith|bibi-amara)/gi;

/**
 * Parse @mentions from a message string
 * @returns Array of unique GrandmaIds that were mentioned
 */
export function parseMentions(text: string): GrandmaId[] {
  const matches = text.matchAll(MENTION_PATTERN);
  const mentioned = new Set<GrandmaId>();

  for (const match of matches) {
    // match[1] is the captured grandma ID (without @)
    const id = match[1].toLowerCase() as GrandmaId;
    if (GRANDMA_IDS.includes(id)) {
      mentioned.add(id);
    }
  }

  return Array.from(mentioned);
}

/**
 * Check if a string contains an incomplete @mention (for autocomplete trigger)
 * Returns the partial text after @ if found, null otherwise
 */
export function getPartialMention(text: string, cursorPosition: number): string | null {
  // Get text up to cursor
  const textBeforeCursor = text.slice(0, cursorPosition);

  // Look for @ followed by optional partial grandma name at end
  const match = textBeforeCursor.match(/@([a-z-]*)$/i);

  if (match) {
    return match[1]; // Return the partial text (empty string if just "@")
  }

  return null;
}

/**
 * Filter grandmas by partial name match (for autocomplete)
 */
export function filterGrandmasByPartial(partial: string): GrandmaId[] {
  const lowerPartial = partial.toLowerCase();

  return GRANDMA_IDS.filter((id) => {
    const grandma = GRANDMAS[id];
    // Match against ID or display name
    return (
      id.includes(lowerPartial) ||
      grandma.name.toLowerCase().includes(lowerPartial)
    );
  });
}
```

---

## Part 3: Hook Changes (Core Logic)

### File: `hooks/use-counsel.ts`

#### 3.1 Import the new utilities

Update the import at line 12:

```typescript
import { GRANDMAS, GRANDMA_IDS, parseMentions } from "@/lib/grandmas";
```

#### 3.2 Modify `sendQuestion` function (lines 535-625)

Replace the entire `sendQuestion` function with this updated version:

```typescript
/**
 * Send a question to grandmas (all or only @mentioned ones)
 */
const sendQuestion = useCallback(
  async (question: string) => {
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    setIsDebating(false);
    setDebateQueue([]);
    setDebateRound(0);
    setRecentDebateMessages([]);

    // Parse @mentions from the question
    const mentionedGrandmas = parseMentions(question);

    // Determine which grandmas should respond initially
    // If mentions exist, only those grandmas respond; otherwise all respond
    const respondingGrandmas = mentionedGrandmas.length > 0
      ? mentionedGrandmas
      : GRANDMA_IDS;

    // Add user message with mention metadata
    const userMessage: CounselMessage = {
      id: generateId(),
      type: "user",
      content: question,
      timestamp: Date.now(),
      mentionedGrandmas: mentionedGrandmas.length > 0 ? mentionedGrandmas : undefined,
    };
    setMessages((prev) => [...prev, userMessage]);

    // Show staggered typing indicators with personality-based timing
    // Only for grandmas that are responding
    const typingAppearanceDelays: Record<GrandmaId, number> = {
      "abuela-carmen": randomDelay(300, 900),
      "nana-ruth": randomDelay(600, 1500),
      "grandma-edith": randomDelay(900, 2100),
      "ba-nguyen": randomDelay(1200, 2700),
      "bibi-amara": randomDelay(1800, 3600),
    };

    // Stagger the typing indicator appearances (only for responding grandmas)
    for (const grandmaId of respondingGrandmas) {
      setTimeout(() => {
        startTransition(() => {
          setTypingGrandmas((prev) => [
            ...prev,
            { grandmaId, startedAt: Date.now() },
          ]);
        });
      }, typingAppearanceDelays[grandmaId]);
    }

    // Fire parallel requests with personality-based "thinking" delays
    const thinkingDelays: Record<GrandmaId, { min: number; max: number }> = {
      "abuela-carmen": { min: 800, max: 2000 },
      "nana-ruth": { min: 1250, max: 3000 },
      "grandma-edith": { min: 1000, max: 2500 },
      "ba-nguyen": { min: 1750, max: 3750 },
      "bibi-amara": { min: 2000, max: 5000 },
    };

    // Only create promises for responding grandmas
    const responsePromises: Promise<{ id: GrandmaId; content: string }>[] =
      respondingGrandmas.map(async (grandmaId) => {
        const delays = thinkingDelays[grandmaId];
        await new Promise((r) => setTimeout(r, randomDelay(delays.min, delays.max)));
        const content = await streamGrandmaResponse(question, grandmaId);
        return { id: grandmaId, content };
      });

    // Wait for all responses
    const results = await Promise.all(responsePromises);

    // Collect responses for debate analysis
    const responses: Partial<Record<GrandmaId, string>> = {};
    for (const result of results) {
      responses[result.id] = result.content;
    }

    // Give user time to read responses before debates start
    await new Promise((r) => setTimeout(r, randomDelay(1500, 3000)));

    // Check for debates - pass mentionedGrandmas so coordinator knows context
    // Note: Debates can include ANY grandma, not just mentioned ones
    const rawDebates = await checkForDebates(question, responses as Record<GrandmaId, string>, mentionedGrandmas);
    const debates = rawDebates.filter(isValidDebate);

    if (debates.length > 0) {
      setIsDebating(true);
      await runAutomaticDebates(debates, 0);
    }

    setIsLoading(false);
  },
  [isLoading, streamGrandmaResponse, checkForDebates, runAutomaticDebates]
);
```

#### 3.3 Update `checkForDebates` function signature and implementation (lines 376-423)

Update to accept optional mentionedGrandmas parameter:

```typescript
/**
 * Check for debates after grandmas respond
 * @param mentionedGrandmas - If provided, used to inform coordinator about who was specifically asked
 */
const checkForDebates = useCallback(
  async (
    question: string,
    responses: Record<GrandmaId, string>,
    mentionedGrandmas?: GrandmaId[]
  ): Promise<DebateInstruction[]> => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: question }],
          mode: "coordinator",
          context: {
            allResponses: responses,
            mentionedGrandmas, // Pass to coordinator for context
          },
        }),
      });

      if (!response.ok) return [];

      const reader = response.body?.getReader();
      if (!reader) return [];

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        fullContent += text;
      }

      // Parse JSON response
      const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return [];

      const parsed = JSON.parse(jsonMatch[0]) as CoordinatorResponse;
      if (parsed.hasDisagreement && parsed.debates?.length > 0) {
        return parsed.debates;
      }
    } catch (error) {
      console.error("Error checking for debates:", error);
    }

    return [];
  },
  []
);
```

#### 3.4 Update the dependency array for `sendQuestion`

After modifying `checkForDebates`, ensure `sendQuestion`'s dependency array is correct:

```typescript
[isLoading, streamGrandmaResponse, checkForDebates, runAutomaticDebates]
```

---

## Part 4: API Route Changes

### File: `app/api/chat/route.ts`

#### 4.1 Update coordinator mode to handle mentionedGrandmas context

Find the initial debate check section (around lines 68-103) and update:

```typescript
// Initial debate check - analyze all responses
const allResponses = context?.allResponses;
if (!allResponses) {
  return new Response(
    JSON.stringify({ error: "allResponses required for coordinator mode" }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}

// Get mentioned grandmas for context (if any)
const mentionedGrandmas = context?.mentionedGrandmas;

// Format the responses for analysis
const responseSummary = Object.entries(allResponses)
  .map(([id, content]) => `${GRANDMAS[id as GrandmaId].name}: ${content}`)
  .join("\n\n");

const userQuestion = messages.find((m) => m.role === "user")?.content || "";

// Build context about who was asked
const mentionContext = mentionedGrandmas && mentionedGrandmas.length > 0
  ? `\n\nNOTE: The user specifically @mentioned: ${mentionedGrandmas.map(id => GRANDMAS[id].name).join(", ")}. Other grandmas may want to jump in even though they weren't asked!`
  : "";

const result = streamText({
  model,
  system: DEBATE_COORDINATOR_PROMPT,
  messages: [
    {
      role: "user",
      content: `User's question: "${userQuestion}"${mentionContext}

The grandmas responded:

${responseSummary}

Analyze for disagreements and respond with JSON only.`,
    },
  ],
  maxOutputTokens: 500,
});

return result.toTextStreamResponse();
```

---

## Part 5: Autocomplete UI Component

### Option A: Using react-mentions-ts (Recommended)

#### 5.1 Install dependency

```bash
npm install react-mentions-ts
```

#### 5.2 Create new file: `components/mention-autocomplete.tsx`

```typescript
"use client";

import { useState, useCallback, useRef, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { GRANDMAS, GRANDMA_IDS, getPartialMention, filterGrandmasByPartial } from "@/lib/grandmas";
import { GrandmaId } from "@/lib/types";

interface MentionAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MentionAutocomplete({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder,
}: MentionAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<GrandmaId[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const cursorPos = e.target.selectionStart || 0;

      onChange(newValue);

      // Check for partial mention at cursor
      const partial = getPartialMention(newValue, cursorPos);

      if (partial !== null) {
        // Find the @ position
        const textBeforeCursor = newValue.slice(0, cursorPos);
        const atIndex = textBeforeCursor.lastIndexOf("@");
        setMentionStart(atIndex);

        // Filter grandmas
        const filtered = filterGrandmasByPartial(partial);
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
        setSelectedIndex(0);
      } else {
        setShowSuggestions(false);
        setMentionStart(null);
      }
    },
    [onChange]
  );

  const insertMention = useCallback(
    (grandmaId: GrandmaId) => {
      if (mentionStart === null) return;

      const cursorPos = textareaRef.current?.selectionStart || value.length;
      const before = value.slice(0, mentionStart);
      const after = value.slice(cursorPos);

      // Insert the full mention with a space after
      const newValue = `${before}@${grandmaId} ${after}`;
      onChange(newValue);

      setShowSuggestions(false);
      setMentionStart(null);

      // Focus back on textarea and set cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = mentionStart + grandmaId.length + 2; // @id + space
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    },
    [value, mentionStart, onChange]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (showSuggestions && suggestions.length > 0) {
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % suggestions.length);
            break;
          case "ArrowUp":
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
            break;
          case "Tab":
          case "Enter":
            if (showSuggestions) {
              e.preventDefault();
              insertMention(suggestions[selectedIndex]);
            }
            break;
          case "Escape":
            e.preventDefault();
            setShowSuggestions(false);
            break;
        }
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSubmit();
      }
    },
    [showSuggestions, suggestions, selectedIndex, insertMention, onSubmit]
  );

  return (
    <div className="relative flex-1">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Delay hiding to allow click on suggestion
          setTimeout(() => setShowSuggestions(false), 150);
        }}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          "w-full resize-none bg-transparent px-4 py-3",
          "focus:outline-none",
          "placeholder:text-zinc-600 text-sm text-white",
          "transition-all duration-200",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />

      {/* Autocomplete dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute bottom-full left-0 mb-2 w-64",
              "bg-zinc-900 border border-zinc-700 rounded-xl",
              "shadow-xl shadow-black/50",
              "overflow-hidden z-50"
            )}
          >
            <div className="p-1">
              <div className="px-3 py-1.5 text-xs text-zinc-500 border-b border-zinc-800">
                Tag a grandma
              </div>
              {suggestions.map((grandmaId, index) => {
                const grandma = GRANDMAS[grandmaId];
                return (
                  <button
                    key={grandmaId}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent blur
                      insertMention(grandmaId);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg",
                      "transition-colors duration-100",
                      index === selectedIndex
                        ? "bg-zinc-800"
                        : "hover:bg-zinc-800/50"
                    )}
                  >
                    <span className="text-lg">{grandma.emoji}</span>
                    <div className="flex flex-col items-start">
                      <span className="text-sm text-white">{grandma.name}</span>
                      <span className="text-xs text-zinc-500">@{grandmaId}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

#### 5.3 Update `components/chat-input.tsx`

Replace the textarea section (around lines 304-320) with the MentionAutocomplete component:

First, add the import at the top:

```typescript
import { MentionAutocomplete } from "./mention-autocomplete";
```

Then replace the textarea (lines 304-320) with:

```typescript
<MentionAutocomplete
  value={input}
  onChange={setInput}
  onSubmit={() => handleSubmit({ preventDefault: () => {} } as FormEvent)}
  disabled={isLoading}
  placeholder="Ask the grandmas for advice... (type @ to mention)"
/>
```

---

## Part 6: Display Mentions in User Messages

### File: `components/user-message.tsx`

Replace the entire file with this updated version that renders mentions as styled badges:

```typescript
"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GRANDMAS, MENTION_PATTERN } from "@/lib/grandmas";
import { GrandmaId } from "@/lib/types";
import { Fragment } from "react";

interface UserMessageProps {
  content: string;
  mentionedGrandmas?: GrandmaId[];
}

/**
 * Render message content with @mentions styled as badges
 */
function renderContentWithMentions(content: string) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Reset regex state
  MENTION_PATTERN.lastIndex = 0;

  let match;
  while ((match = MENTION_PATTERN.exec(content)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(
        <Fragment key={`text-${lastIndex}`}>
          {content.slice(lastIndex, match.index)}
        </Fragment>
      );
    }

    // Add the mention as a styled badge
    const grandmaId = match[1].toLowerCase() as GrandmaId;
    const grandma = GRANDMAS[grandmaId];

    if (grandma) {
      parts.push(
        <span
          key={`mention-${match.index}`}
          className={cn(
            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md",
            "text-xs font-medium",
            grandma.colors.bg,
            grandma.colors.text,
            grandma.colors.border,
            "border"
          )}
        >
          <span>{grandma.emoji}</span>
          <span>{grandma.name}</span>
        </span>
      );
    } else {
      // Fallback if grandma not found (shouldn't happen)
      parts.push(
        <Fragment key={`mention-${match.index}`}>{match[0]}</Fragment>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(
      <Fragment key={`text-${lastIndex}`}>
        {content.slice(lastIndex)}
      </Fragment>
    );
  }

  return parts.length > 0 ? parts : content;
}

export function UserMessage({ content, mentionedGrandmas }: UserMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
      className="flex justify-end"
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl rounded-br-sm px-4 py-3",
          "bg-gradient-to-br from-zinc-700 to-zinc-800",
          "border border-zinc-600/30",
          "shadow-lg"
        )}
      >
        <p className="text-sm leading-relaxed text-zinc-100">
          {renderContentWithMentions(content)}
        </p>

        {/* Optional: Show who was mentioned as a footer */}
        {mentionedGrandmas && mentionedGrandmas.length > 0 && (
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-zinc-600/30">
            <span className="text-xs text-zinc-500">Asked:</span>
            <div className="flex gap-1">
              {mentionedGrandmas.map((id) => (
                <span key={id} className="text-sm" title={GRANDMAS[id].name}>
                  {GRANDMAS[id].emoji}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
```

### Update where UserMessage is rendered

Find where `UserMessage` is rendered (likely in a chat messages list component) and pass the `mentionedGrandmas` prop:

```typescript
{message.type === "user" && (
  <UserMessage
    content={message.content}
    mentionedGrandmas={message.mentionedGrandmas}
  />
)}
```

---

## Part 7: Testing Checklist

After implementation, verify the following scenarios:

### Basic Mention Functionality
- [ ] Typing `@` shows autocomplete dropdown with all 5 grandmas
- [ ] Typing `@na` filters to show only "Nana Ruth"
- [ ] Typing `@a` shows "Abuela Carmen" and "Bibi Amara"
- [ ] Arrow keys navigate suggestions
- [ ] Tab/Enter selects suggestion and inserts mention
- [ ] Escape closes dropdown without selecting
- [ ] Clicking a suggestion inserts the mention

### Response Filtering
- [ ] `@nana-ruth How should I ask for a raise?` - Only Nana Ruth responds initially
- [ ] `@abuela-carmen @ba-nguyen What should I cook?` - Only those two respond initially
- [ ] `How do I deal with stress?` (no mentions) - All 5 grandmas respond

### Debate System
- [ ] After mentioned grandmas respond, other grandmas can still join debates
- [ ] Debate coordinator can suggest non-mentioned grandmas jump in
- [ ] Non-mentioned grandmas show up with typing indicators when joining debate

### Display
- [ ] @mentions in user messages appear as styled badges with grandma colors
- [ ] Each badge shows emoji + name
- [ ] Optional footer shows who was specifically asked

### Edge Cases
- [ ] Multiple mentions of same grandma = only one response from them
- [ ] Case insensitivity: `@Nana-Ruth` and `@nana-ruth` both work
- [ ] Mention at start/middle/end of message all work
- [ ] Empty input with just `@` shows all suggestions

---

## Part 8: Optional Enhancements

These are not required but could improve the feature:

### 8.1 Keyboard Shortcut Hint
Add a subtle hint below the input: "Tip: Type @ to mention specific grandmas"

### 8.2 Mention-Aware System Prompts
Update grandma system prompts to acknowledge when they were specifically asked:

In `lib/grandmas.ts`, update `streamGrandmaResponse` call to pass mention context, and in the API route, append to system prompt:

```typescript
if (wasMentioned) {
  systemPrompt += "\n\nYou were specifically @mentioned and asked for your opinion. The user values your perspective on this.";
}
```

### 8.3 "Also hearing from..." indicator
When only some grandmas are mentioned, show a subtle indicator that others might join the debate:

```typescript
{mentionedGrandmas.length > 0 && mentionedGrandmas.length < 5 && (
  <div className="text-xs text-zinc-600 italic">
    Other grandmas may weigh in during the debate...
  </div>
)}
```

---

## Summary of Changes

| Step | File | Action |
|------|------|--------|
| 1 | `lib/types.ts` | Add `mentionedGrandmas` to `CounselMessage` and `ChatRequest.context` |
| 2 | `lib/grandmas.ts` | Add `MENTION_PATTERN`, `parseMentions()`, `getPartialMention()`, `filterGrandmasByPartial()` |
| 3 | `hooks/use-counsel.ts` | Update `sendQuestion()` to parse mentions and filter responders |
| 4 | `hooks/use-counsel.ts` | Update `checkForDebates()` to accept `mentionedGrandmas` param |
| 5 | `app/api/chat/route.ts` | Pass mention context to coordinator prompt |
| 6 | `components/mention-autocomplete.tsx` | Create new autocomplete component |
| 7 | `components/chat-input.tsx` | Replace textarea with `MentionAutocomplete` |
| 8 | `components/user-message.tsx` | Render mentions as styled badges |

**Estimated lines of code**: ~300 new lines, ~50 modified lines
