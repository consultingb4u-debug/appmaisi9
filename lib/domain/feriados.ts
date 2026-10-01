import { dia, somarDias } from "./datas";

export type FeriadoGerado = { data: Date; descricao: string };

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher). */
export function pascoa(ano: number): Date {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const diaDoMes = ((h + l - 7 * m + 114) % 31) + 1;
  return dia(ano, mes, diaDoMes);
}

/**
 * Feriados nacionais e pontos facultativos usuais (Carnaval, Corpus Christi).
 * Os pontos facultativos podem ser removidos em Administração › Feriados.
 */
export function feriadosNacionais(ano: number): FeriadoGerado[] {
  const p = pascoa(ano);
  return [
    { data: dia(ano, 1, 1), descricao: "Confraternização Universal" },
    { data: somarDias(p, -48), descricao: "Carnaval (ponto facultativo)" },
    { data: somarDias(p, -47), descricao: "Carnaval (ponto facultativo)" },
    { data: somarDias(p, -2), descricao: "Sexta-feira Santa" },
    { data: dia(ano, 4, 21), descricao: "Tiradentes" },
    { data: dia(ano, 5, 1), descricao: "Dia do Trabalho" },
    { data: somarDias(p, 60), descricao: "Corpus Christi (ponto facultativo)" },
    { data: dia(ano, 9, 7), descricao: "Independência do Brasil" },
    { data: dia(ano, 10, 12), descricao: "Nossa Senhora Aparecida" },
    { data: dia(ano, 11, 2), descricao: "Finados" },
    { data: dia(ano, 11, 15), descricao: "Proclamação da República" },
    { data: dia(ano, 11, 20), descricao: "Dia Nacional de Zumbi e da Consciência Negra" },
    { data: dia(ano, 12, 25), descricao: "Natal" },
  ];
}
