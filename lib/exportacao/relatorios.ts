// Montagem das planilhas exportadas (uma função por tela). O formato segue as colunas da própria tela.
import { db } from "@/lib/db";
import { parseDia } from "@/lib/domain/datas";
import { janelaDeSemanas, rotuloSemana } from "@/lib/domain/semanas";
import { severidadeItem } from "@/lib/domain/execucao";
import {
  ADERENCIA,
  FASE,
  NIVEL_IMPACTO,
  PRIORIDADE,
  RESULTADO_TESTE,
  SEVERIDADE,
  SIM_NAO,
  SITUACAO_PRAZO,
  STATUS_EXECUTIVO,
  STATUS_ITEM,
  STATUS_OPERACIONAL,
  STATUS_PROJETO,
  TIPO_BACKLOG,
  TIPO_OPERACIONAL,
  TIPO_PROJETO,
  VALIDACAO,
} from "@/lib/domain/rotulos";
import { listarPortfolio } from "@/lib/services/portfolio";
import { carregarCronograma } from "@/lib/services/cronograma";
import { casosComUltima } from "@/lib/services/execucao";
import { cargaPorSemana, ROTULO_FAIXA } from "@/lib/services/capacidade";
import type { Aba } from "./xlsx";

type Params = Record<string, string | undefined>;

export async function exportarPortfolio(p: Params): Promise<Aba[]> {
  const projetos = await listarPortfolio({ ...p, de: parseDia(p.de), ate: parseDia(p.ate) });
  return [
    {
      nome: "Portfólio",
      colunas: [
        { titulo: "Código", largura: 11 },
        { titulo: "Cliente", largura: 18 },
        { titulo: "Projeto", largura: 36 },
        { titulo: "Tipo", largura: 12 },
        { titulo: "Status", largura: 16 },
        { titulo: "Prioridade", largura: 11 },
        { titulo: "Complexidade", largura: 12 },
        { titulo: "Status executivo", largura: 12 },
        { titulo: "GP", largura: 20 },
        { titulo: "Equipe", tipo: "numero", largura: 8 },
        { titulo: "Kick-off", tipo: "data" },
        { titulo: "Go Live", tipo: "data" },
        { titulo: "Encerramento", tipo: "data" },
        { titulo: "Horas vendidas", tipo: "horas" },
        { titulo: "Planejado", tipo: "horas" },
        { titulo: "Realizado", tipo: "horas" },
        { titulo: "Próx. 4 semanas", tipo: "horas" },
        { titulo: "Notas", largura: 40 },
      ],
      linhas: projetos.map((x) => [
        x.codigo,
        x.cliente.nome,
        x.nome,
        TIPO_PROJETO[x.tipo],
        STATUS_PROJETO[x.status],
        PRIORIDADE[x.prioridade],
        x.complexidade,
        x.statusExecutivo ? STATUS_EXECUTIVO[x.statusExecutivo] : null,
        x.gp?.nome,
        x.equipe,
        x.dataKickoff,
        x.dataGoLive,
        x.dataEncerramento,
        x.horasVendidas,
        x.horasPlanejadas,
        x.horasRealizadas,
        x.horasProximas4,
        x.notas,
      ]),
    },
  ];
}

async function nomeProjeto(projetoId: string) {
  const p = await db.projeto.findUniqueOrThrow({ where: { id: projetoId }, select: { codigo: true, nome: true, cliente: { select: { nome: true } } } });
  return `${p.cliente.nome} · ${p.nome} (${p.codigo})`;
}

