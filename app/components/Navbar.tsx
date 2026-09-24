"use client";

import { useEffect, useState } from "react";

import MenuBar from "./MenuBar";
import { Dropdown, DropdownItem } from "./dropdown";
import { ShareDialog } from "./ShareDialog";
import { useEditorUi } from "./editorUi";
import {
  DocumentIcon,
  StarIcon,
  FolderIcon,
  CloudIcon,
  HistoryIcon,
  CommentIcon,
  VideoIcon,
  LockIcon,
  PencilIcon,
  UserIcon,
} from "./icons";

const STORAGE_KEY = "vampdocs-document-title";
const DEFAULT_TITLE = "Untitled document";

function loadTitle(): string {
  if (typeof window === "undefined") return DEFAULT_TITLE;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && saved.trim()) return saved;
  } catch {
    // localStorage may be unavailable (private mode, quota, etc.) — fall back.
  }
  return DEFAULT_TITLE;
}

export default function Navbar() {
  const { menusHidden, editor } = useEditorUi();
  const [docTitle, setDocTitle] = useState<string>(loadTitle);
  const [shareOpen, setShareOpen] = useState(false);

  // Persist the title to localStorage on every change.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, docTitle);
    } catch {
      // Ignore persistence errors.
    }
  }, [docTitle]);

  if (!editor) return null;

  return (
    <nav className="relative z-30">
      {/* ROW 1 — DOCUMENT HEADER */}
      <div className="doc-header flex items-center justify-between px-4 py-1.5 text-sm">
        {/* LEFT: app icon + title + doc actions */}
        <div className="flex items-center gap-1">
          <div className="flex items-center justify-center rounded bg-blue-100 p-1.5">
            <DocumentIcon className="h-5 w-5 text-blue-700" />
          </div>

          <input
            id="doc-title"
            type="text"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            onBlur={() => {
              // If the user clears the title completely, restore the default.
              if (!docTitle.trim()) setDocTitle(DEFAULT_TITLE);
            }}
            className="doc-title-input w-56 border-none bg-transparent outline-none placeholder-gray-500"
            placeholder="Untitled document"
          />

          <button
            type="button"
            aria-label="Star"
            className="icon-btn text-gray-600 hover:text-gray-900"
          >
            <StarIcon className="h-4 w-4" />
          </button>

          <button
            type="button"
            aria-label="Move"
            className="icon-btn text-gray-600 hover:text-gray-900"
          >
            <FolderIcon className="h-4 w-4" />
          </button>

          <button
            type="button"
            aria-label="Save status"
            className="icon-btn text-gray-600 hover:text-gray-900"
          >
            <CloudIcon className="h-4 w-4" />
          </button>
        </div>

        {/* RIGHT: version history + comments + video + share + avatar + editing mode */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Version history"
            className="icon-btn text-gray-600 hover:text-gray-900"
          >
            <HistoryIcon className="h-4 w-4" />
          </button>

          <button
            type="button"
            aria-label="Comments"
            className="icon-btn text-gray-600 hover:text-gray-900"
          >
            <CommentIcon className="h-4 w-4" />
          </button>

          <button
            type="button"
            aria-label="Video call"
            className="icon-btn text-gray-600 hover:text-gray-900"
          >
            <VideoIcon className="h-4 w-4" />
          </button>

          <div className="mx-1 h-5 w-px bg-gray-300" />

          <Dropdown
            title="Editing mode"
            panelClassName="w-40"
            align="right"
            showChevron={true}
            triggerClassName="flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
            label={
              <span className="flex items-center gap-1.5">
                <PencilIcon className="h-4 w-4" />
                <span>{editor.isEditable ? "Editing" : "Viewing"}</span>
              </span>
            }
          >
            {(close) => (
              <>
                <DropdownItem
                  checked={editor.isEditable}
                  onClick={() => {
                    editor.setEditable(true);
                    close();
                  }}
                >
                  Editing
                </DropdownItem>
                <DropdownItem
                  checked={!editor.isEditable}
                  onClick={() => {
                    editor.setEditable(false);
                    close();
                  }}
                >
                  Viewing
                </DropdownItem>
              </>
            )}
          </Dropdown>

          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <LockIcon className="h-4 w-4" />
            <span>Share</span>
          </button>

          <div className="mx-1 h-5 w-px bg-gray-300" />

          <button
            type="button"
            aria-label="Account"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
          >
            <UserIcon className="h-4 w-4 text-gray-700" />
          </button>
        </div>
      </div>

      {/* ROW 2 — APPLICATION MENU */}
      {!menusHidden && (
        <div className="app-menu flex items-center justify-between px-4 py-1 text-sm">
          <div className="flex items-center">
            <MenuBar />
          </div>
        </div>
      )}

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        docTitle={docTitle}
      />
    </nav>
  );
}