// Regras do cronograma (puras). Fórmulas de referência: CTRL-001, aba Cronograma e Auditoria CTRL-003.
import { chaveDia, diffDias, ehFimDeSemana, paraDia, somarDias } from "./datas";
import { semanaDe } from "./semanas";

/** Dias úteis entre as datas (inclusive), sem fins de semana e sem os dias em `indisponiveis` ("AAAA-MM-DD"). */
export function diasUteisEntre(inicio: Date, fim: Date, indisponiveis: Set<string> = new Set()): Date[] {
  const dias: Date[] = [];
  for (let d = paraDia(inicio); d <= fim; d = somarDias(d, 1)) if (!ehFimDeSemana(d) && !indisponiveis.has(chaveDia(d))) dias.push(d);
  return dias;
}

const meia = (n: number) => Math.round(n * 2) / 2;

/**
 * Distribui as horas de uma atribuição nas semanas (requisito 11 / proposta D.5):
 * - período = de max(início, segunda da semana atual) até o fim previsto;
 * - proporcional aos dias úteis do recurso (sem fins de semana, feriados e ausências);
 * - arredonda em 0,5 h e acerta a diferença na última semana;
 * - atividade já vencida e não concluída: o que falta vai para a semana atual;
 * - sem nenhum dia útil no período: ignora feriados/ausências; se ainda assim não houver, usa a semana do fim.
 * Retorna { semanaId: horas } só com semanas > 0.
 */
export function ratearHoras(p: { inicio: Date; fim: Date; horas: number; inicioJanela: Date; indisponiveis?: Set<string> }): Record<string, number> {
  if (p.horas <= 0) return {};
  const janela = paraDia(p.inicioJanela);
  if (p.fim < janela) return { [semanaDe(janela).id]: meia(p.horas) || p.horas };
  const de = p.inicio > janela ? paraDia(p.inicio) : janela;
  let dias = diasUteisEntre(de, p.fim, p.indisponiveis);
  if (dias.length === 0) dias = diasUteisEntre(de, p.fim);
  if (dias.length === 0) return { [semanaDe(p.fim).id]: p.horas };

  const porSemana = new Map<string, number>();
  for (const d of dias) {
    const id = semanaDe(d).id;
    porSemana.set(id, (porSemana.get(id) ?? 0) + 1);
  }
  const semanas = [...porSemana.entries()];
  const out: Record<string, number> = {};
  let distribuido = 0;
  semanas.forEach(([id, n], i) => {
    const h = i === semanas.length - 1 ? Math.max(0, Math.round((p.horas - distribuido) * 10) / 10) : meia((p.horas * n) / dias.length);
    distribuido += h;
    if (h > 0) out[id] = h;
  });
  return out;
}

export type StatusItem = "NAO_INICIADO" | "EM_ANDAMENTO" | "BLOQUEADO" | "CONCLUIDO" | "CANCELADO";
export type SituacaoPrazo = "CONCLUIDO" | "ATRASADO" | "ATENCAO" | "NO_PRAZO";

/** Fórmula do CTRL-001: concluída; vencida → atrasada; vence em até 3 dias → atenção; senão no prazo. */
export function situacaoPrazo(status: StatusItem, fimPrevisto: Date | null, hoje: Date): SituacaoPrazo | null {
  if (status === "CONCLUIDO") return "CONCLUIDO";
  if (status === "CANCELADO" || !fimPrevisto) return null;
  const dias = diffDias(fimPrevisto, paraDia(hoje));
  if (dias < 0) return "ATRASADO";
  if (dias <= 3) return "ATENCAO";
  return "NO_PRAZO";
}

export type AtribuicaoCalc = { previsto: number; paraConcluir: number | null; realizado: number };

/** Horas que faltam da atribuição: o informado, ou previsto − realizado. */
export function faltaAtribuicao(a: AtribuicaoCalc, concluida = false): number {
  if (concluida) return 0;
  return a.paraConcluir ?? Math.max(0, a.previsto - a.realizado);
}

/** Totais da atividade: Forecast = Realizado + Para concluir; Desvio = Forecast − Previsto. */
export function totaisAtividade(atribuicoes: AtribuicaoCalc[], concluida = false) {
  const previsto = atribuicoes.reduce((t, a) => t + a.previsto, 0);
  const realizado = atribuicoes.reduce((t, a) => t + a.realizado, 0);
  const paraConcluir = atribuicoes.reduce((t, a) => t + faltaAtribuicao(a, concluida), 0);
  const forecast = realizado + paraConcluir;
  return { previsto, realizado, paraConcluir, forecast, desvio: forecast - previsto };
}

