"use client";

import { useState } from "react";

import {
  Dropdown,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
} from "./dropdown";
import { useEditorUi } from "./editorUi";
import { pickImageFile } from "./imageNode";
import { BLOCK_STYLES, ZOOM_LEVELS } from "./toolbarOptions";
import { CommentPanel, LinkPanel } from "./panels";

function downloadFile(name: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function documentHtml(html: string) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>VampDocs document</title>
    <style>
      body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt;
             line-height: 1.7; max-width: 160mm; margin: 25mm auto; }
    </style>
  </head>
  <body>${html}</body>
</html>`;
}

/** Insert menu, which can swap its list for the link or comment form. */
function InsertMenu({ close }: { close: () => void }) {
  const { editor } = useEditorUi();
  const [panel, setPanel] = useState<"link" | "comment" | null>(null);

  if (!editor) return null;

  if (panel === "link") {
    return <LinkPanel editor={editor} close={close} />;
  }

  if (panel === "comment") {
    return <CommentPanel editor={editor} close={close} />;
  }

  return (
    <>
      <DropdownItem
        onClick={() => {
          void pickImageFile().then((file) => {
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result !== "string") return;
              editor
                .chain()
                .focus()
                .insertContent({
                  type: "image",
                  attrs: { src: reader.result, alt: file.name },
                })
                .run();
            };
            reader.readAsDataURL(file);
          });
        }}
      >
        Image
      </DropdownItem>
      <DropdownItem onClick={() => setPanel("link")}>Link</DropdownItem>
      <DropdownItem onClick={() => setPanel("comment")}>Comment</DropdownItem>
      <DropdownItem
        onClick={() => {
          editor.chain().focus().setHorizontalRule().run();
          close();
        }}
      >
        Horizontal line
      </DropdownItem>
    </>
  );
}

export default function MenuBar() {
  const ui = useEditorUi();
  const { editor } = ui;
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [fullScreen, setFullScreen] = useState(false);

  if (!editor) return null;

  const text = editor.getText();
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const characters = text.replace(/\n/g, "").length;
  const pages = document.querySelectorAll(".page-sheet").length;
  const extensionNames = editor.extensionManager.extensions
    .map((extension) => extension.name)
    .filter((name) => name !== "starterKit")
    .sort();

  const copySelection = async () => {
    const { from, to } = editor.state.selection;
    const selected = editor.state.doc.textBetween(from, to, "\n");
    if (selected) await navigator.clipboard.writeText(selected);
  };

  // Opening one menu, then hovering another, switches between them like a
  // native menu bar.
  const menuProps = (label: string) => ({
    open: openMenu === label,
    onOpenChange: (open: boolean) => setOpenMenu(open ? label : null),
    onPointerEnter: () => {
      if (openMenu) setOpenMenu(label);
    },
  });

  return (
    <div className="flex items-center gap-0.5 border-l pl-2">
      {/* File */}
      <Dropdown
        {...menuProps("File")}
        title="File"
        panelClassName="w-60"
        triggerClassName="font-medium"
        label={<span>File</span>}
      >
        {(close) => (
          <>
            <DropdownItem
              onClick={() => {
                close();
                if (
                  window.confirm(
                    "Start a new document? Anything unsaved will be lost.",
                  )
                ) {
                  editor.commands.clearContent(true);
                  editor.commands.focus("start");
                }
              }}
            >
              New
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                close();
                document.getElementById("doc-title")?.focus();
              }}
            >
              Rename
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem
              onClick={() => {
                close();
                downloadFile("document.html", documentHtml(editor.getHTML()), "text/html");
              }}
            >
              Download as HTML
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                close();
                downloadFile("document.txt", editor.getText(), "text/plain");
              }}
            >
              Download as plain text
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem
              shortcut="Ctrl+P"
              onClick={() => {
                close();
                window.print();
              }}
            >
              Print
            </DropdownItem>
          </>
        )}
      </Dropdown>

      {/* Edit */}
      <Dropdown
        {...menuProps("Edit")}
        title="Edit"
        panelClassName="w-64"
        triggerClassName="font-medium"
        label={<span>Edit</span>}
      >
        {(close) => (
          <>
            <DropdownItem
              shortcut="Ctrl+Z"
              disabled={!editor.can().undo()}
              onClick={() => {
                editor.chain().focus().undo().run();
                close();
              }}
            >
              Undo
            </DropdownItem>
            <DropdownItem
              shortcut="Ctrl+Shift+Z"
              disabled={!editor.can().redo()}
              onClick={() => {
                editor.chain().focus().redo().run();
                close();
              }}
            >
              Redo
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem
              shortcut="Ctrl+X"
              onClick={() => {
                close();
                void copySelection().then(() =>
                  editor.chain().focus().deleteSelection().run(),
                );
              }}
            >
              Cut
            </DropdownItem>
            <DropdownItem
              shortcut="Ctrl+C"
              onClick={() => {
                close();
                void copySelection();
              }}
            >
              Copy
            </DropdownItem>
            <DropdownItem
              shortcut="Ctrl+V"
              onClick={() => {
                close();
                void navigator.clipboard
                  .readText()
                  .then((clip) => {
                    if (clip) editor.chain().focus().insertContent(clip).run();
                  })
                  .catch(() => {
                    // Clipboard permission refused: nothing we can do here.
                  });
              }}
            >
              Paste
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem
              shortcut="Ctrl+A"
              onClick={() => {
                editor.chain().focus().selectAll().run();
                close();
              }}
            >
              Select all
            </DropdownItem>
            <DropdownItem
              shortcut="Ctrl+F"
              onClick={() => {
                close();
                ui.setFindOpen(true);
              }}
            >
              Find
            </DropdownItem>
          </>
        )}
      </Dropdown>

      {/* View */}
      <Dropdown
        {...menuProps("View")}
        title="View"
        panelClassName="w-56"
        triggerClassName="font-medium"
        label={<span>View</span>}
      >
        {(close) => (
          <>
            <DropdownItem
              checked={ui.rulerVisible}
              onClick={() => {
                ui.setRulerVisible(!ui.rulerVisible);
                close();
              }}
            >
              Show ruler
            </DropdownItem>
            <DropdownItem
              checked={ui.pageless}
              onClick={() => {
                ui.setPageless(!ui.pageless);
                close();
              }}
            >
              Pageless
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem
              onClick={() => {
                const index = ZOOM_LEVELS.findIndex(
                  (level) => Math.abs(level - ui.zoom) < 0.001,
                );
                ui.setZoom(ZOOM_LEVELS[Math.min(ZOOM_LEVELS.length - 1, index + 1)]);
                close();
              }}
            >
              Zoom in
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                const index = ZOOM_LEVELS.findIndex(
                  (level) => Math.abs(level - ui.zoom) < 0.001,
                );
                ui.setZoom(ZOOM_LEVELS[Math.max(0, index - 1)]);
                close();
              }}
            >
              Zoom out
            </DropdownItem>
            <DropdownItem
              checked={Math.abs(ui.zoom - 1) < 0.001}
              onClick={() => {
                ui.setZoom(1);
                close();
              }}
            >
              Zoom to 100%
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem
              checked={fullScreen}
              onClick={() => {
                setFullScreen(!fullScreen);
                if (document.fullscreenElement) {
                  void document.exitFullscreen();
                } else {
                  void document.documentElement.requestFullscreen().catch(() => {
                    setFullScreen(false);
                  });
                }
              }}
            >
              Full screen
            </DropdownItem>
          </>
        )}
      </Dropdown>

      {/* Insert */}
      <Dropdown
        {...menuProps("Insert")}
        title="Insert"
        panelClassName="w-fit min-w-40"
        triggerClassName="font-medium"
        label={<span>Insert</span>}
      >
        {(close) => <InsertMenu close={close} />}
      </Dropdown>

      {/* Format */}
      <Dropdown
        {...menuProps("Format")}
        title="Format"
        panelClassName="w-60"
        triggerClassName="font-medium"
        label={<span>Format</span>}
      >
        {(close) => (
          <>
            <DropdownItem
              shortcut="Ctrl+B"
              checked={editor.isActive("bold")}
              onClick={() => {
                editor.chain().focus().toggleBold().run();
                close();
              }}
            >
              <span className="font-bold">Bold</span>
            </DropdownItem>
            <DropdownItem
              shortcut="Ctrl+I"
              checked={editor.isActive("italic")}
              onClick={() => {
                editor.chain().focus().toggleItalic().run();
                close();
              }}
            >
              <span className="italic">Italic</span>
            </DropdownItem>
            <DropdownItem
              shortcut="Ctrl+U"
              checked={editor.isActive("underline")}
              onClick={() => {
                editor.chain().focus().toggleUnderline().run();
                close();
              }}
            >
              <span className="underline">Underline</span>
            </DropdownItem>
            <DropdownItem
              checked={editor.isActive("strike")}
              onClick={() => {
                editor.chain().focus().toggleStrike().run();
                close();
              }}
            >
              <span className="line-through">Strikethrough</span>
            </DropdownItem>
            <DropdownSeparator />
            {BLOCK_STYLES.map((style) => (
              <DropdownItem
                key={style.id}
                checked={style.isActive(editor)}
                onClick={() => {
                  style.apply(editor);
                  close();
                }}
              >
                <span className={style.className}>{style.label}</span>
              </DropdownItem>
            ))}
            <DropdownSeparator />
            <DropdownItem
              checked={editor.isActive("bulletList")}
              onClick={() => {
                editor.chain().focus().toggleBulletList().run();
                close();
              }}
            >
              Bulleted list
            </DropdownItem>
            <DropdownItem
              checked={editor.isActive("orderedList")}
              onClick={() => {
                editor.chain().focus().toggleOrderedList().run();
                close();
              }}
            >
              Numbered list
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem
              onClick={() => {
                editor.chain().focus().unsetAllMarks().clearNodes().run();
                close();
              }}
            >
              Clear formatting
            </DropdownItem>
          </>
        )}
      </Dropdown>

      {/* Tools */}
      <Dropdown
        {...menuProps("Tools")}
        title="Tools"
        panelClassName="w-64"
        triggerClassName="font-medium"
        label={<span>Tools</span>}
      >
        {(close) => (
          <>
            <DropdownItem
              checked={ui.spellcheck}
              onClick={() => {
                ui.toggleSpellcheck();
                close();
              }}
            >
              Spelling and grammar
            </DropdownItem>
            <DropdownSeparator />
            <DropdownLabel>Word count</DropdownLabel>
            <div className="px-3 pb-1 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Words</span>
                <span className="tabular-nums">{words}</span>
              </div>
              <div className="flex justify-between">
                <span>Characters</span>
                <span className="tabular-nums">{characters}</span>
              </div>
              <div className="flex justify-between">
                <span>Pages</span>
                <span className="tabular-nums">{pages}</span>
              </div>
            </div>
          </>
        )}
      </Dropdown>

      {/* Extensions */}
      <Dropdown
        {...menuProps("Extensions")}
        title="Extensions"
        panelClassName="w-64"
        triggerClassName="font-medium"
        label={<span>Extensions</span>}
      >
        {(close) => (
          <>
            <DropdownItem
              checked={!ui.pageless}
              onClick={() => {
                ui.setPageless(!ui.pageless);
                close();
              }}
            >
              Pagination
            </DropdownItem>
            <DropdownSeparator />
            <DropdownLabel>Enabled editor extensions</DropdownLabel>
            <div className="max-h-52 overflow-y-auto">
              {extensionNames.map((name) => (
                <div
                  key={name}
                  className="px-3 py-0.5 text-xs text-gray-500"
                >
                  {name}
                </div>
              ))}
            </div>
          </>
        )}
      </Dropdown>

      {/* Help */}
      <Dropdown
        {...menuProps("Help")}
        title="Help"
        panelClassName="w-64"
        align="right"
        triggerClassName="font-medium"
        label={<span>Help</span>}
      >
        {(close) => (
          <>
            <DropdownLabel>Keyboard shortcuts</DropdownLabel>
            {[
              ["Bold", "Ctrl+B"],
              ["Italic", "Ctrl+I"],
              ["Underline", "Ctrl+U"],
              ["Undo", "Ctrl+Z"],
              ["Redo", "Ctrl+Shift+Z"],
              ["Find", "Ctrl+F"],
            ].map(([label, keys]) => (
              <div
                key={label}
                className="flex justify-between px-3 py-0.5 text-xs text-gray-500"
              >
                <span>{label}</span>
                <span>{keys}</span>
              </div>
            ))}
            <DropdownSeparator />
            <DropdownItem
              onClick={() => {
                close();
                window.open(
                  "https://tiptap.dev/docs",
                  "_blank",
                  "noopener,noreferrer",
                );
              }}
            >
              Editor documentation
            </DropdownItem>
            <DropdownItem disabled>About VampDocs — Next.js + Tiptap</DropdownItem>
          </>
        )}
      </Dropdown>
    </div>
  );
}
