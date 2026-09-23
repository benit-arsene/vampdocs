"use client";

import { useState } from "react";

import MenuBar from "./MenuBar";
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
  ChevronDownIcon,
  UserIcon,
} from "./icons";

export default function Navbar() {
  const { menusHidden } = useEditorUi();
  const [docTitle, setDocTitle] = useState("Untitled document");

  return (
    <nav className="relative z-30 flex items-center justify-between border-b bg-white px-4 py-1 text-sm">
      {/* LEFT: app icon + title + doc actions + menu bar */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center justify-center rounded bg-blue-100 p-1.5">
          <DocumentIcon className="h-5 w-5 text-blue-700" />
        </div>

        <input
          id="doc-title"
          type="text"
          value={docTitle}
          onChange={(e) => setDocTitle(e.target.value)}
          className="w-56 border-none bg-transparent text-lg font-semibold outline-none placeholder-gray-500"
          placeholder="Untitled document"
        />

        <button
          type="button"
          aria-label="Star"
          className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        >
          <StarIcon />
        </button>

        <button
          type="button"
          aria-label="Move"
          className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        >
          <FolderIcon />
        </button>

        <button
          type="button"
          aria-label="Save status"
          className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        >
          <CloudIcon />
        </button>

        {!menusHidden && <MenuBar />}
      </div>

      {/* RIGHT: version history + comments + video + share + avatar */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Version history"
          className="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        >
          <HistoryIcon />
        </button>

        <button
          type="button"
          aria-label="Comments"
          className="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        >
          <CommentIcon />
        </button>

        <button
          type="button"
          aria-label="Video call"
          className="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        >
          <VideoIcon />
        </button>

        <div className="mx-1 h-5 w-px bg-gray-300" />

        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <LockIcon />
          <span>Share</span>
          <ChevronDownIcon className="h-3 w-3" />
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
    </nav>
  );
}
