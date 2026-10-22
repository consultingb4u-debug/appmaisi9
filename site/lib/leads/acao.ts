"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import nodemailer from "nodemailer";
import { entregarLead, lerConfigEntrega, type Dependencias } from "./entrega";
import { ehTipoLead, validarLead } from "./esquemas";
import type { EstadoFormulario } from "./estado";
import { criarLimitador } from "./limite";
import { lerOrigem, montarLead, protocolo } from "./montar";

const permitir = criarLimitador({ maximo: 5, janelaMs: 10 * 60_000 });

/** Tempo mínimo entre abrir a página e enviar: envios instantâneos são de robôs. */
const TEMPO_MINIMO_MS = 2_500;

const enviarEmail: Dependencias["enviarEmail"] = async (cfg, m) => {
  const transporte = nodemailer.createTransport({
    host: cfg.smtp.host,
    port: cfg.smtp.porta,
    secure: cfg.smtp.porta === 465,
    auth: cfg.smtp.usuario ? { user: cfg.smtp.usuario, pass: cfg.smtp.senha ?? "" } : undefined,
  });
  await transporte.sendMail({ from: cfg.de, to: cfg.para, replyTo: m.responderPara, subject: m.assunto, text: m.texto });
};

export async function enviarLead(_anterior: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const entrada = Object.fromEntries(formData.entries());
  const tipo = entrada.tipo;
  if (!ehTipoLead(tipo)) return { status: "falha", mensagem: "Formulário inválido. Recarregue a página e tente novamente." };

  const validacao = validarLead(tipo, entrada);
  if (!validacao.ok) return { status: "invalido", erros: validacao.erros };

  // Armadilhas para robôs: campo invisível preenchido ou envio rápido demais.
  const inicio = Number(entrada.inicio);
  if (entrada.website || (inicio > 0 && Date.now() - inicio < TEMPO_MINIMO_MS)) {
    return { status: "falha", mensagem: "Não foi possível enviar agora. Aguarde alguns segundos e tente novamente." };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "desconhecido";
  if (!permitir(ip)) {
    return { status: "falha", mensagem: "Recebemos muitos envios a partir da sua conexão. Tente novamente em alguns minutos." };
  }

  const lead = montarLead(tipo, validacao.dados, lerOrigem(entrada), { id: randomUUID(), agora: new Date() });
  const resultado = await entregarLead(lead, lerConfigEntrega(), { fetch, enviarEmail });

  switch (resultado.status) {
    case "entregue":
      if (resultado.falhas.length) console.error(`[leads] ${lead.id}: canal com falha`, resultado.falhas);
      return { status: "enviado", protocolo: protocolo(lead) };
    case "nao-configurado":
      // Nenhum destino configurado: o visitante é avisado de que a mensagem não foi enviada.
      if (process.env.NODE_ENV !== "production") console.info("[leads] destino não configurado; lead não enviado:", lead);
      else console.error("[leads] destino não configurado (LEADS_WEBHOOK_URL ou LEADS_EMAIL_PARA + SMTP_*)");
      return { status: "nao-configurado" };
    case "falha":
      console.error(`[leads] ${lead.id}: nenhum canal aceitou o envio`, resultado.falhas);
      return {
        status: "falha",
        mensagem: "Não conseguimos enviar sua mensagem agora. Tente novamente em alguns minutos.",
      };
  }
}
