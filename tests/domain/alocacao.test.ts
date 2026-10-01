import { describe, expect, it } from "vitest";
import { editarCelula, horasPrevistas, lerHoras } from "@/lib/domain/alocacao";
import { enumPorRotulo, STATUS_PROJETO, PRIORIDADE } from "@/lib/domain/rotulos";

describe("lerHoras", () => {
  it.each([
    [4, 4],
    ["4h", 4],
    ["20h", 20],
    ["4,5h", 4.5],
    ["4.5", 4.5],
    [" 8 h ", 8],
    ["2 horas", 2],
    ["", null],
    [null, null],
  ])("%s → %s", (entrada, esperado) => {
    expect(lerHoras(entrada)).toBe(esperado);
  });
  it("texto inválido vira NaN", () => {
    expect(lerHoras("abc")).toBeNaN();
  });
});

describe("horasPrevistas", () => {
  it("override substitui o calculado; avulsas somam", () => {
    expect(horasPrevistas({ horasCalculadas: 10, horasManuais: null, horasAvulsas: 2 })).toBe(12);
    expect(horasPrevistas({ horasCalculadas: 10, horasManuais: 6, horasAvulsas: 2 })).toBe(8);
    expect(horasPrevistas({ horasCalculadas: 10, horasManuais: 0, horasAvulsas: 0 })).toBe(0);
  });
});

describe("enumPorRotulo", () => {
  it("reconhece rótulos da planilha sem depender de acento/caixa", () => {
    expect(enumPorRotulo(STATUS_PROJETO, "Em Andamento")).toBe("EM_ANDAMENTO");
    expect(enumPorRotulo(STATUS_PROJETO, "Aprovação Cliente")).toBe("APROVACAO_CLIENTE");
    expect(enumPorRotulo(STATUS_PROJETO, "aprovacao cliente")).toBe("APROVACAO_CLIENTE");
    expect(enumPorRotulo(PRIORIDADE, "Crítica")).toBe("CRITICA");
    expect(enumPorRotulo(PRIORIDADE, "Urgente")).toBeNull();
  });
});

describe("editarCelula", () => {
  it("célula nova vira override manual", () => {
    expect(editarCelula(8, null)).toEqual({ tipo: "salvar", horasManuais: 8 });
  });
  it("zerar célula sem nada calculado/realizado exclui", () => {
    expect(editarCelula(0, { horasCalculadas: 0, horasAvulsas: 0, horasRealizadas: 0 })).toEqual({ tipo: "excluir" });
    expect(editarCelula(0, null)).toEqual({ tipo: "excluir" });
  });
  it("zerar célula com realizado mantém o registro", () => {
    expect(editarCelula(0, { horasCalculadas: 0, horasAvulsas: 0, horasRealizadas: 3 })).toEqual({ tipo: "salvar", horasManuais: 0 });
  });
  it("preserva horas avulsas de gestão", () => {
    expect(editarCelula(6, { horasCalculadas: 0, horasAvulsas: 2, horasRealizadas: 0 })).toEqual({ tipo: "salvar", horasManuais: 4 });
  });
  it("valor igual ao calculado remove o override", () => {
    expect(editarCelula(12, { horasCalculadas: 12, horasAvulsas: 0, horasRealizadas: 0 })).toEqual({ tipo: "salvar", horasManuais: null });
    expect(editarCelula(20, { horasCalculadas: 12, horasAvulsas: 0, horasRealizadas: 0 })).toEqual({ tipo: "salvar", horasManuais: 20 });
  });
});
