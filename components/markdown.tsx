"use client";

import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface MarkdownProps {
  content: string;
  className?: string;
}

/**
 * Renders markdown content with styled prose formatting.
 * Used for grandma messages and system messages (meeting minutes).
 */
export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div
      className={cn(
        // Base prose styling
        "prose prose-sm prose-invert max-w-none",
        // Headings
        "prose-headings:font-semibold prose-headings:text-zinc-200",
        // Paragraphs
        "prose-p:my-1.5 prose-p:leading-relaxed",
        // Lists
        "prose-ul:my-1.5 prose-ul:pl-4 prose-li:my-0.5",
        "prose-ol:my-1.5 prose-ol:pl-4",
        // Bold/emphasis
        "prose-strong:text-zinc-100 prose-strong:font-semibold",
        "prose-em:text-zinc-300",
        // Links
        "prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline",
        // Code
        "prose-code:text-pink-400 prose-code:bg-white/5 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs",
        // Blockquotes
        "prose-blockquote:border-l-2 prose-blockquote:border-zinc-600 prose-blockquote:pl-3 prose-blockquote:italic prose-blockquote:text-zinc-400",
        // Horizontal rules
        "prose-hr:border-zinc-700 prose-hr:my-3",
        className
      )}
    >
      <ReactMarkdown
        components={{
          // Custom list rendering for better bullet styling
          ul: ({ children }) => (
            <ul className="list-disc marker:text-zinc-500">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal marker:text-zinc-500">{children}</ol>
          ),
          // Ensure paragraphs don't have excessive margin
          p: ({ children }) => <p className="my-1.5">{children}</p>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
