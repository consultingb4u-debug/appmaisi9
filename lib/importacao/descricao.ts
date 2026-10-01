type Dados = Record<string, unknown>;

const t = (v: unknown) => (v === null || v === undefined ? "" : String(v));

/** Descrição curta de uma linha importada, para a tela de revisão. */
export function descreverLinha(entidade: string, d: Dados): string {
  switch (entidade) {
    case "Projeto":
      return `${t(d.cliente)} · ${t(d.projeto)} · ${t(d.status)}`;
    case "Alocacao":
      return `${t(d.cliente)} · ${t(d.projeto)} · ${t(d.recurso)} · ${t(d.semana)} · ${t(d.horasPrevistas) || "0"}`;
    case "Capacidade": {
      const valores = [...new Set(Object.values((d.semanas ?? {}) as Dados).filter((v) => v !== null))];
      return `${t(d.recurso)} · ${valores.length ? valores.map((v) => `${v}h`).join("/") : "sem valor"}`;
    }
    case "Indisponibilidade":
      return `${t(d.recurso)} · ${t(d.tipo)} · ${t(d.inicio)} a ${t(d.fim)}`;
    case "Cabecalho":
      return `${t(d.cliente)} · ${t(d.projeto)} · início ${t(d.inicio) || "—"} · Go Live ${t(d.goLive) || "—"}`;
    case "Backlog":
      return `${t(d["ID"])} · ${t(d["Requisito"])}`;
    case "Atividade":
      return `${t(d["ID"])} · ${t(d["Tarefa"])} · ${t(d["Recurso MAIS i9"]) || "sem recurso"} · ${t(d["Esforço Previsto (h)"])}h · ${t(d["Início Previsto"])} a ${t(d["Fim Previsto"])}`;
    case "Complexidade": {
      const notas = Object.entries(d).filter(([k, v]) => k.startsWith("nota:") && v !== null).length;
      return `Avaliador ${t(d.avaliador) || "—"} · ${notas} critério(s) respondido(s) · nível na planilha ${t(d.nivelPlanilha) || "—"}`;
    }
    case "PreProjeto":
      return `Status do pré-projeto: ${t(d.status)}`;
    case "PreProjetoItem":
      return `${t(d["Categoria"])} · ${t(d["Item / Requisito"])} · ${t(d["Status"]) || "—"}`;
    case "Operacional":
      return `${t(d["ID"])} · ${t(d["Tipo"])} · ${t(d["Descrição"])} · ${t(d["Status"])}`;
    case "TesteInterno":
    case "Uat":
      return `${t(d["ID"])} · ${t(d["Requisito"])} · ${t(d["Cenário | Passos"]).split("\n")[0].slice(0, 80)} · ${t(d["Resultado"]) || "—"}`;
    case "DeploymentItem":
      return `${t(d["Categoria"])} · ${t(d["Item"])} · ${t(d["Status"]) || "—"}`;
    case "StatusReport":
      return `${t(d["Status Executivo"]) || "—"} · ${t(d["Resumo Executivo"]).slice(0, 80)}`;
    default:
      return "";
  }
}

export const NOME_ENTIDADE: Record<string, string> = {
  Projeto: "Projeto (Portfólio)",
  Alocacao: "Alocação semanal",
  Capacidade: "Capacidade",
  Indisponibilidade: "Indisponibilidade",
  Cabecalho: "Datas do projeto",
  Backlog: "Backlog",
  Atividade: "Cronograma",
  Complexidade: "Complexidade",
  PreProjeto: "Status do pré-projeto",
  PreProjetoItem: "Checklist de pré-projeto",
  Operacional: "Operacional (RAID)",
  TesteInterno: "Teste interno",
  Uat: "UAT",
  DeploymentItem: "Checklist de deployment",
  StatusReport: "Status report",
};

export const STATUS_LOTE = {
  CARREGADO: ["Carregado", "neutro"],
  VALIDADO: ["Pronto para efetivar", "ok"],
  COM_ERROS: ["Com erros", "alerta"],
  EFETIVADO: ["Efetivado", "navy"],
  DESCARTADO: ["Descartado", "neutro"],
} as const;
