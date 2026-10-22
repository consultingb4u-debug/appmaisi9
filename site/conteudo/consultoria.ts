import type { LucideIcon } from "lucide-react";
import {
  ChartGantt,
  CodeXml,
  FileText,
  GitMerge,
  Headset,
  Layers,
  LifeBuoy,
  SearchCheck,
  TriangleAlert,
  UserRoundCheck,
  Users,
  Workflow,
} from "lucide-react";

type Servico = {
  /** Usado em âncoras e no campo "Serviço de interesse" do formulário. */
  id: string;
  titulo: string;
  resumo: string;
  itens: readonly string[];
  icone: LucideIcon;
};

export const servicosConsultoria = [
  {
    id: "sustentacao",
    titulo: "Sustentação ERP Protheus",
    resumo: "Atendimento contínuo para manter o ambiente estável e a operação funcionando.",
    itens: [
      "Atendimento contínuo de demandas",
      "Correção de problemas e análise de incidentes",
      "Apoio aos processos operacionais",
      "Manutenção e estabilidade do ambiente",
      "Acompanhamento de indicadores de atendimento",
    ],
    icone: LifeBuoy,
  },
  {
    id: "suporte",
    titulo: "Suporte Especializado Protheus",
    resumo: "Atendimento funcional e técnico aos usuários, conforme o modelo contratado.",
    itens: [
      "Atendimento funcional e técnico",
      "Orientação aos usuários",
      "Diagnóstico e resolução de problemas",
      "Apoio à utilização dos módulos do ERP",
    ],
    icone: Headset,
  },
  {
    id: "projetos",
    titulo: "Projetos de Implantação e Evolução",
    resumo: "Implantação de módulos e evolução do ambiente, com método e governança.",
    itens: [
      "Implantação de módulos",
      "Melhorias de processos e parametrizações",
      "Integrações",
      "Atualizações e adequações",
      "Evolução funcional e tecnológica",
    ],
    icone: Layers,
  },
  {
    id: "desenvolvimento",
    titulo: "Desenvolvimento e Customizações",
    resumo: "Desenvolvimento ADVPL/TLPP para as necessidades específicas dos seus processos.",
    itens: [
      "Desenvolvimento ADVPL/TLPP",
      "Criação e manutenção de rotinas específicas",
      "Relatórios e automatizações",
      "Integrações com sistemas externos",
    ],
    icone: CodeXml,
  },
  {
    id: "consultoria-pontual",
    titulo: "Consultoria Pontual e Especializada",
    resumo: "Diagnósticos, avaliações e apoio especializado, sob demanda.",
    itens: [
      "Diagnósticos do ambiente",
      "Avaliações técnicas e funcionais",
      "Resolução de problemas específicos",
      "Apoio em projetos críticos",
    ],
    icone: SearchCheck,
  },
  {
    id: "governanca",
    titulo: "Governança e Gestão de Projetos",
    resumo: "Planejamento, acompanhamento e indicadores para decisões executivas.",
    itens: [
      "Planejamento e acompanhamento de projetos",
      "Gestão de recursos e entregas",
      "Governança de demandas",
      "Indicadores e acompanhamento executivo",
    ],
    icone: ChartGantt,
  },
] as const satisfies readonly Servico[];

export type ServicoId = (typeof servicosConsultoria)[number]["id"];

/** Opções do campo "Serviço de interesse" (formulário da consultoria). */
export const opcoesServico: { valor: string; rotulo: string }[] = [
  { valor: "diagnostico", rotulo: "Diagnóstico do ambiente Protheus" },
  ...servicosConsultoria.map((s) => ({ valor: s.id, rotulo: s.titulo })),
  { valor: "nao-sei", rotulo: "Ainda não sei — quero orientação" },
];

