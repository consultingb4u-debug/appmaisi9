// Rótulos de exibição dos enums (uma fonte para telas, filtros e importação).
import type {
  PapelProjeto,
  Prioridade,
  StatusAlocacao,
  StatusExecutivo,
  StatusIndisponibilidade,
  StatusProjeto,
  TipoIndisponibilidade,
  TipoProjeto,
} from "@/lib/generated/prisma/enums";

export const STATUS_PROJETO: Record<StatusProjeto, string> = {
  PROJETO_IDENTIFICADO: "Projeto identificado",
  APROVACAO_CLIENTE: "Aprovação cliente",
  NAO_APROVADO: "Não aprovado",
  EM_ANDAMENTO: "Em andamento",
  BLOQUEADO: "Bloqueado",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

/** Status que contam como "projeto ativo" no portfólio. */
export const STATUS_ATIVOS: StatusProjeto[] = ["EM_ANDAMENTO", "BLOQUEADO", "APROVACAO_CLIENTE"];

export const TIPO_PROJETO: Record<TipoProjeto, string> = {
  PROJETO: "Projeto",
  SUPORTE: "Suporte",
  SUSTENTACAO: "Sustentação",
  ALOCACAO: "Alocação",
  INTERNO: "Interno",
};

export const PRIORIDADE: Record<Prioridade, string> = { BAIXA: "Baixa", MEDIA: "Média", ALTA: "Alta", CRITICA: "Crítica" };

export const STATUS_EXECUTIVO: Record<StatusExecutivo, string> = { VERDE: "Verde", AMARELO: "Amarelo", VERMELHO: "Vermelho" };

export const PAPEL_PROJETO: Record<PapelProjeto, string> = {
  GP: "GP",
  FUNCIONAL: "Funcional",
  TECNICO: "Técnico",
  DEV: "Desenvolvedor",
  ANALISTA: "Analista",
  APOIO: "Apoio",
};

export const STATUS_ALOCACAO: Record<StatusAlocacao, string> = {
  PLANEJADO: "Planejado",
  EM_ANDAMENTO: "Em andamento",
  BLOQUEADO: "Bloqueado",
  AGUARDANDO_CLIENTE: "Aguardando cliente",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

export const TIPO_INDISPONIBILIDADE: Record<TipoIndisponibilidade, string> = {
  FERIAS: "Férias",
  FERIADO_LOCAL: "Feriado local",
  AUSENCIA: "Ausência",
  TREINAMENTO: "Treinamento",
  BLOQUEIO: "Bloqueio",
  OUTROS: "Outros",
};

export const STATUS_INDISPONIBILIDADE: Record<StatusIndisponibilidade, string> = { PENDENTE: "Pendente", APROVADA: "Aprovada", RECUSADA: "Recusada" };

export type Tom = "neutro" | "ok" | "alerta" | "critico" | "livre" | "destaque" | "navy";

export const TOM_STATUS_PROJETO: Record<StatusProjeto, Tom> = {
  PROJETO_IDENTIFICADO: "neutro",
  APROVACAO_CLIENTE: "livre",
  NAO_APROVADO: "neutro",
  EM_ANDAMENTO: "ok",
  BLOQUEADO: "critico",
  CONCLUIDO: "navy",
  CANCELADO: "neutro",
};

export const TOM_PRIORIDADE: Record<Prioridade, Tom> = { BAIXA: "neutro", MEDIA: "livre", ALTA: "alerta", CRITICA: "critico" };

/** Busca o valor do enum pelo rótulo, ignorando acentos e caixa ("Em Andamento" → EM_ANDAMENTO). */
export function enumPorRotulo<T extends string>(mapa: Record<T, string>, texto: string | null | undefined): T | null {
  if (!texto) return null;
  const alvo = normalizarTexto(texto);
  for (const [chave, rotulo] of Object.entries(mapa) as [T, string][]) {
    if (normalizarTexto(rotulo) === alvo || normalizarTexto(chave) === alvo) return chave;
  }
  return null;
}

/** Minúsculas, sem acentos, espaços simples — para comparar nomes vindos de planilhas. */
export function normalizarTexto(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[_\s]+/g, " ")
    .trim()
    .toLowerCase();
}

export const FASE: Record<"ENVISIONING" | "DEVELOPMENT" | "DEPLOYMENT" | "POST_DEPLOY", string> = {
  ENVISIONING: "Envisioning",
  DEVELOPMENT: "Development",
  DEPLOYMENT: "Deployment",
  POST_DEPLOY: "Post Deploy",
};
export const FASES = Object.keys(FASE) as (keyof typeof FASE)[];

export const STATUS_ITEM: Record<"NAO_INICIADO" | "EM_ANDAMENTO" | "BLOQUEADO" | "CONCLUIDO" | "CANCELADO", string> = {
  NAO_INICIADO: "Não iniciado",
  EM_ANDAMENTO: "Em andamento",
  BLOQUEADO: "Bloqueado",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};
export const TOM_STATUS_ITEM: Record<keyof typeof STATUS_ITEM, Tom> = {
  NAO_INICIADO: "neutro",
  EM_ANDAMENTO: "livre",
  BLOQUEADO: "critico",
  CONCLUIDO: "ok",
  CANCELADO: "neutro",
};

export const SITUACAO_PRAZO: Record<"CONCLUIDO" | "ATRASADO" | "ATENCAO" | "NO_PRAZO", [string, Tom]> = {
  CONCLUIDO: ["Concluído", "ok"],
  ATRASADO: ["Atrasado", "critico"],
  ATENCAO: ["Atenção", "alerta"],
  NO_PRAZO: ["No prazo", "livre"],
};

export const TIPO_BACKLOG: Record<"ENTREGA" | "REQUISITO" | "MELHORIA" | "INTEGRACAO" | "RELATORIO" | "CUSTOMIZACAO", string> = {
  ENTREGA: "Entrega",
  REQUISITO: "Requisito",
  MELHORIA: "Melhoria",
  INTEGRACAO: "Integração",
  RELATORIO: "Relatório",
  CUSTOMIZACAO: "Customização",
};
export const ADERENCIA: Record<"ADERENTE" | "PARCIAL" | "GAP" | "A_VALIDAR", string> = { ADERENTE: "Aderente", PARCIAL: "Parcial", GAP: "Gap", A_VALIDAR: "A validar" };
export const SIM_NAO: Record<"SIM" | "NAO" | "A_CONFIRMAR", string> = { SIM: "Sim", NAO: "Não", A_CONFIRMAR: "A confirmar" };
export const VALIDACAO: Record<"PENDENTE" | "APROVADO" | "REPROVADO" | "NA", string> = { PENDENTE: "Pendente", APROVADO: "Aprovado", REPROVADO: "Reprovado", NA: "N/A" };
export const TOM_VALIDACAO: Record<keyof typeof VALIDACAO, Tom> = { PENDENTE: "alerta", APROVADO: "ok", REPROVADO: "critico", NA: "neutro" };

// ───────────────────────────── Incremento 5 ─────────────────────────────

export const DIMENSAO: Record<"ESFORCO" | "PRAZO" | "COMPLEXIDADE" | "RISCO", string> = { ESFORCO: "Esforço", PRAZO: "Prazo", COMPLEXIDADE: "Complexidade", RISCO: "Risco" };
export const TOM_NIVEL: Record<"N1" | "N2" | "N3" | "N4", Tom> = { N1: "ok", N2: "livre", N3: "alerta", N4: "critico" };

export const STATUS_PRE_PROJETO: Record<"EM_PREPARACAO" | "PRONTO" | "PRONTO_COM_RESSALVAS" | "BLOQUEADO", string> = {
  EM_PREPARACAO: "Em preparação",
  PRONTO: "Pronto",
  PRONTO_COM_RESSALVAS: "Pronto com ressalvas",
  BLOQUEADO: "Bloqueado",
};
export const TOM_PRE_PROJETO: Record<keyof typeof STATUS_PRE_PROJETO, Tom> = { EM_PREPARACAO: "livre", PRONTO: "ok", PRONTO_COM_RESSALVAS: "alerta", BLOQUEADO: "critico" };

export const STATUS_CHECKLIST: Record<"PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDO" | "BLOQUEADO" | "NA", string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  BLOQUEADO: "Bloqueado",
  NA: "N/A",
};
export const TOM_CHECKLIST: Record<keyof typeof STATUS_CHECKLIST, Tom> = { PENDENTE: "alerta", EM_ANDAMENTO: "livre", CONCLUIDO: "ok", BLOQUEADO: "critico", NA: "neutro" };

