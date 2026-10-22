import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Boxes,
  ChartColumn,
  ClipboardList,
  Database,
  Factory,
  Eye,
  Layers,
  MapPin,
  PackageCheck,
  Plug,
  Route,
  ScanBarcode,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Truck,
  Warehouse,
  Workflow,
  Repeat,
} from "lucide-react";

/*
 * Descrições funcionais do MAIS i9 WMS. Escritas a partir do escopo do produto
 * (base operacional + módulos complementares). Validar com o time de produto
 * antes da publicação e não incluir funcionalidades não confirmadas.
 */

export type Modulo = {
  id: string;
  titulo: string;
  resumo: string;
  itens: string[];
  beneficio: string;
  icone: LucideIcon;
};

export const baseOperacional: Modulo[] = [
  {
    id: "recebimento",
    titulo: "Gestão de Recebimento",
    resumo: "Entrada de mercadorias com conferência e registro desde a chegada ao armazém.",
    itens: [
      "Recebimento a partir dos documentos de entrada integrados ao ERP",
      "Conferência de itens e quantidades com apoio do App Operador",
      "Registro de lotes e datas de validade",
      "Identificação de divergências antes da armazenagem",
    ],
    beneficio: "Mais eficiência e confiabilidade na entrada de mercadorias.",
    icone: PackageCheck,
  },
  {
    id: "armazem",
    titulo: "Gestão de Armazém",
    resumo: "Organização física do estoque com endereçamento e visibilidade dos saldos.",
    itens: [
      "Estrutura de endereços do armazém",
      "Armazenagem orientada por endereço",
      "Movimentações internas registradas",
      "Consulta de saldos por endereço, lote e validade",
    ],
    beneficio: "Controle e visibilidade do que está armazenado — e onde.",
    icone: Warehouse,
  },
  {
    id: "expedicao",
    titulo: "Gestão de Expedição",
    resumo: "Separação, conferência e saída de mercadorias com controle de ponta a ponta.",
    itens: [
      "Pedidos de saída recebidos do ERP",
      "Separação orientada por tarefas no App Operador",
      "Conferência antes da saída",
      "Rastreabilidade do que foi expedido, inclusive por lote",
    ],
    beneficio: "Expedições mais organizadas e com menos erros manuais.",
    icone: Truck,
  },
  {
    id: "administrativa",
    titulo: "Gestão Administrativa",
    resumo: "Cadastros, parâmetros, usuários e permissões que estruturam a operação.",
    itens: [
      "Cadastros de produtos, endereços e estruturas",
      "Usuários, perfis e permissões de acesso",
      "Parâmetros que adaptam o WMS aos processos da operação",
      "Histórico das movimentações para consulta e auditoria",
    ],
    beneficio: "Uma operação configurada de acordo com as suas regras.",
    icone: SlidersHorizontal,
  },
  {
    id: "app-operador",
    titulo: "App Operador",
    resumo: "Execução das tarefas do armazém com mobilidade, direto no ponto da operação.",
    itens: [
      "Tarefas de recebimento, armazenagem, movimentação e expedição",
      "Leitura de códigos para confirmar itens e endereços",
      "Registro das operações no momento da execução",
      "Interface pensada para a rotina do armazém",
    ],
    beneficio: "Menos papel e menos digitação: a operação registrada onde ela acontece.",
    icone: Smartphone,
  },
  {
    id: "indicadores",
    titulo: "Dashboards e Indicadores",
    resumo: "Visão gerencial da operação para acompanhar e decidir com base em dados.",
    itens: [
      "Acompanhamento de recebimentos, armazenagem e expedições",
      "Visibilidade dos estoques por endereço, lote e validade",
      "Indicadores operacionais para a gestão",
      "Informação consolidada para priorizar ações",
    ],
    beneficio: "Gestão da operação logística com informação, não com suposição.",
    icone: ChartColumn,
  },
  {
    id: "apis",
    titulo: "APIs de Integração",
    resumo: "Integração padrão com o TOTVS Protheus e APIs para conectar outros sistemas.",
    itens: [
      "Pacote padrão de integração com o TOTVS Protheus",
      "APIs para integração com outros ERPs",
      "Troca de informações entre o ERP e a operação física",
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
    resumo: "Contagens organizadas para manter a acuracidade dos estoques.",
    itens: [
      "Inventários executados com apoio do App Operador",
      "Contagens por endereço e por produto",
      "Tratamento das diferenças encontradas",
    ],
    beneficio: "Saldos mais confiáveis para a operação e para o ERP.",
    icone: ClipboardList,
  },
  {
    id: "producao",
    titulo: "Gestão de Produção",
    resumo: "Conexão entre o armazém e as áreas produtivas.",
    itens: [
      "Movimentações de materiais entre armazém e produção",
      "Rastreabilidade de insumos e produtos",
      "Visibilidade do material disponível para produzir",
    ],
    beneficio: "Abastecimento da produção com controle e rastreabilidade.",
    icone: Factory,
  },
  {
    id: "entregas",
    titulo: "Gestão de Entregas e Viagens",
    resumo: "Organização das viagens e acompanhamento das entregas, com App Motorista.",
    itens: [
      "Organização de viagens e entregas",
      "App Motorista para registro das entregas",
      "Acompanhamento do status de cada entrega",
    ],
    beneficio: "A rastreabilidade continua depois que a carga sai do armazém.",
    icone: Route,
  },
  {
    id: "embalagens",
    titulo: "Gestão de Embalagens",
    resumo: "Controle das embalagens utilizadas na operação.",
    itens: [
      "Registro das embalagens movimentadas",
      "Visibilidade de saldos e utilização",
      "Apoio à rastreabilidade das expedições",
    ],
    beneficio: "Embalagens tratadas como parte do controle logístico.",
    icone: Boxes,
  },
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

export const etapasFluxo: { titulo: string; texto: string; icone: LucideIcon }[] = [
  { titulo: "ERP", texto: "Cadastros, documentos de entrada e pedidos de saída nascem no ERP.", icone: Database },
  { titulo: "Recebimento", texto: "Conferência das mercadorias, com registro de lote e validade.", icone: PackageCheck },
  { titulo: "Armazenagem", texto: "Cada item guardado em um endereço definido e registrado.", icone: Warehouse },
  { titulo: "Movimentação", texto: "Transferências e reabastecimentos rastreados no App Operador.", icone: Repeat },
  { titulo: "Expedição", texto: "Separação, conferência e saída, com retorno das informações ao ERP.", icone: Truck },
];

export const pontosIntegracao: { titulo: string; texto: string }[] = [
  {
    titulo: "Integração de informações",
    texto: "Cadastros, documentos e pedidos do Protheus chegam ao WMS sem redigitação.",
  },
  {
    titulo: "Menos lançamentos manuais",
    texto: "O que é executado no armazém retorna ao ERP, reduzindo digitação e retrabalho.",
  },
  {
    titulo: "Processos sincronizados",
    texto: "Planejamento no ERP e execução física no WMS avançam de forma coordenada.",
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

export const faqWms: { pergunta: string; resposta: string }[] = [
  {
    pergunta: "O MAIS i9 WMS é um produto da TOTVS?",
    resposta:
      "Não. O MAIS i9 WMS é um produto próprio, desenvolvido e mantido pela MAIS i9. Ele possui um pacote padrão de integração com o ERP TOTVS Protheus. TOTVS e Protheus são marcas registradas de seus respectivos titulares.",
  },
  {
    pergunta: "Funciona apenas com o TOTVS Protheus?",
    resposta:
      "O MAIS i9 WMS tem integração padrão com o TOTVS Protheus e disponibiliza APIs para integração com outros ERPs. Nesses casos, o escopo da integração é avaliado com a sua equipe no início do projeto.",
  },
  {
    pergunta: "Como o MAIS i9 WMS é contratado?",
    resposta:
      "No modelo SaaS. Base operacional e módulos complementares fazem parte do produto padrão, e a implantação é dimensionada conforme os processos e módulos utilizados pela sua operação.",
  },
  {
    pergunta: "Quais aplicativos estão disponíveis?",
    resposta:
      "O App Operador, para a execução das tarefas do armazém, faz parte da base operacional. O App Motorista acompanha o módulo de Gestão de Entregas e Viagens.",
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
 * Telas reais do MAIS i9 WMS (prioridade sobre as ilustrações).
 * Coloque os arquivos em `public/wms/` e informe aqui; enquanto for `null`,
 * o site exibe a representação ilustrativa da interface.
 */
export type TelaReal = { src: string; largura: number; altura: number; descricao: string };

export const telasReais: Record<"dashboard" | "appOperador" | "operacional" | "indicadores" | "appMotorista", TelaReal | null> = {
  dashboard: null,
  appOperador: null,
  operacional: null,
  indicadores: null,
  appMotorista: null,
};
