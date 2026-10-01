import { cache } from "react";
import { db } from "@/lib/db";
import { ausenciasPorDia } from "@/lib/domain/capacidade";
import { chaveDia } from "@/lib/domain/datas";
import { diasUteisEntre, faltaAtribuicao, progresso, qualidadeCronograma, ratearHoras, situacaoPrazo, totaisAtividade, type StatusItem } from "@/lib/domain/cronograma";
import { semanaDe } from "@/lib/domain/semanas";
import type { Prisma } from "@/lib/generated/prisma/client";
import { garantirSemana } from "./semanas";

type Tx = Prisma.TransactionClient;

/** Horas apontadas por atividade + recurso. */
async function realizadoPorAtribuicao(tx: Tx | typeof db, atividadeIds: string[]) {
  const grupos = await tx.apontamento.groupBy({ by: ["atividadeId", "recursoId"], where: { atividadeId: { in: atividadeIds } }, _sum: { horas: true } });
  return new Map(grupos.map((g) => [`${g.atividadeId}|${g.recursoId}`, g._sum.horas?.toNumber() ?? 0]));
}

/**
 * Recalcula a distribuição semanal do cronograma do projeto e grava em alocacao_semanal.horas_calculadas
 * (da semana atual em diante). Overrides manuais e horas avulsas são preservados.
 */
export async function recalcularProjeto(tx: Tx, projetoId: string, hoje = new Date()) {
  const janela = semanaDe(hoje);
  const atividades = await tx.atividade.findMany({
    where: { projetoId, status: { not: "CANCELADO" } },
    include: { atribuicoes: true },
  });
  const realizado = await realizadoPorAtribuicao(tx, atividades.map((a) => a.id));
  const recursoIds = [...new Set(atividades.flatMap((a) => a.atribuicoes.map((x) => x.recursoId)))];

  const [feriados, ausencias, capacidades] = await Promise.all([
    tx.feriado.findMany({ where: { data: { gte: janela.inicio } } }),
    tx.indisponibilidade.findMany({ where: { recursoId: { in: recursoIds }, status: "APROVADA", fim: { gte: janela.inicio } } }),
    tx.recursoCapacidade.findMany({ where: { recursoId: { in: recursoIds }, vigenciaFim: null } }),
  ]);
  const diasFeriado = feriados.map((f) => chaveDia(f.data));
  // Dia indisponível para o rateio = feriado ou ausência aprovada de dia inteiro.
  const indisponiveis = new Map<string, Set<string>>();
  for (const r of recursoIds) {
    const horasDia = (capacidades.find((c) => c.recursoId === r)?.horasSemanais.toNumber() ?? 40) / 5;
    const aus = ausenciasPorDia(ausencias.filter((a) => a.recursoId === r).map((a) => ({ inicio: a.inicio, fim: a.fim, horasPorDia: a.horasPorDia?.toNumber() ?? null })));
    indisponiveis.set(r, new Set([...diasFeriado, ...[...aus.entries()].filter(([, h]) => h >= horasDia).map(([d]) => d)]));
  }

  const atribuicaoIds = atividades.flatMap((a) => a.atribuicoes.map((x) => x.id));
  await tx.atribuicaoSemana.deleteMany({ where: { atribuicaoId: { in: atribuicaoIds }, semana: { inicio: { gte: janela.inicio } } } });

  const novos: { atribuicaoId: string; semanaId: string; horasCalculadas: number }[] = [];
  const porCelula = new Map<string, number>(); // recursoId|semanaId
  for (const a of atividades) {
    if (!a.inicioPrevisto || !a.fimPrevisto) continue;
    for (const at of a.atribuicoes) {
      const falta = faltaAtribuicao(
        { previsto: at.esforcoPrevisto.toNumber(), paraConcluir: at.horasParaConcluir?.toNumber() ?? null, realizado: realizado.get(`${a.id}|${at.recursoId}`) ?? 0 },
        a.status === "CONCLUIDO",
      );
      const rateio = ratearHoras({ inicio: a.inicioPrevisto, fim: a.fimPrevisto, horas: falta, inicioJanela: janela.inicio, indisponiveis: indisponiveis.get(at.recursoId) });
      for (const [semanaId, horas] of Object.entries(rateio)) {
        novos.push({ atribuicaoId: at.id, semanaId, horasCalculadas: horas });
        porCelula.set(`${at.recursoId}|${semanaId}`, (porCelula.get(`${at.recursoId}|${semanaId}`) ?? 0) + horas);
      }
    }
  }
  for (const semanaId of new Set(novos.map((n) => n.semanaId))) await garantirSemana(tx, semanaId);
  if (novos.length) await tx.atribuicaoSemana.createMany({ data: novos });

  // Atualiza a alocação: zera o calculado que deixou de existir, grava o novo e limpa células vazias.
  const existentes = await tx.alocacaoSemanal.findMany({ where: { projetoId, semana: { inicio: { gte: janela.inicio } } } });
  for (const e of existentes) {
    const k = `${e.recursoId}|${e.semanaId}`;
    const calc = Math.round((porCelula.get(k) ?? 0) * 10) / 10;
    porCelula.delete(k);
    if (calc === e.horasCalculadas.toNumber()) continue;
    const vazia = calc === 0 && e.horasManuais === null && e.horasAvulsas.toNumber() === 0 && e.horasRealizadas.toNumber() === 0;
    if (vazia) await tx.alocacaoSemanal.delete({ where: { id: e.id } });
    else await tx.alocacaoSemanal.update({ where: { id: e.id }, data: { horasCalculadas: calc } });
  }
  for (const [k, horas] of porCelula) {
    const [recursoId, semanaId] = k.split("|");
    await tx.alocacaoSemanal.create({ data: { projetoId, recursoId, semanaId, horasCalculadas: Math.round(horas * 10) / 10 } });
  }
}

