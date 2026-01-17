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
    /** Glow shadow for dark mode effects */
    glow: string;
    /** Subtle surface background for dark mode */
    surface: string;
    /** Primary accent color for dark mode */
    primary: string;
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
    // For debate reaction checking
    debateReaction?: boolean;
    lastSpeaker?: GrandmaId;
    lastTarget?: GrandmaId;
  };
}

/**
 * Coordinator response for debate detection
 */
export interface CoordinatorResponse {
  hasDisagreement: boolean;
  debates: DebateInstruction[];
  /** Coordinator suggests human check-in at natural pause points */
  shouldPause?: boolean;
  /** Reason for pause (for display to user) */
  pauseReason?: string;
}
