"use client";

import { BookOpen } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { LABELS, type TrustLabel } from "@/core/labels";
import { toneOf } from "@/components/trust/trust-badge";
import { cn } from "@/lib/utils";

export interface CiteItem {
  id: string;
  label: string; // e.g. "Kelly et al. (2018)"
  title: string;
  status: TrustLabel;
}

export interface CiteMenuHandle {
  onKeyDown: (e: KeyboardEvent) => boolean;
}

/** The "@" popup listing library sources. Keyboard: up, down, enter, escape. */
export const CiteMenu = forwardRef<CiteMenuHandle, { items: CiteItem[]; command: (item: { id: string | null; label?: string | null }) => void; query: string }>(
  function CiteMenu({ items, command, query }, ref) {
    const [active, setActive] = useState(0);
    useEffect(() => setActive(0), [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: (e) => {
        if (!items.length) return false;
        if (e.key === "ArrowDown") {
          setActive((a) => (a + 1) % items.length);
          return true;
        }
        if (e.key === "ArrowUp") {
          setActive((a) => (a - 1 + items.length) % items.length);
          return true;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          const it = items[active];
          if (it) command({ id: it.id, label: it.label });
          return true;
        }
        return false;
      },
    }));

    return (
      <div className="w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-ink-200 bg-white shadow-pop" role="listbox" aria-label="Cite a source">
        <div className="flex items-center gap-2 border-b border-ink-100 px-3 py-2 text-[11.5px] text-ink-500">
          <BookOpen className="size-3.5" /> Cite from your library{query ? `: "${query}"` : ""}
        </div>
        {items.length === 0 ? (
          <p className="px-3 py-4 text-[13px] text-ink-500">No matching source. Add it to your library first; the AI never writes references.</p>
        ) : (
          <ul className="max-h-72 overflow-y-auto p-1">
            {items.map((it, i) => (
              <li key={it.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    command({ id: it.id, label: it.label });
                  }}
                  className={cn("flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left", i === active ? "bg-ink-100" : "hover:bg-ink-50")}
                >
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", toneOf(it.status).dot)} aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-baseline gap-x-2 text-[13px] font-medium text-ink-900">
                      {it.label}
                      {/* the label's name, not just its colour */}
                      <span className={cn("text-[11.5px] font-medium", toneOf(it.status).text)}>{LABELS[it.status].title}</span>
                    </span>
                    <span className="block truncate font-serif text-[13px] text-ink-500">{it.title}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);
