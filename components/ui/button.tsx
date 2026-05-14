import Link from "next/link";
import { cn } from "@/lib/utils";

const styles = {
  primary: "bg-ink text-white shadow-md shadow-ink/10 hover:-translate-y-px hover:bg-ink-2",
  accent: "bg-sun text-ink shadow-md shadow-sun/20 hover:-translate-y-px",
  ghost: "bg-white/62 text-ink ring-1 ring-ink/10 hover:bg-white"
};

export function Button({ children, href, variant = "primary", className, type = "button", onClick, disabled }: { children: React.ReactNode; href?: string; variant?: keyof typeof styles; className?: string; type?: "button" | "submit"; onClick?: React.MouseEventHandler<HTMLButtonElement>; disabled?: boolean }) {
  const classes = cn("focus-ring inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-55", styles[variant], className);
  if (href) return <Link href={href} className={classes}>{children}</Link>;
  return <button type={type} className={classes} onClick={onClick} disabled={disabled}>{children}</button>;
}