export const TIPO_OPERACIONAL: Record<"PENDENCIA" | "DECISAO" | "DEPENDENCIA" | "PROBLEMA" | "RISCO" | "CHANGE_REQUEST" | "DEFEITO", string> = {
  PENDENCIA: "Pendência",
  DECISAO: "Decisão",
  DEPENDENCIA: "Dependência",
  PROBLEMA: "Problema",
  RISCO: "Risco",
  CHANGE_REQUEST: "Change Request",
  DEFEITO: "Defeito",
};

export const STATUS_OPERACIONAL: Record<"ABERTO" | "EM_ANDAMENTO" | "AGUARDANDO" | "BLOQUEADO" | "APROVADO" | "REPROVADO" | "FECHADO" | "CANCELADO", string> = {
  ABERTO: "Aberto",
  EM_ANDAMENTO: "Em andamento",
  AGUARDANDO: "Aguardando",
  BLOQUEADO: "Bloqueado",
  APROVADO: "Aprovado",
  REPROVADO: "Reprovado",
  FECHADO: "Fechado",
  CANCELADO: "Cancelado",
};
export const TOM_OPERACIONAL: Record<keyof typeof STATUS_OPERACIONAL, Tom> = {
  ABERTO: "alerta",
  EM_ANDAMENTO: "livre",
  AGUARDANDO: "alerta",
  BLOQUEADO: "critico",
  APROVADO: "ok",
  REPROVADO: "critico",
  FECHADO: "neutro",
  CANCELADO: "neutro",
};

