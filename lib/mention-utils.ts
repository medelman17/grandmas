import { GrandmaId } from "./types";
import { GRANDMA_IDS, GRANDMAS } from "./grandmas";

/**
 * Result from filtering grandmas by partial match
 * Used for autocomplete dropdown display
 */
export interface GrandmaMatch {
  id: GrandmaId;
  name: string;
  emoji: string;
}

/**
 * Result from detecting a partial mention at cursor position
 * Used to determine when to show autocomplete
 */
export interface PartialMention {
  /** The partial text after the @ symbol */
  partial: string;
  /** The index of the @ symbol in the text */
  startIndex: number;
}

/**
 * Regex pattern that matches exact @mentions for grandma IDs
 * Built dynamically from GRANDMA_IDS for maintainability
 * Used for rendering badges where we need exact matches
 */
export const MENTION_PATTERN = new RegExp(
  `@(${GRANDMA_IDS.join("|")})`,
  "gi"
);

/**
 * Regex pattern that captures any @word for fuzzy matching
 * Matches @word patterns where word is alphanumeric with hyphens
 * Must be followed by word boundary (space, punctuation, or end of string)
 */
export const FUZZY_MENTION_PATTERN = /@([a-zA-Z][a-zA-Z0-9-]*)(?=\s|[.,!?;:]|$)/g;

/**
 * Resolve a partial mention to the best matching grandma ID
 * Uses the same logic as autocomplete filtering
 *
 * @param partial - The text after @ (e.g., "abuela" from "@abuela")
 * @returns The matching GrandmaId or null if no match
 */
export function resolvePartialMention(partial: string): GrandmaId | null {
  const normalizedPartial = partial.toLowerCase();

  // First try exact ID match
  if (GRANDMA_IDS.includes(normalizedPartial as GrandmaId)) {
    return normalizedPartial as GrandmaId;
  }

  // Then try fuzzy matching (same logic as filterGrandmasByPartial)
  const matches = GRANDMA_IDS.filter((id) => {
    const grandma = GRANDMAS[id];
    const normalizedName = grandma.name.toLowerCase();
    // Match if partial is found in ID or display name
    return (
      id.includes(normalizedPartial) || normalizedName.includes(normalizedPartial)
    );
  });

  // Return first match if exactly one, or null if ambiguous/none
  // If multiple matches, prefer exact prefix match on ID
  if (matches.length === 1) {
    return matches[0];
  }

  if (matches.length > 1) {
    // Prefer ID that starts with the partial
    const prefixMatch = matches.find((id) => id.startsWith(normalizedPartial));
    if (prefixMatch) return prefixMatch;

    // Or name that starts with the partial
    const nameMatch = matches.find((id) =>
      GRANDMAS[id].name.toLowerCase().startsWith(normalizedPartial)
    );
    if (nameMatch) return nameMatch;

    // Fall back to first match
    return matches[0];
  }

  return null;
}

/**
 * Parse all @mentions from text and return unique grandma IDs
 * Supports both exact matches (@abuela-carmen) and fuzzy matches (@abuela)
 *
 * @param text - The text to parse for mentions
 * @returns Array of unique GrandmaId values found in the text
 *
 * @example
 * parseMentions("Hey @nana-ruth and @Abuela-Carmen!")
 * // Returns: ["nana-ruth", "abuela-carmen"]
 *
 * @example
 * parseMentions("Hi @abuela what's up") // fuzzy match
 * // Returns: ["abuela-carmen"]
 *
 * @example
 * parseMentions("@ba @ba please help")
 * // Returns: ["ba-nguyen"] (deduped, fuzzy matched)
 */
export function parseMentions(text: string): GrandmaId[] {
  const ids = new Set<GrandmaId>();

  // Use fuzzy pattern to capture all @mentions
  const matches = text.matchAll(FUZZY_MENTION_PATTERN);

  for (const match of matches) {
    const partial = match[1];
    const resolved = resolvePartialMention(partial);
    if (resolved) {
      ids.add(resolved);
    }
  }

  return Array.from(ids);
}

/**
 * Detect if there's a partial @mention at the cursor position
 * Used by autocomplete to determine what the user is currently typing
 *
 * @param text - The full text content
 * @param cursorPosition - The current cursor position (0-indexed)
 * @returns PartialMention object if found, null otherwise
 *
 * @example
 * getPartialMention("Hello @nan", 10) // cursor at end
 * // Returns: { partial: "nan", startIndex: 6 }
 *
 * @example
 * getPartialMention("Hello @", 7) // just typed @
 * // Returns: { partial: "", startIndex: 6 }
 *
 * @example
 * getPartialMention("Hello world", 11) // no @ before cursor
 * // Returns: null
 */
export function getPartialMention(
  text: string,
  cursorPosition: number
): PartialMention | null {
  // Get the text from start up to cursor position
  const textBeforeCursor = text.slice(0, cursorPosition);

  // Find the last @ symbol before the cursor
  const lastAtIndex = textBeforeCursor.lastIndexOf("@");

  if (lastAtIndex === -1) {
    return null;
  }

  // Get the text after the @ symbol
  const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);

  // Check if there's a space or other word-breaking character between @ and cursor
  // If so, this isn't an active mention (user has moved on)
  // Valid mention characters: alphanumeric and hyphen (for IDs like "ba-nguyen")
  if (!/^[a-zA-Z0-9-]*$/.test(textAfterAt)) {
    return null;
  }

  // Check if the @ is preceded by a space or is at the start (word boundary)
  // This prevents matching email addresses like "test@example.com"
  if (lastAtIndex > 0 && !/\s/.test(textBeforeCursor[lastAtIndex - 1])) {
    return null;
  }

  return {
    partial: textAfterAt.toLowerCase(),
    startIndex: lastAtIndex,
  };
}

/**
 * Filter grandmas whose ID or display name contains the partial string
 * Used for autocomplete dropdown to show matching options
 *
 * @param partial - The partial string to match against (case-insensitive)
 * @returns Array of matching grandmas with their display info
 *
 * @example
 * filterGrandmasByPartial("nan")
 * // Returns: [{ id: "nana-ruth", name: "Nana Ruth", emoji: "👓" }]
 *
 * @example
 * filterGrandmasByPartial("") // empty string matches all
 * // Returns: all 5 grandmas
 *
 * @example
 * filterGrandmasByPartial("carmen")
 * // Returns: [{ id: "abuela-carmen", name: "Abuela Carmen", emoji: "🌶️" }]
 */
export function filterGrandmasByPartial(partial: string): GrandmaMatch[] {
  const normalizedPartial = partial.toLowerCase();

  return GRANDMA_IDS.filter((id) => {
    const grandma = GRANDMAS[id];
    const normalizedName = grandma.name.toLowerCase();

    // Match if the partial is found in either the ID or the display name
    return (
      id.includes(normalizedPartial) || normalizedName.includes(normalizedPartial)
    );
  }).map((id) => ({
    id,
    name: GRANDMAS[id].name,
    emoji: GRANDMAS[id].emoji,
  }));
}
