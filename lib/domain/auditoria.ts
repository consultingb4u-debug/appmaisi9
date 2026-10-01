export type Alteracoes = Record<string, [unknown, unknown]>;

function normalizar(v: unknown): unknown {
  if (v instanceof Date) return v.toISOString();
  if (v !== null && typeof v === "object" && "toNumber" in v && typeof (v as { toNumber: unknown }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber(); // Prisma.Decimal
  }
  return v ?? null;
}

const IGNORAR = new Set(["criadoEm", "atualizadoEm", "criadoPorId", "atualizadoPorId"]);

/** Diferença campo a campo entre dois registros (apenas campos escalares presentes em `depois`). */
export function diferencas(antes: Record<string, unknown> | null, depois: Record<string, unknown>): Alteracoes {
  const out: Alteracoes = {};
  for (const campo of Object.keys(depois)) {
    if (IGNORAR.has(campo)) continue;
    const a = normalizar(antes?.[campo]);
    const d = normalizar(depois[campo]);
    if (typeof d === "object" && d !== null) continue;
    if (a !== d) out[campo] = [a, d];
  }
  return out;
}
