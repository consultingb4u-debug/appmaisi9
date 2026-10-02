import { describe, expect, it } from "vitest";
import { chaveDia, dia } from "@/lib/domain/datas";
import { compararComBase, curvaS, impactoChangeRequest, progressoPlanejado, somarDiasUteis, type ItemBase } from "@/lib/domain/linha-base";

const item = (codigo: string, inicio: Date, fim: Date, esforco: number, extra: Partial<ItemBase> = {}): ItemBase => ({ codigo, tarefa: codigo, fase: "DEVELOPMENT", inicio, fim, esforco, marco: false, ...extra });

describe("linha de base", () => {
  const base = [item("CRON-001", dia(2026, 10, 5), dia(2026, 10, 9), 10), item("CRON-002", dia(2026, 10, 12), dia(2026, 10, 16), 10, { marco: true }), item("CRON-003", dia(2026, 10, 19), dia(2026, 10, 19), 4)];
  it("compara: igual, alterada (desvios), nova e removida; resumo com deslizamento", () => {
    const atual = [
      { ...base[0], status: "CONCLUIDO" },
      { ...base[1], fim: dia(2026, 10, 21), esforco: 14, status: "EM_ANDAMENTO" },
      { ...item("CRON-004", dia(2026, 10, 22), dia(2026, 10, 23), 6), status: "NAO_INICIADO" },
    ];
    const { linhas, resumo } = compararComBase(base, atual);
    expect(linhas.map((l) => [l.codigo, l.situacao])).toEqual([
      ["CRON-001", "IGUAL"],
      ["CRON-002", "ALTERADA"],
      ["CRON-004", "NOVA"],
      ["CRON-003", "REMOVIDA"],
    ]);
    expect(linhas[1]).toMatchObject({ desvioFim: 5, desvioEsforco: 4, desvioInicio: 0 });
    expect(resumo).toMatchObject({ deslizamentoDias: 4, esforcoBase: 24, esforcoAtual: 30, novas: 1, removidas: 1, alteradas: 1, marcosAtrasados: 1 });
  });
  it("progresso planejado por dias úteis, descontando feriado", () => {
    expect(progressoPlanejado(base, dia(2026, 10, 9))).toBe(41.7); // 10 de 24
    expect(progressoPlanejado(base, dia(2026, 10, 1))).toBe(0);
    // Com feriado em 12/10, CRON-002 se divide em 4 dias (2,5h cada): até 13/10 = 10 + 2,5 = 12,5 de 24
    expect(progressoPlanejado(base, dia(2026, 10, 13), new Set(["2026-10-12"]))).toBe(52.1);
    expect(progressoPlanejado([], dia(2026, 10, 1))).toBeNull();
  });
  it("curva S: planejado acumulado, realizado até hoje e forecast depois", () => {
    const pontos = curvaS({
      base,
      realizadoPorSemana: new Map([["2026-W41", 8]]),
      previstoPorSemana: new Map([["2026-W42", 12], ["2026-W43", 9]]),
      hoje: dia(2026, 10, 14),
    });
    expect(pontos.map((p) => [p.semanaId, p.planejado, p.realizado, p.forecast])).toEqual([
      ["2026-W41", 10, 8, null],
      ["2026-W42", 20, 8, 8],
      ["2026-W43", 24, null, 17],
    ]);
  });
  it("change request: soma horas e desloca Go Live em dias úteis", () => {
    expect(chaveDia(somarDiasUteis(dia(2026, 10, 9), 1))).toBe("2026-10-12");
    expect(chaveDia(somarDiasUteis(dia(2026, 10, 9), 1, new Set(["2026-10-12"])))).toBe("2026-10-13");
    expect(chaveDia(somarDiasUteis(dia(2026, 10, 12), -1))).toBe("2026-10-09");
    const r = impactoChangeRequest({ horasVendidas: 100, goLive: dia(2026, 11, 3) }, { horas: 16, dias: 5 });
    expect(r.horasVendidas).toBe(116);
    expect(chaveDia(r.goLive!)).toBe("2026-11-10");
    expect(impactoChangeRequest({ horasVendidas: null, goLive: null }, { horas: 8, dias: 3 })).toEqual({ horasVendidas: 8, goLive: null });
  });
});
