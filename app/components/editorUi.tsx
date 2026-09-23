"use client";

import type { Editor } from "@tiptap/react";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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
    };
  }, [editor, zoom, menusHidden, rulerVisible, spellcheck, findOpen, pageless]);

  return (
    <EditorUiContext.Provider value={value}>{children}</EditorUiContext.Provider>
  );
}
