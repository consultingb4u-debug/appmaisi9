import { cache } from "react";
import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { previstas, realizadas } from "./alocacoes";

/** Projeto com dados do cabeçalho (cacheado por requisição: layout e páginas reutilizam). */
export const carregarProjeto = cache(async (id: string) => {
  const p = await db.projeto.findUnique({
    where: { id },
    include: {
      cliente: { select: { id: true, nome: true } },
      gp: { select: { id: true, nome: true } },
      alocacoes: { include: { semana: true, recurso: { select: { id: true, nome: true } } } },
    },
  });
  if (!p) return null;
  return {
    ...p,
    horasPlanejadas: p.alocacoes.reduce((t, a) => t + previstas(a), 0),
    horasRealizadas: p.alocacoes.reduce((t, a) => t + realizadas(a), 0),
  };
});

/** Próximo código sequencial PRJ-0001, PRJ-0002… (chamar dentro da transação que cria o projeto). */
export async function proximoCodigoProjeto(tx: Prisma.TransactionClient): Promise<string> {
  const ultimo = await tx.projeto.findFirst({ where: { codigo: { startsWith: "PRJ-" } }, orderBy: { codigo: "desc" }, select: { codigo: true } });
  const n = ultimo ? Number(ultimo.codigo.slice(4)) + 1 : 1;
  return `PRJ-${String(n).padStart(4, "0")}`;
}
