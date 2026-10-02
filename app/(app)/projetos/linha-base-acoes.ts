"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { exigirProjeto, exigirRegistro } from "@/lib/auth/escopo";
import { ErroNegocio, executarAcao, lerFormulario } from "@/lib/acoes";
import { auditar } from "@/lib/services/auditoria";
import { criarLinhaBase } from "@/lib/services/linha-base";
import { impactoChangeRequest } from "@/lib/domain/linha-base";
import { chaveDia, formatarData, paraDia } from "@/lib/domain/datas";
import type { EstadoAcao } from "@/components/formulario";

function revalidar(projetoId: string) {
  revalidatePath(`/projetos/${projetoId}`, "layout");
  revalidatePath("/portfolio");
  revalidatePath("/");
}

const zLinhaBase = z.object({ nome: z.string({ error: "Dê um nome (ex.: Baseline do kick-off)." }).min(2).max(80), observacao: z.string().max(500).optional() });

export async function salvarLinhaBase(projetoId: string, _: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigirProjeto(projetoId);
    const v = zLinhaBase.parse(lerFormulario(dados));
    if (!(await db.atividade.count({ where: { projetoId, status: { not: "CANCELADO" } } }))) throw new ErroNegocio("O cronograma está vazio: não há o que congelar.");
    await db.$transaction(async (tx) => {
      const lb = await criarLinhaBase(tx, projetoId, v.nome, v.observacao ?? null, u.id);
      const n = await tx.linhaBaseItem.count({ where: { linhaBaseId: lb.id } });
      await auditar(tx, { entidade: "LinhaBase", entidadeId: lb.id, projetoId, acao: "CRIAR", usuarioId: u.id, resumo: `Linha de base "${v.nome}" (${n} atividades)` });
    });
    revalidar(projetoId);
    return { ok: true, mensagem: "Linha de base criada." };
  });
}

export async function excluirLinhaBase(id: string): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigirRegistro("linhaBase", id);
    const lb = await db.$transaction(async (tx) => {
      const lb = await tx.linhaBase.delete({ where: { id } });
      await auditar(tx, { entidade: "LinhaBase", entidadeId: id, projetoId: lb.projetoId, acao: "EXCLUIR", usuarioId: u.id, resumo: `Linha de base "${lb.nome}"` });
      return lb;
    });
    revalidar(lb.projetoId);
  });
}

const zDecisao = z.object({
  decisao: z.enum(["APROVADO", "REPROVADO"]),
  aprovador: z.string({ error: "Informe quem decidiu." }).min(2).max(200),
  aplicar: z.string().optional(),
});

/**
 * Decide um change request. Aprovado com "aplicar": soma as horas do CR às horas vendidas do projeto
 * e desloca o Go Live alvo pelos dias úteis do CR — uma vez só (crAplicadoEm).
 */
export async function decidirChangeRequest(id: string, _: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigirRegistro("itemOperacional", id);
    const v = zDecisao.parse(lerFormulario(dados));
    const cr = await db.itemOperacional.findUniqueOrThrow({ where: { id } });
    if (cr.tipo !== "CHANGE_REQUEST") throw new ErroNegocio("Este item não é um change request.");
    if (cr.crAplicadoEm) throw new ErroNegocio("Este CR já foi aprovado e aplicado ao projeto.");
    const aplicar = v.decisao === "APROVADO" && v.aplicar === "on";
    const feriados = new Set((await db.feriado.findMany({ select: { data: true } })).map((f) => chaveDia(f.data)));
    const msg = await db.$transaction(async (tx) => {
      const hoje = paraDia(new Date());
      const depois = await tx.itemOperacional.update({
        where: { id },
        data: { status: v.decisao, decisaoAprovador: `${v.aprovador} em ${formatarData(hoje)}`, dataFechamento: hoje, crAplicadoEm: aplicar ? new Date() : null, atualizadoPorId: u.id },
      });
      await auditar(tx, { entidade: "ItemOperacional", entidadeId: id, projetoId: cr.projetoId, acao: "ALTERAR", usuarioId: u.id, resumo: `${cr.codigo} ${v.decisao === "APROVADO" ? "aprovado" : "reprovado"} por ${v.aprovador}`, antes: cr, depois });
      if (!aplicar) return v.decisao === "APROVADO" ? `${cr.codigo} aprovado (sem alterar o projeto).` : `${cr.codigo} reprovado.`;
      const antes = await tx.projeto.findUniqueOrThrow({ where: { id: cr.projetoId } });
      const novo = impactoChangeRequest(
        { horasVendidas: antes.horasVendidas?.toNumber() ?? null, goLive: antes.dataGoLiveAlvo },
        { horas: cr.horasCr?.toNumber() ?? null, dias: cr.diasCr },
        feriados,
      );
      const proj = await tx.projeto.update({ where: { id: cr.projetoId }, data: { horasVendidas: novo.horasVendidas, dataGoLiveAlvo: novo.goLive, atualizadoPorId: u.id } });
      await auditar(tx, { entidade: "Projeto", entidadeId: cr.projetoId, projetoId: cr.projetoId, acao: "ALTERAR", usuarioId: u.id, resumo: `Impacto do ${cr.codigo} aprovado`, antes, depois: proj });
      const partes = [cr.horasCr ? `+${cr.horasCr.toNumber()}h vendidas` : null, cr.diasCr && novo.goLive ? `Go Live para ${formatarData(novo.goLive)}` : null].filter(Boolean);
      return `${cr.codigo} aprovado${partes.length ? `: ${partes.join(", ")}` : ""}. Considere criar uma nova linha de base.`;
    });
    revalidar(cr.projetoId);
    return { ok: true, mensagem: msg };
  });
}
