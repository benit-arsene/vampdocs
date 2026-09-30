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
 * No save happens when `documentId` is null (i.e. before File → New has
 * created a database row), and no new row is ever created here.
 *
 * Exposes `saveNow()` so Ctrl+S can cancel the pending debounce, perform
 * an immediate save, and report its own outcome — preventing the manual
 * save from being masked by a concurrent autosave.
 *
 * Cleanup on unmount cancels the pending timer and detaches the listener.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";

import { saveDocumentContent } from "@/app/utils/documents";

/** How long the editor must be idle before an autosave fires. */
const AUTOSAVE_DEBOUNCE_MS = 800;

export type SaveStatus = "idle" | "saving" | "saved" | "failed";

interface UseAutosaveOptions {
  editor: Editor | null;
  documentId: string | null;
  onStatusChange?: (status: SaveStatus) => void;
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
}: UseAutosaveOptions): UseAutosaveResult {
  const [status, setStatus] = useState<SaveStatus>("idle");

  // A monotonically increasing counter identifies the latest scheduled save.
  // When a save completes we only apply its outcome if it is still the
  // latest — an older save must not overwrite a newer one (last-write-wins).
  const sequenceRef = useRef(0);
  // The pending debounce timer, held in a ref so the effect closure can
  // clear it on cleanup without re-binding.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const performSave = useCallback(async () => {
    const currentEditor = editorRef.current;
    const id = documentIdRef.current;

    // No database row yet — nothing to save to. This is what prevents a
    // 404 from a request to /api/documents/ when the id is empty.
    if (!currentEditor || !id) return;

    const mySequence = ++sequenceRef.current;
    notify("saving");

    const content = currentEditor.getJSON();
    const result = await saveDocumentContent(id, content);

    // Only apply the outcome if this is still the latest scheduled save.
    if (mySequence !== sequenceRef.current) return;
    notify(result ? "saved" : "failed");
  }, [notify]);

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