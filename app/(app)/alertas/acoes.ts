"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigir, usuarioAtual } from "@/lib/auth/sessao";
import { executarAcao } from "@/lib/acoes";
import { auditar } from "@/lib/services/auditoria";
import { enviarAlertasDoDia } from "@/lib/services/notificacoes";
import type { EstadoAcao } from "@/components/formulario";

export async function alternarEmail(): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await usuarioAtual();
    const atual = await db.usuario.findUniqueOrThrow({ where: { id: u.id } });
    await db.$transaction(async (tx) => {
      const depois = await tx.usuario.update({ where: { id: u.id }, data: { notificarEmail: !atual.notificarEmail } });
      await auditar(tx, { entidade: "Usuario", entidadeId: u.id, acao: "ALTERAR", usuarioId: u.id, resumo: "Preferência de e-mail dos alertas", antes: atual, depois });
    });
    revalidatePath("/alertas");
    return { ok: true, mensagem: atual.notificarEmail ? "E-mails desligados." : "E-mails ligados." };
  });
}

/** Administrador: roda a rotina diária agora (útil para testar a configuração do SMTP). */
export async function rodarRotinaAgora(): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "USUARIOS");
    const r = await enviarAlertasDoDia();
    await db.$transaction((tx) => auditar(tx, { entidade: "Notificacao", entidadeId: u.id, acao: "CRIAR", usuarioId: u.id, resumo: `Rotina de alertas manual: ${r.emails} e-mail(s), ${r.alertasNovos} alerta(s)${r.simulado ? " (simulado)" : ""}` }));
    revalidatePath("/alertas");
    return {
      ok: true,
      mensagem: r.simulado
        ? `Simulação (SMTP não configurado): ${r.detalhes.length} pessoa(s) receberiam ${r.alertasNovos} alerta(s) novo(s).`
        : `${r.emails} e-mail(s) enviado(s) com ${r.alertasNovos} alerta(s) novo(s).`,
    };
  });
}
