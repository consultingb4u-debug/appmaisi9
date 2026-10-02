import nodemailer from "nodemailer";

// Envio de e-mail por SMTP (no Microsoft 365: smtp.office365.com, porta 587, conta com SMTP AUTH liberado).
// Sem SMTP_HOST configurado, o envio é simulado: nada sai, e a rotina informa o que teria enviado.
export function emailConfigurado(): boolean {
  return !!process.env.SMTP_HOST;
}

export async function enviarEmail(m: { para: string; assunto: string; html: string; texto: string }): Promise<{ enviado: boolean }> {
  if (!emailConfigurado()) return { enviado: false };
  const porta = Number(process.env.SMTP_PORT ?? 587);
  const transporte = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: porta,
    secure: porta === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  await transporte.sendMail({ from: process.env.SMTP_FROM ?? process.env.SMTP_USER, to: m.para, subject: m.assunto, html: m.html, text: m.texto });
  return { enviado: true };
}
