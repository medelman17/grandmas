"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { GRANDMAS } from "@/lib/grandmas";
import { GrandmaMatch } from "@/lib/mention-utils";

interface MentionDropdownProps {
  /** Whether the dropdown is visible */
  isOpen: boolean;
  /** List of grandma suggestions to display */
  suggestions: GrandmaMatch[];
  /** Index of the currently selected/highlighted item */
  selectedIndex: number;
  /** Callback when a suggestion is clicked */
  onSelect: (grandma: GrandmaMatch) => void;
  /** Callback when mouse hovers over an item (for updating selection) */
  onHover?: (index: number) => void;
}

/**
 * Dropdown component for @mention autocomplete suggestions
 * Displays a list of grandmas with emoji, name, and @id
 * Positioned above the input to avoid mobile keyboard overlap
 */
export function MentionDropdown({
  isOpen,
  suggestions,
  selectedIndex,
  onSelect,
  onHover,
}: MentionDropdownProps) {
  // Don't render if closed or no suggestions
  if (!isOpen || suggestions.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={cn(
            // Position above input
            "absolute bottom-full left-0 right-0 mb-2",
            // Container styling
            "rounded-xl overflow-hidden",
            "bg-zinc-900/95 backdrop-blur-xl",
            "border border-white/[0.08]",
            "shadow-xl shadow-black/40",
            // Max height with scroll
            "max-h-[200px] overflow-y-auto",
            // Z-index to appear above input
            "z-50"
          )}
        >
          <ul className="py-1" role="listbox">
            {suggestions.map((grandma, index) => {
              const isSelected = index === selectedIndex;
              const colors = GRANDMAS[grandma.id].colors;

              return (
                <li key={grandma.id} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => onSelect(grandma)}
                    onMouseEnter={() => onHover?.(index)}
                    className={cn(
                      "w-full px-3 py-2 flex items-center gap-3",
                      "transition-colors duration-100",
                      "text-left cursor-pointer",
                      // Selected state
                      isSelected
                        ? "bg-white/[0.08]"
                        : "hover:bg-white/[0.04]"
                    )}
                  >
                    {/* Emoji avatar */}
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        "bg-gradient-to-br",
                        colors.gradient
                      )}
                    >
                      <span className="text-sm">{grandma.emoji}</span>
                    </div>

                    {/* Name and @id */}
                    <div className="flex-1 min-w-0">
                      <div className={cn("text-sm font-medium", colors.primary)}>
                        {grandma.name}
                      </div>
                      <div className="text-xs text-zinc-500">
                        @{grandma.id}
                      </div>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          "bg-gradient-to-br",
                          colors.gradient
                        )}
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
