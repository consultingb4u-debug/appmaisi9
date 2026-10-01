import { describe, expect, it } from "vitest";
import { dia } from "@/lib/domain/datas";
import { avaliarCtrl003, tipoIndisponibilidade, tipoProjetoPorNome, type ContextoCtrl003 } from "@/lib/importacao/ctrl003/avaliar";
import type { LinhaLida } from "@/lib/importacao/ctrl003/ler";

const ctx = (extra: Partial<ContextoCtrl003> = {}): ContextoCtrl003 => ({
  recursos: [
    { id: "r-luiz", nome: "Luiz Dornelles", apelidos: ["Dornelles"] },
    { id: "r-carlos", nome: "Carlos Camargo", apelidos: [] },
    { id: "r-laura", nome: "Laura Camargo", apelidos: ["Laura Iris"] },
    { id: "r-miguel", nome: "Miguel Barater", apelidos: [] },
  ],
  clientes: [
    { id: "c-dipil", nome: "Dipil", apelidos: [] },
    { id: "c-kover", nome: "Kover", apelidos: [] },
  ],
  projetos: [],
  alocacoes: new Map(),
  capacidades: new Map([["r-miguel", [{ vigenciaInicio: dia(2026, 1, 1), vigenciaFim: null, horasSemanais: 30 }]]]),
  indisponibilidades: new Set(),
  gpPadraoId: "r-carlos",
  hoje: dia(2026, 10, 1),
  ...extra,
});

const projeto = (cliente: string, nome: string, extra: Record<string, unknown> = {}): LinhaLida => ({
  aba: "Portfólio Projetos",
  linhaOrigem: 4,
  entidade: "Projeto",
  dados: { cliente, projeto: nome, status: "Em Andamento", notas: null, funcional: "Luiz Dornelles", tecnico: null, horas: null, kickoff: null, goLive: null, encerramento: null, ...extra },
});

const alocacao = (extra: Record<string, unknown> = {}): LinhaLida => ({
  aba: "Planejamento Recursos",
  linhaOrigem: 5,
  entidade: "Alocacao",
  dados: { cliente: "DIPIL", projeto: "WMS Expedição", recurso: "Luiz Dornelles", semana: "S40", inicioSemana: "2026-09-28", horasPrevistas: "33h", horasRealizadas: null, status: "Em Andamento", prioridade: "Alta", observacao: "Preparação", ...extra },
});

