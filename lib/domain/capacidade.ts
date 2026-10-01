import { chaveDia, ehFimDeSemana, paraDia, somarDias } from "./datas";

export type Vigencia = {
  vigenciaInicio: Date;
  vigenciaFim: Date | null;
  horasSemanais: number;
};

/** Capacidade semanal vigente na data (a vigência mais recente que cobre a data). */
export function capacidadeVigente(vigencias: Vigencia[], data: Date): number {
  const d = paraDia(data).getTime();
  const candidatas = vigencias
    .filter((v) => v.vigenciaInicio.getTime() <= d && (!v.vigenciaFim || v.vigenciaFim.getTime() >= d))
    .sort((a, b) => b.vigenciaInicio.getTime() - a.vigenciaInicio.getTime());
  return candidatas[0]?.horasSemanais ?? 0;
}

/** Valida que as vigências de um recurso não se sobrepõem. Retorna mensagem de erro ou null. */
export function validarVigencias(vigencias: Vigencia[]): string | null {
  const ordenadas = [...vigencias].sort((a, b) => a.vigenciaInicio.getTime() - b.vigenciaInicio.getTime());
  for (let i = 0; i < ordenadas.length; i++) {
    const v = ordenadas[i];
    if (v.vigenciaFim && v.vigenciaFim.getTime() < v.vigenciaInicio.getTime()) {
      return "Fim da vigência anterior ao início.";
    }
    const prox = ordenadas[i + 1];
    if (prox && (!v.vigenciaFim || v.vigenciaFim.getTime() >= prox.vigenciaInicio.getTime())) {
      return "Há vigências de capacidade sobrepostas.";
    }
  }
  return null;
}

export type CapacidadeSemana = {
  bruta: number;
  diasUteis: number;
  diasFeriado: number;
  horasFeriado: number;
  horasIndisponivel: number;
  liquida: number;
};

/**
 * Capacidade líquida de uma semana (segunda a domingo):
 * bruta − feriados em dia útil × horas/dia − indisponibilidades aprovadas.
 * `ausencias` traz horas indisponíveis por dia ("AAAA-MM-DD" → horas); dia de feriado não desconta duas vezes.
 */
export function capacidadeDaSemana(
  inicioSemana: Date,
  horasSemanais: number,
  feriados: Set<string>,
  ausencias: Map<string, number> = new Map(),
): CapacidadeSemana {
  const horasDia = horasSemanais / 5;
  let diasFeriado = 0;
  let horasIndisponivel = 0;
  for (let i = 0; i < 7; i++) {
    const d = somarDias(inicioSemana, i);
    if (ehFimDeSemana(d)) continue;
    const k = chaveDia(d);
    if (feriados.has(k)) diasFeriado++;
    else if (ausencias.has(k)) horasIndisponivel += Math.min(horasDia, ausencias.get(k)!);
  }
  const horasFeriado = diasFeriado * horasDia;
  return {
    bruta: horasSemanais,
    diasUteis: 5 - diasFeriado,
    diasFeriado,
    horasFeriado,
    horasIndisponivel,
    liquida: Math.max(0, horasSemanais - horasFeriado - horasIndisponivel),
  };
}

/** Expande indisponibilidades em horas por dia útil. horasPorDia nulo = dia inteiro (Infinity, limitado à jornada). */
export function ausenciasPorDia(itens: { inicio: Date; fim: Date; horasPorDia: number | null }[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const it of itens) {
    for (let d = paraDia(it.inicio); d <= it.fim; d = somarDias(d, 1)) {
      if (ehFimDeSemana(d)) continue;
      const k = chaveDia(d);
      m.set(k, (m.get(k) ?? 0) + (it.horasPorDia ?? Infinity));
    }
  }
  return m;
}

export type FaixaUtilizacao = "DISPONIVEL" | "ADEQUADO" | "ATENCAO" | "SOBRECARREGADO";

/** Faixas herdadas do CTRL-003, avaliadas semana a semana. */
export function faixaUtilizacao(utilizacao: number): FaixaUtilizacao {
  if (utilizacao > 1) return "SOBRECARREGADO";
  if (utilizacao >= 0.85) return "ATENCAO";
  if (utilizacao < 0.5) return "DISPONIVEL";
  return "ADEQUADO";
}
