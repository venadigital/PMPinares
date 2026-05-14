import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

export async function sendProjectEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!resend) {
    console.info("RESEND_API_KEY no configurada. Email omitido:", { to, subject });
    return { skipped: true };
  }

  try {
    const result = await resend.emails.send({
      from: `Pinares Project Control <${fromEmail}>`,
      to,
      subject,
      html
    });

    if (result.error) {
      console.error("Resend no pudo enviar el correo:", { to, subject, error: result.error });
    }

    return result;
  } catch (error) {
    console.error("Error inesperado enviando correo con Resend:", { to, subject, error });
    return { data: null, error };
  }
}
