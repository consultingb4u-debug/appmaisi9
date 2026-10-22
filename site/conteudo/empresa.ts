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
  /** Número oficial de WhatsApp, só dígitos com DDI (ex.: "5511999999999"). Sem ele, o botão não aparece. */
  whatsapp: string | null;
  horarioAtendimento: string | null;
  linkedin: string | null;
  /** Encarregado pelo tratamento de dados pessoais (LGPD, art. 41). */
  encarregadoDados: { nome: string | null; email: string | null };
  /** Ex.: "Mais de 40 profissionais". Só com número oficial. */
  tamanhoEquipe: string | null;
  /** Resumo da experiência da equipe (áreas, segmentos, tempo de atuação). */
  experienciaEquipe: string | null;
  segmentosAtendidos: string[];
  certificacoes: string[];
};

export const empresa: Empresa = {
  nome: "MAIS i9",
  descricao:
    "Empresa brasileira de tecnologia com consultoria especializada em TOTVS Protheus e o MAIS i9 WMS, solução própria de gestão de armazéns no modelo SaaS.",
  logo: { positivo: null, negativo: null },
  razaoSocial: null,
  cnpj: null,
  anoFundacao: null,
  sede: null,
  endereco: null,
  emailComercial: null,
  telefoneComercial: null,
  whatsapp: null,
  horarioAtendimento: null,
  linkedin: null,
  encarregadoDados: { nome: null, email: null },
  tamanhoEquipe: null,
  experienciaEquipe: null,
  segmentosAtendidos: [],
  certificacoes: [],
};

export const avisoMarcas =
  "TOTVS e Protheus são marcas registradas de seus respectivos titulares. A MAIS i9 é responsável pelas soluções e serviços apresentados neste site.";

export function linkWhatsapp(mensagem?: string): string | null {
  if (!empresa.whatsapp) return null;
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : "";
  return `https://wa.me/${empresa.whatsapp}${texto}`;
}
