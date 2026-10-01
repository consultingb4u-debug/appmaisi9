import { db } from "@/lib/db";
import { feriadosNacionais } from "@/lib/domain/feriados";

/** Gera os feriados nacionais do ano (idempotente). Retorna quantos foram criados. */
export async function gerarFeriadosNacionais(ano: number): Promise<number> {
  const r = await db.feriado.createMany({
    data: feriadosNacionais(ano).map((f) => ({ data: f.data, descricao: f.descricao, abrangencia: "NACIONAL" as const })),
    skipDuplicates: true,
  });
  return r.count;
}
