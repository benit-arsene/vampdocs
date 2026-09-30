import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { documents } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

/**
 * Update an existing document's title.
 *
 * PATCH /api/documents/[id]
 * Body: { "title": "My Project" }
 *
 * Only the title is updatable here — content saving is not yet implemented.
 * The `documents_set_updated_at` trigger refreshes `updated_at` on every row
 * update, so the server does not touch that column itself.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;

  let body: { title?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json(
      { error: "title is required" },
      { status: 400 },
    );
  }

  try {
    const [updated] = await db
      .update(documents)
      .set({ title })
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