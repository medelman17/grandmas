# Secret Alliances & Grandma Rivalries - Implementation Plan

## Feature Overview

Two interconnected features that add emotional depth and drama to the grandma relationships:

1. **Secret Alliances**: Grandmas privately gossip about each other after group discussions
2. **Grandma Rivalries**: Grandmas get jealous when you spend too much time with others

---

## Part 1: Secret Alliances

### Concept

After heated group discussions, grandmas reach out privately to share opinions they wouldn't say in front of the others. This creates:
- Feeling of intimacy ("she's confiding in ME")
- Deeper personality expression
- Incentive to check private messages
- Soap opera drama energy

### Grandma Relationship Matrix

Define how each grandma feels about the others (used to generate contextual gossip):

```typescript
// lib/grandma-relationships.ts

export type RelationshipType =
  | "ally"           // Generally supportive, will defend
  | "frenemy"        // Competitive but respectful
  | "irritated"      // Finds them annoying
  | "worried"        // Concerned about their approach
  | "dismissive";    // Doesn't take them seriously

export interface GrandmaRelationship {
  target: GrandmaId;
  type: RelationshipType;
  /** What she really thinks (used in gossip generation) */
  privateOpinion: string;
  /** Topics that trigger stronger reactions */
  triggerTopics: string[];
}

export const GRANDMA_RELATIONSHIPS: Record<GrandmaId, GrandmaRelationship[]> = {
  "nana-ruth": [
    {
      target: "abuela-carmen",
      type: "frenemy",
      privateOpinion: "Heart's in the right place, but she thinks every problem can be solved with a casserole. Some issues require actual analysis, not comfort food.",
      triggerTopics: ["education", "books", "critical thinking"],
    },
    {
      target: "ba-nguyen",
      type: "ally",
      privateOpinion: "The only one here who understands that sometimes less is more. We don't always agree, but I respect her mind.",
      triggerTopics: ["wisdom", "perspective", "brevity"],
    },
    {
      target: "grandma-edith",
      type: "irritated",
      privateOpinion: "Bless her heart, but the passive-aggression is exhausting. And not everything needs to be run through the church prayer chain.",
      triggerTopics: ["religion", "judgment", "gossip"],
    },
    {
      target: "bibi-amara",
      type: "frenemy",
      privateOpinion: "Brilliant woman, truly. But she treats every human interaction like a quarterly earnings report. Shakespeare had more to say about life than any spreadsheet.",
      triggerTopics: ["money", "success", "emotions"],
    },
  ],

  "abuela-carmen": [
    {
      target: "nana-ruth",
      type: "frenemy",
      privateOpinion: "So smart, that one, but she lives in her head. Books don't hug you when you're sad, mijo. She forgets people need warmth.",
      triggerTopics: ["emotions", "family", "love"],
    },
    {
      target: "ba-nguyen",
      type: "worried",
      privateOpinion: "Ay, that woman has been through so much, but she's locked her heart in a box. I want to make her my mole and watch her finally cry.",
      triggerTopics: ["feelings", "vulnerability", "healing"],
    },
    {
      target: "grandma-edith",
      type: "ally",
      privateOpinion: "We don't agree on everything, but she understands family and faith. Even if her casseroles are... bland.",
      triggerTopics: ["family", "tradition", "community"],
    },
    {
      target: "bibi-amara",
      type: "irritated",
      privateOpinion: "Everything is business with that one! 'ROI this, strategy that.' Corazón, life is not a board meeting. Her advice is cold like refrigerated beans.",
      triggerTopics: ["money over family", "cold logic", "emotions dismissed"],
    },
  ],

  "ba-nguyen": [
    {
      target: "nana-ruth",
      type: "ally",
      privateOpinion: "She talks too much, but her words have weight. Educated mind. Sees clearly when others get lost in feelings.",
      triggerTopics: ["wisdom", "clarity", "education"],
    },
    {
      target: "abuela-carmen",
      type: "dismissive",
      privateOpinion: "Good heart. Too soft. She wants to feed problems until they go away. Some problems need to be starved.",
      triggerTopics: ["toughness", "coddling", "resilience"],
    },
    {
      target: "grandma-edith",
      type: "irritated",
      privateOpinion: "Talks around things. Never direct. In my country, we had no time for hints. Say what you mean or say nothing.",
      triggerTopics: ["directness", "passive-aggression", "clarity"],
    },
    {
      target: "bibi-amara",
      type: "frenemy",
      privateOpinion: "Strong. Survivor, like me. Different path, same steel. But she thinks money is the answer. Money burns. Character remains.",
      triggerTopics: ["strength", "survival", "values"],
    },
  ],

  "grandma-edith": [
    {
      target: "nana-ruth",
      type: "worried",
      privateOpinion: "So educated but I worry she's lost touch with what really matters. All those books and no church on Sunday. I pray for her.",
      triggerTopics: ["faith", "morality", "community"],
    },
    {
      target: "abuela-carmen",
      type: "ally",
      privateOpinion: "Now there's a woman who understands family values. A little dramatic, sure, but her heart is in the right place. Unlike some others.",
      triggerTopics: ["family", "tradition", "warmth"],
    },
    {
      target: "ba-nguyen",
      type: "worried",
      privateOpinion: "That poor woman. So much trauma. But honey, you can't just... not feel things. It's not healthy. I've added her to my prayer list.",
      triggerTopics: ["emotions", "healing", "openness"],
    },
    {
      target: "bibi-amara",
      type: "irritated",
      privateOpinion: "I'm not one to judge, BUT... all that success and no mention of faith? No family photos on her desk? There's more to life than empires, dear.",
      triggerTopics: ["faith", "family", "priorities"],
    },
  ],

  "bibi-amara": [
    {
      target: "nana-ruth",
      type: "frenemy",
      privateOpinion: "Sharp mind. Wasted in academia. She could have built something real, but she chose to analyze life instead of live it. Shame.",
      triggerTopics: ["action", "achievement", "theory vs practice"],
    },
    {
      target: "abuela-carmen",
      type: "dismissive",
      privateOpinion: "Sweet woman. No strategy. She gives advice like she's writing a telenovela script. Feelings don't pay bills or solve problems.",
      triggerTopics: ["practicality", "results", "sentimentality"],
    },
    {
      target: "ba-nguyen",
      type: "ally",
      privateOpinion: "Now that one, I respect. Survived war, built new life, wastes no words. We understand each other. Results matter.",
      triggerTopics: ["strength", "survival", "no-nonsense"],
    },
    {
      target: "grandma-edith",
      type: "irritated",
      privateOpinion: "The guilt trips, my dear. In business we call that manipulation. She disguises judgment as concern. I see through it.",
      triggerTopics: ["manipulation", "judgment", "directness"],
    },
  ],
};
```

