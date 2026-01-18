"use client";

import { useState, useCallback, useMemo } from "react";
import { GrandmaId } from "@/lib/types";
import { filterGrandmasByPartial, getPartialMention, GrandmaMatch } from "@/lib/mention-utils";

/**
 * State and actions for the mention autocomplete system
 */
export interface MentionAutocompleteState {
  /** Whether the autocomplete dropdown is visible */
  isOpen: boolean;
  /** Index of the currently highlighted suggestion (0-based) */
  selectedIndex: number;
  /** The partial text after @ that's being used for filtering */
  partial: string;
  /** The position of the @ character in the input */
  triggerIndex: number;
  /** Filtered list of grandmas matching the partial text */
  filteredGrandmas: GrandmaMatch[];
}

/**
 * Result of handling a keyboard event
 */
export interface KeyDownResult {
  /** Whether the key was handled (caller should preventDefault if true) */
  handled: boolean;
  /** If a selection was made (Tab/Enter), the selected grandma */
  selected?: GrandmaMatch;
}

/**
 * Result of inserting a mention into text
 */
export interface InsertionResult {
  /** The new text with the mention inserted */
  newText: string;
  /** The new cursor position (after the inserted mention + space) */
  newCursorPosition: number;
}

/**
 * Actions for controlling the autocomplete
 */
export interface MentionAutocompleteActions {
  /** Open the autocomplete with the given partial text and trigger position */
  open: (partial: string, triggerIndex: number) => void;
  /** Close the autocomplete dropdown */
  close: () => void;
  /** Update the partial text for filtering */
  setPartial: (partial: string) => void;
  /** Move selection up (wraps to bottom) */
  selectPrevious: () => void;
  /** Move selection down (wraps to top) */
  selectNext: () => void;
  /** Set selection to a specific index */
  setSelectedIndex: (index: number) => void;
  /** Get the currently selected grandma (or null if none) */
  getSelectedGrandma: () => GrandmaMatch | null;
  /** Reset all state to initial values */
  reset: () => void;
  /**
   * Handle input text change - detects @ mentions and manages autocomplete state
   * Call this on every input change and cursor movement
   * @param text - Current input text
   * @param cursorPosition - Current cursor position (selectionStart)
   */
  handleInputChange: (text: string, cursorPosition: number) => void;
  /**
   * Handle keyboard events for autocomplete navigation
   * @param key - The key that was pressed (e.g., "ArrowUp", "Enter")
   * @returns Result indicating if handled and any selected grandma
   */
  handleKeyDown: (key: string) => KeyDownResult;
  /**
   * Insert a mention into text, replacing the @partial with @grandma-id + space
   * @param currentText - The current input text
   * @param grandma - The grandma to insert
   * @returns New text and cursor position, or null if no valid trigger
   */
  insertMention: (currentText: string, grandma: GrandmaMatch) => InsertionResult | null;
}

/**
 * Hook for managing mention autocomplete state
 *
 * This hook provides all the state management needed for the @mention
 * autocomplete dropdown, including:
 * - Open/close state
 * - Keyboard navigation (up/down selection)
 * - Filtered suggestions based on partial text
 *
 * @example
 * ```tsx
 * const { state, actions } = useMentionAutocomplete();
 *
 * // When user types @
 * actions.open("", cursorPosition);
 *
 * // As user continues typing @nan
 * actions.setPartial("nan");
 *
 * // Keyboard navigation
 * actions.selectNext(); // Arrow down
 * actions.selectPrevious(); // Arrow up
 *
 * // Get selected grandma for insertion
 * const grandma = actions.getSelectedGrandma();
 * ```
 */
