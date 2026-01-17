"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useCounsel } from "@/hooks/use-counsel";
import { useUserId } from "@/hooks/use-user-id";
import { CouncilHeader } from "./council-header";
import { UserMessage } from "./user-message";
import { GrandmaMessage } from "./grandma-message";
import { TypingIndicators } from "./typing-indicators";
import { MemoryIndicators } from "./memory-indicator";
import { ChatInput } from "./chat-input";
import { GRANDMA_IDS, GRANDMAS } from "@/lib/grandmas";
import { cn } from "@/lib/utils";
import { CounselMessage, GrandmaId } from "@/lib/types";
import { Markdown } from "./markdown";
import { SummaryPrompt } from "./summary-prompt";

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
  // Get persistent anonymous user ID for memory features
  const { userId } = useUserId();

  const {
    messages,
    typingGrandmas,
    memoryActivities,
    isDebating,
    isLoading,
    hasQueuedDebates,
    debatePauseReason,
    showSummaryPrompt,
    isGeneratingSummary,
    sendQuestion,
    continueDebate,
    endDebate,
    requestMeetingSummary,
    dismissSummaryPrompt,
  } = useCounsel(userId);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Find the most recent message from a specific grandma before a given index.
   * Used to get the content being replied to for the quote preview.
   */
  const findReplyingToContent = useCallback(
    (replyingTo: GrandmaId, beforeIndex: number): string | undefined => {
      // Search backwards from the message before the current one
      for (let i = beforeIndex - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg.type === "grandma" && msg.grandmaId === replyingTo && msg.content) {
          return msg.content;
        }
      }
      return undefined;
    },
    [messages]
  );

  // Auto-scroll to bottom on new messages
  // Use requestAnimationFrame to batch scroll updates when multiple state changes
  // happen in quick succession (e.g., 5 typing indicators appearing)
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, typingGrandmas, memoryActivities]);

  return (
    <div className="flex flex-col h-screen ambient-gradient relative noise-overlay">
      {/* Header */}
      <CouncilHeader isDebating={isDebating} />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-4 space-y-4">
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
          {messages.map((message, index) => {
            if (message.type === "user") {
              return (
                <div key={message.id} className="message-item">
                  <UserMessage content={message.content} />
                </div>
              );
            }

            if (message.type === "grandma" && message.grandmaId) {
              // Get the content of the message being replied to for quote preview
              const replyingToContent = message.replyingTo
                ? findReplyingToContent(message.replyingTo, index)
                : undefined;

              return (
                <div key={message.id} className="message-item">
                  <GrandmaMessage
                    content={message.content}
                    grandmaId={message.grandmaId}
                    replyingTo={message.replyingTo}
                    replyingToContent={replyingToContent}
                    isStreaming={message.isStreaming}
                  />
                </div>
              );
            }

            if (message.type === "system") {
              const isMeetingSummary = message.content.includes("COUNCIL MEETING MINUTES");
              return (
                <div
                  key={message.id}
                  className={cn(
                    "message-item",
                    isMeetingSummary
                      ? "py-4 px-4 text-sm text-zinc-300 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.15)] text-left"
                      : "text-center py-2 text-sm text-zinc-500 border-y border-white/5 bg-white/[0.02]"
                  )}
                >
                  {isMeetingSummary ? (
                    <Markdown content={message.content} />
                  ) : (
                    message.content
                  )}
                </div>
              );
            }

            return null;
          })}

          {/* Debate typing/memory indicators - inline with messages */}
          {(typingGrandmas.some((t) => t.replyingTo) || memoryActivities.length > 0) && (
            <div className="py-2 space-y-2">
              {typingGrandmas.length > 0 && typingGrandmas.some((t) => t.replyingTo) && (
                <TypingIndicators typingGrandmas={typingGrandmas} />
              )}
              {memoryActivities.length > 0 && (
                <MemoryIndicators memoryActivities={memoryActivities} />
              )}
            </div>
          )}

          {/* Summary prompt after gaveling */}
          {(showSummaryPrompt || isGeneratingSummary) && (
            <div className="py-4">
              <SummaryPrompt
                onRequestSummary={requestMeetingSummary}
                onDismiss={dismissSummaryPrompt}
                isGenerating={isGeneratingSummary}
              />
            </div>
          )}

          {/* Scroll anchor with buffer space for input area */}
          <div ref={messagesEndRef} className="h-24" />
        </div>
      </div>

      {/* Initial typing/memory indicators - pinned above input */}
      {(typingGrandmas.length > 0 && !typingGrandmas.some((t) => t.replyingTo)) && (
        <div className="px-4 py-3 flex flex-col items-center gap-2">
          <TypingIndicators typingGrandmas={typingGrandmas} />
          {memoryActivities.length > 0 && (
            <MemoryIndicators memoryActivities={memoryActivities} />
          )}
        </div>
      )}

      {/* Input / Debate Controls */}
      <ChatInput
        onSubmit={sendQuestion}
        isLoading={isLoading}
        hasMessages={messages.length > 0}
        isDebating={isDebating}
        hasQueuedDebates={hasQueuedDebates}
        debatePauseReason={debatePauseReason}
        onContinueDebate={continueDebate}
        onEndDebate={endDebate}
      />
    </div>
  );
}
