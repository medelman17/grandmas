"use client";

import { useState, FormEvent, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSubmit: (question: string) => void;
  isLoading: boolean;
  hasMessages: boolean;
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

export function ChatInput({ onSubmit, isLoading, hasMessages }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Hide prompts once conversation has started
  const showPrompts = !hasMessages && !isLoading;

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
    <div className="border-t border-white/5 bg-white/[0.02] backdrop-blur-xl">
      <div className="max-w-2xl mx-auto p-4">
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
                    "hover:bg-white/[0.06] hover:border-white/[0.12] text-zinc-300"
                  )}
                >
                  <Icon className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{text}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="relative">
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
              placeholder="Ask the grandmas for advice..."
              disabled={isLoading}
              rows={1}
              className={cn(
                "flex-1 resize-none bg-transparent px-4 py-3",
                "focus:outline-none",
                "placeholder:text-zinc-600 text-sm text-white",
                "transition-all duration-200",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            />
            <motion.button
              type="submit"
              disabled={!input.trim() || isLoading}
              whileHover={!input.trim() || isLoading ? {} : { scale: 1.05 }}
              whileTap={!input.trim() || isLoading ? {} : { scale: 0.95 }}
              className={cn(
                "px-5 py-3 rounded-xl font-medium text-sm",
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
                  <span>Convene</span>
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}
