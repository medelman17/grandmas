/**
 * Union type for the 5 grandma identifiers
 */
export type GrandmaId =
  | "nana-ruth"
  | "abuela-carmen"
  | "ba-nguyen"
  | "grandma-edith"
  | "bibi-amara";

/**
 * Configuration for a grandma persona
 */
export interface GrandmaConfig {
  id: GrandmaId;
  name: string;
  emoji: string;
  colors: {
    gradient: string;
    bg: string;
    text: string;
    border: string;
  };
  systemPrompt: string;
}

/**
 * Message types in the counsel chat
 */
export type MessageType = "user" | "grandma" | "system";

/**
 * A message in the counsel chat
 */
export interface CounselMessage {
  id: string;
  type: MessageType;
  content: string;
  grandmaId?: GrandmaId;
  replyingTo?: GrandmaId;
  timestamp: number;
  isStreaming?: boolean;
}

/**
 * Typing state for a grandma
 */
export interface TypingState {
  grandmaId: GrandmaId;
  replyingTo?: GrandmaId;
  startedAt: number;
}

/**
 * Instruction for a grandma to respond in a debate
 */
export interface DebateInstruction {
  responderId: GrandmaId;
  targetId: GrandmaId;
  reason: string;
}

/**
 * API request body for chat endpoint
 */
export interface ChatRequest {
  messages: { role: "user" | "assistant"; content: string }[];
  grandmaId?: GrandmaId;
  mode: "single" | "coordinator";
  context?: {
    replyingTo?: GrandmaId;
    allResponses?: Record<GrandmaId, string>;
  };
}

/**
 * Coordinator response for debate detection
 */
export interface CoordinatorResponse {
  hasDisagreement: boolean;
  debates: DebateInstruction[];
}
