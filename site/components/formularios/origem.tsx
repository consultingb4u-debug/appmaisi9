"use client";

import { useEffect } from "react";

/*
 * Origem do visitante para o CRM: página de entrada, referência e parâmetros UTM.
 * Guardada na sessão do navegador (primeiro acesso) e enviada junto com o formulário.
 */

const CHAVE = "maisi9-origem";
const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];

export type OrigemNavegador = { referencia: string; utm: Record<string, string> };

function lerSessao(): OrigemNavegador | null {
  try {
    const bruto = sessionStorage.getItem(CHAVE);
    return bruto ? (JSON.parse(bruto) as OrigemNavegador) : null;
  } catch {
    return null;
  }
}

export function lerOrigemNavegador(): OrigemNavegador {
  const params = new URLSearchParams(window.location.search);
  const utmAtual = Object.fromEntries(UTM.flatMap((k) => (params.get(k) ? [[k, params.get(k) as string]] : [])));
  const sessao = lerSessao();
  return {
    referencia: sessao?.referencia || document.referrer,
    utm: Object.keys(utmAtual).length ? utmAtual : (sessao?.utm ?? {}),
  };
}

/** Montado no layout: registra a origem no primeiro acesso da sessão. */
export function CapturaOrigem() {
  useEffect(() => {
    try {
      const atual = lerOrigemNavegador();
      const sessao = lerSessao();
      if (!sessao || Object.keys(atual.utm).length) sessionStorage.setItem(CHAVE, JSON.stringify(atual));
    } catch {
      // Armazenamento indisponível (modo privado, bloqueio): segue sem origem.
    }
  }, []);
  return null;
}