export function useMentionAutocomplete(): {
  state: MentionAutocompleteState;
  actions: MentionAutocompleteActions;
} {
  // Core state
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [partial, setPartialState] = useState("");
  const [triggerIndex, setTriggerIndex] = useState(-1);

  // Compute filtered grandmas from partial text
  // Memoized to avoid recalculating on every render
  const filteredGrandmas = useMemo(
    () => (isOpen ? filterGrandmasByPartial(partial) : []),
    [isOpen, partial]
  );

  // Open autocomplete with initial state
  const open = useCallback((newPartial: string, newTriggerIndex: number) => {
    setIsOpen(true);
    setPartialState(newPartial);
    setTriggerIndex(newTriggerIndex);
    setSelectedIndex(0); // Reset selection when opening
  }, []);

  // Close autocomplete
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Update partial text (resets selection to 0)
  const setPartial = useCallback((newPartial: string) => {
    setPartialState(newPartial);
    setSelectedIndex(0); // Reset to first item when filter changes
  }, []);

  // Navigate to previous item (wraps around)
  const selectPrevious = useCallback(() => {
    setSelectedIndex((current) => {
      if (filteredGrandmas.length === 0) return 0;
      return current <= 0 ? filteredGrandmas.length - 1 : current - 1;
    });
  }, [filteredGrandmas.length]);

  // Navigate to next item (wraps around)
  const selectNext = useCallback(() => {
    setSelectedIndex((current) => {
      if (filteredGrandmas.length === 0) return 0;
      return current >= filteredGrandmas.length - 1 ? 0 : current + 1;
    });
  }, [filteredGrandmas.length]);

  // Get currently selected grandma
  const getSelectedGrandma = useCallback((): GrandmaMatch | null => {
    if (!isOpen || filteredGrandmas.length === 0) return null;
    return filteredGrandmas[selectedIndex] || null;
  }, [isOpen, filteredGrandmas, selectedIndex]);

  // Reset all state to initial values
  const reset = useCallback(() => {
    setIsOpen(false);
    setSelectedIndex(0);
    setPartialState("");
    setTriggerIndex(-1);
  }, []);

  /**
   * Handle input changes - detect @ mentions and manage autocomplete state
   * This should be called on:
   * - onChange: when text changes
   * - onSelect: when cursor moves (click or arrow keys in text)
   */
  const handleInputChange = useCallback(
    (text: string, cursorPosition: number) => {
      // Use getPartialMention to detect if we're in an @mention context
      const mentionResult = getPartialMention(text, cursorPosition);

      if (mentionResult) {
        // We're in an @mention context
        const { partial: detectedPartial, startIndex } = mentionResult;

        if (!isOpen) {
          // Open autocomplete with the detected partial
          setIsOpen(true);
          setTriggerIndex(startIndex);
          setPartialState(detectedPartial);
          setSelectedIndex(0);
        } else if (startIndex !== triggerIndex) {
          // Different @ trigger - reset for new mention
          setTriggerIndex(startIndex);
          setPartialState(detectedPartial);
          setSelectedIndex(0);
        } else {
          // Same @ trigger, just update the partial text
          setPartialState(detectedPartial);
          // Only reset selection if partial changed
          if (detectedPartial !== partial) {
            setSelectedIndex(0);
          }
        }
      } else {
        // Not in an @mention context - close if open
        if (isOpen) {
          setIsOpen(false);
        }
      }
    },
    [isOpen, triggerIndex, partial]
  );

  /**
   * Handle keyboard events for autocomplete navigation
   * Returns whether the key was handled (for preventDefault) and any selected grandma
   */
  const handleKeyDown = useCallback(
    (key: string): KeyDownResult => {
      // If autocomplete is not open, don't handle any keys
      if (!isOpen) {
        return { handled: false };
      }

      // If no suggestions, only handle Escape
      if (filteredGrandmas.length === 0) {
        if (key === "Escape") {
          setIsOpen(false);
          return { handled: true };
        }
        return { handled: false };
      }

      switch (key) {
        case "ArrowUp":
          // Navigate up (wraps to bottom)
          setSelectedIndex((current) =>
            current <= 0 ? filteredGrandmas.length - 1 : current - 1
          );
          return { handled: true };

        case "ArrowDown":
          // Navigate down (wraps to top)
          setSelectedIndex((current) =>
            current >= filteredGrandmas.length - 1 ? 0 : current + 1
          );
          return { handled: true };

        case "Tab":
        case "Enter": {
          // Select current suggestion
          const selected = filteredGrandmas[selectedIndex];
          if (selected) {
            setIsOpen(false);
            return { handled: true, selected };
          }
          return { handled: false };
        }

        case "Escape":
          // Close without selecting
          setIsOpen(false);
          return { handled: true };

        default:
          // Don't handle other keys - allow normal typing
          return { handled: false };
      }
    },
    [isOpen, filteredGrandmas, selectedIndex]
  );

  /**
   * Insert a mention into text, replacing @partial with @grandma-id + space
   * Works for mentions at any position in the text (not just end)
   */
  const insertMention = useCallback(
    (currentText: string, grandma: GrandmaMatch): InsertionResult | null => {
      // Need a valid trigger index to know where to insert
      if (triggerIndex < 0) {
        return null;
      }

      // The mention to insert (with trailing space for easy continuation)
      const mentionText = `@${grandma.id} `;

      // Calculate what we're replacing: from @ to end of partial
      // triggerIndex is the position of @
      // partial.length is how many chars after @
      const replaceStart = triggerIndex;
      const replaceEnd = triggerIndex + 1 + partial.length; // +1 for the @ itself

      // Build new text: before@ + mention + afterPartial
      const beforeMention = currentText.slice(0, replaceStart);
      const afterMention = currentText.slice(replaceEnd);
      const newText = beforeMention + mentionText + afterMention;

      // Cursor goes right after the inserted mention (after the space)
      const newCursorPosition = replaceStart + mentionText.length;

      // Close autocomplete after insertion
      setIsOpen(false);

      return {
        newText,
        newCursorPosition,
      };
    },
    [triggerIndex, partial]
  );

  return {
    state: {
      isOpen,
      selectedIndex,
      partial,
      triggerIndex,
      filteredGrandmas,
    },
    actions: {
      open,
      close,
      setPartial,
      selectPrevious,
      selectNext,
      setSelectedIndex,
      getSelectedGrandma,
      reset,
      handleInputChange,
      handleKeyDown,
      insertMention,
    },
  };
}

/**
 * Re-export types for convenience
 */
export type { GrandmaId, GrandmaMatch };
