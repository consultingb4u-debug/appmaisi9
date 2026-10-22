import { empresa } from "@/conteudo/empresa";
import { urlAbsoluta } from "./site";

/** Dados estruturados (schema.org). Só incluem informações oficiais já preenchidas. */

export const idOrganizacao = urlAbsoluta("/#organizacao");

export function organizacao() {
  const contato = [empresa.emailComercial, empresa.telefoneComercial].some(Boolean)
    ? {
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "sales",
          areaServed: "BR",
          availableLanguage: "pt-BR",
          ...(empresa.emailComercial ? { email: empresa.emailComercial } : {}),
          ...(empresa.telefoneComercial ? { telephone: empresa.telefoneComercial } : {}),
        },
      }
    : {};
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": idOrganizacao,
    name: empresa.nome,
    ...(empresa.razaoSocial ? { legalName: empresa.razaoSocial } : {}),
    url: urlAbsoluta("/"),
    description: empresa.descricao,
    ...(empresa.logo.positivo ? { logo: urlAbsoluta(empresa.logo.positivo.src) } : {}),
    ...(empresa.anoFundacao ? { foundingDate: String(empresa.anoFundacao) } : {}),
    ...(empresa.linkedin ? { sameAs: [empresa.linkedin] } : {}),
    ...contato,
  };
}

export function siteWeb() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: empresa.nome,
    url: urlAbsoluta("/"),
    inLanguage: "pt-BR",
    publisher: { "@id": idOrganizacao },
  };
}

export function trilha(itens: { nome: string; caminho: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: itens.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.nome, item: urlAbsoluta(it.caminho) })),
  };
}

export function perguntasFrequentes(faq: { pergunta: string; resposta: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.pergunta, acceptedAnswer: { "@type": "Answer", text: f.resposta } })),
  };
}
