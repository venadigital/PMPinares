import { NextResponse } from "next/server";
import { sendProjectEmail } from "@/lib/email";

export async function POST(request: Request) {
  const body = await request.json();
  const { to, mentionedName, authorName, message } = body;

  if (!to || !mentionedName || !authorName || !message) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const result = await sendProjectEmail({
    to,
    subject: "Te mencionaron en Pinares Project Control",
    html: `<p>Hola ${mentionedName},</p><p>${authorName} te menciono:</p><blockquote>${message}</blockquote>`
  });

  return NextResponse.json({ ok: true, result });
}
