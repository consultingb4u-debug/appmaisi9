"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { exigir, usuarioAtual } from "@/lib/auth/sessao";
import { pode } from "@/lib/auth/permissoes";
import { ErroNegocio, executarAcao, lerFormulario } from "@/lib/acoes";
import { auditar } from "@/lib/services/auditoria";
import { previstas } from "@/lib/services/alocacoes";
import { garantirSemana } from "@/lib/services/semanas";
import { recalcularProjetosDoRecurso } from "@/lib/services/cronograma";
import { editarCelula } from "@/lib/domain/alocacao";
import { parseDia } from "@/lib/domain/datas";
import { rotuloSemana } from "@/lib/domain/semanas";
import type { EstadoAcao } from "@/components/formulario";

function revalidarCapacidade(projetoId?: string, recursoId?: string) {
  revalidatePath("/capacidade", "layout");
  revalidatePath("/");
  if (projetoId) revalidatePath(`/projetos/${projetoId}`, "layout");
  if (recursoId) revalidatePath(`/recursos/${recursoId}`);
}

export type ResultadoCelula = { ok: true; previstas: number } | { ok: false; erro: string };

/** Edição inline de uma célula da grade: o valor é o total de horas previstas da semana. */
export async function salvarHoras(projetoId: string, recursoId: string, semanaId: string, valor: number): Promise<ResultadoCelula> {
  const r = await executarAcao(async () => {
    const u = await exigir("editar", "CAPACIDADE");
    const horas = z.number().min(0, "Horas negativas.").max(80, "Máximo de 80h por semana.").multipleOf(0.5, "Use múltiplos de 0,5h.").parse(valor);
    await db.$transaction(async (tx) => {
      const [projeto, recurso] = await Promise.all([
        tx.projeto.findUnique({ where: { id: projetoId }, select: { nome: true, arquivadoEm: true } }),
        tx.recurso.findUnique({ where: { id: recursoId }, select: { nome: true, ativo: true } }),
      ]);
      if (!projeto || projeto.arquivadoEm) throw new ErroNegocio("Projeto não encontrado.");
      if (!recurso?.ativo) throw new ErroNegocio("Recurso inativo.");
      const semana = await garantirSemana(tx, semanaId);
      const chave = { projetoId_recursoId_semanaId: { projetoId, recursoId, semanaId } };
      const atual = await tx.alocacaoSemanal.findUnique({ where: chave });
      const antes = atual ? previstas(atual) : 0;
      if (antes === horas) return;
      const edicao = editarCelula(
        horas,
        atual && { horasCalculadas: atual.horasCalculadas.toNumber(), horasAvulsas: atual.horasAvulsas.toNumber(), horasRealizadas: atual.horasRealizadas.toNumber() },
      );
      const resumo = `${recurso.nome} · ${projeto.nome} · ${rotuloSemana(semana)}: ${antes}h → ${horas}h`;
      if (edicao.tipo === "excluir") {
        if (atual) {
          await tx.alocacaoSemanal.delete({ where: { id: atual.id } });
          await auditar(tx, { entidade: "AlocacaoSemanal", entidadeId: atual.id, projetoId, acao: "EXCLUIR", usuarioId: u.id, resumo });
        }
        return;
      }
      const salvo = await tx.alocacaoSemanal.upsert({
        where: chave,
        update: { horasManuais: edicao.horasManuais, atualizadoPorId: u.id },
        create: { projetoId, recursoId, semanaId, horasManuais: edicao.horasManuais, criadoPorId: u.id, atualizadoPorId: u.id },
      });
      await auditar(tx, {
        entidade: "AlocacaoSemanal",
        entidadeId: salvo.id,
        projetoId,
        acao: atual ? "ALTERAR" : "CRIAR",
        usuarioId: u.id,
        resumo,
        antes: atual ? { horasPrevistas: antes } : null,
        depois: { horasPrevistas: horas },
      });
    });
    revalidarCapacidade(projetoId, recursoId);
  });
  if (r?.erro) return { ok: false, erro: r.erro };
  return { ok: true, previstas: valor };
}

/** Detalhes da célula: status, prioridade e observação (e remoção do override). */
export async function salvarDetalheAlocacao(id: string, _: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "CAPACIDADE");
    const f = lerFormulario(dados);
    const v = z
      .object({
        status: z.enum(["PLANEJADO", "EM_ANDAMENTO", "BLOQUEADO", "AGUARDANDO_CLIENTE", "CONCLUIDO", "CANCELADO"]),
        prioridade: z.enum(["BAIXA", "MEDIA", "ALTA", "CRITICA"]).optional(),
        observacao: z.string().max(1000).optional(),
        voltarCalculado: z.boolean(),
      })
      .parse({ ...f, voltarCalculado: f.voltarCalculado === "on" });
    const salvo = await db.$transaction(async (tx) => {
      const antes = await tx.alocacaoSemanal.findUniqueOrThrow({ where: { id } });
      const depois = await tx.alocacaoSemanal.update({
        where: { id },
        data: {
          status: v.status,
          prioridade: v.prioridade ?? null,
          observacao: v.observacao ?? null,
          ...(v.voltarCalculado && { horasManuais: null }),
          atualizadoPorId: u.id,
        },
      });
      await auditar(tx, { entidade: "AlocacaoSemanal", entidadeId: id, projetoId: depois.projetoId, acao: "ALTERAR", usuarioId: u.id, resumo: "Detalhes da alocação", antes, depois });
      return depois;
    });
    revalidarCapacidade(salvo.projetoId, salvo.recursoId);
  });
}

