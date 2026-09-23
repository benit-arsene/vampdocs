"use client";

import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";

import Navbar from "./components/Navbar";
import Toolbar from "./components/Toolbar";
import Editor from "./components/Editor";
import Ruler from "./components/Ruler";
import { Pagination } from "./components/pagination";

export default function Home() {
  const editor = useEditor({
    // The editor is rendered after mounting so the server and client markup match.
    immediatelyRender: false,
    // Keeps the toolbar's active states (bold, italic, ...) in sync.
    shouldRerenderOnTransaction: true,
    extensions: [StarterKit, Underline, Pagination],
    content: `
      <h1>Untitled document</h1>
      <p>Start writing your document...</p>
    `,
  });

  return (
    <main className="min-h-screen">
      <Navbar />

      <Toolbar editor={editor} />

      <Ruler />

      <Editor editor={editor} />
    </main>
  );
}
