"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SummaryPromptProps {
  onRequestSummary: () => void;
  onDismiss: () => void;
  isGenerating?: boolean;
}

/**
 * Inline prompt asking user if they want meeting minutes after gaveling.
 */
export function SummaryPrompt({
  onRequestSummary,
  onDismiss,
  isGenerating,
}: SummaryPromptProps) {
  if (isGenerating) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "mx-auto max-w-md py-4 px-5 rounded-2xl",
          "bg-gradient-to-br from-purple-500/10 to-indigo-500/10",
          "border border-purple-500/20",
          "shadow-[0_0_30px_rgba(168,85,247,0.15)]"
        )}
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="flex gap-1"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="text-lg">📝</span>
          </motion.div>
          <p className="text-sm text-zinc-300">
            Preparing meeting minutes...
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "mx-auto max-w-md py-4 px-5 rounded-2xl",
        "bg-gradient-to-br from-zinc-800/50 to-zinc-900/50",
        "border border-white/[0.08]",
        "shadow-lg"
      )}
    >
      <p className="text-sm text-zinc-300 mb-4 text-center">
        Would you like meeting minutes from today&apos;s council session?
      </p>

      <div className="flex gap-3 justify-center">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onRequestSummary}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium",
            "bg-gradient-to-br from-purple-500/20 to-indigo-500/20",
            "border border-purple-500/30",
            "text-purple-200 hover:text-white",
            "hover:border-purple-500/50",
            "transition-colors"
          )}
        >
          📋 Yes, please
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onDismiss}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium",
            "bg-white/[0.03]",
            "border border-white/[0.08]",
            "text-zinc-400 hover:text-zinc-200",
            "hover:border-white/[0.15]",
            "transition-colors"
          )}
        >
          No thanks
        </motion.button>
      </div>
    </motion.div>
  );
}
