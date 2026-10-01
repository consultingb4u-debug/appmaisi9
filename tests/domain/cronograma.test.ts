import { describe, expect, it } from "vitest";
import { dia } from "@/lib/domain/datas";
import {
  coerenciaStatus,
  diasUteisEntre,
  progresso,
  proximoCodigo,
  qualidadeCronograma,
  ratearHoras,
  situacaoPrazo,
  totaisAtividade,
  type AtividadeQualidade,
} from "@/lib/domain/cronograma";

const S40 = dia(2026, 9, 28);

describe("ratearHoras", () => {
  it("exemplo da proposta: 40h de qua 30/09 a ter 13/10 → 12h / 20h / 8h", () => {
    // 30/09–02/10 (3 dias), 05/10–09/10 (5), 12/10–13/10 (2) — sem feriados
    expect(ratearHoras({ inicio: dia(2026, 9, 30), fim: dia(2026, 10, 13), horas: 40, inicioJanela: S40 })).toEqual({ "2026-W40": 12, "2026-W41": 20, "2026-W42": 8 });
  });

  it("Go Live da Kover (CRON-023): 4h de 28/10 a 03/11 → 2,5h S44 e 1,5h S45", () => {
    expect(ratearHoras({ inicio: dia(2026, 10, 28), fim: dia(2026, 11, 3), horas: 4, inicioJanela: S40 })).toEqual({ "2026-W44": 2.5, "2026-W45": 1.5 });
  });

  it("feriado não recebe horas: 12/10 fora → tudo na terça", () => {
    const r = ratearHoras({ inicio: dia(2026, 10, 12), fim: dia(2026, 10, 13), horas: 8, inicioJanela: S40, indisponiveis: new Set(["2026-10-12"]) });
    expect(r).toEqual({ "2026-W42": 8 });
  });

  it("semanas passadas não recebem horas: começa a partir da semana atual", () => {
    expect(ratearHoras({ inicio: dia(2026, 9, 21), fim: dia(2026, 10, 2), horas: 10, inicioJanela: S40 })).toEqual({ "2026-W40": 10 });
  });

  it("atividade vencida e não concluída: o que falta vai para a semana atual", () => {
    expect(ratearHoras({ inicio: dia(2026, 9, 14), fim: dia(2026, 9, 18), horas: 6, inicioJanela: S40 })).toEqual({ "2026-W40": 6 });
  });

  it("fim num sábado (CRON-010 Kover 09/10–10/10) conta só a sexta", () => {
    expect(ratearHoras({ inicio: dia(2026, 10, 9), fim: dia(2026, 10, 10), horas: 8, inicioJanela: S40 })).toEqual({ "2026-W41": 8 });
  });

  it("período só com feriados/ausências: distribui ignorando-os; sem horas = vazio", () => {
    expect(ratearHoras({ inicio: dia(2026, 10, 12), fim: dia(2026, 10, 12), horas: 4, inicioJanela: S40, indisponiveis: new Set(["2026-10-12"]) })).toEqual({ "2026-W42": 4 });
    expect(ratearHoras({ inicio: dia(2026, 10, 12), fim: dia(2026, 10, 13), horas: 0, inicioJanela: S40 })).toEqual({});
  });

  it("a soma bate com as horas, mesmo com arredondamento", () => {
    const r = ratearHoras({ inicio: dia(2026, 10, 1), fim: dia(2026, 11, 20), horas: 37, inicioJanela: S40 });
    expect(Object.values(r).reduce((t, h) => t + h, 0)).toBeCloseTo(37);
  });
});

describe("situacaoPrazo (fórmula do CTRL-001)", () => {
  const hoje = dia(2026, 10, 1);
  it.each([
    ["CONCLUIDO", dia(2026, 9, 1), "CONCLUIDO"],
    ["EM_ANDAMENTO", dia(2026, 9, 30), "ATRASADO"],
    ["NAO_INICIADO", dia(2026, 10, 1), "ATENCAO"],
    ["NAO_INICIADO", dia(2026, 10, 4), "ATENCAO"],
    ["NAO_INICIADO", dia(2026, 10, 5), "NO_PRAZO"],
  ] as const)("%s com fim %s → %s", (status, fim, esperado) => {
    expect(situacaoPrazo(status, fim, hoje)).toBe(esperado);
  });
  it("cancelada ou sem data: sem situação", () => {
    expect(situacaoPrazo("CANCELADO", dia(2026, 9, 1), hoje)).toBeNull();
    expect(situacaoPrazo("EM_ANDAMENTO", null, hoje)).toBeNull();
  });
});

