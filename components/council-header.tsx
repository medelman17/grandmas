"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GRANDMAS, GRANDMA_IDS } from "@/lib/grandmas";

interface CouncilHeaderProps {
  isDebating: boolean;
}

export function CouncilHeader({ isDebating }: CouncilHeaderProps) {
  return (
    <div className="border-b border-white/5 bg-white/[0.02] backdrop-blur-xl">
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

            {/* Grandma avatars */}
            <div className="flex gap-1 sm:gap-1.5">
              {GRANDMA_IDS.map((id) => {
                const grandma = GRANDMAS[id];
                return (
                  <motion.div
                    key={id}
                    className="relative"
                    whileHover={{ scale: 1.15 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div
                      className={cn(
                        "relative w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center",
                        "bg-gradient-to-br shadow-md border border-white/10",
                        grandma.colors.gradient
                      )}
                      title={grandma.name}
                    >
                      <span className="text-[10px] sm:text-xs">{grandma.emoji}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Debating badge */}
          {isDebating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "px-2 sm:px-3 py-1.5 rounded-full text-xs font-medium",
                "bg-red-500/20 text-red-300 border border-red-500/30",
                "shadow-[0_0_20px_rgba(239,68,68,0.3)]"
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
