import { describe, expect, it } from "vitest";
import { avaliarCtrl001, codigoBase, type ContextoCtrl001 } from "@/lib/importacao/ctrl001/avaliar";
import type { LinhaLida001 } from "@/lib/importacao/ctrl001/ler";
import { dia } from "@/lib/domain/datas";
import type { ContextoExecucao } from "@/lib/importacao/ctrl001/execucao";
import { CRITERIOS_COMPLEXIDADE } from "@/lib/domain/modelos";

const ctx = (extra: Partial<ContextoCtrl001> = {}): ContextoCtrl001 => ({
  projeto: { nome: "Implantação WMS", cliente: "Kover", dataKickoff: null, dataGoLiveAlvo: null },
  recursos: [
    { id: "r-luiz", nome: "Luiz Dornelles", apelidos: ["Dornelles"] },
    { id: "r-murilo", nome: "Murilo Fernandes", apelidos: [] },
  ],
  backlog: new Map(),
  atividades: new Map(),
  execucao: execVazio(),
  ...extra,
});

function execVazio(): ContextoExecucao {
  return {
    criterios: CRITERIOS_COMPLEXIDADE.map((c) => c.nome),
    complexidade: null,
    preProjetoStatus: null,
    preItens: new Map(),
    operacional: new Map(),
    casos: new Map(),
    deployItens: new Map(),
    statusReports: new Set(),
  };
}

let n = 2;
const atividade = (id: string, extra: Record<string, unknown> = {}): LinhaLida001 => ({
  aba: "Cronograma",
  linhaOrigem: n++,
  entidade: "Atividade",
  dados: {
    ID: id, Fase: "Development", Atividade: "REQ-002", Tarefa: "Concluir integração SKP > Protheus", "Módulo | Processo": "Projeto | Processo",
    "Recurso MAIS i9": "Luiz Dornelles", "Recurso Cliente": "Leondil Ribeiro", Responsável: "Luiz Dornelles",
    "Início Previsto": "2026-10-05", "Fim Previsto": "2026-10-05", "Esforço Previsto (h)": 4, "Esforço Realizado (h)": 0, "Horas para Concluir": 4,
    "% Conclusão": 0, Status: "Não iniciado", Predecessora: "CRON-005", "Marco?": "Não", "Data Real Conclusão": null, Observação: null,
    ...extra,
  } as LinhaLida001["dados"],
});
const req: LinhaLida001 = { aba: "Backlog", linhaOrigem: 3, entidade: "Backlog", dados: { ID: "REQ-002", Requisito: "Concluir integração", Tipo: "Entrega", Prioridade: "Alta", "Aderência ao Padrão": "A validar", "Customização?": "A confirmar", "Estimativa h": 16 } };

