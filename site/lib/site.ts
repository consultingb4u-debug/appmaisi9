import type { Metadata } from "next";
import { empresa } from "@/conteudo/empresa";

/** Endereço público do site (canônicas, sitemap, Open Graph). Defina NEXT_PUBLIC_SITE_URL no deploy. */
export const urlSite = new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");

/**
 * Indexação por buscadores só com SITE_INDEXAVEL="true" (produção, com as pendências resolvidas).
 * Ambientes de teste e homologação ficam fora do Google por padrão.
 */
export const siteIndexavel = process.env.SITE_INDEXAVEL === "true";

export const tituloPadrao = "MAIS i9 | Consultoria TOTVS Protheus e MAIS i9 WMS";
export const descricaoPadrao =
  "Consultoria especializada em TOTVS Protheus (sustentação, suporte, projetos e desenvolvimento) e o MAIS i9 WMS, solução própria de gestão de armazéns no modelo SaaS.";

/** Páginas terminam com "/" (export estático com trailingSlash); arquivos (com extensão) não. */
export function comBarraFinal(caminho: string): string {
  const [rota, resto = ""] = caminho.split(/(?=[?#])/);
  const ultimo = rota.split("/").pop() ?? "";
  if (rota.endsWith("/") || ultimo.includes(".") || ultimo === "opengraph-image") return caminho;
  return `${rota}/${resto}`;
}

export function urlAbsoluta(caminho: string): string {
  return new URL(comBarraFinal(caminho), urlSite).toString();
}

/** Metadados de uma página: título, descrição, canônica e Open Graph coerentes entre si. */
export function metadadosPagina({ titulo, descricao, caminho }: { titulo: string; descricao: string; caminho: string }): Metadata {
  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: comBarraFinal(caminho) },
    openGraph: {
      title: `${titulo} | ${empresa.nome}`,
      description: descricao,
      url: comBarraFinal(caminho),
      siteName: empresa.nome,
      locale: "pt_BR",
      type: "website",
    },
    twitter: { card: "summary_large_image", title: `${titulo} | ${empresa.nome}`, description: descricao },
  };
}
