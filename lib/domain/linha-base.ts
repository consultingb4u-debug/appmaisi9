// Linha de base, curva S e change requests (regras puras). Roadmap 1.2.
import { chaveDia, diffDias, ehFimDeSemana, paraDia, somarDias } from "./datas";
import { diasUteisEntre } from "./cronograma";
import { rotuloSemana, semanaDe, semanaPorId, semanasEntre } from "./semanas";

export type ItemBase = { codigo: string; tarefa: string; fase: string; inicio: Date | null; fim: Date | null; esforco: number; marco: boolean };
export type ItemAtual = ItemBase & { status: string };

export type Comparacao = {
  codigo: string;
  tarefa: string;
  situacao: "IGUAL" | "ALTERADA" | "NOVA" | "REMOVIDA";
  base: ItemBase | null;
  atual: ItemAtual | null;
  /** Dias corridos (positivo = atrasou em relação à base). */
  desvioInicio: number | null;
  desvioFim: number | null;
  desvioEsforco: number | null;
};

const desvio = (a: Date | null | undefined, b: Date | null | undefined) => (a && b ? diffDias(a, b) : null);

/** Compara o cronograma atual com a linha de base, atividade por atividade (pelo código). */
export function compararComBase(base: ItemBase[], atual: ItemAtual[]) {
  const porCodigo = new Map(base.map((b) => [b.codigo, b]));
  const vistos = new Set<string>();
  const linhas: Comparacao[] = atual
    .filter((a) => a.status !== "CANCELADO" || porCodigo.has(a.codigo))
    .map((a) => {
      const b = porCodigo.get(a.codigo) ?? null;
      vistos.add(a.codigo);
      if (!b) return { codigo: a.codigo, tarefa: a.tarefa, situacao: "NOVA", base: null, atual: a, desvioInicio: null, desvioFim: null, desvioEsforco: null };
      if (a.status === "CANCELADO") return { codigo: a.codigo, tarefa: a.tarefa, situacao: "REMOVIDA", base: b, atual: a, desvioInicio: null, desvioFim: null, desvioEsforco: -b.esforco };
      const d = { desvioInicio: desvio(a.inicio, b.inicio), desvioFim: desvio(a.fim, b.fim), desvioEsforco: Math.round((a.esforco - b.esforco) * 10) / 10 };
      const igual = !d.desvioInicio && !d.desvioFim && !d.desvioEsforco && (a.inicio === null) === (b.inicio === null) && (a.fim === null) === (b.fim === null);
      return { codigo: a.codigo, tarefa: a.tarefa, situacao: igual ? "IGUAL" : "ALTERADA", base: b, atual: a, ...d };
    });
  for (const b of base) if (!vistos.has(b.codigo)) linhas.push({ codigo: b.codigo, tarefa: b.tarefa, situacao: "REMOVIDA", base: b, atual: null, desvioInicio: null, desvioFim: null, desvioEsforco: -b.esforco });

  const fimDe = (xs: { fim: Date | null }[]) => xs.reduce<Date | null>((m, x) => (x.fim && (!m || x.fim > m) ? x.fim : m), null);
  const ativos = atual.filter((a) => a.status !== "CANCELADO");
  const fimBase = fimDe(base);
  const fimAtual = fimDe(ativos);
  const soma = (xs: { esforco: number }[]) => Math.round(xs.reduce((t, x) => t + x.esforco, 0) * 10) / 10;
  return {
    linhas,
    resumo: {
      fimBase,
      fimAtual,
      deslizamentoDias: desvio(fimAtual, fimBase),
      esforcoBase: soma(base),
      esforcoAtual: soma(ativos),
      novas: linhas.filter((l) => l.situacao === "NOVA").length,
      removidas: linhas.filter((l) => l.situacao === "REMOVIDA").length,
      alteradas: linhas.filter((l) => l.situacao === "ALTERADA").length,
      marcosAtrasados: linhas.filter((l) => l.base?.marco && (l.desvioFim ?? 0) > 0).length,
    },
  };
}

/** Horas da base por dia útil: o esforço de cada atividade dividido igualmente entre seus dias úteis. */
function basePorDia(base: ItemBase[], feriados: Set<string>): Map<string, number> {
  const out = new Map<string, number>();
  for (const b of base) {
    if (!b.inicio || !b.fim || b.esforco <= 0) continue;
    let dias = diasUteisEntre(b.inicio, b.fim, feriados);
    if (dias.length === 0) dias = [b.fim];
    for (const d of dias) out.set(chaveDia(d), (out.get(chaveDia(d)) ?? 0) + b.esforco / dias.length);
  }
  return out;
}

