"use client";

import { useEffect, useState, type MouseEvent, type ReactNode } from "react";

import { Dropdown, DropdownItem } from "./dropdown";
import { useEditorUi } from "./editorUi";
import { pickImageFile } from "./imageNode";
import {
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  readTextStyle,
  setTextStyle,
} from "./marks";
import { CommentPanel, LinkPanel } from "./panels";
import {
  BLOCK_STYLES,
  FONT_FAMILIES,
  FONT_SIZES,
  HIGHLIGHT_COLORS,
  TEXT_COLORS,
  ZOOM_LEVELS,
} from "./toolbarOptions";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CommentIcon,
  FormatPaintIcon,
  HighlighterIcon,
  ImageIcon,
  LinkIcon,
  MinusIcon,
  MoreHorizontalIcon,
  PlusIcon,
  PrinterIcon,
  SearchIcon,
  SpellCheckIcon,
  TextColorIcon,
  XIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "./icons";

type ToolbarButtonProps = {
  icon: ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  onMouseDown?: (event: MouseEvent<HTMLButtonElement>) => void;
};

const ToolbarButton = ({
  icon,
  label,
  active = false,
  disabled = false,
  onClick,
  onMouseDown,
}: ToolbarButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    onMouseDown={onMouseDown}
    disabled={disabled}
    aria-label={label}
    title={label}
    aria-pressed={active}
    className={`toolbar-btn ${
      active ? "active" : ""
    }`}
  >
    {icon}
  </button>
);

const Divider = () => <div className="toolbar-separator" />;

