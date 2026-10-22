/**
 * Dados institucionais da MAIS i9.
 *
 * `null` (ou lista vazia) = informação ainda não fornecida. O site mostra um marcador
 * "[A preencher: …]" no lugar (componente <Pendente>) e omite o dado de metadados e
 * dados estruturados. Nunca preencher com dados fictícios: só informações oficiais.
 */

export type ArquivoLogo = {
  /** Caminho do arquivo em `public/` (ex.: "/marca/logo-maisi9.svg"). */
  src: string;
  /** Dimensões originais do arquivo, em pixels — usadas só para preservar a proporção. */
  largura: number;
  altura: number;
};

export type Empresa = {
  nome: string;
  descricao: string;
  /**
   * Logotipo oficial, usado exatamente como fornecido (sem redesenho, recorte ou troca de cor).
   * `positivo`: versão para fundo claro (cabeçalho). `negativo`: versão para fundo escuro (rodapé).
   * Sem a versão negativa, o rodapé exibe a positiva sobre uma placa branca.
   */
  logo: { positivo: ArquivoLogo | null; negativo: ArquivoLogo | null };
  razaoSocial: string | null;
  cnpj: string | null;
  anoFundacao: number | null;
  /** Cidade/UF da sede. */
  sede: string | null;
  endereco: string | null;
  emailComercial: string | null;
  telefoneComercial: string | null;
  /** E-mail de abertura de chamados (clientes de suporte e sustentação). */
  emailChamados: string | null;
  /** Endereço informado nos materiais do MAIS i9 WMS. */
  siteWms: string | null;
  /** Número oficial de WhatsApp, só dígitos com DDI (ex.: "5511999999999"). Sem ele, o botão não aparece. */
  whatsapp: string | null;
  horarioAtendimento: string | null;
  linkedin: string | null;
  /** Encarregado pelo tratamento de dados pessoais (LGPD, art. 41). */
  encarregadoDados: { nome: string | null; email: string | null };
  /** Ex.: "Mais de 40 profissionais". Só com número oficial. */
  tamanhoEquipe: string | null;
  /** Tempo de experiência, como informado nos materiais oficiais. */
  experiencia: string | null;
  /** Volume de projetos entregues, como informado nos materiais oficiais. */
  horasProjetos: string | null;
  /** Áreas de especialidade da equipe no Protheus. */
  especialidadesEquipe: string[];
  /** Tipos de projeto que compõem as horas entregues. */
  tiposProjeto: string[];
  missao: string | null;
  /** Resumo da experiência da equipe (áreas, segmentos, tempo de atuação). */
  experienciaEquipe: string | null;
  segmentosAtendidos: string[];
  certificacoes: string[];
};

export const empresa: Empresa = {
  nome: "MAIS i9",
  descricao:
    "Empresa brasileira de tecnologia com mais de 20 anos de experiência em TOTVS Protheus — suporte, sustentação, governança, projetos e integrações — e criadora do MAIS i9 WMS, solução própria de gestão de armazéns no modelo SaaS.",
  logo: {
    positivo: { src: "/marca/logo-maisi9.png", largura: 1527, altura: 493 },
    negativo: null,
  },
  razaoSocial: null,
  cnpj: null,
  anoFundacao: null,
  sede: null,
  endereco: null,
  emailComercial: "contato@maisi9.com.br",
  telefoneComercial: "(47) 3440-2120",
  emailChamados: "chamados@maisi9.com.br",
  siteWms: "https://suite.maisi9.com.br",
  whatsapp: null,
  horarioAtendimento: null,
  linkedin: null,
  encarregadoDados: { nome: null, email: null },
  tamanhoEquipe: null,
  experiencia: "Mais de 20 anos",
  horasProjetos: "Mais de 10.000 horas",
  especialidadesEquipe: [
    "Backoffice e Reforma Tributária",
    "GPE e Medicina",
    "Qualidade",
    "Manufatura",
    "TAF",
    "Projetos (PMS)",
    "Infraestrutura Protheus",
  ],
  tiposProjeto: ["Implantação", "Customização", "Integração", "Internacionalização"],
  missao:
    "Mais do que tecnologia, entregamos confiança: nossa missão é garantir estabilidade, performance e inovação para que cada cliente MAIS i9 possa trilhar seu caminho de crescimento com resultados concretos.",
  experienciaEquipe:
    "Especialistas funcionais e técnicos em TOTVS Protheus, com fábrica de software (ADVPL/TLPP, APIs e integrações), administração de bancos de dados Oracle e SQL Server e experiência em operações logísticas — base do desenvolvimento do MAIS i9 WMS.",
  segmentosAtendidos: [],
  certificacoes: [],
};

/** Credenciais da apresentação comercial ("Experiência que suporta nossa atuação"). */
export const credenciais: { destaque: string; complemento: string }[] = [
  { destaque: "+20 anos", complemento: "de experiência" },
  { destaque: "+10.000 horas", complemento: "de projetos entregues" },
  { destaque: "Especialistas", complemento: "funcionais e técnicos" },
  { destaque: "Fábrica", complemento: "de software" },
  { destaque: "Soluções", complemento: "proprietárias" },
];

export const avisoMarcas =
  "TOTVS e Protheus são marcas registradas de seus respectivos titulares. A MAIS i9 é responsável pelas soluções e serviços apresentados neste site.";

export function linkWhatsapp(mensagem?: string): string | null {
  if (!empresa.whatsapp) return null;
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : "";
  return `https://wa.me/${empresa.whatsapp}${texto}`;
}
