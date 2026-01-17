"use client";

import { useState, useEffect } from "react";

const USER_ID_KEY = "counsel-of-grandmas-user-id";

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older environments
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Hook to manage a persistent anonymous user ID.
 * The ID is stored in localStorage and persists across sessions.
 *
 * Returns:
 * - userId: The user's unique identifier (null during SSR)
 * - isLoading: True while loading from localStorage
 */
export function useUserId(): { userId: string | null; isLoading: boolean } {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to get existing userId from localStorage
    let storedId = localStorage.getItem(USER_ID_KEY);

    if (!storedId) {
      // Generate a new UUID if none exists
      storedId = generateUUID();
      localStorage.setItem(USER_ID_KEY, storedId);
    }

    setUserId(storedId);
    setIsLoading(false);
  }, []);

  return { userId, isLoading };
}
