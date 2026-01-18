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
 * Types of relationships between grandmas
 * - ally: Genuine fondness, will defend and support
 * - frenemy: Surface-level politeness hiding rivalry
 * - irritated: Finds the other annoying but tolerates
 * - worried: Maternal concern, thinks they need guidance
 * - dismissive: Doesn't take the other seriously
 */
export type RelationshipType =
  | "ally"
  | "frenemy"
  | "irritated"
  | "worried"
  | "dismissive";

/**
 * A grandma's relationship with another grandma
 */
export interface GrandmaRelationship {
  /** The grandma this relationship is about */
  target: GrandmaId;
  /** Type of relationship */
  type: RelationshipType;
  /** What this grandma privately thinks (used in gossip) */
  privateOpinion: string;
  /** Topics that trigger gossip about this grandma */
  triggerTopics: string[];
}

/**
 * Types of events that can trigger alliance gossip
 * - post-debate: Ally was attacked/criticized in a debate
 * - outnumbered: Ally was ganged up on (2+ grandmas against her)
 * - harsh-criticism: Someone the gossiper dislikes got roasted
 * - random: Low-probability spontaneous gossip about ally
 */
export type AllianceTriggerType =
  | "post-debate"
  | "outnumbered"
  | "harsh-criticism"
  | "random";

/**
 * A triggered alliance gossip opportunity
 */
export interface AllianceTrigger {
  /** Type of trigger that fired */
  triggerType: AllianceTriggerType;
  /** Grandma who will send the gossip */
  fromGrandma: GrandmaId;
  /** Grandma being gossiped about */
  aboutGrandma: GrandmaId;
  /** Brief context for the gossip prompt */
  context: string;
  /** Relevant snippet from the debate that triggered this */
  debateSnippet?: string;
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
  /** Grandmas explicitly @-mentioned in this message (user messages only) */
  mentionedGrandmas?: GrandmaId[];
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
    // For @-mention filtering - only these grandmas should respond
    mentionedGrandmas?: GrandmaId[];
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
  /** True if this is an alliance gossip message */
  isAlliance?: boolean;
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
  /** Context for alliance gossip messages */
  allianceContext?: {
    /** The grandma being gossiped about */
    aboutGrandma: GrandmaId;
    /** Type of trigger that caused this gossip */
    triggerType: AllianceTriggerType;
    /** Context about what happened */
    context: string;
    /** Snippet from debate if relevant */
    debateSnippet?: string;
  };
}
