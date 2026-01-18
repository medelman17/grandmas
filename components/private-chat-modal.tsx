"use client";

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { GRANDMAS } from "@/lib/grandmas";
import {
  GrandmaId,
  PrivateConversation,
  PrivateMessage,
  MemoryActivity,
} from "@/lib/types";

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z"
      />
    </svg>
  );
}

interface PrivateChatModalProps {
  grandmaId: GrandmaId | null;
  conversation: PrivateConversation | null;
  memoryActivities: MemoryActivity[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onClose: () => void;
}

/**
 * Bouncing dots typing indicator
 */
function TypingDots({ className }: { className?: string }) {
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

/**
 * Empty state when starting a new private conversation
 */
function EmptyState({ grandmaId }: { grandmaId: GrandmaId }) {
  const grandma = GRANDMAS[grandmaId];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full text-center px-6"
    >
      <div
        className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center mb-4",
          "bg-gradient-to-br shadow-lg",
          grandma.colors.gradient
        )}
      >
        <span className="text-4xl">{grandma.emoji}</span>
      </div>
      <h3 className={cn("text-lg font-semibold mb-2", grandma.colors.primary)}>
        Chat with {grandma.name}
      </h3>
      <p className="text-sm text-zinc-500 max-w-xs">
        This is a private conversation between just you and{" "}
        {grandma.name.split(" ")[0]}. She can share things here she wouldn&apos;t
        say in front of the other grandmas.
      </p>
    </motion.div>
  );
}

/**
 * Individual message bubble
 */
function MessageBubble({
  message,
  grandmaId,
}: {
  message: PrivateMessage;
  grandmaId: GrandmaId;
}) {
  const grandma = GRANDMAS[grandmaId];
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      {/* Grandma avatar (left side) */}
      {!isUser && (
        <div
          className={cn(
            "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 mr-1.5 sm:mr-2",
            "bg-gradient-to-br",
            grandma.colors.gradient
          )}
        >
          <span className="text-xs sm:text-sm">{grandma.emoji}</span>
        </div>
      )}

      {/* Message bubble */}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5",
          isUser
            ? "rounded-br-sm bg-gradient-to-br from-zinc-700 to-zinc-800 text-zinc-100"
            : cn(
                "rounded-bl-sm",
                // Alliance messages get a subtle secret styling
                message.isAlliance
                  ? "bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 border border-purple-500/20"
                  : "bg-white/[0.03] border border-white/[0.06]",
                grandma.colors.text
              )
        )}
      >
        {/* Alliance gossip indicator */}
        {message.isAlliance && !isUser && (
          <div className="text-[10px] text-purple-400 mb-1.5 flex items-center gap-1">
            <span>🤫</span>
            <span className="font-medium">Secret</span>
          </div>
        )}

        {/* Proactive message indicator (only show if not alliance) */}
        {message.isProactive && !message.isAlliance && !isUser && (
          <div className="text-[10px] text-zinc-500 mb-1 flex items-center gap-1">
            <span>💭</span>
            <span>reached out to you</span>
          </div>
        )}

        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
    </motion.div>
  );
}

/**
 * Typing indicator for private chat
 */
function PrivateTypingIndicator({ grandmaId }: { grandmaId: GrandmaId }) {
  const grandma = GRANDMAS[grandmaId];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-1.5 sm:gap-2"
    >
      <div
        className={cn(
          "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center",
          "bg-gradient-to-br",
          grandma.colors.gradient
        )}
      >
        <span className="text-xs sm:text-sm">{grandma.emoji}</span>
      </div>
      <div
        className={cn(
          "px-4 py-2.5 rounded-2xl rounded-bl-sm",
          "bg-white/[0.03] border border-white/[0.06]"
        )}
      >
        <TypingDots className={grandma.colors.primary} />
      </div>
    </motion.div>
  );
}

/**
 * Memory activity indicator for private chat
 */
