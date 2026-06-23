import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { getCurrentProfile, hasPermission } from "@/lib/auth";

const sheetFiles: Record<string, string> = {
  siis: "Ficha_Software_SIIS.html",
  siigo: "Ficha_Software_SIIGO.html",
  coco: "Ficha_Software_CoCo_Pinares.html",
  "microsoft-365": "Ficha_Software_Microsoft365_Pinares.html",
  luxflow: "Ficha_Software_Luxflow.html",
  "ivms-4200": "Ficha_Software_IVMS4200_Pinares.html",
  "mundo-medicos": "Ficha_Software_MundoMedicos_Pinares.html",
  fudo: "Ficha_Software_FUDO.html",
  "intranet-universidad": "Ficha_Software_Intranet_Universidad_Pinares.html",
  kommo: "Ficha_Software_Kommo.html",
  zebra: "Ficha_Software_Zebra.html",
  wondershare: "Ficha_Software_Wondershare_Pinares.html"
};

export async function GET(_: Request, context: { params: Promise<{ slug: string }> }) {
  const profile = await getCurrentProfile();
  if (!hasPermission(profile, "inventario", "view")) {
    return new NextResponse("No autorizado", { status: 403 });
  }

  const { slug } = await context.params;
  const filename = sheetFiles[slug];
  if (!filename) return new NextResponse("Ficha no encontrada", { status: 404 });

  const html = await readProtectedSheet(filename);
  if (!html) return new NextResponse("Ficha no disponible", { status: 404 });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src https://fonts.gstatic.com https://cdn.jsdelivr.net; img-src 'self' data: https:; connect-src 'none'; script-src 'none'; base-uri 'none'; frame-ancestors 'self'"
    }
  });
}

async function readProtectedSheet(filename: string) {
  const candidates = [
    join(process.cwd(), "content", "inventory-fichas", filename),
    join(process.cwd(), "standalone", "content", "inventory-fichas", filename),
    join(process.cwd(), ".next", "standalone", "content", "inventory-fichas", filename)
  ];

  for (const path of candidates) {
    try {
      return await readFile(path, "utf8");
    } catch {
      // Try the next standalone-compatible location.
    }
  }

  return null;
}
