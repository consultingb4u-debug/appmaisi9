// Conteúdo-padrão trazido do CTRL-001 v1.9: critérios de complexidade e checklists-modelo.
// O seed grava os critérios; os checklists são aplicados por projeto ("Aplicar modelo").

export type Dimensao = "ESFORCO" | "PRAZO" | "COMPLEXIDADE" | "RISCO";

export const CRITERIOS_COMPLEXIDADE: { dimensao: Dimensao; nome: string; d: [string, string, string, string] }[] = [
  { dimensao: "ESFORCO", nome: "Horas técnicas", d: ["Até 40h", "41-120h", "121-360h", ">360h"] },
  { dimensao: "ESFORCO", nome: "Equipe MAIS i9", d: ["1", "2", "3-4", "5+"] },
  { dimensao: "PRAZO", nome: "Duração", d: ["Até 2 sem.", "3-6 sem.", "7-12 sem.", "13-26 sem."] },
  { dimensao: "COMPLEXIDADE", nome: "Módulos | processos", d: ["1", "2", "3-4", "5+"] },
  { dimensao: "COMPLEXIDADE", nome: "Integrações", d: ["Nenhuma", "1 simples", "2-3", "4+ | crítica"] },
  { dimensao: "COMPLEXIDADE", nome: "Unidades | filiais", d: ["1", "2", "3-5", "6+"] },
  { dimensao: "COMPLEXIDADE", nome: "Customização", d: ["Padrão", "Baixa", "Média", "Alta | estrutural"] },
  { dimensao: "RISCO", nome: "Dependência terceiros", d: ["Nenhuma", "Baixa", "1 crítico", "Múltiplos críticos"] },
  { dimensao: "RISCO", nome: "Criticidade cliente", d: ["Baixa", "Operacional", "Financeira | fiscal", "Core | regulatória"] },
  { dimensao: "RISCO", nome: "Impacto produção", d: ["Nenhum", "Baixo", "Relevante", "Parada crítica"] },
  { dimensao: "RISCO", nome: "Maturidade escopo", d: ["Definido", "Pequenas lacunas", "Parcial", "Discovery relevante"] },
  { dimensao: "RISCO", nome: "Rollback", d: ["Simples | testado", "Simples", "Complexo", "Sem rollback seguro"] },
];

export const MODELO_PRE_PROJETO: { categoria: string; item: string; responsavel: string; validacaoEsperada: string; observacao?: string }[] = [
  { categoria: "Equipe", item: "Sponsor, GP e Key Users definidos", responsavel: "Cliente", validacaoEsperada: "Confirmado", observacao: "Definir responsáveis formais antes do kick-off" },
  { categoria: "Acessos", item: "Acessos nominais necessários ao escopo", responsavel: "TI Cliente", validacaoEsperada: "Testado" },
  { categoria: "Ambiente", item: "Ambientes e versão/release identificados", responsavel: "TI Cliente", validacaoEsperada: "Confirmado" },
  { categoria: "Governança", item: "Canal e repositório oficial definidos", responsavel: "GP Cliente / MAIS i9", validacaoEsperada: "Definido" },
  { categoria: "Agenda", item: "Kick-off e agendas iniciais confirmadas", responsavel: "GP Cliente / MAIS i9", validacaoEsperada: "Confirmado" },
  { categoria: "Escopo", item: "Informações mínimas para Envisioning disponíveis", responsavel: "Cliente / MAIS i9", validacaoEsperada: "Validado" },
  { categoria: "Liberação", item: "Pendências críticas resolvidas ou aceitas", responsavel: "GP MAIS i9", validacaoEsperada: "Validado" },
];

export const MODELO_DEPLOYMENT: { categoria: string; item: string; obrigatorio: "SIM" | "NAO" | "CONDICIONAL" }[] = [
  { categoria: "Escopo | Qualidade", item: "Requisitos concluídos ou exceções aprovadas", obrigatorio: "SIM" },
  { categoria: "Escopo | Qualidade", item: "UAT e testes críticos aprovados", obrigatorio: "SIM" },
  { categoria: "Escopo | Qualidade", item: "Defeitos críticos encerrados", obrigatorio: "SIM" },
  { categoria: "Dados | Acessos", item: "Carga/conversão de dados validada", obrigatorio: "CONDICIONAL" },
  { categoria: "Dados | Acessos", item: "Usuários, perfis e permissões validados", obrigatorio: "SIM" },
  { categoria: "Integrações", item: "Endpoints, certificados e integrações validados", obrigatorio: "CONDICIONAL" },
  { categoria: "Infraestrutura", item: "Backup e rollback definidos", obrigatorio: "CONDICIONAL" },
  { categoria: "Deploy", item: "Pacote e sequência de implantação definidos", obrigatorio: "SIM" },
  { categoria: "Deploy", item: "Smoke test pós-deploy definido", obrigatorio: "SIM" },
  { categoria: "Comunicação", item: "Data e janela comunicadas", obrigatorio: "SIM" },
  { categoria: "Suporte", item: "Hypercare e contatos definidos", obrigatorio: "SIM" },
  { categoria: "Decisão", item: "Go/No-Go aprovado", obrigatorio: "SIM" },
];
