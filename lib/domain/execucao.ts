// Regras puras do incremento 5: complexidade (Pré-Projeto), riscos/RAID, testes e prontidão Go/No-Go.
// Fórmulas de referência: CTRL-001, abas "Pré-Projeto | Complexidade", "Operacional", "Teste Interno",
// "Teste Cliente | UAT" e "Deployment".
import { diffDias, paraDia } from "./datas";

// ───────────────────────────── Complexidade ─────────────────────────────

export type Nivel = "N1" | "N2" | "N3" | "N4";

export const GOVERNANCA: Record<Nivel, string> = {
  N1: "Execução Direta",
  N2: "Gestão Leve",
  N3: "Gestão Parcial",
  N4: "Gestão Integral",
};

const ORDEM_NIVEL: Nivel[] = ["N1", "N2", "N3", "N4"];

/** Nível base pela soma das notas (12 critérios × 0–3 = 0–36): ≤8 N1, ≤16 N2, ≤24 N3, senão N4. */
export function nivelBase(score: number): Nivel {
  if (score <= 8) return "N1";
  if (score <= 16) return "N2";
  if (score <= 24) return "N3";
  return "N4";
}

/** Gatilho crítico = critério com nota 3 marcado como crítico. 1 gatilho ⇒ mínimo N3; 2 ou mais ⇒ N4. */
export function nivelMinimo(gatilhos: number): Nivel {
  if (gatilhos >= 2) return "N4";
  if (gatilhos === 1) return "N3";
  return "N1";
}

export type NotaCriterio = { nota: number | null; gatilhoCritico: boolean };

export type ResultadoComplexidade = {
  avaliado: boolean;
  respondidos: number;
  score: number;
  gatilhos: number;
  base: Nivel | null;
  minimo: Nivel | null;
  final: Nivel | null;
  governanca: string | null;
};

export function avaliarComplexidade(notas: NotaCriterio[]): ResultadoComplexidade {
  const respondidas = notas.filter((n) => n.nota !== null);
  if (respondidas.length === 0) return { avaliado: false, respondidos: 0, score: 0, gatilhos: 0, base: null, minimo: null, final: null, governanca: null };
  const score = respondidas.reduce((t, n) => t + (n.nota ?? 0), 0);
  const gatilhos = respondidas.filter((n) => n.nota === 3 && n.gatilhoCritico).length;
  const base = nivelBase(score);
  const minimo = nivelMinimo(gatilhos);
  const final = ORDEM_NIVEL[Math.max(ORDEM_NIVEL.indexOf(base), ORDEM_NIVEL.indexOf(minimo))];
  return { avaliado: true, respondidos: respondidas.length, score, gatilhos, base, minimo, final, governanca: GOVERNANCA[final] };
}

// ───────────────────────────── Riscos e RAID ─────────────────────────────

export type Severidade = "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";

/** Severidade = probabilidade (1–5) × impacto (1–5): ≤4 baixa, ≤9 média, ≤15 alta, >15 crítica. */
export function severidade(probabilidade: number | null, impacto: number | null): Severidade | null {
  if (!probabilidade || !impacto) return null;
  const s = probabilidade * impacto;
  if (s <= 4) return "BAIXA";
  if (s <= 9) return "MEDIA";
  if (s <= 15) return "ALTA";
  return "CRITICA";
}

export type NivelImp = "NAO" | "BAIXO" | "MEDIO" | "ALTO";

/**
 * Severidade de um item sem matriz P×I (pendência, problema, defeito importado):
 * usa o maior impacto informado (escopo, prazo, horas).
 */
export function severidadeItem(i: { probabilidade: number | null; impacto: number | null; impactos: NivelImp[] }): Severidade | null {
  const pi = severidade(i.probabilidade, i.impacto);
  if (pi) return pi;
  if (i.impactos.includes("ALTO")) return "ALTA";
  if (i.impactos.includes("MEDIO")) return "MEDIA";
  if (i.impactos.includes("BAIXO")) return "BAIXA";
  return null;
}

export type StatusOp = "ABERTO" | "EM_ANDAMENTO" | "AGUARDANDO" | "BLOQUEADO" | "APROVADO" | "REPROVADO" | "FECHADO" | "CANCELADO";

export const STATUS_OP_ABERTOS: StatusOp[] = ["ABERTO", "EM_ANDAMENTO", "AGUARDANDO", "BLOQUEADO"];

export function itemAberto(status: StatusOp): boolean {
  return STATUS_OP_ABERTOS.includes(status);
}

/** Item aberto com prazo anterior a hoje. */
export function itemVencido(status: StatusOp, prazo: Date | null, hoje: Date): boolean {
  return itemAberto(status) && !!prazo && diffDias(prazo, paraDia(hoje)) < 0;
}

/** Próximo código do registro operacional por tipo: PEN-001, DEC-001, RSK-001… */
export const PREFIXO_OPERACIONAL: Record<"PENDENCIA" | "DECISAO" | "DEPENDENCIA" | "PROBLEMA" | "RISCO" | "CHANGE_REQUEST" | "DEFEITO", string> = {
  PENDENCIA: "PEN",
  DECISAO: "DEC",
  DEPENDENCIA: "DEP",
  PROBLEMA: "PRB",
  RISCO: "RSK",
  CHANGE_REQUEST: "CR",
  DEFEITO: "DEF",
};

