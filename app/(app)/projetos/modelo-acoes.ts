"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { exigir } from "@/lib/auth/sessao";
import { exigirProjeto } from "@/lib/auth/escopo";
import { ErroNegocio, executarAcao, lerFormulario } from "@/lib/acoes";
import { auditar } from "@/lib/services/auditoria";
import { aplicarModelo, salvarComoModelo } from "@/lib/services/modelos";
import { parseDia } from "@/lib/domain/datas";
import type { EstadoAcao } from "@/components/formulario";

const zSalvar = z.object({ nome: z.string({ error: "Dê um nome ao modelo (ex.: Reforma Tributária)." }).min(3).max(80), descricao: z.string().max(500).optional() });

export async function salvarModelo(projetoId: string, _: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigirProjeto(projetoId);
    const v = zSalvar.parse(lerFormulario(dados));
    if (!(await db.atividade.count({ where: { projetoId, status: { not: "CANCELADO" } } }))) throw new ErroNegocio("O cronograma está vazio.");
    await db.$transaction(
      async (tx) => {
        const m = await salvarComoModelo(tx, projetoId, v.nome, v.descricao ?? null, u.id);
        await auditar(tx, { entidade: "ModeloCronograma", entidadeId: m.id, projetoId, acao: "CRIAR", usuarioId: u.id, resumo: `Modelo "${v.nome}" criado a partir do projeto` });
      },
      { timeout: 60_000 },
    );
    revalidatePath("/modelos");
    return { ok: true, mensagem: `Modelo "${v.nome}" salvo.` };
  });
}

const zAplicar = z.object({
  modeloId: z.uuid({ error: "Escolha um modelo." }),
  inicio: z.string({ error: "Informe a data de início." }).transform((s, ctx) => {
    const d = parseDia(s);
    if (!d) ctx.addIssue({ code: "custom", message: "Data inválida." });
    return d!;
  }),
  manterRecursos: z.string().optional(),
});

export async function aplicarModeloCronograma(projetoId: string, _: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  let resumo = "";
  const r = await executarAcao(async () => {
    const u = await exigirProjeto(projetoId);
    const v = zAplicar.parse(lerFormulario(dados));
    if (await db.atividade.count({ where: { projetoId } })) throw new ErroNegocio("O projeto já tem cronograma: o modelo só é aplicado num cronograma vazio.");
    const r = await db.$transaction(
      async (tx) => {
        const r = await aplicarModelo(tx, projetoId, v.modeloId, v.inicio, v.manterRecursos === "on", u.id);
        await auditar(tx, { entidade: "Projeto", entidadeId: projetoId, projetoId, acao: "ALTERAR", usuarioId: u.id, resumo: `Cronograma criado do modelo "${r.nome}" (${r.atividades} atividades, ${r.backlog} requisitos)` });
        return r;
      },
      { timeout: 120_000 },
    );
    resumo = `${r.atividades}-${r.backlog}`;
    revalidatePath(`/projetos/${projetoId}`, "layout");
    revalidatePath("/capacidade", "layout");
  });
  if (r?.erro) return r;
  // O formulário some quando o cronograma deixa de estar vazio: o aviso vai na URL.
  redirect(`/projetos/${projetoId}/cronograma?modelo=${resumo}`);
}

export async function excluirModelo(id: string): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "PROJETOS");
    const m = await db.modeloCronograma.findUniqueOrThrow({ where: { id } });
    if (u.perfil !== "ADMIN" && m.criadoPorId !== u.id) throw new ErroNegocio("Só quem criou o modelo ou um administrador pode excluí-lo.");
    await db.$transaction(async (tx) => {
      await tx.modeloCronograma.delete({ where: { id } });
      await auditar(tx, { entidade: "ModeloCronograma", entidadeId: id, acao: "EXCLUIR", usuarioId: u.id, resumo: `Modelo "${m.nome}"` });
    });
    revalidatePath("/modelos");
  });
}
