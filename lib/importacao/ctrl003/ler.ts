import type ExcelJS from "exceljs";
import { acharAba, acharCabecalho, lerLinhas, type Primitivo } from "../planilha";

export type EntidadeCtrl003 = "Projeto" | "Alocacao" | "Capacidade" | "Indisponibilidade";

export type LinhaLida = {
  aba: string;
  linhaOrigem: number;
  entidade: EntidadeCtrl003;
  dados: Record<string, Primitivo | Record<string, Primitivo>>;
};

export type LeituraCtrl003 = { linhas: LinhaLida[]; avisos: string[] };

/** Abas automáticas do CTRL-003: não são importadas porque o sistema as calcula. */
export const ABAS_DERIVADAS = ["Dashboard Recursos", "Projeto vs. Recursos", "Carga por Projeto", "Calendário | Gantt", "Dados Projetos", "Parâmetros", "LEIA-ME"];

/** Lê as abas de entrada manual do CTRL-003 v5.x. Não grava nada: só extrai. */
export function lerCtrl003(wb: ExcelJS.Workbook): LeituraCtrl003 {
  const linhas: LinhaLida[] = [];
  const avisos: string[] = [];

  const aba = (nome: string) => {
    const ws = acharAba(wb, nome);
    if (!ws) avisos.push(`Aba "${nome}" não encontrada — ignorada.`);
    return ws;
  };

  // Portfólio Projetos → Projeto
  const port = aba("Portfólio Projetos");
  if (port) {
    const cab = acharCabecalho(port, ["Cliente", "Projeto", "Status"], ["Id", "Notas | Bloqueios | Ações", "Funcional", "Técnico", "Horas Projeto", "Data Kick off", "Data Go Live", "Data Encerramento"]);
    if (!cab) avisos.push(`Aba "${port.name}": cabeçalho Cliente/Projeto/Status não encontrado.`);
    else
      for (const l of lerLinhas(port, cab, ["Cliente", "Projeto"])) {
        const v = l.valores;
        linhas.push({
          aba: port.name,
          linhaOrigem: l.linha,
          entidade: "Projeto",
          dados: {
            id: v["Id"] ?? null,
            cliente: v["Cliente"],
            projeto: v["Projeto"],
            status: v["Status"],
            notas: v["Notas | Bloqueios | Ações"] ?? null,
            funcional: v["Funcional"] ?? null,
            tecnico: v["Técnico"] ?? null,
            horas: v["Horas Projeto"] ?? null,
            kickoff: v["Data Kick off"] ?? null,
            goLive: v["Data Go Live"] ?? null,
            encerramento: v["Data Encerramento"] ?? null,
          },
        });
      }
  }

  // Planejamento Recursos → AlocacaoSemanal
  const plan = aba("Planejamento Recursos");
  if (plan) {
    const cab = acharCabecalho(plan, ["Cliente", "Projeto", "Recurso", "Semana"], ["Início Semana", "Fim Semana", "Horas Previstas", "Horas Realizadas", "Status", "Prioridade", "Observação"]);
    if (!cab) avisos.push(`Aba "${plan.name}": cabeçalho Cliente/Projeto/Recurso/Semana não encontrado.`);
    else
      for (const l of lerLinhas(plan, cab, ["Cliente", "Projeto", "Recurso", "Horas Previstas", "Horas Realizadas"])) {
        const v = l.valores;
        linhas.push({
          aba: plan.name,
          linhaOrigem: l.linha,
          entidade: "Alocacao",
          dados: {
            cliente: v["Cliente"],
            projeto: v["Projeto"],
            recurso: v["Recurso"],
            semana: v["Semana"],
            inicioSemana: v["Início Semana"] ?? null,
            horasPrevistas: v["Horas Previstas"] ?? null,
            horasRealizadas: v["Horas Realizadas"] ?? null,
            status: v["Status"] ?? null,
            prioridade: v["Prioridade"] ?? null,
            observacao: v["Observação"] ?? null,
          },
        });
      }
  }

  // Capacidade → uma linha por recurso com as horas de cada semana
  const cap = aba("Capacidade");
  if (cap) {
    const cab = acharCabecalho(cap, ["Recurso"]);
    if (!cab) avisos.push(`Aba "${cap.name}": cabeçalho Recurso não encontrado.`);
    else {
      const colunasSemana: [string, number][] = [];
      cap.getRow(cab.linha).eachCell((cell, col) => {
        const t = String(cell.value ?? "").trim();
        if (/^S\d{1,2}$/i.test(t)) colunasSemana.push([t.toUpperCase(), col]);
      });
      const colRecurso = cab.colunas["Recurso"];
      for (let r = cab.linha + 1; r <= cap.rowCount; r++) {
        const row = cap.getRow(r);
        const nome = row.getCell(colRecurso).value;
        if (!nome) continue;
        const semanas: Record<string, Primitivo> = {};
        for (const [s, col] of colunasSemana) {
          const val = row.getCell(col).value;
          semanas[s] = typeof val === "number" ? val : val == null ? null : Number(val);
        }
        linhas.push({ aba: cap.name, linhaOrigem: r, entidade: "Capacidade", dados: { recurso: String(nome).trim(), semanas } });
      }
    }
  }

  // Indisponibilidades
  const ind = aba("Indisponibilidades");
  if (ind) {
    const cab = acharCabecalho(ind, ["Recurso", "Tipo", "Início", "Fim"], ["Horas", "Semana", "Observação", "Status"]);
    if (!cab) avisos.push(`Aba "${ind.name}": cabeçalho Recurso/Tipo/Início/Fim não encontrado.`);
    else
      for (const l of lerLinhas(ind, cab, ["Recurso", "Início"])) {
        const v = l.valores;
        linhas.push({
          aba: ind.name,
          linhaOrigem: l.linha,
          entidade: "Indisponibilidade",
          dados: { recurso: v["Recurso"], tipo: v["Tipo"], inicio: v["Início"], fim: v["Fim"], horas: v["Horas"] ?? null, observacao: v["Observação"] ?? null, status: v["Status"] ?? null },
        });
      }
  }

  return { linhas, avisos };
}
