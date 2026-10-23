import type { LucideIcon } from "lucide-react";
import {
  ChartGantt,
  CodeXml,
  Database,
  FileText,
  GitMerge,
  Headset,
  Layers,
  LifeBuoy,
  SearchCheck,
  ShieldCheck,
  TrendingUp,
  TriangleAlert,
  UserRoundCheck,
  Users,
  Workflow,
} from "lucide-react";

/*
 * Conteúdo da MAIS i9 Consultoria Protheus, a partir da apresentação comercial
 * (2026-2S) e do modelo de proposta. Valores e preços NÃO são publicados no site.
 */

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
    id: "suporte",
    titulo: "Suporte Especializado Protheus",
    resumo: "Atendimento funcional e técnico, nos níveis N1, N2 e N3, para os usuários e a equipe interna de TI.",
    itens: [
      "Esclarecimento de dúvidas sobre rotinas e funcionalidades",
      "Análise e tratamento de incidentes",
      "Apoio às rotinas operacionais e aos fechamentos",
      "Ajustes operacionais e parametrizações de baixa complexidade",
      "Gestão de usuários, perfis e acessos",
      "Escalonamento ao fabricante, quando necessário",
    ],
    icone: Headset,
  },
  {
    id: "sustentacao",
    titulo: "Sustentação e Evolução do Ambiente",
    resumo: "Atuação preventiva e planejada para manter o Protheus estável, seguro, atualizado e em evolução.",
    itens: [
      "Avaliação periódica das condições técnicas do ambiente",
      "Identificação de riscos e dependências críticas",
      "Planejamento de atualizações, patches e updates",
      "Migrações de versão planejadas e dimensionadas",
      "Melhoria contínua com boas práticas (ITIL/COBIT)",
      "Plano de treinamento e capacitação",
    ],
    icone: LifeBuoy,
  },
  {
    id: "projetos",
    titulo: "Projetos de Implantação e Evolução",
    resumo: "Projetos estruturados, com escopo, cronograma e entregáveis definidos, em metodologia Agile ou Waterfall.",
    itens: [
      "Implantação de novos módulos",
      "Novas funcionalidades e parametrizações",
      "Integrações e automações",
      "Internacionalização",
      "Projetos de melhoria e transformação de processos",
      "Gestão de projetos especializada",
    ],
    icone: Layers,
  },
  {
    id: "desenvolvimento",
    titulo: "Fábrica de Software ADVPL/TLPP",
    resumo: "Desenvolvimento para as necessidades específicas dos processos, integrado ao padrão do Protheus.",
    itens: [
      "Customizações ADVPL/TLPP",
      "Rotinas e processos específicos",
      "Desenvolvimento e consumo de APIs",
      "Integrações com sistemas e plataformas externas",
      "Automatização de processos",
    ],
    icone: CodeXml,
  },
  {
    id: "consultoria-pontual",
    titulo: "Consultoria Pontual e Diagnóstico",
    resumo: "Atendimento sob demanda, sem horas mínimas mensais, para situações específicas.",
    itens: [
      "Diagnóstico do ambiente Protheus",
      "Avaliações técnicas e funcionais",
      "Resolução pontual de problemas",
      "Projetos de melhorias",
      "Apoio em projetos críticos",
    ],
    icone: SearchCheck,
  },
  {
    id: "governanca",
    titulo: "Governança e Gestão dos Serviços",
    resumo: "Transparência sobre demandas, prioridades e capacidade contratada.",
    itens: [
      "Registro e acompanhamento das solicitações",
      "Classificação e priorização das demandas",
      "Controle das horas executadas e do saldo",
      "Identificação de demandas recorrentes",
      "Reuniões periódicas e relatórios de atividades",
      "Roadmap de evolução e priorização conjunta",
    ],
    icone: ChartGantt,
  },
] as const satisfies readonly Servico[];

export type ServicoId = (typeof servicosConsultoria)[number]["id"];

/** Serviço especializado complementar, contratado à parte. */
export const servicoDba = {
  titulo: "Administração de Bancos de Dados — Oracle e SQL Server",
  resumo:
    "Estabilidade, segurança e desempenho da camada de banco de dados que sustenta o TOTVS Protheus. Contratação pontual ou contínua, à parte dos demais modelos.",
  itens: [
    "Diagnóstico e análise de desempenho",
    "Identificação de gargalos e ajustes de performance",
    "Manutenção preventiva e corretiva",
    "Estratégias de backup e recuperação",
    "Apoio em atualizações e migrações de bancos",
    "Análise de incidentes na camada de banco de dados",
  ],
  icone: Database,
};

