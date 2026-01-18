"use client";

import { motion, AnimatePresence } from "framer-motion";

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface ScrollToBottomButtonProps {
  visible: boolean;
  onClick: () => void;
}

export function ScrollToBottomButton({ visible, onClick }: ScrollToBottomButtonProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={onClick}
          className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10
            flex items-center gap-1.5 px-3 py-1.5
            bg-zinc-800/90 hover:bg-zinc-700/90
            border border-white/10 hover:border-white/20
            rounded-full shadow-lg backdrop-blur-sm
            text-zinc-300 hover:text-white text-sm
            transition-colors cursor-pointer"
          aria-label="Scroll to bottom"
        >
          <ChevronDownIcon className="w-4 h-4" />
          <span>New messages</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
