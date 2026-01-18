"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useCounsel, UseCounselOptions } from "@/hooks/use-counsel";
import { usePrivateMessages } from "@/hooks/use-private-messages";
import { useAllianceQueue } from "@/hooks/use-alliance-queue";
import { useUserId } from "@/hooks/use-user-id";
import { CouncilHeader } from "./council-header";
import { PrivateChatModal } from "./private-chat-modal";
import { UserMessage } from "./user-message";
import { GrandmaMessage } from "./grandma-message";
import { TypingIndicators } from "./typing-indicators";
import { MemoryIndicators } from "./memory-indicator";
import { ChatInput } from "./chat-input";
import { GRANDMA_IDS, GRANDMAS } from "@/lib/grandmas";
import { cn } from "@/lib/utils";
import { GrandmaId, CounselMessage, AllianceTrigger } from "@/lib/types";
import { Markdown } from "./markdown";
import { SummaryPrompt } from "./summary-prompt";
import { ScrollToBottomButton } from "./scroll-to-bottom-button";

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

  // Group messages state - will be populated by useCounsel
  // We need to track this for private chat context
  const [groupMessages, setGroupMessages] = useState<CounselMessage[]>([]);

  // Private messaging hook - receives group messages for context
  const privateMessagesOptions = useMemo(() => ({
    userId,
    groupMessages,
  }), [userId, groupMessages]);

  const {
    conversations,
    activeGrandma,
    memoryActivities: privateMemoryActivities,
    isLoading: isPrivateLoading,
    unreadCounts,
    openPrivateChat,
    closePrivateChat,
    sendPrivateMessage,
    triggerProactiveMessage,
    triggerAllianceMessage,
  } = usePrivateMessages(privateMessagesOptions);

  // Create proactive message callback
  // Uses useCallback to prevent unnecessary re-renders of useCounsel
  const handleProactiveMessageTrigger = useCallback(
    (grandmaId: GrandmaId, groupTranscript: string, reason: string) => {
      console.log(`[CounselChat] Proactive trigger from ${grandmaId}: ${reason}`);
      triggerProactiveMessage(grandmaId, groupTranscript, reason);
    },
    [triggerProactiveMessage]
  );

  // Alliance gossip delivery callback - called when a queued alliance message is ready
  // Uses the dedicated triggerAllianceMessage function from the private messages hook
  const deliverAllianceGossip = useCallback(
    async (trigger: AllianceTrigger) => {
      console.log(
        `[CounselChat] Delivering alliance gossip from ${trigger.fromGrandma} about ${trigger.aboutGrandma}`
      );
      await triggerAllianceMessage(trigger);
    },
    [triggerAllianceMessage]
  );

  // Alliance queue hook - manages delayed delivery of gossip messages
  const { addTriggers: addAllianceTriggers } = useAllianceQueue(deliverAllianceGossip);

  // Create alliance triggers callback for useCounsel
  const handleAllianceTriggers = useCallback(
    (triggers: AllianceTrigger[]) => {
      console.log(`[CounselChat] Received ${triggers.length} alliance trigger(s)`);
      addAllianceTriggers(triggers);
    },
    [addAllianceTriggers]
  );

  // Memoize counsel options to prevent unnecessary hook re-runs
  const counselOptions = useMemo<UseCounselOptions>(
    () => ({
      userId,
      onProactiveMessageTrigger: handleProactiveMessageTrigger,
      onAllianceTriggers: handleAllianceTriggers,
    }),
    [userId, handleProactiveMessageTrigger, handleAllianceTriggers]
  );

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
  } = useCounsel(counselOptions);

  // Sync group messages to state for private chat context
  // Using useEffect to avoid render-phase state updates
  useEffect(() => {
    setGroupMessages(messages);
  }, [messages]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  /**
   * Check if scroll position is near the bottom of the container.
   * Uses a threshold of 100px to account for small variations.
   */
  const checkIfAtBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return true;
    const threshold = 100;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom < threshold;
  }, []);

  /**
   * Handle scroll events to track user scroll position.
   */
  const handleScroll = useCallback(() => {
    setIsAtBottom(checkIfAtBottom());
  }, [checkIfAtBottom]);

  /**
   * Scroll to the bottom of the messages container.
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    setIsAtBottom(true);
  }, []);

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

  // Auto-scroll to bottom on new messages, but only if user hasn't scrolled up
  // Use requestAnimationFrame to batch scroll updates when multiple state changes
  // happen in quick succession (e.g., 5 typing indicators appearing)
  useEffect(() => {
    // Only auto-scroll if user is already at the bottom
    if (!isAtBottom) return;

    const frame = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, typingGrandmas, memoryActivities, isAtBottom]);

  return (
    <div className="fixed inset-0 flex flex-col ambient-gradient noise-overlay">
      {/* Header - sticky with safe area */}
      <div className="shrink-0 safe-top">
        <CouncilHeader
          isDebating={isDebating}
          unreadCounts={unreadCounts}
          onGrandmaClick={openPrivateChat}
        />
      </div>

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto relative min-h-0"
      >
        <div className="max-w-2xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6 pb-4 space-y-3 sm:space-y-4">
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

        {/* Scroll to bottom button - appears when user scrolls up */}
        <ScrollToBottomButton
          visible={!isAtBottom && messages.length > 0}
          onClick={scrollToBottom}
        />
      </div>

      {/* Bottom section - always visible */}
      <div className="shrink-0 safe-bottom">
        {/* Initial typing/memory indicators - pinned above input */}
        {(typingGrandmas.length > 0 && !typingGrandmas.some((t) => t.replyingTo)) && (
          <div className="px-4 py-2 flex flex-col items-center gap-2 bg-zinc-900/80 backdrop-blur-sm">
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

      {/* Private Chat Modal */}
      <PrivateChatModal
        grandmaId={activeGrandma}
        conversation={activeGrandma ? conversations[activeGrandma] : null}
        memoryActivities={privateMemoryActivities}
        isLoading={isPrivateLoading}
        onSendMessage={sendPrivateMessage}
        onClose={closePrivateChat}
      />
    </div>
  );
}
