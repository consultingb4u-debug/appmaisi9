// Validação das abas de execução do CTRL-001 (pura; testada em tests/importacao/ctrl001.test.ts):
// Pré-Projeto | Complexidade, Pré-Projeto, Operacional, Teste Interno, Teste Cliente | UAT, Deployment e Status Report.
import { avaliarComplexidade } from "@/lib/domain/execucao";
import { parseDia } from "@/lib/domain/datas";
import { lerHoras } from "@/lib/domain/alocacao";
import {
  enumPorRotulo,
  NIVEL_IMPACTO,
  normalizarTexto,
  OBRIGATORIEDADE,
  RESULTADO_TESTE,
  STATUS_CHECKLIST,
  STATUS_EXECUTIVO,
  STATUS_OPERACIONAL,
  STATUS_PRE_PROJETO,
  TIPO_OPERACIONAL,
  VALIDACAO,
} from "@/lib/domain/rotulos";
import type { Primitivo } from "../planilha";
import type { EntidadeExecucao, LinhaLida001 } from "./ler";

type Msg = { nivel: "ALERTA" | "ERRO"; campo?: string; mensagem: string };
type Acao = "CRIAR" | "ATUALIZAR" | "IGNORAR";

export type ResolvidoComplexidade = {
  avaliador: string | null;
  data: string | null;
  horasEstimadas: number | null;
  notas: { criterio: string; nota: number | null; gatilhoCritico: boolean }[];
};
export type ResolvidoPreProjeto = { status: keyof typeof STATUS_PRE_PROJETO };
export type ResolvidoPreItem = {
  categoria: string;
  item: string;
  responsavel: string | null;
  informacaoContato: string | null;
  validacaoEsperada: string | null;
  status: keyof typeof STATUS_CHECKLIST;
  prazo: string | null;
  observacao: string | null;
};
export type ResolvidoOperacional = {
  codigo: string;
  tipo: keyof typeof TIPO_OPERACIONAL;
  descricao: string;
  origemCausa: string | null;
  impactoConsequencia: string | null;
  responsavelId: string | null;
  responsavelTexto: string | null;
  dataAbertura: string | null;
  prazo: string | null;
  status: keyof typeof STATUS_OPERACIONAL;
  impactoEscopo: keyof typeof NIVEL_IMPACTO;
  impactoPrazo: keyof typeof NIVEL_IMPACTO;
  impactoHoras: keyof typeof NIVEL_IMPACTO;
  acaoResposta: string | null;
  decisaoAprovador: string | null;
  evidencia: string | null;
};
export type ExecucaoPlanilha = {
  data: string | null;
  resultado: keyof typeof RESULTADO_TESTE;
  validacao: keyof typeof VALIDACAO;
  evidencia: string | null;
  observacao: string | null;
  defeito: string | null;
};
export type ResolvidoCaso = {
  tipo: "INTERNO" | "UAT";
  codigo: string;
  backlogCodigo: string | null;
  moduloProcesso: string | null;
  cenario: string;
  preCondicao: string | null;
  passos: string | null;
  resultadoEsperado: string | null;
  responsavelId: string | null;
  responsavelTexto: string | null;
  /** Resultado registrado na planilha (null = só planejado). Vira um ciclo de execução. */
  execucao: ExecucaoPlanilha | null;
};
export type ResolvidoDeployItem = {
  categoria: string;
  item: string;
  obrigatorio: keyof typeof OBRIGATORIEDADE;
  status: keyof typeof STATUS_CHECKLIST;
  responsavelId: string | null;
  responsavelTexto: string | null;
  evidencia: string | null;
  riscoObservacao: string | null;
  aprovacao: keyof typeof VALIDACAO;
};
export type ResolvidoStatusReport = {
  dataReferencia: string | null;
  statusExecutivo: keyof typeof STATUS_EXECUTIVO;
  faseAtual: string | null;
  resumo: string | null;
  entregasConcluidas: string | null;
  proximasEntregas: string | null;
  pontosAtencao: string | null;
  decisoesNecessarias: string | null;
};

