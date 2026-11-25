import { cn } from "@/lib/utils";

/** A claim (white node) traced along a path to its source (mint node). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-7 shrink-0", className)}>
      <rect width="32" height="32" rx="9" fill="#0b1020" />
      <path d="M10.2 21.8C10.2 15 14.6 10.6 21.6 10.4" stroke="#34cc9f" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path d="M10.2 21.8C10.2 15 14.6 10.6 21.6 10.4" stroke="#34cc9f" strokeOpacity=".28" strokeWidth="6" strokeLinecap="round" fill="none" />
      <circle cx="10.2" cy="21.8" r="3.1" fill="#fff" />
      <circle cx="21.8" cy="10.4" r="3.1" fill="#34cc9f" />
    </svg>
  );
}

export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      <span className="text-[17px] font-semibold tracking-[-0.02em] text-ink-950">
        Claim<span className="text-trace-600">Trace</span>
      </span>
    </span>
  );
}
