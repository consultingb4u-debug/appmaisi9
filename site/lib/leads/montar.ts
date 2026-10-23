import { versaoPolitica } from "@/conteudo/formularios";
import { camposPorTipo, rotuloTipoLead, type DadosLead, type TipoLead } from "./esquemas";

/** Formato enviado ao CRM/webhook e usado no e-mail. Mudanças incompatíveis exigem nova `versao`. */
export type Lead = {
  versao: 1;
  id: string;
  tipo: TipoLead;
  tipoRotulo: string;
  recebidoEm: string;
  contato: {
    nome: string;
    empresa: string;
    email: string;
    telefone: string | null;
    /** E-mail de provedor gratuito (não corporativo), útil para qualificação. */
    emailGratuito: boolean;
  };
  campos: { chave: string; rotulo: string; valor: string; texto: string }[];
  mensagem: string | null;
  consentimento: { tratamentoDados: true; comunicacoes: boolean; versaoPolitica: string; registradoEm: string };
  origem: Origem;
};

export type Origem = { pagina: string | null; referencia: string | null; utm: Record<string, string> };

const PROVEDORES_GRATUITOS = new Set([
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "yahoo.com",
  "yahoo.com.br",
  "bol.com.br",
  "uol.com.br",
  "terra.com.br",
  "icloud.com",
  "proton.me",
]);

const CHAVES_UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

const curto = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

/** Lê a origem informada pelo navegador (campos ocultos), descartando o que não for esperado. */
export function lerOrigem(entrada: Record<string, unknown>): Origem {
  const pagina = curto(entrada.origemPagina, 300);
  const utm: Record<string, string> = {};
  for (const chave of CHAVES_UTM) {
    const v = curto(entrada[chave], 150);
    if (v) utm[chave] = v;
  }
  return {
    pagina: pagina?.startsWith("/") ? pagina : null,
    referencia: curto(entrada.origemReferencia, 500),
    utm,
  };
}

export function montarLead<T extends TipoLead>(
  tipo: T,
  dados: DadosLead[T],
  origem: Origem,
  ctx: { id: string; agora: Date },
): Lead {
  const d = dados as Record<string, string | undefined>;
  const campos = camposPorTipo[tipo].flatMap(({ chave, rotulo, opcoes }) => {
    const valor = d[chave];
    if (!valor) return [];
    const texto = opcoes?.find((o) => o.valor === valor)?.rotulo ?? valor;
    return [{ chave, rotulo, valor, texto }];
  });
  const dominio = dados.email.split("@")[1] ?? "";
  const recebidoEm = ctx.agora.toISOString();
  return {
    versao: 1,
    id: ctx.id,
    tipo,
    tipoRotulo: rotuloTipoLead[tipo],
    recebidoEm,
    contato: {
      nome: dados.nome,
      empresa: dados.empresa,
      email: dados.email,
      telefone: d.telefone ?? null,
      emailGratuito: PROVEDORES_GRATUITOS.has(dominio),
    },
    campos,
    mensagem: d.mensagem ?? null,
    consentimento: {
      tratamentoDados: true,
      comunicacoes: dados.aceitaComunicacoes === "on",
      versaoPolitica,
      registradoEm: recebidoEm,
    },
    origem,
  };
}

/** Protocolo curto exibido ao visitante e citado no assunto do e-mail. */
export function protocolo(lead: Lead): string {
  return lead.id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function emailDoLead(lead: Lead): { assunto: string; texto: string } {
  const linhas = [
    `${lead.tipoRotulo}, recebido pelo site em ${new Date(lead.recebidoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`,
    `Protocolo: ${protocolo(lead)}`,
    "",
    `Nome: ${lead.contato.nome}`,
    `Empresa: ${lead.contato.empresa}`,
    `E-mail: ${lead.contato.email}${lead.contato.emailGratuito ? " (provedor gratuito)" : ""}`,
    `Telefone: ${lead.contato.telefone ?? "não informado"}`,
    ...lead.campos.map((c) => `${c.rotulo}: ${c.texto}`),
  ];
  if (lead.mensagem) linhas.push("", "Mensagem:", lead.mensagem);
  linhas.push(
    "",
    `Consentimento LGPD: sim (política ${lead.consentimento.versaoPolitica})`,
    `Aceita comunicações: ${lead.consentimento.comunicacoes ? "sim" : "não"}`,
    `Página de origem: ${lead.origem.pagina ?? "não informada"}`,
  );
  const utm = Object.entries(lead.origem.utm);
  if (utm.length) linhas.push(`UTM: ${utm.map(([k, v]) => `${k}=${v}`).join(" · ")}`);
  if (lead.origem.referencia) linhas.push(`Referência: ${lead.origem.referencia}`);
  return {
    assunto: `[Site MAIS i9] ${lead.tipoRotulo}: ${lead.contato.empresa} (${lead.contato.nome}) · ${protocolo(lead)}`,
    texto: linhas.join("\n"),
  };
}
