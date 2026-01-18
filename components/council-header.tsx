"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GRANDMAS, GRANDMA_IDS } from "@/lib/grandmas";
import { GrandmaId } from "@/lib/types";

interface CouncilHeaderProps {
  isDebating: boolean;
  unreadCounts: Record<GrandmaId, number>;
  onGrandmaClick: (grandmaId: GrandmaId) => void;
}

export function CouncilHeader({ isDebating, unreadCounts, onGrandmaClick }: CouncilHeaderProps) {
  return (
    <div className="border-b border-white/5 bg-zinc-900/95 backdrop-blur-xl">
      <div className="max-w-2xl mx-auto px-4 py-3">
        {/* Compact header row */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Title and avatars inline */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div>
              <h1 className="text-base sm:text-lg font-semibold text-white leading-tight">
                Counsel of Grandmas
              </h1>
              <p className="text-xs text-zinc-500">
                Always online • Always judging
              </p>
            </div>

            {/* Grandma avatars - clickable for private chat */}
            <div className="flex gap-1 sm:gap-1.5">
              {GRANDMA_IDS.map((id) => {
                const grandma = GRANDMAS[id];
                const unreadCount = unreadCounts[id] || 0;
                return (
                  <motion.button
                    key={id}
                    type="button"
                    className="relative"
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => onGrandmaClick(id)}
                    title={`Chat privately with ${grandma.name}`}
                  >
                    <div
                      className={cn(
                        "relative w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center",
                        "bg-gradient-to-br shadow-md border border-white/10 cursor-pointer",
                        "hover:shadow-lg transition-shadow",
                        grandma.colors.gradient
                      )}
                    >
                      <span className="text-[10px] sm:text-xs">{grandma.emoji}</span>
                    </div>

                    {/* Unread message badge */}
                    {unreadCount > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={cn(
                          "absolute -top-1 -right-1 min-w-[16px] h-[16px]",
                          "rounded-full bg-red-500 text-white text-[9px] font-bold",
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
            </div>
          </div>

          {/* Debating badge - compact on mobile, just a pulsing dot */}
          {isDebating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "shrink-0 rounded-full text-xs font-medium",
                "bg-red-500/20 text-red-300 border border-red-500/30",
                "shadow-[0_0_20px_rgba(239,68,68,0.3)]",
                // Compact on mobile, expanded on desktop
                "p-1.5 sm:px-3 sm:py-1.5"
              )}
            >
              <span className="inline-flex items-center gap-2">
                <motion.span
                  className="w-2 h-2 rounded-full bg-red-400"
                  animate={{ opacity: [1, 0.4, 1], scale: [1, 0.9, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="hidden sm:inline">DEBATING</span>
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
