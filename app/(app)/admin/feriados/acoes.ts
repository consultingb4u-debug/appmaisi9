"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { exigir } from "@/lib/auth/sessao";
import { ErroNegocio, executarAcao, lerFormulario } from "@/lib/acoes";
import { auditar } from "@/lib/services/auditoria";
import { gerarFeriadosNacionais } from "@/lib/services/feriados";
import { parseDia } from "@/lib/domain/datas";
import type { EstadoAcao } from "@/components/formulario";

export async function criarFeriado(_: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "FERIADOS");
    const f = lerFormulario(dados);
    const data = parseDia(f.data);
    if (!data) throw new ErroNegocio("Informe uma data válida.");
    const v = z
      .object({
        descricao: z.string({ error: "Informe a descrição." }).min(2).max(120),
        abrangencia: z.enum(["NACIONAL", "ESTADUAL", "MUNICIPAL"]),
        uf: z.string().length(2, "UF com 2 letras.").optional(),
        municipio: z.string().max(80).optional(),
      })
      .parse(f);
    await db.$transaction(async (tx) => {
      const novo = await tx.feriado.create({ data: { ...v, uf: v.uf?.toUpperCase(), data } });
      await auditar(tx, { entidade: "Feriado", entidadeId: novo.id, acao: "CRIAR", usuarioId: u.id, resumo: `${f.data} ${novo.descricao}`, depois: novo });
    });
    revalidatePath("/admin/feriados");
    return { ok: true, mensagem: "Feriado incluído." };
  });
}

export async function excluirFeriado(id: string): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "FERIADOS");
    await db.$transaction(async (tx) => {
      const f = await tx.feriado.delete({ where: { id } });
      await auditar(tx, { entidade: "Feriado", entidadeId: id, acao: "EXCLUIR", usuarioId: u.id, resumo: `${f.data.toISOString().slice(0, 10)} ${f.descricao}` });
    });
    revalidatePath("/admin/feriados");
  });
}

export async function gerarNacionais(ano: number): Promise<EstadoAcao> {
  return executarAcao(async () => {
    await exigir("editar", "FERIADOS");
    const n = await gerarFeriadosNacionais(ano);
    revalidatePath("/admin/feriados");
    return { ok: true, mensagem: `${n} feriado(s) incluído(s).` };
  });
}
