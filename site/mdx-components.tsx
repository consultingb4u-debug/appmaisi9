import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { ctaWhatsapp, mensagensWhatsapp, type AssuntoWhatsapp } from "@/conteudo/empresa";

/** `whatsapp:diagnostico` → conversa no WhatsApp da MAIS i9 com a mensagem do assunto. */
function resolverHref(href: string) {
  if (!href.startsWith("whatsapp:")) return href;
  const assunto = href.slice("whatsapp:".length);
  if (!(assunto in mensagensWhatsapp)) throw new Error(`Assunto de WhatsApp desconhecido no artigo: ${assunto}`);
  return ctaWhatsapp(assunto as AssuntoWhatsapp);
}

// Links internos dos artigos usam o roteador do Next; externos (inclusive WhatsApp) abrem em nova aba.
const components: MDXComponents = {
  a: ({ href: original = "", children, ...props }) => {
    const href = resolverHref(original);
    return href.startsWith("/") || href.startsWith("#") ? (
      <Link href={href} {...props}>
        {children}
      </Link>
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  },
};

export function useMDXComponents(): MDXComponents {
  return components;
}
