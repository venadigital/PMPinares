import { NextResponse } from "next/server";
import { sendProjectEmail } from "@/lib/email";

export async function POST(request: Request) {
  const body = await request.json();
  const { to, assigneeName, taskTitle } = body;

  if (!to || !assigneeName || !taskTitle) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const result = await sendProjectEmail({
    to,
    subject: "Nueva tarea asignada en Pinares Project Control",
    html: `<p>Hola ${assigneeName},</p><p>Se te asigno una nueva tarea: <strong>${taskTitle}</strong>.</p>`
  });

  return NextResponse.json({ ok: true, result });
}
