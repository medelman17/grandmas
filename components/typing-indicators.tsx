"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { GRANDMAS } from "@/lib/grandmas";
import { TypingState } from "@/lib/types";

interface TypingIndicatorsProps {
  typingGrandmas: TypingState[];
}

function BouncingDots() {
  return (
    <div className="flex gap-1">
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
        {typingGrandmas.map(({ grandmaId, replyingTo }) => {
          const grandma = GRANDMAS[grandmaId];
          const target = replyingTo ? GRANDMAS[replyingTo] : null;

          return (
            <motion.div
              key={grandmaId}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full",
                "border shadow-sm",
                grandma.colors.bg,
                grandma.colors.border,
                grandma.colors.text
              )}
            >
              <span className="text-sm">{grandma.emoji}</span>
              <span className="text-xs font-medium">{grandma.name}</span>
              {target && (
                <span className="text-xs opacity-70">→ {target.name}</span>
              )}
              <BouncingDots />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
