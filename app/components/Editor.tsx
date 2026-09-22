"use client";

import { EditorContent, type Editor as TiptapEditor } from "@tiptap/react";

type EditorProps = {
  editor: TiptapEditor | null;
};

function Editor({ editor }: EditorProps) {
  return (
    <div className="flex justify-center px-4 pt-4">
      <div className="w-full max-w-3xl bg-white border border-gray-200 shadow-lg rounded-lg px-8 py-6 min-h-[calc(100vh-120px)]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
export default Editor;
