import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Boxes,
  Cloud,
  ChartColumn,
  ClipboardList,
  Database,
  Eye,
  Factory,
  Layers,
  MapPin,
  PackageCheck,
  Plug,
  Repeat,
  Rocket,
  Route,
  ScanBarcode,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  Warehouse,
  Workflow,
} from "lucide-react";

/*
 * Conteúdo do MAIS i9 WMS, a partir do material comercial e do modelo de proposta
 * "WMS com Protheus". Valores, preços e quantidades de pacotes comerciais NÃO são
 * publicados no site; nem números de resultado sem case que os comprove.
 */

export type Modulo = {
  id: string;
  titulo: string;
  resumo: string;
  itens: string[];
  beneficio: string;
  icone: LucideIcon;
};

export const introducaoWms =
  "Plataforma de gestão de armazéns no modelo SaaS que transforma rotinas de armazenagem em processos mais ágeis, confiáveis e conectados: visibilidade do estoque, rastreabilidade ponta a ponta e mais segurança nas decisões, do recebimento à expedição.";

/** Como o MAIS i9 WMS se conecta ao ERP. */
export const conexaoProtheus = {
  nome: "Addon MAIS i9",
  resumo: "O MAIS i9 WMS se conecta ao TOTVS Protheus por meio do Addon MAIS i9, via API.",
  /** Os dois sentidos da integração, sem listar cada integração (são muitas e variam por operação). */
  sentidos: [
    { rotulo: "Protheus → WMS", texto: "O que é planejado na gestão chega ao armazém, sem redigitação." },
    { rotulo: "WMS → Protheus", texto: "O que é executado no armazém volta ao ERP, com menos lançamentos manuais." },
  ],
  integracoes:
    "Diversas integrações disponíveis entre o Protheus e o MAIS i9 WMS, ativadas conforme os processos e os módulos utilizados pela sua operação.",
};

export const baseOperacional: Modulo[] = [
  {
    id: "recebimento",
    titulo: "Gestão de Recebimento",
    resumo: "Entrada de mercadorias com conferência integrada ao ERP e validação operacional.",
    itens: [
      "Integração de documentos fiscais e XML",
      "Conferência física",
      "Etiquetagem",
      "Lotes e validade",
      "Endereçamento automático",
      "Armazenagem em pulmão e picking",
    ],
    beneficio: "Mais eficiência e confiabilidade na entrada de mercadorias.",
    icone: PackageCheck,
  },
  {
    id: "armazem",
    titulo: "Gestão de Armazém",
    resumo: "Endereçamento inteligente e melhor aproveitamento do espaço, com rastreabilidade de cada movimento.",
    itens: [
      "Localizações e endereçamento",
      "FIFO e FEFO",
      "Pulmão e picking",
      "Transferências e reservas",
      "Estoque em trânsito e rastreabilidade",
      "Consumos não produtivos",
      "Gestão de EPIs com assinatura digital",
    ],
    beneficio: "Controle e visibilidade do que está armazenado — e onde.",
    icone: Warehouse,
  },
  {
    id: "expedicao",
    titulo: "Gestão de Expedição",
    resumo: "Separação e expedição com mais velocidade, menos erros e maior confiabilidade.",
    itens: [
      "Integração de pedidos e notas fiscais",
      "Separação e reposição de picking",
      "Conferência e checkout",
      "Torre de controle",
      "Histórico e estornos",
    ],
    beneficio: "Expedições organizadas e rastreáveis, do pedido à saída.",
    icone: Truck,
  },
  {
    id: "administrativa",
    titulo: "Gestão Administrativa",
    resumo: "Cadastros, parâmetros e permissões que estruturam a operação.",
    itens: [
      "Empresas, filiais, usuários e permissões",
      "Parâmetros e cadastros",
      "Etiquetas",
      "Mapeamento de armazéns ERP/WMS",
      "E-mail e central de ajuda",
    ],
    beneficio: "Uma operação configurada de acordo com as suas regras.",
    icone: SlidersHorizontal,
  },
  {
    id: "app-operador",
    titulo: "App Operador",
    resumo: "Aplicativo para as atividades operacionais dos processos implantados, direto no ponto da operação.",
    itens: [
      "Smartphones e coletores compatíveis",
      "Dispositivos Android já disponíveis na operação, sem coletor dedicado",
      "Leitura de códigos para confirmar itens e endereços",
      "Interface simples, intuitiva e eficiente",
    ],
    beneficio: "Menos papel e menos digitação: a operação registrada onde ela acontece.",
    icone: Smartphone,
  },
  {
    id: "indicadores",
    titulo: "Dashboards e Indicadores",
    resumo: "Visão gerencial da operação para acompanhar e decidir com base em dados.",
    itens: [
      "Capacidade e ocupação",
      "Posições de estoque",
      "Lotes e vencimentos",
      "Inventário e ordens de produção",
      "Movimentações por usuário",
      "Kanban operacional",
    ],
    beneficio: "Gestão da operação logística com informação, não com suposição.",
    icone: ChartColumn,
  },
  {
    id: "apis",
    titulo: "APIs de Integração",
    resumo: "Conexão com o TOTVS Protheus pelo Addon MAIS i9 e APIs para o ERP e demais sistemas corporativos.",
    itens: [
      "Addon MAIS i9 para o TOTVS Protheus, via API",
      "APIs para integração com outros ERPs",
      "Comunicação com demais sistemas corporativos",
      "Menos lançamentos manuais e retrabalho",
    ],
    beneficio: "Armazém e ERP falando a mesma língua.",
    icone: Plug,
  },
];

