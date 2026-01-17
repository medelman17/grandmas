"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DebateControlsProps {
  onContinue: () => void;
  onEnd: () => void;
  isLoading: boolean;
  hasQueuedDebates: boolean;
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

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 4L4 12M4 4L12 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="flex gap-3 justify-center py-4"
    >
      {/* Let them cook button */}
      <motion.button
        onClick={onContinue}
        disabled={isLoading || !hasQueuedDebates}
        whileHover={
          isLoading || !hasQueuedDebates ? {} : { scale: 1.05 }
        }
        whileTap={isLoading || !hasQueuedDebates ? {} : { scale: 0.95 }}
        className={cn(
          "px-4 py-2 rounded-full text-sm font-medium",
          "flex items-center gap-2",
          "transition-all duration-200",
          isLoading || !hasQueuedDebates
            ? "bg-white/[0.03] text-zinc-600 cursor-not-allowed border border-white/[0.05]"
            : "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.3)]"
        )}
      >
        <FlameIcon className="w-4 h-4" />
        <span>Let them cook</span>
      </motion.button>

      {/* Order in the council button */}
      <motion.button
        onClick={onEnd}
        disabled={isLoading}
        whileHover={isLoading ? {} : { scale: 1.05 }}
        whileTap={isLoading ? {} : { scale: 0.95 }}
        className={cn(
          "px-4 py-2 rounded-full text-sm font-medium",
          "flex items-center gap-2",
          "transition-all duration-200",
          isLoading
            ? "bg-white/[0.03] text-zinc-600 cursor-not-allowed border border-white/[0.05]"
            : "bg-white/[0.05] text-zinc-300 border border-white/[0.1] hover:bg-white/[0.08]"
        )}
      >
        <XIcon className="w-4 h-4" />
        <span>Order in the council!</span>
      </motion.button>
    </motion.div>
  );
}