export type ResolvidoExecucao = ResolvidoComplexidade | ResolvidoPreProjeto | ResolvidoPreItem | ResolvidoOperacional | ResolvidoCaso | ResolvidoDeployItem | ResolvidoStatusReport;

/** Estado atual no banco, já no formato dos "Resolvido" (comparação por JSON = reimportação idempotente). */
export type ContextoExecucao = {
  criterios: string[]; // nomes dos critérios ativos
  complexidade: string | null; // JSON de ResolvidoComplexidade
  preProjetoStatus: string | null;
  preItens: Map<string, string>; // item → JSON
  operacional: Map<string, string>; // código → JSON
  casos: Map<string, { json: string; ultima: { resultado: string; validacao: string } | null }>; // "INTERNO|TI-001"
  deployItens: Map<string, string>; // item → JSON (deployment mais recente)
  statusReports: Set<string>; // resumos já existentes
};

export const ENTIDADES_EXECUCAO: EntidadeExecucao[] = ["Complexidade", "PreProjeto", "PreProjetoItem", "Operacional", "TesteInterno", "Uat", "DeploymentItem", "StatusReport"];

const txt = (v: Primitivo | undefined): string | null => (v === null || v === undefined || String(v).trim() === "" ? null : String(v).trim());
/** Textos-modelo do CTRL-001 ("[Resumo executivo: …]") contam como vazios. */
const conteudo = (v: Primitivo | undefined) => {
  const t = txt(v);
  return t && !/^\[[\s\S]*\]$/.test(t) ? t : null;
};
const data = (v: Primitivo | undefined, msgs: Msg[], campo: string) => {
  const t = txt(v);
  if (!t) return null;
  const d = parseDia(t);
  if (!d) msgs.push({ nivel: "ALERTA", campo, mensagem: `Data "${t}" inválida — ignorada.` });
  return d ? t : null;
};

const ALIAS_CHECKLIST: Record<string, keyof typeof STATUS_CHECKLIST> = { planejado: "PENDENTE", "nao iniciado": "PENDENTE", ok: "CONCLUIDO", feito: "CONCLUIDO", "nao se aplica": "NA", "n/a": "NA", na: "NA" };
const ALIAS_RESULTADO: Record<string, keyof typeof RESULTADO_TESTE> = { ok: "APROVADO", passou: "APROVADO", falhou: "REPROVADO", erro: "REPROVADO", "nao se aplica": "NA", "n/a": "NA" };
const ALIAS_VALIDACAO: Record<string, keyof typeof VALIDACAO> = { aceito: "APROVADO", ok: "APROVADO", validado: "APROVADO", "nao se aplica": "NA" };
const ALIAS_OPERACIONAL: Record<string, keyof typeof STATUS_OPERACIONAL> = { concluido: "FECHADO", resolvido: "FECHADO", encerrado: "FECHADO", pendente: "ABERTO", "em analise": "EM_ANDAMENTO" };

function mapear<T extends string>(mapa: Record<T, string>, alias: Record<string, T>, v: Primitivo | undefined, padrao: T, msgs: Msg[], campo: string): T {
  const t = txt(v);
  if (!t) return padrao;
  const r = enumPorRotulo(mapa, t) ?? alias[normalizarTexto(t)];
  if (!r) msgs.push({ nivel: "ALERTA", campo, mensagem: `"${t}" desconhecido — usado ${mapa[padrao]}.` });
  return r ?? padrao;
}

function nivelImpacto(v: Primitivo | undefined, msgs: Msg[], campo: string): keyof typeof NIVEL_IMPACTO {
  const t = txt(v);
  if (t && normalizarTexto(t) === "sim") {
    msgs.push({ nivel: "ALERTA", campo, mensagem: '"Sim" sem grau: registrado como Médio.' });
    return "MEDIO";
  }
  return mapear(NIVEL_IMPACTO, { nenhum: "NAO" }, v, "NAO", msgs, campo);
}

export type Recursos = { id: string; nome: string; apelidos: string[] }[];

