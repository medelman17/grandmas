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
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
      className="flex gap-3"
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            "bg-gradient-to-br shadow-lg border border-white/10",
            grandma.colors.gradient,
            isStreaming && grandma.colors.glow
          )}
        >
          <span className="text-lg">{grandma.emoji}</span>
        </div>

        {/* Streaming indicator ring */}
        {isStreaming && (
          <motion.div
            className={cn(
              "absolute inset-[-3px] rounded-full",
              "bg-gradient-to-br opacity-50",
              grandma.colors.gradient
            )}
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ filter: "blur(4px)", zIndex: -1 }}
          />
        )}
      </div>

      {/* Message bubble */}
      <div className="flex-1 min-w-0">
        {/* Name and reply indicator */}
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("text-sm font-medium", grandma.colors.primary)}>
            {grandma.name}
          </span>
          {target && (
            <span className="text-xs text-zinc-500">
              → replying to{" "}
              <span className={target.colors.primary}>{target.name}</span>
            </span>
          )}
          {isStreaming && (
            <motion.div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    grandma.colors.gradient
                      .replace("from-", "bg-")
                      .split(" ")[0]
                  )}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div
          className={cn(
            "relative rounded-2xl rounded-tl-sm px-4 py-3",
            "bg-white/[0.03] backdrop-blur-sm",
            "border border-white/[0.06]",
            "overflow-hidden"
          )}
        >
          {/* Subtle gradient overlay */}
          <div
            className={cn(
              "absolute inset-0 opacity-30",
              "bg-gradient-to-br",
              grandma.colors.gradient
            )}
            style={{
              maskImage:
                "radial-gradient(ellipse 80% 60% at 0% 0%, black, transparent)",
              WebkitMaskImage:
                "radial-gradient(ellipse 80% 60% at 0% 0%, black, transparent)",
            }}
          />

          <p className={cn("relative text-sm leading-relaxed", grandma.colors.text)}>
            {content || (
              <span className="text-zinc-500 italic">Thinking...</span>
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