export const modulosComplementares: Modulo[] = [
  {
    id: "inventario",
    titulo: "Gestão de Inventário",
    resumo: "Contagem rápida, rastreável e auditável, para manter a acuracidade dos estoques.",
    itens: [
      "Inventários gerais e parciais",
      "Contagens às cegas",
      "Tratamento das diferenças",
      "Relatórios de acuracidade",
      "Contagens por operador",
    ],
    beneficio: "Saldos mais confiáveis para a operação e para o ERP.",
    icone: ClipboardList,
  },
  {
    id: "producao",
    titulo: "Gestão de Produção",
    resumo: "Abastecimento da fábrica com controle das movimentações.",
    itens: [
      "Ordens e abastecimento de produção",
      "Apontamentos no Protheus",
      "Produtos em processo e consumos produtivos",
      "Conferência, produtos acabados e scrap",
      "Rastreabilidade",
    ],
    beneficio: "Abastecimento da produção com controle e rastreabilidade.",
    icone: Factory,
  },
  {
    id: "entregas",
    titulo: "Gestão de Entregas e Viagens",
    resumo: "Viagens e entregas acompanhadas, com App Motorista para os motoristas das transportadoras.",
    itens: [
      "Locais de entrega e retirada",
      "Viagens",
      "Registros de entrega por texto e imagem",
      "App Motorista específico para transportadoras",
    ],
    beneficio: "A rastreabilidade continua depois que a carga sai do armazém.",
    icone: Route,
  },
  {
    id: "embalagens",
    titulo: "Gestão de Embalagens",
    resumo: "Caixas, pallets e volumes controlados como parte da operação.",
    itens: [
      "Caixas, pallets e volumes",
      "Configurações por produto",
      "Packing",
      "Montagem, desmontagem e movimentação",
      "Conferência e inventário por embalagem",
      "Bloqueios",
    ],
    beneficio: "Embalagens tratadas como parte do controle logístico.",
    icone: Boxes,
  },
];

