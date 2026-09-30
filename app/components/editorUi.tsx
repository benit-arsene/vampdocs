"use client";

import type { Editor } from "@tiptap/react";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const DEFAULT_TITLE = "Untitled document";

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
  /** The Neon row id for the document currently open in the editor, or null
   *  when no database-backed document has been created yet. */
  documentId: string | null;
  setDocumentId: (id: string | null) => void;
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
  // The title belongs to the document the editor currently holds, so it starts
  // at the default rather than being restored from anywhere: nothing is loaded
  // at startup, and a stale title from a previous session would wrongly
  // suggest that its saved document is the one on screen. `documentId` is null
  // until a save creates a row or File → New makes one, and the row in the
  // database is the authority once it exists.
  const [docTitle, setDocTitle] = useState<string>(DEFAULT_TITLE);
  // The Neon row id for the document currently open in the editor. Starts null
  // because no database-backed document has been created yet; set by File → New.
  const [documentId, setDocumentId] = useState<string | null>(null);

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
      setDocTitle,
      documentId,
      setDocumentId,
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
    documentId,
  ]);

  return (
    <EditorUiContext.Provider value={value}>{children}</EditorUiContext.Provider>
  );
}
