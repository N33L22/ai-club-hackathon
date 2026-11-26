"use client";

import {
  BadgeCheck,
  CircleCheckBig,
  CircleDashed,
  CircleHelp,
  CircleSlash2,
  ClipboardPaste,
  Clock3,
  CloudOff,
  OctagonX,
  PenLine,
  SearchX,
  Sparkles,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { LABELS, labelMeaning, type LabelTone, type TrustLabel } from "@/core/labels";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const LABEL_ICONS: Record<TrustLabel, LucideIcon> = {
  verified: BadgeCheck,
  supported: CircleCheckBig,
  supported_own_text: ClipboardPaste,
  unavailable: CloudOff,
  overreach: TriangleAlert,
  not_supported: CircleSlash2,
  unchecked: CircleDashed,
  ai_reasoning: Sparkles,
  not_found: SearchX,
  retracted: OctagonX,
  close_match: CircleHelp,
  student_added: PenLine,
  pending: Clock3,
};

export const TONES: Record<LabelTone, { chip: string; dot: string; text: string; soft: string; border: string }> = {
  green: { chip: "bg-trace-50 text-trace-800 ring-trace-200", dot: "bg-trace-500", text: "text-trace-700", soft: "bg-trace-50", border: "border-trace-200" },
  lime: { chip: "bg-lime-50 text-lime-900 ring-lime-300", dot: "bg-lime-500", text: "text-lime-800", soft: "bg-lime-50", border: "border-lime-300" },
  amber: { chip: "bg-amber-50 text-amber-800 ring-amber-200", dot: "bg-amber-500", text: "text-amber-700", soft: "bg-amber-50", border: "border-amber-200" },
  orange: { chip: "bg-orange-50 text-orange-800 ring-orange-200", dot: "bg-orange-500", text: "text-orange-700", soft: "bg-orange-50", border: "border-orange-200" },
  blue: { chip: "bg-sky-50 text-sky-800 ring-sky-200", dot: "bg-sky-500", text: "text-sky-700", soft: "bg-sky-50", border: "border-sky-200" },
  violet: { chip: "bg-violet-50 text-violet-800 ring-violet-200", dot: "bg-violet-500", text: "text-violet-700", soft: "bg-violet-50", border: "border-violet-200" },
  rose: { chip: "bg-rose-50 text-rose-800 ring-rose-200", dot: "bg-rose-500", text: "text-rose-700", soft: "bg-rose-50", border: "border-rose-200" },
  crimson: { chip: "bg-rose-900 text-white ring-rose-950/20", dot: "bg-rose-800", text: "text-rose-900", soft: "bg-rose-50", border: "border-rose-300" },
  slate: { chip: "bg-slate-50 text-slate-700 ring-slate-200", dot: "bg-slate-400", text: "text-slate-600", soft: "bg-slate-50", border: "border-slate-200" },
  neutral: { chip: "bg-ink-50 text-ink-600 ring-ink-200", dot: "bg-ink-300", text: "text-ink-500", soft: "bg-ink-50", border: "border-ink-200" },
};

export const toneOf = (label: TrustLabel) => TONES[LABELS[label].tone];

const SIZES = {
  sm: "gap-1 px-1.5 py-px text-[11px] [&_svg]:size-3",
  md: "gap-1.5 px-2 py-0.5 text-xs [&_svg]:size-3.5",
  lg: "gap-1.5 px-2.5 py-1 text-[13px] [&_svg]:size-4",
};

export function TrustBadge({
  label,
  context = "claim",
  size = "md",
  className,
  withTooltip = true,
  title,
  meaning: meaningOverride,
}: {
  label: TrustLabel;
  context?: "claim" | "source";
  size?: keyof typeof SIZES;
  className?: string;
  withTooltip?: boolean;
  /** Overrides the label's name, keeping its colour and icon (e.g. search results). */
  title?: string;
  /** Overrides the tooltip text. */
  meaning?: string;
}) {
  const spec = LABELS[label];
  const Icon = LABEL_ICONS[label];
  const chip = (
    <span
      className={cn(
        "inline-flex h-fit shrink-0 items-center rounded-full font-medium whitespace-nowrap ring-1 ring-inset",
        toneOf(label).chip,
        SIZES[size],
        className,
      )}
    >
      <Icon aria-hidden="true" />
      {title ?? spec.title}
    </span>
  );
  const meaning = meaningOverride ?? labelMeaning(label, context);
  if (!withTooltip || !meaning) return chip;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{chip}</TooltipTrigger>
      <TooltipContent className="max-w-64 leading-relaxed">{meaning}</TooltipContent>
    </Tooltip>
  );
}

export function StatusDot({ label, className }: { label: TrustLabel; className?: string }) {
  return <span aria-hidden="true" className={cn("inline-block size-2 shrink-0 rounded-full", toneOf(label).dot, className)} />;
}
