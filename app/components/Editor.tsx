"use client";

import { EditorContent, type Editor as TiptapEditor } from "@tiptap/react";
import { useRef, useEffect, useState } from "react";

type EditorProps = {
  editor: TiptapEditor | null;
};

const MM_TO_PX = 96 / 25.4;
const PAGE_HEIGHT_MM = 297;
const PAGE_WIDTH_MM = 210;
const PAGE_GAP_MM = 20;
const PAGE_PADDING_MM = 25;

function Editor({ editor }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    if (!containerRef.current || !editor) return;

    const updatePageCount = () => {
      const proseMirror = containerRef.current?.querySelector(
        ".ProseMirror",
      ) as HTMLElement | null;
      if (!proseMirror) return;

      const totalPaddingPx = (PAGE_PADDING_MM * 2) * MM_TO_PX;
      const contentAreaHeightPx = (PAGE_HEIGHT_MM * MM_TO_PX) - totalPaddingPx;
      const contentHeight = proseMirror.scrollHeight - totalPaddingPx;
      const count = Math.max(1, Math.ceil(contentHeight / contentAreaHeightPx));
      setPageCount(count);
    };

    updatePageCount();
    requestAnimationFrame(() => updatePageCount());

    const resizeObserver = new ResizeObserver(() => updatePageCount());
    const mutationObserver = new MutationObserver(() => updatePageCount());

    const proseMirror = containerRef.current?.querySelector(
      ".ProseMirror",
    ) as HTMLElement | null;
    if (proseMirror) {
      resizeObserver.observe(proseMirror);
      mutationObserver.observe(proseMirror, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    editor.on("update", updatePageCount);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      editor.off("update", updatePageCount);
    };
  }, [editor]);

  return (
    <div className="flex justify-center px-4 pt-4">
      <div ref={containerRef} className="relative">
        <div
          className="absolute inset-0 -z-10 flex flex-col items-center bg-white"
          style={{ gap: `${PAGE_GAP_MM}mm` }}
        >
          {Array.from({ length: pageCount }).map((_, i) => (
            <div
              key={i}
              className="page-sheet"
              style={{
                width: `${PAGE_WIDTH_MM}mm`,
                height: `${PAGE_HEIGHT_MM}mm`,
              }}
            />
          ))}
        </div>

        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export default Editor;
