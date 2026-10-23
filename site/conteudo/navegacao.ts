import { ctaWhatsapp } from "@/conteudo/empresa";

export type ItemMenu = { rotulo: string; href: string };

export const menuPrincipal: ItemMenu[] = [
  { rotulo: "Início", href: "/" },
  { rotulo: "Consultoria Protheus", href: "/consultoria-protheus" },
  { rotulo: "MAIS i9 WMS", href: "/mais-i9-wms" },
  { rotulo: "Sobre Nós", href: "/sobre" },
  { rotulo: "Conteúdos", href: "/conteudos" },
  { rotulo: "Contato", href: "/contato" },
];

export const ctaCabecalho: ItemMenu = { rotulo: "Falar com um especialista", href: ctaWhatsapp("geral") };

export const rodape: { titulo: string; itens: ItemMenu[] }[] = [
  {
    titulo: "Consultoria Protheus",
    itens: [
      { rotulo: "Visão geral", href: "/consultoria-protheus" },
      { rotulo: "Serviços", href: "/consultoria-protheus#servicos" },
      { rotulo: "Modelos de contratação", href: "/consultoria-protheus#modelos" },
      { rotulo: "Solicitar diagnóstico", href: ctaWhatsapp("diagnostico") },
    ],
  },
  {
    titulo: "MAIS i9 WMS",
    itens: [
      { rotulo: "Visão do produto", href: "/mais-i9-wms" },
      { rotulo: "Funcionalidades", href: "/mais-i9-wms#funcionalidades" },
      { rotulo: "Integração com Protheus", href: "/mais-i9-wms#integracao" },
      { rotulo: "Agendar demonstração", href: ctaWhatsapp("demonstracaoWms") },
    ],
  },
  {
    titulo: "Empresa",
    itens: [
      { rotulo: "Sobre nós", href: "/sobre" },
      { rotulo: "Conteúdos", href: "/conteudos" },
      { rotulo: "Contato", href: "/contato" },
    ],
  },
];
