import { Button } from "@/components/ui/button";

export function PageHeader({ eyebrow, title, description, actionLabel, actionHref }: { eyebrow: string; title: string; description: string; actionLabel?: string; actionHref?: string }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div className="max-w-3xl">
        <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-blueprint">{eyebrow}</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {actionLabel ? <Button href={actionHref} variant="accent">{actionLabel}</Button> : null}
    </div>
  );
}
