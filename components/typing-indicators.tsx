"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { GRANDMAS } from "@/lib/grandmas";
import { TypingState } from "@/lib/types";

interface TypingIndicatorsProps {
  typingGrandmas: TypingState[];
}

function BouncingDots({ className }: { className?: string }) {
  return (
    <div className={cn("flex gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-current"
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
}

export function TypingIndicators({ typingGrandmas }: TypingIndicatorsProps) {
  if (typingGrandmas.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <AnimatePresence mode="popLayout">
        {typingGrandmas.map(({ grandmaId, replyingTo }, index) => {
          const grandma = GRANDMAS[grandmaId];
          const target = replyingTo ? GRANDMAS[replyingTo] : null;

          return (
            <motion.div
              key={grandmaId}
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
              {/* Avatar */}
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center",
                  "bg-gradient-to-br",
                  grandma.colors.gradient
                )}
              >
                <span className="text-xs">{grandma.emoji}</span>
              </div>

              {/* Name */}
              <span className={cn("text-xs font-medium", grandma.colors.primary)}>
                {grandma.name}
              </span>

              {/* Reply target */}
              {target && (
                <span className="text-xs text-zinc-500">
                  → <span className={target.colors.primary}>{target.name}</span>
                </span>
              )}

              {/* Dots */}
              <BouncingDots className={grandma.colors.primary} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
