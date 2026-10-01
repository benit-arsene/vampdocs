/**
 * Minimal client for the documents API.
 *
 * Wire-up so far:
 *   createDocument()      → POST   /api/documents
 *   renameDocument()      → PATCH  /api/documents/[id]  (title)
 *   saveDocumentContent() → PATCH  /api/documents/[id]  (content)
 *
 * Loading and deleting are not implemented yet.
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

export interface CreateDocumentOptions {
  /** The TipTap document to store. Defaults to the empty document. */
  content?: unknown;
  /** The row title. Left to the server default when omitted. */
  title?: string;
  /**
   * Suppress the `window.alert` on failure. Set for background creation (the
   * autosave path), where a blocking modal would interrupt typing on every
   * failed attempt; the console error is still logged.
   */
  silent?: boolean;
}

/**
 * Create a new document in Neon via the existing POST /api/documents route.
 *
 * The route applies the database defaults (UUID, "Untitled document",
 * created_at/updated_at), so this call sends as little as the caller needs
 * and lets the server own the rest.
 *
 * Called with no options — as File → New does — it sends only the empty TipTap
 * content, exactly as before. The autosave path passes the editor's current
 * JSON as `content` so the very first row already holds the user's text rather
 * than needing a follow-up write.
 *
 * Returns the created row on success, or null on failure. Unless `silent` is
 * set, the helper also alerts the user so an explicit click is not silently
 * dropped.
 */
export async function createDocument(
  options: CreateDocumentOptions = {},
): Promise<CreatedDocument | null> {
  const { content = EMPTY_TIPTAP_DOC, title, silent = false } = options;

  // Only send the keys the caller actually supplied, so the default call
  // produces the same body it always did.
  const body: { content: unknown; title?: string } = { content };
  if (title !== undefined) body.title = title;

  try {
    const response = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      if (!silent) {
        window.alert(
          `Failed to create document: ${error?.error ?? "Unknown error"}`,
        );
      }
      return null;
    }

    return (await response.json()) as CreatedDocument;
  } catch (err) {
    console.error("Failed to create document:", err);
    if (!silent) {
      window.alert("Failed to create document. See console for details.");
    }
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

/**
 * Persist the complete TipTap document content for an existing row.
 *
 * PATCH /api/documents/[id]  { content: editor.getJSON() }
 *
 * Only `content` is sent — title is left untouched. The server's
 * `documents_set_updated_at` trigger refreshes `updated_at`, so the client
 * does not send that column. Returns the updated row, or null on failure.
 *
 * Used by both the debounced autosave and the Ctrl+S handler.
 */
export async function saveDocumentContent(
  id: string,
  content: unknown,
): Promise<CreatedDocument | null> {
  try {
    const response = await fetch(`/api/documents/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      console.error(
        `Failed to save document content (${response.status}):`,
        error?.error ?? "Unknown error",
      );
      return null;
    }

    return (await response.json()) as CreatedDocument;
  } catch (err) {
    console.error("Failed to save document content:", err);
    return null;
  }
}