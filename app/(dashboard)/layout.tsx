import { Sidebar } from "@/components/modules/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen p-3 md:p-4">
      <div className="mx-auto flex max-w-[1440px] gap-4">
        <Sidebar />
        <main className="min-w-0 flex-1 px-1 py-3 md:px-2 lg:py-5">
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/70 bg-white/68 px-4 py-3 shadow-md shadow-ink/5 backdrop-blur-xl lg:hidden">
            <span className="font-display text-base font-bold">Pinares Project Control</span>
            <span className="rounded-full bg-sun px-2.5 py-0.5 text-xs font-semibold text-ink">MVP</span>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