export const desafiosProtheus: { titulo: string; texto: string; icone: LucideIcon }[] = [
  {
    titulo: "Demandas acumuladas, sem prioridade clara",
    texto: "Chamados que se acumulam sem critério de prioridade, prazo ou responsável definidos.",
    icone: TriangleAlert,
  },
  {
    titulo: "Dependência de pessoas-chave",
    texto: "Conhecimento do ambiente concentrado em poucas pessoas, com risco a cada ausência ou mudança na equipe.",
    icone: Users,
  },
  {
    titulo: "Customizações difíceis de manter",
    texto: "Rotinas específicas criadas ao longo dos anos, sem documentação, que travam atualizações e geram retrabalho.",
    icone: FileText,
  },
  {
    titulo: "Controles paralelos ao ERP",
    texto: "Áreas que contornam o sistema com planilhas por falta de parametrização ou de processos bem definidos.",
    icone: Workflow,
  },
  {
    titulo: "Atualizações e adequações adiadas",
    texto: "Mudanças de versão, adequações legais e fiscais postergadas pelo receio de impactar a operação.",
    icone: Layers,
  },
  {
    titulo: "Integrações frágeis",
    texto: "Troca de informações com outros sistemas que falha sem aviso e exige correções manuais.",
    icone: GitMerge,
  },
];

export const pilaresConsultoria: { titulo: string; texto: string }[] = [
  {
    titulo: "Continuidade operacional",
    texto: "Ambiente estável, incidentes tratados com método e processos críticos funcionando.",
  },
  {
    titulo: "Melhor uso do ERP",
    texto: "Parametrizações, rotinas e orientação para que as áreas usem o Protheus a favor do negócio.",
  },
  {
    titulo: "Evolução alinhada ao negócio",
    texto: "Projetos, integrações e melhorias priorizados de acordo com os objetivos da empresa.",
  },
];

export const diferenciaisConsultoria: { titulo: string; texto: string }[] = [
  {
    titulo: "Visão técnica e funcional",
    texto: "Quem analisa a demanda entende tanto o código e a parametrização quanto o processo da área usuária.",
  },
  {
    titulo: "Governança de demandas",
    texto: "Demandas registradas, classificadas e priorizadas, com acompanhamento de prazos e indicadores de atendimento.",
  },
  {
    titulo: "Processo antes da ferramenta",
    texto: "Cada solução parte do entendimento do processo de negócio que o ERP precisa sustentar.",
  },
  {
    titulo: "Acompanhamento executivo",
    texto: "Indicadores e status periódicos para a gestão acompanhar volume, prioridades, riscos e entregas.",
  },
  {
    titulo: "Atendimento próximo",
    texto: "Relacionamento direto com os especialistas que conhecem o seu ambiente e o seu histórico.",
  },
  {
    titulo: "Experiência de produto",
    texto: "A MAIS i9 também desenvolve software próprio integrado ao Protheus — o MAIS i9 WMS.",
  },
];

export type ModeloContratacao = { titulo: string; texto: string; indicado: string; servico: ServicoId };

export const modelosContratacao: ModeloContratacao[] = [
  {
    titulo: "Sustentação continuada",
    texto: "Atendimento recorrente de demandas, correções e apoio operacional, com escopo e indicadores acordados.",
    indicado: "Ambientes em produção que exigem estabilidade e continuidade.",
    servico: "sustentacao",
  },
  {
    titulo: "Suporte especializado",
    texto: "Atendimento funcional e técnico aos usuários, dimensionado conforme o modelo contratado.",
    indicado: "Equipes que precisam de apoio especializado no uso do ERP.",
    servico: "suporte",
  },
  {
    titulo: "Projetos de evolução",
    texto: "Escopo, cronograma e entregas definidos para implantar módulos, melhorar processos ou integrar sistemas.",
    indicado: "Iniciativas com objetivo e prazo definidos.",
    servico: "projetos",
  },
  {
    titulo: "Consultoria pontual",
    texto: "Diagnósticos, avaliações e resolução de problemas específicos, contratados sob demanda.",
    indicado: "Situações críticas ou decisões que pedem uma avaliação especializada.",
    servico: "consultoria-pontual",
  },
  {
    titulo: "Alocação especializada",
    texto: "Profissionais especializados dedicados conforme o escopo contratado, com acompanhamento da MAIS i9.",
    indicado: "Demandas que exigem dedicação de especialistas por um período.",
    servico: "desenvolvimento",
  },
];