export async function exportarCronograma(projetoId: string): Promise<Aba[]> {
  const [crono, titulo] = await Promise.all([carregarCronograma(projetoId), nomeProjeto(projetoId)]);
  // Uma linha por recurso (alocação individual), como na tela; atividade sem recurso aparece uma vez.
  const linhas = crono.atividades.flatMap((a) => {
    const base = (recurso: string | null, prev: number, real: number, falta: number | null) => [
      a.codigo,
      FASE[a.fase as keyof typeof FASE],
      a.backlogItem?.codigo,
      a.tarefa,
      recurso,
      a.responsavel?.nome,
      a.inicioPrevisto,
      a.fimPrevisto,
      a.duracao,
      prev,
      real,
      falta,
      a.percentualConclusao / 100,
      STATUS_ITEM[a.status as keyof typeof STATUS_ITEM],
      a.situacao ? SITUACAO_PRAZO[a.situacao][0] : null,
      a.predecessoras.map((p) => p.predecessora.codigo).join(", "),
      a.marco ? "Sim" : "Não",
      a.dataRealConclusao,
      a.observacao,
    ];
    if (a.atrib.length === 0) return [base(a.clienteParticipa ? "(cliente)" : null, 0, 0, null)];
    return a.atrib.map((x) => base(x.recurso, x.previsto, x.realizado, a.status === "CONCLUIDO" ? 0 : (x.paraConcluir ?? Math.max(0, x.previsto - x.realizado))));
  });
  return [
    {
      nome: "Cronograma",
      titulo: `Cronograma · ${titulo} · conclusão ${crono.progresso}%`,
      colunas: [
        { titulo: "ID", largura: 10 },
        { titulo: "Fase", largura: 13 },
        { titulo: "Requisito", largura: 10 },
        { titulo: "Tarefa", largura: 44 },
        { titulo: "Recurso MAIS i9", largura: 20 },
        { titulo: "Responsável", largura: 20 },
        { titulo: "Início previsto", tipo: "data" },
        { titulo: "Fim previsto", tipo: "data" },
        { titulo: "Dias úteis", tipo: "numero", largura: 9 },
        { titulo: "Esforço previsto", tipo: "horas" },
        { titulo: "Realizado", tipo: "horas" },
        { titulo: "Para concluir", tipo: "horas" },
        { titulo: "% conclusão", tipo: "percentual", largura: 10 },
        { titulo: "Status", largura: 14 },
        { titulo: "Prazo", largura: 11 },
        { titulo: "Predecessoras", largura: 14 },
        { titulo: "Marco", largura: 7 },
        { titulo: "Conclusão real", tipo: "data" },
        { titulo: "Observação", largura: 36 },
      ],
      linhas,
    },
    {
      nome: "Qualidade",
      colunas: [{ titulo: "Atividade", largura: 12 }, { titulo: "Alerta", largura: 70 }],
      linhas: crono.alertas.map((x) => [x.codigo, x.mensagem]),
    },
  ];
}

export async function exportarBacklog(projetoId: string): Promise<Aba[]> {
  const [itens, titulo] = await Promise.all([
    db.backlogItem.findMany({ where: { projetoId }, orderBy: [{ ordem: "asc" }, { codigo: "asc" }], include: { responsavel: { select: { nome: true } } } }),
    nomeProjeto(projetoId),
  ]);
  return [
    {
      nome: "Backlog",
      titulo: `Backlog · ${titulo}`,
      colunas: [
        { titulo: "ID", largura: 10 },
        { titulo: "Módulo | Processo", largura: 18 },
        { titulo: "Requisito", largura: 44 },
        { titulo: "Tipo", largura: 13 },
        { titulo: "Prioridade", largura: 11 },
        { titulo: "Aderência", largura: 11 },
        { titulo: "Solução proposta", largura: 36 },
        { titulo: "Customização", largura: 12 },
        { titulo: "Critério de aceite", largura: 36 },
        { titulo: "Estimativa", tipo: "horas" },
        { titulo: "Responsável", largura: 20 },
        { titulo: "Status", largura: 14 },
        { titulo: "Validação cliente", largura: 13 },
        { titulo: "Observação", largura: 36 },
      ],
      linhas: itens.map((i) => [
        i.codigo,
        i.moduloProcesso,
        i.requisito,
        TIPO_BACKLOG[i.tipo],
        PRIORIDADE[i.prioridade],
        ADERENCIA[i.aderenciaPadrao],
        i.solucaoProposta,
        SIM_NAO[i.customizacao],
        i.criterioAceite,
        i.estimativaHoras?.toNumber(),
        i.responsavel?.nome,
        STATUS_ITEM[i.status],
        VALIDACAO[i.validacaoCliente],
        i.observacao,
      ]),
    },
  ];
}

