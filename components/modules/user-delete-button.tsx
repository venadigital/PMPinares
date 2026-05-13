import { Trash2 } from "lucide-react";
import { deleteUserAction } from "@/app/(dashboard)/stakeholders/actions";

export function UserDeleteButton({ userId, disabled }: { userId: string; disabled?: boolean }) {
  return (
    <form action={deleteUserAction}>
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-full bg-coral/10 px-3 py-2 text-xs font-bold text-coral ring-1 ring-coral/20 transition hover:bg-coral hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-coral/10 disabled:hover:text-coral"
        title={disabled ? "No puedes eliminar tu propio usuario" : "Eliminar usuario"}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Eliminar
      </button>
    </form>
  );
}