/**
 * Resolve o responsável da planilha: aceita nome, apelido ou primeiro nome único; com vários nomes
 * ("Diego / Dornelles") o primeiro reconhecido vira o responsável e o texto completo é preservado.
 */
export function resolverResponsavel(recursos: Recursos, v: Primitivo | undefined, msgs: Msg[], campo: string): { id: string | null; texto: string | null } {
  const t = txt(v);
  if (!t) return { id: null, texto: null };
  const partes = t.split(/\s*(?:\/|,|;|\be\b|&)\s*/i).filter(Boolean);
  const achar = (p: string) => {
    const n = normalizarTexto(p);
    const exato = recursos.find((r) => normalizarTexto(r.nome) === n || r.apelidos.some((a) => normalizarTexto(a) === n));
    if (exato) return exato.id;
    const porPrimeiro = recursos.filter((r) => normalizarTexto(r.nome).split(" ")[0] === n);
    return porPrimeiro.length === 1 ? porPrimeiro[0].id : null;
  };
  const ids = partes.map(achar);
  const id = ids.find((x) => x) ?? null;
  if (!id) msgs.push({ nivel: "ALERTA", campo, mensagem: `"${t}" não é um recurso MAIS i9 cadastrado: gravado como texto.` });
  return { id, texto: !id || partes.length > 1 ? t : null };
}

/**
 * IDs de teste repetidos na planilha (ex.: Kover tem duas séries TI-001…) recebem um novo código,
 * de forma determinística: a 2ª ocorrência vira o próximo número livre da própria planilha.
 */
export function renomearDuplicados(linhas: LinhaLida001[]): Map<LinhaLida001, string> {
  const out = new Map<LinhaLida001, string>();
  for (const ent of ["TesteInterno", "Uat"] as const) {
    const doTipo = linhas.filter((l) => l.entidade === ent && txt(l.dados["ID"]));
    const prefixo = ent === "Uat" ? "UAT" : "TI";
    let max = doTipo.reduce((m, l) => Math.max(m, Number(/(\d+)\s*$/.exec(txt(l.dados["ID"])!)?.[1] ?? 0)), 0);
    const vistos = new Set<string>();
    for (const l of doTipo) {
      const id = txt(l.dados["ID"])!;
      if (vistos.has(id)) out.set(l, `${prefixo}-${String(++max).padStart(3, "0")}`);
      vistos.add(id);
    }
  }
  return out;
}