/** "O impacto na operação" — material comercial do WMS. */
export const impactoWms: { titulo: string; texto: string; icone: LucideIcon }[] = [
  { titulo: "Estoque confiável", texto: "Acuracidade e rastreabilidade das movimentações.", icone: ShieldCheck },
  { titulo: "Mais produtividade", texto: "Automação das atividades operacionais e redução de retrabalho.", icone: TrendingUp },
  { titulo: "Menos perdas", texto: "Controle das divergências que impactam o estoque, o DRE e o fluxo de caixa.", icone: TrendingDown },
  { titulo: "Crescimento com controle", texto: "Operação preparada para aumentar o volume sem perder eficiência.", icone: Layers },
];

export const beneficiosWms: { titulo: string; icone: LucideIcon }[] = [
  { titulo: "Rastreabilidade das movimentações", icone: Route },
  { titulo: "Controle e visibilidade dos estoques", icone: Eye },
  { titulo: "Gestão de lotes e validade", icone: ShieldCheck },
  { titulo: "Endereçamento e armazenagem", icone: MapPin },
  { titulo: "Processos operacionais com mobilidade", icone: ScanBarcode },
  { titulo: "Integração entre armazém e ERP", icone: ArrowLeftRight },
  { titulo: "Redução de controles manuais", icone: ClipboardList },
  { titulo: "Mais eficiência no recebimento e na expedição", icone: PackageCheck },
  { titulo: "Melhor gestão das operações logísticas", icone: Workflow },
  { titulo: "Capacidade de expansão conforme a necessidade", icone: Layers },
];

export const diferenciaisWms: { titulo: string; texto: string; icone: LucideIcon }[] = [
  { titulo: "100% SaaS", texto: "Acesso de qualquer lugar, com segurança e alta disponibilidade.", icone: Cloud },
  {
    titulo: "Integração com ERP",
    texto: "Conexão ao TOTVS Protheus pelo Addon MAIS i9, via API, e APIs para conectar outros ERPs.",
    icone: Plug,
  },
  { titulo: "Aplicativo para operadores", texto: "Interface simples, intuitiva e eficiente para quem executa a operação.", icone: Smartphone },
  {
    titulo: "Sem coletor dedicado",
    texto: "Utilize dispositivos Android já disponíveis na operação ou coletores compatíveis.",
    icone: ScanBarcode,
  },
  { titulo: "Implantação ágil", texto: "Processo planejado com a sua equipe, com baixo impacto operacional.", icone: Rocket },
  {
    titulo: "Especialistas em logística e ERP",
    texto: "Time experiente em operações logísticas e TOTVS Protheus, focado em gerar resultados.",
    icone: Users,
  },
];

export const etapasFluxo: { titulo: string; texto: string; icone: LucideIcon }[] = [
  { titulo: "ERP", texto: "Cadastros, documentos fiscais, XML e pedidos nascem no ERP.", icone: Database },
  { titulo: "Recebimento", texto: "Conferência física, etiquetagem e registro de lote e validade.", icone: PackageCheck },
  { titulo: "Armazenagem", texto: "Endereçamento automático em pulmão e picking, com FIFO/FEFO.", icone: Warehouse },
  { titulo: "Movimentação", texto: "Transferências, reservas e reposição de picking rastreadas no App Operador.", icone: Repeat },
  { titulo: "Expedição", texto: "Separação, conferência e checkout, com retorno das informações ao ERP.", icone: Truck },
];

export const pontosIntegracao: { titulo: string; texto: string }[] = [
  {
    titulo: "Addon MAIS i9, via API",
    texto: "As informações do Protheus chegam ao WMS pelo Addon MAIS i9, sem redigitação.",
  },
  {
    titulo: "Menos lançamentos manuais",
    texto: "O que é executado no armazém retorna ao ERP, reduzindo digitação e retrabalho.",
  },
  {
    titulo: "Processos sincronizados",
    texto: "Planejamento no ERP e execução física no armazém avançando de forma coordenada.",
  },
  {
    titulo: "Rastreabilidade",
    texto: "Cada movimentação registrada com origem, destino, lote e responsável.",
  },
  {
    titulo: "Consistência entre sistemas",
    texto: "Estoques do armazém e do ERP alinhados, com menos divergências a investigar.",
  },
];