### Trigger Conditions for Alliance Messages

Grandmas reach out privately when:

1. **After Group Debates**: When they clashed with another grandma
2. **When They Were Outnumbered**: Others disagreed with their advice
3. **When Someone Was "Too Harsh"**: Defending/criticizing another's approach
4. **Random Check-ins**: Occasionally share unsolicited opinions about others

```typescript
// In use-counsel.ts or new hook

interface AllianceTrigger {
  type: "post-debate" | "outnumbered" | "harsh-criticism" | "random";
  sourceGrandma: GrandmaId;
  targetGrandma?: GrandmaId;  // Who they're gossiping about
  context: string;            // What happened in group chat
}

const checkForAllianceTrigger = (
  debateHistory: DebateMessage[],
  speakerId: GrandmaId,
  content: string
): AllianceTrigger | null => {
  // Analyze recent debate for gossip opportunities
  // Return trigger if conditions met
};
```

### Alliance Message Generation

**New API Mode**: Add `mode: "alliance"` to `/api/private-chat/route.ts`

```typescript
interface AllianceContext {
  gossipAbout: GrandmaId;
  relationship: GrandmaRelationship;
  groupContext: string;  // What happened that triggered this
  triggerType: "post-debate" | "outnumbered" | "harsh-criticism" | "random";
}

function getAlliancePrompt(
  grandmaId: GrandmaId,
  allianceContext: AllianceContext
): string {
  const grandma = GRANDMAS[grandmaId];
  const target = GRANDMAS[allianceContext.gossipAbout];
  const relationship = allianceContext.relationship;

  return `${grandma.systemPrompt}

SECRET ALLIANCE MODE: You're reaching out privately to gossip/confide about ${target.name}.

Your private opinion of ${target.name}: "${relationship.privateOpinion}"
Your relationship dynamic: ${relationship.type}

What just happened in the group chat:
${allianceContext.groupContext}

Why you're reaching out:
${getTriggerExplanation(allianceContext.triggerType)}

