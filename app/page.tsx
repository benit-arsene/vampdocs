"use client";

import { useEffect } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import Navbar from "./components/Navbar";
import Toolbar from "./components/Toolbar";
import Editor from "./components/Editor";
import Ruler from "./components/Ruler";
import { Pagination } from "./components/pagination";
import { CommentMark, Highlight, TextStyle } from "./components/marks";
import { Image } from "./components/imageNode";
import { FindPlugin } from "./components/find";
import { ParagraphIndent } from "./components/paragraphIndent";
import { EditorUiProvider, useEditorUi } from "./components/editorUi";
import { saveDocumentContent } from "./utils/documents";
import { useAutosave } from "./hooks/useAutosave";

function Workspace() {
  const { zoom, rulerVisible, editor, documentId } = useEditorUi();
  const saveStatus = useAutosave({ editor, documentId });

  // Ctrl/Cmd + S → save to the database immediately and stay on the page.
  // Local file export remains under File → Save/Download.
  useEffect(() => {
    if (!editor) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const isSave = (event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey &&
        (event.key === "s" || event.key === "S");

      if (!isSave) return;

      event.preventDefault();
      event.stopPropagation();

      const id = documentId;
      if (!id) return;

      void saveDocumentContent(id, editor.getJSON());
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editor, documentId]);

  return (
    <main className="min-h-screen">
      <Navbar saveStatus={saveStatus} />

      <Toolbar />

      {/* The ruler and the pages zoom together, like in a word processor. */}
      <div style={{ zoom }}>
        {rulerVisible && <Ruler editor={editor} />}

        <Editor />
      </div>
    </main>
  );
}

export default function Home() {
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
    content: `
     
    `,
  });

  return (
    <EditorUiProvider editor={editor}>
      <Workspace />
    </EditorUiProvider>
  );
}