/** Contratação: assinatura SaaS + implantação por componente (sem valores). */
export const modeloContratacaoWms = {
  assinatura:
    "A assinatura SaaS dá acesso à solução completa: funcionalidades padrão, App Operador, dashboards, APIs e suporte técnico mensal por e-mail. O número de usuários acompanha a evolução da operação.",
  implantacao:
    "A implantação (Setup) define quais processos entram em operação. Ela começa pela Base Operacional e avança com os módulos complementares, conforme as prioridades do seu negócio.",
  integracao:
    "A conexão com o TOTVS Protheus é feita pelo Addon MAIS i9, via API, e já está contemplada: cada componente implantado inclui a configuração funcional e a integração correspondente. Particularidades que exijam ajustes têm o escopo apresentado previamente, para aprovação.",
};

export const etapasImplantacao: { titulo: string; texto: string }[] = [
  { titulo: "Planejamento", texto: "Levantamento dos processos, responsáveis e premissas, com os módulos escolhidos." },
  { titulo: "Configuração", texto: "Ambiente, cadastros, parâmetros e processos contratados." },
  { titulo: "Integração", texto: "Instalação do Addon MAIS i9 e testes da integração com o TOTVS Protheus." },
  { titulo: "Homologação", texto: "Validação dos fluxos operacionais com os usuários-chave." },
  { titulo: "Treinamento", texto: "Capacitação dos usuários conforme o cronograma do projeto." },
  { titulo: "Entrada em produção", texto: "Go-live e acompanhamento inicial, conforme o planejamento aprovado." },
];

export const papelWms =
  "Mais do que controlar estoques, o MAIS i9 WMS transforma a logística em uma operação previsível, auditável e orientada por dados, reduzindo perdas e apoiando o crescimento sustentável da empresa.";

export const faqWms: { pergunta: string; resposta: string }[] = [
  {
    pergunta: "O MAIS i9 WMS é um produto da TOTVS?",
    resposta:
      "Não. O MAIS i9 WMS é um produto próprio, desenvolvido e mantido pela MAIS i9, que se conecta ao TOTVS Protheus pelo Addon MAIS i9, via API. TOTVS e Protheus são marcas registradas de seus respectivos titulares.",
  },
  {
    pergunta: "Funciona apenas com o TOTVS Protheus?",
    resposta:
      "Com o TOTVS Protheus, a conexão é feita pelo Addon MAIS i9, via API. Para outros ERPs e sistemas corporativos, o MAIS i9 WMS disponibiliza APIs, e o escopo da integração é avaliado com a sua equipe antes do projeto.",
  },
  {
    pergunta: "Como o MAIS i9 WMS é contratado?",
    resposta:
      "Por assinatura SaaS, que dá acesso à solução completa, e pela implantação (Setup) dos componentes colocados em operação. A Base Operacional é a etapa inicial; os módulos complementares entram conforme a necessidade. Os valores são apresentados em proposta.",
  },
  {
    pergunta: "Como funciona a conexão com o Protheus?",
    resposta:
      "Pelo Addon MAIS i9, via API, que faz parte da implantação de cada componente. Se forem identificadas particularidades que exijam ajustes, o escopo é apresentado previamente para aprovação.",
  },
  {
    pergunta: "Quais equipamentos são necessários?",
    resposta:
      "O App Operador funciona em smartphones e coletores compatíveis — é possível usar dispositivos Android já disponíveis na operação. Impressoras de etiquetas e demais equipamentos são definidos conforme os processos implantados.",
  },
  {
    pergunta: "O que o suporte da assinatura cobre?",
    resposta:
      "A assinatura inclui suporte técnico mensal por e-mail para dúvidas e solicitações sobre as funcionalidades padrão. Projetos adicionais, novos módulos, treinamentos extras e ajustes específicos são avaliados à parte.",
  },
  {
    pergunta: "Quais aplicativos estão disponíveis?",
    resposta:
      "O App Operador, para as atividades do armazém, faz parte da base operacional. O App Motorista, para os motoristas das transportadoras, acompanha o módulo de Gestão de Entregas e Viagens.",
  },
];