/** Opções do campo "Serviço de interesse" (formulário da consultoria). */
export const opcoesServico: { valor: string; rotulo: string }[] = [
  { valor: "diagnostico", rotulo: "Diagnóstico do ambiente Protheus" },
  { valor: "evolutivo", rotulo: "Modelo Evolutivo (suporte + sustentação)" },
  ...servicosConsultoria.map((s) => ({ valor: s.id, rotulo: s.titulo })),
  { valor: "dba", rotulo: "DBA Oracle / SQL Server" },
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
    texto: "Mudanças de versão, adequações legais e fiscais — como a Reforma Tributária — postergadas pelo receio de impactar a operação.",
    icone: Layers,
  },
  {
    titulo: "Integrações frágeis",
    texto: "Troca de informações com outros sistemas que falha sem aviso e exige correções manuais.",
    icone: GitMerge,
  },
];

/** "O que sua empresa ganha" — material comercial da consultoria. */
export const ganhosConsultoria: { titulo: string; texto: string; icone: LucideIcon }[] = [
  {
    titulo: "Continuidade operacional",
    texto: "Redução de indisponibilidades e maior previsibilidade para os processos críticos.",
    icone: ShieldCheck,
  },
  {
    titulo: "Governança do ambiente",
    texto: "Organização das demandas, planejamento das evoluções e acompanhamento técnico contínuo.",
    icone: ChartGantt,
  },
  {
    titulo: "Maior capacidade da equipe",
    texto: "Apoio especializado para reduzir filas de atendimento e acelerar entregas.",
    icone: Users,
  },
  {
    titulo: "Evolução do Protheus",
    texto: "Atualizações, melhorias e novos projetos conduzidos de forma planejada.",
    icone: TrendingUp,
  },
];

export const diferenciaisConsultoria: { titulo: string; texto: string }[] = [
  {
    titulo: "Especialistas funcionais e técnicos",
    texto: "Equipe com experiência em Backoffice, Reforma Tributária, GPE e Medicina, Qualidade, Manufatura, TAF, PMS e infraestrutura Protheus.",
  },
  {
    titulo: "Governança de demandas",
    texto: "Solicitações registradas, classificadas por criticidade e acompanhadas, com controle de horas, saldo e relatórios periódicos.",
  },
  {
    titulo: "Boas práticas de gestão",
    texto: "Sustentação orientada por melhoria contínua, com referências de mercado como ITIL e COBIT.",
  },
  {
    titulo: "Fábrica de software",
    texto: "Desenvolvimento ADVPL/TLPP, APIs, integrações e automações com o mesmo time que conhece o seu ambiente.",
  },
  {
    titulo: "Atendimento multicanal",
    texto: "Central de chamados, e-mail, WhatsApp e telefone, com níveis de serviço definidos em contrato.",
  },
  {
    titulo: "Mais de 20 anos em Protheus",
    texto: "Mais de 10.000 horas de projetos de implantação, customização, integração e internacionalização no ERP.",
  },
];

export type ModeloId = "pontual" | "suporte" | "sustentacao" | "evolutivo" | "projetos";

export type ModeloContratacao = {
  id: ModeloId;
  titulo: string;
  /** Formato de contratação (sem valores). */
  formato: string;
  base: string;
  indicado: string[];
  recomendado?: boolean;
  /** Opção pré-selecionada no formulário ao clicar em "Solicitar proposta". */
  servico: string;
};

