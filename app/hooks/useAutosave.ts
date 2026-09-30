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
 * Cleanup on unmount cancels the pending timer and detaches the listener.
 */

import { useEffect, useRef, useState } from "react";
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

/**
 * Returns the current save status and wires the editor to autosave.
 *
 * The status is intentionally lightweight — it is "saving" while a save is
 * in flight, "saved" once the server acknowledges it, and "failed" if the
 * request errored. The component decides whether to render anything from it.
 */
export function useAutosave({
  editor,
  documentId,
  onStatusChange,
}: UseAutosaveOptions): SaveStatus {
  const [status, setStatus] = useState<SaveStatus>("idle");

  // A monotonically increasing counter identifies the latest scheduled save.
  // When a save completes we only apply its outcome if it is still the
  // latest — an older save must not overwrite a newer one (last-write-wins).
  const sequenceRef = useRef(0);
  // The pending debounce timer, held in a ref so the effect closure can
  // clear it on cleanup without re-binding.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!editor) return;

    const notify = (next: SaveStatus) => {
      setStatus(next);
      onStatusChange?.(next);
    };

    const fire = async () => {
      const mySequence = ++sequenceRef.current;
      notify("saving");

      const content = editor.getJSON();
      const result = await saveDocumentContent(documentId ?? "", content);

      // Only apply the outcome if this is still the latest scheduled save.
      if (mySequence !== sequenceRef.current) return;
      notify(result ? "saved" : "failed");
    };

    const schedule = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(fire, AUTOSAVE_DEBOUNCE_MS);
    };

    editor.on("update", schedule);

    return () => {
      editor.off("update", schedule);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [editor, documentId, onStatusChange]);

  return status;
}