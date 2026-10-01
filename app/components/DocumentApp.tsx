"use client";

import { useEffect } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import Navbar from "./Navbar";
import Toolbar from "./Toolbar";
import Editor from "./Editor";
import Ruler from "./Ruler";
import { Pagination } from "./pagination";
import { CommentMark, Highlight, TextStyle } from "./marks";
import { Image } from "./imageNode";
import { FindPlugin } from "./find";
import { ParagraphIndent } from "./paragraphIndent";
import { EditorUiProvider, useEditorUi } from "./editorUi";
import { useAutosave } from "../hooks/useAutosave";

/**
 * A document row handed in from a Server Component, so the editor can open an
 * already-saved document instead of starting blank.
 */
export interface InitialDocument {
  id: string;
  title: string;
  /** The stored TipTap JSON. */
  content: unknown;
}

/** What the editor shows when no document has been opened (the `/` route). */
const BLANK_CONTENT = `
     
`;

function Workspace() {
  const { zoom, rulerVisible, editor, documentId, setDocumentId } =
    useEditorUi();

  // `setDocumentId` is a raw useState setter, so it is referentially stable.
  // Passing it straight through keeps `performSave` stable, which keeps the
  // autosave `update` listener from re-binding (and cancelling its pending
  // debounce) on every render.
  const { status: saveStatus, saveNow, cancelPendingSave } = useAutosave({
    editor,
    documentId,
    onDocumentCreated: setDocumentId,
  });

  // Ctrl/Cmd + S → save to the database immediately and stay on the page.
  // Local file export remains under File → Save/Download.
  useEffect(() => {
    if (!editor) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const isSave =
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey &&
        !event.altKey &&
        (event.key === "s" || event.key === "S");

      if (!isSave) return;

      event.preventDefault();
      event.stopPropagation();

      // Routes the manual save through the autosave lifecycle so the status
      // reflects this save's own outcome and no concurrent autosave can
      // overwrite it. With no document id yet, the save creates the row first
      // and adopts its id.
      saveNow();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editor, saveNow]);

  return (
    <main className="min-h-screen">
      {/* File → New needs the autosave's cancel handle to abandon any save still
          bound to the document it is replacing. */}
      <Navbar saveStatus={saveStatus} cancelPendingSave={cancelPendingSave} />


      <Toolbar />

      {/* The ruler and the pages zoom together, like in a word processor. */}
      <div style={{ zoom }}>
        {rulerVisible && <Ruler editor={editor} />}

        <Editor />
      </div>
    </main>
  );
}

/**
 * The whole editor application: one TipTap instance, the toolbar, the navbar,
 * and the autosave wiring.
 *
 * `initialDocument` is what distinguishes the two entry points. Omitted (the
 * `/` route) the editor opens blank and `documentId` stays null until the user
 * types or saves. Supplied (an `/[id]` route) the stored document is already
 * in hand, so the content is handed straight to `useEditor` and the id is
 * seeded into context during the first render.
 *
 * Passing the content to `useEditor` rather than calling `setContent` after
 * mount is deliberate: `setContent` dispatches a transaction, which fires
 * TipTap's `update` event, which schedules an autosave — and if the id had not
 * landed yet that autosave would create a second document instead of updating
 * the one being opened. Seeding both together means loading a document emits no
 * update event at all, so no save is scheduled and no duplicate is possible.
 */
export default function DocumentApp({
  initialDocument,
}: {
  initialDocument?: InitialDocument;
}) {
  const editor = useEditor({
    // The editor is rendered after mounting so the server and client markup match.
    immediatelyRender: false,
    // Keeps the toolbar's active states (bold, italic, ...) in sync.
    shouldRerenderOnTransaction: true,
    extensions: [
      // StarterKit already brings link and underline with it.
      StarterKit.configure({
        link: { openOnClick: false },
        paragraph: false,
      }),
      TextStyle,
      Highlight,
      CommentMark,
      Image,
      FindPlugin,
      ParagraphIndent,
      Pagination,
    ],
    editorProps: {
      attributes: { spellcheck: "false" },
    },
    content: initialDocument?.content ?? BLANK_CONTENT,
  });

  return (
    <EditorUiProvider editor={editor} initialDocument={initialDocument}>
      <Workspace />
    </EditorUiProvider>
  );
}
