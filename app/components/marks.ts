import { Mark, mergeAttributes } from "@tiptap/core";
import type { Editor } from "@tiptap/core";

/*
  The marks behind the toolbar's style controls.

  `textStyle` keeps font family, font size and text colour in a single mark, so
  one selection carries one style object instead of a pile of nested spans.
  `highlight` and `comment` are separate marks that can sit on top of it.
*/

export type TextStyleAttributes = {
  fontFamily: string | null;
  fontSize: string | null;
  color: string | null;
};

export const DEFAULT_FONT_FAMILY = "Arial";
export const DEFAULT_FONT_SIZE = 11;

function styleAttribute(attributes: Partial<TextStyleAttributes>): string {
  return [
    attributes.fontFamily ? `font-family: ${attributes.fontFamily}` : null,
    attributes.fontSize ? `font-size: ${attributes.fontSize}` : null,
    attributes.color ? `color: ${attributes.color}` : null,
  ]
    .filter(Boolean)
    .join("; ");
}

export const TextStyle = Mark.create({
  name: "textStyle",

  addAttributes() {
    return {
      fontFamily: {
        default: null,
        parseHTML: (element) => element.style.fontFamily || null,
        // Rendered together with the other attributes, see renderHTML below.
        renderHTML: () => null,
      },
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize || null,
        renderHTML: () => null,
      },
      color: {
        default: null,
        parseHTML: (element) => element.style.color || null,
        renderHTML: () => null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span",
        getAttrs: (element) => {
          const style = (element as HTMLElement).style;
          return style.fontFamily || style.fontSize || style.color ? null : false;
        },
      },
    ];
  },

  renderHTML({ mark, HTMLAttributes }) {
    const style = styleAttribute(mark.attrs as TextStyleAttributes);
    return [
      "span",
      mergeAttributes(HTMLAttributes, style ? { style } : {}),
      0,
    ];
  },
});

export const Highlight = Mark.create({
  name: "highlight",

  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element) => element.style.backgroundColor || null,
        renderHTML: () => null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span",
        getAttrs: (element) =>
          (element as HTMLElement).style.backgroundColor ? null : false,
      },
    ];
  },

  renderHTML({ mark, HTMLAttributes }) {
    const color = mark.attrs.color as string | null;
    return [
      "span",
      mergeAttributes(HTMLAttributes, color ? { style: `background-color: ${color}` } : {}),
      0,
    ];
  },
});

export const CommentMark = Mark.create({
  name: "comment",

  addAttributes() {
    return {
      note: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-comment") || "",
        renderHTML: (attributes) => {
          const note = (attributes.note ?? "") as string;
          return {
            "data-comment": note,
            class: "comment-mark",
            ...(note ? { title: note } : {}),
          };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-comment]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});

export function readTextStyle(editor: Editor): TextStyleAttributes {
  const attributes = editor.getAttributes("textStyle") as
    | Partial<TextStyleAttributes>
    | undefined;

  return {
    fontFamily: attributes?.fontFamily ?? null,
    fontSize: attributes?.fontSize ?? null,
    color: attributes?.color ?? null,
  };
}

/**
 * Applies a font/size/colour change to the selection. The existing style of the
 * selection is kept and merged with the change, the way a menu in a word
 * processor behaves.
 */
export function setTextStyle(
  editor: Editor,
  patch: Partial<TextStyleAttributes>,
): void {
  const next: TextStyleAttributes = { ...readTextStyle(editor), ...patch };
  const chain = editor.chain().focus().unsetMark("textStyle");

  if (next.fontFamily || next.fontSize || next.color) {
    chain.setMark("textStyle", next);
  }

  chain.run();
}

/** Wraps (or re-wraps) the selection in a comment note. */
export function setComment(editor: Editor, note: string): void {
  const chain = editor.chain().focus().unsetMark("comment");
  if (note.trim()) {
    chain.setMark("comment", { note: note.trim() });
  }
  chain.run();
}
