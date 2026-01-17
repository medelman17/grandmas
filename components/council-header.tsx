"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GRANDMAS, GRANDMA_IDS } from "@/lib/grandmas";

interface CouncilHeaderProps {
  isDebating: boolean;
}

export function CouncilHeader({ isDebating }: CouncilHeaderProps) {
  return (
    <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Title */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Counsel of Grandmas
            </h1>
            <p className="text-sm text-gray-500">
              5 grandmas • Always online • Always judging
            </p>
          </div>

          {/* Debating badge */}
          {isDebating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium",
                "bg-red-100 text-red-700 border border-red-200"
              )}
            >
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse" />
              DEBATING
            </motion.div>
          )}
        </div>

        {/* Grandma avatars */}
        <div className="flex gap-2">
          {GRANDMA_IDS.map((id) => {
            const grandma = GRANDMAS[id];
            return (
              <div
                key={id}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center",
                  "bg-gradient-to-br shadow-sm border-2 border-white",
                  grandma.colors.gradient
                )}
                title={grandma.name}
              >
                <span className="text-sm">{grandma.emoji}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
