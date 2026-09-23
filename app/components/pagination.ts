import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/*
  A4 pagination
  =============

  One continuous ProseMirror editor is laid out as a stack of A4 sheets.

    * `.ProseMirror` is transparent and exactly one page wide with one page of
      padding, so the first page's text area is already correct on its own.
    * The white sheets are painted behind it (see Editor.tsx), one per page,
      spaced `pageHeight + pageGap` apart.
    * Left alone, text would keep flowing straight through the bottom margin and
      straight through the gap between sheets. So this module measures where
      every line of text ends up and, wherever a line would leave the text area,
      inserts an empty block-level *spacer* (a decoration widget) before it. The
      spacer pushes that line — and everything after it — down until it lands
      exactly on the next page's text area. Overflow therefore continues on
      page 2, 3, ... with the same margins and padding as page 1.

  Paragraphs and list items break between lines, like a word processor.
  Headings, quotes and everything else move to the next page as a whole.
  Spacers are decorations, never document content: undo, copy, save and
  collaboration never see them.
*/

/** Millimetres -> CSS pixels (CSS defines 1in = 96px = 25.4mm). */
export const MM_TO_PX = 96 / 25.4;

export const PAGE_WIDTH_MM = 210;
export const PAGE_HEIGHT_MM = 297;
export const PAGE_MARGIN_MM = 25;
export const PAGE_GAP_MM = 20;

export const PAGE_WIDTH_PX = PAGE_WIDTH_MM * MM_TO_PX;
export const PAGE_HEIGHT_PX = PAGE_HEIGHT_MM * MM_TO_PX;
export const PAGE_MARGIN_PX = PAGE_MARGIN_MM * MM_TO_PX;
/** Distance from the top of one sheet to the top of the next one. */
export const PAGE_PITCH_PX = PAGE_HEIGHT_PX + PAGE_GAP_MM * MM_TO_PX;

/** Height the editor needs so that `pageCount` sheets are fully covered. */
export function pagesHeightPx(pageCount: number): number {
  return (Math.max(1, pageCount) - 1) * PAGE_PITCH_PX + PAGE_HEIGHT_PX;
}

/** Set on spacer elements so they are easy to spot and to skip. */
const SPACER_ATTR = "data-page-break-spacer";
/** Rects closer than this vertically belong to the same line of text. */
const LINE_TOLERANCE_PX = 2;
/** Stops broken content from spinning the layout loop forever. */
const MAX_PAGES = 1000;
/** Absorbs sub-pixel jitter so a line that fits is not pushed to the next page. */
const EPSILON_PX = 0.5;

export const paginationKey = new PluginKey<DecorationSet>("pagination");

/**
 * Holds the page-break spacers. The layout itself lives in
 * `computePageBreaks`, which the editor component drives.
 */
export const Pagination = Extension.create({
  name: "pagination",

  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key: paginationKey,
        state: {
          init: () => DecorationSet.empty,
          apply: (transaction, value) => {
            const next = transaction.getMeta(paginationKey) as
              | DecorationSet
              | undefined;
            if (next) return next;
            return value.map(transaction.mapping, transaction.doc);
          },
        },
        // Without this ProseMirror holds the spacers but never renders them.
        props: {
          decorations(state) {
            return paginationKey.getState(state) ?? DecorationSet.empty;
          },
        },
      }),
    ];
  },
});

type Fragment = {
  /** Distance from the editor's top edge to the top of the glyphs on this line. */
  top: number;
  /** Distance from the editor's top edge to the bottom of those glyphs. */
  bottom: number;
  /** Document position a page break may be inserted at, before this line. */
  resolvePos: () => number | null;
};

type Block = {
  el: HTMLElement;
  /** Document position of the block itself. */
  pos: number;
  /** Whether the block may be split across pages line by line. */
  splittable: boolean;
};

/** Vertical extent of every rendered line of text, in editor coordinates. */
function measureLines(el: HTMLElement, editorTop: number) {
  const range = document.createRange();
  range.selectNodeContents(el);

  const lines: { top: number; bottom: number }[] = [];

  for (const rect of Array.from(range.getClientRects())) {
    if (rect.height <= 0 || rect.width <= 0) continue;

    const top = rect.top - editorTop;
    const line = lines.find(
      (candidate) => Math.abs(candidate.top - top) < LINE_TOLERANCE_PX,
    );

    if (line) {
      line.top = Math.min(line.top, top);
      line.bottom = Math.max(line.bottom, rect.bottom - editorTop);
    } else {
      lines.push({ top, bottom: rect.bottom - editorTop });
    }
  }

  lines.sort((a, b) => a.top - b.top);
  return lines;
}

/**
 * Document position of the first character rendered on the line whose glyphs
 * start at `lineTop`. Browsers do not expose line boxes, so we look for the
 * first character whose rect sits on that line.
 */
function positionAtLineStart(
  el: HTMLElement,
  lineTop: number,
  editorTop: number,
  view: EditorView,
): number | null {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node as Text;
    if (text.data.length === 0) continue;

    const textRange = document.createRange();
    textRange.selectNodeContents(text);
    const reachesLine = Array.from(textRange.getClientRects()).some(
      (rect) =>
        rect.height > 0 &&
        Math.abs(rect.top - editorTop - lineTop) < LINE_TOLERANCE_PX,
    );
    if (!reachesLine) continue;

    for (let offset = 0; offset < text.data.length; offset += 1) {
      const charRange = document.createRange();
      charRange.setStart(text, offset);
      charRange.setEnd(text, offset + 1);

      const rect = charRange.getBoundingClientRect();
      if (rect.height <= 0) continue;
      if (Math.abs(rect.top - editorTop - lineTop) >= LINE_TOLERANCE_PX) {
        continue;
      }

      try {
        return view.posAtDOM(text, offset);
      } catch {
        return null;
      }
    }
  }

  return null;
}

