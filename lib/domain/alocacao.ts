/** Horas previstas de uma célula projeto × recurso × semana. */
export function horasPrevistas(a: { horasCalculadas: number; horasManuais: number | null; horasAvulsas: number }): number {
  return (a.horasManuais ?? a.horasCalculadas) + a.horasAvulsas;
}

/**
 * Converte horas digitadas em planilha para número.
 * Aceita 4, "4", "4h", "4 h", "4,5h", "4.5". Vazio → null. Texto inválido → NaN.
 * (No CTRL-003 as horas estavam como texto "4h", o que zerava todas as somas.)
 */
export function lerHoras(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return v;
  const s = String(v).trim().toLowerCase().replace(/\s+/g, "").replace(/h(oras?)?$/, "").replace(",", ".");
  if (s === "" || s === "-") return null;
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : NaN;
}

export type EdicaoCelula =
  | { tipo: "excluir" }
  | { tipo: "salvar"; horasManuais: number | null };

/**
 * O usuário digita o valor FINAL de horas previstas da célula projeto × recurso × semana.
 * - horas avulsas (gestão) são preservadas; o override manual cobre o restante;
 * - se o valor coincide com o calculado do cronograma, o override é removido (volta ao automático);
 * - célula zerada sem calculado, avulsas nem realizado é excluída.
 */
export function editarCelula(
  valorFinal: number,
  atual: { horasCalculadas: number; horasAvulsas: number; horasRealizadas: number } | null,
): EdicaoCelula {
  const calc = atual?.horasCalculadas ?? 0;
  const avulsas = atual?.horasAvulsas ?? 0;
  const realizadas = atual?.horasRealizadas ?? 0;
  if (valorFinal === 0 && calc === 0 && avulsas === 0 && realizadas === 0) return { tipo: "excluir" };
  const manual = Math.max(0, valorFinal - avulsas);
  return { tipo: "salvar", horasManuais: calc > 0 && manual === calc ? null : manual };
}
