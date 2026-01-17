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
      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Title */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-semibold text-white">
              Counsel of Grandmas
            </h1>
            <p className="text-sm text-zinc-500">
              5 grandmas • Always online • Always judging
            </p>
          </div>

          {/* Debating badge */}
          {isDebating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium",
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
                DEBATING
              </span>
            </motion.div>
          )}
        </div>

        {/* Grandma avatars */}
        <div className="flex gap-2">
          {GRANDMA_IDS.map((id) => {
            const grandma = GRANDMAS[id];
            return (
              <motion.div
                key={id}
                className="relative"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                {/* Glow ring on hover */}
                <motion.div
                  className={cn(
                    "absolute inset-[-4px] rounded-full opacity-0",
                    "bg-gradient-to-br",
                    grandma.colors.gradient
                  )}
                  whileHover={{ opacity: 0.3 }}
                  style={{ filter: "blur(8px)" }}
                />

                {/* Avatar */}
                <div
                  className={cn(
                    "relative w-9 h-9 rounded-full flex items-center justify-center",
                    "bg-gradient-to-br shadow-lg border border-white/10",
                    grandma.colors.gradient
                  )}
                  title={grandma.name}
                >
                  <span className="text-sm">{grandma.emoji}</span>

                  {/* Online indicator */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0a0a0f]" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
