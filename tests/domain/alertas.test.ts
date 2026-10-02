import { describe, expect, it } from "vitest";
import { dia } from "@/lib/domain/datas";
import { semanaPorId } from "@/lib/domain/semanas";
import { alertasAtividades, alertasDoUsuario, alertasSobrecarga, alertasStatusReport, ordenarAlertas } from "@/lib/domain/alertas";

const projeto = { id: "p1", nome: "Implantação WMS", cliente: "Kover", gpRecursoId: "r-carlos" };
const hoje = dia(2026, 10, 2);

describe("alertas", () => {
  it("atividade atrasada avisa executores e GP; chave estável; gravidade por dias", () => {
    const [a] = alertasAtividades([{ id: "a1", codigo: "CRON-006", tarefa: "Integração", fimPrevisto: dia(2026, 9, 25), projeto, recursos: ["r-luiz", "r-carlos"] }], hoje);
    expect(a.recursos).toEqual(["r-luiz", "r-carlos"]);
    expect(a.chave).toBe("ATIVIDADE_ATRASADA:a1:2026-09-25");
    expect(a.gravidade).toBe("ALTA");
    expect(a.detalhe).toContain("7 dia(s) de atraso");
  });
  it("sobrecarga só acima de 100%, uma chave por semana", () => {
    const semana = semanaPorId("2026-W40")!;
    const r = alertasSobrecarga([
      { recursoId: "r-luiz", nome: "Luiz", semana, planejado: 73, capacidade: 40 },
      { recursoId: "r-ana", nome: "Ana", semana, planejado: 40, capacidade: 40 },
    ]);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ chave: "SOBRECARGA:r-luiz:2026-W40", gravidade: "ALTA", gestores: true });
    expect(r[0].titulo).toContain("183%");
  });
  it("status report: nunca publicado ou há mais de 14 dias", () => {
    const r = alertasStatusReport(
      [
        { ...projeto, ultimo: null },
        { ...projeto, id: "p2", ultimo: dia(2026, 9, 25) },
        { ...projeto, id: "p3", ultimo: dia(2026, 9, 1) },
      ],
      hoje,
    );
    expect(r.map((x) => x.projetoId)).toEqual(["p1", "p3"]);
  });
  it("filtra por usuário e ordena por gravidade", () => {
    const semana = semanaPorId("2026-W40")!;
    const todos = [
      ...alertasAtividades([{ id: "a1", codigo: "CRON-1", tarefa: "x", fimPrevisto: dia(2026, 10, 1), projeto, recursos: ["r-luiz"] }], hoje),
      ...alertasSobrecarga([{ recursoId: "r-ana", nome: "Ana", semana, planejado: 50, capacidade: 40 }]),
    ];
    expect(alertasDoUsuario(todos, { recursoId: "r-luiz", gestor: false }).map((a) => a.tipo)).toEqual(["ATIVIDADE_ATRASADA"]);
    expect(alertasDoUsuario(todos, { recursoId: null, gestor: true }).map((a) => a.tipo)).toEqual(["SOBRECARGA"]);
    expect(ordenarAlertas(todos).map((a) => a.gravidade)).toEqual(["ALTA", "MEDIA"]);
  });
});

describe("e-mail diário", () => {
  it("escapa o texto, lista novos e conta os que continuam", async () => {
    const { montarResumo } = await import("@/lib/domain/alertas");
    const [a] = alertasAtividades([{ id: "a1", codigo: "CRON-1", tarefa: "Integração <SKP>", fimPrevisto: dia(2026, 9, 25), projeto, recursos: [] }], hoje);
    const m = montarResumo("Luiz Dornelles", [a], [a, a], "https://gestao.maisi9.com.br");
    expect(m.assunto).toBe("MAIS i9 · 1 novo(s) alerta(s) e 2 em aberto");
    expect(m.html).toContain("Integração &lt;SKP&gt;");
    expect(m.html).toContain('href="https://gestao.maisi9.com.br/projetos/p1/cronograma"');
    expect(m.texto).toContain("Olá, Luiz.");
  });
});
