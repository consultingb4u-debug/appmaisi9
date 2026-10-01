// Datas "puras" (sem fuso): sempre trabalhamos com meia-noite UTC para
// representar um dia do calendário, igual ao tipo DATE do PostgreSQL.

const DIA_MS = 86_400_000;

export function dia(ano: number, mes: number, diaDoMes: number): Date {
  return new Date(Date.UTC(ano, mes - 1, diaDoMes));
}

export function paraDia(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Converte "AAAA-MM-DD" em data; retorna null se inválida. */
export function parseDia(texto: string | null | undefined): Date | null {
  if (!texto) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto.trim());
  if (!m) return null;
  const d = dia(Number(m[1]), Number(m[2]), Number(m[3]));
  return isNaN(d.getTime()) || d.getUTCDate() !== Number(m[3]) ? null : d;
}

export function somarDias(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DIA_MS);
}

export function diffDias(a: Date, b: Date): number {
  return Math.round((paraDia(a).getTime() - paraDia(b).getTime()) / DIA_MS);
}

/** 1 = segunda … 7 = domingo (ISO). */
export function diaDaSemanaIso(d: Date): number {
  const w = d.getUTCDay();
  return w === 0 ? 7 : w;
}

export function ehFimDeSemana(d: Date): boolean {
  return diaDaSemanaIso(d) >= 6;
}

export function chaveDia(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function formatarData(d: Date | null | undefined): string {
  if (!d) return "—";
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
}
