// Calendário mensal (regras puras): grade de semanas e distribuição dos eventos nos dias.
import { chaveDia, diaDaSemanaIso, dia, somarDias } from "./datas";

export type TipoEvento = "INICIO" | "FIM" | "MARCO" | "GO_LIVE" | "PRAZO" | "FERIADO" | "AUSENCIA" | "DEPLOY";
export type Evento = { tipo: TipoEvento; data: Date; ate?: Date | null; titulo: string; detalhe?: string; href?: string; atrasado?: boolean };

/** Ordem de exibição no dia: feriado e Go Live primeiro, depois marcos e prazos. */
const ORDEM: TipoEvento[] = ["FERIADO", "GO_LIVE", "DEPLOY", "MARCO", "FIM", "PRAZO", "INICIO", "AUSENCIA"];

/** "2026-10" → { ano, mes }; inválido ou ausente → mês de `hoje`. */
export function lerMes(texto: string | undefined, hoje = new Date()): { ano: number; mes: number } {
  const m = texto && /^(\d{4})-(\d{2})$/.exec(texto);
  if (m && Number(m[2]) >= 1 && Number(m[2]) <= 12) return { ano: Number(m[1]), mes: Number(m[2]) };
  return { ano: hoje.getUTCFullYear(), mes: hoje.getUTCMonth() + 1 };
}

export function idMes(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}`;
}

export function mesVizinho(ano: number, mes: number, delta: number): string {
  const d = new Date(Date.UTC(ano, mes - 1 + delta, 1));
  return idMes(d.getUTCFullYear(), d.getUTCMonth() + 1);
}

/** Semanas (segunda a domingo) que cobrem o mês; cada dia diz se pertence ao mês. */
export function gradeDoMes(ano: number, mes: number): { data: Date; doMes: boolean }[][] {
  const primeiro = dia(ano, mes, 1);
  const ultimo = somarDias(dia(mes === 12 ? ano + 1 : ano, mes === 12 ? 1 : mes + 1, 1), -1);
  let d = somarDias(primeiro, 1 - diaDaSemanaIso(primeiro));
  const semanas: { data: Date; doMes: boolean }[][] = [];
  while (d <= ultimo) {
    semanas.push(Array.from({ length: 7 }, (_, i) => {
      const x = somarDias(d, i);
      return { data: x, doMes: x.getUTCMonth() === mes - 1 };
    }));
    d = somarDias(d, 7);
  }
  return semanas;
}

/**
 * Agrupa os eventos por dia ("AAAA-MM-DD"). Eventos com período (ausência, janela de deploy)
 * aparecem em cada dia útil do intervalo; os demais só na data.
 */
export function eventosPorDia(eventos: Evento[], de: Date, ate: Date): Map<string, Evento[]> {
  const out = new Map<string, Evento[]>();
  const add = (d: Date, e: Evento) => {
    if (d < de || d > ate) return;
    const k = chaveDia(d);
    out.set(k, [...(out.get(k) ?? []), e]);
  };
  for (const e of eventos) {
    if (e.ate && e.ate > e.data) {
      for (let d = e.data; d <= e.ate; d = somarDias(d, 1)) if (diaDaSemanaIso(d) < 6) add(d, e);
    } else add(e.data, e);
  }
  for (const lista of out.values()) lista.sort((a, b) => ORDEM.indexOf(a.tipo) - ORDEM.indexOf(b.tipo) || a.titulo.localeCompare(b.titulo));
  return out;
}
