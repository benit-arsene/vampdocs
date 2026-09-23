"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { ChevronDownIcon } from "./icons";

/*
  Shared dropdown used by the toolbar and the menu bar.

  Note: the bar that hosts these must not clip — an ancestor with
  `overflow: hidden/auto/scroll` would cut the panel off, which is why the
  toolbar wraps instead of scrolling sideways.
*/

type DropdownProps = {
  label: ReactNode;
  title?: string;
  active?: boolean;
  align?: "left" | "right";
  panelClassName?: string;
  triggerClassName?: string;
  showChevron?: boolean;
  /** Controlled opening, used by the menu bar to hover between menus. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onPointerEnter?: () => void;
  children: (close: () => void) => ReactNode;
};

export function Dropdown({
  label,
  title,
  active = false,
  align = "left",
  panelClassName = "w-48",
  triggerClassName = "",
  showChevron = true,
  open: controlledOpen,
  onOpenChange,
  onPointerEnter,
  children,
}: DropdownProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const containerRef = useRef<HTMLDivElement>(null);

  const setOpen = (next: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div
      className="relative shrink-0"
      ref={containerRef}
      onPointerEnter={onPointerEnter}
    >
      <button
        type="button"
        title={title}
        aria-label={title}
        aria-expanded={open}
        aria-haspopup="menu"
        // Keep the document selection while the panel is open.
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-200 ${
          active || open ? "bg-blue-100 text-blue-900 hover:bg-blue-200" : ""
        } ${triggerClassName}`}
      >
        {label}
        {showChevron && <ChevronDownIcon className="h-3 w-3" />}
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute top-full z-50 mt-1 rounded border border-gray-200 bg-white py-1 shadow-lg ${panelClassName} ${
            align === "right" ? "right-0" : "left-0"
          }`}
          onMouseDown={(event) => event.preventDefault()}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  checked = false,
  shortcut,
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  checked?: boolean;
  shortcut?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent ${
        checked ? "bg-gray-100 text-blue-900" : "text-gray-800"
      }`}
    >
      <span className="w-3 shrink-0 text-blue-700">{checked ? "✓" : ""}</span>
      <span className="flex-1">{children}</span>
      {shortcut && (
        <span className="ml-4 shrink-0 text-xs text-gray-400">{shortcut}</span>
      )}
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="my-1 h-px bg-gray-200" />;
}

/** Non-interactive row, for information inside a menu. */
export function DropdownLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 py-1 text-xs uppercase tracking-wide text-gray-400">
      {children}
    </div>
  );
}