describe("totais e progresso", () => {
  it("forecast = realizado + para concluir; desvio = forecast − previsto", () => {
    const t = totaisAtividade([
      { previsto: 4, paraConcluir: null, realizado: 1 },
      { previsto: 4, paraConcluir: 6, realizado: 2 },
    ]);
    expect(t).toEqual({ previsto: 8, realizado: 3, paraConcluir: 9, forecast: 12, desvio: 4 });
    expect(totaisAtividade([{ previsto: 4, paraConcluir: 2, realizado: 3 }], true).paraConcluir).toBe(0);
  });
  it("progresso ponderado pelo esforço; canceladas fora", () => {
    expect(progresso([{ previsto: 2, percentual: 100, status: "CONCLUIDO" }, { previsto: 38, percentual: 0, status: "NAO_INICIADO" }])).toBe(5);
    expect(progresso([{ previsto: 0, percentual: 50, status: "EM_ANDAMENTO" }, { previsto: 0, percentual: 0, status: "NAO_INICIADO" }])).toBe(25);
    expect(progresso([{ previsto: 10, percentual: 100, status: "CANCELADO" }])).toBe(0);
  });
  it("status e % coerentes", () => {
    expect(coerenciaStatus("CONCLUIDO", 40)).toEqual({ status: "CONCLUIDO", percentual: 100 });
    expect(coerenciaStatus("EM_ANDAMENTO", 100)).toEqual({ status: "CONCLUIDO", percentual: 100 });
    expect(coerenciaStatus("NAO_INICIADO", 25)).toEqual({ status: "EM_ANDAMENTO", percentual: 25 });
    expect(coerenciaStatus("BLOQUEADO", 30)).toEqual({ status: "BLOQUEADO", percentual: 30 });
  });
});

describe("qualidadeCronograma", () => {
  const base: AtividadeQualidade = { id: "1", codigo: "CRON-001", tarefa: "Tarefa", status: "NAO_INICIADO", inicio: dia(2026, 10, 5), fim: dia(2026, 10, 6), clienteParticipa: false, responsavelId: null, observacao: null, atribuicoes: [{ recursoId: "r", previsto: 4, realizado: 0 }] };
  it("atividade correta não gera alerta", () => {
    expect(qualidadeCronograma([base])).toEqual([]);
  });
  it("detecta os problemas encontrados nas planilhas", () => {
    const msgs = qualidadeCronograma([
      { ...base, id: "2", codigo: "CRON-010", fim: dia(2026, 10, 10) },
      { ...base, id: "3", codigo: "CRON-011", atribuicoes: [], tarefa: "Outra" },
      { ...base, id: "4", codigo: "CRON-012", tarefa: "Outra 2", inicio: null },
      { ...base, id: "5", codigo: "CRON-013", tarefa: "Tarefa" },
      { ...base, id: "6", codigo: "CRON-014", tarefa: "X", status: "CONCLUIDO" },
      { ...base, id: "7", codigo: "CRON-015", tarefa: "Y", responsavelId: "outro" },
    ]).map((a) => `${a.codigo}: ${a.mensagem}`);
    expect(msgs).toEqual([
      "CRON-010: Início ou fim em fim de semana.",
      "CRON-011: Sem recurso MAIS i9 nem participação do cliente.",
      "CRON-012: Sem datas: não entra na capacidade.",
      "CRON-013: Possível duplicidade de CRON-010.",
      "CRON-014: Concluída sem horas apontadas.",
      "CRON-015: Responsável diferente do executor, sem observação.",
    ]);
  });
});

describe("auxiliares", () => {
  it("dias úteis e próximo código", () => {
    expect(diasUteisEntre(dia(2026, 10, 9), dia(2026, 10, 12), new Set(["2026-10-12"])).length).toBe(1);
    expect(proximoCodigo("CRON", ["CRON-001", "CRON-006.2", "CRON-026"])).toBe("CRON-027");
    expect(proximoCodigo("REQ", [])).toBe("REQ-001");
  });
});
