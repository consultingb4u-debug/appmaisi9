// Modelos de cronograma (regras puras): converter datas em posições relativas (dias úteis) e de volta.
import { chaveDia, ehFimDeSemana, paraDia, somarDias } from "./datas";
import { diasUteisEntre } from "./cronograma";
import { somarDiasUteis } from "./linha-base";

export type AtividadeParaModelo = { codigo: string; inicio: Date | null; fim: Date | null };
export type Posicao = { inicioDia: number | null; duracaoDias: number | null };

/** Primeiro dia útil a partir da data (ela mesma, se for útil). */
export function primeiroDiaUtil(d: Date, feriados: Set<string> = new Set()): Date {
  let x = paraDia(d);
  while (ehFimDeSemana(x) || feriados.has(chaveDia(x))) x = somarDias(x, 1);
  return x;
}

/**
 * Posição de cada atividade em dias úteis contados do início do cronograma (a atividade mais cedo).
 * Duração = dias úteis entre início e fim (mínimo 1). Sem datas, a posição fica vazia.
 */
export function posicoesDoCronograma(atividades: AtividadeParaModelo[], feriados: Set<string> = new Set()): Map<string, Posicao> {
  const inicios = atividades.map((a) => a.inicio).filter((d): d is Date => !!d);
  const out = new Map<string, Posicao>();
  if (inicios.length === 0) {
    for (const a of atividades) out.set(a.codigo, { inicioDia: null, duracaoDias: null });
    return out;
  }
  const zero = primeiroDiaUtil(new Date(Math.min(...inicios.map((d) => d.getTime()))), feriados);
  for (const a of atividades) {
    if (!a.inicio || !a.fim) {
      out.set(a.codigo, { inicioDia: null, duracaoDias: null });
      continue;
    }
    const ini = primeiroDiaUtil(a.inicio, feriados);
    const antes = ini > zero ? diasUteisEntre(zero, somarDias(ini, -1), feriados).length : 0;
    out.set(a.codigo, { inicioDia: antes, duracaoDias: Math.max(1, diasUteisEntre(a.inicio, a.fim, feriados).length) });
  }
  return out;
}

/** Datas reais a partir da posição relativa e da data de início do projeto. */
export function datasDaPosicao(p: Posicao, inicioProjeto: Date, feriados: Set<string> = new Set()): { inicio: Date | null; fim: Date | null } {
  if (p.inicioDia === null || p.duracaoDias === null) return { inicio: null, fim: null };
  const zero = primeiroDiaUtil(inicioProjeto, feriados);
  const inicio = somarDiasUteis(zero, p.inicioDia, feriados);
  return { inicio, fim: somarDiasUteis(inicio, p.duracaoDias - 1, feriados) };
}
