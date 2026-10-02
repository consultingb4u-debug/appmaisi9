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

/** "2026-W40" → semana ISO; null se o identificador for inválido. */
export function semanaPorId(id: string): SemanaIso | null {
  const m = /^(\d{4})-W(\d{2})$/.exec(id);
  if (!m) return null;
  const ano = Number(m[1]);
  const numero = Number(m[2]);
  const s = semanaDe(somarDias(inicioDaSemana(dia(ano, 1, 4)), (numero - 1) * 7));
  return s.anoIso === ano && s.numero === numero ? s : null;
}

/** Lê ?de=2026-W40&n=8 e devolve as semanas da janela (padrão: semana atual, 8 semanas). */
export function janelaDeSemanas(de?: string, n?: string): SemanaIso[] {
  const inicio = (de && semanaPorId(de)) || semanaDe(new Date());
  const qtd = [4, 8, 12, 16].includes(Number(n)) ? Number(n) : 8;
  return semanasEntre(inicio.inicio, somarDias(inicio.inicio, 7 * qtd - 1));
}