/** % do esforço da base que deveria estar feito até `hoje` (inclusive) — o "progresso planejado". */
export function progressoPlanejado(base: ItemBase[], hoje: Date, feriados: Set<string> = new Set()): number | null {
  const total = base.reduce((t, b) => t + (b.inicio && b.fim ? b.esforco : 0), 0);
  if (total <= 0) return null;
  const h = chaveDia(paraDia(hoje));
  let feito = 0;
  for (const [d, horas] of basePorDia(base, feriados)) if (d <= h) feito += horas;
  return Math.round((feito / total) * 1000) / 10;
}

export type PontoCurvaS = { semanaId: string; rotulo: string; inicio: Date; planejado: number | null; realizado: number | null; forecast: number | null };

/**
 * Curva S em horas acumuladas por semana ISO:
 * - planejado: esforço da linha de base distribuído pelos dias úteis;
 * - realizado: horas apontadas até a semana atual;
 * - forecast: realizado até a semana atual + horas previstas das semanas seguintes.
 */
export function curvaS(p: {
  base: ItemBase[];
  realizadoPorSemana: Map<string, number>;
  previstoPorSemana: Map<string, number>;
  hoje: Date;
  feriados?: Set<string>;
}): PontoCurvaS[] {
  const porDia = basePorDia(p.base, p.feriados ?? new Set());
  const planejadoSemana = new Map<string, number>();
  for (const [d, h] of porDia) {
    const id = semanaDe(new Date(`${d}T00:00:00Z`)).id;
    planejadoSemana.set(id, (planejadoSemana.get(id) ?? 0) + h);
  }
  const atual = semanaDe(p.hoje);
  const ids = [...planejadoSemana.keys(), ...[...p.realizadoPorSemana.entries()].filter(([, h]) => h > 0).map(([k]) => k), ...[...p.previstoPorSemana.entries()].filter(([k, h]) => h > 0 && k > atual.id).map(([k]) => k)].sort();
  if (ids.length === 0) return [];
  const primeira = ids[0] < atual.id ? ids[0] : atual.id;
  const ultima = ids.at(-1)! > atual.id ? ids.at(-1)! : atual.id;
  const semanas = semanasEntre(semanaPorId(primeira)!.inicio, semanaPorId(ultima)!.inicio);
  const r1 = (n: number) => Math.round(n * 10) / 10;
  const temBase = planejadoSemana.size > 0;
  let plan = 0;
  let real = 0;
  let fc = 0;
  return semanas.map((s) => {
    plan += planejadoSemana.get(s.id) ?? 0;
    const passado = s.id <= atual.id;
    if (passado) real += p.realizadoPorSemana.get(s.id) ?? 0;
    fc = passado ? real : fc + (p.previstoPorSemana.get(s.id) ?? 0);
    return { semanaId: s.id, rotulo: rotuloSemana(s), inicio: s.inicio, planejado: temBase ? r1(plan) : null, realizado: passado ? r1(real) : null, forecast: s.id >= atual.id ? r1(fc) : null };
  });
}

/** Desloca uma data por N dias úteis (sem fins de semana nem os feriados informados). Negativo volta. */
export function somarDiasUteis(d: Date, n: number, feriados: Set<string> = new Set()): Date {
  let x = paraDia(d);
  const passo = n >= 0 ? 1 : -1;
  for (let falta = Math.abs(n); falta > 0; ) {
    x = somarDias(x, passo);
    if (!ehFimDeSemana(x) && !feriados.has(chaveDia(x))) falta--;
  }
  return x;
}

/** Efeito de um change request aprovado no projeto: horas vendidas somadas e Go Live deslocado em dias úteis. */
export function impactoChangeRequest(
  projeto: { horasVendidas: number | null; goLive: Date | null },
  cr: { horas: number | null; dias: number | null },
  feriados: Set<string> = new Set(),
): { horasVendidas: number | null; goLive: Date | null } {
  return {
    horasVendidas: cr.horas ? Math.round(((projeto.horasVendidas ?? 0) + cr.horas) * 10) / 10 : projeto.horasVendidas,
    goLive: cr.dias && projeto.goLive ? somarDiasUteis(projeto.goLive, cr.dias, feriados) : projeto.goLive,
  };
}
