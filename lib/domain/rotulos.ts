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
