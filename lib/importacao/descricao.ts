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
};

export const STATUS_LOTE = {
  CARREGADO: ["Carregado", "neutro"],
  VALIDADO: ["Pronto para efetivar", "ok"],
  COM_ERROS: ["Com erros", "alerta"],
  EFETIVADO: ["Efetivado", "navy"],
  DESCARTADO: ["Descartado", "neutro"],
} as const;