describe("avaliarCtrl003", () => {
  it("cria projeto novo com GP padrão, membro funcional e tipo inferido", () => {
    const { avaliacoes } = avaliarCtrl003([projeto("Dipil", "WMS Expedição"), projeto("Agricopel", "Alocação DEV")], ctx());
    const [a, b] = avaliacoes;
    expect(a.acao).toBe("CRIAR");
    expect(a.status).toBe("ALERTA"); // sem datas e sem horas
    expect(a.resolvido).toMatchObject({ gpId: "r-carlos", tipo: "PROJETO", membros: [{ recursoId: "r-luiz", papel: "FUNCIONAL" }] });
    expect(b.status).toBe("ERRO"); // cliente Agricopel não cadastrado
    expect(tipoProjetoPorNome("Alocação DEV")).toBe("ALOCACAO");
  });

  it("alocação: cliente com outra grafia (DIPIL), horas em texto e projeto criado no mesmo lote", () => {
    const { avaliacoes } = avaliarCtrl003([projeto("Dipil", "WMS Expedição"), alocacao()], ctx());
    const a = avaliacoes[1];
    expect(a.acao).toBe("CRIAR");
    expect(a.resolvido).toMatchObject({ projeto: { novo: "c-dipil|wms expedicao" }, recursoId: "r-luiz", semanaId: "2026-W40", horasManuais: 33, horasAvulsas: 0, status: "EM_ANDAMENTO", prioridade: "ALTA" });
    expect(a.mensagens.some((m) => m.mensagem.includes("texto"))).toBe(true);
  });

  it("projeto novo herda a maior prioridade do planejamento", () => {
    const { avaliacoes } = avaliarCtrl003([projeto("Dipil", "WMS Expedição"), alocacao({ prioridade: "Alta" }), alocacao({ inicioSemana: "2026-10-05", semana: "S41", prioridade: "Crítica" })], ctx());
    expect(avaliacoes[0].resolvido).toMatchObject({ prioridade: "CRITICA" });
    expect(avaliarCtrl003([projeto("Kover", "Implantação WMS")], ctx()).avaliacoes[0].resolvido).toMatchObject({ prioridade: "MEDIA" });
  });

  it("horas de GP entram como avulsas", () => {
    const { avaliacoes } = avaliarCtrl003([projeto("Dipil", "WMS Expedição"), alocacao({ recurso: "Carlos Camargo", horasPrevistas: "2h", observacao: "GP | acompanhamento" })], ctx());
    expect(avaliacoes[1].resolvido).toMatchObject({ horasManuais: null, horasAvulsas: 2 });
  });

  it("projeto fora do portfólio e linha repetida são erros", () => {
    const { avaliacoes } = avaliarCtrl003([alocacao(), projeto("Dipil", "WMS Expedição"), alocacao()], ctx());
    expect(avaliacoes[0].acao).toBe("CRIAR"); // projeto aparece depois no lote, mas está no portfólio
    const semPortfolio = avaliarCtrl003([alocacao()], ctx()).avaliacoes[0];
    expect(semPortfolio.status).toBe("ERRO");
    expect(semPortfolio.acao).toBe("IGNORAR");
    expect(avaliacoes[2].status).toBe("ERRO");
  });

  it("projeto existente sem mudança é ignorado; com mudança de status é atualizado", () => {
    const existente = {
      id: "p1", clienteId: "c-kover", nome: "Implantação WMS", status: "EM_ANDAMENTO" as const, notas: null, horasVendidas: null,
      dataKickoff: null, dataGoLiveAlvo: null, dataEncerramentoPrevista: null, membros: [{ recursoId: "r-luiz", papel: "FUNCIONAL" }],
    };
    const igual = avaliarCtrl003([projeto("Kover", "Implantação WMS")], ctx({ projetos: [existente] })).avaliacoes[0];
    expect(igual.acao).toBe("IGNORAR");
    const mudou = avaliarCtrl003([projeto("Kover", "implantacao wms", { status: "Bloqueado" })], ctx({ projetos: [existente] })).avaliacoes[0];
    expect(mudou.acao).toBe("ATUALIZAR");
    expect(mudou.resolvido).toMatchObject({ ref: { id: "p1" }, status: "BLOQUEADO", gpId: null });
  });

  it("recurso desconhecido gera pendência de De-Para; apelido resolve", () => {
    const r = avaliarCtrl003(
      [
        { aba: "Indisponibilidades", linhaOrigem: 4, entidade: "Indisponibilidade", dados: { recurso: "Laura Iris", tipo: "Treinamento PMI", inicio: "2026-10-19", fim: "2026-10-19", horas: 8, observacao: null, status: "Pendente" } },
        alocacao({ recurso: "Fulano" }),
      ],
      ctx(),
    );
    expect(r.avaliacoes[0].resolvido).toMatchObject({ recursoId: "r-laura", tipo: "TREINAMENTO", horasPorDia: 8, status: "PENDENTE" });
    expect(r.pendencias).toEqual([{ tipo: "RECURSO", texto: "Fulano", ocorrencias: 1 }]);
  });

  it("capacidade: igual à do sistema é ignorada; diferente gera nova vigência", () => {
    const linha = (horas: number | null): LinhaLida => ({ aba: "Capacidade", linhaOrigem: 12, entidade: "Capacidade", dados: { recurso: "Miguel Barater", semanas: { S40: horas, S41: horas } } });
    const ref = [alocacao(), projeto("Dipil", "WMS Expedição")];
    expect(avaliarCtrl003([linha(30), ...ref], ctx()).avaliacoes[0].acao).toBe("IGNORAR");
    const mudou = avaliarCtrl003([linha(20), ...ref], ctx()).avaliacoes[0];
    expect(mudou.acao).toBe("ATUALIZAR");
    expect(mudou.resolvido).toEqual({ recursoId: "r-miguel", vigenciaInicio: "2026-09-28", horasSemanais: 20 });
    expect(avaliarCtrl003([linha(null)], ctx()).avaliacoes[0]).toMatchObject({ acao: "IGNORAR", status: "ALERTA" });
  });

  it("tipo de indisponibilidade por texto livre", () => {
    expect(tipoIndisponibilidade("Férias")).toBe("FERIAS");
    expect(tipoIndisponibilidade("Feriado municipal")).toBe("FERIADO_LOCAL");
    expect(tipoIndisponibilidade("Atestado")).toBe("AUSENCIA");
    expect(tipoIndisponibilidade("Viagem")).toBe("OUTROS");
  });
});
