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
  /** `null` quando o case é apresentado sem identificar o cliente. */
  cliente: string | null;
  segmento: string | null;
  titulo: string;
  desafio: string;
  solucao: string;
  /** Resultados informados e autorizados pelo cliente (sem estimativas e sem valores monetários). */
  resultados: string[];
};

// Cases da apresentação comercial (seção "Sucesso comprovado"), sem identificação do cliente.
export const cases: Case[] = [
  {
    id: "sustentacao-evolucao-protheus",
    tipo: "sustentacao",
    publicado: true,
    cliente: null,
    segmento: null,
    titulo: "Sustentação e evolução do ambiente Protheus",
    desafio:
      "Sustentar e evoluir o ambiente Protheus, atendendo usuários, atualizações, migrações e novos projetos com estabilidade operacional.",
    solucao:
      "Suporte N1 a N3, planejamento de atualizações e migrações, projetos GFE e integração entre Protheus, CRM e WMS.",
    resultados: ["SLA abaixo de 2 horas", "+5% de acuracidade", "−10% no custo de frete"],
  },
  {
    id: "integracao-protheus-wms",
    tipo: "wms",
    publicado: true,
    cliente: null,
    segmento: null,
    titulo: "Integração do Protheus com o MAIS i9 WMS",
    desafio: "Integrar o Protheus à solução MAIS i9 WMS, conectando operações, clientes e financeiro.",
    solucao: "Desenvolvimento e implantação de integrador via APIs customizadas, aderente aos processos do cliente.",
    resultados: ["99,36% de acuracidade"],
  },
];

export type Depoimento = { texto: string; autor: string; cargo: string; empresa: string };

export const depoimentos: Depoimento[] = [];

export type LogoCliente = { nome: string; src: string; largura: number; altura: number };

/** Logotipos oficiais dos clientes (arquivos em `public/clientes/`), exibidos sem alteração. */
export const logosClientes: LogoCliente[] = [];

/**
 * Clientes citados na apresentação comercial. Enquanto os logotipos oficiais não forem
 * fornecidos, aparecem pelo nome. Confirmar a autorização de cada um para o site.
 */
export const clientes: string[] = [
  "Allflex",
  "Bühler",
  "Dipil",
  "Erzeg",
  "Grupo Alltech",
  "Hitachi High-Tech",
  "IMAM",
  "Unimed",
  "Vitória Troféus e Medalhas",
];
