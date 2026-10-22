/**
 * Cases, logotipos e depoimentos de clientes.
 *
 * Só publique informações com autorização formal do cliente. Enquanto as listas
 * estiverem vazias (ou o case não estiver `publicado`), o site mostra espaços
 * reservados identificados como "em preparação".
 */

export type TipoCase = "implantacao" | "evolucao" | "sustentacao" | "wms";

export const tiposCase: Record<TipoCase, { rotulo: string; frente: string; descricao: string }> = {
  implantacao: {
    rotulo: "Implantação",
    frente: "Consultoria Protheus",
    descricao: "Implantação de módulos do Protheus: escopo, abordagem e o que mudou nos processos do cliente.",
  },
  evolucao: {
    rotulo: "Projeto de evolução",
    frente: "Consultoria Protheus",
    descricao: "Melhorias de processos, integrações e customizações que evoluíram o ambiente.",
  },
  sustentacao: {
    rotulo: "Sustentação",
    frente: "Consultoria Protheus",
    descricao: "Como a sustentação contínua trouxe estabilidade e previsibilidade à operação.",
  },
  wms: {
    rotulo: "MAIS i9 WMS",
    frente: "MAIS i9 WMS",
    descricao: "Utilização do MAIS i9 WMS na operação logística: processos, integração e resultados observados.",
  },
};

export type Case = {
  id: string;
  tipo: TipoCase;
  /** Só `true` com autorização do cliente para divulgação. */
  publicado: boolean;
  cliente: string;
  segmento: string;
  titulo: string;
  desafio: string;
  solucao: string;
  /** Resultados informados e autorizados pelo cliente (sem estimativas). */
  resultados: string[];
};

export const cases: Case[] = [];

export type Depoimento = { texto: string; autor: string; cargo: string; empresa: string };

export const depoimentos: Depoimento[] = [];

export type LogoCliente = { nome: string; src: string; largura: number; altura: number };

export const logosClientes: LogoCliente[] = [];
