"use client";

import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { inTextLabel } from "@/core/citation/csl";
import { LABELS } from "@/core/labels";
import { stripRetractedPrefix } from "@/core/text/normalize";
import { sourceLabel } from "@/core/workflow/labels";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toneOf } from "@/components/trust/trust-badge";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useCitationContext } from "./citation-context";

/** Inline citation chip: formatted in-text citation plus the source's verification dot. */
export function CitationChip({ node, selected }: ReactNodeViewProps) {
  const id = String(node.attrs.id ?? "");
  const src = useStore((s) => s.sources[id]);
  const { style, numbers, onOpenSource } = useCitationContext();
  const label = src ? sourceLabel(src.verification) : "not_found";
  const text = src ? inTextLabel(src, style, numbers.get(id)) : "(source removed)";
  return (
    <NodeViewWrapper as="span" className="mx-px inline">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            contentEditable={false}
            onClick={() => onOpenSource?.(id)}
            className={cn(
              "relative -top-px inline-flex items-center gap-1 rounded-md bg-ink-50 px-1.5 py-px align-baseline font-sans text-[0.78em] font-medium text-ink-700 ring-1 ring-ink-200 ring-inset transition-colors select-none hover:bg-white hover:ring-ink-300",
              selected && "ring-2 ring-trace-400",
              label === "retracted" && "bg-rose-50 text-rose-900 ring-rose-200",
              label === "not_found" && "bg-rose-50 text-rose-800 ring-rose-200",
            )}
          >
            <span className={cn("size-1.5 rounded-full", toneOf(label).dot)} aria-hidden="true" />
            {text}
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-72">
          <span className="block font-medium">{src ? stripRetractedPrefix(src.record.title) : "This source is no longer in your library."}</span>
          <span className="mt-1 block opacity-75">Reference: {LABELS[label].title}. Click to open it.</span>
        </TooltipContent>
      </Tooltip>
    </NodeViewWrapper>
  );
}
