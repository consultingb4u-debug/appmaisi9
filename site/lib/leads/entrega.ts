import { emailDoLead, type Lead } from "./montar";

/*
 * Destino dos leads, configurado por variáveis de ambiente (ver .env.example):
 * - LEADS_WEBHOOK_URL (+ LEADS_WEBHOOK_TOKEN): POST JSON para CRM, automação ou planilha;
 * - LEADS_EMAIL_PARA + SMTP_*: e-mail para a equipe comercial.
 * Sem nenhum canal configurado, o formulário informa ao visitante que a mensagem NÃO foi enviada.
 */

export type ConfigEntrega = {
  webhook: { url: string; token: string | null } | null;
  email: {
    para: string[];
    de: string;
    smtp: { host: string; porta: number; usuario: string | null; senha: string | null };
  } | null;
};

type Env = Record<string, string | undefined>;

export function lerConfigEntrega(env: Env = process.env): ConfigEntrega {
  const url = env.LEADS_WEBHOOK_URL?.trim();
  const para = (env.LEADS_EMAIL_PARA ?? "")
    .split(/[,;]/)
    .map((e) => e.trim())
    .filter(Boolean);
  const host = env.SMTP_HOST?.trim();
  const de = env.SMTP_FROM?.trim() || env.SMTP_USER?.trim();
  return {
    webhook: url ? { url, token: env.LEADS_WEBHOOK_TOKEN?.trim() || null } : null,
    email:
      host && para.length && de
        ? {
            para,
            de,
            smtp: {
              host,
              porta: Number(env.SMTP_PORT ?? 587),
              usuario: env.SMTP_USER?.trim() || null,
              senha: env.SMTP_PASS ?? null,
            },
          }
        : null,
  };
}

export type ResultadoEntrega =
  | { status: "entregue"; canais: string[]; falhas: string[] }
  | { status: "nao-configurado" }
  | { status: "falha"; falhas: string[] };

export type Dependencias = {
  fetch: typeof fetch;
  enviarEmail: (cfg: NonNullable<ConfigEntrega["email"]>, m: { assunto: string; texto: string; responderPara: string }) => Promise<void>;
};

/** Entrega o lead em todos os canais configurados. Basta um canal aceitar para o envio valer. */
export async function entregarLead(lead: Lead, config: ConfigEntrega, deps: Dependencias): Promise<ResultadoEntrega> {
  const tarefas: { canal: string; executar: () => Promise<void> }[] = [];

  if (config.webhook) {
    const { url, token } = config.webhook;
    tarefas.push({
      canal: "webhook",
      executar: async () => {
        const resp = await deps.fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(lead),
          signal: AbortSignal.timeout(10_000),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      },
    });
  }

  if (config.email) {
    const cfg = config.email;
    tarefas.push({
      canal: "email",
      executar: () => deps.enviarEmail(cfg, { ...emailDoLead(lead), responderPara: lead.contato.email }),
    });
  }

  if (!tarefas.length) return { status: "nao-configurado" };

  const resultados = await Promise.allSettled(tarefas.map((t) => t.executar()));
  const canais: string[] = [];
  const falhas: string[] = [];
  resultados.forEach((r, i) => {
    if (r.status === "fulfilled") canais.push(tarefas[i].canal);
    else falhas.push(`${tarefas[i].canal}: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`);
  });
  return canais.length ? { status: "entregue", canais, falhas } : { status: "falha", falhas };
}
