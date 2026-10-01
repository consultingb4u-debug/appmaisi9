"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { exigir } from "@/lib/auth/sessao";
import { executarAcao, lerFormulario, zTextoOpcional } from "@/lib/acoes";
import { auditar } from "@/lib/services/auditoria";
import type { EstadoAcao } from "@/components/formulario";

const zCliente = z.object({
  nome: z.string({ error: "Informe o nome." }).min(2, "Nome muito curto.").max(120),
  razaoSocial: zTextoOpcional,
  segmento: zTextoOpcional,
});

export async function criarCliente(_: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  let id = "";
  const r = await executarAcao(async () => {
    const u = await exigir("editar", "CLIENTES");
    const v = zCliente.parse(lerFormulario(dados));
    const c = await db.$transaction(async (tx) => {
      const c = await tx.cliente.create({ data: { ...v, criadoPorId: u.id, atualizadoPorId: u.id } });
      await auditar(tx, { entidade: "Cliente", entidadeId: c.id, acao: "CRIAR", usuarioId: u.id, resumo: c.nome, depois: c });
      return c;
    });
    id = c.id;
  });
  if (r?.erro) return r;
  redirect(`/clientes/${id}`);
}

export async function atualizarCliente(id: string, _: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "CLIENTES");
    const f = lerFormulario(dados);
    const v = zCliente.extend({ ativo: z.boolean() }).parse({ ...f, ativo: f.ativo === "on" });
    await db.$transaction(async (tx) => {
      const antes = await tx.cliente.findUniqueOrThrow({ where: { id } });
      const depois = await tx.cliente.update({
        where: { id },
        data: { ...v, razaoSocial: v.razaoSocial ?? null, segmento: v.segmento ?? null, atualizadoPorId: u.id },
      });
      await auditar(tx, { entidade: "Cliente", entidadeId: id, acao: "ALTERAR", usuarioId: u.id, resumo: depois.nome, antes, depois });
    });
    revalidatePath("/clientes");
  });
}

const zContato = z.object({
  nome: z.string({ error: "Informe o nome do contato." }).min(2).max(120),
  email: z.email("E-mail inválido.").optional(),
  telefone: zTextoOpcional,
  funcao: z.enum(["SPONSOR", "GP_CLIENTE", "KEY_USER", "TI", "OUTRO"]),
});

export async function criarContato(clienteId: string, _: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "CLIENTES");
    const v = zContato.parse(lerFormulario(dados));
    await db.$transaction(async (tx) => {
      const c = await tx.contatoCliente.create({ data: { ...v, clienteId } });
      await auditar(tx, { entidade: "ContatoCliente", entidadeId: c.id, acao: "CRIAR", usuarioId: u.id, resumo: c.nome, depois: c });
    });
    revalidatePath(`/clientes/${clienteId}`);
    return { ok: true, mensagem: "Contato adicionado." };
  });
}

export async function excluirContato(id: string): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "CLIENTES");
    const c = await db.$transaction(async (tx) => {
      const c = await tx.contatoCliente.delete({ where: { id } });
      await auditar(tx, { entidade: "ContatoCliente", entidadeId: id, acao: "EXCLUIR", usuarioId: u.id, resumo: c.nome });
      return c;
    });
    revalidatePath(`/clientes/${c.clienteId}`);
  });
}