export const NIVEL_IMPACTO: Record<"NAO" | "BAIXO" | "MEDIO" | "ALTO", string> = { NAO: "Não", BAIXO: "Baixo", MEDIO: "Médio", ALTO: "Alto" };

export const SEVERIDADE: Record<"BAIXA" | "MEDIA" | "ALTA" | "CRITICA", string> = { BAIXA: "Baixa", MEDIA: "Média", ALTA: "Alta", CRITICA: "Crítica" };
export const TOM_SEVERIDADE: Record<keyof typeof SEVERIDADE, Tom> = { BAIXA: "ok", MEDIA: "alerta", ALTA: "destaque", CRITICA: "critico" };

export const RESULTADO_TESTE: Record<"PLANEJADO" | "NAO_EXECUTADO" | "APROVADO" | "REPROVADO" | "BLOQUEADO" | "NA", string> = {
  PLANEJADO: "Planejado",
  NAO_EXECUTADO: "Não executado",
  APROVADO: "Aprovado",
  REPROVADO: "Reprovado",
  BLOQUEADO: "Bloqueado",
  NA: "N/A",
};
export const TOM_RESULTADO: Record<keyof typeof RESULTADO_TESTE, Tom> = { PLANEJADO: "neutro", NAO_EXECUTADO: "alerta", APROVADO: "ok", REPROVADO: "critico", BLOQUEADO: "critico", NA: "neutro" };

export const DECISAO_GO: Record<"PENDENTE" | "GO" | "NO_GO" | "GO_COM_RESSALVAS", string> = { PENDENTE: "Pendente", GO: "Go", NO_GO: "No-Go", GO_COM_RESSALVAS: "Go com ressalvas" };
export const TOM_DECISAO_GO: Record<keyof typeof DECISAO_GO, Tom> = { PENDENTE: "alerta", GO: "ok", NO_GO: "critico", GO_COM_RESSALVAS: "destaque" };

export const OBRIGATORIEDADE: Record<"SIM" | "NAO" | "CONDICIONAL", string> = { SIM: "Sim", NAO: "Não", CONDICIONAL: "Condicional" };
