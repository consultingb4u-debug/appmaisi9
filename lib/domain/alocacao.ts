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
