import type ExcelJS from "exceljs";
import { acharAba, acharCabecalho, lerLinhas, valorCelula, type Primitivo } from "../planilha";

export type EntidadeCtrl001 = "Cabecalho" | "Backlog" | "Atividade" | EntidadeExecucao;
/** Abas de execução (incremento 5/6). */
export type EntidadeExecucao = "Complexidade" | "PreProjeto" | "PreProjetoItem" | "Operacional" | "TesteInterno" | "Uat" | "DeploymentItem" | "StatusReport";
export type LinhaLida001 = { aba: string; linhaOrigem: number; entidade: EntidadeCtrl001; dados: Record<string, Primitivo> };

/** Abas calculadas na planilha e que o sistema recalcula (não são importadas). */
export const ABAS_DERIVADAS = ["Dashboard", "Auditoria CTRL-003", "Parâmetros"];

const COLUNAS_CRONOGRAMA = ["ID", "Fase", "Atividade", "Tarefa", "Módulo | Processo", "Recurso MAIS i9", "Recurso Cliente", "Responsável", "Início Previsto", "Fim Previsto", "Esforço Previsto (h)", "Esforço Realizado (h)", "Horas para Concluir", "% Conclusão", "Status", "Predecessora", "Marco?", "Data Real Conclusão", "Observação"];
const COLUNAS_COMPLEXIDADE = ["Dimensão", "Critério", "Resposta", "Gatilho crítico?"];
const COLUNAS_PRE = ["Categoria", "Item / Requisito", "Responsável", "Informação / Contato", "Validação", "Status", "Prazo", "Observação"];
const COLUNAS_OPERACIONAL = ["ID", "Tipo", "Descrição", "Origem / Causa", "Impacto / Consequência", "Responsável", "Abertura", "Prazo", "Status", "Impacto Escopo", "Impacto Prazo", "Impacto Horas", "Ação / Resposta", "Decisão / Aprovador", "Evidência / Observação"];
const COLUNAS_TI = ["ID", "Requisito", "Módulo | Processo", "Pré-condição", "Cenário | Passos", "Resultado Esperado", "Responsável MAIS i9", "Data", "Resultado", "Defeito | Pendência", "Evidência", "Validação MAIS i9"];
const COLUNAS_UAT = ["ID", "Requisito", "Módulo | Processo", "Cenário | Passos", "Resultado Esperado", "Key User | Cliente", "Data", "Resultado", "Defeito | Pendência", "Evidência", "Aceite Cliente", "Observação"];
const COLUNAS_DEPLOY = ["Categoria", "Item", "Obrigatório?", "Status", "Responsável", "Evidência", "Risco | Observação", "Aprovação", "Data Prevista", "Data Real"];
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

  lerExecucao(wb, linhas, avisos);
  return { linhas, avisos };
}

/** Abas de execução: complexidade, pré-projeto, operacional, testes, UAT, deployment e status report. Todas opcionais. */
function lerExecucao(wb: ExcelJS.Workbook, linhas: LinhaLida001[], avisos: string[]) {
  const comp = acharAba(wb, "Pré-Projeto | Complexidade");
  if (comp) {
    const cab = acharCabecalho(comp, ["Critério", "Resposta"], COLUNAS_COMPLEXIDADE, 20);
    if (!cab) avisos.push('Aba "Pré-Projeto | Complexidade": tabela de critérios não encontrada.');
    else {
      const dados: Record<string, Primitivo> = {
        avaliador: valorCelula(comp.getCell("B5").value),
        data: valorCelula(comp.getCell("B6").value),
        horas: valorCelula(comp.getCell("B7").value),
        nivelPlanilha: valorCelula(comp.getCell("B8").value),
      };
      for (const l of lerLinhas(comp, cab, ["Critério"])) {
        const nome = l.valores["Critério"];
        if (typeof nome !== "string") continue;
        dados[`nota:${nome}`] = l.valores["Resposta"] ?? null;
        dados[`gatilho:${nome}`] = l.valores["Gatilho crítico?"] ?? null;
      }
      linhas.push({ aba: comp.name, linhaOrigem: cab.linha, entidade: "Complexidade", dados });
    }
  }

  const pre = acharAba(wb, "Pré-Projeto");
  if (pre) {
    const status = valorCelula(pre.getCell("B8").value);
    if (status) linhas.push({ aba: pre.name, linhaOrigem: 8, entidade: "PreProjeto", dados: { status } });
    const cab = acharCabecalho(pre, ["Categoria", "Item / Requisito"], COLUNAS_PRE, 20);
    if (cab) for (const l of lerLinhas(pre, cab, ["Item / Requisito"])) linhas.push({ aba: pre.name, linhaOrigem: l.linha, entidade: "PreProjetoItem", dados: l.valores });
  }

  const tabelas: [string, string[], string[], string[], LinhaLida001["entidade"]][] = [
    ["Operacional", ["ID", "Tipo", "Descrição"], COLUNAS_OPERACIONAL, ["ID", "Descrição"], "Operacional"],
    ["Teste Interno", ["ID", "Cenário | Passos"], COLUNAS_TI, ["ID", "Cenário | Passos", "Requisito"], "TesteInterno"],
    ["Teste Cliente | UAT", ["ID", "Cenário | Passos"], COLUNAS_UAT, ["ID", "Cenário | Passos"], "Uat"],
    ["Deployment", ["Categoria", "Item"], COLUNAS_DEPLOY, ["Item"], "DeploymentItem"],
  ];
  for (const [nome, obrig, colunas, chaves, entidade] of tabelas) {
    const ws = acharAba(wb, nome);
    if (!ws) continue;
    const cab = acharCabecalho(ws, obrig, colunas);
    if (!cab) {
      avisos.push(`Aba "${nome}": cabeçalho não encontrado.`);
      continue;
    }
    // Linhas-modelo sem conteúdo (só ID) são puladas: exige-se ao menos um campo além do ID.
    for (const l of lerLinhas(ws, cab, chaves)) linhas.push({ aba: ws.name, linhaOrigem: l.linha, entidade, dados: l.valores });
  }

  const sr = acharAba(wb, "Status Report");
  if (sr) {
    const dados: Record<string, Primitivo> = {};
    for (let r = 1; r <= Math.min(30, sr.rowCount); r++) {
      const campo = valorCelula(sr.getCell(r, 1).value);
      if (typeof campo === "string" && campo !== "Campo") dados[campo] = valorCelula(sr.getCell(r, 2).value);
    }
    if (Object.keys(dados).length) linhas.push({ aba: sr.name, linhaOrigem: 1, entidade: "StatusReport", dados });
  }
}
