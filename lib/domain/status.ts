// Status report: indicadores fotografados e sugestão de status executivo (regras puras).

/** Fotografia dos indicadores do projeto, gravada no status report (JSON) e congelada ao publicar. */
export type Indicadores = {
  geradoEm: string;
  progresso: number;
  faseAtual: string | null;
  goLive: string | null;
  horas: { vendidas: number | null; planejadas: number; realizadas: number; forecast: number | null };
  atividades: { total: number; concluidas: number; atrasadas: number };
  complexidade: string | null;
  pendenciasVencidas: number;
  itensAbertos: number;
  riscosAbertos: number;
  riscosAltos: number;
  changeRequests: number;
  defeitosAbertos: number;
  defeitosGraves: number;
  testesInternos: { total: number; aprovado: number };
  uat: { total: number; aprovado: number };
  prontidaoGoLive: { percentual: number; sugestao: string; bloqueios: number } | null;
};

/**
 * Sugestão de status executivo a partir dos indicadores (o GP decide):
 * vermelho com atividade atrasada em marco/≥3 atrasadas, defeito grave, risco crítico/alto ou forecast > vendidas;
 * amarelo com qualquer atraso, pendência vencida ou risco aberto; senão verde.
 */
export function sugerirStatusExecutivo(i: Indicadores): "VERDE" | "AMARELO" | "VERMELHO" {
  const estouro = i.horas.vendidas !== null && i.horas.forecast !== null && i.horas.forecast > i.horas.vendidas;
  if (i.atividades.atrasadas >= 3 || i.defeitosGraves > 0 || i.riscosAltos > 0 || estouro) return "VERMELHO";
  if (i.atividades.atrasadas > 0 || i.pendenciasVencidas > 0 || i.riscosAbertos > 0 || i.defeitosAbertos > 0) return "AMARELO";
  return "VERDE";
}
