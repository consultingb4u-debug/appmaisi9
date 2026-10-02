import { describe, expect, it } from "vitest";
import { chaveDia, dia } from "@/lib/domain/datas";
import { eventosPorDia, gradeDoMes, lerMes, mesVizinho } from "@/lib/domain/calendario";

describe("calendário", () => {
  it("outubro/2026 começa na segunda 28/09 e tem 5 semanas", () => {
    const g = gradeDoMes(2026, 10);
    expect(g).toHaveLength(5);
    expect(chaveDia(g[0][0].data)).toBe("2026-09-28");
    expect(g[0][0].doMes).toBe(false);
    expect(chaveDia(g[4][6].data)).toBe("2026-11-01");
  });
  it("mês: leitura e navegação na virada do ano", () => {
    expect(lerMes("2026-13", dia(2026, 10, 2))).toEqual({ ano: 2026, mes: 10 });
    expect(mesVizinho(2026, 12, 1)).toBe("2027-01");
    expect(mesVizinho(2026, 1, -1)).toBe("2025-12");
  });
  it("período ocupa só dias úteis; fora da janela é ignorado; feriado vem primeiro", () => {
    const m = eventosPorDia(
      [
        { tipo: "AUSENCIA", data: dia(2026, 10, 9), ate: dia(2026, 10, 13), titulo: "Férias Luiz" },
        { tipo: "FIM", data: dia(2026, 10, 12), titulo: "CRON-001" },
        { tipo: "FERIADO", data: dia(2026, 10, 12), titulo: "N. Sra. Aparecida" },
        { tipo: "MARCO", data: dia(2026, 12, 1), titulo: "fora" },
      ],
      dia(2026, 9, 28),
      dia(2026, 11, 1),
    );
    expect([...m.keys()].sort()).toEqual(["2026-10-09", "2026-10-12", "2026-10-13"]);
    expect(m.get("2026-10-12")!.map((e) => e.tipo)).toEqual(["FERIADO", "FIM", "AUSENCIA"]);
  });
});
