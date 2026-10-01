"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { usuarioAtual, type UsuarioAtual } from "@/lib/auth/sessao";
import { pode } from "@/lib/auth/permissoes";
import { ErroNegocio, executarAcao } from "@/lib/acoes";
import { auditar } from "@/lib/services/auditoria";
import { recalcularProjeto, sincronizarRealizadas } from "@/lib/services/cronograma";
import { garantirSemana } from "@/lib/services/semanas";
import { coerenciaStatus } from "@/lib/domain/cronograma";
import { rotuloSemana } from "@/lib/domain/semanas";

type Resultado = { ok: boolean; erro?: string };

/** Consultor só lança para si; gestor/admin para qualquer recurso. */
async function podeLancar(u: UsuarioAtual, recursoId: string) {
  if (pode(u.perfil, "editar", "CAPACIDADE")) return;
  const meu = await db.recurso.findUnique({ where: { usuarioId: u.id }, select: { id: true } });
  if (meu?.id !== recursoId) throw new ErroNegocio("Você só pode apontar as suas próprias horas.");
}

function revalidar(projetoId: string) {
  revalidatePath("/horas");
  revalidatePath(`/projetos/${projetoId}`, "layout");
  revalidatePath("/capacidade", "layout");
}

/** Horas trabalhadas na semana numa atividade (ou no projeto, quando não há cronograma). 0 apaga o lançamento. */
export async function apontar(recursoId: string, projetoId: string, atividadeId: string | null, semanaId: string, valor: number): Promise<Resultado> {
  const r = await executarAcao(async () => {
    const u = await usuarioAtual();
    await podeLancar(u, recursoId);
    const horas = z.number().min(0, "Horas negativas.").max(80, "Máximo de 80h na semana.").multipleOf(0.5, "Use múltiplos de 0,5h.").parse(valor);
    await db.$transaction(
      async (tx) => {
        const semana = await garantirSemana(tx, semanaId);
        if (atividadeId) {
          const at = await tx.atividadeAtribuicao.findUnique({ where: { atividadeId_recursoId: { atividadeId, recursoId } }, include: { atividade: { select: { projetoId: true } } } });
          if (!at || at.atividade.projetoId !== projetoId) throw new ErroNegocio("Recurso não está atribuído a esta atividade.");
        }
        const atual = await tx.apontamento.findFirst({ where: { recursoId, projetoId, atividadeId, semanaId } });
        const antes = atual?.horas.toNumber() ?? 0;
        if (antes === horas) return;
        if (horas === 0) {
          if (atual) await tx.apontamento.delete({ where: { id: atual.id } });
        } else if (atual) {
          await tx.apontamento.update({ where: { id: atual.id }, data: { horas } });
        } else {
          await tx.apontamento.create({ data: { recursoId, projetoId, atividadeId, semanaId, horas, criadoPorId: u.id } });
        }
        await auditar(tx, {
          entidade: "Apontamento",
          entidadeId: atual?.id ?? `${recursoId}|${atividadeId ?? projetoId}|${semanaId}`,
          projetoId,
          acao: atual ? (horas === 0 ? "EXCLUIR" : "ALTERAR") : "CRIAR",
          usuarioId: u.id,
          resumo: `Horas ${rotuloSemana(semana)}: ${antes}h → ${horas}h`,
        });
        await sincronizarRealizadas(tx, projetoId, recursoId, semanaId);
        // "Falta" automático = previsto − realizado: o restante é redistribuído nas semanas.
        await recalcularProjeto(tx, projetoId);
      },
      { timeout: 30_000 },
    );
    revalidar(projetoId);
  });
  return r?.erro ? { ok: false, erro: r.erro } : { ok: true };
}

/** O executor atualiza quanto falta (sua atribuição) e o % da atividade. */
export async function atualizarAndamento(atividadeId: string, recursoId: string, campo: "falta" | "percentual", valor: string): Promise<Resultado> {
  const r = await executarAcao(async () => {
    const u = await usuarioAtual();
    await podeLancar(u, recursoId);
    await db.$transaction(
      async (tx) => {
        const at = await tx.atividadeAtribuicao.findUnique({ where: { atividadeId_recursoId: { atividadeId, recursoId } }, include: { atividade: true } });
        if (!at) throw new ErroNegocio("Recurso não está atribuído a esta atividade.");
        const projetoId = at.atividade.projetoId;
        if (campo === "falta") {
          const falta = valor.trim() === "" ? null : z.coerce.number().min(0).max(5000).parse(valor);
          await tx.atividadeAtribuicao.update({ where: { id: at.id }, data: { horasParaConcluir: falta } });
          await auditar(tx, { entidade: "Atividade", entidadeId: atividadeId, projetoId, acao: "ALTERAR", usuarioId: u.id, antes: { horasParaConcluir: at.horasParaConcluir?.toNumber() ?? null }, depois: { horasParaConcluir: falta } });
        } else {
          const pct = z.coerce.number().min(0, "0 a 100").max(100, "0 a 100").parse(valor);
          const c = coerenciaStatus(at.atividade.status, pct);
          const depois = await tx.atividade.update({ where: { id: atividadeId }, data: { percentualConclusao: c.percentual, status: c.status, atualizadoPorId: u.id } });
          await auditar(tx, { entidade: "Atividade", entidadeId: atividadeId, projetoId, acao: "ALTERAR", usuarioId: u.id, resumo: depois.codigo, antes: at.atividade, depois });
        }
        await recalcularProjeto(tx, projetoId);
        revalidar(projetoId);
      },
      { timeout: 30_000 },
    );
  });
  return r?.erro ? { ok: false, erro: r.erro } : { ok: true };
}
