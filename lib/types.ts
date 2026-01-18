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
  /** Instructions for how this grandma uses memory tools */
  memoryBehavior?: string;
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
  mode: "single" | "coordinator" | "summary" | "proactive-check";
  /** Anonymous user ID for memory features */
  userId?: string;
  context?: {
    replyingTo?: GrandmaId;
    allResponses?: Record<GrandmaId, string>;
    // For debate reaction checking
    debateReaction?: boolean;
    lastSpeaker?: GrandmaId;
    lastTarget?: GrandmaId;
    // For meeting summary generation
    conversationTranscript?: string;
    // For proactive message checking
    recentGroupMessages?: string;
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

/**
 * Active memory tool usage by a grandma
 * Used to show "remembering..." or "saving memory..." indicators
 */
export interface MemoryActivity {
  grandmaId: GrandmaId;
  type: "searching" | "saving";
  toolCallId: string;
  startedAt: number;
}

/**
 * A private message between a user and a single grandma
 */
export interface PrivateMessage {
  id: string;
  grandmaId: GrandmaId;
  role: "user" | "grandma";
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  /** True if this message was initiated proactively by the grandma */
  isProactive?: boolean;
}

/**
 * State for private conversations with each grandma
 */
export interface PrivateConversation {
  grandmaId: GrandmaId;
  messages: PrivateMessage[];
  unreadCount: number;
  isTyping: boolean;
  lastActivity: number;
}

/**
 * Proactive message trigger - when a grandma wants to message the user privately
 */
export interface ProactiveMessageTrigger {
  grandmaId: GrandmaId;
  reason: string;
  /** Context from the group chat that triggered this */
  groupContext?: string;
}

/**
 * Response from proactive-check mode API
 */
export interface ProactiveCheckResponse {
  shouldReach: boolean;
  /** Reason the grandma wants to reach out (for the proactive message context) */
  reason?: string;
}

/**
 * API request body for private chat endpoint
 */
export interface PrivateChatRequest {
  messages: { role: "user" | "assistant"; content: string }[];
  grandmaId: GrandmaId;
  userId?: string;
  /** Context for proactive messages (what triggered the grandma to reach out) */
  proactiveContext?: {
    groupDiscussion: string;
    triggerReason: string;
  };
  /** Recent group chat transcript for context in user-initiated private chats */
  groupChatContext?: string;
}
