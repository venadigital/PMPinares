import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { getCurrentProfile, hasPermission } from "@/lib/auth";
import { getInventoryData } from "@/lib/inventory";

export async function GET() {
  const profile = await getCurrentProfile();
  if (!hasPermission(profile, "inventario", "view")) return new NextResponse("No autorizado", { status: 403 });

  const { tools } = await getInventoryData();
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Inventario TI");

  sheet.columns = [
    { header: "Nombre", key: "name", width: 28 },
    { header: "Proveedor", key: "provider", width: 24 },
    { header: "Costo", key: "cost", width: 16 },
    { header: "Moneda", key: "currency", width: 12 },
    { header: "Licencia", key: "licenseType", width: 24 },
    { header: "Usuarios", key: "users", width: 12 },
    { header: "Responsable interno", key: "owner", width: 26 },
    { header: "Areas usuarias", key: "areas", width: 42 },
    { header: "Funcionalidades contratadas", key: "contractedFeatures", width: 44 },
    { header: "Funcionalidades usadas", key: "usedFeatures", width: 44 },
    { header: "Integraciones", key: "integrations", width: 36 },
    { header: "API disponible", key: "apiAvailable", width: 14 },
    { header: "Semaforo", key: "trafficLight", width: 16 },
    { header: "Satisfaccion", key: "satisfaction", width: 14 },
    { header: "Riesgos asociados", key: "associatedRisks", width: 44 },
    { header: "Adjuntos", key: "attachments", width: 14 }
  ];

  tools.forEach((tool) => {
    sheet.addRow({
      ...tool,
      areas: tool.areas.join(", "),
      apiAvailable: tool.apiAvailable ? "Si" : "No",
      attachments: tool.attachments.length
    });
  });

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEAF2FF" } };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=inventario-tecnologico-pinares.xlsx"
    }
  });
}
