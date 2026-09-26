"use client";

import { useRef, useState } from "react";
import { convertToHtml } from "mammoth";
import { parseOffice } from "officeparser/slim";

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

// TipTap node types for HTML import
interface TipTapNode {
  type: string;
  content?: TipTapNode[];
  text?: string;
  marks?: TipTapMark[];
  attrs?: Record<string, unknown>;
}

interface TipTapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

function importTxtFile(
  file: File,
  editor: NonNullable<ReturnType<typeof useEditorUi>["editor"]>
): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Failed to read file as text"));
        return;
      }
      const text = reader.result;
      // Split by double newlines for paragraphs, or single newlines
      // Normalize line endings first
      const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      // Split into paragraphs (double newline = paragraph break, single newline = line break within paragraph)
      const paragraphs = normalized.split("\n\n").filter((p) => p.trim().length > 0);
      
      // Build TipTap content: each paragraph becomes a separate paragraph node
      const content = paragraphs.map((para) => ({
        type: "paragraph",
        content: [{ type: "text", text: para.replace(/\n/g, " ") }],
      }));
      
      try {
        editor.commands.setContent({ type: "doc", content });
        editor.commands.focus("start");
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

function importHtmlFile(
  file: File,
  editor: NonNullable<ReturnType<typeof useEditorUi>["editor"]>
): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Failed to read file as text"));
        return;
      }
      const html = reader.result;
      
      try {
        // Parse HTML using DOMParser
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        
        // Check for parsing errors
        const parserError = doc.querySelector("parsererror");
        if (parserError) {
          reject(new Error("Invalid HTML file"));
          return;
        }
        
        // Extract body content (or full document if no body)
        const body = doc.body || doc.documentElement;
        const content = htmlToTipTapContent(body);
        
        if (content.length === 0) {
          reject(new Error("No importable content found in HTML file"));
          return;
        }
        
        editor.commands.setContent({ type: "doc", content });
        editor.commands.focus("start");
        resolve();
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Failed to import HTML file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

function importDocxFile(
  file: File,
  editor: NonNullable<ReturnType<typeof useEditorUi>["editor"]>
): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      if (!(reader.result instanceof ArrayBuffer)) {
        reject(new Error("Failed to read file as array buffer"));
        return;
      }
      
      try {
        // Convert DOCX to HTML using mammoth
        const result = await convertToHtml({ arrayBuffer: reader.result });
        
        if (result.messages.length > 0) {
          // Log warnings but don't fail
          result.messages.forEach((msg) => console.warn("DOCX import warning:", msg.message));
        }
        
        const html = result.value;
        
        if (!html || html.trim().length === 0) {
          reject(new Error("No content found in DOCX file"));
          return;
        }
        
        // Parse the generated HTML using our existing HTML parser
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        
        const parserError = doc.querySelector("parsererror");
        if (parserError) {
          reject(new Error("Failed to parse DOCX content"));
          return;
        }
        
        const body = doc.body || doc.documentElement;
        const content = htmlToTipTapContent(body);
        
        if (content.length === 0) {
          reject(new Error("No importable content found in DOCX file"));
          return;
        }
        
        editor.commands.setContent({ type: "doc", content });
        editor.commands.focus("start");
        resolve();
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Failed to import DOCX file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

function importRtfFile(
  file: File,
  editor: NonNullable<ReturnType<typeof useEditorUi>["editor"]>
): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      if (!(reader.result instanceof ArrayBuffer)) {
        reject(new Error("Failed to read file as array buffer"));
        return;
      }
      
      try {
        // Parse RTF using officeparser and convert to HTML
        const ast = await parseOffice(reader.result, { fileType: "rtf" });
        const result = await ast.to("html");
        
        if (result.messages.length > 0) {
          result.messages.forEach((msg: { message: string }) => console.warn("RTF import warning:", msg.message));
        }
        
        const html = result.value;
        
        if (!html || html.trim().length === 0) {
          reject(new Error("No content found in RTF file"));
          return;
        }
        
        // Parse the generated HTML using our existing HTML parser
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        
        const parserError = doc.querySelector("parsererror");
        if (parserError) {
          reject(new Error("Failed to parse RTF content"));
          return;
        }
        
        const body = doc.body || doc.documentElement;
        const content = htmlToTipTapContent(body);
        
        if (content.length === 0) {
          reject(new Error("No importable content found in RTF file"));
          return;
        }
        
        editor.commands.setContent({ type: "doc", content });
        editor.commands.focus("start");
        resolve();
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Failed to import RTF file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

function importOdtFile(
  file: File,
  editor: NonNullable<ReturnType<typeof useEditorUi>["editor"]>
): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      if (!(reader.result instanceof ArrayBuffer)) {
        reject(new Error("Failed to read file as array buffer"));
        return;
      }
      
      try {
        // Parse ODT using officeparser and convert to HTML
        const ast = await parseOffice(reader.result, { fileType: "odt" });
        const result = await ast.to("html");
        
        if (result.messages.length > 0) {
          result.messages.forEach((msg: { message: string }) => console.warn("ODT import warning:", msg.message));
        }
        
        const html = result.value;
        
        if (!html || html.trim().length === 0) {
          reject(new Error("No content found in ODT file"));
          return;
        }
        
        // Parse the generated HTML using our existing HTML parser
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        
        const parserError = doc.querySelector("parsererror");
        if (parserError) {
          reject(new Error("Failed to parse ODT content"));
          return;
        }
        
        const body = doc.body || doc.documentElement;
        const content = htmlToTipTapContent(body);
        
        if (content.length === 0) {
          reject(new Error("No importable content found in ODT file"));
          return;
        }
        
        editor.commands.setContent({ type: "doc", content });
        editor.commands.focus("start");
        resolve();
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Failed to import ODT file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

function htmlToTipTapContent(element: Element): TipTapNode[] {
  
  function processNode(node: Node): TipTapNode[] {
    const results: TipTapNode[] = [];
    
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      if (text.trim().length > 0) {
        results.push({ type: "text", text });
      }
      return results;
    }
    
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return results;
    }
    
    const el = node as Element;
    const tagName = el.tagName.toLowerCase();
    
    // Handle different HTML elements
    switch (tagName) {
      case "p": {
        const children = Array.from(el.childNodes).flatMap(processNode);
        if (children.length > 0) {
          results.push({ type: "paragraph", content: children });
        } else {
          // Empty paragraph
          results.push({ type: "paragraph", content: [{ type: "text", text: "" }] });
        }
        break;
      }
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6": {
        const level = parseInt(tagName[1]);
        const children = Array.from(el.childNodes).flatMap(processNode);
        results.push({ type: "heading", attrs: { level }, content: children });
        break;
      }
      case "strong":
      case "b": {
        const children = Array.from(el.childNodes).flatMap(processNode);
        // Wrap children with bold mark
        results.push(...children.map((child: TipTapNode) => ({
          ...child,
          marks: [...(child.marks || []), { type: "bold" }],
        })));
        break;
      }
      case "em":
      case "i": {
        const children = Array.from(el.childNodes).flatMap(processNode);
        // Wrap children with italic mark
        results.push(...children.map((child: TipTapNode) => ({
          ...child,
          marks: [...(child.marks || []), { type: "italic" }],
        })));
        break;
      }
      case "u": {
        const children = Array.from(el.childNodes).flatMap(processNode);
        // Wrap children with underline mark
        results.push(...children.map((child: TipTapNode) => ({
          ...child,
          marks: [...(child.marks || []), { type: "underline" }],
        })));
        break;
      }
      case "s":
      case "strike":
      case "del": {
        const children = Array.from(el.childNodes).flatMap(processNode);
        results.push(...children.map((child: TipTapNode) => ({
          ...child,
          marks: [...(child.marks || []), { type: "strike" }],
        })));
        break;
      }
      case "code": {
        const children = Array.from(el.childNodes).flatMap(processNode);
        results.push(...children.map((child: TipTapNode) => ({
          ...child,
          marks: [...(child.marks || []), { type: "code" }],
        })));
        break;
      }
      case "a": {
        const href = el.getAttribute("href");
        const children = Array.from(el.childNodes).flatMap(processNode);
        if (href) {
          results.push(...children.map((child: TipTapNode) => ({
            ...child,
            marks: [...(child.marks || []), { type: "link", attrs: { href } }],
          })));
        } else {
          results.push(...children);
        }
        break;
      }
      case "ul": {
        const items = Array.from(el.querySelectorAll(":scope > li")).map((li) => {
          const children = Array.from(li.childNodes).flatMap(processNode);
          return { type: "listItem", content: children };
        });
        if (items.length > 0) {
          results.push({ type: "bulletList", content: items });
        }
        break;
      }
      case "ol": {
        const items = Array.from(el.querySelectorAll(":scope > li")).map((li) => {
          const children = Array.from(li.childNodes).flatMap(processNode);
          return { type: "listItem", content: children };
        });
        if (items.length > 0) {
          results.push({ type: "orderedList", content: items });
        }
        break;
      }
      case "blockquote": {
        const children = Array.from(el.childNodes).flatMap(processNode);
        if (children.length > 0) {
          results.push({ type: "blockquote", content: children });
        }
        break;
      }
      case "br": {
        // Line break - handle as hard break in text
        results.push({ type: "hardBreak" });
        break;
      }
      case "hr": {
        results.push({ type: "horizontalRule" });
        break;
      }
      case "div":
      case "section":
      case "article":
      case "main":
      case "body":
      case "html": {
        // Container elements - process children
        const children = Array.from(el.childNodes).flatMap(processNode);
        results.push(...children);
        break;
      }
      default: {
        // For unknown elements, process children
        const children = Array.from(el.childNodes).flatMap(processNode);
        results.push(...children);
        break;
      }
    }
    
    return results;
  }
  
  const processed = Array.from(element.childNodes).flatMap(processNode);
  
  // Filter out any hardBreak nodes at the top level (they need to be inside paragraphs)
  // and merge adjacent text nodes
  return processed.filter((node: TipTapNode) => node.type !== "hardBreak");
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="flex items-center gap-0.5">
      {/* File */}
      <Dropdown
        {...menuProps("File")}
        title="File"
        panelClassName="w-60"
        triggerClassName="app-menu-trigger"
        showChevron={false}
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
                downloadFile(
                  "document.html",
                  documentHtml(editor.getHTML()),
                  "text/html",
                );
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
            <DropdownItem
              onClick={() => {
                close();
                fileInputRef.current?.click();
              }}
            >
              Import
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
        triggerClassName="app-menu-trigger"
        showChevron={false}
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
        triggerClassName="app-menu-trigger"
        showChevron={false}
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
                ui.setZoom(
                  ZOOM_LEVELS[Math.min(ZOOM_LEVELS.length - 1, index + 1)],
                );
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
                  void document.documentElement
                    .requestFullscreen()
                    .catch(() => {
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
        triggerClassName="app-menu-trigger"
        showChevron={false}
        label={<span>Insert</span>}
      >
        {(close) => <InsertMenu close={close} />}
      </Dropdown>

      {/* Format */}
      <Dropdown
        {...menuProps("Format")}
        title="Format"
        panelClassName="w-60"
        triggerClassName="app-menu-trigger"
        showChevron={false}
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
        triggerClassName="app-menu-trigger"
        showChevron={false}
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
        triggerClassName="app-menu-trigger"
        showChevron={false}
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
                <div key={name} className="px-3 py-0.5 text-xs text-gray-500">
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
        triggerClassName="app-menu-trigger"
        showChevron={false}
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
            <DropdownItem disabled>
              About VampDocs — Next.js + Tiptap
            </DropdownItem>
          </>
        )}
      </Dropdown>

      <input
        type="file"
        ref={fileInputRef}
        accept=".txt,.html,.htm,.docx,.rtf,.odt"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const fileName = file.name.toLowerCase();
            const isTxt = fileName.endsWith(".txt") || file.type === "text/plain";
            const isHtml = fileName.endsWith(".html") || fileName.endsWith(".htm") || file.type === "text/html";
            const isDocx = fileName.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            const isRtf = fileName.endsWith(".rtf") || file.type === "application/rtf" || file.type === "text/rtf";
            const isOdt = fileName.endsWith(".odt") || file.type === "application/vnd.oasis.opendocument.text";
            
            if (isTxt) {
              importTxtFile(file, editor)
                .then(() => {
                  console.log("Imported file:", {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                  });
                })
                .catch((err) => {
                  console.error("Failed to import TXT file:", err);
                  window.alert(`Failed to import "${file.name}": ${err.message}`);
                });
            } else if (isHtml) {
              importHtmlFile(file, editor)
                .then(() => {
                  console.log("Imported file:", {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                  });
                })
                .catch((err) => {
                  console.error("Failed to import HTML file:", err);
                  window.alert(`Failed to import "${file.name}": ${err.message}`);
                });
            } else if (isDocx) {
              importDocxFile(file, editor)
                .then(() => {
                  console.log("Imported file:", {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                  });
                })
                .catch((err) => {
                  console.error("Failed to import DOCX file:", err);
                  window.alert(`Failed to import "${file.name}": ${err.message}`);
                });
            } else if (isRtf) {
              importRtfFile(file, editor)
                .then(() => {
                  console.log("Imported file:", {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                  });
                })
                .catch((err) => {
                  console.error("Failed to import RTF file:", err);
                  window.alert(`Failed to import "${file.name}": ${err.message}`);
                });
            } else if (isOdt) {
              importOdtFile(file, editor)
                .then(() => {
                  console.log("Imported file:", {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                  });
                })
                .catch((err) => {
                  console.error("Failed to import ODT file:", err);
                  window.alert(`Failed to import "${file.name}": ${err.message}`);
                });
            } else {
              // For unsupported files, just log
              console.log("Imported file (not yet supported):", {
                name: file.name,
                type: file.type,
                size: file.size,
              });
            }
          }

          if (e.target) e.target.value = "";
        }}
      />
    </div>
  );
}
