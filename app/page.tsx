"use client";

import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import Navbar from "./components/Navbar";
import Toolbar from "./components/Toolbar";
import Editor from "./components/Editor";
import Ruler from "./components/Ruler";
import { Pagination } from "./components/pagination";
import { CommentMark, Highlight, TextStyle } from "./components/marks";
import { Image } from "./components/imageNode";
import { EditorUiProvider, useEditorUi } from "./components/editorUi";

function Workspace() {
  const { zoom, rulerVisible } = useEditorUi();

  return (
    <main className="min-h-screen">
      <Navbar />

      <Toolbar />

      {/* The ruler and the pages zoom together, like in a word processor. */}
      <div style={{ zoom }}>
        {rulerVisible && <Ruler />}

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
      }),
      TextStyle,
      Highlight,
      CommentMark,
      Image,
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
