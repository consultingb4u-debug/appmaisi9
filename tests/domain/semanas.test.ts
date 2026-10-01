import { describe, expect, it } from "vitest";
import { dia } from "@/lib/domain/datas";
import { rotuloSemana, semanaDe, semanasEntre } from "@/lib/domain/semanas";

describe("semanaDe", () => {
  it("S40/2026 começa em 28/09/2026, como no CTRL-003", () => {
    const s = semanaDe(dia(2026, 10, 1));
    expect(s.id).toBe("2026-W40");
    expect(s.inicio).toEqual(dia(2026, 9, 28));
    expect(s.fim).toEqual(dia(2026, 10, 4));
    expect(rotuloSemana(s)).toBe("S40/26");
  });

  it("S53/2026 existe e a semana seguinte é S01/2027", () => {
    expect(semanaDe(dia(2026, 12, 31)).id).toBe("2026-W53");
    expect(semanaDe(dia(2027, 1, 4)).id).toBe("2027-W01");
  });

  it("dias do início de janeiro podem pertencer à última semana do ano anterior", () => {
    expect(semanaDe(dia(2027, 1, 1)).id).toBe("2026-W53");
    expect(semanaDe(dia(2021, 1, 3)).id).toBe("2020-W53");
  });

  it("domingo pertence à semana que começou na segunda anterior", () => {
    expect(semanaDe(dia(2026, 10, 4)).id).toBe("2026-W40");
    expect(semanaDe(dia(2026, 10, 5)).id).toBe("2026-W41");
  });
});

describe("semanasEntre", () => {
  it("cobre o planejamento S40–S53 do CTRL-003 (14 semanas)", () => {
    const ss = semanasEntre(dia(2026, 9, 28), dia(2026, 12, 31));
    expect(ss).toHaveLength(14);
    expect(ss[0].id).toBe("2026-W40");
    expect(ss.at(-1)!.id).toBe("2026-W53");
  });
});
