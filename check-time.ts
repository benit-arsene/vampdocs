import { config as loadEnv } from "dotenv";

/*
  These scripts run outside Next.js, so they load the environment themselves.

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
import { inArray, eq, gte, sql } from "drizzle-orm";

const queryClient = postgres(connectionString, {
  max_lifetime: 60 * 30,
  connect_timeout: 10,
  max: 5,
  prepare: false,
});

const db = drizzle(queryClient, { schema });

async function main() {
  // Check the database time
  const dbTime = await queryClient`SELECT now() as now`;
  console.log("DB time:", dbTime);
  
  // Check all documents with their timestamps
  const all = await db.select().from(schema.documents);
  console.log("All documents:", all);
  await queryClient.end();
}

main();