"use client";

import type { Editor } from "@tiptap/react";
import { useState, type FocusEvent, type KeyboardEvent, type MouseEvent } from "react";

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
const DEFAULT_TABLE_ROWS = "3";
const DEFAULT_TABLE_COLS = "3";

/**
 * Clamp a typed size into the supported range.
 *
 * This runs when the table is inserted, not on every keystroke. Clamping as you
 * type would rewrite the field under the caret: clearing it gives `Number("") ===
 * 0`, folded to the minimum, so the next digit is appended to "1" and asking for
 * 6 rows produces 16. The fields therefore keep exactly what was typed, and the
 * range is enforced here, on the values that actually reach `insertTable`.
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
        rows: clampTableSize(Number(rows)),
        cols: clampTableSize(Number(cols)),
        // The first row is a header-cell row, and it is still one of `rows`, so a
        // "3 x 4" table really is three rows of four columns.
        withHeaderRow: true,
      })
      .run();
    close();
  };

  /*
    The menu panel calls preventDefault on mousedown so the document selection
    survives while it is open — which also stops a click from focusing the
    field, which is why these boxes used to be impossible to edit. Focusing by
    hand keeps the editor's selection intact while still letting the user click
    in and type; selecting the contents then means typing simply replaces the
    default instead of appending to it.
  */
  const focusOnMouseDown = (event: MouseEvent<HTMLInputElement>) => {
    event.preventDefault();
    event.currentTarget.focus();
  };
  const selectOnFocus = (event: FocusEvent<HTMLInputElement>) => {
    event.currentTarget.select();
  };

  const fieldProps = {
    type: "number" as const,
    min: MIN_TABLE_SIZE,
    max: MAX_TABLE_SIZE,
    onMouseDown: focusOnMouseDown,
    onFocus: selectOnFocus,
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") insert();
      if (event.key === "Escape") close();
    },
    className:
      "w-full rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-blue-500",
  };

  return (
    <div className="w-64 p-2">
      <div className="flex items-end gap-2">
        <label className="flex-1 text-xs text-gray-600">
          <span className="mb-1 block">Rows</span>
          <input
            {...fieldProps}
            autoFocus
            aria-label="Rows"
            value={rows}
            onChange={(event) => setRows(event.target.value)}
          />
        </label>
        <label className="flex-1 text-xs text-gray-600">
          <span className="mb-1 block">Columns</span>
          <input
            {...fieldProps}
            aria-label="Columns"
            value={cols}
            onChange={(event) => setCols(event.target.value)}
          />
        </label>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {MIN_TABLE_SIZE}–{MAX_TABLE_SIZE} rows and columns.
      </p>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
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
