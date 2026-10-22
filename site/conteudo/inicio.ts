import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Building2,
  Cpu,
  Handshake,
  Headset,
  Lightbulb,
  Link2,
  Target,
  Warehouse,
  Workflow,
} from "lucide-react";

/*
 * Conteúdo da página inicial. As duas frentes têm o mesmo peso e são contratadas
 * de forma independente: a consultoria não exige o WMS, e o WMS não exige a consultoria.
 */

export type Frente = {
  id: "consultoria" | "wms";
  rotulo: string;
  nome: string;
  resumo: string;
  destaques: string[];
  paraQuem: string;
  inclui: string[];
  comoContratar: string;
  cta: { rotulo: string; href: string };
  saibaMais: { rotulo: string; href: string };
  icone: LucideIcon;
};

export const frentes: Frente[] = [
  {
    id: "consultoria",
    rotulo: "Serviços",
    nome: "MAIS i9 Consultoria Protheus",
    resumo: "Suporte, sustentação, projetos e fábrica de software para empresas que utilizam o TOTVS Protheus.",
    destaques: ["Suporte N1–N3", "Sustentação", "Projetos", "ADVPL/TLPP"],
    paraQuem: "Empresas que utilizam o TOTVS Protheus e precisam de continuidade, suporte especializado e evolução do ERP.",
    inclui: [
      "Suporte N1 a N3 com SLA e atendimento multicanal",
      "Sustentação, atualizações e migrações de versão",
      "Projetos, integrações e fábrica de software ADVPL/TLPP",
      "DBA Oracle e SQL Server",
    ],
    comoContratar: "Modelos Pontual, Suporte, Sustentação, Evolutivo ou Projetos — sem necessidade de usar o MAIS i9 WMS.",
    cta: { rotulo: "Falar com um especialista Protheus", href: "/consultoria-protheus#formulario" },
    saibaMais: { rotulo: "Conhecer a Consultoria Protheus", href: "/consultoria-protheus" },
    icone: Headset,
  },
  {
    id: "wms",
    rotulo: "Produto SaaS",
    nome: "MAIS i9 WMS",
    resumo: "Gestão Inteligente de Armazéns: recebimento, armazenagem, expedição e inventário com rastreabilidade.",
    destaques: ["100% SaaS", "App Operador", "Integração Protheus", "APIs"],
    paraQuem: "Operações logísticas que precisam de controle, rastreabilidade e mobilidade no armazém.",
    inclui: [
      "Recebimento, armazenagem, expedição e gestão administrativa",
      "App Operador em dispositivos Android",
      "Dashboards, lotes, validade e FIFO/FEFO",
      "Módulos de inventário, produção, entregas e embalagens",
    ],
    comoContratar: "Assinatura SaaS e implantação dos módulos escolhidos — sem necessidade de contratar a consultoria.",
    cta: { rotulo: "Agendar demonstração", href: "/mais-i9-wms#demonstracao" },
    saibaMais: { rotulo: "Explorar o MAIS i9 WMS", href: "/mais-i9-wms" },
    icone: Warehouse,
  },
];

/** Como as frentes se relacionam: independentes, com integração padrão quando usadas juntas. */
export const combinacoesFrentes: { titulo: string; texto: string; icone: LucideIcon }[] = [
  {
    titulo: "Só a consultoria",
    texto: "Suporte, sustentação e projetos para o seu ambiente Protheus, com ou sem WMS.",
    icone: Headset,
  },
  {
    titulo: "Só o MAIS i9 WMS",
    texto: "Integração padrão com o Protheus incluída na implantação e APIs para outros ERPs, sem exigir a consultoria.",
    icone: Warehouse,
  },
  {
    titulo: "As duas frentes",
    texto: "Um único parceiro para o ERP e o armazém: quem cuida do Protheus conhece a integração com o WMS.",
    icone: Link2,
  },
];

export const diferenciaisInicio: { titulo: string; texto: string; icone: LucideIcon }[] = [
  {
    titulo: "Especialização",
    texto: "Foco em TOTVS Protheus e em gestão de armazéns — as frentes em que concentramos conhecimento e investimento.",
    icone: Target,
  },
  {
    titulo: "Experiência em ambientes empresariais",
    texto: "Atuação em operações reais, com rotinas críticas, várias áreas envolvidas e necessidade de continuidade.",
    icone: Building2,
  },
  {
    titulo: "Conhecimento técnico e funcional",
    texto: "Domínio da parametrização e do desenvolvimento, aliado ao entendimento de como as áreas usam o ERP.",
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
    texto: "O MAIS i9 WMS é desenvolvido e evoluído pela MAIS i9, com conhecimento direto do produto e da integração.",
    icone: Lightbulb,
  },
  {
    titulo: "Atendimento próximo",
    texto: "Relacionamento direto com os especialistas que conhecem o seu ambiente e a sua operação.",
    icone: Handshake,
  },
];
