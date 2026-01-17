"use client";

import { useState, FormEvent, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSubmit: (question: string) => void;
  isLoading: boolean;
}

const QUICK_PROMPTS = [
  "Should I quit my job?",
  "How do I deal with a difficult coworker?",
  "Is it too late to learn something new?",
  "How do I know if I'm in love?",
];

export function ChatInput({ onSubmit, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");

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
    <div className="border-t border-gray-200 bg-white">
      <div className="max-w-2xl mx-auto p-4">
        {/* Quick prompts */}
        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleQuickPrompt(prompt)}
              disabled={isLoading}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs",
                "border border-gray-200 bg-gray-50",
                "transition-colors duration-200",
                isLoading
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-100 hover:border-gray-300"
              )}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the grandmas for advice..."
            disabled={isLoading}
            rows={1}
            className={cn(
              "flex-1 resize-none rounded-xl px-4 py-3",
              "border border-gray-200 bg-gray-50",
              "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent",
              "placeholder:text-gray-400 text-sm",
              "transition-all duration-200",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={cn(
              "px-6 py-3 rounded-xl font-medium text-sm",
              "transition-all duration-200",
              !input.trim() || isLoading
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:shadow-md"
            )}
          >
            {isLoading ? "..." : "Convene"}
          </button>
        </form>
      </div>
    </div>
  );
}
