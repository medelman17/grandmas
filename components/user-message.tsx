"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GRANDMAS } from "@/lib/grandmas";
import { FUZZY_MENTION_PATTERN, parseMentions, resolvePartialMention } from "@/lib/mention-utils";
import { GrandmaId } from "@/lib/types";

interface UserMessageProps {
  content: string;
  /** Optional: explicitly passed mentioned grandmas (for footer display) */
  mentionedGrandmas?: GrandmaId[];
}

/**
 * Renders a single @mention as a styled badge with grandma colors and emoji
 */
function MentionBadge({ grandmaId }: { grandmaId: GrandmaId }) {
  const grandma = GRANDMAS[grandmaId];
  if (!grandma) return <span>@{grandmaId}</span>;

  const colors = grandma.colors;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md",
        "text-xs font-medium",
        "bg-gradient-to-br",
        colors.gradient,
        "border border-white/10"
      )}
    >
      <span>{grandma.emoji}</span>
      <span className={colors.primary}>{grandma.name}</span>
    </span>
  );
}

/**
 * Parses content and renders @mentions as styled badges
 * Returns an array of React nodes (text segments and badge components)
 * Supports fuzzy matching (e.g., @abuela matches Abuela Carmen)
 */
function renderContentWithMentions(content: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  // Use fuzzy pattern to find all @mentions with their positions
  const matches = content.matchAll(new RegExp(FUZZY_MENTION_PATTERN.source, "gi"));

  for (const match of matches) {
    const mentionStart = match.index!;
    const mentionEnd = mentionStart + match[0].length;
    const partial = match[1];

    // Resolve the partial mention to a grandma ID
    const grandmaId = resolvePartialMention(partial);

    // Add text before this mention
    if (mentionStart > lastIndex) {
      result.push(
        <span key={key++}>{content.slice(lastIndex, mentionStart)}</span>
      );
    }

    // Add the mention badge if resolved, otherwise keep as plain text
    if (grandmaId) {
      result.push(<MentionBadge key={key++} grandmaId={grandmaId} />);
    } else {
      // Unresolved mention - render as plain text
      result.push(<span key={key++}>{content.slice(mentionStart, mentionEnd)}</span>);
    }

    lastIndex = mentionEnd;
  }

  // Add any remaining text after the last mention
  if (lastIndex < content.length) {
    result.push(<span key={key++}>{content.slice(lastIndex)}</span>);
  }

  // If no mentions found, return plain content
  if (result.length === 0) {
    return [<span key={0}>{content}</span>];
  }

  return result;
}

export function UserMessage({ content, mentionedGrandmas }: UserMessageProps) {
  // Parse mentions from content if not explicitly provided
  const mentions = mentionedGrandmas ?? parseMentions(content);
  const hasMentions = mentions.length > 0;

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
        {/* Message content with inline mention badges */}
        <p className="text-sm leading-relaxed text-zinc-100">
          {renderContentWithMentions(content)}
        </p>

        {/* Optional footer showing who was asked */}
        {hasMentions && (
          <div className="mt-2 pt-2 border-t border-zinc-600/30">
            <p className="text-xs text-zinc-400">
              Asked:{" "}
              {mentions.map((id, i) => (
                <span key={id}>
                  {i > 0 && ", "}
                  <span className={cn("font-medium", GRANDMAS[id].colors.primary)}>
                    {GRANDMAS[id].name}
                  </span>
                </span>
              ))}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
