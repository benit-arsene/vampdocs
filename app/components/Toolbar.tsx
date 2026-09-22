"use client";

import type { Editor } from "@tiptap/react";
import type { ReactNode, MouseEvent } from "react";
import {
  SearchIcon,
  PrinterIcon,
  SpellCheckIcon,
  FormatPaintIcon,
  ZoomInIcon,
  ZoomOutIcon,
  ChevronDownIcon,
  MinusIcon,
  PlusIcon,
  TextColorIcon,
  HighlighterIcon,
  LinkIcon,
  CommentIcon,
  ImageIcon,
  MoreHorizontalIcon,
  PencilIcon,
  ChevronUpIcon,
} from "./icons";

type ToolbarProps = {
  editor: Editor | null;
};

type ToolbarButtonProps = {
  icon: ReactNode;
  label?: string;
  active?: boolean;
  onClick?: () => void;
  onMouseDown?: (e: MouseEvent<HTMLButtonElement>) => void;
};

const ToolbarButton = ({
  icon,
  label,
  active = false,
  onClick,
  onMouseDown,
}: ToolbarButtonProps) => {
  const baseClasses =
    "flex items-center justify-center rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-200";
  const activeClasses = active
    ? "bg-blue-100 text-blue-900 hover:bg-blue-200"
    : "";

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={onMouseDown}
      className={`${baseClasses} ${activeClasses}`}
      aria-label={label}
    >
      {icon}
    </button>
  );
};

const Divider = () => (
  <div className="h-5 w-px bg-gray-300" />
);

export default function Toolbar({ editor }: ToolbarProps) {
  if (!editor) {
    return null;
  }

  const editorMouseDown = (handler: () => void) => (
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      handler();
    }
  );

  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 bg-gray-50 px-3 py-1 text-sm">
      {/* Group 1: Search and utility */}
      <ToolbarButton
        icon={<SearchIcon className="h-4 w-4" />}
        label="Find"
        onClick={() => {}}
      />

      <ToolbarButton
        icon={
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 14 14 14 13 14" />
            <path d="M20 9l-2 2-2-2" />
            <path d="M5 11l5 5 5-5" />
          </svg>
        }
        label="Undo"
        onMouseDown={editorMouseDown(() =>
          editor.chain().focus().undo().run(),
        )}
      />

      <ToolbarButton
        icon={
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 14 10 14 11 14" />
            <path d="M4 14l5-5 5 5" />
            <path d="M19 14l-2-2 2-2" />
          </svg>
        }
        label="Redo"
        onMouseDown={editorMouseDown(() =>
          editor.chain().focus().redo().run(),
        )}
      />

      <ToolbarButton
        icon={<PrinterIcon className="h-4 w-4" />}
        label="Print"
        onClick={() => {}}
      />

      <ToolbarButton
        icon={<SpellCheckIcon className="h-4 w-4" />}
        label="Spelling and grammar"
        onClick={() => {}}
      />

      <ToolbarButton
        icon={<FormatPaintIcon className="h-4 w-4" />}
        label=" Paint format"
        onClick={() => {}}
      />

      <ToolbarButton
        icon={<ZoomOutIcon className="h-4 w-4" />}
        label="Zoom out"
        onClick={() => {}}
      />

      <span className="text-gray-500">100%</span>

      <ToolbarButton
        icon={<ZoomInIcon className="h-4 w-4" />}
        label="Zoom in"
        onClick={() => {}}
      />

      <Divider />

      {/* Group 2: Text structure */}
      <button
        type="button"
        className="flex items-center gap-1 rounded px-2.5 py-1 text-sm text-gray-700 hover:bg-gray-200"
      >
        <span>Normal text</span>
        <ChevronDownIcon className="h-3 w-3" />
      </button>

      <Divider />

      <button
        type="button"
        className="flex items-center gap-1 rounded px-2.5 py-1 text-sm text-gray-700 hover:bg-gray-200"
      >
        <span>Arial</span>
        <ChevronDownIcon className="h-3 w-3" />
      </button>

      <Divider />

      <div className="flex items-center gap-0.5 rounded border border-gray-300">
        <ToolbarButton
          icon={<MinusIcon className="h-3 w-3" />}
          label="Decrease font size"
          onClick={() => {}}
        />
        <span className="px-1.5 text-gray-600">11</span>
        <ToolbarButton
          icon={<PlusIcon className="h-3 w-3" />}
          label="Increase font size"
          onClick={() => {}}
        />
      </div>

      <Divider />

      {/* Group 3: Text formatting */}
      <ToolbarButton
        icon={
          <span className="text-xs font-bold">B</span>
        }
        label="Bold"
        active={editor.isActive("bold")}
        onMouseDown={editorMouseDown(() =>
          editor.chain().focus().toggleBold().run(),
        )}
      />

      <ToolbarButton
        icon={
          <span className="text-xs italic">I</span>
        }
        label="Italic"
        active={editor.isActive("italic")}
        onMouseDown={editorMouseDown(() =>
          editor.chain().focus().toggleItalic().run(),
        )}
      />

      <ToolbarButton
        icon={
          <span className="text-xs underline underline-offset-1">U</span>
        }
        label="Underline"
        active={editor.isActive("underline")}
        onMouseDown={editorMouseDown(() =>
          editor.chain().focus().toggleUnderline().run(),
        )}
      />

      <ToolbarButton
        icon={<TextColorIcon className="h-4 w-4" />}
        label="Text color"
        onClick={() => {}}
      />

      <ToolbarButton
        icon={<HighlighterIcon className="h-4 w-4" />}
        label="Highlight color"
        onClick={() => {}}
      />

      <Divider />

      {/* Group 4: Insertions */}
      <ToolbarButton
        icon={<LinkIcon className="h-4 w-4" />}
        label="Insert link"
        onClick={() => {}}
      />

      <ToolbarButton
        icon={<CommentIcon className="h-4 w-4" />}
        label="Add comment"
        onClick={() => {}}
      />

      <ToolbarButton
        icon={<ImageIcon className="h-4 w-4" />}
        label="Insert image"
        onClick={() => {}}
      />

      <ToolbarButton
        icon={<MoreHorizontalIcon className="h-4 w-4" />}
        label="More"
        onClick={() => {}}
      />

      <Divider />

      {/* Group 5: View controls */}
      <ToolbarButton
        icon={
          <div className="flex items-center gap-1">
            <PencilIcon className="h-3 w-3" />
            <span>Editing</span>
            <ChevronDownIcon className="h-3 w-3" />
          </div>
        }
        label="Editing mode"
        onClick={() => {}}
      />

      <ToolbarButton
        icon={<ChevronUpIcon className="h-4 w-4" />}
        label="Hide menus"
        onClick={() => {}}
      />
    </div>
  );
}
