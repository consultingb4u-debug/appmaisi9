import type { Perfil } from "@/lib/generated/prisma/enums";

export type Modulo =
  | "PORTFOLIO"
  | "PROJETOS"
  | "RECURSOS"
  | "CAPACIDADE"
  | "CLIENTES"
  | "FERIADOS"
  | "USUARIOS"
  | "AUDITORIA";

export type Acao = "ver" | "editar";

// MVP: permissão por módulo. O escopo por projeto (GP edita só os seus,
// consultor atualiza só suas atividades) entra na versão 1.3 usando a mesma função.
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
