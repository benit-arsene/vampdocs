import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { documents, type TiptapDoc } from "@/drizzle/schema";

type Params = { params: Promise<{ id: string }> };

/**
 * Update an existing document.
 *
 * PATCH /api/documents/[id]
 * Body: { title?: string }  or  { content?: TiptapDoc }
 *
 * Either field may be supplied; both are optional. At least one must be
 * present, otherwise the request is a no-op and returns 400.
 *
 * The `documents_set_updated_at` trigger refreshes `updated_at` on every row
 * update, so the server does not touch that column itself.
 *
 * Content is validated only loosely: it must be a non-null object that looks
 * like a TipTap document (has a `type` string). We deliberately do not enforce
 * the full ProseMirror schema here — the editor owns that, and a future
 * editor extension change is *data*, not a schema change.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;

  let body: { title?: string; content?: TiptapDoc };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: { title?: string; content?: TiptapDoc } = {};

  if (typeof body.title === "string") {
    const title = body.title.trim();
    if (!title) {
      return NextResponse.json(
        { error: "title must not be empty" },
        { status: 400 },
      );
    }
    updates.title = title;
  }

  if (body.content !== undefined) {
    if (!isTiptapDoc(body.content)) {
      return NextResponse.json(
        { error: "content must be a TipTap document object" },
        { status: 400 },
      );
    }
    updates.content = body.content;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "Provide at least one of 'title' or 'content'" },
      { status: 400 },
    );
  }

  try {
    const [updated] = await db
      .update(documents)
      .set(updates)
      .where(eq(documents.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 },
    );
  }
}

/**
 * Loose structural check for a TipTap document.
 *
 * A TipTap doc is an object with a `type` string. We do not recurse into
 * `content` — the editor owns the node/mark schema, and enforcing it here
 * would turn an editor extension change into a migration.
 */
function isTiptapDoc(value: unknown): value is { type: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as { type?: unknown }).type === "string"
  );
}