export const modelosContratacao: ModeloContratacao[] = [
  {
    id: "pontual",
    titulo: "Pontual",
    formato: "Por atendimento",
    base: "Sem horas mínimas mensais",
    indicado: ["Soluções imediatas", "Resolução pontual", "Projetos de melhorias"],
    servico: "consultoria-pontual",
  },
  {
    id: "suporte",
    titulo: "Suporte",
    formato: "Franquia mensal de horas",
    base: "Atendimento recorrente com SLA",
    indicado: ["Suporte ágil", "Atendimento multicanal", "SLA no atendimento", "Especialistas"],
    servico: "suporte",
  },
  {
    id: "sustentacao",
    titulo: "Sustentação",
    formato: "Bolsa de horas",
    base: "Atuação preventiva e planejada",
    indicado: ["Estabilidade do ambiente", "Atualizações programadas", "Acompanhamento contínuo", "Planejamento"],
    servico: "sustentacao",
  },
  {
    id: "evolutivo",
    titulo: "Evolutivo",
    formato: "Bolsa única de horas",
    base: "Suporte + Sustentação",
    indicado: ["Ambientes com operação ativa", "Crescimento estruturado", "Roadmap de evolução"],
    recomendado: true,
    servico: "evolutivo",
  },
  {
    id: "projetos",
    titulo: "Projetos",
    formato: "Escopo fechado ou por estimativa",
    base: "Escopo, cronograma e entregáveis definidos",
    indicado: ["Implantação de módulos", "Integrações e desenvolvimentos", "Projetos estruturados"],
    servico: "projetos",
  },
];

/** O que cada modelo contempla (quadro "Nossos Serviços" da apresentação comercial). */
export const matrizModelos: { beneficio: string; modelos: ModeloId[] }[] = [
  { beneficio: "Atendimento sob demanda", modelos: ["pontual", "suporte", "sustentacao", "evolutivo"] },
  { beneficio: "Atendimento por agendamento", modelos: ["pontual", "suporte", "sustentacao", "evolutivo"] },
  { beneficio: "Resolução de incidentes", modelos: ["pontual", "suporte", "sustentacao", "evolutivo"] },
  { beneficio: "Especialistas dedicados", modelos: ["pontual", "suporte", "sustentacao", "evolutivo"] },
  { beneficio: "Atendimento recorrente", modelos: ["suporte", "sustentacao", "evolutivo"] },
  { beneficio: "Prioridade no atendimento", modelos: ["suporte", "sustentacao", "evolutivo"] },
  { beneficio: "Suporte multicanal", modelos: ["suporte", "sustentacao", "evolutivo"] },
  { beneficio: "SLA definido", modelos: ["suporte", "evolutivo"] },
  { beneficio: "Acompanhamento contínuo", modelos: ["sustentacao", "evolutivo"] },
  { beneficio: "Atuação preventiva", modelos: ["sustentacao", "evolutivo"] },
  { beneficio: "Atualizações programadas", modelos: ["sustentacao", "evolutivo"] },
  { beneficio: "Planejamento e roadmap", modelos: ["evolutivo"] },
  { beneficio: "Evolução do ambiente", modelos: ["evolutivo"] },
  { beneficio: "Gestão de projetos (Agile/Waterfall)", modelos: ["evolutivo", "projetos"] },
  { beneficio: "Projetos estruturados", modelos: ["evolutivo", "projetos"] },
  { beneficio: "Apoio na definição do escopo", modelos: ["evolutivo", "projetos"] },
  { beneficio: "Previsibilidade de capacidade", modelos: ["evolutivo", "projetos"] },
];

export const condicoesAtendimento = [
  "Atendimento remoto incluso",
  "Atendimento presencial mediante despesas adicionais e aprovação prévia",
  "Projetos com estimativa conforme o escopo definido pelo cliente",
  "Serviços de DBA e projetos contratados à parte dos modelos de suporte e sustentação",
];

export const metodologiaAtendimento: { titulo: string; texto: string }[] = [
  {
    titulo: "Registro",
    texto: "A solicitação é registrada pela central de chamados, e-mail, WhatsApp ou telefone, garantindo rastreabilidade.",
  },
  {
    titulo: "Classificação",
    texto: "A demanda recebe prioridade conforme criticidade e impacto operacional e segue para o especialista adequado.",
  },
  {
    titulo: "Análise e tratamento",
    texto: "Atendimento funcional e técnico nos níveis N1 a N3, com escalonamento ao fabricante quando necessário.",
  },
  {
    titulo: "Validação e encerramento",
    texto: "Intervenções em produção aprovadas pelo cliente e solução validada com a área usuária.",
  },
  {
    titulo: "Acompanhamento",
    texto: "Relatórios de atividades, horas consumidas e saldo, com identificação de recorrências e recomendações de melhoria.",
  },
];

