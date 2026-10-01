import { db } from "@/lib/db";
import { diffDias, paraDia } from "@/lib/domain/datas";
import { faltaAtribuicao, progresso, situacaoPrazo, type StatusItem } from "@/lib/domain/cronograma";
import { itemAberto, itemVencido, type StatusOp } from "@/lib/domain/execucao";
import { STATUS_ATIVOS } from "@/lib/domain/rotulos";
import { severidadeDe } from "./execucao";

/** Dias sem status report publicado a partir dos quais o projeto aparece como "report atrasado". */
export const DIAS_STATUS_REPORT = 14;

/**
 * Saúde dos projetos ativos para o painel executivo, em poucas consultas agregadas
 * (sem carregar o cronograma completo de cada projeto).
 */
export async function saudeProjetos(hoje = new Date()) {
  const projetos = await db.projeto.findMany({
    where: { arquivadoEm: null, status: { in: STATUS_ATIVOS } },
    select: {
      id: true,
      nome: true,
      status: true,
      statusExecutivo: true,
      dataGoLiveAlvo: true,
      dataGoLiveReal: true,
      horasVendidas: true,
      cliente: { select: { nome: true } },
      gp: { select: { nome: true } },
      avaliacaoComplexidade: { select: { nivelFinal: true } },
    },
  });
  const ids = projetos.map((p) => p.id);
  const [atividades, apontado, itens, reports] = await Promise.all([
    db.atividade.findMany({
      where: { projetoId: { in: ids }, status: { not: "CANCELADO" } },
      select: { id: true, projetoId: true, status: true, percentualConclusao: true, fimPrevisto: true, atribuicoes: { select: { recursoId: true, esforcoPrevisto: true, horasParaConcluir: true } } },
    }),
    db.apontamento.groupBy({ by: ["atividadeId", "recursoId"], where: { projetoId: { in: ids }, atividadeId: { not: null } }, _sum: { horas: true } }),
    db.itemOperacional.findMany({
      where: { projetoId: { in: ids }, status: { in: ["ABERTO", "EM_ANDAMENTO", "AGUARDANDO", "BLOQUEADO"] } },
      select: { projetoId: true, tipo: true, status: true, prazo: true, probabilidade: true, impacto: true, impactoEscopo: true, impactoPrazo: true, impactoHoras: true },
    }),
    db.statusReport.groupBy({ by: ["projetoId"], where: { projetoId: { in: ids }, publicado: true }, _max: { dataReferencia: true } }),
  ]);
  const real = new Map(apontado.map((a) => [`${a.atividadeId}|${a.recursoId}`, a._sum.horas?.toNumber() ?? 0]));
  const ultimoReport = new Map(reports.map((r) => [r.projetoId, r._max.dataReferencia]));
  const dia = paraDia(hoje);

  return projetos.map((p) => {
    const ats = atividades.filter((a) => a.projetoId === p.id);
    const comHoras = ats.map((a) => {
      const atrib = a.atribuicoes.map((x) => ({ previsto: x.esforcoPrevisto.toNumber(), paraConcluir: x.horasParaConcluir?.toNumber() ?? null, realizado: real.get(`${a.id}|${x.recursoId}`) ?? 0 }));
      const previsto = atrib.reduce((t, x) => t + x.previsto, 0);
      const forecast = atrib.reduce((t, x) => t + x.realizado + faltaAtribuicao(x, a.status === "CONCLUIDO"), 0);
      return { ...a, previsto, forecast };
    });
    const abertos = itens.filter((i) => i.projetoId === p.id && itemAberto(i.status as StatusOp));
    const graves = (tipo: string) => abertos.filter((i) => i.tipo === tipo && ["ALTA", "CRITICA"].includes(severidadeDe(i) ?? "")).length;
    const ultimo = ultimoReport.get(p.id) ?? null;
    const vendidas = p.horasVendidas?.toNumber() ?? null;
    const forecast = comHoras.reduce((t, a) => t + a.forecast, 0);
    return {
      id: p.id,
      nome: p.nome,
      cliente: p.cliente.nome,
      gp: p.gp?.nome ?? null,
      status: p.status,
      statusExecutivo: p.statusExecutivo,
      complexidade: p.avaliacaoComplexidade?.nivelFinal ?? null,
      goLive: p.dataGoLiveReal ?? p.dataGoLiveAlvo,
      temCronograma: ats.length > 0,
      progresso: progresso(comHoras.map((a) => ({ previsto: a.previsto, percentual: a.percentualConclusao, status: a.status as StatusItem }))),
      atrasadas: ats.filter((a) => situacaoPrazo(a.status as StatusItem, a.fimPrevisto, hoje) === "ATRASADO").length,
      pendenciasVencidas: abertos.filter((i) => itemVencido(i.status as StatusOp, i.prazo, hoje)).length,
      riscosAltos: graves("RISCO"),
      defeitosGraves: graves("DEFEITO"),
      estouro: vendidas !== null && ats.length > 0 && forecast > vendidas ? Math.round(forecast - vendidas) : 0,
      ultimoReport: ultimo,
      reportAtrasado: !ultimo || diffDias(dia, ultimo) > DIAS_STATUS_REPORT,
    };
  });
}

export type SaudeProjeto = Awaited<ReturnType<typeof saudeProjetos>>[number];

/** Peso para ordenar o painel: o que mais precisa de atenção primeiro. */
export function gravidade(s: SaudeProjeto): number {
  return (
    (s.statusExecutivo === "VERMELHO" ? 100 : s.statusExecutivo === "AMARELO" ? 30 : 0) +
    s.atrasadas * 5 +
    s.pendenciasVencidas * 4 +
    s.riscosAltos * 10 +
    s.defeitosGraves * 10 +
    (s.estouro > 0 ? 20 : 0) +
    (s.status === "BLOQUEADO" ? 50 : 0)
  );
}