describe("avaliarCtrl001", () => {
  it("agrupa CRON-006, .2 e .3 numa atividade com 2 recursos e divide o esforço repetido", () => {
    const linhas = [req, atividade("CRON-005", { Tarefa: "Validar origem", Predecessora: null }), atividade("CRON-006"), atividade("CRON-006.2", { "Recurso MAIS i9": "Murilo Fernandes" }), atividade("CRON-006.3", { "Recurso MAIS i9": null })];
    const { avaliacoes } = avaliarCtrl001(linhas, ctx());
    const principal = avaliacoes[2];
    expect(principal.acao).toBe("CRIAR");
    expect(principal.resolvido).toMatchObject({
      codigo: "CRON-006",
      backlogCodigo: "REQ-002",
      clienteParticipa: true,
      contatoNome: "Leondil Ribeiro",
      predecessoras: ["CRON-005"],
      atribuicoes: [
        { recursoId: "r-luiz", esforcoPrevisto: 2, horasParaConcluir: null },
        { recursoId: "r-murilo", esforcoPrevisto: 2, horasParaConcluir: null },
      ],
    });
    expect(avaliacoes[3]).toMatchObject({ acao: "IGNORAR", status: "ALERTA", resolvido: null });
    expect(avaliacoes[4].mensagens[0].mensagem).toContain("agrupada em CRON-006");
  });

  it("'Horas para Concluir' diferente de previsto − realizado é mantida (dividida entre os recursos)", () => {
    const { avaliacoes } = avaliarCtrl001([atividade("CRON-009", { "Horas para Concluir": 6, Predecessora: null })], ctx());
    expect(avaliacoes[0].resolvido).toMatchObject({ atribuicoes: [{ recursoId: "r-luiz", esforcoPrevisto: 4, horasParaConcluir: 6 }] });
  });

  it("status 'Atrasado' vira situação calculada; % em fração vira 0–100; fim no sábado alerta", () => {
    const { avaliacoes } = avaliarCtrl001([atividade("CRON-010", { Status: "Atrasado", "% Conclusão": 0.25, "Fim Previsto": "2026-10-10", "Início Previsto": "2026-10-09", Predecessora: null })], ctx());
    expect(avaliacoes[0].resolvido).toMatchObject({ status: "EM_ANDAMENTO", percentualConclusao: 25 });
    const textos = avaliacoes[0].mensagens.map((m) => m.mensagem).join(" | ");
    expect(textos).toContain("deixa de ser status");
    expect(textos).toContain("fim de semana");
  });

  it("recurso desconhecido é erro e vai para o De-Para; fase fora das 4 oficiais é erro", () => {
    const r = avaliarCtrl001([atividade("CRON-001", { "Recurso MAIS i9": "Fulano", Predecessora: null }), atividade("CRON-002", { Fase: "Homologação", Predecessora: null })], ctx());
    expect(r.avaliacoes.map((a) => a.status)).toEqual(["ERRO", "ERRO"]);
    expect(r.pendencias).toEqual([{ tipo: "RECURSO", texto: "Fulano", ocorrencias: 1 }]);
  });

  it("reimportação sem mudanças é ignorada; cabeçalho preenche Go Live vazio", () => {
    const existente = {
      codigo: "CRON-006", fase: "DEVELOPMENT", tarefa: "Concluir integração SKP > Protheus", backlogCodigo: null, inicioPrevisto: dia(2026, 10, 5), fimPrevisto: dia(2026, 10, 5),
      percentualConclusao: 0, status: "NAO_INICIADO", marco: false, responsavelId: "r-luiz", atribuicoes: [{ recursoId: "r-luiz", esforcoPrevisto: 4, horasParaConcluir: null }], predecessoras: [],
    };
    const linha = atividade("CRON-006", { Atividade: null, Predecessora: null });
    expect(avaliarCtrl001([linha], ctx({ atividades: new Map([["CRON-006", existente]]) })).avaliacoes[0].acao).toBe("IGNORAR");
    const cab: LinhaLida001 = { aba: "Pré-Projeto", linhaOrigem: 3, entidade: "Cabecalho", dados: { projeto: "Implantação WMS", cliente: "Kover", gp: "GP MAIS i9", inicio: null, goLive: "2026-11-03" } };
    const a = avaliarCtrl001([cab], ctx()).avaliacoes[0];
    expect(a).toMatchObject({ acao: "ATUALIZAR", resolvido: { dataGoLiveAlvo: "2026-11-03", dataKickoff: null } });
    expect(a.mensagens[0].mensagem).toContain("GP");
  });

  it("planilha de outro projeto gera alerta", () => {
    const cab: LinhaLida001 = { aba: "Pré-Projeto", linhaOrigem: 3, entidade: "Cabecalho", dados: { projeto: "Reforma Tributária", cliente: "Sulmedic", gp: null, inicio: null, goLive: null } };
    expect(avaliarCtrl001([cab], ctx()).avaliacoes[0].mensagens[0].mensagem).toContain("diferente do projeto escolhido");
  });

  it("codigoBase", () => {
    expect(codigoBase("CRON-006.3")).toBe("CRON-006");
    expect(codigoBase(" CRON-010 ")).toBe("CRON-010");
  });
});