// ───────────────────────────── Indisponibilidades ─────────────────────────────

const zIndisp = z
  .object({
    recursoId: z.uuid("Escolha o recurso."),
    tipo: z.enum(["FERIAS", "FERIADO_LOCAL", "AUSENCIA", "TREINAMENTO", "BLOQUEIO", "OUTROS"]),
    inicio: z.string({ error: "Informe o início." }),
    fim: z.string().optional(),
    horasPorDia: z.coerce.number().min(0.5, "Mínimo 0,5h.").max(12).optional(),
    observacao: z.string().max(500).optional(),
  })
  .transform((v, ctx) => {
    const inicio = parseDia(v.inicio);
    const fim = parseDia(v.fim) ?? inicio;
    if (!inicio || !fim) ctx.addIssue({ code: "custom", message: "Datas inválidas." });
    else if (fim < inicio) ctx.addIssue({ code: "custom", message: "Fim anterior ao início." });
    return { ...v, inicio: inicio!, fim: fim! };
  });

/**
 * Gestor/Admin cadastram para qualquer recurso (já aprovada).
 * Consultor solicita só para si mesmo (fica pendente de aprovação).
 */
export async function criarIndisponibilidade(_: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await usuarioAtual();
    const v = zIndisp.parse(lerFormulario(dados));
    const gestor = pode(u.perfil, "editar", "CAPACIDADE");
    if (!gestor) {
      const meu = await db.recurso.findUnique({ where: { usuarioId: u.id }, select: { id: true } });
      if (!meu || meu.id !== v.recursoId) throw new ErroNegocio("Você só pode solicitar indisponibilidade para você mesmo.");
    }
    const status = gestor ? "APROVADA" : "PENDENTE";
    const criada = await db.$transaction(async (tx) => {
      const c = await tx.indisponibilidade.create({ data: { ...v, horasPorDia: v.horasPorDia ?? null, observacao: v.observacao ?? null, status, criadoPorId: u.id }, include: { recurso: true } });
      await auditar(tx, { entidade: "Indisponibilidade", entidadeId: c.id, acao: "CRIAR", usuarioId: u.id, resumo: `${c.recurso.nome} · ${c.tipo} · ${v.inicio.toISOString().slice(0, 10)} a ${v.fim.toISOString().slice(0, 10)} (${status})`, depois: c });
      // Ausência aprovada muda os dias úteis do recurso: redistribui o cronograma.
      if (status === "APROVADA") await recalcularProjetosDoRecurso(tx, c.recursoId);
      return c;
    }, { timeout: 30_000 });
    revalidarCapacidade(undefined, criada.recursoId);
    return { ok: true, mensagem: gestor ? "Indisponibilidade registrada." : "Solicitação enviada para aprovação." };
  });
}

export async function decidirIndisponibilidade(id: string, decisao: "APROVADA" | "RECUSADA"): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "CAPACIDADE");
    const i = await db.$transaction(async (tx) => {
      const antes = await tx.indisponibilidade.findUniqueOrThrow({ where: { id } });
      const depois = await tx.indisponibilidade.update({ where: { id }, data: { status: decisao } });
      await auditar(tx, { entidade: "Indisponibilidade", entidadeId: id, acao: "ALTERAR", usuarioId: u.id, resumo: decisao === "APROVADA" ? "Aprovada" : "Recusada", antes, depois });
      if (antes.status === "APROVADA" || decisao === "APROVADA") await recalcularProjetosDoRecurso(tx, depois.recursoId);
      return depois;
    }, { timeout: 30_000 });
    revalidarCapacidade(undefined, i.recursoId);
  });
}

export async function excluirIndisponibilidade(id: string): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await usuarioAtual();
    const i = await db.indisponibilidade.findUniqueOrThrow({ where: { id }, include: { recurso: true } });
    const gestor = pode(u.perfil, "editar", "CAPACIDADE");
    // Consultor pode cancelar a própria solicitação enquanto pendente.
    if (!gestor && !(i.recurso.usuarioId === u.id && i.status === "PENDENTE")) throw new ErroNegocio("Sem permissão para excluir.");
    await db.$transaction(async (tx) => {
      await tx.indisponibilidade.delete({ where: { id } });
      await auditar(tx, { entidade: "Indisponibilidade", entidadeId: id, acao: "EXCLUIR", usuarioId: u.id, resumo: `${i.recurso.nome} · ${i.tipo}` });
      if (i.status === "APROVADA") await recalcularProjetosDoRecurso(tx, i.recursoId);
    }, { timeout: 30_000 });
    revalidarCapacidade(undefined, i.recursoId);
  });
}
