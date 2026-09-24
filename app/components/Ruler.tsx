"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";

import { PAGE_MARGIN_MM, PAGE_WIDTH_MM } from "./pagination";
import {
  clampFirst,
  clampLeft,
  clampRight,
  readParagraphIndent,
  setParagraphIndent,
} from "./paragraphIndent";

/** Short ticks every half centimetre, long ticks every centimetre. */
const TICK_STEP_MM = 5;
const TICKS = Array.from(
  { length: PAGE_WIDTH_MM / TICK_STEP_MM + 1 },
  (_, index) => index * TICK_STEP_MM,
);
const LABELS = Array.from(
  { length: PAGE_WIDTH_MM / 10 - 1 },
  (_, index) => (index + 1) * 10,
);

/** Pixel width of the ruler in the document's own units (1mm ≈ 3.78px). */
const MM_TO_PX = 96 / 25.4;

type MarkerKind = "first" | "left" | "right";

type MarkerProps = {
  kind: MarkerKind;
  left: number; // mm from ruler left edge
  onDrag: (deltaMm: number) => void;
};

function Marker({ kind, left, onDrag }: MarkerProps) {
  const dragState = useRef<{ startX: number; startLeft: number } | null>(null);

  const onPointerDown = (event: React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragState.current = { startX: event.clientX, startLeft: left };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!dragState.current) return;
    const dx = event.clientX - dragState.current.startX;
    const deltaMm = dx / MM_TO_PX;
    onDrag(deltaMm);
  };

  const onPointerUp = () => {
    dragState.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
  };

  return (
    <div
      onPointerDown={onPointerDown}
      className="ruler-marker group absolute top-0 -translate-x-1/2 cursor-grab active:cursor-grabbing"
      style={{ left: `${left}mm` }}
      data-kind={kind}
    >
      <div className="ruler-marker-hit" />
      <div className="ruler-marker-shape" />
    </div>
  );
}

type RulerProps = {
  editor: Editor | null;
};

export default function Ruler({ editor }: RulerProps) {
  const [indent, setIndent] = useState({
    indentLeft: 0,
    indentFirst: 0,
    indentRight: 0,
  });

  // Read the current paragraph's indentation whenever the selection moves.
  // We intentionally avoid listening to "transaction" directly — every
  // transaction would re-run this even when nothing visual changed, and the
  // selection-update event already fires on every relevant change.
  useEffect(() => {
    if (!editor) return;

    const update = () => {
      setIndent(readParagraphIndent(editor));
    };

    editor.on("selectionUpdate", update);
    update();

    return () => {
      editor.off("selectionUpdate", update);
    };
  }, [editor]);

  const onDrag = (kind: MarkerKind, deltaMm: number) => {
    if (!editor) return;
    if (kind === "first") {
      const next = clampFirst(indent.indentFirst + deltaMm);
      setParagraphIndent(editor, { indentFirst: next });
    } else if (kind === "left") {
      const next = clampLeft(indent.indentLeft + deltaMm);
      setParagraphIndent(editor, { indentLeft: next });
    } else if (kind === "right") {
      const next = clampRight(indent.indentRight + deltaMm);
      setParagraphIndent(editor, { indentRight: next });
    }
  };

  // Marker positions in mm from the ruler's left edge.
  // The ruler starts at the page's left edge (0mm). The text area starts at
  // PAGE_MARGIN_MM, so the left edge of the paragraph is at
  // PAGE_MARGIN_MM + indentLeft.
  const leftEdge = PAGE_MARGIN_MM + indent.indentLeft;
  const firstLine = leftEdge + indent.indentFirst;
  const rightEdge = PAGE_WIDTH_MM - indent.indentRight;

  return (
    <div className="ruler flex justify-center border-b border-gray-200 bg-gray-50 px-4">
      <div
        className="relative ruler-track"
        style={{ width: `${PAGE_WIDTH_MM}mm` }}
      >
        {/* Margins of the text area, so the printable width is obvious. */}
        <div
          className="absolute inset-y-0 left-0 bg-gray-200/80"
          style={{ width: `${PAGE_MARGIN_MM}mm` }}
        />
        <div
          className="absolute inset-y-0 right-0 bg-gray-200/80"
          style={{ width: `${PAGE_MARGIN_MM}mm` }}
        />

        {TICKS.map((position) => {
          const isCentimetre = position % 10 === 0;

          return (
            <div
              key={position}
              className={`absolute bottom-0 border-l ${
                isCentimetre
                  ? "h-3 border-gray-400"
                  : "h-1.5 border-gray-300"
              }`}
              style={{ left: `${position}mm` }}
            />
          );
        })}

        {LABELS.map((position) => (
          <span
            key={position}
            className="absolute top-0 -translate-x-1/2 text-[10px] leading-none text-gray-400"
            style={{ left: `${position}mm` }}
          >
            {position / 10}
          </span>
        ))}

        {/* Indentation markers — draggable */}
        <Marker
          kind="first"
          left={firstLine}
          onDrag={(d) => onDrag("first", d)}
        />
        <Marker
          kind="left"
          left={leftEdge}
          onDrag={(d) => onDrag("left", d)}
        />
        <Marker
          kind="right"
          left={rightEdge}
          onDrag={(d) => onDrag("right", d)}
        />
      </div>
    </div>
  );
}