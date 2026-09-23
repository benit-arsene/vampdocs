"use client";

import type { Editor } from "@tiptap/react";
import { useState } from "react";

import { setComment } from "./marks";

/** Small form that adds, edits or removes a link on the selection. */
export function LinkPanel({
  editor,
  close,
}: {
  editor: Editor;
  close: () => void;
}) {
  const [href, setHref] = useState(
    () => (editor.getAttributes("link").href as string | undefined) ?? "",
  );

  const apply = () => {
    const value = href.trim();

    if (!value) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      close();
      return;
    }

    const url = /^(https?:|mailto:|tel:|\/|#)/i.test(value)
      ? value
      : `https://${value}`;
    const chain = editor.chain().focus();

    if (editor.state.selection.empty && !editor.isActive("link")) {
      chain.insertContent({
        type: "text",
        text: value,
        marks: [{ type: "link", attrs: { href: url } }],
      });
    } else {
      chain.extendMarkRange("link").setLink({ href: url });
    }

    chain.run();
    close();
  };

  return (
    <div className="flex items-center gap-1 p-2">
      <input
        autoFocus
        value={href}
        onChange={(event) => setHref(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") apply();
          if (event.key === "Escape") close();
        }}
        placeholder="Paste or type a link"
        className="w-56 rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-blue-500"
      />
      <button
        type="button"
        onClick={apply}
        className="shrink-0 rounded bg-blue-600 px-2 py-1 text-sm text-white hover:bg-blue-700"
      >
        Apply
      </button>
    </div>
  );
}

/** Small form that attaches a note to the selection. */
export function CommentPanel({
  editor,
  close,
}: {
  editor: Editor;
  close: () => void;
}) {
  const [note, setNote] = useState(
    () => (editor.getAttributes("comment").note as string | undefined) ?? "",
  );

  return (
    <div className="w-64 p-2">
      <textarea
        autoFocus
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Add a note about the selected text"
        rows={3}
        className="w-full resize-none rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-blue-500"
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setComment(editor, note);
            close();
          }}
          className="rounded bg-blue-600 px-2 py-1 text-sm text-white hover:bg-blue-700"
        >
          Comment
        </button>
        {editor.isActive("comment") && (
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().unsetMark("comment").run();
              close();
            }}
            className="rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-100"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
