"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { exigir } from "@/lib/auth/sessao";
import { ErroNegocio, executarAcao, lerFormulario } from "@/lib/acoes";
import { auditar } from "@/lib/services/auditoria";
import type { EstadoAcao } from "@/components/formulario";

const zPerfil = z.enum(["ADMIN", "GESTOR", "CONSULTOR", "VISUALIZADOR"]);

export async function criarUsuario(_: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "USUARIOS");
    const f = lerFormulario(dados);
    const v = z
      .object({ nome: z.string({ error: "Informe o nome." }).min(2), email: z.email("E-mail inválido."), perfil: zPerfil, recursoId: z.uuid().optional() })
      .parse(f);
    await db.$transaction(async (tx) => {
      const novo = await tx.usuario.create({ data: { nome: v.nome, email: v.email.toLowerCase(), perfil: v.perfil } });
      if (v.recursoId) await tx.recurso.update({ where: { id: v.recursoId }, data: { usuarioId: novo.id } });
      await auditar(tx, { entidade: "Usuario", entidadeId: novo.id, acao: "CRIAR", usuarioId: u.id, resumo: `${novo.email} (${novo.perfil})`, depois: novo });
    });
    revalidatePath("/admin/usuarios");
    return { ok: true, mensagem: "Usuário cadastrado. Ele já pode entrar com a conta Microsoft 365." };
  });
}

export async function atualizarUsuario(id: string, _: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "USUARIOS");
    const f = lerFormulario(dados);
    const v = z.object({ perfil: zPerfil, ativo: z.boolean(), recursoId: z.uuid().optional() }).parse({ ...f, ativo: f.ativo === "on" });
    if (id === u.id && (v.perfil !== "ADMIN" || !v.ativo)) throw new ErroNegocio("Você não pode remover seu próprio acesso de administrador.");

    await db.$transaction(async (tx) => {
      const antes = await tx.usuario.findUniqueOrThrow({ where: { id }, include: { recurso: true } });
      const depois = await tx.usuario.update({ where: { id }, data: { perfil: v.perfil, ativo: v.ativo } });
      const recursoAntes = antes.recurso?.id ?? null;
      if (recursoAntes !== (v.recursoId ?? null)) {
        if (recursoAntes) await tx.recurso.update({ where: { id: recursoAntes }, data: { usuarioId: null } });
        if (v.recursoId) await tx.recurso.update({ where: { id: v.recursoId }, data: { usuarioId: id } });
      }
      const antesSemRecurso: Record<string, unknown> = { ...antes };
      delete antesSemRecurso.recurso;
      await auditar(tx, {
        entidade: "Usuario",
        entidadeId: id,
        acao: "ALTERAR",
        usuarioId: u.id,
        resumo: depois.email,
        antes: { ...antesSemRecurso, recursoId: recursoAntes },
        depois: { ...depois, recursoId: v.recursoId ?? null },
      });
    });
    revalidatePath("/admin/usuarios");
  });
}
