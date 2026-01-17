"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useCounsel } from "@/hooks/use-counsel";
import { CouncilHeader } from "./council-header";
import { UserMessage } from "./user-message";
import { GrandmaMessage } from "./grandma-message";
import { TypingIndicators } from "./typing-indicators";
import { ChatInput } from "./chat-input";
import { GRANDMA_IDS, GRANDMAS } from "@/lib/grandmas";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
} as const;

const avatarVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.8 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 15,
    },
  },
};

export function CounselChat() {
  const {
    messages,
    typingGrandmas,
    isDebating,
    isLoading,
    hasQueuedDebates,
    sendQuestion,
    continueDebate,
    endDebate,
  } = useCounsel();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  // Use requestAnimationFrame to batch scroll updates when multiple state changes
  // happen in quick succession (e.g., 5 typing indicators appearing)
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, typingGrandmas]);

  return (
    <div className="flex flex-col h-screen ambient-gradient relative noise-overlay">
      {/* Header */}
      <CouncilHeader isDebating={isDebating} />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {/* Empty state */}
          {messages.length === 0 && (
            <div className="text-center py-16">
              <motion.div
                className="flex justify-center gap-3 mb-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {GRANDMA_IDS.map((id) => {
                  const grandma = GRANDMAS[id];
                  return (
                    <motion.div
                      key={id}
                      variants={avatarVariants}
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        "bg-gradient-to-br shadow-lg",
                        grandma.colors.gradient,
                        grandma.colors.glow
                      )}
                    >
                      <span
                        className="text-xl"
                        role="img"
                        aria-label={grandma.name}
                      >
                        {grandma.emoji}
                      </span>
                    </motion.div>
                  );
                })}
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-xl font-medium text-white mb-3"
              >
                The council awaits your question
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-zinc-400 text-sm max-w-md mx-auto"
              >
                Five wise grandmas with very different perspectives are ready to
                give you advice. Ask them anything about life, love, career, or
                that thing you&apos;re definitely overthinking.
              </motion.p>
            </div>
          )}

          {/* Messages - wrapped in message-item for content-visibility optimization */}
          {messages.map((message) => {
            if (message.type === "user") {
              return (
                <div key={message.id} className="message-item">
                  <UserMessage content={message.content} />
                </div>
              );
            }

            if (message.type === "grandma" && message.grandmaId) {
              return (
                <div key={message.id} className="message-item">
                  <GrandmaMessage
                    content={message.content}
                    grandmaId={message.grandmaId}
                    replyingTo={message.replyingTo}
                    isStreaming={message.isStreaming}
                  />
                </div>
              );
            }

            if (message.type === "system") {
              return (
                <div
                  key={message.id}
                  className={cn(
                    "message-item text-center py-2 text-sm text-zinc-500",
                    "border-y border-white/5 bg-white/[0.02]"
                  )}
                >
                  {message.content}
                </div>
              );
            }

            return null;
          })}

          {/* Typing indicators */}
          {typingGrandmas.length > 0 && (
            <div className="py-2">
              <TypingIndicators typingGrandmas={typingGrandmas} />
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input / Debate Controls */}
      <ChatInput
        onSubmit={sendQuestion}
        isLoading={isLoading}
        hasMessages={messages.length > 0}
        isDebating={isDebating}
        hasQueuedDebates={hasQueuedDebates}
        onContinueDebate={continueDebate}
        onEndDebate={endDebate}
      />
    </div>
  );
}
