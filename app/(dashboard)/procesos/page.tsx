import { FileText, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/modules/page-header";

export default function ProcessesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Procesos por area"
        title="Procesos"
        description="Modulo reservado para documentar procesos por area, areas impactadas, relaciones con herramientas, riesgos, hallazgos y entrevistas."
      />

      <Card className="overflow-hidden border-white/80 bg-white/75 p-0">
        <div className="border-b border-white/70 p-5">
          <CardHeader eyebrow="Pendiente de implementacion" title="Modulo sin registros cargados" action={<Badge tone="neutral">Sin demo</Badge>} />
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            Este espacio queda limpio hasta que construyamos el flujo funcional de procesos. No se mostraran areas, procesos o documentos ficticios.
          </p>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[1.4rem] border border-dashed border-blueprint/25 bg-blueprint/5 p-6">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blueprint/10 text-blueprint ring-1 ring-blueprint/10">
              <Workflow className="h-5 w-5" />
            </span>
            <h2 className="mt-4 font-display text-xl font-semibold tracking-tight text-ink">Sin procesos registrados</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Cuando implementemos el modulo, aqui se podran registrar procesos, asociarlos a areas y vincularlos con hallazgos, riesgos y herramientas.
            </p>
          </div>

          <div className="rounded-[1.4rem] bg-white/62 p-6 ring-1 ring-white/80">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <FileText className="h-4 w-4 text-blueprint" />
              Alcance previsto
            </p>
            <div className="mt-4 grid gap-2.5">
              {[
                "Nombre del proceso",
                "Area principal",
                "Areas impactadas",
                "Documento adjunto",
                "Relaciones con herramientas, riesgos, hallazgos y entrevistas"
              ].map((item) => (
                <p key={item} className="rounded-xl bg-white/70 p-3 text-sm font-medium text-slate-600 ring-1 ring-white/80">
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
