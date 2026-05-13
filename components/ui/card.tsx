import { cn } from "@/lib/utils";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("apple-card p-4 sm:p-5", className)}>{children}</section>;
}

export function CardHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        {eyebrow ? <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-blueprint">{eyebrow}</p> : null}
        <h2 className="font-display text-xl font-bold tracking-tight text-ink">{title}</h2>
      </div>
      {action}
    </div>
  );
}
