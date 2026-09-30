/**
 * Minimal client for the documents API.
 *
 * Wire-up so far:
 *   createDocument()  → POST   /api/documents
 *   renameDocument()  → PATCH  /api/documents/[id]
 *
 * Loading, content saving, and deleting are not implemented yet.
 */

export interface CreatedDocument {
  id: string;
  title: string;
  content: {
    type: string;
    content?: unknown[];
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
}

/** The empty TipTap document the editor starts with. */
const EMPTY_TIPTAP_DOC = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

/**
 * Create a new document in Neon via the existing POST /api/documents route.
 *
 * The route applies the database defaults (UUID, "Untitled document",
 * empty TipTap content, created_at/updated_at), so this call sends only the
 * empty content and lets the server own the rest.
 *
 * Returns the created row on success, or null on failure (the helper also
 * alerts the user so the click is not silently dropped).
 */
export async function createDocument(): Promise<CreatedDocument | null> {
  try {
    const response = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: EMPTY_TIPTAP_DOC }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      window.alert(
        `Failed to create document: ${error?.error ?? "Unknown error"}`,
      );
      return null;
    }

    return (await response.json()) as CreatedDocument;
  } catch (err) {
    console.error("Failed to create document:", err);
    window.alert("Failed to create document. See console for details.");
    return null;
  }
}

/**
 * Rename an existing document row in Neon.
 *
 * PATCH /api/documents/[id]  { "title": "My Project" }
 *
 * The server's `documents_set_updated_at` trigger refreshes `updated_at`, so
 * the client does not send that column. Returns the updated row, or null on
 * failure (e.g. the row does not exist yet).
 */
export async function renameDocument(
  id: string,
  title: string,
): Promise<CreatedDocument | null> {
  try {
    const response = await fetch(`/api/documents/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      window.alert(
        `Failed to rename document: ${error?.error ?? "Unknown error"}`,
      );
      return null;
    }

    return (await response.json()) as CreatedDocument;
  } catch (err) {
    console.error("Failed to rename document:", err);
    window.alert("Failed to rename document. See console for details.");
    return null;
  }
}