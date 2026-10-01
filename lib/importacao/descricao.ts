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
    default:
      return "";
  }
}

export const NOME_ENTIDADE: Record<string, string> = {
  Projeto: "Projeto (Portfólio)",
  Alocacao: "Alocação semanal",
  Capacidade: "Capacidade",
  Indisponibilidade: "Indisponibilidade",
};

export const STATUS_LOTE = {
  CARREGADO: ["Carregado", "neutro"],
  VALIDADO: ["Pronto para efetivar", "ok"],
  COM_ERROS: ["Com erros", "alerta"],
  EFETIVADO: ["Efetivado", "navy"],
  DESCARTADO: ["Descartado", "neutro"],
} as const;
