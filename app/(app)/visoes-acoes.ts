"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth/sessao";
import { ErroNegocio, executarAcao, lerFormulario } from "@/lib/acoes";
import type { EstadoAcao } from "@/components/formulario";

const TELAS = { portfolio: "/portfolio", capacidade: "/capacidade", calendario: "/calendario" } as const;
const zVisao = z.object({ nome: z.string({ error: "Dê um nome à visão." }).min(2).max(60), compartilhada: z.string().optional() });

/** Salva os filtros atuais (query string) com um nome; mesmo nome substitui a visão anterior. */
export async function salvarVisao(tela: keyof typeof TELAS, parametros: string, _: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await usuarioAtual();
    if (!(tela in TELAS)) throw new ErroNegocio("Tela inválida.");
    const v = zVisao.parse(lerFormulario(dados));
    // Só filtros: navegação de janela e seleção de célula não fazem parte da visão.
    const limpos = new URLSearchParams([...new URLSearchParams(parametros)].filter(([k, x]) => x && !["r", "s", "editar", "mes"].includes(k))).toString();
    if (!limpos) throw new ErroNegocio("Aplique algum filtro antes de salvar a visão.");
    const compartilhada = v.compartilhada === "on" && (u.perfil === "ADMIN" || u.perfil === "GESTOR");
    await db.visaoSalva.upsert({
      where: { usuarioId_tela_nome: { usuarioId: u.id, tela, nome: v.nome } },
      create: { usuarioId: u.id, tela, nome: v.nome, parametros: limpos, compartilhada },
      update: { parametros: limpos, compartilhada },
    });
    revalidatePath(TELAS[tela], "layout");
    return { ok: true, mensagem: `Visão "${v.nome}" salva.` };
  });
}

export async function excluirVisao(id: string): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await usuarioAtual();
    const v = await db.visaoSalva.findUniqueOrThrow({ where: { id } });
    if (v.usuarioId !== u.id && u.perfil !== "ADMIN") throw new ErroNegocio("Só quem criou a visão pode excluí-la.");
    await db.visaoSalva.delete({ where: { id } });
    revalidatePath(TELAS[v.tela as keyof typeof TELAS] ?? "/", "layout");
  });
}
