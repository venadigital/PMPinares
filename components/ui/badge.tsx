import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-white/70 text-ink ring-1 ring-ink/10",
  blue: "bg-blueprint/10 text-blueprint ring-1 ring-blueprint/20",
  yellow: "bg-sun/20 text-ink ring-1 ring-sun/35",
  red: "bg-coral/10 text-coral ring-1 ring-coral/20",
  green: "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20"
};

export function Badge({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: keyof typeof tones; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.72rem] font-medium", tones[tone], className)}>{children}</span>;
}
