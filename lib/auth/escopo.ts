import { cache } from "react";
import { db } from "@/lib/db";
import { pode } from "./permissoes";
import { exigir, SemPermissao, type UsuarioAtual } from "./sessao";

// Permissão por projeto (roadmap 1.3):
// - Administrador edita todos os projetos;
// - Gestor edita os projetos em que é o GP (campo GP ou membro com papel GP);
// - Consultor atualiza status e % das atividades em que está alocado (ver podeAtualizarAtividade).

export const recursoDoUsuario = cache(async (usuarioId: string): Promise<string | null> => {
  return (await db.recurso.findUnique({ where: { usuarioId }, select: { id: true } }))?.id ?? null;
});

export const podeEditarProjeto = cache(async (u: Pick<UsuarioAtual, "id" | "perfil">, projetoId: string): Promise<boolean> => {
  if (!pode(u.perfil, "editar", "PROJETOS")) return false;
  if (u.perfil === "ADMIN") return true;
  const recurso = await recursoDoUsuario(u.id);
  if (!recurso) return false;
  const p = await db.projeto.findUnique({ where: { id: projetoId }, select: { gpId: true, membros: { where: { recursoId: recurso, papel: "GP" }, select: { id: true } } } });
  return !!p && (p.gpId === recurso || p.membros.length > 0);
});

const MSG = "Só o GP do projeto ou um administrador pode alterar este projeto.";

/** Para Server Actions: exige permissão de edição no projeto. */
export async function exigirProjeto(projetoId: string): Promise<UsuarioAtual> {
  const u = await exigir("editar", "PROJETOS");
  if (!(await podeEditarProjeto(u, projetoId))) throw new SemPermissao(MSG);
  return u;
}

/** Consultor pode atualizar status/% das atividades em que tem atribuição. */
export async function podeAtualizarAtividade(u: UsuarioAtual, atividade: { id: string; projetoId: string }): Promise<boolean> {
  if (await podeEditarProjeto(u, atividade.projetoId)) return true;
  const recurso = await recursoDoUsuario(u.id);
  return !!recurso && (await db.atividadeAtribuicao.count({ where: { atividadeId: atividade.id, recursoId: recurso } })) > 0;
}

type Entidade =
  | "backlogItem"
  | "atividade"
  | "preProjetoItem"
  | "itemOperacional"
  | "casoTeste"
  | "deployment"
  | "linhaBase"
  | "statusReport"
  | "documento"
  | "projetoMembro";

/** Projeto dono de um registro (a permissão nunca confia no projetoId vindo do navegador). */
export async function projetoDe(entidade: Entidade | "execucaoTeste" | "deploymentItem", id: string): Promise<string> {
  const sel = { select: { projetoId: true } } as const;
  switch (entidade) {
    case "execucaoTeste":
      return (await db.execucaoTeste.findUniqueOrThrow({ where: { id }, select: { caso: { select: { projetoId: true } } } })).caso.projetoId;
    case "deploymentItem":
      return (await db.deploymentItem.findUniqueOrThrow({ where: { id }, select: { deployment: { select: { projetoId: true } } } })).deployment.projetoId;
    case "backlogItem":
      return (await db.backlogItem.findUniqueOrThrow({ where: { id }, ...sel })).projetoId;
    case "atividade":
      return (await db.atividade.findUniqueOrThrow({ where: { id }, ...sel })).projetoId;
    case "preProjetoItem":
      return (await db.preProjetoItem.findUniqueOrThrow({ where: { id }, ...sel })).projetoId;
    case "itemOperacional":
      return (await db.itemOperacional.findUniqueOrThrow({ where: { id }, ...sel })).projetoId;
    case "casoTeste":
      return (await db.casoTeste.findUniqueOrThrow({ where: { id }, ...sel })).projetoId;
    case "deployment":
      return (await db.deployment.findUniqueOrThrow({ where: { id }, ...sel })).projetoId;
    case "linhaBase":
      return (await db.linhaBase.findUniqueOrThrow({ where: { id }, ...sel })).projetoId;
    case "statusReport":
      return (await db.statusReport.findUniqueOrThrow({ where: { id }, ...sel })).projetoId;
    case "documento":
      return (await db.documento.findUniqueOrThrow({ where: { id }, ...sel })).projetoId;
    case "projetoMembro":
      return (await db.projetoMembro.findUniqueOrThrow({ where: { id }, ...sel })).projetoId;
  }
}

/** Exige edição no projeto do registro. */
export async function exigirRegistro(entidade: Parameters<typeof projetoDe>[0], id: string): Promise<UsuarioAtual> {
  return exigirProjeto(await projetoDe(entidade, id));
}

/** Para ações (projetoId, id): o registro precisa ser do projeto informado. */
export async function exigirRegistroDoProjeto(entidade: Parameters<typeof projetoDe>[0], id: string | null, projetoId: string): Promise<UsuarioAtual> {
  if (id && (await projetoDe(entidade, id)) !== projetoId) throw new SemPermissao("Registro de outro projeto.");
  return exigirProjeto(projetoId);
}