function ColorPalette({
  colors,
  onPick,
  onReset,
}: {
  colors: { name: string; value: string }[];
  onPick: (value: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="px-2 pb-1 pt-2">
      <div className="grid grid-cols-6 gap-1">
        {colors.map((color) => (
          <button
            key={color.value}
            type="button"
            title={color.name}
            aria-label={color.name}
            onClick={() => onPick(color.value)}
            className="h-5 w-5 rounded-sm border border-gray-300 hover:scale-110"
            style={{ backgroundColor: color.value }}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onReset}
        className="mt-2 w-full rounded px-2 py-1 text-left text-sm text-gray-700 hover:bg-gray-100"
      >
        Reset
      </button>
    </div>
  );
}

function FindPanel({ onClose }: { onClose: () => void }) {
  const [term, setTerm] = useState("");
  const [message, setMessage] = useState("");

  const search = (backwards: boolean) => {
    if (!term) return;

    const find = (
      window as unknown as {
        find?: (
          text: string,
          caseSensitive?: boolean,
          backwards?: boolean,
          wrap?: boolean,
        ) => boolean;
      }
    ).find;

    if (typeof find !== "function") {
      setMessage("Not supported here");
      return;
    }

    setMessage(find.call(window, term, false, backwards, true) ? "" : "No matches");
  };

  return (
    <div className="absolute right-3 top-full z-50 mt-1 flex items-center gap-1 rounded border border-gray-200 bg-white p-1 shadow-lg">
      <input
        autoFocus
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") search(event.shiftKey);
          if (event.key === "Escape") onClose();
        }}
        placeholder="Find in document"
        className="w-52 rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-blue-500"
      />
      <span className="max-w-24 truncate text-xs text-gray-500">{message}</span>
      <ToolbarButton
        icon={<ChevronUpIcon className="h-4 w-4" />}
        label="Previous match"
        onClick={() => search(true)}
      />
      <ToolbarButton
        icon={<ChevronDownIcon className="h-4 w-4" />}
        label="Next match"
        onClick={() => search(false)}
      />
      <ToolbarButton
        icon={<XIcon className="h-4 w-4" />}
        label="Close find"
        onClick={onClose}
      />
    </div>
  );
}

type PaintFormat = {
  style: ReturnType<typeof readTextStyle>;
  marks: string[];
};

export default function Toolbar() {
  const {
    editor,
    zoom,
    setZoom,
    menusHidden,
    toggleMenus,
    spellcheck,
    toggleSpellcheck,
    findOpen,
    setFindOpen,
  } = useEditorUi();

  const [paintFormat, setPaintFormat] = useState<PaintFormat | null>(null);

  // Ctrl/Cmd+F opens the find panel instead of the browser's own.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setFindOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setFindOpen]);

  // The format painter applies to the next selection the user makes.
  useEffect(() => {
    if (!editor || !paintFormat) return;

    const applyToSelection = () => {
      if (editor.state.selection.empty) return;

      const chain = editor.chain().focus();
      const { style, marks } = paintFormat;

      if (style.fontFamily || style.fontSize || style.color) {
        chain.setMark("textStyle", style);
      }
      marks.forEach((name) => chain.setMark(name));
      chain.run();
      setPaintFormat(null);
    };

    editor.on("selectionUpdate", applyToSelection);
    return () => {
      editor.off("selectionUpdate", applyToSelection);
    };
  }, [editor, paintFormat]);

  if (!editor) {
    return null;
  }

  const textStyle = readTextStyle(editor);
  const fontFamily = textStyle.fontFamily ?? DEFAULT_FONT_FAMILY;
  const fontSize =
    Number.parseInt(textStyle.fontSize ?? "", 10) || DEFAULT_FONT_SIZE;
  const activeBlockStyle =
    BLOCK_STYLES.find((style) => style.isActive(editor)) ?? BLOCK_STYLES[0];
  const zoomIndex = ZOOM_LEVELS.findIndex(
    (level) => Math.abs(level - zoom) < 0.001,
  );

  // Keeps the editor selection when a control is pressed.
  const press =
    (run: () => void) => (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      run();
    };

  const stepFontSize = (direction: 1 | -1) => {
    const target =
      direction === 1
        ? FONT_SIZES.find((size) => size > fontSize)
        : [...FONT_SIZES].reverse().find((size) => size < fontSize);

    if (target) setTextStyle(editor, { fontSize: `${target}pt` });
  };

  const stepZoom = (direction: 1 | -1) => {
    const index = zoomIndex === -1 ? ZOOM_LEVELS.indexOf(1) : zoomIndex;
    const next =
      ZOOM_LEVELS[Math.min(ZOOM_LEVELS.length - 1, Math.max(0, index + direction))];
    setZoom(next);
  };

  return (
    // Wraps instead of scrolling sideways: an overflow container would clip the
    // dropdown panels hanging below the bar.
    <div className="toolbar relative z-20 flex flex-wrap items-center gap-1 border-b border-gray-200 bg-white px-3 py-1.5 text-sm">
      {/* Find, history and document actions */}
      <ToolbarButton
        icon={<SearchIcon className="h-4 w-4" />}
        label="Find in document"
        active={findOpen}
        onClick={() => setFindOpen(!findOpen)}
      />
      <ToolbarButton
        icon={
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 14 4 9l5-5" />
            <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
          </svg>
        }
        label="Undo"
        disabled={!editor.can().undo()}
        onMouseDown={press(() => editor.chain().focus().undo().run())}
      />
      <ToolbarButton
        icon={
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 14 5-5-5-5" />
            <path d="M20 9H10a6 6 0 0 0 0 12h3" />
          </svg>
        }
        label="Redo"
        disabled={!editor.can().redo()}
        onMouseDown={press(() => editor.chain().focus().redo().run())}
      />

      <ToolbarButton
        icon={<PrinterIcon className="h-4 w-4" />}
        label="Print"
        onClick={() => window.print()}
      />
      <ToolbarButton
        icon={<SpellCheckIcon className="h-4 w-4" />}
        label="Spelling and grammar"
        active={spellcheck}
        onClick={toggleSpellcheck}
      />
      <ToolbarButton
        icon={<FormatPaintIcon className="h-4 w-4" />}
        label="Paint format"
        active={Boolean(paintFormat)}
        onClick={() => {
          if (paintFormat) {
            setPaintFormat(null);
            return;
          }

          setPaintFormat({
            style: readTextStyle(editor),
            marks: ["bold", "italic", "underline", "strike"].filter((name) =>
              editor.isActive(name),
            ),
          });
        }}
      />

      <Divider />

      {/* Zoom */}
      <ToolbarButton
        icon={<ZoomOutIcon className="h-4 w-4" />}
        label="Zoom out"
        disabled={zoomIndex === 0}
        onClick={() => stepZoom(-1)}
      />
      <Dropdown
        title="Zoom"
        triggerClassName="toolbar-btn justify-center"
        panelClassName="w-28"
        showChevron={false}
        label={
          <span className="w-10 text-center text-gray-600">
            {Math.round(zoom * 100)}%
          </span>
        }
      >
        {(close) =>
          ZOOM_LEVELS.map((level) => (
            <DropdownItem
              key={level}
              checked={Math.abs(level - zoom) < 0.001}
              onClick={() => {
                setZoom(level);
                close();
              }}
            >
              {Math.round(level * 100)}%
            </DropdownItem>
          ))
        }
      </Dropdown>
      <ToolbarButton
        icon={<ZoomInIcon className="h-4 w-4" />}
        label="Zoom in"
        disabled={zoomIndex === ZOOM_LEVELS.length - 1}
        onClick={() => stepZoom(1)}
      />

      <Divider />

      {/* Block style */}
      <Dropdown
        title="Text style"
        panelClassName="w-44"
        triggerClassName="toolbar-btn"
        showChevron={false}
        label={<span>{activeBlockStyle.label}</span>}
      >
        {(close) =>
          BLOCK_STYLES.map((style) => (
            <DropdownItem
              key={style.id}
              checked={style.id === activeBlockStyle.id}
              onClick={() => {
                style.apply(editor);
                close();
              }}
            >
              <span className={style.className}>{style.label}</span>
            </DropdownItem>
          ))
        }
      </Dropdown>

      <Divider />

      {/* Font family */}
      <Dropdown
        title="Font"
        panelClassName="max-h-80 w-60 overflow-y-auto"
        triggerClassName="toolbar-btn"
        showChevron={false}
        label={<span style={{ fontFamily }}>{fontFamily}</span>}
      >
        {(close) =>
          FONT_FAMILIES.map((family) => (
            <DropdownItem
              key={family}
              checked={family === fontFamily}
              onClick={() => {
                setTextStyle(editor, { fontFamily: family });
                close();
              }}
            >
              <span style={{ fontFamily: family }}>{family}</span>
            </DropdownItem>
          ))
        }
      </Dropdown>

      <Divider />

      {/* Font size */}
      <div className="flex shrink-0 items-center rounded border border-gray-300">
        <ToolbarButton
          icon={<MinusIcon className="h-3 w-3" />}
          label="Decrease font size"
          onClick={() => stepFontSize(-1)}
        />
        <Dropdown
          title="Font size"
          panelClassName="max-h-80 w-20 overflow-y-auto"
          triggerClassName="toolbar-btn justify-center"
          showChevron={false}
          label={
            <span className="w-8 text-center text-gray-600">{fontSize}</span>
          }
        >
          {(close) =>
            FONT_SIZES.map((size) => (
              <DropdownItem
                key={size}
                checked={size === fontSize}
                onClick={() => {
                  setTextStyle(editor, { fontSize: `${size}pt` });
                  close();
                }}
              >
                {size}
              </DropdownItem>
            ))
          }
        </Dropdown>
        <ToolbarButton
          icon={<PlusIcon className="h-3 w-3" />}
          label="Increase font size"
          onClick={() => stepFontSize(1)}
        />
      </div>

      <Divider />

      {/* Character formatting */}
      <ToolbarButton
        icon={<span className="text-sm font-bold">B</span>}
        label="Bold"
        active={editor.isActive("bold")}
        onMouseDown={press(() => editor.chain().focus().toggleBold().run())}
      />
      <ToolbarButton
        icon={<span className="text-sm italic">I</span>}
        label="Italic"
        active={editor.isActive("italic")}
        onMouseDown={press(() => editor.chain().focus().toggleItalic().run())}
      />
      <ToolbarButton
        icon={<span className="text-sm underline underline-offset-1">U</span>}
        label="Underline"
        active={editor.isActive("underline")}
        onMouseDown={press(() => editor.chain().focus().toggleUnderline().run())}
      />
      <ToolbarButton
        icon={<span className="text-sm line-through">S</span>}
        label="Strikethrough"
        active={editor.isActive("strike")}
        onMouseDown={press(() => editor.chain().focus().toggleStrike().run())}
      />

      {/* Colours */}
      <Dropdown
        title="Text colour"
        panelClassName="w-44"
        active={Boolean(textStyle.color)}
        triggerClassName="toolbar-btn"
        showChevron={false}
        label={
          <span className="flex flex-col items-center">
            <TextColorIcon className="h-4 w-4" />
            <span
              className="mt-[-3px] h-[3px] w-4 rounded-sm border border-gray-300"
              style={{ backgroundColor: textStyle.color ?? "#000000" }}
            />
          </span>
        }
      >
        {(close) => (
          <ColorPalette
            colors={TEXT_COLORS}
            onPick={(color) => {
              setTextStyle(editor, { color });
              close();
            }}
            onReset={() => {
              setTextStyle(editor, { color: null });
              close();
            }}
          />
        )}
      </Dropdown>
      <Dropdown
        title="Highlight colour"
        panelClassName="w-44"
        active={editor.isActive("highlight")}
        triggerClassName="toolbar-btn"
        showChevron={false}
        label={<HighlighterIcon className="h-4 w-4" />}
      >
        {(close) => (
          <ColorPalette
            colors={HIGHLIGHT_COLORS}
            onPick={(color) => {
              editor
                .chain()
                .focus()
                .unsetMark("highlight")
                .setMark("highlight", { color })
                .run();
              close();
            }}
            onReset={() => {
              editor.chain().focus().unsetMark("highlight").run();
              close();
            }}
          />
        )}
      </Dropdown>

      <Divider />

      {/* Insertions */}
      <Dropdown
        title="Insert link"
        panelClassName="w-fit"
        align="right"
        active={editor.isActive("link")}
        triggerClassName="toolbar-btn"
        showChevron={false}
        label={<LinkIcon className="h-4 w-4" />}
      >
        {(close) => <LinkPanel editor={editor} close={close} />}
      </Dropdown>
      <Dropdown
        title="Add comment"
        panelClassName="w-fit"
        align="right"
        active={editor.isActive("comment")}
        triggerClassName="toolbar-btn"
        showChevron={false}
        label={<CommentIcon className="h-4 w-4" />}
      >
        {(close) => <CommentPanel editor={editor} close={close} />}
      </Dropdown>
      <ToolbarButton
        icon={<ImageIcon className="h-4 w-4" />}
        label="Insert image"
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
      />

      <Dropdown
        title="More"
        panelClassName="w-56"
        align="right"
        triggerClassName="toolbar-btn"
        showChevron={false}
        label={<MoreHorizontalIcon className="h-4 w-4" />}
      >
        {(close) => (
          <>
            <DropdownItem
              onClick={() => {
                editor.chain().focus().unsetAllMarks().clearNodes().run();
                close();
              }}
            >
              Clear formatting
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                editor.chain().focus().setHorizontalRule().run();
                close();
              }}
            >
              Horizontal line
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                editor.chain().focus().toggleBulletList().run();
                close();
              }}
            >
              Bulleted list
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                editor.chain().focus().toggleOrderedList().run();
                close();
              }}
            >
              Numbered list
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                editor.chain().focus().toggleCodeBlock().run();
                close();
              }}
            >
              Code block
            </DropdownItem>
          </>
        )}
      </Dropdown>

      <Divider />

      <ToolbarButton
        icon={
          menusHidden ? (
            <ChevronDownIcon className="h-4 w-4" />
          ) : (
            <ChevronUpIcon className="h-4 w-4" />
          )
        }
        label={menusHidden ? "Show menus" : "Hide menus"}
        onClick={toggleMenus}
      />

      {findOpen && <FindPanel onClose={() => setFindOpen(false)} />}
    </div>
  );
}
