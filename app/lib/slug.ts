/**
 * Server-side slug generation for documents.
 *
 * The normalization here is the single definition of how a title becomes a
 * slug: it runs server-side when a row is created, and the resulting `slug`
 * column is what every URL uses from then on. The frontend deliberately does
 * not keep a second copy — it reads `document.slug` off the row rather than
 * deriving one from the title — because a derived slug cannot reproduce the
 * collision suffix `generateUniqueSlug` may append.
 *
 * The database's UNIQUE constraint on `documents.slug` is the final
 * authority: this helper only reduces collisions. Callers must still handle
 * a `23505` unique-violation error from the insert as a backstop for the
 * race between the existence check and the actual insert.
 */

/** Characters used for the random uniqueness suffix. */
const SLUG_SUFFIX_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

/** Convert a document title into a URL-safe slug. */
export function titleToSlug(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "") // Remove unsafe chars (keeps letters, digits, spaces, hyphens).
    .replace(/\s+/g, "-") // Spaces → hyphens.
    .replace(/-+/g, "-") // Collapse repeated hyphens.
    .replace(/^-|-$/g, ""); // Trim leading/trailing hyphens.
}

/** Generate a short, random, URL-safe, lowercase suffix. */
function slugSuffix(length = 4): string {
  const chars = SLUG_SUFFIX_CHARS;
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let suffix = "";
  for (let i = 0; i < length; i++) {
    suffix += chars[bytes[i] % chars.length];
  }
  return suffix;
}

/**
 * Produce a slug that is unique within the `documents` table.
 *
 * `isTaken` answers "does a row already use this slug?" by querying the
 * database. The algorithm:
 *   1. Normalize the title; if it collapses to nothing, fall back to
 *      "document" so a slug is always produced.
 *   2. Try the base slug. If free, use it.
 *   3. Otherwise append `-<suffix>` and re-check, up to 20 attempts.
 *
 * Even after this, a concurrent insert can still win the race between the
 * check and the caller's insert — that is why the UNIQUE constraint is the
 * final backstop and the caller must retry on a `23505` error.
 */
export async function generateUniqueSlug(
  isTaken: (slug: string) => Promise<boolean>,
  title: string,
): Promise<string> {
  const base = titleToSlug(title) || "document";
  if (!(await isTaken(base))) return base;

  for (let i = 0; i < 20; i++) {
    const candidate = `${base}-${slugSuffix()}`;
    if (!(await isTaken(candidate))) return candidate;
  }

  throw new Error("Could not generate a unique slug after 20 attempts");
}