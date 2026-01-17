import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join } from "path";

// Load environment variables from .env.local
config({ path: ".env.local" });

async function setupDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("Error: DATABASE_URL environment variable is not set");
    console.log("\nTo set up the database:");
    console.log("1. Create a Neon Postgres database at https://neon.tech");
    console.log("2. Enable the pgvector extension in your database settings");
    console.log("3. Copy the connection string to your .env.local file:");
    console.log("   DATABASE_URL=postgresql://...");
    console.log("\n4. Run this script again: npm run db:setup");
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  console.log("Setting up database schema...\n");

  try {
    // Read the schema file
    const schemaPath = join(process.cwd(), "lib/db/schema.sql");
    const schema = readFileSync(schemaPath, "utf-8");

    // Split by semicolon and execute each statement
    const statements = schema
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      console.log(`Executing: ${statement.slice(0, 50)}...`);
      // Use sql.unsafe() to execute raw SQL strings
      await sql.unsafe(statement);
    }

    console.log("\nDatabase setup complete!");
    console.log("\nCreated:");
    console.log("  - pgvector extension");
    console.log("  - users table");
    console.log("  - memories table with vector embeddings");
    console.log("  - Indexes for fast lookups and similarity search");
  } catch (error) {
    console.error("\nDatabase setup failed:", error);
    process.exit(1);
  }
}

setupDatabase();
