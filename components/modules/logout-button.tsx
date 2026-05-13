import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/(auth)/login/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/15 hover:text-white">
        <LogOut className="h-3.5 w-3.5" />
        Cerrar sesion
      </button>
    </form>
  );
}
