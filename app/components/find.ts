import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { TextSelection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node } from "@tiptap/pm/model";

/**
 * Result of a single search.
 */
export type FindResult = {
  /** Number of matches, 0 when the term is empty or absent. */
  count: number;
  /** Index of the currently active match (0-based), or -1 when none. */
  index: number;
};

/**
 * Find plugin for the TipTap editor.
 *
 * Highlights every occurrence of the search term with a `.find-match`
 * decoration (the active one gets an extra class), exposes the match count
 * and the current index through the plugin state, and lets the caller jump
 * between matches by setting `index`.
 *
 * The plugin is intentionally side-effect free: it only maintains
 * decorations and a small state record. Navigation (moving the selection to
 * a match) is handled by the React component that owns the find panel.
 */
export const findKey = new PluginKey<FindState>("find");

export type FindState = {
  term: string;
  caseSensitive: boolean;
  matches: number[];
  currentIndex: number;
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findTextPositions(
  doc: Node,
  term: string,
  caseSensitive: boolean,
): number[] {
  if (!term) return [];

  const flags = caseSensitive ? "g" : "gi";
  const matcher = new RegExp(escapeRegExp(term), flags);

  const positions: number[] = [];

  doc.descendants((node: Node, pos: number) => {
    if (node.isText) {
      const text = node.text ?? "";
      let match: RegExpExecArray | null;

      matcher.lastIndex = 0;

      while ((match = matcher.exec(text)) !== null) {
        positions.push(pos + match.index);
      }
    }
    return true;
  });

  return positions;
}

export const FindPlugin = Extension.create({
  name: "find",

  addProseMirrorPlugins() {
    return [
      new Plugin<FindState>({
        key: findKey,
        state: {
          init: (): FindState => ({
            term: "",
            caseSensitive: false,
            matches: [],
            currentIndex: -1,
          }),
          apply: (tr, value) => {
            const next = tr.getMeta(findKey) as Partial<FindState> | undefined;
            if (!next) return value;

            const term = next.term ?? value.term;
            const caseSensitive = next.caseSensitive ?? value.caseSensitive;

            if (!term) {
              return {
                term: "",
                caseSensitive,
                matches: [],
                currentIndex: -1,
              };
            }

            const matches = findTextPositions(tr.doc, term, caseSensitive);
            let currentIndex = next.currentIndex ?? -1;

            if (matches.length === 0) {
              currentIndex = -1;
            } else if (currentIndex < 0 || currentIndex >= matches.length) {
              currentIndex = 0;
            }

            return {
              term,
              caseSensitive,
              matches,
              currentIndex,
            };
          },
        },
        props: {
          decorations(state) {
            const findState = findKey.getState(state);
            if (!findState || findState.matches.length === 0) {
              return DecorationSet.empty;
            }

            const decorations: Decoration[] = [];
            findState.matches.forEach((pos, index) => {
              const isActive = index === findState.currentIndex;
              decorations.push(
                Decoration.inline(
                  pos,
                  pos + findState.term.length,
                  {
                    class: isActive ? "find-match-active" : "find-match",
                    "data-find-index": String(index),
                  },
                ),
              );
            });

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

/**
 * Read the current find state from an editor view.
 */
export function getFindState(view: EditorView): FindState | undefined {
  return findKey.getState(view.state);
}

/**
 * Set the search term (and optionally case sensitivity). Clears the current
 * match index; the caller can then call `nextMatch`/`previousMatch` to
 * position the selection.
 */
export function setFindTerm(
  view: EditorView,
  term: string,
  caseSensitive = false,
): void {
  view.dispatch(
    view.state.tr.setMeta(findKey, { term, caseSensitive, currentIndex: -1 }),
  );
}

/**
 * Move the active match forward (or backward) by one, wrapping around.
 * Returns the new state so the caller can read the updated index.
 */
export function moveFindIndex(
  view: EditorView,
  direction: 1 | -1,
): FindState | undefined {
  const current = getFindState(view);
  if (!current || current.matches.length === 0) return current;

  const next =
    ((current.currentIndex + direction + current.matches.length) %
      current.matches.length);

  view.dispatch(view.state.tr.setMeta(findKey, { currentIndex: next }));
  return getFindState(view);
}

/**
 * Select the currently active match in the editor.
 */
export function selectCurrentMatch(view: EditorView): void {
  const state = getFindState(view);
  if (!state || state.matches.length === 0 || state.currentIndex < 0) return;

  const pos = state.matches[state.currentIndex];
  const tr = view.state.tr.setSelection(
    TextSelection.create(view.state.doc, pos, pos + state.term.length),
  );
  view.dispatch(tr);
}