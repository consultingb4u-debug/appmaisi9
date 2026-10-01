import { diferencas } from "@/lib/domain/auditoria";
import type { AcaoAuditoria } from "@/lib/generated/prisma/enums";
import type { Prisma } from "@/lib/generated/prisma/client";

type Tx = Prisma.TransactionClient;

type Registro = {
  entidade: string;
  entidadeId: string;
  acao: AcaoAuditoria;
  usuarioId: string | null;
  projetoId?: string | null;
  resumo?: string;
  antes?: Record<string, unknown> | null;
  depois?: Record<string, unknown> | null;
};

/**
 * Registra uma linha de auditoria na mesma transação da alteração.
 * Em ALTERAR sem diferenças reais, nada é gravado.
 */
export async function auditar(tx: Tx, r: Registro) {
  const alteracoes = r.depois ? diferencas(r.antes ?? null, r.depois) : null;
  if (r.acao === "ALTERAR" && alteracoes && Object.keys(alteracoes).length === 0) return;
  await tx.auditoria.create({
    data: {
      entidade: r.entidade,
      entidadeId: r.entidadeId,
      acao: r.acao,
      usuarioId: r.usuarioId,
      projetoId: r.projetoId ?? null,
      resumo: r.resumo,
      alteracoes: (alteracoes ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}
