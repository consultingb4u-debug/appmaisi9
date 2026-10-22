/**
 * Conteúdos / Insights.
 *
 * Para publicar um artigo:
 * 1. crie `conteudo/artigos/<slug>.mdx` com o texto (Markdown);
 * 2. registre os metadados na lista `artigos` abaixo.
 * As páginas, o sitemap e os dados estruturados são gerados a partir desta lista.
 */

export const categorias = {
  "totvs-protheus": {
    nome: "TOTVS Protheus",
    descricao: "Uso, parametrização e evolução do ERP Protheus.",
    frente: "consultoria",
  },
  "gestao-de-erp": {
    nome: "Gestão de ERP",
    descricao: "Governança, prioridades e decisões sobre o ERP da empresa.",
    frente: "consultoria",
  },
  "sustentacao-e-suporte": {
    nome: "Sustentação e suporte",
    descricao: "Continuidade operacional, atendimento e indicadores.",
    frente: "consultoria",
  },
  "gestao-de-armazens": {
    nome: "Gestão de armazéns",
    descricao: "Recebimento, armazenagem, expedição e inventário.",
    frente: "wms",
  },
  wms: {
    nome: "WMS",
    descricao: "Sistemas de gestão de armazéns: conceitos, escolha e implantação.",
    frente: "wms",
  },
  "integracao-erp-wms": {
    nome: "Integração ERP e WMS",
    descricao: "Como conectar o planejamento do ERP à execução no armazém.",
    frente: "wms",
  },
  "eficiencia-operacional": {
    nome: "Eficiência operacional",
    descricao: "Processos, controles e informação para operar melhor.",
    frente: "geral",
  },
  "transformacao-digital": {
    nome: "Transformação digital",
    descricao: "Tecnologia a serviço dos processos e da gestão.",
    frente: "geral",
  },
} as const satisfies Record<string, { nome: string; descricao: string; frente: "consultoria" | "wms" | "geral" }>;

export type CategoriaId = keyof typeof categorias;

export type Artigo = {
  slug: string;
  titulo: string;
  resumo: string;
  categoria: CategoriaId;
  /** Data de publicação (AAAA-MM-DD). */
  publicadoEm: string;
  autor: string;
  minutosLeitura: number;
};

export const artigos: Artigo[] = [
  {
    slug: "sustentacao-de-erp-continuidade-operacional",
    titulo: "Sustentação de ERP: por que ela é decisiva para a continuidade da operação",
    resumo:
      "O que é sustentação de ERP, como ela se diferencia do suporte pontual e quais práticas mantêm o Protheus estável enquanto o negócio evolui.",
    categoria: "sustentacao-e-suporte",
    publicadoEm: "2026-10-22",
    autor: "Equipe MAIS i9",
    minutosLeitura: 5,
  },
  {
    slug: "integracao-erp-wms-planejamento-e-execucao",
    titulo: "Integração ERP e WMS: como conectar o planejamento à execução no armazém",
    resumo:
      "O papel de cada sistema, quais informações circulam entre eles e os cuidados para que estoques do armazém e do ERP permaneçam consistentes.",
    categoria: "integracao-erp-wms",
    publicadoEm: "2026-10-22",
    autor: "Equipe MAIS i9",
    minutosLeitura: 5,
  },
  {
    slug: "rastreabilidade-no-armazem-lotes-validade-enderecamento",
    titulo: "Rastreabilidade no armazém: lotes, validade e endereçamento na prática",
    resumo:
      "Como lotes, datas de validade e endereços formam a base da rastreabilidade — e por que controles manuais deixam de ser suficientes.",
    categoria: "gestao-de-armazens",
    publicadoEm: "2026-10-22",
    autor: "Equipe MAIS i9",
    minutosLeitura: 4,
  },
];

export function artigosOrdenados(): Artigo[] {
  return [...artigos].sort((a, b) => b.publicadoEm.localeCompare(a.publicadoEm));
}

export function buscarArtigo(slug: string): Artigo | undefined {
  return artigos.find((a) => a.slug === slug);
}

export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(ano, mes - 1, dia)),
  );
}
