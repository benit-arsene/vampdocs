"use client";

import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";

import Navbar from "./components/Navbar";
import Toolbar from "./components/Toolbar";
import Editor from "./components/Editor";
import Ruler from "./components/Ruler";

export default function Home() {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
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
