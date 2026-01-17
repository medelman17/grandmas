"use client";

import { useEffect, useRef } from "react";
import { useCounsel } from "@/hooks/use-counsel";
import { CouncilHeader } from "./council-header";
import { UserMessage } from "./user-message";
import { GrandmaMessage } from "./grandma-message";
import { TypingIndicators } from "./typing-indicators";
import { DebateControls } from "./debate-controls";
import { ChatInput } from "./chat-input";
import { GRANDMA_IDS, GRANDMAS } from "@/lib/grandmas";
import { cn } from "@/lib/utils";

export function CounselChat() {
  const {
    messages,
    typingGrandmas,
    isDebating,
    isLoading,
    hasQueuedDebates,
    sendQuestion,
    continueDebate,
    endDebate,
  } = useCounsel();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  // Use requestAnimationFrame to batch scroll updates when multiple state changes
  // happen in quick succession (e.g., 5 typing indicators appearing)
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, typingGrandmas]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <CouncilHeader isDebating={isDebating} />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {/* Empty state */}
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="flex justify-center gap-2 mb-6">
                {GRANDMA_IDS.map((id) => (
                  <span
                    key={id}
                    className="text-3xl"
                    role="img"
                    aria-label={GRANDMAS[id].name}
                  >
                    {GRANDMAS[id].emoji}
                  </span>
                ))}
              </div>
              <h2 className="text-xl font-medium text-gray-800 mb-2">
                The council awaits your question
              </h2>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Five wise grandmas with very different perspectives are ready to
                give you advice. Ask them anything about life, love, career, or
                that thing you&apos;re definitely overthinking.
              </p>
            </div>
          )}

          {/* Messages - wrapped in message-item for content-visibility optimization */}
          {messages.map((message) => {
            if (message.type === "user") {
              return (
                <div key={message.id} className="message-item">
                  <UserMessage content={message.content} />
                </div>
              );
            }

            if (message.type === "grandma" && message.grandmaId) {
              return (
                <div key={message.id} className="message-item">
                  <GrandmaMessage
                    content={message.content}
                    grandmaId={message.grandmaId}
                    replyingTo={message.replyingTo}
                    isStreaming={message.isStreaming}
                  />
                </div>
              );
            }

            if (message.type === "system") {
              return (
                <div
                  key={message.id}
                  className={cn(
                    "message-item text-center py-2 text-sm text-gray-500",
                    "border-y border-gray-200 bg-gray-100/50"
                  )}
                >
                  {message.content}
                </div>
              );
            }

            return null;
          })}

          {/* Typing indicators */}
          {typingGrandmas.length > 0 && (
            <div className="py-2">
              <TypingIndicators typingGrandmas={typingGrandmas} />
            </div>
          )}

          {/* Debate controls */}
          {isDebating && !isLoading && (
            <DebateControls
              onContinue={continueDebate}
              onEnd={endDebate}
              isLoading={isLoading}
              hasQueuedDebates={hasQueuedDebates}
            />
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <ChatInput onSubmit={sendQuestion} isLoading={isLoading} />
    </div>
  );
}
