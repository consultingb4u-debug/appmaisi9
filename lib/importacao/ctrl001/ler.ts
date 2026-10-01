import type ExcelJS from "exceljs";
import { acharAba, acharCabecalho, lerLinhas, valorCelula, type Primitivo } from "../planilha";

export type EntidadeCtrl001 = "Cabecalho" | "Backlog" | "Atividade";
export type LinhaLida001 = { aba: string; linhaOrigem: number; entidade: EntidadeCtrl001; dados: Record<string, Primitivo> };

/** Abas que entram nos próximos incrementos (pré-projeto, RAID, testes, deployment, status) ou são derivadas. */
export const ABAS_NAO_IMPORTADAS_AINDA = ["Pré-Projeto | Complexidade (critérios)", "Operacional", "Teste Interno", "Teste Cliente | UAT", "Deployment", "Status Report"];

const COLUNAS_CRONOGRAMA = ["ID", "Fase", "Atividade", "Tarefa", "Módulo | Processo", "Recurso MAIS i9", "Recurso Cliente", "Responsável", "Início Previsto", "Fim Previsto", "Esforço Previsto (h)", "Esforço Realizado (h)", "Horas para Concluir", "% Conclusão", "Status", "Predecessora", "Marco?", "Data Real Conclusão", "Observação"];
const COLUNAS_BACKLOG = ["ID", "Módulo | Processo", "Requisito", "Tipo", "Prioridade", "Aderência ao Padrão", "Solução Proposta", "Customização?", "Critério de Aceite", "Estimativa h", "Responsável", "Status", "Validação Cliente", "Observação"];

export function lerCtrl001(wb: ExcelJS.Workbook): { linhas: LinhaLida001[]; avisos: string[] } {
  const linhas: LinhaLida001[] = [];
  const avisos: string[] = [];

  // Identificação do projeto e datas de abertura
  const comp = acharAba(wb, "Pré-Projeto | Complexidade");
  const pre = acharAba(wb, "Pré-Projeto");
  if (comp || pre) {
    const v = (ws: ExcelJS.Worksheet | undefined, ref: string) => (ws ? valorCelula(ws.getCell(ref).value) : null);
    linhas.push({
      aba: comp?.name ?? pre!.name,
      linhaOrigem: 3,
      entidade: "Cabecalho",
      dados: { projeto: v(comp, "B3") ?? v(pre, "B3"), cliente: v(comp, "B4") ?? v(pre, "B4"), gp: v(pre, "B5"), inicio: v(pre, "B6"), goLive: v(pre, "B7") },
    });
  } else avisos.push('Abas "Pré-Projeto" não encontradas: datas do projeto não serão importadas.');

  const back = acharAba(wb, "Backlog");
  if (back) {
    const cab = acharCabecalho(back, ["ID", "Requisito"], COLUNAS_BACKLOG);
    if (!cab) avisos.push('Aba "Backlog": cabeçalho não encontrado.');
    else for (const l of lerLinhas(back, cab, ["ID", "Requisito"])) linhas.push({ aba: back.name, linhaOrigem: l.linha, entidade: "Backlog", dados: l.valores });
  } else avisos.push('Aba "Backlog" não encontrada.');

  const cron = acharAba(wb, "Cronograma");
  if (cron) {
    const cab = acharCabecalho(cron, ["ID", "Fase", "Tarefa"], COLUNAS_CRONOGRAMA);
    if (!cab) avisos.push('Aba "Cronograma": cabeçalho não encontrado.');
    else for (const l of lerLinhas(cron, cab, ["ID", "Tarefa"])) linhas.push({ aba: cron.name, linhaOrigem: l.linha, entidade: "Atividade", dados: l.valores });
  } else avisos.push('Aba "Cronograma" não encontrada.');

  return { linhas, avisos };
}
