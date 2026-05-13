import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function DataTable({ columns, rows }: { columns: string[]; rows: (string | number | React.ReactNode)[][] }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-white/40 text-[0.7rem] uppercase tracking-[0.14em] text-slate-500">
              {columns.map((column) => <th key={column} className="px-5 py-3 font-semibold">{column}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b border-ink/5 last:border-b-0">
                {row.map((cell, cellIndex) => <td key={cellIndex} className="px-5 py-3.5 align-top text-slate-700">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const tone = value.includes("Alta") || value.includes("Alto") || value.includes("Rojo") || value.includes("Bloqueado") ? "red" : value.includes("Verde") || value.includes("Aprobado") || value.includes("Completado") ? "green" : value.includes("Amarillo") || value.includes("Pendiente") ? "yellow" : "blue";
  return <Badge tone={tone}>{value}</Badge>;
}
