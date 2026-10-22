export type ItemMenu = { rotulo: string; href: string };

export const menuPrincipal: ItemMenu[] = [
  { rotulo: "Início", href: "/" },
  { rotulo: "Consultoria Protheus", href: "/consultoria-protheus" },
  { rotulo: "MAIS i9 WMS", href: "/mais-i9-wms" },
  { rotulo: "Sobre Nós", href: "/sobre" },
  { rotulo: "Cases", href: "/cases" },
  { rotulo: "Conteúdos", href: "/conteudos" },
  { rotulo: "Contato", href: "/contato" },
];

export const ctaCabecalho: ItemMenu = { rotulo: "Falar com um especialista", href: "/contato" };

export const rodape: { titulo: string; itens: ItemMenu[] }[] = [
  {
    titulo: "Consultoria Protheus",
    itens: [
      { rotulo: "Visão geral", href: "/consultoria-protheus" },
      { rotulo: "Serviços", href: "/consultoria-protheus#servicos" },
      { rotulo: "Modelos de contratação", href: "/consultoria-protheus#modelos" },
      { rotulo: "Solicitar diagnóstico", href: "/consultoria-protheus?servico=diagnostico#formulario" },
    ],
  },
  {
    titulo: "MAIS i9 WMS",
    itens: [
      { rotulo: "Visão do produto", href: "/mais-i9-wms" },
      { rotulo: "Funcionalidades", href: "/mais-i9-wms#funcionalidades" },
      { rotulo: "Integração com Protheus", href: "/mais-i9-wms#integracao" },
      { rotulo: "Agendar demonstração", href: "/mais-i9-wms#demonstracao" },
    ],
  },
  {
    titulo: "Empresa",
    itens: [
      { rotulo: "Sobre nós", href: "/sobre" },
      { rotulo: "Cases e clientes", href: "/cases" },
      { rotulo: "Conteúdos", href: "/conteudos" },
      { rotulo: "Contato", href: "/contato" },
    ],
  },
];
