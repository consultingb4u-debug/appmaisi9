import { diaDaSemanaIso, dia, paraDia, somarDias } from "./datas";

export type SemanaIso = {
  id: string; // "2026-W40"
  anoIso: number;
  numero: number;
  inicio: Date; // segunda-feira
  fim: Date; // domingo
};

export function inicioDaSemana(d: Date): Date {
  const base = paraDia(d);
  return somarDias(base, 1 - diaDaSemanaIso(base));
}

/** Semana ISO 8601 que contém a data (a semana pertence ao ano da sua quinta-feira). */
export function semanaDe(d: Date): SemanaIso {
  const inicio = inicioDaSemana(d);
  const quinta = somarDias(inicio, 3);
  const anoIso = quinta.getUTCFullYear();
  const primeiraQuinta = (() => {
    const jan4 = dia(anoIso, 1, 4);
    return somarDias(inicioDaSemana(jan4), 3);
  })();
  const numero = Math.round((quinta.getTime() - primeiraQuinta.getTime()) / (7 * 86_400_000)) + 1;
  return {
    id: `${anoIso}-W${String(numero).padStart(2, "0")}`,
    anoIso,
    numero,
    inicio,
    fim: somarDias(inicio, 6),
  };
}

/** Todas as semanas que tocam o intervalo [de, ate]. */
export function semanasEntre(de: Date, ate: Date): SemanaIso[] {
  const out: SemanaIso[] = [];
  for (let s = inicioDaSemana(de); s.getTime() <= paraDia(ate).getTime(); s = somarDias(s, 7)) {
    out.push(semanaDe(s));
  }
  return out;
}

/** Rótulo curto usado nas telas, compatível com as planilhas: "S40/26". */
export function rotuloSemana(s: Pick<SemanaIso, "anoIso" | "numero">): string {
  return `S${String(s.numero).padStart(2, "0")}/${String(s.anoIso).slice(-2)}`;
}
