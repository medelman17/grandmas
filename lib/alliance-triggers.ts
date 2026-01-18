/**
 * Alliance trigger detection logic
 * Analyzes debate history to detect opportunities for grandma gossip
 */

import { GrandmaId, AllianceTrigger, CounselMessage } from "./types";
import { GRANDMA_IDS, GRANDMAS, GRANDMA_RELATIONSHIPS, getRelationship } from "./grandmas";
import { ALLIANCE_CONFIG } from "./social-config";

/**
 * Debate message info extracted for trigger analysis
 */
interface DebateMessage {
  grandmaId: GrandmaId;
  targetId?: GrandmaId;
  content: string;
}

/**
 * Extract debate messages from counsel messages
 * Only includes grandma messages that are replies (debate exchanges)
 */
function extractDebateMessages(messages: CounselMessage[]): DebateMessage[] {
  return messages
    .filter(
      (msg): msg is CounselMessage & { grandmaId: GrandmaId } =>
        msg.type === "grandma" &&
        !!msg.grandmaId &&
        !!msg.replyingTo
    )
    .map((msg) => ({
      grandmaId: msg.grandmaId,
      targetId: msg.replyingTo,
      content: msg.content,
    }));
}

/**
 * Check for post-debate trigger: An ally was attacked in the debate
 * Returns triggers for grandmas whose allies were criticized
 */
export function checkPostDebateTrigger(
  messages: CounselMessage[]
): AllianceTrigger[] {
  const triggers: AllianceTrigger[] = [];
  const debateMessages = extractDebateMessages(messages);

  if (debateMessages.length === 0) return triggers;

  // Find grandmas who were targeted in debates
  const targetedGrandmas = new Set<GrandmaId>();
  const targetSnippets: Record<GrandmaId, string> = {} as Record<GrandmaId, string>;

  for (const msg of debateMessages) {
    if (msg.targetId) {
      targetedGrandmas.add(msg.targetId);
      // Store the attack snippet for context
      if (!targetSnippets[msg.targetId]) {
        targetSnippets[msg.targetId] = msg.content.slice(0, 100);
      }
    }
  }

  // Check each grandma to see if their ally was attacked
  for (const grandmaId of GRANDMA_IDS) {
    const relationships = GRANDMA_RELATIONSHIPS[grandmaId];
    const allies = relationships.filter((r) => r.type === "ally");

    for (const ally of allies) {
      if (targetedGrandmas.has(ally.target)) {
        // This grandma's ally was attacked!
        triggers.push({
          triggerType: "post-debate",
          fromGrandma: grandmaId,
          aboutGrandma: ally.target,
          context: `Your ally ${GRANDMAS[ally.target].name} was criticized in the debate`,
          debateSnippet: targetSnippets[ally.target],
        });
      }
    }
  }

  return triggers;
}

/**
 * Check for outnumbered trigger: A grandma was ganged up on (2+ attackers)
 * Returns triggers for grandmas whose allies were outnumbered
 */
export function checkOutnumberedTrigger(
  messages: CounselMessage[]
): AllianceTrigger[] {
  const triggers: AllianceTrigger[] = [];
  const debateMessages = extractDebateMessages(messages);

  if (debateMessages.length < 2) return triggers;

  // Count attackers per target
  const attackersByTarget: Record<GrandmaId, Set<GrandmaId>> = {} as Record<GrandmaId, Set<GrandmaId>>;

  for (const msg of debateMessages) {
    if (msg.targetId) {
      if (!attackersByTarget[msg.targetId]) {
        attackersByTarget[msg.targetId] = new Set();
      }
      attackersByTarget[msg.targetId].add(msg.grandmaId);
    }
  }

  // Find grandmas who were outnumbered (2+ unique attackers)
  const outnumberedGrandmas: GrandmaId[] = [];
  for (const [targetId, attackers] of Object.entries(attackersByTarget)) {
    if (attackers.size >= 2) {
      outnumberedGrandmas.push(targetId as GrandmaId);
    }
  }

  // Check each grandma to see if their ally was outnumbered
  for (const grandmaId of GRANDMA_IDS) {
    const relationships = GRANDMA_RELATIONSHIPS[grandmaId];
    const allies = relationships.filter((r) => r.type === "ally");

    for (const ally of allies) {
      if (outnumberedGrandmas.includes(ally.target)) {
        const attackers = attackersByTarget[ally.target];
        const attackerNames = Array.from(attackers)
          .map((id) => GRANDMAS[id].name)
          .join(" and ");

        triggers.push({
          triggerType: "outnumbered",
          fromGrandma: grandmaId,
          aboutGrandma: ally.target,
          context: `Your ally ${GRANDMAS[ally.target].name} was ganged up on by ${attackerNames}`,
        });
      }
    }
  }

  return triggers;
}

