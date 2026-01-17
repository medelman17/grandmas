import { neon } from "@neondatabase/serverless";

/**
 * Get a SQL client. Returns null if DATABASE_URL is not configured.
 */
function getClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return null;
  }
  return neon(databaseUrl);
}

/**
 * Get or create a user by ID.
 * If the user exists, updates their last_seen_at timestamp.
 * If the user doesn't exist, creates them.
 *
 * Returns the user ID if successful, null otherwise.
 */
export async function getOrCreateUser(userId: string): Promise<string | null> {
  const sql = getClient();
  if (!sql) {
    // Database not configured - return the userId anyway for graceful degradation
    // The client will still have a userId, it just won't be persisted
    return userId;
  }

  try {
    // Try to insert a new user, or update last_seen_at if they exist
    const result = await sql`
      INSERT INTO users (id, last_seen_at)
      VALUES (${userId}::uuid, NOW())
      ON CONFLICT (id) DO UPDATE SET last_seen_at = NOW()
      RETURNING id
    `;

    return result[0]?.id || null;
  } catch (error) {
    console.error("Error getting/creating user:", error);
    // Return the userId anyway for graceful degradation
    return userId;
  }
}

/**
 * Check if a user exists in the database.
 */
export async function userExists(userId: string): Promise<boolean> {
  const sql = getClient();
  if (!sql) {
    return false;
  }

  try {
    const result = await sql`
      SELECT id FROM users WHERE id = ${userId}::uuid
    `;
    return result.length > 0;
  } catch (error) {
    console.error("Error checking user existence:", error);
    return false;
  }
}
