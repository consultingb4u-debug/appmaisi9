import { db } from "@/lib/db";
import { enviarEmail, emailConfigurado } from "@/lib/email";
import { alertasDoUsuario, montarResumo } from "@/lib/domain/alertas";
import { alertasVigentes } from "./alertas";

export type ResultadoRotina = { usuarios: number; emails: number; alertasNovos: number; simulado: boolean; detalhes: { email: string; novos: number }[] };

/**
 * Rotina diária: para cada usuário ativo que aceita e-mail, envia os alertas que ainda não recebeu
 * (pela chave do alerta). Sem SMTP configurado, apenas simula e não marca nada como enviado.
 */
export async function enviarAlertasDoDia(hoje = new Date()): Promise<ResultadoRotina> {
  const simulado = !emailConfigurado();
  const baseUrl = (process.env.APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const [todos, usuarios] = await Promise.all([
    alertasVigentes(hoje),
    db.usuario.findMany({ where: { ativo: true, notificarEmail: true }, include: { recurso: { select: { id: true } }, notificacoes: { select: { chave: true } } } }),
  ]);
  const r: ResultadoRotina = { usuarios: 0, emails: 0, alertasNovos: 0, simulado, detalhes: [] };
  for (const u of usuarios) {
    if (u.email.endsWith(".local")) continue; // contas de desenvolvimento
    const meus = alertasDoUsuario(todos, { recursoId: u.recurso?.id ?? null, gestor: u.perfil === "ADMIN" || u.perfil === "GESTOR" });
    const ja = new Set(u.notificacoes.map((n) => n.chave));
    const novos = meus.filter((a) => !ja.has(a.chave));
    r.usuarios++;
    if (novos.length === 0) continue;
    const msg = montarResumo(u.nome, novos, meus.filter((a) => ja.has(a.chave)), baseUrl);
    const { enviado } = await enviarEmail({ para: u.email, ...msg });
    r.detalhes.push({ email: u.email, novos: novos.length });
    r.alertasNovos += novos.length;
    if (enviado) {
      r.emails++;
      await db.notificacaoEnviada.createMany({ data: novos.map((a) => ({ usuarioId: u.id, chave: a.chave })), skipDuplicates: true });
    }
  }
  return r;
}
