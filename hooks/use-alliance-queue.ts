"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { AllianceTrigger, GrandmaId } from "@/lib/types";
import { ALLIANCE_CONFIG, getRandomDeliveryDelay } from "@/lib/social-config";

/**
 * A queued alliance message with its scheduled delivery time
 */
interface QueuedAlliance {
  trigger: AllianceTrigger;
  scheduledTime: number;
  timerId: ReturnType<typeof setTimeout>;
}

/**
 * Delivery record for tracking daily limits and cooldowns
 */
interface DeliveryRecord {
  grandmaId: GrandmaId;
  deliveredAt: number;
}

/**
 * Callback function type for delivering alliance messages
 */
type DeliverAllianceCallback = (trigger: AllianceTrigger) => Promise<void>;

/**
 * Hook for managing the alliance gossip message queue
 *
 * Handles:
 * - Delayed delivery with random timing (2-5 minutes)
 * - Daily limit enforcement (max 5 per session)
 * - Same-grandma cooldown (30 minutes between gossip from same grandma)
 * - Global cooldown (10 minutes between any gossip)
 */
export function useAllianceQueue(onDeliver: DeliverAllianceCallback) {
  // Queue of pending alliance messages
  const [queue, setQueue] = useState<QueuedAlliance[]>([]);

  // History of delivered messages for limit/cooldown tracking
  const [deliveryHistory, setDeliveryHistory] = useState<DeliveryRecord[]>([]);

  // Track if we're currently delivering a message
  const [isDelivering, setIsDelivering] = useState(false);

  // Refs for cleanup and callback stability
  const queueRef = useRef<QueuedAlliance[]>([]);
  const deliveryHistoryRef = useRef<DeliveryRecord[]>([]);
  const onDeliverRef = useRef(onDeliver);

  // Keep refs in sync with state
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    deliveryHistoryRef.current = deliveryHistory;
  }, [deliveryHistory]);

  useEffect(() => {
    onDeliverRef.current = onDeliver;
  }, [onDeliver]);

  /**
   * Check if daily limit has been reached
   */
  const isDailyLimitReached = useCallback((): boolean => {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const todayDeliveries = deliveryHistoryRef.current.filter(
      (r) => r.deliveredAt >= dayStart.getTime()
    );
    return todayDeliveries.length >= ALLIANCE_CONFIG.dailyLimit;
  }, []);

  /**
   * Check if a specific grandma is on cooldown
   */
  const isGrandmaOnCooldown = useCallback((grandmaId: GrandmaId): boolean => {
    const lastFromGrandma = deliveryHistoryRef.current
      .filter((r) => r.grandmaId === grandmaId)
      .sort((a, b) => b.deliveredAt - a.deliveredAt)[0];

    if (!lastFromGrandma) return false;

    const timeSinceLastGossip = Date.now() - lastFromGrandma.deliveredAt;
    return timeSinceLastGossip < ALLIANCE_CONFIG.sameGrandmaCooldown;
  }, []);

  /**
   * Check if global gossip cooldown is active
   */
  const isGlobalCooldownActive = useCallback((): boolean => {
    const lastDelivery = deliveryHistoryRef.current
      .sort((a, b) => b.deliveredAt - a.deliveredAt)[0];

    if (!lastDelivery) return false;

    const timeSinceLastGossip = Date.now() - lastDelivery.deliveredAt;
    return timeSinceLastGossip < ALLIANCE_CONFIG.globalCooldown;
  }, []);

  /**
   * Check if a trigger passes all gates (limits and cooldowns)
   */
  const passesTriggerGates = useCallback((trigger: AllianceTrigger): boolean => {
    // Check daily limit
    if (isDailyLimitReached()) {
      console.log("[Alliance Queue] Daily limit reached, rejecting trigger");
      return false;
    }

    // Check global cooldown
    if (isGlobalCooldownActive()) {
      console.log("[Alliance Queue] Global cooldown active, rejecting trigger");
      return false;
    }

    // Check same-grandma cooldown
    if (isGrandmaOnCooldown(trigger.fromGrandma)) {
      console.log(`[Alliance Queue] ${trigger.fromGrandma} on cooldown, rejecting trigger`);
      return false;
    }

    return true;
  }, [isDailyLimitReached, isGlobalCooldownActive, isGrandmaOnCooldown]);

  /**
   * Deliver a queued alliance message
   */
  const deliverMessage = useCallback(async (queued: QueuedAlliance) => {
    // Remove from queue
    setQueue((prev) => prev.filter((q) => q !== queued));

    // Final gate check before delivery (conditions may have changed)
    if (!passesTriggerGates(queued.trigger)) {
      console.log("[Alliance Queue] Gates failed at delivery time, skipping");
      return;
    }

    setIsDelivering(true);

    try {
      // Deliver the message via callback
      await onDeliverRef.current(queued.trigger);

      // Record delivery for limit/cooldown tracking
      setDeliveryHistory((prev) => [
        ...prev,
        {
          grandmaId: queued.trigger.fromGrandma,
          deliveredAt: Date.now(),
        },
      ]);

      console.log(`[Alliance Queue] Delivered gossip from ${queued.trigger.fromGrandma} about ${queued.trigger.aboutGrandma}`);
    } catch (error) {
      console.error("[Alliance Queue] Error delivering alliance message:", error);
    } finally {
      setIsDelivering(false);
    }
  }, [passesTriggerGates]);

  /**
   * Schedule a trigger for delayed delivery
   */
  const scheduleDelivery = useCallback((trigger: AllianceTrigger): boolean => {
    // Check gates before scheduling
    if (!passesTriggerGates(trigger)) {
      return false;
    }

    // Check if we already have a pending message from this grandma
    const existingFromGrandma = queueRef.current.find(
      (q) => q.trigger.fromGrandma === trigger.fromGrandma
    );
    if (existingFromGrandma) {
      console.log(`[Alliance Queue] Already have pending message from ${trigger.fromGrandma}`);
      return false;
    }

    // Calculate delivery time
    const delay = getRandomDeliveryDelay();
    const scheduledTime = Date.now() + delay;

    // Create the timer
    const timerId = setTimeout(() => {
      const queued = queueRef.current.find(
        (q) => q.trigger === trigger
      );
      if (queued) {
        deliverMessage(queued);
      }
    }, delay);

    // Add to queue
    const queuedAlliance: QueuedAlliance = {
      trigger,
      scheduledTime,
      timerId,
    };

    setQueue((prev) => [...prev, queuedAlliance]);

    console.log(
      `[Alliance Queue] Scheduled ${trigger.fromGrandma}'s gossip about ${trigger.aboutGrandma} ` +
      `in ${Math.round(delay / 1000 / 60)} minutes (${trigger.triggerType})`
    );

    return true;
  }, [passesTriggerGates, deliverMessage]);

  /**
   * Add triggers from debate analysis to the queue
   * Filters and schedules only those that pass all gates
   */
  const addTriggers = useCallback((triggers: AllianceTrigger[]) => {
    let scheduled = 0;

    for (const trigger of triggers) {
      if (scheduleDelivery(trigger)) {
        scheduled++;
      }
    }

    if (triggers.length > 0) {
      console.log(`[Alliance Queue] Scheduled ${scheduled}/${triggers.length} triggers`);
    }
  }, [scheduleDelivery]);

  /**
   * Cancel all pending alliance messages
   */
  const clearQueue = useCallback(() => {
    for (const queued of queueRef.current) {
      clearTimeout(queued.timerId);
    }
    setQueue([]);
    console.log("[Alliance Queue] Queue cleared");
  }, []);

  /**
   * Get time until next scheduled delivery (if any)
   */
  const getNextDeliveryTime = useCallback((): number | null => {
    if (queue.length === 0) return null;

    const sorted = [...queue].sort((a, b) => a.scheduledTime - b.scheduledTime);
    return sorted[0].scheduledTime;
  }, [queue]);

  /**
   * Get remaining daily quota
   */
  const getRemainingDailyQuota = useCallback((): number => {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const todayDeliveries = deliveryHistory.filter(
      (r) => r.deliveredAt >= dayStart.getTime()
    );
    return Math.max(0, ALLIANCE_CONFIG.dailyLimit - todayDeliveries.length);
  }, [deliveryHistory]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      for (const queued of queueRef.current) {
        clearTimeout(queued.timerId);
      }
    };
  }, []);

  return {
    // State
    queue,
    deliveryHistory,
    isDelivering,

    // Actions
    addTriggers,
    clearQueue,

    // Utilities
    getNextDeliveryTime,
    getRemainingDailyQuota,
    isDailyLimitReached,
    isGlobalCooldownActive,
  };
}
