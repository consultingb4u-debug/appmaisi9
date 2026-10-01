import { describe, expect, it } from "vitest";
import { dia } from "@/lib/domain/datas";
import { capacidadeDaSemana, capacidadeVigente, faixaUtilizacao, validarVigencias } from "@/lib/domain/capacidade";

describe("capacidadeDaSemana", () => {
  it("semana sem feriado: líquida = bruta", () => {
    const c = capacidadeDaSemana(dia(2026, 9, 28), 40, new Set());
    expect(c).toMatchObject({ bruta: 40, liquida: 40, diasUteis: 5 });
  });

  it("S42/2026 tem 12/10 (segunda): 40h → 32h; 30h → 24h", () => {
    const feriados = new Set(["2026-10-12"]);
    expect(capacidadeDaSemana(dia(2026, 10, 12), 40, feriados).liquida).toBe(32);
    expect(capacidadeDaSemana(dia(2026, 10, 12), 30, feriados).liquida).toBe(24);
  });

  it("feriado em fim de semana não reduz capacidade", () => {
    // 15/11/2026 é domingo
    const c = capacidadeDaSemana(dia(2026, 11, 9), 40, new Set(["2026-11-15"]));
    expect(c.liquida).toBe(40);
  });
});

describe("capacidadeVigente", () => {
  const vigencias = [
    { vigenciaInicio: dia(2026, 1, 1), vigenciaFim: dia(2026, 10, 31), horasSemanais: 40 },
    { vigenciaInicio: dia(2026, 11, 1), vigenciaFim: null, horasSemanais: 30 },
  ];
  it("usa a vigência que cobre a data", () => {
    expect(capacidadeVigente(vigencias, dia(2026, 10, 15))).toBe(40);
    expect(capacidadeVigente(vigencias, dia(2026, 12, 1))).toBe(30);
    expect(capacidadeVigente(vigencias, dia(2025, 12, 1))).toBe(0);
  });
  it("detecta sobreposição", () => {
    expect(validarVigencias(vigencias)).toBeNull();
    expect(
      validarVigencias([...vigencias, { vigenciaInicio: dia(2026, 12, 1), vigenciaFim: null, horasSemanais: 20 }]),
    ).toMatch(/sobrepostas/);
  });
});

describe("faixaUtilizacao (faixas do CTRL-003)", () => {
  it.each([
    [0.3, "DISPONIVEL"],
    [0.5, "ADEQUADO"],
    [0.84, "ADEQUADO"],
    [0.85, "ATENCAO"],
    [1, "ATENCAO"],
    [1.83, "SOBRECARREGADO"],
  ] as const)("%f → %s", (u, faixa) => {
    expect(faixaUtilizacao(u)).toBe(faixa);
  });
});
