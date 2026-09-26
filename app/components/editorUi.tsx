"use client";

import type { Editor } from "@tiptap/react";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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

/*
  The toolbar and the menu bar operate the same document, so their view state
  lives in one place instead of being threaded through props.
*/

export type EditorUiValue = {
  editor: Editor | null;
  zoom: number;
  setZoom: (zoom: number) => void;
  menusHidden: boolean;
  toggleMenus: () => void;
  rulerVisible: boolean;
  setRulerVisible: (visible: boolean) => void;
  spellcheck: boolean;
  toggleSpellcheck: () => void;
  findOpen: boolean;
  setFindOpen: (open: boolean) => void;
  /** Pageless view keeps the text flowing without A4 sheets. */
  pageless: boolean;
  setPageless: (pageless: boolean) => void;
  /** Document title and setter. */
  docTitle: string;
  setDocTitle: (title: string) => void;
};

const EditorUiContext = createContext<EditorUiValue | null>(null);

export function useEditorUi(): EditorUiValue {
  const value = useContext(EditorUiContext);
  if (!value) {
    throw new Error("useEditorUi must be used inside <EditorUiProvider>");
  }
  return value;
}

export function EditorUiProvider({
  editor,
  children,
}: {
  editor: Editor | null;
  children: ReactNode;
}) {
  const [zoom, setZoom] = useState(1);
  const [menusHidden, setMenusHidden] = useState(false);
  const [rulerVisible, setRulerVisible] = useState(true);
  const [spellcheck, setSpellcheck] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [pageless, setPageless] = useState(false);
  const [docTitle, setDocTitle] = useState<string>(loadTitle);

  // Persist the title to localStorage on every change.
  const setDocTitlePersisted = useMemo(() => {
    return (title: string) => {
      setDocTitle(title);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(STORAGE_KEY, title);
        } catch {
          // Ignore persistence errors.
        }
      }
    };
  }, []);

  const value = useMemo<EditorUiValue>(() => {
    const toggleSpellcheck = () => {
      setSpellcheck((current) => {
        const next = !current;
        editor?.view.dom.setAttribute("spellcheck", next ? "true" : "false");
        if (next) editor?.view.dom.focus();
        return next;
      });
    };

    return {
      editor,
      zoom,
      setZoom,
      menusHidden,
      toggleMenus: () => setMenusHidden((hidden) => !hidden),
      rulerVisible,
      setRulerVisible,
      spellcheck,
      toggleSpellcheck,
      findOpen,
      setFindOpen,
      pageless,
      setPageless,
      docTitle,
      setDocTitle: setDocTitlePersisted,
    };
  }, [
    editor,
    zoom,
    menusHidden,
    rulerVisible,
    spellcheck,
    findOpen,
    pageless,
    docTitle,
    setDocTitlePersisted,
  ]);

  return (
    <EditorUiContext.Provider value={value}>{children}</EditorUiContext.Provider>
  );
}
