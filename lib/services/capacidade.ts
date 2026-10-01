import { db } from "@/lib/db";
import { capacidadeDaSemana, capacidadeVigente, type CapacidadeSemana } from "@/lib/domain/capacidade";
import { chaveDia } from "@/lib/domain/datas";
import type { SemanaIso } from "@/lib/domain/semanas";

/**
 * Capacidade bruta e líquida por recurso e semana.
 * Hoje: capacidade vigente − feriados do calendário da empresa.
 * Incremento 3: também desconta indisponibilidades aprovadas.
 */
export async function capacidadePorSemana(recursoIds: string[], semanas: SemanaIso[]) {
  if (semanas.length === 0) return new Map<string, Map<string, CapacidadeSemana>>();
  const [vigencias, feriados] = await Promise.all([
    db.recursoCapacidade.findMany({ where: { recursoId: { in: recursoIds } } }),
    db.feriado.findMany({ where: { data: { gte: semanas[0].inicio, lte: semanas.at(-1)!.fim } } }),
  ]);
  const diasFeriado = new Set(feriados.map((f) => chaveDia(f.data)));
  const resultado = new Map<string, Map<string, CapacidadeSemana>>();
  for (const recursoId of recursoIds) {
    const vs = vigencias
      .filter((v) => v.recursoId === recursoId)
      .map((v) => ({ vigenciaInicio: v.vigenciaInicio, vigenciaFim: v.vigenciaFim, horasSemanais: v.horasSemanais.toNumber() }));
    const porSemana = new Map<string, CapacidadeSemana>();
    for (const s of semanas) {
      porSemana.set(s.id, capacidadeDaSemana(s.inicio, capacidadeVigente(vs, s.inicio), diasFeriado));
    }
    resultado.set(recursoId, porSemana);
  }
  return resultado;
}
