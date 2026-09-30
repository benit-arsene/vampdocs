"use client";

import { useEffect, useState } from "react";

import MenuBar from "./MenuBar";
import { Dropdown, DropdownItem } from "./dropdown";
import { ShareDialog } from "./ShareDialog";
import { useEditorUi } from "./editorUi";
import { renameDocument } from "../utils/documents";
import type { SaveStatus } from "../hooks/useAutosave";
import {
  DocumentIcon,
  StarIcon,
  HistoryIcon,
  CommentIcon,
  VideoIcon,
  LockIcon,
  PencilIcon,
  UserIcon,
} from "./icons";

const STAR_KEY = "vampdocs-document-starred";
const DEFAULT_TITLE = "Untitled document";

/**
 * Point the address bar at the document that is actually open.
 *
 * The slug always comes from the database row, never from the title. That
 * matters because the server generates it with a collision suffix the title
 * cannot reproduce, and because renaming a document does not change its slug —
 * so a title-derived URL would drift away from the row it is meant to address.
 *
 * This only adjusts the address bar. The document is already loaded and its
 * content is already in the editor, so there is nothing for the router to
 * fetch. Real navigation — File → New, following a link to another document —
 * goes through `next/navigation` instead.
 */
function syncUrl(slug: string): void {
  if (typeof window === "undefined") return;

  const targetPath = `/${slug}`;

  // Only update if the path actually changed, to avoid churning history.
  if (window.location.pathname !== targetPath) {
    try {
      window.history.replaceState(null, "", targetPath);
    } catch {
      // Some browsers may reject non-ASCII URLs even after normalization.
    }
  }
}

/** Trigger a browser download for the given content. */
function loadStarred(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STAR_KEY) === "true";
  } catch {
    return false;
  }
}

export default function Navbar({
  saveStatus,
}: {
  saveStatus?: SaveStatus;
}) {
  const {
    menusHidden,
    editor,
    docTitle,
    setDocTitle,
    documentId,
    documentSlug,
  } = useEditorUi();
  const [starred, setStarred] = useState<boolean>(loadStarred);
  const [shareOpen, setShareOpen] = useState(false);

  // Keep the address bar pointing at the open document. With no document open
  // there is nothing to address, so `/` stays `/` — the URL must not claim to
  // be a saved document that the editor is not showing. Renaming does not move
  // the URL either: the slug is the server's, and a rename only PATCHes title.
  useEffect(() => {
    if (!documentId || !documentSlug) return;
    syncUrl(documentSlug);
  }, [documentId, documentSlug]);

  // Persist the starred flag.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STAR_KEY, starred ? "true" : "false");
    } catch {
      // Ignore persistence errors.
    }
  }, [starred]);

  const toggleStar = () => setStarred((s: boolean) => !s);
  const openVersionHistory = () => {
    window.alert("Version history is not yet connected.");
  };
  const openComments = () => {
    window.alert("Comments are not yet connected.");
  };
  const openVideoCall = () => {
    window.alert("Video call is not yet connected.");
  };

  if (!editor) return null;

  return (
    <nav className="relative z-30">
      {/* ROW 1 — DOCUMENT HEADER */}
      <div className="doc-header flex items-center justify-between px-4 py-2.5 text-sm">
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
            onBlur={async () => {
              // If the user clears the title completely, restore the default.
              const nextTitle = docTitle.trim() || DEFAULT_TITLE;
              if (nextTitle !== docTitle) setDocTitle(nextTitle);

              // Persist the rename to Neon for the document created by File → New.
              // No-op when no database-backed document is open yet.
              if (documentId && nextTitle) {
                const updated = await renameDocument(documentId, nextTitle);
                if (updated) {
                  setDocTitle(updated.title);
                }
              }
            }}
            className="doc-title-input w-56 border-none bg-transparent outline-none placeholder-gray-500"
            placeholder="Untitled document"
          />

          <button
            type="button"
            aria-label="Star"
            onClick={toggleStar}
            className={`icon-btn ${
              starred ? "text-yellow-500" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <StarIcon className="h-4 w-4" />
          </button>
        </div>

        {/* RIGHT: version history + comments + video + share + avatar + editing mode */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Version history"
            onClick={openVersionHistory}
            className="icon-btn text-gray-600 hover:text-gray-900"
          >
            <HistoryIcon className="h-4 w-4" />
          </button>

          <button
            type="button"
            aria-label="Comments"
            onClick={openComments}
            className="icon-btn text-gray-600 hover:text-gray-900"
          >
            <CommentIcon className="h-4 w-4" />
          </button>

          <button
            type="button"
            aria-label="Video call"
            onClick={openVideoCall}
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

          {/* Lightweight save status. Only meaningful once a database-backed
              document is open; otherwise it renders nothing. */}
          {saveStatus && saveStatus !== "idle" && (
            <span
              className={`text-xs font-medium ${
                saveStatus === "saving"
                  ? "text-amber-600"
                  : saveStatus === "saved"
                    ? "text-green-600"
                    : "text-red-600"
              }`}
              aria-live="polite"
            >
              {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : "Save failed"}
            </span>
          )}

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