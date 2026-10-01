import { semanaPorId } from "@/lib/domain/semanas";
import type { Prisma } from "@/lib/generated/prisma/client";

/** Garante que a semana exista na tabela (o seed cobre 2025–2028; isto cobre o resto). */
export async function garantirSemana(tx: Prisma.TransactionClient, id: string) {
  const s = semanaPorId(id);
  if (!s) throw new Error(`Semana inválida: ${id}`);
  await tx.semana.upsert({ where: { id }, update: {}, create: { id, anoIso: s.anoIso, numero: s.numero, inicio: s.inicio, fim: s.fim } });
  return s;
}
