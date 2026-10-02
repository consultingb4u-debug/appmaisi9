import { describe, expect, it } from "vitest";
import { chaveDia, dia } from "@/lib/domain/datas";
import { datasDaPosicao, posicoesDoCronograma, primeiroDiaUtil } from "@/lib/domain/modelo-cronograma";

describe("modelo de cronograma", () => {
  const feriados = new Set(["2026-10-12"]);
  const atividades = [
    { codigo: "CRON-001", inicio: dia(2026, 10, 5), fim: dia(2026, 10, 9) },
    { codigo: "CRON-002", inicio: dia(2026, 10, 13), fim: dia(2026, 10, 14) }, // depois do feriado de 12/10
    { codigo: "CRON-003", inicio: dia(2026, 10, 10), fim: dia(2026, 10, 10) }, // sábado
    { codigo: "CRON-004", inicio: null, fim: null },
  ];
  it("posições em dias úteis a partir da primeira atividade, ignorando feriados", () => {
    const p = posicoesDoCronograma(atividades, feriados);
    expect(p.get("CRON-001")).toEqual({ inicioDia: 0, duracaoDias: 5 });
    expect(p.get("CRON-002")).toEqual({ inicioDia: 5, duracaoDias: 2 });
    expect(p.get("CRON-003")).toEqual({ inicioDia: 5, duracaoDias: 1 });
    expect(p.get("CRON-004")).toEqual({ inicioDia: null, duracaoDias: null });
  });
  it("aplica num novo início (sem feriado no caminho) e ida e volta preserva as posições", () => {
    const p = posicoesDoCronograma(atividades, feriados);
    const d = datasDaPosicao(p.get("CRON-002")!, dia(2027, 2, 1));
    expect([chaveDia(d.inicio!), chaveDia(d.fim!)]).toEqual(["2027-02-08", "2027-02-09"]);
    const novo = ["CRON-001", "CRON-002"].map((c) => ({ codigo: c, ...datasDaPosicao(p.get(c)!, dia(2027, 2, 1)) }));
    expect(posicoesDoCronograma(novo).get("CRON-002")).toEqual({ inicioDia: 5, duracaoDias: 2 });
  });
  it("início num sábado vai para segunda; sem posição, sem datas", () => {
    expect(chaveDia(primeiroDiaUtil(dia(2026, 10, 10)))).toBe("2026-10-12");
    expect(chaveDia(datasDaPosicao({ inicioDia: 0, duracaoDias: 1 }, dia(2026, 10, 10), feriados).inicio!)).toBe("2026-10-13");
    expect(datasDaPosicao({ inicioDia: null, duracaoDias: null }, dia(2026, 10, 1))).toEqual({ inicio: null, fim: null });
  });
});
