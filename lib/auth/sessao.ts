import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { pode, type Acao, type Modulo } from "./permissoes";

export type UsuarioAtual = { id: string; nome: string; email: string; perfil: import("@/lib/generated/prisma/enums").Perfil };

/** Usuário logado e ativo; redireciona para o login caso contrário. */
export async function usuarioAtual(): Promise<UsuarioAtual> {
  const sessao = await auth();
  if (!sessao?.user?.id) redirect("/login");
  // Confere no banco a cada requisição: desativar um usuário tem efeito imediato.
  const u = await db.usuario.findUnique({ where: { id: sessao.user.id } });
  if (!u?.ativo) redirect("/login?erro=inativo");
  return { id: u.id, nome: u.nome, email: u.email, perfil: u.perfil };
}

export class SemPermissao extends Error {
  constructor(mensagem = "Você não tem permissão para esta ação.") {
    super(mensagem);
  }
}

/** Para Server Actions e páginas: exige permissão no módulo. */
export async function exigir(acao: Acao, modulo: Modulo): Promise<UsuarioAtual> {
  const u = await usuarioAtual();
  if (!pode(u.perfil, acao, modulo)) throw new SemPermissao();
  return u;
}

/** Para páginas: sem permissão, volta ao início com um aviso (em vez de uma tela de erro). */
export async function exigirPagina(acao: Acao, modulo: Modulo): Promise<UsuarioAtual> {
  const u = await usuarioAtual();
  if (!pode(u.perfil, acao, modulo)) redirect("/?aviso=sem-permissao");
  return u;
}
