import Image from "next/image";
import Link from "next/link";
import { UserCircle } from "lucide-react";
import { modules } from "@/lib/data";
import { getCurrentProfile } from "@/lib/auth";
import { initials } from "@/lib/utils";
import { LogoutButton } from "@/components/modules/logout-button";
import { SidebarNav } from "@/components/modules/sidebar-nav";

export async function Sidebar() {
  const currentUser = await getCurrentProfile();
  const nav = modules.filter((module) => currentUser.moduleAccess.includes(module.key));

  return (
    <aside className="dark-glass sticky top-4 hidden h-[calc(100vh-2rem)] w-72 flex-col rounded-[26px] p-4 text-white lg:flex">
      <div className="mb-6 flex items-center gap-3 px-2">
        <Image src="/assets/logo-pinares-project-control.png" alt="Pinares" width={84} height={44} className="h-10 w-auto object-contain" />
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-sun">Project</p>
          <p className="font-display text-base font-bold">Control</p>
        </div>
      </div>
      <SidebarNav items={nav.map((item) => ({ key: item.key, label: item.label }))} />
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.08] p-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-sun text-xs font-bold text-ink">{initials(currentUser.name)}</div>
          <div>
            <p className="text-sm font-semibold text-white">{currentUser.name}</p>
            <p className="text-xs text-slate-400">{currentUser.role}</p>
          </div>
        </div>
        <Link href="/cuenta" className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/15 hover:text-white">
          <UserCircle className="h-3.5 w-3.5" />
          Mi cuenta
        </Link>
        <LogoutButton />
      </div>
    </aside>
  );
}
