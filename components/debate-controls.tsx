"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DebateControlsProps {
  onContinue: () => void;
  onEnd: () => void;
  isLoading: boolean;
  hasQueuedDebates: boolean;
}

export function DebateControls({
  onContinue,
  onEnd,
  isLoading,
  hasQueuedDebates,
}: DebateControlsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 justify-center py-4"
    >
      <button
        onClick={onContinue}
        disabled={isLoading || !hasQueuedDebates}
        className={cn(
          "px-4 py-2 rounded-full text-sm font-medium",
          "transition-all duration-200",
          isLoading || !hasQueuedDebates
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200"
        )}
      >
        🍿 Let them cook
      </button>

      <button
        onClick={onEnd}
        disabled={isLoading}
        className={cn(
          "px-4 py-2 rounded-full text-sm font-medium",
          "transition-all duration-200",
          isLoading
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
        )}
      >
        🔨 Order in the council!
      </button>
    </motion.div>
  );
}