export function avaliarLinhaExecucao(
  l: LinhaLida001,
  ctx: ContextoExecucao,
  h: { recursos: Recursos; codigosBacklog: Set<string>; renomeados: Map<LinhaLida001, string> },
): { chave: string; acao: Acao; mensagens: Msg[]; resolvido: ResolvidoExecucao | null } {
  const d = l.dados;
  const msgs: Msg[] = [];
  const decidir = (chave: string, r: ResolvidoExecucao, atual: string | null | undefined) => {
    const acao: Acao = atual === undefined || atual === null ? "CRIAR" : atual === JSON.stringify(r) ? "IGNORAR" : "ATUALIZAR";
    if (acao === "ATUALIZAR") msgs.push({ nivel: "ALERTA", mensagem: "Já existe no sistema com valores diferentes: os da planilha vão substituir os atuais." });
    return { chave, acao, mensagens: msgs, resolvido: r };
  };
  const ignorar = (chave: string) => ({ chave, acao: "IGNORAR" as Acao, mensagens: msgs, resolvido: null });

  switch (l.entidade) {
    case "Complexidade": {
      const nomes = new Set(ctx.criterios.map(normalizarTexto));
      const notas: ResolvidoComplexidade["notas"] = [];
      for (const [k, v] of Object.entries(d)) {
        if (!k.startsWith("nota:")) continue;
        const criterio = k.slice(5);
        if (!nomes.has(normalizarTexto(criterio))) {
          msgs.push({ nivel: "ALERTA", campo: criterio, mensagem: `Critério "${criterio}" não cadastrado — ignorado.` });
          continue;
        }
        const nota = v === null ? null : Number(v);
        if (nota !== null && (!Number.isInteger(nota) || nota < 0 || nota > 3)) {
          msgs.push({ nivel: "ERRO", campo: criterio, mensagem: `Nota "${v}" fora de 0–3.` });
          continue;
        }
        notas.push({ criterio: ctx.criterios.find((c) => normalizarTexto(c) === normalizarTexto(criterio))!, nota, gatilhoCritico: normalizarTexto(txt(d[`gatilho:${criterio}`]) ?? "") === "sim" });
      }
      const avaliador = txt(d.avaliador);
      const r: ResolvidoComplexidade = {
        // "GP MAIS i9" é o texto-modelo da planilha, não um avaliador.
        avaliador: avaliador && normalizarTexto(avaliador) !== "gp mais i9" ? avaliador : null,
        data: data(d.data, msgs, "Data"),
        horasEstimadas: (() => {
          const x = lerHoras(d.horas);
          return x === null || Number.isNaN(x) ? null : x;
        })(),
        notas: notas.sort((a, b) => ctx.criterios.indexOf(a.criterio) - ctx.criterios.indexOf(b.criterio)),
      };
      const res = avaliarComplexidade(r.notas);
      if (!res.avaliado) {
        msgs.push({ nivel: "ALERTA", mensagem: "Nenhum critério respondido na planilha: complexidade não importada." });
        return ignorar("COMPLEXIDADE");
      }
      const nivelPlanilha = txt(d.nivelPlanilha);
      if (nivelPlanilha && nivelPlanilha !== res.final) msgs.push({ nivel: "ALERTA", mensagem: `A planilha mostra ${nivelPlanilha}; pela regra o nível é ${res.final} (score ${res.score}, ${res.gatilhos} gatilho(s)).` });
      return decidir("COMPLEXIDADE", r, ctx.complexidade);
    }

    case "PreProjeto": {
      const t = txt(d.status);
      const status = enumPorRotulo(STATUS_PRE_PROJETO, t);
      if (!status) {
        msgs.push({ nivel: "ALERTA", campo: "Status Pré-Projeto", mensagem: `"${t}" desconhecido — não importado.` });
        return ignorar("PRE|status");
      }
      return decidir("PRE|status", { status }, ctx.preProjetoStatus === null ? null : JSON.stringify({ status: ctx.preProjetoStatus }));
    }

    case "PreProjetoItem": {
      const item = txt(d["Item / Requisito"])!;
      const r: ResolvidoPreItem = {
        categoria: txt(d["Categoria"]) ?? "Geral",
        item,
        responsavel: txt(d["Responsável"]),
        informacaoContato: txt(d["Informação / Contato"]),
        validacaoEsperada: txt(d["Validação"]),
        status: mapear(STATUS_CHECKLIST, ALIAS_CHECKLIST, d["Status"], "PENDENTE", msgs, "Status"),
        prazo: data(d["Prazo"], msgs, "Prazo"),
        observacao: txt(d["Observação"]),
      };
      return decidir(`PRE|${item}`, r, ctx.preItens.get(item));
    }

    case "Operacional": {
      const codigo = txt(d["ID"]);
      const descricao = txt(d["Descrição"]);
      if (!codigo || !descricao) {
        msgs.push({ nivel: "ALERTA", mensagem: "Linha sem ID ou descrição: não importada (preencha na planilha)." });
        return ignorar(`OP|linha-${l.linhaOrigem}`);
      }
      const resp = resolverResponsavel(h.recursos, d["Responsável"], msgs, "Responsável");
      const tipoTxt = txt(d["Tipo"]);
      const tipo = enumPorRotulo(TIPO_OPERACIONAL, tipoTxt) ?? (tipoTxt && /^cr$/i.test(tipoTxt) ? "CHANGE_REQUEST" : null);
      if (!tipo) msgs.push({ nivel: "ERRO", campo: "Tipo", mensagem: `Tipo "${tipoTxt ?? ""}" desconhecido (use ${Object.values(TIPO_OPERACIONAL).join(", ")}).` });
      const r: ResolvidoOperacional = {
        codigo,
        tipo: tipo ?? "PENDENCIA",
        descricao,
        origemCausa: txt(d["Origem / Causa"]),
        impactoConsequencia: txt(d["Impacto / Consequência"]),
        responsavelId: resp.id,
        responsavelTexto: resp.texto,
        dataAbertura: data(d["Abertura"], msgs, "Abertura"),
        prazo: data(d["Prazo"], msgs, "Prazo"),
        status: mapear(STATUS_OPERACIONAL, ALIAS_OPERACIONAL, d["Status"], "ABERTO", msgs, "Status"),
        impactoEscopo: nivelImpacto(d["Impacto Escopo"], msgs, "Impacto Escopo"),
        impactoPrazo: nivelImpacto(d["Impacto Prazo"], msgs, "Impacto Prazo"),
        impactoHoras: nivelImpacto(d["Impacto Horas"], msgs, "Impacto Horas"),
        acaoResposta: txt(d["Ação / Resposta"]),
        decisaoAprovador: txt(d["Decisão / Aprovador"]),
        evidencia: txt(d["Evidência / Observação"]),
      };
      if (r.tipo === "RISCO") msgs.push({ nivel: "ALERTA", mensagem: "Risco sem probabilidade × impacto na planilha: complete na aba Riscos." });
      return decidir(`OP|${codigo}`, r, ctx.operacional.get(codigo));
    }

    case "TesteInterno":
    case "Uat": {
      const tipo = l.entidade === "Uat" ? "UAT" : "INTERNO";
      const original = txt(d["ID"]);
      if (!original) {
        msgs.push({ nivel: "ALERTA", mensagem: "Caso sem ID: não importado." });
        return ignorar(`${tipo}|linha-${l.linhaOrigem}`);
      }
      const codigo = h.renomeados.get(l) ?? original;
      if (codigo !== original) msgs.push({ nivel: "ALERTA", campo: "ID", mensagem: `ID ${original} repetido na planilha: gravado como ${codigo}.` });
      // A coluna "Requisito" traz um código do backlog (REQ-001) ou, em planilhas antigas, o título do cenário.
      const req = txt(d["Requisito"]);
      const ehCodigo = !!req && /^[A-Z]+-\d+/.test(req);
      if (ehCodigo && !h.codigosBacklog.has(req!)) msgs.push({ nivel: "ALERTA", campo: "Requisito", mensagem: `Requisito ${req} não existe no backlog.` });
      const cenarioPassos = txt(d["Cenário | Passos"]);
      const cenario = (ehCodigo || !req ? cenarioPassos : req) ?? "";
      if (!cenario) {
        msgs.push({ nivel: "ERRO", campo: "Cenário | Passos", mensagem: "Cenário vazio." });
        return ignorar(`${tipo}|${codigo}`);
      }
      const resp = tipo === "UAT" ? { id: null, texto: txt(d["Key User | Cliente"]) } : resolverResponsavel(h.recursos, d["Responsável MAIS i9"], msgs, "Responsável MAIS i9");
      const resultadoTxt = txt(d["Resultado"]);
      const resultado = mapear(RESULTADO_TESTE, ALIAS_RESULTADO, d["Resultado"], "PLANEJADO", msgs, "Resultado");
      const dataExec = data(d["Data"], msgs, "Data");
      const defeito = txt(d["Defeito | Pendência"]);
      const execucao: ExecucaoPlanilha | null =
        resultadoTxt && resultado !== "PLANEJADO"
          ? {
              data: dataExec,
              resultado,
              validacao: mapear(VALIDACAO, ALIAS_VALIDACAO, d[tipo === "UAT" ? "Aceite Cliente" : "Validação MAIS i9"], "PENDENTE", msgs, tipo === "UAT" ? "Aceite Cliente" : "Validação MAIS i9"),
              evidencia: txt(d["Evidência"]),
              observacao: txt(d["Observação"]),
              defeito,
            }
          : null;
      if (defeito && execucao && (resultado === "REPROVADO" || resultado === "BLOQUEADO")) msgs.push({ nivel: "ALERTA", campo: "Defeito | Pendência", mensagem: "Vai abrir um defeito no Operacional, ligado a esta execução." });
      const r: ResolvidoCaso = {
        tipo,
        codigo,
        backlogCodigo: ehCodigo && h.codigosBacklog.has(req!) ? req : null,
        moduloProcesso: txt(d["Módulo | Processo"]),
        cenario,
        preCondicao: txt(d["Pré-condição"]),
        passos: ehCodigo || !req ? null : cenarioPassos,
        resultadoEsperado: txt(d["Resultado Esperado"]),
        responsavelId: resp.id,
        responsavelTexto: resp.texto,
        execucao,
      };
      const chave = `${tipo}|${codigo}`;
      const atual = ctx.casos.get(chave);
      if (!atual) return { chave, acao: "CRIAR", mensagens: msgs, resolvido: r };
      const { execucao: ex, ...semExec } = r;
      const casoMudou = atual.json !== JSON.stringify(semExec);
      const execMudou = !!ex && (!atual.ultima || atual.ultima.resultado !== ex.resultado || atual.ultima.validacao !== ex.validacao);
      if (execMudou) msgs.push({ nivel: "ALERTA", campo: "Resultado", mensagem: `Resultado diferente do último ciclo no sistema: será registrado um novo ciclo (${RESULTADO_TESTE[ex!.resultado]}); o histórico é mantido.` });
      return { chave, acao: casoMudou || execMudou ? "ATUALIZAR" : "IGNORAR", mensagens: msgs, resolvido: r };
    }

    case "DeploymentItem": {
      const item = txt(d["Item"])!;
      const resp = resolverResponsavel(h.recursos, d["Responsável"], msgs, "Responsável");
      const r: ResolvidoDeployItem = {
        categoria: txt(d["Categoria"]) ?? "Geral",
        item,
        obrigatorio: mapear(OBRIGATORIEDADE, {}, d["Obrigatório?"], "SIM", msgs, "Obrigatório?"),
        status: mapear(STATUS_CHECKLIST, ALIAS_CHECKLIST, d["Status"], "PENDENTE", msgs, "Status"),
        responsavelId: resp.id,
        responsavelTexto: resp.texto,
        evidencia: txt(d["Evidência"]),
        riscoObservacao: txt(d["Risco | Observação"]),
        aprovacao: mapear(VALIDACAO, ALIAS_VALIDACAO, d["Aprovação"], "PENDENTE", msgs, "Aprovação"),
      };
      return decidir(`DEP|${item}`, r, ctx.deployItens.get(item));
    }

    case "StatusReport": {
      const r: ResolvidoStatusReport = {
        dataReferencia: null,
        statusExecutivo: enumPorRotulo(STATUS_EXECUTIVO, txt(d["Status Executivo"])) ?? "AMARELO",
        faseAtual: conteudo(d["Fase Atual"]),
        resumo: conteudo(d["Resumo Executivo"]),
        entregasConcluidas: conteudo(d["Principais Entregas Concluídas"]),
        proximasEntregas: conteudo(d["Próximas Entregas"]),
        pontosAtencao: conteudo(d["Pontos de Atenção"]) ?? conteudo(d["Riscos | Pontos de Atenção"]),
        decisoesNecessarias: conteudo(d["Decisões Necessárias"]),
      };
      if (!r.resumo && !r.entregasConcluidas && !r.proximasEntregas) {
        msgs.push({ nivel: "ALERTA", mensagem: "Status report da planilha só tem o texto-modelo: não importado." });
        return ignorar("STATUS");
      }
      const periodo = txt(d["Período"]);
      const p = periodo?.match(/\d{4}-\d{2}-\d{2}/g) ?? [];
      r.dataReferencia = p.at(-1) ?? null;
      msgs.push({ nivel: "ALERTA", mensagem: "Entra como rascunho de status report; os indicadores são calculados pelo sistema na importação." });
      return { chave: "STATUS", acao: r.resumo && ctx.statusReports.has(r.resumo) ? "IGNORAR" : "CRIAR", mensagens: msgs, resolvido: r };
    }
  }
  return ignorar(`${l.aba}#${l.linhaOrigem}`);
}