function PrivateMemoryIndicator({
  activity,
}: {
  activity: MemoryActivity;
}) {
  const grandma = GRANDMAS[activity.grandmaId];
  const activityText =
    activity.type === "searching" ? "remembering..." : "saving memory...";
  const activityIcon = activity.type === "searching" ? "🧠" : "💾";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full self-start",
        "bg-white/[0.03] border border-white/[0.06]"
      )}
    >
      <span className="text-xs">{activityIcon}</span>
      <span className={cn("text-xs", grandma.colors.primary)}>
        {activityText}
      </span>
    </motion.div>
  );
}

export function PrivateChatModal({
  grandmaId,
  conversation,
  memoryActivities,
  isLoading,
  onSendMessage,
  onClose,
}: PrivateChatModalProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const grandma = grandmaId ? GRANDMAS[grandmaId] : null;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation?.messages.length, conversation?.isTyping]);

  // Focus input when modal opens
  useEffect(() => {
    if (grandmaId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [grandmaId]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && grandmaId) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [grandmaId, onClose]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  // Filter memory activities for this grandma
  const relevantMemoryActivities = memoryActivities.filter(
    (a) => a.grandmaId === grandmaId
  );

  return (
    <AnimatePresence>
      {grandmaId && grandma && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Slide-in panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "absolute right-0 top-0 bottom-0 w-full max-w-md",
              "bg-zinc-900 border-l border-white/10",
              "flex flex-col",
              "safe-bottom"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-white/10">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div
                  className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center",
                    "bg-gradient-to-br shadow-md",
                    grandma.colors.gradient
                  )}
                >
                  <span className="text-base sm:text-lg">{grandma.emoji}</span>
                </div>
                <div>
                  <h2 className={cn("text-sm sm:text-base font-semibold", grandma.colors.primary)}>
                    {grandma.name}
                  </h2>
                  <p className="text-[10px] sm:text-xs text-zinc-500">Private chat</p>
                </div>
              </div>
              <motion.button
                type="button"
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  "bg-white/[0.05] hover:bg-white/[0.1] transition-colors",
                  "text-zinc-400 hover:text-white"
                )}
              >
                <XIcon className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {conversation?.messages.length === 0 ? (
                <EmptyState grandmaId={grandmaId} />
              ) : (
                <>
                  {conversation?.messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      grandmaId={grandmaId}
                    />
                  ))}

                  {/* Memory activity indicators */}
                  <AnimatePresence>
                    {relevantMemoryActivities.map((activity) => (
                      <PrivateMemoryIndicator
                        key={activity.toolCallId}
                        activity={activity}
                      />
                    ))}
                  </AnimatePresence>

                  {/* Typing indicator */}
                  <AnimatePresence>
                    {conversation?.isTyping && (
                      <PrivateTypingIndicator grandmaId={grandmaId} />
                    )}
                  </AnimatePresence>
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="border-t border-white/10 p-3"
            >
              <div
                className={cn(
                  "flex items-end gap-2 rounded-xl",
                  "bg-white/[0.03] border border-white/[0.08]",
                  "focus-within:border-white/[0.15] transition-colors"
                )}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${grandma.name.split(" ")[0]}...`}
                  disabled={isLoading}
                  rows={1}
                  className={cn(
                    "flex-1 resize-none bg-transparent px-4 py-3",
                    "focus:outline-none",
                    "placeholder:text-zinc-600 text-sm text-white",
                    "max-h-32",
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                />
                <motion.button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  whileHover={!input.trim() || isLoading ? {} : { scale: 1.05 }}
                  whileTap={!input.trim() || isLoading ? {} : { scale: 0.95 }}
                  className={cn(
                    "p-3 rounded-xl mr-1 mb-1",
                    "transition-all duration-200",
                    !input.trim() || isLoading
                      ? "text-zinc-600 cursor-not-allowed"
                      : cn(
                          "bg-gradient-to-r text-white shadow-lg",
                          grandma.colors.gradient
                        )
                  )}
                >
                  <SendIcon className="w-4 h-4" />
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
