import { cn } from "@/lib/utils";

export function Page({ children, className, wide = false }: { children: React.ReactNode; className?: string; wide?: boolean }) {
  return <div className={cn("mx-auto w-full px-4 py-7 md:px-8 md:py-9", wide ? "max-w-[1400px]" : "max-w-6xl", className)}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-5 pb-7 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="font-mono text-[11px] tracking-[0.14em] text-trace-700 uppercase">{eyebrow}</p>}
        <h1 className="mt-2 text-[26px] leading-tight font-semibold tracking-[-0.028em] text-ink-950 md:text-[28px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-ink-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-2xl border border-ink-200/80 bg-white shadow-card", className)} {...rest}>
      {children}
    </div>
  );
}

export function PanelHeader({ title, description, actions, icon }: { title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4">
      <div className="flex min-w-0 items-start gap-3">
        {icon && <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-ink-50 text-ink-600 ring-1 ring-ink-200/80 [&_svg]:size-4">{icon}</span>}
        <div className="min-w-0">
          <h2 className="text-[14.5px] font-semibold tracking-[-0.01em] text-ink-950">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] leading-relaxed text-ink-500">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, description, action, className }: { icon: React.ReactNode; title: string; description: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-b from-white to-ink-50 text-ink-500 shadow-ring [&_svg]:size-5">{icon}</span>
      <h3 className="mt-4 text-[15px] font-semibold text-ink-950">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-ink-500">{description}</p>
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
