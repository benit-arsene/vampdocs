import { Node, mergeAttributes } from "@tiptap/core";
import type { Editor } from "@tiptap/core";

/**
 * Indentation attributes on the paragraph node.
 *
 * All values are in millimetres and are relative to the page's text-area
 * left edge (i.e. they are *inside* the left margin). A value of `0` means
 * the paragraph's left edge sits at the left margin.
 *
 * `indentFirst` only affects the first line; it is added on top of
 * `indentLeft` for that line.
 */
export type ParagraphIndentAttributes = {
  indentLeft: number;
  indentFirst: number;
  indentRight: number;
};

const DEFAULT_LEFT = 0;
const DEFAULT_FIRST = 0;
const DEFAULT_RIGHT = 0;

/** Maximum sensible left indent before the text area overflows the page. */
const MAX_LEFT_MM = 160;
/** Maximum first-line indent (positive or negative). */
const MAX_FIRST_MM = 80;
/** Minimum first-line indent (hanging indent can go negative). */
const MIN_FIRST_MM = -60;
/** Maximum right indent before the text area is gone. */
const MAX_RIGHT_MM = 160;

/**
 * A paragraph node that carries three indentation attributes.
 *
 * Registered in place of StarterKit's paragraph (disabled via
 * `paragraph: false`), so the schema has exactly one paragraph node — this
 * one. The schema properties (`group`, `content`) mirror what the default
 * paragraph provides, so lists, headings, blockquotes and everything else
 * keep working.
 */
export const ParagraphIndent = Node.create({
  name: "paragraph",
  priority: 1001,
  group: "block",
  content: "inline*",

  addAttributes() {
    return {
      indentLeft: {
        default: DEFAULT_LEFT,
        parseHTML: (element) =>
          Number.parseInt(element.style.marginLeft ?? "", 10) || DEFAULT_LEFT,
        renderHTML: (attributes) => {
          const value = (attributes.indentLeft as number | null) ?? DEFAULT_LEFT;
          return value > 0 ? { style: `margin-left: ${value}mm` } : {};
        },
      },
      indentFirst: {
        default: DEFAULT_FIRST,
        parseHTML: (element) =>
          Number.parseInt(element.style.textIndent ?? "", 10) || DEFAULT_FIRST,
        renderHTML: (attributes) => {
          const value = (attributes.indentFirst as number | null) ?? DEFAULT_FIRST;
          return value !== 0 ? { style: `text-indent: ${value}mm` } : {};
        },
      },
      indentRight: {
        default: DEFAULT_RIGHT,
        parseHTML: (element) =>
          Number.parseInt(element.style.marginRight ?? "", 10) || DEFAULT_RIGHT,
        renderHTML: (attributes) => {
          const value = (attributes.indentRight as number | null) ?? DEFAULT_RIGHT;
          return value > 0 ? { style: `margin-right: ${value}mm` } : {};
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: "p" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["p", mergeAttributes(HTMLAttributes), 0];
  },
});

/**
 * Read the indentation of the paragraph at (or containing) the current
 * selection. Falls back to defaults when no paragraph is found.
 */
export function readParagraphIndent(editor: Editor): ParagraphIndentAttributes {
  const { selection } = editor.state;
  const { $from } = selection;

  for (let d = $from.depth; d >= 0; d -= 1) {
    const parent = $from.node(d);
    if (
      parent.type.name === "paragraph" ||
      parent.type.name === "listItem"
    ) {
      return {
        indentLeft:
          (parent.attrs.indentLeft as number | null) ?? DEFAULT_LEFT,
        indentFirst:
          (parent.attrs.indentFirst as number | null) ?? DEFAULT_FIRST,
        indentRight:
          (parent.attrs.indentRight as number | null) ?? DEFAULT_RIGHT,
      };
    }
  }

  return {
    indentLeft: DEFAULT_LEFT,
    indentFirst: DEFAULT_FIRST,
    indentRight: DEFAULT_RIGHT,
  };
}

/**
 * Apply indentation to the paragraph(s) in the current selection.
 * If the selection is collapsed (cursor only), applies to the current
 * paragraph. When multiple paragraphs are selected, applies to all of them.
 */
export function setParagraphIndent(
  editor: Editor,
  patch: Partial<ParagraphIndentAttributes>,
): void {
  const { selection, doc } = editor.state;
  const positions: number[] = [];

  if (selection.empty) {
    const { $from } = selection;
    for (let d = $from.depth; d >= 0; d -= 1) {
      const parent = $from.node(d);
      if (
        parent.type.name === "paragraph" ||
        parent.type.name === "listItem"
      ) {
        positions.push($from.start(d) - 1);
        break;
      }
    }
  } else {
    doc.nodesBetween(selection.from, selection.to, (node: any, pos: number) => {
      if (
        node.type.name === "paragraph" ||
        node.type.name === "listItem"
      ) {
        positions.push(pos);
      }
      return true;
    });
  }

  if (positions.length === 0) return;

  const tr = editor.state.tr;
  positions.forEach((pos) => {
    const node = doc.nodeAt(pos);
    if (!node) return;
    const current = {
      indentLeft:
        (node.attrs.indentLeft as number | null) ?? DEFAULT_LEFT,
      indentFirst:
        (node.attrs.indentFirst as number | null) ?? DEFAULT_FIRST,
      indentRight:
        (node.attrs.indentRight as number | null) ?? DEFAULT_RIGHT,
    };
    const next = { ...current, ...patch };
    tr.setNodeMarkup(pos, undefined, next, node.attrs.marks);
  });

  editor.view.dispatch(tr);
}

export const clampLeft = (value: number): number =>
  Math.max(0, Math.min(MAX_LEFT_MM, Math.round(value)));
export const clampFirst = (value: number): number =>
  Math.max(MIN_FIRST_MM, Math.min(MAX_FIRST_MM, Math.round(value)));
export const clampRight = (value: number): number =>
  Math.max(0, Math.min(MAX_RIGHT_MM, Math.round(value)));