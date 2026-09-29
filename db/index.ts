import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/drizzle/schema";

/*
  The Drizzle client.

  Server-only. Importing this module from a `"use client"` component would
  inline the connection string into the browser bundle, so the guard below
  throws first: on the client `window` exists and the module is evaluated during
  the bundle build, which is exactly the case to refuse. Call it from route
  handlers and server components only.

  The URL comes from `DATABASE_URL`, supplied by Next.js from `.env.local` at
  runtime. It is never a literal here. Next.js already loads `process.env`
  server-side, so no dotenv import is needed in the application itself — only
  in `drizzle.config.ts`, which runs outside Next.

  `prepare: false` is required by Neon's pooled endpoint: it speaks PgBouncer in
  transaction mode, which cannot serve server-side prepared statements.
*/

const connectionString = process.env.DATABASE_URL;

if (typeof window !== "undefined") {
  throw new Error(
    "db/index.ts is server-only. Import it from a route handler or server " +
      "component, never from a \"use client\" component.",
  );
}

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add the Neon connection string to .env.local " +
      "(see .env.example) and restart the Next.js dev server.",
  );
}

export const queryClient = postgres(connectionString, {
  // Neon closes idle direct connections, so a stale socket is normal rather
  // than exceptional. Recycle before the server would drop it.
  max_lifetime: 60 * 30,
  // Open lazily, so importing this module in a build step that never queries
  // the database does not open a connection.
  connect_timeout: 10,
  // Cap connections: the pooled URI already multiplexes many sessions over one
  // serverless connection.
  max: 5,
  prepare: false,
});

export const db = drizzle(queryClient, { schema });
