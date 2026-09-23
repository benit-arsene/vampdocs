import type { Editor } from "@tiptap/core";

/*
  Everything the toolbar's dropdowns list. Kept out of the component so the
  markup stays readable and the lists are easy to extend.
*/

/** Web-safe families, so every option renders without loading a webfont. */
export const FONT_FAMILIES = [
  "Arial",
  "Helvetica",
  "Verdana",
  "Tahoma",
  "Trebuchet MS",
  "Segoe UI",
  "Calibri",
  "Candara",
  "Corbel",
  "Century Gothic",
  "Franklin Gothic Medium",
  "Gill Sans MT",
  "Optima",
  "Times New Roman",
  "Georgia",
  "Garamond",
  "Palatino Linotype",
  "Book Antiqua",
  "Cambria",
  "Constantia",
  "Consolas",
  "Courier New",
  "Lucida Console",
  "Rockwell",
  "Copperplate",
  "Comic Sans MS",
  "Impact",
  "Brush Script MT",
];

/** Point sizes, like a word processor's size menu. */
export const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72];

export const TEXT_COLORS: { name: string; value: string }[] = [
  { name: "Black", value: "#000000" },
  { name: "Dark grey 4", value: "#434343" },
  { name: "Dark grey 3", value: "#666666" },
  { name: "Dark grey 2", value: "#999999" },
  { name: "Dark grey 1", value: "#b7b7b7" },
  { name: "Grey", value: "#cccccc" },
  { name: "White", value: "#ffffff" },
  { name: "Red berry", value: "#980000" },
  { name: "Red", value: "#ff0000" },
  { name: "Orange", value: "#ff9900" },
  { name: "Yellow", value: "#ffff00" },
  { name: "Green", value: "#00ff00" },
  { name: "Cyan", value: "#00ffff" },
  { name: "Cornflower blue", value: "#4a86e8" },
  { name: "Blue", value: "#0000ff" },
  { name: "Purple", value: "#9900ff" },
  { name: "Magenta", value: "#ff00ff" },
  { name: "Brown", value: "#8b4513" },
];

export const HIGHLIGHT_COLORS: { name: string; value: string }[] = [
  { name: "Yellow", value: "#ffff8d" },
  { name: "Green", value: "#b9f6a5" },
  { name: "Cyan", value: "#a5f2f3" },
  { name: "Blue", value: "#b3d4ff" },
  { name: "Purple", value: "#e0b3ff" },
  { name: "Pink", value: "#ffc7ec" },
  { name: "Red", value: "#ffb3b3" },
  { name: "Orange", value: "#ffd9a5" },
  { name: "Grey", value: "#dcdcdc" },
];

export const ZOOM_LEVELS = [0.5, 0.75, 0.9, 1, 1.25, 1.5, 2];

export type BlockStyle = {
  id: string;
  label: string;
  /** Preview styling of the dropdown row. */
  className: string;
  isActive: (editor: Editor) => boolean;
  apply: (editor: Editor) => void;
};

export const BLOCK_STYLES: BlockStyle[] = [
  {
    id: "paragraph",
    label: "Normal text",
    className: "text-sm",
    isActive: (editor) => editor.isActive("paragraph"),
    apply: (editor) => {
      editor.chain().focus().setParagraph().run();
    },
  },
  {
    id: "heading-1",
    label: "Heading 1",
    className: "text-xl font-bold",
    isActive: (editor) => editor.isActive("heading", { level: 1 }),
    apply: (editor) => {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    },
  },
  {
    id: "heading-2",
    label: "Heading 2",
    className: "text-lg font-semibold",
    isActive: (editor) => editor.isActive("heading", { level: 2 }),
    apply: (editor) => {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    },
  },
  {
    id: "heading-3",
    label: "Heading 3",
    className: "text-base font-semibold",
    isActive: (editor) => editor.isActive("heading", { level: 3 }),
    apply: (editor) => {
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    },
  },
  {
    id: "quote",
    label: "Quote",
    className: "text-sm italic text-gray-600",
    isActive: (editor) => editor.isActive("blockquote"),
    apply: (editor) => {
      editor.chain().focus().toggleBlockquote().run();
    },
  },
];