Write a SHORT private message (1-2 sentences) sharing your real thoughts about what ${target.name} said or did. Be:
- Conspiratorial ("Between us...")
- True to your personality
- Specific about what bothered/amused you
- Not TOO mean (you're venting, not attacking)

This should feel like a friend pulling you aside after a meeting to share what they REALLY think.`;
}

function getTriggerExplanation(type: AllianceTrigger["type"]): string {
  switch (type) {
    case "post-debate":
      return "You just had a heated exchange with them and want to vent/explain yourself";
    case "outnumbered":
      return "You felt ganged up on and want validation from someone you trust";
    case "harsh-criticism":
      return "You noticed they were harsh and want to either defend the target or pile on";
    case "random":
      return "Something they said reminded you of why they annoy/amuse you";
  }
}
```

### Example Alliance Messages

**Nana Ruth about Abuela Carmen** (after food metaphor advice):
> "Between us, sweetheart, if I hear one more cooking metaphor I might scream. Not every life problem is a recipe, despite what Carmen thinks. Sometimes you need Dostoevsky, not dinner."

**Abuela Carmen about Bibi Amara** (after cold business advice):
> "Ay, mijo, did you hear her? 'Calculate the ROI of your relationships.' Corazón, that woman needs a hug and a home-cooked meal. Don't let her turn your heart into a spreadsheet."

**Bà Nguyen about Grandma Edith** (after passive-aggressive comment):
> "Con, Edith speaks in circles. In war, unclear communication kills. Say what you mean. I do not understand American hints."

**Grandma Edith about Bibi Amara** (after dismissing emotional concerns):
> "I'm not one to gossip, dear, but did you notice Bibi didn't even acknowledge your feelings? I worry about her. All that success and no softness. I'll pray for her."

**Bibi Amara about Abuela Carmen** (after sentimental advice):
> "My dear, Carmen means well, but 'follow your heart' is not a strategy. Hearts are unreliable. I'm here when you want actual actionable guidance."

---

## Part 2: Grandma Rivalries (Jealousy System)

### Concept

Track user engagement with each grandma. When imbalance is significant, underappreciated grandmas reach out with jealousy-tinged messages. This creates:
- Incentive to engage with all grandmas
- Hilarious guilt trips
- Deeper personality expression
- Feeling that grandmas "notice" you

### Engagement Tracking

```typescript
// lib/engagement-tracker.ts

export interface GrandmaEngagement {
  grandmaId: GrandmaId;
  privateMessagesSent: number;      // User messages to this grandma
  privateMessagesReceived: number;  // Grandma messages to user
  lastPrivateChat: number;          // Timestamp
  groupMentions: number;            // Times user specifically addressed them
  totalInteractionScore: number;    // Weighted composite
}

export interface EngagementState {
  perGrandma: Record<GrandmaId, GrandmaEngagement>;
  lastUpdated: number;
  totalPrivateMessages: number;
}

// Persist to localStorage
const STORAGE_KEY = "grandma-engagement";

export function getEngagementState(): EngagementState {
  // Load from localStorage or initialize
}

export function recordPrivateMessage(grandmaId: GrandmaId, direction: "sent" | "received") {
  // Update engagement state
  // Recalculate scores
  // Check for jealousy triggers
}

export function calculateInteractionScore(engagement: GrandmaEngagement): number {
  // Weight recent interactions more heavily
  // Consider both quantity and recency
  const recencyBonus = getRecencyBonus(engagement.lastPrivateChat);
  return (
    engagement.privateMessagesSent * 2 +
    engagement.privateMessagesReceived * 1 +
    engagement.groupMentions * 0.5
  ) * recencyBonus;
}
```

### Jealousy Detection

```typescript
// lib/jealousy-detector.ts

export interface JealousyTrigger {
  jealousGrandma: GrandmaId;
  favoredGrandma: GrandmaId;
  imbalanceRatio: number;  // How much more you talk to favored vs jealous
  daysSinceContact: number;
  intensity: "mild" | "moderate" | "dramatic";
}

export function checkForJealousy(state: EngagementState): JealousyTrigger | null {
  const scores = GRANDMA_IDS.map(id => ({
    id,
    score: state.perGrandma[id].totalInteractionScore,
    lastChat: state.perGrandma[id].lastPrivateChat,
  }));

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  const favorite = scores[0];
  const neglected = scores[scores.length - 1];

  // Calculate imbalance
  const ratio = favorite.score / Math.max(neglected.score, 0.1);
  const daysSinceNeglected = daysSince(neglected.lastChat);

  // Trigger thresholds
  if (ratio > 3 && daysSinceNeglected > 2) {
    return {
      jealousGrandma: neglected.id,
      favoredGrandma: favorite.id,
      imbalanceRatio: ratio,
      daysSinceContact: daysSinceNeglected,
      intensity: ratio > 5 ? "dramatic" : ratio > 4 ? "moderate" : "mild",
    };
  }

  return null;
}
```

### Jealousy Probability & Cooldowns

Don't spam jealousy messages. Use probability and cooldowns:

```typescript
const JEALOUSY_CONFIG = {
  // Minimum hours between jealousy messages from same grandma
  cooldownHours: 48,

  // Base probability when conditions are met
  baseProbability: 0.3,

  // Probability multipliers
  multipliers: {
    mild: 1.0,
    moderate: 1.5,
    dramatic: 2.0,
  },

  // Maximum jealousy messages per week across all grandmas
  weeklyLimit: 3,
};

function shouldTriggerJealousy(trigger: JealousyTrigger, history: JealousyHistory): boolean {
  // Check cooldown
  if (hoursSince(history.lastJealousyFrom[trigger.jealousGrandma]) < JEALOUSY_CONFIG.cooldownHours) {
    return false;
  }

  // Check weekly limit
  if (history.thisWeekCount >= JEALOUSY_CONFIG.weeklyLimit) {
    return false;
  }

  // Roll probability
  const probability = JEALOUSY_CONFIG.baseProbability * JEALOUSY_CONFIG.multipliers[trigger.intensity];
  return Math.random() < probability;
}
```

### Jealousy Message Generation

**Personality-specific jealousy styles:**

```typescript
// lib/grandmas.ts - Add to each grandma config

export const JEALOUSY_STYLES: Record<GrandmaId, {
  mild: string;
  moderate: string;
  dramatic: string;
}> = {
  "nana-ruth": {
    mild: "expresses intellectual disappointment that you're seeking advice elsewhere",
    moderate: "makes pointed literary references about abandonment and fair-weather friends",
    dramatic: "delivers a devastating guilt trip wrapped in a Shakespeare quote about betrayal",
  },
  "abuela-carmen": {
    mild: "mentions she made your favorite dish but you weren't around to enjoy it",
    moderate: "gets dramatic about how she worries when she doesn't hear from you",
    dramatic: "full telenovela energy - questions if she did something wrong, mentions her heart",
  },
  "ba-nguyen": {
    mild: "makes a brief, cutting observation about where your attention has been",
    moderate: "stoically notes she survived worse than being ignored",
    dramatic: "one devastating sentence about loyalty that haunts you for days",
  },
  "grandma-edith": {
    mild: "passive-aggressively mentions she's 'not one to keep track' but notices you've been busy",
    moderate: "expresses 'concern' about the influence certain others might be having on you",
    dramatic: "full guilt trip about how she prays for you daily despite your absence",
  },
  "bibi-amara": {
    mild: "coolly notes your attention has been 'allocated elsewhere' lately",
    moderate: "questions if you're getting adequate ROI from your current advisory relationships",
    dramatic: "imperiously suggests you've been making suboptimal strategic decisions without her input",
  },
};
```

**API Mode for Jealousy Messages:**

```typescript
interface JealousyContext {
  favoredGrandma: GrandmaId;
  imbalanceRatio: number;
  daysSinceContact: number;
  intensity: "mild" | "moderate" | "dramatic";
}

function getJealousyPrompt(
  grandmaId: GrandmaId,
  jealousyContext: JealousyContext
): string {
  const grandma = GRANDMAS[grandmaId];
  const favored = GRANDMAS[jealousyContext.favoredGrandma];
  const style = JEALOUSY_STYLES[grandmaId][jealousyContext.intensity];

  return `${grandma.systemPrompt}

JEALOUSY MODE: You've noticed the user has been talking to ${favored.name} a lot more than you lately.

Stats (don't mention these directly):
- They talk to ${favored.name} ${jealousyContext.imbalanceRatio.toFixed(1)}x more than you
- It's been ${jealousyContext.daysSinceContact} days since they messaged you privately

Your jealousy style: ${style}

Write a SHORT private message (1-2 sentences) that:
- Expresses your feelings about being neglected (in YOUR unique way)
- May or may not mention ${favored.name} by name
- Stays true to your personality
- Has an undercurrent of "I miss talking to you" beneath any sass

Intensity level: ${jealousyContext.intensity}
- mild: Subtle hint, easily brushed off
- moderate: Clear message, some guilt
- dramatic: Full personality expression, memorable guilt trip

Don't be actually mean - you love this person. You just miss them.`;
}
```

### Example Jealousy Messages

**Nana Ruth** (moderate, jealous of Abuela Carmen):
> "I noticed you've been in Carmen's kitchen quite a bit lately. I suppose some prefer comfort food to food for thought. When you're ready for a real conversation, dear, my library is always open."

**Abuela Carmen** (dramatic, jealous of Bibi Amara):
> "Mijo, I made empanadas yesterday and thought of you. But you were busy with business talk, no? My heart understands. It's just... a little cold in my kitchen without you."

**Bà Nguyen** (mild, jealous of Nana Ruth):
> "Books are good. But some lessons aren't written down."

**Bà Nguyen** (dramatic, jealous of Grandma Edith):
> "I survived war. I can survive being forgotten."

**Grandma Edith** (moderate, jealous of Bibi Amara):
> "I'm not one to keep track, honey, but I've noticed you've been spending quite a bit of time with Bibi lately. I just worry she might be... influencing your priorities. Not that it's any of my business."

**Bibi Amara** (dramatic, jealous of Abuela Carmen):
> "I see you've been investing heavily in emotional support lately. Interesting portfolio choice. When you're ready to discuss actual strategy again, my calendar is open. Unlike my patience."

---

## Implementation Steps

### Step 1: Create Relationship Data
**File:** `lib/grandma-relationships.ts` (NEW)

- Define `RelationshipType` enum
- Define `GrandmaRelationship` interface
- Create `GRANDMA_RELATIONSHIPS` constant with all 20 relationships (5 grandmas × 4 opinions each)
- Add `JEALOUSY_STYLES` constant

### Step 2: Create Engagement Tracker
**File:** `lib/engagement-tracker.ts` (NEW)

- Define engagement interfaces
- Implement localStorage persistence
- Create `recordPrivateMessage()` function
- Create `calculateInteractionScore()` function
- Export hook: `useEngagementTracker()`

### Step 3: Create Jealousy Detector
**File:** `lib/jealousy-detector.ts` (NEW)

- Define `JealousyTrigger` interface
- Implement `checkForJealousy()` function
- Implement probability/cooldown logic
- Track jealousy history in localStorage

### Step 4: Update Private Chat API
**File:** `app/api/private-chat/route.ts`

Add support for two new context types:

```typescript
interface PrivateChatRequest {
  // ... existing fields
  allianceContext?: {
    gossipAbout: GrandmaId;
    groupContext: string;
    triggerType: "post-debate" | "outnumbered" | "harsh-criticism" | "random";
  };
  jealousyContext?: {
    favoredGrandma: GrandmaId;
    intensity: "mild" | "moderate" | "dramatic";
    daysSinceContact: number;
  };
}
```

### Step 5: Update use-counsel.ts for Alliance Triggers
**File:** `hooks/use-counsel.ts`

After debate responses, check for alliance triggers:

```typescript
// After streamGrandmaResponse in debate
const allianceTrigger = checkForAllianceTrigger(
  recentDebateMessages,
  debate.responderId,
  responseContent
);

if (allianceTrigger && Math.random() < 0.4) {  // 40% chance
  // Queue alliance message for later delivery
  queueAllianceMessage(allianceTrigger);
}
```

### Step 6: Update use-private-messages.ts for Jealousy
**File:** `hooks/use-private-messages.ts`

- Import engagement tracker
- Call `recordPrivateMessage()` on each message
- Periodically check for jealousy triggers
- Add `triggerJealousyMessage()` function

```typescript
// Check for jealousy on hook mount and periodically
useEffect(() => {
  const checkJealousy = () => {
    const trigger = checkForJealousy(engagementState);
    if (trigger && shouldTriggerJealousy(trigger, jealousyHistory)) {
      triggerJealousyMessage(trigger);
    }
  };

  checkJealousy();
  const interval = setInterval(checkJealousy, 60000); // Check every minute
  return () => clearInterval(interval);
}, [engagementState]);
```

### Step 7: Add Visual Indicators
**File:** `components/private-chat-modal.tsx`

- Show special styling for alliance messages ("🤫 Secret")
- Show special styling for jealousy messages ("💔 Missed you")
- Optional: Different notification sound for these message types

---

## Data Flow Diagram

```
GROUP CHAT DEBATE
       │
       ▼
┌──────────────────┐
│ Debate finishes  │
│ Grandma A vs B   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌─────────────────────┐
│ Check Alliance   │────▶│ 40% chance trigger  │
│ Triggers         │     │ alliance message    │
└──────────────────┘     └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Queue message for   │
                         │ delivery (2-5 min)  │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Private message     │
                         │ appears with badge  │
                         └─────────────────────┘


ENGAGEMENT TRACKING
       │
       ▼
┌──────────────────┐
│ User sends/      │
│ receives private │
│ message          │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Update engagement│
│ scores           │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌─────────────────────┐
│ Check jealousy   │────▶│ Imbalance > 3x AND  │
│ thresholds       │     │ > 2 days no contact │
└──────────────────┘     └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ 30-60% probability  │
                         │ (based on intensity)│
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Jealousy message    │
                         │ with special badge  │
                         └─────────────────────┘
```

---

## File Summary

| File | Action | Purpose |
|------|--------|---------|
| `lib/grandma-relationships.ts` | CREATE | Relationship matrix, jealousy styles |
| `lib/engagement-tracker.ts` | CREATE | Track user-grandma interaction scores |
| `lib/jealousy-detector.ts` | CREATE | Detect jealousy trigger conditions |
| `app/api/private-chat/route.ts` | MODIFY | Add alliance/jealousy prompt modes |
| `hooks/use-counsel.ts` | MODIFY | Add alliance trigger detection |
| `hooks/use-private-messages.ts` | MODIFY | Add engagement tracking, jealousy checks |
| `components/private-chat-modal.tsx` | MODIFY | Special message type styling |
| `lib/types.ts` | MODIFY | Add new interfaces |

---

## Configuration Constants

```typescript
// lib/social-dynamics-config.ts

export const ALLIANCE_CONFIG = {
  // Probability of alliance message after debate
  postDebateProbability: 0.4,

  // Delay range before sending (feels more natural)
  deliveryDelayMs: { min: 120000, max: 300000 }, // 2-5 minutes

  // Maximum alliance messages per day
  dailyLimit: 2,

  // Cooldown between alliance messages about same grandma
  samTargetCooldownHours: 24,
};

export const JEALOUSY_CONFIG = {
  // Minimum engagement ratio to trigger (favorite / neglected)
  minImbalanceRatio: 3.0,

  // Minimum days since last contact with neglected grandma
  minDaysSinceContact: 2,

  // Cooldown between jealousy messages from same grandma
  cooldownHours: 48,

  // Base probability when conditions met
  baseProbability: 0.3,

  // Intensity multipliers
  intensityMultipliers: {
    mild: 1.0,      // 30% base
    moderate: 1.5,  // 45%
    dramatic: 2.0,  // 60%
  },

  // Intensity thresholds (ratio)
  intensityThresholds: {
    mild: 3.0,
    moderate: 4.0,
    dramatic: 5.0,
  },

  // Maximum jealousy messages per week
  weeklyLimit: 3,
};
```

---

## Testing Checklist

### Secret Alliances
- [ ] Alliance messages trigger after heated debates
- [ ] Messages reflect correct relationship (ally vs irritated vs dismissive)
- [ ] Gossip is specific to what happened in group chat
- [ ] Daily limit respected
- [ ] Same-target cooldown works
- [ ] Messages feel natural, not robotic

### Grandma Rivalries
- [ ] Engagement scores track correctly
- [ ] Jealousy triggers at correct threshold
- [ ] Intensity levels map to message tone
- [ ] Cooldowns prevent spam
- [ ] Weekly limit works
- [ ] Messages are guilt-trippy but not mean
- [ ] Neglected grandma is correctly identified

### Integration
- [ ] Alliance and jealousy messages appear in private chat
- [ ] Badges show for both message types
- [ ] Special styling distinguishes message types
- [ ] Both features work together without conflicts

---

## Future Enhancements

1. **Alliance Chains**: If you respond positively to gossip, grandma shares MORE
2. **Reconciliation**: If you chat with neglected grandma after jealousy message, they "forgive" you with relief
3. **Group Dynamics**: Grandmas notice if you're playing favorites and discuss it among themselves
4. **Reputation System**: Your choices affect how grandmas see you ("Oh, you're Carmen's favorite")
5. **Secret Requests**: Grandmas ask you not to tell others what they said ("Don't tell Bibi I said this...")

---

*This plan extends the Private Messaging feature with social dynamics that make the grandmas feel more alive and emotionally invested in the user.*