/** Recalcula todos os projetos em que o recurso tem atribuição (ex.: após aprovar férias). */
export async function recalcularProjetosDoRecurso(tx: Tx, recursoId: string) {
  const projetos = await tx.atividade.findMany({ where: { atribuicoes: { some: { recursoId } } }, distinct: ["projetoId"], select: { projetoId: true } });
  for (const p of projetos) await recalcularProjeto(tx, p.projetoId);
}

/** Mantém alocacao_semanal.horas_realizadas = soma dos apontamentos da célula. */
export async function sincronizarRealizadas(tx: Tx, projetoId: string, recursoId: string, semanaId: string) {
  const soma = (await tx.apontamento.aggregate({ where: { projetoId, recursoId, semanaId }, _sum: { horas: true } }))._sum.horas?.toNumber() ?? 0;
  const chave = { projetoId_recursoId_semanaId: { projetoId, recursoId, semanaId } };
  const atual = await tx.alocacaoSemanal.findUnique({ where: chave });
  if (atual) {
    const vazia = soma === 0 && atual.horasCalculadas.toNumber() === 0 && atual.horasManuais === null && atual.horasAvulsas.toNumber() === 0;
    if (vazia) await tx.alocacaoSemanal.delete({ where: chave });
    else await tx.alocacaoSemanal.update({ where: chave, data: { horasRealizadas: soma } });
  } else if (soma > 0) {
    await tx.alocacaoSemanal.create({ data: { projetoId, recursoId, semanaId, horasRealizadas: soma } });
  }
}

/** Cronograma completo do projeto com os valores calculados (como nas colunas do CTRL-001). */
export async function carregarCronograma(projetoId: string, hoje = new Date()) {
  const atividades = await db.atividade.findMany({
    where: { projetoId },
    orderBy: [{ ordem: "asc" }, { codigo: "asc" }],
    include: {
      atribuicoes: { include: { recurso: { select: { id: true, nome: true } } }, orderBy: { recurso: { nome: "asc" } } },
      backlogItem: { select: { id: true, codigo: true, requisito: true } },
      responsavel: { select: { id: true, nome: true } },
      contatoCliente: { select: { id: true, nome: true } },
      predecessoras: { include: { predecessora: { select: { id: true, codigo: true } } } },
    },
  });
  const realizado = await realizadoPorAtribuicao(db, atividades.map((a) => a.id));
  const feriados = new Set((await db.feriado.findMany({ select: { data: true } })).map((f) => chaveDia(f.data)));
  const linhas = atividades.map((a) => {
    const atrib = a.atribuicoes.map((x) => ({
      id: x.id,
      recursoId: x.recursoId,
      recurso: x.recurso.nome,
      previsto: x.esforcoPrevisto.toNumber(),
      paraConcluir: x.horasParaConcluir?.toNumber() ?? null,
      realizado: realizado.get(`${a.id}|${x.recursoId}`) ?? 0,
    }));
    const totais = totaisAtividade(atrib, a.status === "CONCLUIDO");
    // Duração útil: dias úteis entre início e fim, descontando feriados (o CTRL-001 usava NETWORKDAYS sem feriados).
    const duracao = a.inicioPrevisto && a.fimPrevisto ? diasUteisEntre(a.inicioPrevisto, a.fimPrevisto, feriados).length : null;
    return {
      ...a,
      atrib,
      totais,
      duracao,
      situacao: situacaoPrazo(a.status as StatusItem, a.fimPrevisto, hoje),
    };
  });
  const progressoGeral = progresso(linhas.map((l) => ({ previsto: l.totais.previsto, percentual: l.percentualConclusao, status: l.status as StatusItem })));
  const alertas = qualidadeCronograma(
    linhas.map((l) => ({
      id: l.id,
      codigo: l.codigo,
      tarefa: l.tarefa,
      status: l.status as StatusItem,
      inicio: l.inicioPrevisto,
      fim: l.fimPrevisto,
      clienteParticipa: l.clienteParticipa,
      responsavelId: l.responsavelId,
      observacao: l.observacao,
      atribuicoes: l.atrib.map((x) => ({ recursoId: x.recursoId, previsto: x.previsto, realizado: x.realizado })),
    })),
  );
  // Período inteiro em feriado/fim de semana: a regra pura não conhece o calendário, então é verificada aqui.
  for (const l of linhas) {
    if (l.status !== "CANCELADO" && l.duracao === 0) alertas.push({ atividadeId: l.id, codigo: l.codigo, mensagem: "Período só tem feriado/fim de semana (0 dia útil)." });
  }
  return { atividades: linhas, progresso: progressoGeral, alertas };
}

export type CronogramaCarregado = Awaited<ReturnType<typeof carregarCronograma>>;
export type AtividadeCarregada = CronogramaCarregado["atividades"][number];

/** Versão cacheada por requisição (layout e páginas do projeto compartilham o resultado). */
export const cronogramaDoProjeto = cache((projetoId: string) => carregarCronograma(projetoId));
