"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CheckSquare, ClipboardList, Cpu, FolderOpen, LayoutDashboard, MessagesSquare, PackageCheck, SearchCheck, ShieldAlert, Users, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModuleKey } from "@/lib/types";

const icons: Record<ModuleKey, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  stakeholders: Users,
  documentos: FolderOpen,
  cronograma: CalendarDays,
  tareas: ClipboardList,
  comunicacion: MessagesSquare,
  inventario: Cpu,
  procesos: Workflow,
  hallazgos: SearchCheck,
  riesgos: ShieldAlert,
  decisiones: CheckSquare,
  entregables: PackageCheck
};

export function SidebarNav({ items }: { items: { key: ModuleKey; label: string }[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
      {items.map((item) => {
        const href = `/${item.key}`;
        const Icon = icons[item.key];
        const active = isActiveRoute(pathname, href);

        return (
          <Link
            key={item.key}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-white/[0.14] text-white shadow-sm shadow-black/10 ring-1 ring-white/10"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            )}
          >
            <span
              className={cn(
                "absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full transition",
                active ? "bg-sun opacity-100" : "bg-transparent opacity-0"
              )}
            />
            <span
              className={cn(
                "grid h-7 w-7 shrink-0 place-items-center rounded-lg transition",
                active ? "bg-blueprint text-white shadow-md shadow-blueprint/25" : "text-blueprint group-hover:bg-white/10 group-hover:text-sun"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {active ? <span className="h-1.5 w-1.5 rounded-full bg-sun shadow-sm shadow-sun/40" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
