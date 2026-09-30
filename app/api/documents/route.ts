import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { documents, EMPTY_TIPTAP_DOC, type TiptapDoc } from "@/drizzle/schema";
import { generateUniqueSlug } from "@/app/lib/slug";

/**
 * Create a new document.
 *
 * POST /api/documents
 * Body: { title?: string, content?: TiptapDoc }
 *
 * The slug is generated server-side from the title and is guaranteed unique
 * within the `documents` table. The database's UNIQUE constraint is the
 * final backstop: if a concurrent insert wins the race between the
 * existence check and this insert, we retry with a fresh suffix.
 */
export async function POST(request: NextRequest) {
  let body: { title?: string; content?: TiptapDoc };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = body.title?.trim() || "Untitled document";
  const content = body.content ?? EMPTY_TIPTAP_DOC;

  // Generate a unique slug, retrying on a database unique-violation race.
  for (let attempt = 0; attempt < 10; attempt++) {
    const slug = await generateUniqueSlug(
      (candidate) =>
        db.query.documents
          .findFirst({ where: eq(documents.slug, candidate) })
          .then((row) => row !== undefined),
      title,
    );

    try {
      const [created] = await db
        .insert(documents)
        .values({ title, content, slug })
        .returning();

      return NextResponse.json(created, { status: 201 });
    } catch (err) {
      // 23505 = unique_violation. A concurrent insert grabbed the slug we
      // generated; retry with a fresh suffix rather than failing the request.
      if (isUniqueViolation(err)) continue;
      throw err;
    }
  }

  return NextResponse.json(
    { error: "Failed to create document" },
    { status: 500 },
  );
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505"
  );
}