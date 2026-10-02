import { timingSafeEqual } from "node:crypto";
import { enviarAlertasDoDia } from "@/lib/services/notificacoes";

/** Rotina diária de alertas por e-mail. Chamada pelo agendador (docker compose) com o CRON_SECRET. */
export async function POST(req: Request) {
  const segredo = process.env.CRON_SECRET;
  const enviado = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const ok = !!segredo && enviado.length === segredo.length && timingSafeEqual(Buffer.from(enviado), Buffer.from(segredo));
  if (!ok) return Response.json({ erro: "Não autorizado." }, { status: 401 });
  const r = await enviarAlertasDoDia();
  console.log(`[alertas] ${r.simulado ? "SIMULADO" : "enviado"}: ${r.emails} e-mail(s), ${r.alertasNovos} alerta(s) novo(s), ${r.usuarios} usuário(s)`);
  return Response.json(r);
}