/** Progresso ponderado pelo esforço previsto (decisão de negócio); sem esforço algum, média simples. Canceladas não contam. */
export function progresso(itens: { previsto: number; percentual: number; status: StatusItem }[]): number {
  const validos = itens.filter((i) => i.status !== "CANCELADO");
  if (validos.length === 0) return 0;
  const peso = validos.reduce((t, i) => t + i.previsto, 0);
  const v = peso > 0 ? validos.reduce((t, i) => t + i.previsto * i.percentual, 0) / peso : validos.reduce((t, i) => t + i.percentual, 0) / validos.length;
  return Math.round(v * 10) / 10;
}

/** Status e % andam juntos: concluída ⇒ 100%; 100% ⇒ concluída; % > 0 em "não iniciada" ⇒ em andamento. */
export function coerenciaStatus(status: StatusItem, percentual: number): { status: StatusItem; percentual: number } {
  const pct = Math.max(0, Math.min(100, Math.round(percentual)));
  if (status === "CONCLUIDO") return { status, percentual: 100 };
  if (pct === 100 && status !== "CANCELADO") return { status: "CONCLUIDO", percentual: 100 };
  if (pct > 0 && status === "NAO_INICIADO") return { status: "EM_ANDAMENTO", percentual: pct };
  return { status, percentual: pct };
}

export type AtividadeQualidade = {
  id: string;
  codigo: string;
  tarefa: string;
  status: StatusItem;
  inicio: Date | null;
  fim: Date | null;
  clienteParticipa: boolean;
  responsavelId: string | null;
  observacao: string | null;
  atribuicoes: { recursoId: string; previsto: number; realizado: number }[];
};

export type AlertaQualidade = { atividadeId: string; codigo: string; mensagem: string };

/**
 * Regras da aba "Auditoria CTRL-003" que continuam fazendo sentido no sistema.
 * (Fase inválida, recurso fora da lista, vários recursos na célula e fim < início são impedidos na edição.)
 */
export function qualidadeCronograma(atividades: AtividadeQualidade[]): AlertaQualidade[] {
  const out: AlertaQualidade[] = [];
  const add = (a: AtividadeQualidade, mensagem: string) => out.push({ atividadeId: a.id, codigo: a.codigo, mensagem });
  const vistas = new Map<string, string>();
  for (const a of atividades) {
    if (a.status === "CANCELADO") continue;
    if (!a.inicio || !a.fim) add(a, "Sem datas: não entra na capacidade.");
    else if (ehFimDeSemana(a.inicio) || ehFimDeSemana(a.fim)) add(a, "Início ou fim em fim de semana.");
    if (a.atribuicoes.length === 0 && !a.clienteParticipa) add(a, "Sem recurso MAIS i9 nem participação do cliente.");
    for (const at of a.atribuicoes) if (at.previsto <= 0) add(a, "Recurso sem esforço previsto.");
    if (a.status === "CONCLUIDO" && a.atribuicoes.length > 0 && a.atribuicoes.every((at) => at.realizado === 0)) add(a, "Concluída sem horas apontadas.");
    if (a.responsavelId && a.atribuicoes.length > 0 && !a.atribuicoes.some((at) => at.recursoId === a.responsavelId) && !a.observacao)
      add(a, "Responsável diferente do executor, sem observação.");
    const chave = `${a.tarefa.trim().toLowerCase()}|${a.inicio?.getTime() ?? ""}`;
    if (vistas.has(chave)) add(a, `Possível duplicidade de ${vistas.get(chave)}.`);
    else vistas.set(chave, a.codigo);
  }
  return out;
}

/** Próximo código sequencial dado o prefixo ("CRON", "REQ"): CRON-001, CRON-002… */
export function proximoCodigo(prefixo: string, existentes: string[]): string {
  const max = existentes.reduce((m, c) => {
    const n = Number(/^[A-Z]+-(\d+)/.exec(c)?.[1] ?? 0);
    return n > m ? n : m;
  }, 0);
  return `${prefixo}-${String(max + 1).padStart(3, "0")}`;
}
