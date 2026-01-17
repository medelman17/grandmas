"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface UserMessageProps {
  content: string;
}

export function UserMessage({ content }: UserMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex justify-end"
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl rounded-br-sm px-4 py-2",
          "bg-gray-800 text-white"
        )}
      >
        <p className="text-sm leading-relaxed">{content}</p>
      </div>
    </motion.div>
  );
}