// ───────────────────────────── Testes ─────────────────────────────

export type Resultado = "PLANEJADO" | "NAO_EXECUTADO" | "APROVADO" | "REPROVADO" | "BLOQUEADO" | "NA";

export type ResumoTestes = {
  total: number;
  aprovados: number;
  reprovados: number;
  bloqueados: number;
  pendentes: number;
  na: number;
  /** % de casos (fora N/A) com execução registrada (aprovado, reprovado ou bloqueado). */
  executado: number;
  /** % de casos (fora N/A) aprovados. */
  aprovado: number;
};

/** Resumo por caso, olhando só o último ciclo de cada caso (o histórico de retestes fica no ciclo). */
export function resumoTestes(ultimos: (Resultado | null)[]): ResumoTestes {
  const c = { total: ultimos.length, aprovados: 0, reprovados: 0, bloqueados: 0, pendentes: 0, na: 0 };
  for (const r of ultimos) {
    if (r === "APROVADO") c.aprovados++;
    else if (r === "REPROVADO") c.reprovados++;
    else if (r === "BLOQUEADO") c.bloqueados++;
    else if (r === "NA") c.na++;
    else c.pendentes++;
  }
  const base = c.total - c.na;
  const pct = (n: number) => (base > 0 ? Math.round((n / base) * 1000) / 10 : 0);
  return { ...c, executado: pct(c.aprovados + c.reprovados + c.bloqueados), aprovado: pct(c.aprovados) };
}

// ───────────────────────────── Go/No-Go ─────────────────────────────

export type StatusCheck = "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDO" | "BLOQUEADO" | "NA";
export type ItemChecklist = { item: string; obrigatorio: "SIM" | "NAO" | "CONDICIONAL"; status: StatusCheck; aprovacao: "PENDENTE" | "APROVADO" | "REPROVADO" | "NA" };

export type Prontidao = {
  /** % dos itens aplicáveis (fora N/A e não obrigatórios) concluídos. */
  percentual: number;
  bloqueios: string[];
  ressalvas: string[];
  sugestao: "GO" | "GO_COM_RESSALVAS" | "NO_GO";
};

/**
 * Prontidão para o Go Live (aba Deployment do CTRL-001):
 * - item obrigatório precisa estar concluído e não reprovado;
 * - item condicional concluído ou N/A; pendente vira ressalva;
 * - defeito crítico/alto aberto e caso de UAT reprovado bloqueiam;
 * - item "Go/No-Go aprovado" é a própria decisão e não entra na conta.
 */
export function prontidaoGoLive(p: { itens: ItemChecklist[]; defeitosGraves: number; uatReprovados: number; uatPendentes: number }): Prontidao {
  const bloqueios: string[] = [];
  const ressalvas: string[] = [];
  const itens = p.itens.filter((i) => !/go\s*\/?\s*no.?go/i.test(i.item));
  const aplicaveis = itens.filter((i) => i.status !== "NA" && i.obrigatorio !== "NAO");
  for (const i of itens) {
    if (i.aprovacao === "REPROVADO") bloqueios.push(`Reprovado: ${i.item}`);
    else if (i.status === "CONCLUIDO" || i.status === "NA") continue;
    else if (i.obrigatorio === "SIM") bloqueios.push(`Obrigatório pendente: ${i.item}`);
    else if (i.obrigatorio === "CONDICIONAL") ressalvas.push(`Condicional pendente: ${i.item}`);
  }
  if (p.defeitosGraves > 0) bloqueios.push(`${p.defeitosGraves} defeito(s) crítico(s)/alto(s) em aberto`);
  if (p.uatReprovados > 0) bloqueios.push(`${p.uatReprovados} caso(s) de UAT reprovado(s)`);
  if (p.uatPendentes > 0) ressalvas.push(`${p.uatPendentes} caso(s) de UAT sem aprovação`);
  const concluidos = aplicaveis.filter((i) => i.status === "CONCLUIDO").length;
  const percentual = aplicaveis.length ? Math.round((concluidos / aplicaveis.length) * 100) : 0;
  return { percentual, bloqueios, ressalvas, sugestao: bloqueios.length ? "NO_GO" : ressalvas.length ? "GO_COM_RESSALVAS" : "GO" };
}

// ───────────────────────────── Pré-projeto ─────────────────────────────

/** Sugestão de status do pré-projeto a partir do checklist (o GP decide; a tela mostra a sugestão). */
export function sugestaoPreProjeto(status: StatusCheck[]): "EM_PREPARACAO" | "PRONTO" | "PRONTO_COM_RESSALVAS" | "BLOQUEADO" {
  if (status.length === 0) return "EM_PREPARACAO";
  if (status.includes("BLOQUEADO")) return "BLOQUEADO";
  const abertos = status.filter((s) => s === "PENDENTE" || s === "EM_ANDAMENTO").length;
  if (abertos === 0) return "PRONTO";
  if (abertos <= Math.floor(status.length / 4)) return "PRONTO_COM_RESSALVAS";
  return "EM_PREPARACAO";
}
