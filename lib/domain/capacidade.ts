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
  liquida: number;
};

/**
 * Capacidade líquida de uma semana (segunda a domingo):
 * bruta − (dias úteis em feriado × horas por dia).
 * Indisponibilidades individuais entram no incremento 3 (mesma função, novo parâmetro).
 */
export function capacidadeDaSemana(
  inicioSemana: Date,
  horasSemanais: number,
  feriados: Set<string>,
): CapacidadeSemana {
  const horasDia = horasSemanais / 5;
  let diasFeriado = 0;
  for (let i = 0; i < 7; i++) {
    const d = somarDias(inicioSemana, i);
    if (!ehFimDeSemana(d) && feriados.has(chaveDia(d))) diasFeriado++;
  }
  const horasFeriado = diasFeriado * horasDia;
  return {
    bruta: horasSemanais,
    diasUteis: 5 - diasFeriado,
    diasFeriado,
    horasFeriado,
    liquida: Math.max(0, horasSemanais - horasFeriado),
  };
}

export type FaixaUtilizacao = "DISPONIVEL" | "ADEQUADO" | "ATENCAO" | "SOBRECARREGADO";

/** Faixas herdadas do CTRL-003, avaliadas semana a semana. */
export function faixaUtilizacao(utilizacao: number): FaixaUtilizacao {
  if (utilizacao > 1) return "SOBRECARREGADO";
  if (utilizacao >= 0.85) return "ATENCAO";
  if (utilizacao < 0.5) return "DISPONIVEL";
  return "ADEQUADO";
}