/** Opções do formulário de demonstração. */
export const opcoesErp = [
  { valor: "protheus", rotulo: "TOTVS Protheus" },
  { valor: "outro", rotulo: "Outro ERP" },
  { valor: "nenhum", rotulo: "Não utilizamos ERP" },
];

export const opcoesUsuarios = [
  { valor: "ate-10", rotulo: "Até 10 usuários" },
  { valor: "11-30", rotulo: "De 11 a 30 usuários" },
  { valor: "31-100", rotulo: "De 31 a 100 usuários" },
  { valor: "acima-100", rotulo: "Mais de 100 usuários" },
  { valor: "nao-sei", rotulo: "Ainda não sei" },
];

/**
 * Telas reais do MAIS i9 WMS (prioridade sobre as ilustrações), capturadas do ambiente de demonstração.
 * Coloque os arquivos em `public/wms/` e informe aqui; enquanto for `null`,
 * o site exibe a representação ilustrativa da interface.
 * Na tela do dashboard foram apagadas as linhas de valor em reais (o site não publica valores).
 */
export type TelaReal = { src: string; largura: number; altura: number; descricao: string };

/** Teaser em vídeo (sem som), montado a partir das demonstrações gravadas, sem dados de clientes nem valores. */
export type VideoTeaser = { webm: string; mp4: string; poster: string; largura: number; altura: number; descricao: string };

export const teaserWms: VideoTeaser = {
  webm: "/wms/teaser-wms.webm",
  mp4: "/wms/teaser-wms.mp4",
  poster: "/wms/teaser-wms-poster.jpg",
  largura: 1280,
  altura: 720,
  descricao:
    "Teaser do MAIS i9 WMS: entrada da nota, conferência e endereçamento no coletor, liberação da ordem de venda, separação, embalagem, torre de controle de expedição e devolução, com dados de demonstração.",
};

export type ChaveTela = "dashboard" | "appOperador" | "appOperadorConsulta" | "operacional" | "torreExpedicao" | "appMotorista";

export const telasReais: Record<ChaveTela, TelaReal | null> = {
  dashboard: {
    src: "/wms/dashboard-controle-de-lote.png",
    largura: 1708,
    altura: 904,
    descricao:
      "Dashboard de controle de lotes do MAIS i9 WMS: lotes aptos, críticos e em alerta, vencimentos, estratégia FIFO/FEFO e produtos com mais lotes.",
  },
  appOperador: {
    src: "/wms/app-operador-tarefas.png",
    largura: 344,
    altura: 798,
    descricao:
      "App Operador do MAIS i9 WMS: conferência e armazenagem de recebimento, armazenagem de produção, transferências, separação e picking.",
  },
  appOperadorConsulta: {
    src: "/wms/app-operador-consulta.png",
    largura: 346,
    altura: 802,
    descricao: "Consulta por produto no App Operador do MAIS i9 WMS: localização, capacidade, quantidade atual e reservas.",
  },
  operacional: {
    src: "/wms/portal-aplicacoes-wms.png",
    largura: 1866,
    altura: 882,
    descricao:
      "Portal do MAIS i9 WMS com os módulos organizados por processo: configuração, recebimento, expedição, produção, movimentação, inventário, viagens e dashboards.",
  },
  torreExpedicao: {
    src: "/wms/torre-controle-expedicao.png",
    largura: 1862,
    altura: 584,
    descricao:
      "Torre Controle de Expedição do MAIS i9 WMS: pedidos do ERP por etapa — pendentes, separação e expedição —, com status no ERP e atualização automática.",
  },
  appMotorista: null,
};
