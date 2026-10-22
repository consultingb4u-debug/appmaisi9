import type { LucideIcon } from "lucide-react";
import { BadgeCheck, Building2, Cpu, Handshake, Headset, Lightbulb, Target, Warehouse, Workflow } from "lucide-react";

/*
 * Conteúdo da página inicial: apresentação institucional da MAIS i9 e de seus
 * serviços e produtos. Cada oferta é descrita por si só e leva à sua página.
 */

export const quemSomosInicio = {
  titulo: "Conhecimento, experiência e tecnologia a serviço da gestão empresarial",
  paragrafos: [
    "A MAIS i9 é uma empresa brasileira de tecnologia que apoia empresas na continuidade, na eficiência e na evolução das suas operações.",
    "Oferecemos serviços de consultoria especializada em TOTVS Protheus e desenvolvemos soluções próprias, como o MAIS i9 WMS, plataforma SaaS de gestão de armazéns.",
  ],
};

export type Oferta = {
  id: "consultoria" | "wms";
  /** "Serviço" ou "Produto". */
  rotulo: string;
  nome: string;
  /** Chamada curta do cartão no topo da página. */
  chamada: string;
  destaques: string[];
  titulo: string;
  texto: string;
  itens: string[];
  cta: { rotulo: string; href: string };
  ctaSecundario: { rotulo: string; href: string };
  icone: LucideIcon;
};

export const consultoriaInicio: Oferta = {
  id: "consultoria",
  rotulo: "Serviço",
  nome: "MAIS i9 Consultoria Protheus",
  chamada: "Especialistas em TOTVS Protheus: suporte, sustentação, projetos e fábrica de software.",
  destaques: ["+20 anos em Protheus", "Suporte N1–N3", "Sustentação", "Projetos"],
  titulo: "Especialistas em TOTVS Protheus",
  texto:
    "Mais de 20 anos dedicados ao Protheus. Apoiamos empresas a extrair o máximo valor do ERP com estabilidade, governança e evolução contínua — com especialistas funcionais e técnicos que conhecem o seu ambiente.",
  itens: [
    "Suporte N1 a N3, com SLA e atendimento multicanal",
    "Sustentação, atualizações e migrações de versão",
    "Projetos de implantação, integrações e internacionalização",
    "Fábrica de software ADVPL/TLPP e DBA Oracle e SQL Server",
  ],
  cta: { rotulo: "Conhecer a Consultoria Protheus", href: "/consultoria-protheus" },
  ctaSecundario: { rotulo: "Falar com um especialista Protheus", href: "/consultoria-protheus#formulario" },
  icone: Headset,
};

export const wmsInicio: Oferta = {
  id: "wms",
  rotulo: "Produto",
  nome: "MAIS i9 WMS",
  chamada: "Gestão Inteligente de Armazéns, 100% SaaS, com controle e rastreabilidade do recebimento à expedição.",
  destaques: ["100% SaaS", "App Operador", "Rastreabilidade", "Addon MAIS i9 (API)"],
  titulo: "Gestão Inteligente de Armazéns",
  texto:
    "Plataforma SaaS que conecta pessoas, processos e tecnologia no armazém: visibilidade do estoque, rastreabilidade ponta a ponta e mais segurança nas decisões, do recebimento à expedição.",
  itens: [
    "Recebimento, armazenagem, expedição e inventário",
    "Lotes, validade, FIFO/FEFO e endereçamento",
    "App Operador em dispositivos Android",
    "Conexão ao TOTVS Protheus pelo Addon MAIS i9, via API",
  ],
  cta: { rotulo: "Explorar o MAIS i9 WMS", href: "/mais-i9-wms" },
  ctaSecundario: { rotulo: "Agendar demonstração", href: "/mais-i9-wms#demonstracao" },
  icone: Warehouse,
};

export const ofertasInicio = [consultoriaInicio, wmsInicio];

export const diferenciaisInicio: { titulo: string; texto: string; icone: LucideIcon }[] = [
  {
    titulo: "Especialização",
    texto: "Foco em TOTVS Protheus e em gestão de armazéns — as áreas em que concentramos conhecimento e investimento.",
    icone: Target,
  },
  {
    titulo: "Experiência em ambientes empresariais",
    texto: "Atuação em operações reais, com rotinas críticas, várias áreas envolvidas e necessidade de continuidade.",
    icone: Building2,
  },
  {
    titulo: "Conhecimento técnico e funcional",
    texto: "Domínio da parametrização e do desenvolvimento, aliado ao entendimento de como as áreas usam o sistema.",
    icone: Cpu,
  },
  {
    titulo: "Visão de processos",
    texto: "Antes de configurar ou desenvolver, entendemos o processo de negócio que a tecnologia precisa sustentar.",
    icone: Workflow,
  },
  {
    titulo: "Compromisso com resultados",
    texto: "Prioridades acordadas, indicadores de acompanhamento e transparência sobre prazos e riscos.",
    icone: BadgeCheck,
  },
  {
    titulo: "Tecnologia própria",
    texto: "Produtos desenvolvidos e evoluídos pela própria MAIS i9, com conhecimento direto de cada solução.",
    icone: Lightbulb,
  },
  {
    titulo: "Atendimento próximo",
    texto: "Relacionamento direto com os especialistas que conhecem o seu ambiente e a sua operação.",
    icone: Handshake,
  },
];