describe("abas de execução", () => {
  const ti = (id: string, extra: Record<string, unknown> = {}): LinhaLida001 => ({
    aba: "Teste Interno",
    linhaOrigem: n++,
    entidade: "TesteInterno",
    dados: { ID: id, Requisito: "REQ-002", "Módulo | Processo": "WMS", "Cenário | Passos": "Validar recebimento", "Responsável MAIS i9": "Luiz Dornelles", Resultado: "Planejado", ...extra } as LinhaLida001["dados"],
  });

  it("complexidade: calcula o nível pela regra e ignora planilha sem notas", () => {
    const dados: Record<string, string | number | null> = { avaliador: "Laura Iris", data: "2026-09-28", horas: 120, nivelPlanilha: "N1" };
    for (const c of CRITERIOS_COMPLEXIDADE) {
      dados[`nota:${c.nome}`] = c.nome === "Integrações" ? 3 : 1;
      dados[`gatilho:${c.nome}`] = c.nome === "Integrações" ? "Sim" : "Não";
    }
    const linha: LinhaLida001 = { aba: "Pré-Projeto | Complexidade", linhaOrigem: 10, entidade: "Complexidade", dados };
    const a = avaliarCtrl001([linha], ctx()).avaliacoes[0];
    expect(a.acao).toBe("CRIAR");
    expect(a.mensagens.map((m) => m.mensagem).join()).toContain("pela regra o nível é N3");
    const vazio = { ...linha, dados: { avaliador: "GP MAIS i9", "nota:Duração": null } };
    expect(avaliarCtrl001([vazio], ctx()).avaliacoes[0].acao).toBe("IGNORAR");
  });

  it("testes: ID repetido ganha novo código; responsável composto e primeiro nome", () => {
    const linhas = [ti("TI-001"), ti("TI-002"), ti("TI-001", { Requisito: "Ambiente WMS/ERP", "Cenário | Passos": "1. Acessar WMS", "Responsável MAIS i9": "Murilo / Dornelles", Resultado: "Aprovado", "Validação MAIS i9": "Aprovado" })];
    const r = avaliarCtrl001(linhas, ctx()).avaliacoes;
    expect(r[2].chave).toBe("INTERNO|TI-003");
    expect(r[2].resolvido).toMatchObject({
      codigo: "TI-003",
      backlogCodigo: null,
      cenario: "Ambiente WMS/ERP",
      passos: "1. Acessar WMS",
      responsavelId: "r-murilo",
      responsavelTexto: "Murilo / Dornelles",
      execucao: { resultado: "APROVADO", validacao: "APROVADO" },
    });
    expect(r[0].resolvido).toMatchObject({ execucao: null, responsavelId: "r-luiz", responsavelTexto: null });
  });

  it("testes: reimportar com resultado diferente vira novo ciclo; igual é ignorado", () => {
    const linha = ti("TI-005", { Resultado: "Reprovado", "Defeito | Pendência": "Etiqueta não sai" });
    const base = avaliarCtrl001([linha], ctx()).avaliacoes[0].resolvido as { execucao: unknown };
    const { execucao, ...semExec } = base;
    void execucao;
    const casos = (resultado: string) => new Map([["INTERNO|TI-005", { json: JSON.stringify(semExec), ultima: { resultado, validacao: "PENDENTE" } }]]);
    expect(avaliarCtrl001([linha], ctx({ execucao: { ...execVazio(), casos: casos("REPROVADO") } })).avaliacoes[0].acao).toBe("IGNORAR");
    const a = avaliarCtrl001([linha], ctx({ execucao: { ...execVazio(), casos: casos("PLANEJADO") } })).avaliacoes[0];
    expect(a.acao).toBe("ATUALIZAR");
    expect(a.mensagens.map((m) => m.mensagem).join()).toContain("novo ciclo");
  });

  it("operacional: tipo inválido é erro; 'Sim' em impacto vira Médio", () => {
    const op = (extra: Record<string, unknown>): LinhaLida001 => ({ aba: "Operacional", linhaOrigem: n++, entidade: "Operacional", dados: { ID: "PEN-001", Tipo: "Pendência", Descrição: "Acesso VPN", "Impacto Prazo": "Sim", Status: "Aberto", ...extra } as LinhaLida001["dados"] });
    const ok = avaliarCtrl001([op({})], ctx()).avaliacoes[0];
    expect(ok.resolvido).toMatchObject({ tipo: "PENDENCIA", impactoPrazo: "MEDIO", status: "ABERTO" });
    expect(avaliarCtrl001([op({ Tipo: "Qualquer" })], ctx()).avaliacoes[0].status).toBe("ERRO");
  });

  it("deployment e status report-modelo", () => {
    const dep: LinhaLida001 = { aba: "Deployment", linhaOrigem: 2, entidade: "DeploymentItem", dados: { Categoria: "Deploy", Item: "Smoke test", "Obrigatório?": "Condicional", Status: "Planejado", Responsável: "Luiz Dornelles" } };
    expect(avaliarCtrl001([dep], ctx()).avaliacoes[0].resolvido).toMatchObject({ obrigatorio: "CONDICIONAL", status: "PENDENTE", responsavelId: "r-luiz" });
    const sr: LinhaLida001 = { aba: "Status Report", linhaOrigem: 1, entidade: "StatusReport", dados: { "Status Executivo": "Amarelo", "Resumo Executivo": "[Resumo executivo: o que foi concluído]" } };
    expect(avaliarCtrl001([sr], ctx()).avaliacoes[0].acao).toBe("IGNORAR");
  });
});
