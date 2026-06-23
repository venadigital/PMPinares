import { InventoryExecutive } from "@/components/modules/inventory-executive";
import { PageHeader } from "@/components/modules/page-header";
import { Card } from "@/components/ui/card";
import { getCurrentProfile, hasPermission } from "@/lib/auth";

export default async function InventoryPage() {
  const profile = await getCurrentProfile();
  const canView = hasPermission(profile, "inventario", "view");

  if (!canView) {
    return (
      <>
        <PageHeader eyebrow="Stack tecnológico" title="Inventario TI" description="Tu usuario no tiene acceso al módulo de inventario." />
        <Card>
          <p className="font-medium text-slate-600">Solicita acceso al Administrador Vena Digital si necesitas consultar el ecosistema tecnológico.</p>
        </Card>
      </>
    );
  }

  return <InventoryExecutive />;
}