export const prioridadesAtendimento: { nivel: string; texto: string; tom: "critico" | "alto" | "medio" | "baixo" }[] = [
  { nivel: "Crítica", texto: "Indisponibilidade de processo essencial, sem alternativa operacional viável", tom: "critico" },
  { nivel: "Alta", texto: "Impacto relevante em processo de negócio, com operação comprometida", tom: "alto" },
  { nivel: "Média", texto: "Incidente ou dificuldade operacional com alternativa de execução", tom: "medio" },
  { nivel: "Baixa", texto: "Dúvidas, orientações e solicitações sem impacto imediato na operação", tom: "baixo" },
];

export const beneficiosConsultoria: { texto: string; icone: LucideIcon }[] = [
  { texto: "Menor impacto de incidentes nas atividades diárias", icone: LifeBuoy },
  { texto: "Acesso a especialistas sem ampliar a estrutura interna", icone: UserRoundCheck },
  { texto: "Menos tempo da equipe investigando problemas recorrentes", icone: SearchCheck },
  { texto: "Atendimento estruturado, com prioridades e acompanhamento", icone: ChartGantt },
  { texto: "Previsibilidade de capacidade de atendimento", icone: Layers },
  { texto: "ERP estável, seguro e preparado para crescer", icone: ShieldCheck },
];

export const papelMaisI9 =
  "O ERP sustenta processos essenciais da empresa. A atuação da MAIS i9 é garantir que ele permaneça disponível, atualizado e preparado para acompanhar a evolução do negócio, reduzindo riscos operacionais e apoiando as equipes responsáveis pelo ambiente.";

export const faqConsultoria: { pergunta: string; resposta: string }[] = [
  {
    pergunta: "A MAIS i9 faz parte da TOTVS?",
    resposta:
      "Não. A MAIS i9 é uma empresa independente, especializada em serviços para empresas que utilizam o ERP TOTVS Protheus. TOTVS e Protheus são marcas registradas de seus respectivos titulares.",
  },
  {
    pergunta: "Quais modelos de contratação estão disponíveis?",
    resposta:
      "Pontual (por atendimento, sem horas mínimas), Suporte (franquia mensal de horas), Sustentação (bolsa de horas), Evolutivo (bolsa única de horas que combina suporte e sustentação) e Projetos (escopo fechado ou por estimativa). O modelo é definido com você, conforme o volume e o tipo de demanda.",
  },
  {
    pergunta: "Como funciona o Modelo Evolutivo?",
    resposta:
      "Ele integra suporte operacional especializado e sustentação do ambiente em uma única bolsa de horas, que você direciona às necessidades mais relevantes. As horas não utilizadas em um mês continuam disponíveis durante a vigência, e o consumo e o saldo são acompanhados em relatórios periódicos.",
  },
  {
    pergunta: "Quais são os canais de atendimento?",
    resposta:
      "Central de atendimento e registro de chamados, e-mail, WhatsApp, telefone e reuniões remotas quando necessárias. Toda solicitação é registrada para garantir rastreabilidade e controle das horas.",
  },
  {
    pergunta: "Como funciona o SLA?",
    resposta:
      "As solicitações são classificadas por criticidade (crítica, alta, média e baixa). Os tempos de primeira resposta, os horários de cobertura e as regras de escalonamento são formalizados em cada contrato. O SLA se refere ao início do atendimento; a solução pode depender da complexidade técnica, do fabricante ou de informações do cliente.",
  },
  {
    pergunta: "O atendimento é remoto ou presencial?",
    resposta: "O atendimento é predominantemente remoto, e o remoto está incluso. O atendimento presencial é possível mediante despesas adicionais e aprovação prévia.",
  },
  {
    pergunta: "Vocês desenvolvem customizações e integrações?",
    resposta:
      "Sim. A fábrica de software da MAIS i9 desenvolve customizações ADVPL/TLPP, rotinas específicas, APIs, integrações e automações. Projetos e desenvolvimentos são contratados por escopo, à parte dos modelos de suporte e sustentação.",
  },
  {
    pergunta: "A MAIS i9 atende bancos de dados Oracle e SQL Server?",
    resposta:
      "Sim. Há serviços especializados de DBA para Oracle e Microsoft SQL Server — diagnóstico de desempenho, manutenção, backup e recuperação, apoio em migrações — contratados de forma pontual ou contínua.",
  },
  {
    pergunta: "Os valores estão disponíveis no site?",
    resposta: "Não. Cada proposta é elaborada de acordo com o escopo, o volume de demandas e o modelo de atendimento. Fale com um especialista para receber a sua.",
  },
];
