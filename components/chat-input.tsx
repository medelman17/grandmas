"use client";

import { useState, FormEvent, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSubmit: (question: string) => void;
  isLoading: boolean;
  hasMessages: boolean;
  isDebating: boolean;
  hasQueuedDebates: boolean;
  debatePauseReason: string;
  onContinueDebate: () => void;
  onEndDebate: () => void;
}

const QUICK_PROMPTS = [
  { text: "Should I quit my job?", icon: BriefcaseIcon },
  { text: "How do I deal with a difficult coworker?", icon: UsersIcon },
  { text: "Is it too late to learn something new?", icon: SparklesIcon },
  { text: "How do I know if I'm in love?", icon: HeartIcon },
];

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.5 4V2.5C5.5 1.94772 5.94772 1.5 6.5 1.5H9.5C10.0523 1.5 10.5 1.94772 10.5 2.5V4M2 5.5C2 4.94772 2.44772 4.5 3 4.5H13C13.5523 4.5 14 4.94772 14 5.5V12.5C14 13.0523 13.5523 13.5 13 13.5H3C2.44772 13.5 2 13.0523 2 12.5V5.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.5 14V13C10.5 11.6193 9.38071 10.5 8 10.5H4C2.61929 10.5 1.5 11.6193 1.5 13V14M14.5 14V13C14.5 11.9391 13.8189 11.0304 12.875 10.6805M10.875 2.18048C11.8189 2.53037 12.5 3.43913 12.5 4.5C12.5 5.56087 11.8189 6.46963 10.875 6.81952M8.5 4.5C8.5 5.88071 7.38071 7 6 7C4.61929 7 3.5 5.88071 3.5 4.5C3.5 3.11929 4.61929 2 6 2C7.38071 2 8.5 3.11929 8.5 4.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 1V5M2 3H6M12 11V15M10 13H14M7.5 2L9 6L13 7.5L9 9L7.5 13L6 9L2 7.5L6 6L7.5 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 13.5L2.5 8C1.5 7 1 5.5 1.5 4C2 2.5 3.5 1.5 5 1.5C6 1.5 7 2 8 3C9 2 10 1.5 11 1.5C12.5 1.5 14 2.5 14.5 4C15 5.5 14.5 7 13.5 8L8 13.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.5 1.5L7 9M14.5 1.5L10 14.5L7 9M14.5 1.5L1.5 6L7 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 14C11 14 13 11.5 13 9C13 6 10 4 10 2C10 2 9 4 8 4C7 4 5 3 5 1C5 1 3 4 3 7C3 10 5 14 8 14Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GavelIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 2L14 6M2 14L6 10M6.5 9.5L9.5 6.5M4 6L10 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChatInput({
  onSubmit,
  isLoading,
  hasMessages,
  isDebating,
  hasQueuedDebates,
  debatePauseReason,
  onContinueDebate,
  onEndDebate,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Hide prompts once conversation has started
  const showPrompts = !hasMessages && !isLoading;

  // Show debate controls instead of input when debating and not loading
  const showDebateControls = isDebating && !isLoading;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSubmit(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    if (!isLoading) {
      onSubmit(prompt);
    }
  };

  return (
    <div className="border-t border-white/5 bg-zinc-900/95 backdrop-blur-xl">
      <div className="max-w-2xl mx-auto p-3 sm:p-4">
        {/* Quick prompts - animate out when conversation starts */}
        <AnimatePresence>
          {showPrompts && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex flex-wrap gap-2 mb-3 overflow-hidden"
            >
              {QUICK_PROMPTS.map(({ text, icon: Icon }, index) => (
                <motion.button
                  key={text}
                  onClick={() => handleQuickPrompt(text)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs",
                    "flex items-center gap-1.5",
                    "bg-white/[0.03] border border-white/[0.08]",
                    "hover:bg-white/[0.06] hover:border-white/[0.12] text-zinc-300",
                    // Hide 3rd and 4th prompts on mobile (less space available)
                    index >= 2 && "hidden sm:flex"
                  )}
                >
                  <Icon className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{text}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Debate controls or Input form */}
        <AnimatePresence mode="wait">
          {showDebateControls ? (
            <motion.div
              key="debate-controls"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 p-3 rounded-2xl",
                "bg-white/[0.03] border border-amber-500/20",
                "shadow-[0_0_20px_rgba(245,158,11,0.1)]"
              )}
            >
              <span className="text-xs text-zinc-500 sm:mr-2 text-center">
                {debatePauseReason || "The grandmas are debating..."}
              </span>
              <div className="flex gap-2 sm:gap-3">
                <motion.button
                  onClick={onContinueDebate}
                  disabled={!hasQueuedDebates}
                  whileHover={hasQueuedDebates ? { scale: 1.05 } : {}}
                  whileTap={hasQueuedDebates ? { scale: 0.95 } : {}}
                  className={cn(
                    "px-3 sm:px-4 py-2 rounded-xl text-sm font-medium",
                    "flex items-center gap-2",
                    "transition-all duration-200",
                    !hasQueuedDebates
                      ? "bg-white/[0.03] text-zinc-600 cursor-not-allowed"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  )}
                >
                  <FlameIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{debatePauseReason ? "Keep listening" : "Let them cook"}</span>
                  <span className="sm:hidden">{debatePauseReason ? "Listen" : "Continue"}</span>
                </motion.button>

                <motion.button
                  onClick={onEndDebate}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "px-3 sm:px-4 py-2 rounded-xl text-sm font-medium",
                    "flex items-center gap-2",
                    "bg-white/[0.05] text-zinc-300 border border-white/[0.1]",
                    "hover:bg-white/[0.08] transition-all duration-200"
                  )}
                >
                  <GavelIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{debatePauseReason ? "I've heard enough" : "Order!"}</span>
                  <span className="sm:hidden">{debatePauseReason ? "Enough" : "End"}</span>
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="input-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="relative"
            >
              <div
                className={cn(
                  "flex gap-3 p-1 rounded-2xl",
                  "bg-white/[0.03] border",
                  "transition-all duration-300",
                  isFocused
                    ? "border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.15)]"
                    : "border-white/[0.08]"
                )}
              >
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Ask for advice..."
                  disabled={isLoading}
                  rows={1}
                  className={cn(
                    "flex-1 resize-none bg-transparent px-3 sm:px-4 py-3",
                    "focus:outline-none",
                    "placeholder:text-zinc-600 text-sm text-white",
                    "transition-all duration-200",
                    // Prevent wrapping to multiple lines on mobile
                    "max-h-[44px] sm:max-h-32",
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                />
                <motion.button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  whileHover={!input.trim() || isLoading ? {} : { scale: 1.05 }}
                  whileTap={!input.trim() || isLoading ? {} : { scale: 0.95 }}
                  className={cn(
                    "px-3 sm:px-5 py-3 rounded-xl font-medium text-sm",
                    "flex items-center gap-2",
                    "transition-all duration-200",
                    !input.trim() || isLoading
                      ? "bg-white/[0.03] text-zinc-600 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25"
                  )}
                >
                  {isLoading ? (
                    <motion.span
                      className="flex gap-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-zinc-500"
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </motion.span>
                  ) : (
                    <>
                      <SendIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Convene</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
