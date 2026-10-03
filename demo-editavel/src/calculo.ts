// Cálculos da demo: os mesmos do app (rateio, capacidade, prazos, alertas), a partir do estado em memória.
import {
  alertasAtividades,
  alertasIndisponibilidades,
  alertasPendencias,
  alertasSobrecarga,
  ausenciasPorDia,
  capacidadeDaSemana,
  chaveDia,
  faixaUtilizacao,
  feriadosNacionais,
  itemAberto,
  itemVencido,
  ordenarAlertas,
  parseDia,
  progresso,
  ratearHoras,
  semanaDe,
  semanaPorId,
  semanasEntre,
  severidade,
  situacaoPrazo,
  somarDias,
  STATUS_ATIVOS,
  TIPO_INDISPONIBILIDADE,
  type Alerta,
  type FaixaUtilizacao,
  type SemanaIso,
  type StatusItem,
  type StatusOp,
} from "./dominio";

export type Recurso = { id: string; nome: string; cargo?: string | null; area?: string | null; ativo: boolean; horasSemanais: number };
export type Cliente = { id: string; nome: string };
export type Projeto = {
  id: string;
  codigo: string;
  nome: string;
  clienteId: string;
  gpId: string | null;
  tipo: string;
  status: string;
  prioridade: string;
  statusExecutivo: string | null;
  kickoff: string | null;
  goLive: string | null;
  horasVendidas: number | null;
  notas: string | null;
};
export type Atribuicao = { recursoId: string; esforco: number; realizado: number };
export type Atividade = {
  id: string;
  projetoId: string;
  codigo: string;
  fase: string;
  tarefa: string;
  inicio: string | null;
  fim: string | null;
  status: StatusItem;
  percentual: number;
  marco: boolean;
  ordem: number;
  atribuicoes: Atribuicao[];
};
export type ItemOp = {
  id: string;
  projetoId: string;
  codigo: string;
  tipo: string;
  descricao: string;
  responsavelId: string | null;
  responsavelTexto: string | null;
  abertura: string | null;
  prazo: string | null;
  status: StatusOp;
  probabilidade: number | null;
  impacto: number | null;
  horasCr: number | null;
  diasCr: number | null;
};
export type Alocacao = { id: string; projetoId: string; recursoId: string; semana: string; horas: number };
export type Indisp = { id: string; recursoId: string; tipo: string; inicio: string; fim: string; status: string; observacao: string | null };

export type Estado = {
  recursos: Recurso[];
  clientes: Cliente[];
  projetos: Projeto[];
  atividades: Atividade[];
  operacional: ItemOp[];
  alocacoes: Alocacao[];
  indisponibilidades: Indisp[];
};

export const COLECOES = ["recursos", "clientes", "projetos", "atividades", "operacional", "alocacoes", "indisponibilidades"] as const;
export type Colecao = (typeof COLECOES)[number];

export const FERIADOS = new Map<string, string>(
  [2025, 2026, 2027, 2028].flatMap((a) => feriadosNacionais(a).map((f) => [chaveDia(f.data), f.descricao] as [string, string])),
);
const FER = new Set(FERIADOS.keys());

const d = (s: string | null | undefined) => parseDia(s ?? null);

export type AtividadeCalc = Atividade & { previsto: number; realizado: number; falta: number; forecast: number; situacao: ReturnType<typeof situacaoPrazo> };
export type ProjetoCalc = Projeto & {
  cliente: string;
  gp: string | null;
  atividades: AtividadeCalc[];
  progresso: number;
  previsto: number;
  realizado: number;
  forecast: number;
  atrasadas: number;
  riscosAltos: number;
  pendenciasVencidas: number;
  proximas4: number;
};
export type CargaCelula = { horas: number; projetos: Map<string, number> };

