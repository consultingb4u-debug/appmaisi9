/** Textos e opções compartilhados pelos formulários de conversão. */

export const opcoesAssunto = [
  { valor: "consultoria-protheus", rotulo: "Consultoria Protheus" },
  { valor: "diagnostico", rotulo: "Diagnóstico do ambiente ERP" },
  { valor: "demonstracao-wms", rotulo: "Demonstração do MAIS i9 WMS" },
  { valor: "proposta", rotulo: "Proposta comercial" },
  { valor: "outros", rotulo: "Outros assuntos" },
];

/**
 * Versão da Política de Privacidade registrada junto com o consentimento de cada lead.
 * Atualize sempre que o texto da política mudar.
 */
export const versaoPolitica = "2026-10-minuta";

/** Texto do consentimento obrigatório; o trecho final vira link para a política. */
export const textoConsentimento = {
  inicio: "Concordo com o tratamento dos meus dados pela MAIS i9 para o retorno desta solicitação, conforme a",
  link: "Política de Privacidade",
};

export const textoComunicacoes = "Aceito receber conteúdos e comunicações da MAIS i9. Posso cancelar quando quiser.";
