"use client";

import { EditorContent } from "@tiptap/react";
import { useEffect, useState, type CSSProperties } from "react";

import { useEditorUi } from "./editorUi";
import {
  PAGE_HEIGHT_MM,
  PAGE_MARGIN_MM,
  PAGE_PITCH_PX,
  PAGE_WIDTH_MM,
  applyPagination,
  clearPagination,
  pagesHeightPx,
} from "./pagination";

function Editor() {
  const { editor, pageless } = useEditorUi();
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    if (!editor) return;

    // Pageless view keeps the text flowing, so the page breaks come out.
    if (pageless) {
      clearPagination(editor.view);
      return;
    }

    let destroyed = false;
    let frame = 0;

    const layout = () => {
      frame = 0;
      if (destroyed) return;

      const count = applyPagination(editor.view);
      if (count === null) return;

      setPageCount((previous) => (previous === count ? previous : count));
    };

    // Layout at most once per frame, and never while ProseMirror is still
    // applying the transaction that changed the document.
    const schedule = () => {
      if (frame || destroyed) return;
      frame = requestAnimationFrame(layout);
    };

    schedule();
    editor.on("update", schedule);
    window.addEventListener("resize", schedule);
    // Web fonts change text metrics, which can move a page break.
    document.fonts?.ready.then(schedule).catch(() => {});

    return () => {
      destroyed = true;
      if (frame) cancelAnimationFrame(frame);
      editor.off("update", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [editor, pageless]);

  const pagesHeight = pagesHeightPx(pageCount);

  return (
    <div className="editor-scroll flex justify-center px-4 py-4">
      <div
        className="relative"
        style={
          {
            width: `${PAGE_WIDTH_MM}mm`,
            // Read by `.ProseMirror`, so the editor always covers every sheet.
            "--page-min-height": `${pageless ? 0 : pagesHeight}px`,
          } as CSSProperties
        }
      >
        {/* The sheets are painted behind the transparent editor. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-0"
        >
          {pageless ? (
            <div className="page-sheet absolute inset-0" />
          ) : (
            Array.from({ length: pageCount }).map((_, page) => (
              <div
                key={page}
                className="page-sheet absolute left-0 top-0"
                style={{
                  top: `${page * PAGE_PITCH_PX}px`,
                  width: `${PAGE_WIDTH_MM}mm`,
                  height: `${PAGE_HEIGHT_MM}mm`,
                }}
              >
                {/* Sits inside the bottom margin, so it never collides with
                    text, and fades into the page like a printed footer. */}
                <span
                  className="page-number absolute text-[11px] leading-none tabular-nums"
                  style={{
                    right: `${PAGE_MARGIN_MM}mm`,
                    bottom: `${PAGE_MARGIN_MM / 2.5}mm`,
                  }}
                >
                  {page + 1} of {pageCount}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="relative z-10">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}

export default Editor;
