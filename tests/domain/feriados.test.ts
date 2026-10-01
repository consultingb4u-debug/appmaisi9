import { describe, expect, it } from "vitest";
import { dia } from "@/lib/domain/datas";
import { feriadosNacionais, pascoa } from "@/lib/domain/feriados";

describe("pascoa", () => {
  it.each([
    [2024, dia(2024, 3, 31)],
    [2025, dia(2025, 4, 20)],
    [2026, dia(2026, 4, 5)],
    [2027, dia(2027, 3, 28)],
  ])("Páscoa de %i", (ano, esperado) => {
    expect(pascoa(ano)).toEqual(esperado);
  });
});

describe("feriadosNacionais", () => {
  it("2026 inclui Sexta-feira Santa (03/04), Corpus Christi (04/06) e 12/10", () => {
    const f = feriadosNacionais(2026).map((x) => x.data.toISOString().slice(0, 10));
    expect(f).toContain("2026-04-03");
    expect(f).toContain("2026-06-04");
    expect(f).toContain("2026-10-12");
    expect(f).toContain("2026-11-20");
    expect(f).toHaveLength(13);
  });
});
