/**
 * Debounced autosave hook for the VampDocs editor.
 *
 * Attaches to the single TipTap editor instance and, whenever the document
 * changes, waits ~800ms of inactivity before persisting the current
 * `editor.getJSON()` to the existing document row identified by
 * `documentId`. If another change arrives before the timer fires, the
 * previous timer is cancelled and restarted — so only the latest state is
 * ever sent.
 *
 * When `documentId` is null (the document that was open at startup, before
 * File → New has created a row) the first save *creates* the row instead:
 * the current editor JSON goes out in the POST, and the returned id is
 * reported through `onDocumentCreated` so the rest of the app keeps treating
 * the document as the one it already has. Every save after that is an
 * ordinary PATCH of that same row.
 *
 * Opening the app never creates a record on its own — creation is reachable
 * only from a save, which requires the user to have typed or pressed Ctrl+S.
 *
 * Exposes `saveNow()` so Ctrl+S can cancel the pending debounce, perform
 * an immediate save, and report its own outcome — preventing the manual
 * save from being masked by a concurrent autosave.
 *
 * Cleanup on unmount cancels the pending timer and detaches the listener.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";

import { createDocument, saveDocumentContent } from "@/app/utils/documents";
import type { CreatedDocument } from "@/app/utils/documents";

/** How long the editor must be idle before an autosave fires. */
const AUTOSAVE_DEBOUNCE_MS = 800;

export type SaveStatus = "idle" | "saving" | "saved" | "failed";

interface UseAutosaveOptions {
  editor: Editor | null;
  documentId: string | null;
  onStatusChange?: (status: SaveStatus) => void;
  /**
   * Called with the row this hook had to create, so the owner can adopt its
   * id and slug. Never called when a document already exists.
   */
  onDocumentCreated?: (document: CreatedDocument) => void;
}

interface UseAutosaveResult {
  status: SaveStatus;
  /** Cancel the pending debounce and save the current editor state now. */
  saveNow: () => void;
}

/**
 * Returns the current save status, plus `saveNow()`, and wires the editor
 * to autosave.
 *
 * The status is intentionally lightweight — it is "saving" while a save is
 * in flight, "saved" once the server acknowledges it, and "failed" if the
 * request errored. The component decides whether to render anything from it.
 */
export function useAutosave({
  editor,
  documentId,
  onStatusChange,
  onDocumentCreated,
}: UseAutosaveOptions): UseAutosaveResult {
  const [status, setStatus] = useState<SaveStatus>("idle");

  // A monotonically increasing counter identifies the latest scheduled save.
  // When a save completes we only apply its outcome if it is still the
  // latest — an older save must not overwrite a newer one (last-write-wins).
  const sequenceRef = useRef(0);
  // The pending debounce timer, held in a ref so the effect closure can
  // clear it on cleanup without re-binding.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The in-flight "create the first row" POST, shared by every save that
  // starts while it is still running. This is the single-flight guard: a save
  // that arrives mid-creation (a second debounce tick, or Ctrl+S) awaits this
  // same promise and adopts its id instead of issuing a second POST, so the
  // initial document can only ever produce one row.
  const creatingRef = useRef<Promise<string | null> | null>(null);

  // Keep the latest editor/documentId in refs so `saveNow` and `performSave`
  // always read the current values without needing to re-bind on every
  // render. Synced in an effect to avoid writing refs during render.
  const editorRef = useRef(editor);
  const documentIdRef = useRef(documentId);
  useEffect(() => {
    editorRef.current = editor;
    documentIdRef.current = documentId;
  }, [editor, documentId]);

  const notify = useCallback(
    (next: SaveStatus) => {
      setStatus(next);
      onStatusChange?.(next);
    },
    [onStatusChange],
  );

  /*
    Resolve the row id this document should be saved to, creating it on first
    use.

    Returns the existing id untouched, an id adopted from a creation that is
    already in flight, or the id of a row created just now — or null if the
    POST failed, in which case the caller reports the failure.
  */
  const ensureDocument = useCallback(
    async (content: unknown): Promise<string | null> => {
      const existing = documentIdRef.current;
      if (existing) return existing;

      // Someone is already creating this document — join them.
      if (creatingRef.current) return creatingRef.current;

      const pending = createDocument({ content, silent: true }).then(
        (created) => {
          creatingRef.current = null;
          if (!created) return null;

          // Adopt the id eagerly rather than waiting for the ref-sync effect
          // above: a save started before React re-renders would otherwise
          // still read null and create a second row.
          //
          // Only while the id is still null, though. If File → New ran while
          // this POST was in flight it has already pointed the editor at its
          // own row, and the late response must not drag it back to ours.
          if (documentIdRef.current) return documentIdRef.current;

          documentIdRef.current = created.id;
          onDocumentCreated?.(created);
          return created.id;
        },
        (err) => {
          creatingRef.current = null;
          console.error("Failed to create document:", err);
          return null;
        },
      );

      creatingRef.current = pending;
      return pending;
    },
    [onDocumentCreated],
  );

  const performSave = useCallback(async () => {
    const currentEditor = editorRef.current;
    if (!currentEditor) return;

    // Claim this save's sequence *before* any await, so a save that starts
    // while a creation is in flight supersedes it and owns the status.
    const mySequence = ++sequenceRef.current;
    notify("saving");

    const content = currentEditor.getJSON();

    // No row yet → create one now, carrying the content the user just typed.
    // This is only reachable from an actual save, never from merely opening
    // the app.
    const id = await ensureDocument(content);
    if (!id) {
      if (mySequence === sequenceRef.current) notify("failed");
      return;
    }

    const result = await saveDocumentContent(id, content);

    // Only apply the outcome if this is still the latest scheduled save.
    if (mySequence !== sequenceRef.current) return;
    notify(result ? "saved" : "failed");
  }, [ensureDocument, notify]);

  const saveNow = useCallback(() => {
    // Cancel any pending autosave so it cannot race with the manual save.
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    void performSave();
  }, [performSave]);

  useEffect(() => {
    const currentEditor = editorRef.current;
    if (!currentEditor) return;

    const schedule = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void performSave();
      }, AUTOSAVE_DEBOUNCE_MS);
    };

    currentEditor.on("update", schedule);

    return () => {
      currentEditor.off("update", schedule);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [editor, performSave]);

  return { status, saveNow };
}