export async function exportarOperacional(projetoId: string): Promise<Aba[]> {
  const [itens, titulo] = await Promise.all([
    db.itemOperacional.findMany({ where: { projetoId }, orderBy: [{ tipo: "asc" }, { codigo: "asc" }], include: { responsavel: { select: { nome: true } } } }),
    nomeProjeto(projetoId),
  ]);
  return [
    {
      nome: "Operacional",
      titulo: `Registro operacional · ${titulo}`,
      colunas: [
        { titulo: "ID", largura: 10 },
        { titulo: "Tipo", largura: 14 },
        { titulo: "Descrição", largura: 44 },
        { titulo: "Origem / causa", largura: 28 },
        { titulo: "Impacto / consequência", largura: 28 },
        { titulo: "Responsável", largura: 20 },
        { titulo: "Abertura", tipo: "data" },
        { titulo: "Prazo", tipo: "data" },
        { titulo: "Status", largura: 13 },
        { titulo: "Impacto escopo", largura: 10 },
        { titulo: "Impacto prazo", largura: 10 },
        { titulo: "Impacto horas", largura: 10 },
        { titulo: "Probabilidade", tipo: "numero", largura: 11 },
        { titulo: "Impacto (1–5)", tipo: "numero", largura: 11 },
        { titulo: "Severidade", largura: 10 },
        { titulo: "CR horas", tipo: "horas" },
        { titulo: "CR dias", tipo: "numero", largura: 8 },
        { titulo: "Ação / resposta", largura: 36 },
        { titulo: "Decisão / aprovador", largura: 24 },
        { titulo: "Evidência", largura: 28 },
        { titulo: "Fechamento", tipo: "data" },
      ],
      linhas: itens.map((i) => {
        const sev = severidadeItem({ probabilidade: i.probabilidade, impacto: i.impacto, impactos: [i.impactoEscopo, i.impactoPrazo, i.impactoHoras] });
        return [
          i.codigo,
          TIPO_OPERACIONAL[i.tipo],
          i.descricao,
          i.origemCausa,
          i.impactoConsequencia,
          i.responsavel?.nome ?? i.responsavelTexto,
          i.dataAbertura,
          i.prazo,
          STATUS_OPERACIONAL[i.status],
          NIVEL_IMPACTO[i.impactoEscopo],
          NIVEL_IMPACTO[i.impactoPrazo],
          NIVEL_IMPACTO[i.impactoHoras],
          i.probabilidade,
          i.impacto,
          sev ? SEVERIDADE[sev] : null,
          i.horasCr?.toNumber(),
          i.diasCr,
          i.acaoResposta,
          i.decisaoAprovador,
          i.evidencia,
          i.dataFechamento,
        ];
      }),
    },
  ];
}

