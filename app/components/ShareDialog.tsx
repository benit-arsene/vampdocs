"use client";

import { useEffect, useRef, useState } from "react";
import { LinkIcon, XIcon } from "./icons";

type ShareDialogProps = {
  open: boolean;
  onClose: () => void;
  docTitle: string;
};

export function ShareDialog({ open, onClose, docTitle }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Generate a reasonable local document URL from the current browser URL.
  const link = typeof window !== "undefined" ? window.location.href : "";

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Fallback for browsers without clipboard API or when permissions are denied.
      const textarea = document.createElement("textarea");
      textarea.value = link;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
      } catch {
        // Silent failure — the user can copy manually.
      }
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === backdropRef.current) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-dialog-title"
        className="relative w-full max-w-md rounded-lg border border-gray-200 bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2
            id="share-dialog-title"
            className="text-base font-semibold text-gray-900"
          >
            Share
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="icon-btn text-gray-500 hover:text-gray-900"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          <p className="mb-2 text-sm text-gray-500">
            Anyone with the link can view this document.
          </p>
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
            <p
              className="truncate text-sm text-gray-700"
              title={docTitle}
            >
              {docTitle}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
          <span
            className={`text-sm transition-opacity duration-200 ${
              copied ? "text-green-600 opacity-100" : "text-transparent opacity-0"
            }`}
          >
            Link copied
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <LinkIcon className="h-4 w-4" />
            Copy link
          </button>
        </div>
      </div>
    </div>
  );
}