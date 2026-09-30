import { config as loadEnv } from "dotenv";

/*
  This script runs outside Next.js, so it loads the environment itself.

  `.env` holds shared defaults; `.env.local` holds the developer-specific
  credentials and has to be named explicitly, because `dotenv/config` only reads
  `.env`. Neither call overrides an already-set variable, so the precedence is:
  real environment > `.env.local` > `.env`.

  The connection string is never written into this file. It belongs in
  `.env.local`, which is gitignored, exactly as `db/index.ts` and
  `drizzle.config.ts` already do it.
*/

loadEnv({ path: ".env", quiet: true });
loadEnv({ path: ".env.local", quiet: true });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and fill in the " +
      "Neon connection string.",
  );
}

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./drizzle/schema";
import { inArray, eq, gte } from "drizzle-orm";

const queryClient = postgres(connectionString, {
  max_lifetime: 60 * 30,
  connect_timeout: 10,
  max: 5,
  prepare: false,
});

const db = drizzle(queryClient, { schema });

async function main() {
  // Delete all documents created today (after 16:00 UTC)
  const today = new Date();
  today.setHours(16, 0, 0, 0);
  
  const result = await db
    .delete(schema.documents)
    .where(gte(schema.documents.createdAt, today));
  console.log("Deleted:", result);
  await queryClient.end();
}

main();