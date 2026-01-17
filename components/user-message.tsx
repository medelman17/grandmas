"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface UserMessageProps {
  content: string;
}

export function UserMessage({ content }: UserMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
      className="flex justify-end"
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl rounded-br-sm px-4 py-3",
          "bg-gradient-to-br from-zinc-700 to-zinc-800",
          "border border-zinc-600/30",
          "shadow-lg"
        )}
      >
        <p className="text-sm leading-relaxed text-zinc-100">{content}</p>
      </div>
    </motion.div>
  );
}
