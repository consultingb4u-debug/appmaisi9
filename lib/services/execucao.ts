import { cache } from "react";
import { db } from "@/lib/db";
import { GOVERNANCA, itemAberto, itemVencido, prontidaoGoLive, resumoTestes, severidadeItem, STATUS_OP_ABERTOS, type Nivel, type Resultado, type Severidade } from "@/lib/domain/execucao";

/** Severidade de um item operacional (P×I; sem matriz, o maior impacto informado). */
export function severidadeDe(i: { probabilidade: number | null; impacto: number | null; impactoEscopo: string; impactoPrazo: string; impactoHoras: string }): Severidade | null {
  return severidadeItem({ probabilidade: i.probabilidade, impacto: i.impacto, impactos: [i.impactoEscopo, i.impactoPrazo, i.impactoHoras] as ("NAO" | "BAIXO" | "MEDIO" | "ALTO")[] });
}

/** Casos de teste do tipo com a última execução (maior ciclo) de cada um. */
export async function casosComUltima(projetoId: string, tipo: "INTERNO" | "UAT") {
  const casos = await db.casoTeste.findMany({
    where: { projetoId, tipo },
    orderBy: [{ ordem: "asc" }, { codigo: "asc" }],
    include: {
      execucoes: { orderBy: { ciclo: "desc" }, include: { defeito: { select: { id: true, codigo: true, status: true } } } },
      backlogItem: { select: { id: true, codigo: true } },
      responsavel: { select: { id: true, nome: true } },
    },
  });
  return casos.map((c) => ({ ...c, ultima: c.execucoes[0] ?? null }));
}

/**
 * Indicadores de execução do projeto (Visão Geral, Status Report, Início):
 * complexidade, RAID, testes e prontidão do Go Live.
 */
export const resumoExecucao = cache(async (projetoId: string, hoje = new Date()) => {
  const [aval, itens, internos, uat, deployment, pre] = await Promise.all([
    db.avaliacaoComplexidade.findUnique({ where: { projetoId } }),
    db.itemOperacional.findMany({ where: { projetoId }, select: { tipo: true, status: true, prazo: true, probabilidade: true, impacto: true, impactoEscopo: true, impactoPrazo: true, impactoHoras: true } }),
    casosComUltima(projetoId, "INTERNO"),
    casosComUltima(projetoId, "UAT"),
    db.deployment.findFirst({ where: { projetoId }, orderBy: { criadoEm: "desc" }, include: { itens: true } }),
    db.preProjeto.findUnique({ where: { projetoId } }),
  ]);
  const abertos = itens.filter((i) => itemAberto(i.status));
  const sev = (i: (typeof itens)[number]) => severidadeDe(i);
  const riscosAbertos = abertos.filter((i) => i.tipo === "RISCO");
  const defeitosAbertos = abertos.filter((i) => i.tipo === "DEFEITO");
  const defeitosGraves = defeitosAbertos.filter((i) => ["ALTA", "CRITICA"].includes(sev(i) ?? "")).length;
  const testesUat = resumoTestes(uat.map((c) => (c.ultima?.resultado as Resultado) ?? null));
  const nivel = (aval?.nivelFinal as Nivel | null) ?? null;
  return {
    complexidade: nivel ? { nivel, governanca: GOVERNANCA[nivel], score: aval!.score, gatilhos: aval!.gatilhos } : null,
    preProjeto: pre?.status ?? null,
    abertos: abertos.length,
    pendenciasVencidas: abertos.filter((i) => itemVencido(i.status, i.prazo, hoje)).length,
    riscosAbertos: riscosAbertos.length,
    riscosAltos: riscosAbertos.filter((i) => ["ALTA", "CRITICA"].includes(sev(i) ?? "")).length,
    problemasAbertos: abertos.filter((i) => i.tipo === "PROBLEMA").length,
    changeRequests: itens.filter((i) => i.tipo === "CHANGE_REQUEST").length,
    crPendentes: abertos.filter((i) => i.tipo === "CHANGE_REQUEST").length,
    defeitosAbertos: defeitosAbertos.length,
    defeitosGraves,
    testesInternos: resumoTestes(internos.map((c) => (c.ultima?.resultado as Resultado) ?? null)),
    testesUat,
    deployment: deployment
      ? {
          id: deployment.id,
          nome: deployment.nome,
          decisao: deployment.decisao,
          prontidao: prontidaoGoLive({ itens: deployment.itens, defeitosGraves, uatReprovados: testesUat.reprovados, uatPendentes: testesUat.pendentes + testesUat.bloqueados }),
        }
      : null,
  };
});

export type ResumoExecucao = Awaited<ReturnType<typeof resumoExecucao>>;

export { STATUS_OP_ABERTOS };