export function calcular(e: Estado, hoje: Date) {
  const atual = semanaDe(hoje);
  const recursos = new Map(e.recursos.map((r) => [r.id, r]));
  const clientes = new Map(e.clientes.map((c) => [c.id, c.nome]));

  // Ausências aprovadas por recurso (horas por dia) e dias inteiros indisponíveis para o rateio.
  const ausencias = new Map<string, Map<string, number>>();
  for (const r of e.recursos) {
    const itens = e.indisponibilidades.filter((i) => i.recursoId === r.id && i.status === "APROVADA" && d(i.inicio) && d(i.fim));
    ausencias.set(r.id, ausenciasPorDia(itens.map((i) => ({ inicio: d(i.inicio)!, fim: d(i.fim)!, horasPorDia: null }))));
  }
  const indisponiveis = (recursoId: string) => {
    const horasDia = (recursos.get(recursoId)?.horasSemanais ?? 40) / 5;
    const aus = ausencias.get(recursoId) ?? new Map<string, number>();
    return new Set([...FER, ...[...aus.entries()].filter(([, h]) => h >= horasDia).map(([k]) => k)]);
  };

  const carga = new Map<string, Map<string, CargaCelula>>();
  const somar = (recursoId: string, semana: string, projetoId: string, horas: number) => {
    if (horas <= 0) return;
    const porSemana = carga.get(recursoId) ?? new Map<string, CargaCelula>();
    carga.set(recursoId, porSemana);
    const c = porSemana.get(semana) ?? { horas: 0, projetos: new Map() };
    porSemana.set(semana, c);
    c.horas = Math.round((c.horas + horas) * 10) / 10;
    c.projetos.set(projetoId, Math.round(((c.projetos.get(projetoId) ?? 0) + horas) * 10) / 10);
  };

  const ativs: AtividadeCalc[] = e.atividades.map((a) => {
    const concluida = a.status === "CONCLUIDO";
    const previsto = a.atribuicoes.reduce((t, x) => t + (x.esforco || 0), 0);
    const realizado = a.atribuicoes.reduce((t, x) => t + (x.realizado || 0), 0);
    const falta = concluida || a.status === "CANCELADO" ? 0 : a.atribuicoes.reduce((t, x) => t + Math.max(0, (x.esforco || 0) - (x.realizado || 0)), 0);
    // Rateio das horas que faltam nas semanas, da semana atual em diante (mesma regra do app).
    if (a.status !== "CANCELADO" && !concluida && d(a.inicio) && d(a.fim)) {
      for (const x of a.atribuicoes) {
        const horas = Math.max(0, (x.esforco || 0) - (x.realizado || 0));
        const r = ratearHoras({ inicio: d(a.inicio)!, fim: d(a.fim)!, horas, inicioJanela: atual.inicio, indisponiveis: indisponiveis(x.recursoId) });
        for (const [s, h] of Object.entries(r)) somar(x.recursoId, s, a.projetoId, h);
      }
    }
    return { ...a, previsto, realizado, falta, forecast: realizado + falta, situacao: situacaoPrazo(a.status, d(a.fim), hoje) };
  });
  for (const al of e.alocacoes) somar(al.recursoId, al.semana, al.projetoId, al.horas);

  const capacidade = (recursoId: string, s: SemanaIso) => {
    const r = recursos.get(recursoId);
    return capacidadeDaSemana(s.inicio, r?.ativo === false ? 0 : (r?.horasSemanais ?? 0), FER, ausencias.get(recursoId) ?? new Map());
  };
  const celula = (recursoId: string, s: SemanaIso) => {
    const c = carga.get(recursoId)?.get(s.id) ?? { horas: 0, projetos: new Map<string, number>() };
    const cap = capacidade(recursoId, s);
    const utilizacao = cap.liquida > 0 ? c.horas / cap.liquida : c.horas > 0 ? Infinity : null;
    const faixa: FaixaUtilizacao | null = utilizacao === null ? null : faixaUtilizacao(utilizacao);
    return { ...c, capacidade: cap, utilizacao, faixa };
  };

  const prox4 = semanasEntre(atual.inicio, somarDias(atual.inicio, 27)).map((s) => s.id);
  const projetos: ProjetoCalc[] = e.projetos.map((p) => {
    const as = ativs.filter((a) => a.projetoId === p.id).sort((a, b) => a.ordem - b.ordem || a.codigo.localeCompare(b.codigo));
    const validas = as.filter((a) => a.status !== "CANCELADO");
    const ops = e.operacional.filter((o) => o.projetoId === p.id);
    let proximas4 = 0;
    for (const porSemana of carga.values()) for (const s of prox4) proximas4 += porSemana.get(s)?.projetos.get(p.id) ?? 0;
    return {
      ...p,
      cliente: clientes.get(p.clienteId) ?? "—",
      gp: p.gpId ? (recursos.get(p.gpId)?.nome ?? null) : null,
      atividades: as,
      progresso: progresso(validas.map((a) => ({ previsto: a.previsto, percentual: a.percentual, status: a.status }))),
      previsto: Math.round(validas.reduce((t, a) => t + a.previsto, 0) * 10) / 10,
      realizado: Math.round(validas.reduce((t, a) => t + a.realizado, 0) * 10) / 10,
      forecast: Math.round(validas.reduce((t, a) => t + a.forecast, 0) * 10) / 10,
      atrasadas: validas.filter((a) => a.situacao === "ATRASADO").length,
      riscosAltos: ops.filter((o) => o.tipo === "RISCO" && itemAberto(o.status) && (o.probabilidade ?? 0) * (o.impacto ?? 0) > 9).length,
      pendenciasVencidas: ops.filter((o) => itemVencido(o.status, d(o.prazo), hoje)).length,
      proximas4: Math.round(proximas4 * 10) / 10,
    };
  });
  const projetosPorId = new Map(projetos.map((p) => [p.id, p]));

  // Alertas: as mesmas regras puras do app.
  const projAlerta = (p: ProjetoCalc) => ({ id: p.id, nome: p.nome, cliente: p.cliente, gpRecursoId: p.gpId });
  const ativosIds = new Set(projetos.filter((p) => STATUS_ATIVOS.includes(p.status as never)).map((p) => p.id));
  const semanasAlerta = semanasEntre(atual.inicio, somarDias(atual.inicio, 13));
  const alertas: Alerta[] = ordenarAlertas([
    ...alertasAtividades(
      ativs
        .filter((a) => ativosIds.has(a.projetoId) && a.situacao === "ATRASADO")
        .map((a) => ({ id: a.id, codigo: a.codigo, tarefa: a.tarefa, fimPrevisto: d(a.fim)!, projeto: projAlerta(projetosPorId.get(a.projetoId)!), recursos: a.atribuicoes.map((x) => x.recursoId) })),
      hoje,
    ),
    ...alertasPendencias(
      e.operacional
        .filter((o) => ativosIds.has(o.projetoId) && itemVencido(o.status, d(o.prazo), hoje))
        .map((o) => ({ id: o.id, codigo: o.codigo, tipo: o.tipo, descricao: o.descricao, prazo: d(o.prazo)!, responsavelId: o.responsavelId, projeto: projAlerta(projetosPorId.get(o.projetoId)!) })),
      hoje,
    ),
    ...alertasSobrecarga(
      e.recursos
        .filter((r) => r.ativo)
        .flatMap((r) =>
          semanasAlerta.map((s) => {
            const c = celula(r.id, s);
            return { recursoId: r.id, nome: r.nome, semana: s, planejado: c.horas, capacidade: c.capacidade.liquida };
          }),
        ),
    ),
    ...alertasIndisponibilidades(
      e.indisponibilidades
        .filter((i) => i.status === "PENDENTE")
        .map((i) => ({ id: i.id, recurso: recursos.get(i.recursoId)?.nome ?? "—", tipo: TIPO_INDISPONIBILIDADE[i.tipo as keyof typeof TIPO_INDISPONIBILIDADE] ?? i.tipo, inicio: d(i.inicio)!, fim: d(i.fim)! })),
    ),
  ]);

  return { atual, recursos, projetos, projetosPorId, celula, alertas, severidade };
}

export type Calculo = ReturnType<typeof calcular>;

export function janela(inicioId: string, n: number): SemanaIso[] {
  const s = semanaPorId(inicioId) ?? semanaDe(new Date());
  return semanasEntre(s.inicio, somarDias(s.inicio, 7 * n - 1));
}