export async function exportarTestes(projetoId: string, tipo: "INTERNO" | "UAT"): Promise<Aba[]> {
  const [casos, titulo] = await Promise.all([casosComUltima(projetoId, tipo), nomeProjeto(projetoId)]);
  const nome = tipo === "UAT" ? "UAT" : "Testes internos";
  return [
    {
      nome,
      titulo: `${nome} · ${titulo}`,
      colunas: [
        { titulo: "ID", largura: 10 },
        { titulo: "Requisito", largura: 10 },
        { titulo: "Módulo | Processo", largura: 18 },
        { titulo: "Cenário", largura: 40 },
        { titulo: "Pré-condição", largura: 28 },
        { titulo: "Passos", largura: 40 },
        { titulo: "Resultado esperado", largura: 30 },
        { titulo: tipo === "UAT" ? "Key user" : "Responsável", largura: 20 },
        { titulo: "Ciclos", tipo: "numero", largura: 7 },
        { titulo: "Última execução", tipo: "data" },
        { titulo: "Resultado", largura: 13 },
        { titulo: tipo === "UAT" ? "Aceite" : "Validação", largura: 11 },
        { titulo: "Defeitos", largura: 14 },
      ],
      linhas: casos.map((c) => [
        c.codigo,
        c.backlogItem?.codigo,
        c.moduloProcesso,
        c.cenario,
        c.preCondicao,
        c.passos,
        c.resultadoEsperado,
        c.responsavel?.nome ?? c.responsavelTexto,
        c.execucoes.length,
        c.ultima?.data,
        RESULTADO_TESTE[c.ultima?.resultado ?? "PLANEJADO"],
        c.ultima ? VALIDACAO[c.ultima.validacao] : null,
        c.execucoes
          .map((e) => e.defeito?.codigo)
          .filter(Boolean)
          .join(", "),
      ]),
    },
    {
      nome: "Execuções",
      colunas: [
        { titulo: "Caso", largura: 10 },
        { titulo: "Ciclo", tipo: "numero", largura: 7 },
        { titulo: "Data", tipo: "data" },
        { titulo: "Executor", largura: 20 },
        { titulo: "Resultado", largura: 13 },
        { titulo: "Validação", largura: 11 },
        { titulo: "Resultado obtido", largura: 40 },
        { titulo: "Evidência", largura: 28 },
        { titulo: "Observação", largura: 28 },
        { titulo: "Defeito", largura: 10 },
      ],
      linhas: casos.flatMap((c) =>
        [...c.execucoes].reverse().map((e) => [c.codigo, e.ciclo, e.data, e.executor, RESULTADO_TESTE[e.resultado], VALIDACAO[e.validacao], e.resultadoObtido, e.evidencia, e.observacao, e.defeito?.codigo]),
      ),
    },
  ];
}

export async function exportarCapacidade(p: Params): Promise<Aba[]> {
  const semanas = janelaDeSemanas(p.de, p.n);
  const recursos = await db.recurso.findMany({ where: { ativo: true, ...(p.area && { area: p.area }) }, orderBy: { nome: "asc" }, select: { id: true, nome: true } });
  const carga = await cargaPorSemana(
    recursos.map((r) => r.id),
    semanas,
  );
  const rot = semanas.map((s) => rotuloSemana(s));
  return [
    {
      nome: "Utilização",
      titulo: `Mapa de carga · ${rot[0]} a ${rot.at(-1)}`,
      colunas: [{ titulo: "Recurso", largura: 22 }, ...rot.map((r) => ({ titulo: r, tipo: "percentual" as const, largura: 9 }))],
      linhas: recursos.map((r) => [r.nome, ...semanas.map((s) => {
        const u = carga.get(r.id)!.get(s.id)!.utilizacao;
        return u === null || !Number.isFinite(u) ? null : u;
      })]),
    },
    {
      nome: "Detalhe",
      colunas: [
        { titulo: "Recurso", largura: 22 },
        { titulo: "Semana", largura: 9 },
        { titulo: "Início", tipo: "data" },
        { titulo: "Capacidade líquida", tipo: "horas" },
        { titulo: "Planejado", tipo: "horas" },
        { titulo: "Utilização", tipo: "percentual", largura: 10 },
        { titulo: "Faixa", largura: 14 },
        { titulo: "Cliente", largura: 18 },
        { titulo: "Projeto", largura: 32 },
        { titulo: "Horas no projeto", tipo: "horas" },
      ],
      linhas: recursos.flatMap((r) =>
        semanas.flatMap((s, i) => {
          const c = carga.get(r.id)!.get(s.id)!;
          const u = c.utilizacao === null || !Number.isFinite(c.utilizacao) ? null : c.utilizacao;
          const cab = [r.nome, rot[i], s.inicio, c.capacidade.liquida, c.planejado, u, c.faixa ? ROTULO_FAIXA[c.faixa] : null];
          return c.projetos.length ? c.projetos.map((pr) => [...cab, pr.cliente, pr.projeto, pr.horas]) : [[...cab, null, null, null]];
        }),
      ),
    },
  ];
}
