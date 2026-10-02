import type { Perfil } from "@/lib/generated/prisma/enums";

export type Modulo =
  | "PORTFOLIO"
  | "PROJETOS"
  | "RECURSOS"
  | "CAPACIDADE"
  | "CLIENTES"
  | "FERIADOS"
  | "USUARIOS"
  | "AUDITORIA"
  | "IMPORTACAO";

export type Acao = "ver" | "editar";

// Permissão por módulo. Dentro de Projetos há ainda o escopo por projeto (lib/auth/escopo.ts):
// Gestor edita só os projetos em que é GP; consultor atualiza status/% das atividades em que está alocado.
const MATRIZ: Record<Perfil, Partial<Record<Modulo, Acao[]>>> = {
  ADMIN: {
    PORTFOLIO: ["ver", "editar"],
    PROJETOS: ["ver", "editar"],
    RECURSOS: ["ver", "editar"],
    CAPACIDADE: ["ver", "editar"],
    CLIENTES: ["ver", "editar"],
    FERIADOS: ["ver", "editar"],
    USUARIOS: ["ver", "editar"],
    AUDITORIA: ["ver"],
    IMPORTACAO: ["ver", "editar"],
  },
  GESTOR: {
    PORTFOLIO: ["ver", "editar"],
    PROJETOS: ["ver", "editar"],
    RECURSOS: ["ver", "editar"],
    CAPACIDADE: ["ver", "editar"],
    CLIENTES: ["ver", "editar"],
    FERIADOS: ["ver", "editar"],
    USUARIOS: ["ver"],
    AUDITORIA: ["ver"],
    IMPORTACAO: ["ver", "editar"],
  },
  CONSULTOR: {
    PORTFOLIO: ["ver"],
    PROJETOS: ["ver"],
    RECURSOS: ["ver"],
    CAPACIDADE: ["ver"],
    CLIENTES: ["ver"],
    FERIADOS: ["ver"],
  },
  VISUALIZADOR: {
    PORTFOLIO: ["ver"],
    PROJETOS: ["ver"],
    RECURSOS: ["ver"],
    CAPACIDADE: ["ver"],
    CLIENTES: ["ver"],
    FERIADOS: ["ver"],
  },
};

export function pode(perfil: Perfil, acao: Acao, modulo: Modulo): boolean {
  return MATRIZ[perfil][modulo]?.includes(acao) ?? false;
}

export const NOME_PERFIL: Record<Perfil, string> = {
  ADMIN: "Administrador",
  GESTOR: "Gestor de Projetos",
  CONSULTOR: "Consultor / Recurso",
  VISUALIZADOR: "Visualização",
};
