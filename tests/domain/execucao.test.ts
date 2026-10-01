import { describe, expect, it } from "vitest";
import { dia } from "@/lib/domain/datas";
import { sugerirStatusExecutivo, type Indicadores } from "@/lib/domain/status";
import { avaliarComplexidade, itemVencido, nivelBase, nivelMinimo, prontidaoGoLive, resumoTestes, severidade, severidadeItem, sugestaoPreProjeto } from "@/lib/domain/execucao";

describe("complexidade", () => {
  it("faixas do nível base", () => {
    expect([0, 8, 9, 16, 17, 24, 25, 36].map(nivelBase)).toEqual(["N1", "N1", "N2", "N2", "N3", "N3", "N4", "N4"]);
  });
  it("gatilhos elevam o mínimo", () => {
    expect([0, 1, 2, 5].map(nivelMinimo)).toEqual(["N1", "N3", "N4", "N4"]);
  });
  it("sem notas: não avaliado", () => {
    expect(avaliarComplexidade([{ nota: null, gatilhoCritico: true }]).avaliado).toBe(false);
  });
  it("final é o maior entre base e mínimo; gatilho só conta com nota 3", () => {
    const r = avaliarComplexidade([
      { nota: 3, gatilhoCritico: true },
      { nota: 2, gatilhoCritico: true },
      { nota: 1, gatilhoCritico: false },
      { nota: null, gatilhoCritico: false },
    ]);
    expect(r).toMatchObject({ score: 6, gatilhos: 1, base: "N1", minimo: "N3", final: "N3", governanca: "Gestão Parcial", respondidos: 3 });
  });
  it("score alto sem gatilho", () => {
    expect(avaliarComplexidade(Array.from({ length: 12 }, () => ({ nota: 3, gatilhoCritico: false }))).final).toBe("N4");
  });
});

describe("riscos", () => {
  it("severidade P×I", () => {
    expect([severidade(1, 4), severidade(3, 3), severidade(3, 5), severidade(4, 4), severidade(null, 3)]).toEqual(["BAIXA", "MEDIA", "ALTA", "CRITICA", null]);
  });
  it("sem P×I usa o maior impacto", () => {
    expect(severidadeItem({ probabilidade: null, impacto: null, impactos: ["BAIXO", "ALTO", "NAO"] })).toBe("ALTA");
    expect(severidadeItem({ probabilidade: null, impacto: null, impactos: ["NAO"] })).toBeNull();
  });
  it("vencido só se aberto", () => {
    const hoje = dia(2026, 10, 1);
    expect(itemVencido("ABERTO", dia(2026, 9, 30), hoje)).toBe(true);
    expect(itemVencido("ABERTO", dia(2026, 10, 1), hoje)).toBe(false);
    expect(itemVencido("FECHADO", dia(2026, 9, 1), hoje)).toBe(false);
  });
});

describe("testes", () => {
  it("resume pelo último ciclo, sem contar N/A na base", () => {
    const r = resumoTestes(["APROVADO", "APROVADO", "REPROVADO", "PLANEJADO", "NA", null]);
    expect(r).toMatchObject({ total: 6, aprovados: 2, reprovados: 1, pendentes: 2, na: 1, executado: 60, aprovado: 40 });
  });
});

describe("go/no-go", () => {
  const base = { defeitosGraves: 0, uatReprovados: 0, uatPendentes: 0 };
  it("tudo concluído: GO (ignora o próprio item de decisão)", () => {
    const r = prontidaoGoLive({
      ...base,
      itens: [
        { item: "UAT aprovado", obrigatorio: "SIM", status: "CONCLUIDO", aprovacao: "APROVADO" },
        { item: "Carga de dados", obrigatorio: "CONDICIONAL", status: "NA", aprovacao: "NA" },
        { item: "Go/No-Go aprovado", obrigatorio: "SIM", status: "PENDENTE", aprovacao: "PENDENTE" },
      ],
    });
    expect(r).toEqual({ percentual: 100, bloqueios: [], ressalvas: [], sugestao: "GO" });
  });
  it("condicional pendente: ressalva; obrigatório pendente ou defeito grave: NO-GO", () => {
    const itens = [
      { item: "A", obrigatorio: "SIM" as const, status: "CONCLUIDO" as const, aprovacao: "PENDENTE" as const },
      { item: "B", obrigatorio: "CONDICIONAL" as const, status: "PENDENTE" as const, aprovacao: "PENDENTE" as const },
    ];
    expect(prontidaoGoLive({ ...base, itens }).sugestao).toBe("GO_COM_RESSALVAS");
    expect(prontidaoGoLive({ ...base, itens, defeitosGraves: 1 }).sugestao).toBe("NO_GO");
    expect(prontidaoGoLive({ ...base, itens: [{ ...itens[0], status: "EM_ANDAMENTO" }] }).bloqueios).toEqual(["Obrigatório pendente: A"]);
    expect(prontidaoGoLive({ ...base, itens: [{ ...itens[0], aprovacao: "REPROVADO" }] }).sugestao).toBe("NO_GO");
  });
});

describe("pré-projeto", () => {
  it("sugestão pelo checklist", () => {
    expect(sugestaoPreProjeto([])).toBe("EM_PREPARACAO");
    expect(sugestaoPreProjeto(["CONCLUIDO", "NA"])).toBe("PRONTO");
    expect(sugestaoPreProjeto(["CONCLUIDO", "CONCLUIDO", "CONCLUIDO", "PENDENTE"])).toBe("PRONTO_COM_RESSALVAS");
    expect(sugestaoPreProjeto(["CONCLUIDO", "BLOQUEADO"])).toBe("BLOQUEADO");
    expect(sugestaoPreProjeto(["PENDENTE", "PENDENTE"])).toBe("EM_PREPARACAO");
  });
});

describe("status executivo sugerido", () => {
  const base: Indicadores = {
    geradoEm: "",
    progresso: 50,
    faseAtual: "Development",
    goLive: null,
    horas: { vendidas: 100, planejadas: 90, realizadas: 40, forecast: 95 },
    atividades: { total: 10, concluidas: 5, atrasadas: 0 },
    complexidade: "N2",
    pendenciasVencidas: 0,
    itensAbertos: 0,
    riscosAbertos: 0,
    riscosAltos: 0,
    changeRequests: 0,
    defeitosAbertos: 0,
    defeitosGraves: 0,
    testesInternos: { total: 0, aprovado: 0 },
    uat: { total: 0, aprovado: 0 },
    prontidaoGoLive: null,
  };
  it("verde, amarelo e vermelho", () => {
    expect(sugerirStatusExecutivo(base)).toBe("VERDE");
    expect(sugerirStatusExecutivo({ ...base, pendenciasVencidas: 1 })).toBe("AMARELO");
    expect(sugerirStatusExecutivo({ ...base, atividades: { ...base.atividades, atrasadas: 3 } })).toBe("VERMELHO");
    expect(sugerirStatusExecutivo({ ...base, horas: { ...base.horas, forecast: 120 } })).toBe("VERMELHO");
  });
});
