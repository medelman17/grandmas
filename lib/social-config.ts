/**
 * Configuration for the Secret Alliances and Social Dynamics systems
 * All timing values are in milliseconds unless otherwise noted
 */

/**
 * Alliance gossip configuration
 */
export const ALLIANCE_CONFIG = {
  /**
   * Probability that alliance gossip triggers after a debate
   * Higher = more frequent gossip
   */
  postDebateProbability: 0.4, // 40%

  /**
   * Probability for random (unprompted) gossip
   * Much lower to keep it surprising
   */
  randomProbability: 0.1, // 10%

  /**
   * Minimum delay before gossip message is delivered (ms)
   * Creates anticipation and feels more natural
   */
  deliveryDelayMin: 2 * 60 * 1000, // 2 minutes

  /**
   * Maximum delay before gossip message is delivered (ms)
   */
  deliveryDelayMax: 5 * 60 * 1000, // 5 minutes

  /**
   * Maximum alliance messages per day per user session
   * Prevents gossip fatigue
   */
  dailyLimit: 5,

  /**
   * Cooldown between gossip from the same grandma (ms)
   * Prevents one grandma from dominating
   */
  sameGrandmaCooldown: 30 * 60 * 1000, // 30 minutes

  /**
   * Cooldown between any alliance messages (ms)
   * Prevents gossip overload even from different grandmas
   */
  globalCooldown: 10 * 60 * 1000, // 10 minutes
} as const;

/**
 * Jealousy/rivalry configuration (for task-4)
 * Placeholder for future implementation
 */
export const JEALOUSY_CONFIG = {
  /**
   * Number of messages to same grandma before others get jealous
   */
  attentionThreshold: 5,

  /**
   * Probability of jealousy trigger when threshold exceeded
   */
  triggerProbability: 0.3, // 30%

  /**
   * Cooldown between jealousy messages from same grandma (ms)
   */
  cooldown: 60 * 60 * 1000, // 1 hour

  /**
   * Maximum jealousy messages per session
   */
  dailyLimit: 3,
} as const;

/**
 * Helper to get a random delay within the alliance delivery range
 */
export function getRandomDeliveryDelay(): number {
  const { deliveryDelayMin, deliveryDelayMax } = ALLIANCE_CONFIG;
  return Math.floor(
    Math.random() * (deliveryDelayMax - deliveryDelayMin + 1) + deliveryDelayMin
  );
}

/**
 * Type exports for config objects
 */
export type AllianceConfig = typeof ALLIANCE_CONFIG;
export type JealousyConfig = typeof JEALOUSY_CONFIG;
