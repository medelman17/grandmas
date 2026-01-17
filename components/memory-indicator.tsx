"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { GRANDMAS } from "@/lib/grandmas";
import { MemoryActivity } from "@/lib/types";

interface MemoryIndicatorsProps {
  memoryActivities: MemoryActivity[];
}

/**
 * Pulsing glow animation for the "thinking" effect
 * Distinct from typing dots - represents cognitive/memory activity
 */
function PulsingGlow({ className }: { className?: string }) {
  return (
    <motion.span
      className={cn(
        "inline-block w-2 h-2 rounded-full bg-current",
        className
      )}
      animate={{
        opacity: [0.4, 1, 0.4],
        scale: [0.9, 1.1, 0.9],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

export function MemoryIndicators({ memoryActivities }: MemoryIndicatorsProps) {
  if (memoryActivities.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <AnimatePresence mode="popLayout">
        {memoryActivities.map(({ grandmaId, type, toolCallId }, index) => {
          const grandma = GRANDMAS[grandmaId];
          const activityText = type === "searching" ? "remembering..." : "saving memory...";
          const activityIcon = type === "searching" ? "🧠" : "💾";

          return (
            <motion.div
              key={toolCallId}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
                delay: index * 0.05,
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full",
                "bg-white/[0.03] backdrop-blur-sm",
                "border border-white/[0.08]",
                grandma.colors.glow
              )}
            >
              {/* Activity icon */}
              <span className="text-sm">{activityIcon}</span>

              {/* Avatar */}
              <div
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center",
                  "bg-gradient-to-br",
                  grandma.colors.gradient
                )}
              >
                <span className="text-[10px]">{grandma.emoji}</span>
              </div>

              {/* Name + activity */}
              <span className={cn("text-xs font-medium", grandma.colors.primary)}>
                {grandma.name}
              </span>
              <span className="text-xs text-zinc-400">{activityText}</span>

              {/* Pulsing indicator */}
              <PulsingGlow className={grandma.colors.primary} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
