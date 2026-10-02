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

/** Practical bounds for a table picked from a menu. */
const MIN_TABLE_SIZE = 1;
const MAX_TABLE_SIZE = 20;
const DEFAULT_TABLE_ROWS = 3;
const DEFAULT_TABLE_COLS = 3;

/**
 * Clamp a typed size into the supported range.
 *
 * `Number("")` is 0 and a cleared number field is `NaN`, so both are folded back
 * into the minimum instead of reaching `insertTable`.
 */
function clampTableSize(value: number): number {
  if (!Number.isFinite(value)) return MIN_TABLE_SIZE;
  return Math.min(MAX_TABLE_SIZE, Math.max(MIN_TABLE_SIZE, Math.round(value)));
}

/** Small form that inserts a native table of the chosen size. */
export function TablePanel({
  editor,
  close,
}: {
  editor: Editor;
  close: () => void;
}) {
  const [rows, setRows] = useState(DEFAULT_TABLE_ROWS);
  const [cols, setCols] = useState(DEFAULT_TABLE_COLS);

  const insert = () => {
    editor
      .chain()
      .focus()
      .insertTable({
        rows: clampTableSize(rows),
        cols: clampTableSize(cols),
        // The first row is a header-cell row, and it is still one of `rows`, so a
        // "3 x 4" table really is three rows of four columns.
        withHeaderRow: true,
      })
      .run();
    close();
  };

  return (
    <div className="w-64 p-2">
      <div className="flex items-end gap-2">
        <label className="flex-1 text-xs text-gray-600">
          <span className="mb-1 block">Rows</span>
          <input
            type="number"
            min={MIN_TABLE_SIZE}
            max={MAX_TABLE_SIZE}
            value={rows}
            onChange={(event) => setRows(clampTableSize(Number(event.target.value)))}
            onKeyDown={(event) => {
              if (event.key === "Enter") insert();
              if (event.key === "Escape") close();
            }}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-blue-500"
          />
        </label>
        <label className="flex-1 text-xs text-gray-600">
          <span className="mb-1 block">Columns</span>
          <input
            type="number"
            min={MIN_TABLE_SIZE}
            max={MAX_TABLE_SIZE}
            value={cols}
            onChange={(event) => setCols(clampTableSize(Number(event.target.value)))}
            onKeyDown={(event) => {
              if (event.key === "Enter") insert();
              if (event.key === "Escape") close();
            }}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-blue-500"
          />
        </label>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {MIN_TABLE_SIZE}–{MAX_TABLE_SIZE} rows and columns.
      </p>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          autoFocus
          onClick={insert}
          className="rounded bg-blue-600 px-2 py-1 text-sm text-white hover:bg-blue-700"
        >
          Insert
        </button>
        <button
          type="button"
          onClick={close}
          className="rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
