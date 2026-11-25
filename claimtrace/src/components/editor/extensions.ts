"use client";

import { Extension } from "@tiptap/core";
import Mention, { type MentionNodeAttrs } from "@tiptap/extension-mention";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { ReactNodeViewRenderer, ReactRenderer } from "@tiptap/react";
import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import { CITATION_NODE } from "@/core/evidence/claims";
import type { TrustLabel } from "@/core/labels";
import { CitationChip } from "./citation-chip";
import { CiteMenu, type CiteItem, type CiteMenuHandle } from "./cite-menu";

/** Inline citation node (same node name the claim extractor looks for). */
export const Citation = Mention.extend({
  name: CITATION_NODE,
  addNodeView() {
    return ReactNodeViewRenderer(CitationChip, { as: "span" });
  },
});

export function citationSuggestion(getItems: (query: string) => CiteItem[]): Omit<SuggestionOptions<CiteItem, MentionNodeAttrs>, "editor"> {
  return {
    char: "@",
    allowSpaces: true,
    items: ({ query }) => getItems(query),
    render: () => {
      let component: ReactRenderer<CiteMenuHandle, { items: CiteItem[]; command: (i: MentionNodeAttrs) => void; query: string }> | null = null;
      let unmount: (() => void) | undefined;
      return {
        onStart: (props: SuggestionProps<CiteItem, MentionNodeAttrs>) => {
          component = new ReactRenderer(CiteMenu, {
            props: { items: props.items, command: props.command, query: props.query },
            editor: props.editor,
          });
          component.element.style.zIndex = "60";
          unmount = props.mount(component.element as HTMLElement);
        },
        onUpdate: (props) => component?.updateProps({ items: props.items, command: props.command, query: props.query }),
        onKeyDown: ({ event }) => {
          if (event.key === "Escape") {
            unmount?.();
            unmount = undefined;
            return true;
          }
          return component?.ref?.onKeyDown(event) ?? false;
        },
        onExit: () => {
          unmount?.();
          component?.destroy();
          component = null;
        },
      };
    },
  };
}

/* ------------------------- claim underline decorations ---------------------- */

export interface ClaimMark {
  key: string;
  from: number;
  to: number;
  label: TrustLabel;
  active: boolean;
}

export const claimMarksKey = new PluginKey<DecorationSet>("claimMarks");

/** Underlines every cited claim in the colour (and line style) of its trust label. */
export const ClaimMarks = Extension.create({
  name: "claimMarks",
  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key: claimMarksKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, set) {
            const marks = tr.getMeta(claimMarksKey) as ClaimMark[] | undefined;
            if (marks) {
              const size = tr.doc.content.size;
              return DecorationSet.create(
                tr.doc,
                marks
                  .filter((m) => m.from >= 0 && m.to <= size && m.from < m.to)
                  .map((m) =>
                    Decoration.inline(m.from, m.to, {
                      class: "claim-mark",
                      "data-label": m.label,
                      "data-active": m.active ? "true" : "false",
                      "data-claim": m.key,
                    }),
                  ),
              );
            }
            return set.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return claimMarksKey.getState(state);
          },
        },
      }),
    ];
  },
});