export const metodologiaAtendimento: { titulo: string; texto: string }[] = [
  {
    titulo: "Registro e triagem",
    texto: "A demanda é registrada, classificada por tipo e prioridade e direcionada ao especialista adequado.",
  },
  {
    titulo: "Análise",
    texto: "Investigação técnica e funcional da causa, com alinhamento junto à área usuária.",
  },
  {
    titulo: "Solução e validação",
    texto: "Correção, parametrização ou desenvolvimento testados e validados com o usuário antes da entrega.",
  },
  {
    titulo: "Entrega e registro",
    texto: "Publicação controlada e registro da solução, preservando o conhecimento sobre o ambiente.",
  },
  {
    titulo: "Indicadores e melhoria",
    texto: "Acompanhamento periódico de volume, prazos e qualidade, com recomendações de evolução.",
  },
];

export const beneficiosConsultoria: { texto: string; icone: LucideIcon }[] = [
  { texto: "Estabilidade e continuidade da operação", icone: LifeBuoy },
  { texto: "Previsibilidade no atendimento das demandas", icone: ChartGantt },
  { texto: "Melhor aproveitamento do investimento no ERP", icone: Layers },
  { texto: "Menos dependência de pessoas-chave", icone: UserRoundCheck },
  { texto: "Processos mais aderentes ao negócio", icone: Workflow },
  { texto: "Visão executiva por meio de indicadores", icone: SearchCheck },
];

export const faqConsultoria: { pergunta: string; resposta: string }[] = [
  {
    pergunta: "A MAIS i9 faz parte da TOTVS?",
    resposta:
      "Não. A MAIS i9 é uma empresa independente, especializada em serviços para empresas que utilizam o ERP TOTVS Protheus. TOTVS e Protheus são marcas registradas de seus respectivos titulares.",
  },
  {
    pergunta: "Quais modelos de contratação estão disponíveis?",
    resposta:
      "Sustentação continuada, suporte especializado, projetos de evolução, consultoria pontual e alocação especializada conforme o escopo contratado. O modelo é definido junto com você, de acordo com o volume e o tipo de demanda.",
  },
  {
    pergunta: "Como funciona o diagnóstico do ambiente?",
    resposta:
      "Fazemos uma avaliação técnica e funcional do seu Protheus — processos, parametrizações, customizações, integrações e demandas recorrentes — e apresentamos os pontos de atenção e as recomendações priorizadas.",
  },
  {
    pergunta: "Vocês atendem demandas pontuais?",
    resposta:
      "Sim. A consultoria pontual atende diagnósticos, avaliações, resolução de problemas específicos e apoio em projetos críticos, sem a necessidade de um contrato contínuo.",
  },
  {
    pergunta: "Vocês desenvolvem customizações em ADVPL/TLPP?",
    resposta:
      "Sim. Desenvolvemos e mantemos rotinas específicas, relatórios, automatizações e integrações com sistemas externos, sempre partindo do processo de negócio que a customização precisa atender.",
  },
  {
    pergunta: "Como acompanho o andamento dos atendimentos?",
    resposta:
      "As demandas são registradas e acompanhadas com indicadores de atendimento, e a gestão recebe um acompanhamento executivo periódico com volume, prioridades, prazos e riscos.",
  },
  {
    pergunta: "Os valores dos serviços estão disponíveis no site?",
    resposta:
      "Não. Cada proposta é elaborada de acordo com o escopo, o volume de demandas e o modelo de atendimento. Fale com um especialista para receber uma proposta.",
  },
];