/**
 * Harsh language patterns that indicate particularly cutting criticism
 */
const HARSH_PATTERNS = [
  /fool|foolish/i,
  /wrong|completely wrong/i,
  /nonsense|ridiculous/i,
  /naive|simplistic/i,
  /weak|weakness/i,
  /empty|soulless/i,
  /pathetic|sad/i,
  /bless your heart/i, // Grandma Edith's signature burn
  /survived.*without/i, // Bà Nguyen's stoic burns
];

/**
 * Check for harsh criticism trigger: Someone the gossiper dislikes got roasted
 * Returns triggers for grandmas who might enjoy gossiping about someone they dislike
 */
export function checkHarshCriticismTrigger(
  messages: CounselMessage[]
): AllianceTrigger[] {
  const triggers: AllianceTrigger[] = [];
  const debateMessages = extractDebateMessages(messages);

  if (debateMessages.length === 0) return triggers;

  // Find harsh criticisms
  const harshCriticisms: { targetId: GrandmaId; snippet: string }[] = [];

  for (const msg of debateMessages) {
    if (msg.targetId) {
      const isHarsh = HARSH_PATTERNS.some((pattern) => pattern.test(msg.content));
      if (isHarsh) {
        harshCriticisms.push({
          targetId: msg.targetId,
          snippet: msg.content.slice(0, 100),
        });
      }
    }
  }

  // Check each grandma to see if someone they dislike got roasted
  for (const grandmaId of GRANDMA_IDS) {
    const relationships = GRANDMA_RELATIONSHIPS[grandmaId];
    // "irritated" or "frenemy" relationships enjoy seeing the target get roasted
    const disliked = relationships.filter(
      (r) => r.type === "irritated" || r.type === "frenemy"
    );

    for (const target of disliked) {
      const criticism = harshCriticisms.find((c) => c.targetId === target.target);
      if (criticism) {
        triggers.push({
          triggerType: "harsh-criticism",
          fromGrandma: grandmaId,
          aboutGrandma: target.target,
          context: `${GRANDMAS[target.target].name} got a taste of their own medicine`,
          debateSnippet: criticism.snippet,
        });
      }
    }
  }

  return triggers;
}

/**
 * Check for random trigger: Low-probability spontaneous gossip about allies
 * Only returns one trigger max (if probability check passes)
 */
export function checkRandomTrigger(): AllianceTrigger | null {
  // Random check based on config probability
  if (Math.random() > ALLIANCE_CONFIG.randomProbability) {
    return null;
  }

  // Pick a random grandma
  const grandmaId = GRANDMA_IDS[Math.floor(Math.random() * GRANDMA_IDS.length)];
  const relationships = GRANDMA_RELATIONSHIPS[grandmaId];

  // Only trigger for ally relationships
  const allies = relationships.filter((r) => r.type === "ally");
  if (allies.length === 0) return null;

  // Pick a random ally
  const ally = allies[Math.floor(Math.random() * allies.length)];

  return {
    triggerType: "random",
    fromGrandma: grandmaId,
    aboutGrandma: ally.target,
    context: `Just thinking about ${GRANDMAS[ally.target].name}...`,
  };
}

/**
 * Main function: Check all trigger types and return potential alliance gossip opportunities
 * Applies probability filtering for post-debate triggers
 */
export function checkForAllianceTriggers(
  messages: CounselMessage[]
): AllianceTrigger[] {
  const allTriggers: AllianceTrigger[] = [];

  // Check each trigger type
  const postDebate = checkPostDebateTrigger(messages);
  const outnumbered = checkOutnumberedTrigger(messages);
  const harshCriticism = checkHarshCriticismTrigger(messages);
  const random = checkRandomTrigger();

  // Apply probability filter to post-debate triggers
  for (const trigger of postDebate) {
    if (Math.random() < ALLIANCE_CONFIG.postDebateProbability) {
      allTriggers.push(trigger);
    }
  }

  // Outnumbered triggers are higher priority - always include
  allTriggers.push(...outnumbered);

  // Harsh criticism is situational - 50% chance
  for (const trigger of harshCriticism) {
    if (Math.random() < 0.5) {
      allTriggers.push(trigger);
    }
  }

  // Random trigger (already has probability built in)
  if (random) {
    allTriggers.push(random);
  }

  // Deduplicate: One gossip message per fromGrandma
  const seen = new Set<GrandmaId>();
  return allTriggers.filter((trigger) => {
    if (seen.has(trigger.fromGrandma)) return false;
    seen.add(trigger.fromGrandma);
    return true;
  });
}
