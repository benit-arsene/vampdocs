import { Node, mergeAttributes } from "@tiptap/core";

/**
 * Inline image, inserted as a data URL so the document stays self contained.
 * It is an atom: no editable content, one DOM node.
 */
export const Image = Node.create({
  name: "image",

  inline: true,
  group: "inline",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute("src"),
        renderHTML: (attributes) => ({ src: attributes.src }),
      },
      alt: {
        default: null,
        parseHTML: (element) => element.getAttribute("alt"),
        renderHTML: (attributes) =>
          attributes.alt ? { alt: attributes.alt } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: "img[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes, { class: "doc-image" })];
  },
});

/**
 * Opens the file picker and resolves with the chosen image, or `null` when the
 * dialog is dismissed.
 */
export function pickImageFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.addEventListener(
      "change",
      () => resolve(input.files?.[0] ?? null),
      { once: true },
    );

    // Dismissing the dialog fires no `change` event, so settle when focus comes
    // back instead.
    window.addEventListener(
      "focus",
      () => {
        window.setTimeout(() => {
          if (!input.files?.length) resolve(null);
        }, 300);
      },
      { once: true },
    );

    input.click();
  });
}
