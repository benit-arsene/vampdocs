import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

/*
  Drizzle Kit runs outside Next.js, so it loads the environment itself.

  `dotenv/config` on its own only reads `.env`, which is where Next.js keeps
  shared defaults. `.env.local` — the file that holds the developer-specific
  credentials — has to be named explicitly, so both are loaded here.

  `.env` is read first and neither call overrides a variable that is already
  set, so the precedence is: real environment > `.env.local` > `.env`.
*/

loadEnv({ path: ".env", quiet: true });
loadEnv({ path: ".env.local", quiet: true });

/*
  The URL is required here rather than defaulted: running a migration against an
  unintended database is not recoverable.
*/

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and fill in the " +
      "Neon connection string.",
  );
}

export default defineConfig({
  // Points at the editor's ProseMirror JSON, not rendered HTML.
  schema: "./drizzle/schema.ts",
  // The generated .sql files. Committed as source; reviewed before being run.
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
  strict: true,
  verbose: true,
});