/**
 * The fragments a block occupies, in document order. Splittable blocks
 * contribute one fragment per rendered line, everything else a single one.
 */
function blockFragments(
  block: Block,
  editorTop: number,
  view: EditorView,
): Fragment[] {
  const { el, pos, splittable } = block;
  const lines = measureLines(el, editorTop);

  if (!splittable || lines.length <= 1) {
    const rect = el.getBoundingClientRect();
    const box = { top: rect.top - editorTop, bottom: rect.bottom - editorTop };
    const first = lines[0] ?? box;
    const last = lines[lines.length - 1] ?? box;

    return [
      {
        top: first.top,
        bottom: last.bottom,
        // Inside the block, so the spacer never interacts with sibling margins.
        resolvePos: () => pos + 1,
      },
    ];
  }

  return lines.map((line, index) => ({
    top: line.top,
    bottom: line.bottom,
    resolvePos:
      index === 0
        ? () => pos + 1
        : () => positionAtLineStart(el, line.top, editorTop, view),
  }));
}

function spacerElement(height: number): HTMLElement {
  const el = document.createElement("span");
  el.className = "page-break-spacer";
  el.setAttribute(SPACER_ATTR, "");
  el.setAttribute("aria-hidden", "true");
  el.setAttribute("contenteditable", "false");
  el.style.height = `${height}px`;
  return el;
}

/**
 * Measures the document and returns the spacers that keep it inside the A4 text
 * areas, plus the resulting page count. Returns `null` when a block is not
 * rendered yet, so callers can keep the previous layout.
 */
function computePageBreaks(view: EditorView): {
  decorations: DecorationSet;
  pageCount: number;
} | null {
  const doc = view.state.doc;

  if (doc.childCount === 0) {
    return { decorations: DecorationSet.empty, pageCount: 1 };
  }

  const editorTop = view.dom.getBoundingClientRect().top;

  // Blocks are looked up through the view, so stray DOM inside the editor
  // (ProseMirror's own drop cursor, gap cursor, ...) can never throw the
  // layout off.
  const blocks: Block[] = [];

  doc.forEach((node, offset) => {
    const element = view.nodeDOM(offset);

    if (!(element instanceof HTMLElement)) return;

    blocks.push({
      el: element,
      pos: offset,
      splittable:
        node.type.name === "paragraph" || node.type.name === "listItem",
    });
  });

  if (blocks.length !== doc.childCount) return null;

  const contentTop = (page: number) => page * PAGE_PITCH_PX + PAGE_MARGIN_PX;
  const contentBottom = (page: number) =>
    page * PAGE_PITCH_PX + PAGE_HEIGHT_PX - PAGE_MARGIN_PX;

  const spacers: { pos: number; height: number }[] = [];
  let page = 0;
  let shift = 0;
  // Nothing has been placed on the first page yet.
  let firstOnPage = true;

  for (const block of blocks) {
    for (const fragment of blockFragments(block, editorTop, view)) {
      let top = fragment.top + shift;
      let bottom = fragment.bottom + shift;

      // A line that would leave the text area moves down to the next page,
      // unless it is the first thing on this page — then it cannot fit anywhere
      // and is allowed to overflow instead of looping forever.
      if (!firstOnPage && bottom > contentBottom(page) + EPSILON_PX) {
        const breakPos = fragment.resolvePos();
        const delta = contentTop(page + 1) - top;

        if (breakPos !== null && delta > 0) {
          shift += delta;
          top += delta;
          bottom += delta;
          spacers.push({ pos: breakPos, height: delta });
          page += 1;
        }
      }

      while (bottom > contentBottom(page) + EPSILON_PX && page < MAX_PAGES) {
        page += 1;
      }

      firstOnPage = false;
    }
  }

  const decorations = spacers.length
    ? DecorationSet.create(
        doc,
        spacers.map(({ pos, height }) =>
          Decoration.widget(pos, () => spacerElement(height), {
            side: -1,
            // The height is part of the key so ProseMirror rebuilds the element
            // when a break moves instead of keeping a stale box.
            key: `page-break-${pos}-${height.toFixed(2)}`,
          }),
        ),
      )
    : DecorationSet.empty;

  return { decorations, pageCount: Math.max(1, page + 1) };
}

/**
 * Re-lays out the document: drops the previous spacers, measures the natural
 * flow, then applies the new ones. Returns the page count, or `null` when the
 * document could not be measured this time.
 */
export function applyPagination(view: EditorView): number | null {
  if (paginationKey.getState(view.state)?.find().length) {
    view.dispatch(view.state.tr.setMeta(paginationKey, DecorationSet.empty));
  }

  const result = computePageBreaks(view);
  if (!result) return null;

  if (result.decorations.find().length) {
    view.dispatch(view.state.tr.setMeta(paginationKey, result.decorations));
  }

  return result.pageCount;
}
