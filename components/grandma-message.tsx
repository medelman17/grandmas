"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GRANDMAS } from "@/lib/grandmas";
import { GrandmaId } from "@/lib/types";
import { Markdown } from "./markdown";

interface GrandmaMessageProps {
  content: string;
  grandmaId: GrandmaId;
  replyingTo?: GrandmaId;
  /** The content of the message being replied to (for quote preview) */
  replyingToContent?: string;
  isStreaming?: boolean;
}

export function GrandmaMessage({
  content,
  grandmaId,
  replyingTo,
  replyingToContent,
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

        {/* Quote preview for replies - iMessage style */}
        {target && replyingToContent && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="relative mb-2"
          >
            {/* Thread connector line */}
            <div
              className={cn(
                "absolute left-3 -bottom-2 w-0.5 h-2 rounded-full opacity-40",
                target.colors.gradient.replace("from-", "bg-").split(" ")[0]
              )}
            />

            {/* Quote bubble */}
            <div
              className={cn(
                "relative pl-3 py-2 pr-3 rounded-xl rounded-bl-sm",
                "bg-white/[0.02] border border-white/[0.04]",
                "before:absolute before:left-0 before:top-0 before:bottom-0",
                "before:w-0.5 before:rounded-full",
                target.colors.gradient.replace("from-", "before:bg-").split(" ")[0]
              )}
            >
              <span className={cn("text-[10px] font-medium block mb-0.5 opacity-70", target.colors.primary)}>
                {target.name}
              </span>
              <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                {replyingToContent}
              </p>
            </div>
          </motion.div>
        )}

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

          <div className={cn("relative text-sm leading-relaxed", grandma.colors.text)}>
            {content ? (
              <Markdown content={content} className="[&>p]:my-0" />
            ) : (
              <span className="text-zinc-500 italic">Thinking...</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
