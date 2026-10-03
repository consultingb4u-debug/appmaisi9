// Regras do app reaproveitadas na demo (mesmo código de lib/domain).
export { chaveDia, dia, diffDias, ehFimDeSemana, formatarData, paraDia, parseDia, somarDias } from "@/lib/domain/datas";
export { rotuloSemana, semanaDe, semanaPorId, semanasEntre, type SemanaIso } from "@/lib/domain/semanas";
export { feriadosNacionais } from "@/lib/domain/feriados";
export { ausenciasPorDia, capacidadeDaSemana, faixaUtilizacao, type FaixaUtilizacao } from "@/lib/domain/capacidade";
export { coerenciaStatus, diasUteisEntre, progresso, ratearHoras, situacaoPrazo, proximoCodigo, type StatusItem } from "@/lib/domain/cronograma";
export { itemAberto, itemVencido, severidade, PREFIXO_OPERACIONAL, type StatusOp } from "@/lib/domain/execucao";
export { alertasAtividades, alertasIndisponibilidades, alertasPendencias, alertasSobrecarga, ordenarAlertas, ROTULO_ALERTA, type Alerta } from "@/lib/domain/alertas";
export {
  FASE,
  FASES,
  PRIORIDADE,
  SEVERIDADE,
  SITUACAO_PRAZO,
  STATUS_EXECUTIVO,
  STATUS_ITEM,
  STATUS_OPERACIONAL,
  STATUS_PROJETO,
  STATUS_ATIVOS,
  TIPO_INDISPONIBILIDADE,
  TIPO_OPERACIONAL,
  TIPO_PROJETO,
  STATUS_INDISPONIBILIDADE,
} from "@/lib/domain/rotulos";
