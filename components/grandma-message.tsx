"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GRANDMAS } from "@/lib/grandmas";
import { GrandmaId } from "@/lib/types";

interface GrandmaMessageProps {
  content: string;
  grandmaId: GrandmaId;
  replyingTo?: GrandmaId;
  isStreaming?: boolean;
}

export function GrandmaMessage({
  content,
  grandmaId,
  replyingTo,
  isStreaming,
}: GrandmaMessageProps) {
  const grandma = GRANDMAS[grandmaId];
  const target = replyingTo ? GRANDMAS[replyingTo] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex gap-3"
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
          "bg-gradient-to-br shadow-md",
          grandma.colors.gradient
        )}
      >
        <span className="text-lg">{grandma.emoji}</span>
      </div>

      {/* Message bubble */}
      <div className="flex-1 min-w-0">
        {/* Name and reply indicator */}
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("text-sm font-medium", grandma.colors.text)}>
            {grandma.name}
          </span>
          {target && (
            <span className="text-xs text-gray-500">
              → replying to {target.name}
            </span>
          )}
          {isStreaming && (
            <motion.span
              className={cn("w-2 h-2 rounded-full", grandma.colors.gradient.replace("from-", "bg-").split(" ")[0])}
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </div>

        {/* Content */}
        <div
          className={cn(
            "rounded-2xl rounded-tl-sm px-4 py-2",
            "border",
            grandma.colors.bg,
            grandma.colors.border
          )}
        >
          <p className={cn("text-sm leading-relaxed", grandma.colors.text)}>
            {content || (
              <span className="text-gray-400 italic">Thinking...</span>
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
