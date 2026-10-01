import { db } from "@/lib/db";
import { ausenciasPorDia, capacidadeDaSemana, capacidadeVigente, faixaUtilizacao, type CapacidadeSemana, type FaixaUtilizacao } from "@/lib/domain/capacidade";
import { chaveDia } from "@/lib/domain/datas";
import type { SemanaIso } from "@/lib/domain/semanas";
import { previstas } from "./alocacoes";

/**
 * Capacidade bruta e líquida por recurso e semana:
 * capacidade vigente − feriados do calendário − indisponibilidades aprovadas.
 */
export async function capacidadePorSemana(recursoIds: string[], semanas: SemanaIso[]) {
  const resultado = new Map<string, Map<string, CapacidadeSemana>>();
  if (semanas.length === 0) return resultado;
  const de = semanas[0].inicio;
  const ate = semanas.at(-1)!.fim;
  const [vigencias, feriados, indisp] = await Promise.all([
    db.recursoCapacidade.findMany({ where: { recursoId: { in: recursoIds } } }),
    db.feriado.findMany({ where: { data: { gte: de, lte: ate } } }),
    db.indisponibilidade.findMany({ where: { recursoId: { in: recursoIds }, status: "APROVADA", inicio: { lte: ate }, fim: { gte: de } } }),
  ]);
  const diasFeriado = new Set(feriados.map((f) => chaveDia(f.data)));
  for (const recursoId of recursoIds) {
    const vs = vigencias
      .filter((v) => v.recursoId === recursoId)
      .map((v) => ({ vigenciaInicio: v.vigenciaInicio, vigenciaFim: v.vigenciaFim, horasSemanais: v.horasSemanais.toNumber() }));
    const ausencias = ausenciasPorDia(indisp.filter((i) => i.recursoId === recursoId).map((i) => ({ inicio: i.inicio, fim: i.fim, horasPorDia: i.horasPorDia?.toNumber() ?? null })));
    const porSemana = new Map<string, CapacidadeSemana>();
    for (const s of semanas) porSemana.set(s.id, capacidadeDaSemana(s.inicio, capacidadeVigente(vs, s.inicio), diasFeriado, ausencias));
    resultado.set(recursoId, porSemana);
  }
  return resultado;
}

export type ProjetoNaSemana = { projetoId: string; projeto: string; cliente: string; horas: number; observacao: string | null };

export type CargaSemana = {
  capacidade: CapacidadeSemana;
  planejado: number;
  utilizacao: number | null; // null quando capacidade líquida = 0 e nada planejado
  faixa: FaixaUtilizacao | null;
  projetos: ProjetoNaSemana[];
};

/** Capacidade × horas planejadas por recurso e semana, com a lista de projetos que consomem cada semana. */
export async function cargaPorSemana(recursoIds: string[], semanas: SemanaIso[]) {
  const [caps, alocacoes] = await Promise.all([
    capacidadePorSemana(recursoIds, semanas),
    db.alocacaoSemanal.findMany({
      where: { recursoId: { in: recursoIds }, semanaId: { in: semanas.map((s) => s.id) }, status: { not: "CANCELADO" } },
      include: { projeto: { select: { id: true, nome: true, cliente: { select: { nome: true } } } } },
    }),
  ]);
  const resultado = new Map<string, Map<string, CargaSemana>>();
  for (const recursoId of recursoIds) {
    const porSemana = new Map<string, CargaSemana>();
    for (const s of semanas) {
      const projetos = alocacoes
        .filter((a) => a.recursoId === recursoId && a.semanaId === s.id)
        .map((a) => ({ projetoId: a.projeto.id, projeto: a.projeto.nome, cliente: a.projeto.cliente.nome, horas: previstas(a), observacao: a.observacao }))
        .filter((p) => p.horas > 0)
        .sort((a, b) => b.horas - a.horas);
      const capacidade = caps.get(recursoId)!.get(s.id)!;
      const planejado = projetos.reduce((t, p) => t + p.horas, 0);
      const utilizacao = capacidade.liquida > 0 ? planejado / capacidade.liquida : planejado > 0 ? Infinity : null;
      porSemana.set(s.id, { capacidade, planejado, utilizacao, faixa: utilizacao === null ? null : faixaUtilizacao(utilizacao), projetos });
    }
    resultado.set(recursoId, porSemana);
  }
  return resultado;
}

export const ROTULO_FAIXA: Record<FaixaUtilizacao, string> = {
  DISPONIVEL: "Disponível",
  ADEQUADO: "Adequado",
  ATENCAO: "Atenção",
  SOBRECARREGADO: "Sobrecarregado",
};

export const COR_FAIXA: Record<FaixaUtilizacao, string> = {
  DISPONIVEL: "bg-livre/10 text-livre",
  ADEQUADO: "bg-ok/10 text-ok",
  ATENCAO: "bg-alerta/20 text-[#8a6a00]",
  SOBRECARREGADO: "bg-critico/15 text-critico",
};

export function formatarUtilizacao(u: number | null): string {
  if (u === null) return "—";
  if (!Number.isFinite(u)) return "sem cap."; // horas planejadas numa semana sem capacidade (férias, feriados)
  return `${Math.round(u * 100)}%`;
}
