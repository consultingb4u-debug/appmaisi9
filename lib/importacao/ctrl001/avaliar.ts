// Validação e conciliação do CTRL-001 (pura, testada em tests/importacao/ctrl001.test.ts).
import { lerHoras } from "@/lib/domain/alocacao";
import { coerenciaStatus, type StatusItem } from "@/lib/domain/cronograma";
import { ehFimDeSemana, parseDia } from "@/lib/domain/datas";
import { ADERENCIA, enumPorRotulo, FASE, normalizarTexto, PRIORIDADE, SIM_NAO, STATUS_ITEM, TIPO_BACKLOG, VALIDACAO } from "@/lib/domain/rotulos";
import type { Primitivo } from "../planilha";
import type { LinhaLida001 } from "./ler";

export type Nivel = "OK" | "ALERTA" | "ERRO";
export type Mensagem = { nivel: Exclude<Nivel, "OK">; campo?: string; mensagem: string };
export type Acao = "CRIAR" | "ATUALIZAR" | "IGNORAR";
export type Pendencia = { tipo: "RECURSO"; texto: string; ocorrencias: number };

export type ResolvidoCabecalho = { dataKickoff: string | null; dataGoLiveAlvo: string | null };

export type ResolvidoBacklog = {
  codigo: string;
  requisito: string;
  moduloProcesso: string | null;
  tipo: keyof typeof TIPO_BACKLOG;
  prioridade: keyof typeof PRIORIDADE;
  aderenciaPadrao: keyof typeof ADERENCIA;
  solucaoProposta: string | null;
  customizacao: keyof typeof SIM_NAO;
  criterioAceite: string | null;
  estimativaHoras: number | null;
  responsavelId: string | null;
  status: StatusItem;
  validacaoCliente: keyof typeof VALIDACAO;
  observacao: string | null;
};

export type ResolvidoAtividade = {
  codigo: string;
  fase: keyof typeof FASE;
  tarefa: string;
  backlogCodigo: string | null;
  moduloProcesso: string | null;
  responsavelId: string | null;
  clienteParticipa: boolean;
  contatoNome: string | null; // pessoa do cliente (criada como contato se não existir)
  inicioPrevisto: string | null;
  fimPrevisto: string | null;
  percentualConclusao: number;
  status: StatusItem;
  marco: boolean;
  dataRealConclusao: string | null;
  observacao: string | null;
  predecessoras: string[]; // códigos
  atribuicoes: { recursoId: string; esforcoPrevisto: number; horasParaConcluir: number | null; realizado: number }[];
};

export type Avaliacao001 = {
  chave: string;
  acao: Acao;
  status: Nivel;
  mensagens: Mensagem[];
  resolvido: ResolvidoCabecalho | ResolvidoBacklog | ResolvidoAtividade | null;
};

type AtividadeExistente = {
  codigo: string;
  fase: string;
  tarefa: string;
  backlogCodigo: string | null;
  inicioPrevisto: Date | null;
  fimPrevisto: Date | null;
  percentualConclusao: number;
  status: string;
  marco: boolean;
  responsavelId: string | null;
  atribuicoes: { recursoId: string; esforcoPrevisto: number; horasParaConcluir: number | null }[];
  predecessoras: string[];
};

export type ContextoCtrl001 = {
  projeto: { nome: string; cliente: string; dataKickoff: Date | null; dataGoLiveAlvo: Date | null };
  recursos: { id: string; nome: string; apelidos: string[] }[];
  backlog: Map<string, ResolvidoBacklog>; // por código
  atividades: Map<string, AtividadeExistente>; // por código
};

const txt = (v: Primitivo | undefined): string | null => (v === null || v === undefined || String(v).trim() === "" ? null : String(v).trim());
const dataTxt = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

/** "CRON-006.2" → "CRON-006". */
export const codigoBase = (c: string) => c.trim().split(".")[0];

export function avaliarCtrl001(linhas: LinhaLida001[], ctx: ContextoCtrl001): { avaliacoes: Avaliacao001[]; pendencias: Pendencia[] } {
  const indiceRecursos = new Map<string, string>();
  for (const r of ctx.recursos) {
    indiceRecursos.set(normalizarTexto(r.nome), r.id);
    for (const a of r.apelidos) indiceRecursos.set(normalizarTexto(a), r.id);
  }
  const pend = new Map<string, Pendencia>();
  const recurso = (v: Primitivo | undefined, msgs: Mensagem[], campo: string, nivel: "ERRO" | "ALERTA") => {
    const t = txt(v);
    if (!t) return null;
    const id = indiceRecursos.get(normalizarTexto(t));
    if (!id) {
      msgs.push({ nivel, campo, mensagem: `Recurso "${t}" não reconhecido — mapeie no De-Para.` });
      const k = normalizarTexto(t);
      pend.set(k, { tipo: "RECURSO", texto: t, ocorrencias: (pend.get(k)?.ocorrencias ?? 0) + 1 });
    }
    return id ?? null;
  };
  const codigosBacklog = new Set([...ctx.backlog.keys(), ...linhas.filter((l) => l.entidade === "Backlog").map((l) => txt(l.dados["ID"]) ?? "")]);
  const codigosAtividade = new Set([...ctx.atividades.keys(), ...linhas.filter((l) => l.entidade === "Atividade").map((l) => codigoBase(txt(l.dados["ID"]) ?? ""))]);
  const clienteNorm = normalizarTexto(ctx.projeto.cliente);

  // Agrupa as linhas do cronograma pelo código base (CRON-006, CRON-006.2, CRON-006.3 → CRON-006).
  const grupos = new Map<string, LinhaLida001[]>();
  for (const l of linhas.filter((x) => x.entidade === "Atividade")) {
    const base = codigoBase(txt(l.dados["ID"]) ?? `linha-${l.linhaOrigem}`);
    grupos.set(base, [...(grupos.get(base) ?? []), l]);
  }

  const avaliacoes = linhas.map((l): Avaliacao001 => {
    const d = l.dados;
    const msgs: Mensagem[] = [];
    let acao: Acao = "IGNORAR";
    let resolvido: Avaliacao001["resolvido"] = null;
    let chave = `${l.aba}#${l.linhaOrigem}`;

    if (l.entidade === "Cabecalho") {
      chave = "cabecalho";
      const projeto = txt(d.projeto);
      const cliente = txt(d.cliente);
      if ((projeto && normalizarTexto(projeto) !== normalizarTexto(ctx.projeto.nome)) || (cliente && normalizarTexto(cliente) !== clienteNorm))
        msgs.push({ nivel: "ALERTA", mensagem: `A planilha é de "${cliente} · ${projeto}", diferente do projeto escolhido (${ctx.projeto.cliente} · ${ctx.projeto.nome}). Confira antes de efetivar.` });
      const gp = txt(d.gp);
      if (gp && !indiceRecursos.has(normalizarTexto(gp))) msgs.push({ nivel: "ALERTA", campo: "GP", mensagem: `GP "${gp}" não reconhecido — o GP do projeto não é alterado pela importação.` });
      const inicio = parseDia(txt(d.inicio));
      const goLive = parseDia(txt(d.goLive));
      const r: ResolvidoCabecalho = { dataKickoff: dataTxt(inicio), dataGoLiveAlvo: dataTxt(goLive) };
      const muda = (novo: string | null, atual: Date | null) => novo !== null && novo !== dataTxt(atual);
      if (muda(r.dataKickoff, ctx.projeto.dataKickoff) || muda(r.dataGoLiveAlvo, ctx.projeto.dataGoLiveAlvo)) {
        acao = "ATUALIZAR";
        resolvido = r;
        if (r.dataGoLiveAlvo && ctx.projeto.dataGoLiveAlvo && muda(r.dataGoLiveAlvo, ctx.projeto.dataGoLiveAlvo)) msgs.push({ nivel: "ALERTA", campo: "Go Live", mensagem: `Go Live muda de ${dataTxt(ctx.projeto.dataGoLiveAlvo)} para ${r.dataGoLiveAlvo}.` });
      }
    }

    if (l.entidade === "Backlog") {
      const codigo = txt(d["ID"]);
      const requisito = txt(d["Requisito"]);
      if (!codigo || !requisito) msgs.push({ nivel: "ERRO", mensagem: "Requisito sem ID ou descrição." });
      const est = lerHoras(d["Estimativa h"]);
      if (Number.isNaN(est)) msgs.push({ nivel: "ERRO", campo: "Estimativa h", mensagem: `Estimativa "${d["Estimativa h"]}" inválida.` });
      const lista = <T extends string>(mapa: Record<T, string>, campo: string, padrao: T): T => {
        const t = txt(d[campo]);
        const v = enumPorRotulo(mapa, t);
        if (t && !v) msgs.push({ nivel: "ALERTA", campo, mensagem: `"${t}" desconhecido — usado ${mapa[padrao]}.` });
        return v ?? padrao;
      };
      const r: ResolvidoBacklog = {
        codigo: codigo ?? "",
        requisito: requisito ?? "",
        moduloProcesso: txt(d["Módulo | Processo"]),
        tipo: lista(TIPO_BACKLOG, "Tipo", "ENTREGA"),
        prioridade: lista(PRIORIDADE, "Prioridade", "MEDIA"),
        aderenciaPadrao: lista(ADERENCIA, "Aderência ao Padrão", "A_VALIDAR"),
        solucaoProposta: txt(d["Solução Proposta"]),
        customizacao: lista(SIM_NAO, "Customização?", "A_CONFIRMAR"),
        criterioAceite: txt(d["Critério de Aceite"]),
        estimativaHoras: Number.isNaN(est) ? null : est,
        responsavelId: recurso(d["Responsável"], msgs, "Responsável", "ALERTA"),
        status: lista(STATUS_ITEM, "Status", "NAO_INICIADO"),
        validacaoCliente: lista(VALIDACAO, "Validação Cliente", "PENDENTE"),
        observacao: txt(d["Observação"]),
      };
      if (codigo && requisito) {
        chave = `REQ|${codigo}`;
        resolvido = r;
        const e = ctx.backlog.get(codigo);
        acao = !e ? "CRIAR" : JSON.stringify(e) === JSON.stringify(r) ? "IGNORAR" : "ATUALIZAR";
      }
    }

    if (l.entidade === "Atividade") {
      const codigo = txt(d["ID"]) ?? "";
      const base = codigoBase(codigo);
      const grupo = grupos.get(base) ?? [l];
      const principal = grupo.find((x) => txt(x.dados["ID"]) === base) ?? grupo[0];
      chave = `CRON|${base}`;
      if (l !== principal) {
        msgs.push({ nivel: "ALERTA", mensagem: `Linha individualizada: agrupada em ${base} como mais um recurso da mesma atividade.` });
        const status: Nivel = "ALERTA";
        return { chave: `${chave}|${codigo}`, acao: "IGNORAR", status, mensagens: msgs, resolvido: null };
      }
      const p = principal.dados;
      const fase = enumPorRotulo(FASE, txt(p["Fase"]));
      if (!fase) msgs.push({ nivel: "ERRO", campo: "Fase", mensagem: `Fase "${txt(p["Fase"]) ?? ""}" fora das 4 oficiais.` });
      const tarefa = txt(p["Tarefa"]);
      if (!tarefa) msgs.push({ nivel: "ERRO", campo: "Tarefa", mensagem: "Tarefa vazia." });
      const inicio = parseDia(txt(p["Início Previsto"]));
      const fim = parseDia(txt(p["Fim Previsto"]));
      if (inicio && fim && fim < inicio) msgs.push({ nivel: "ERRO", campo: "Fim Previsto", mensagem: "Fim anterior ao início." });
      if ((inicio && ehFimDeSemana(inicio)) || (fim && ehFimDeSemana(fim))) msgs.push({ nivel: "ALERTA", mensagem: "Início ou fim cai em fim de semana — as horas vão para os dias úteis do período." });
      if (!inicio || !fim) msgs.push({ nivel: "ALERTA", mensagem: "Sem datas: a atividade não entra na capacidade." });

      const prev = lerHoras(p["Esforço Previsto (h)"]) ?? 0;
      const real = lerHoras(p["Esforço Realizado (h)"]) ?? 0;
      const falta = lerHoras(p["Horas para Concluir"]);
      for (const [n, v] of [["Esforço Previsto", prev], ["Esforço Realizado", real], ["Horas para Concluir", falta]] as const)
        if (Number.isNaN(v)) msgs.push({ nivel: "ERRO", campo: n, mensagem: "Horas inválidas." });

      // Recursos MAIS i9 do grupo: o esforço da linha principal é dividido entre eles (decisão: "mesmo esforço repetido").
      const recursosGrupo = [...new Set(grupo.map((x) => recurso(x.dados["Recurso MAIS i9"], msgs, "Recurso MAIS i9", "ERRO")).filter((x): x is string => !!x))];
      const n = recursosGrupo.length;
      if (grupo.length > 1 && n > 1) msgs.push({ nivel: "ALERTA", mensagem: `${prev}h divididas entre ${n} recursos (${Math.round((prev / n) * 10) / 10}h cada) — ajuste se o esforço for diferente.` });
      if (n === 0 && prev > 0) msgs.push({ nivel: "ALERTA", mensagem: "Esforço sem recurso MAIS i9: não entra na capacidade." });
      if (real > 0) msgs.push({ nivel: "ALERTA", mensagem: `${real}h realizadas importadas como apontamento único (sem detalhe por semana).` });

      const nomesCliente = [...new Set(grupo.map((x) => txt(x.dados["Recurso Cliente"])).filter((x): x is string => !!x))];
      const pessoa = nomesCliente.find((x) => normalizarTexto(x) !== clienteNorm) ?? null;

      const statusTxt = txt(p["Status"]);
      let status: StatusItem = enumPorRotulo(STATUS_ITEM, statusTxt) ?? "NAO_INICIADO";
      let pct = typeof p["% Conclusão"] === "number" ? (p["% Conclusão"] as number) : Number(p["% Conclusão"] ?? 0) || 0;
      if (pct <= 1) pct = pct * 100;
      if (statusTxt && normalizarTexto(statusTxt) === "atrasado") {
        status = pct > 0 ? "EM_ANDAMENTO" : "NAO_INICIADO";
        msgs.push({ nivel: "ALERTA", campo: "Status", mensagem: `"Atrasado" deixa de ser status: virou ${STATUS_ITEM[status]} (a situação do prazo é calculada).` });
      } else if (statusTxt && !enumPorRotulo(STATUS_ITEM, statusTxt)) msgs.push({ nivel: "ALERTA", campo: "Status", mensagem: `Status "${statusTxt}" desconhecido — usado Não iniciado.` });
      const coer = coerenciaStatus(status, pct);

      const backlogCodigo = txt(p["Atividade"]);
      if (backlogCodigo && !codigosBacklog.has(backlogCodigo)) msgs.push({ nivel: "ALERTA", campo: "Atividade", mensagem: `Requisito ${backlogCodigo} não existe no backlog.` });
      const predecessoras = (txt(p["Predecessora"]) ?? "")
        .split(/[;,\s]+/)
        .map((x) => codigoBase(x))
        .filter(Boolean);
      for (const pr of predecessoras) if (!codigosAtividade.has(pr)) msgs.push({ nivel: "ALERTA", campo: "Predecessora", mensagem: `Predecessora ${pr} não encontrada — ignorada.` });

      const div = (v: number | null) => (v === null || n === 0 ? v : Math.round((v / n) * 10) / 10);
      const r: ResolvidoAtividade = {
        codigo: base,
        fase: fase ?? "DEVELOPMENT",
        tarefa: tarefa ?? "",
        backlogCodigo: backlogCodigo && codigosBacklog.has(backlogCodigo) ? backlogCodigo : null,
        moduloProcesso: txt(p["Módulo | Processo"]),
        responsavelId: recurso(p["Responsável"], msgs, "Responsável", "ALERTA"),
        clienteParticipa: nomesCliente.length > 0,
        contatoNome: pessoa,
        inicioPrevisto: dataTxt(inicio),
        fimPrevisto: dataTxt(fim),
        percentualConclusao: coer.percentual,
        status: coer.status,
        marco: normalizarTexto(txt(p["Marco?"]) ?? "") === "sim",
        dataRealConclusao: dataTxt(parseDia(txt(p["Data Real Conclusão"]))),
        observacao: txt(p["Observação"]),
        predecessoras: predecessoras.filter((pr) => codigosAtividade.has(pr) && pr !== base),
        atribuicoes: recursosGrupo.map((recursoId) => ({
          recursoId,
          esforcoPrevisto: div(Number.isNaN(prev) ? 0 : prev) ?? 0,
          // "Horas para Concluir" igual a previsto − realizado fica automático (diminui conforme as horas são apontadas).
          horasParaConcluir: falta === null || Number.isNaN(falta) || falta === prev - real ? null : div(falta),
          realizado: div(Number.isNaN(real) ? 0 : real) ?? 0,
        })),
      };
      if (fase && tarefa) {
        resolvido = r;
        const e = ctx.atividades.get(base);
        if (!e) acao = "CRIAR";
        else {
          const atual = JSON.stringify({
            fase: e.fase, tarefa: e.tarefa, backlogCodigo: e.backlogCodigo, inicio: dataTxt(e.inicioPrevisto), fim: dataTxt(e.fimPrevisto), pct: e.percentualConclusao, status: e.status, marco: e.marco, resp: e.responsavelId,
            atrib: [...e.atribuicoes].sort((a, b) => a.recursoId.localeCompare(b.recursoId)).map((a) => [a.recursoId, a.esforcoPrevisto, a.horasParaConcluir]),
            pred: [...e.predecessoras].sort(),
          });
          const novo = JSON.stringify({
            fase: r.fase, tarefa: r.tarefa, backlogCodigo: r.backlogCodigo, inicio: r.inicioPrevisto, fim: r.fimPrevisto, pct: r.percentualConclusao, status: r.status, marco: r.marco, resp: r.responsavelId,
            atrib: [...r.atribuicoes].sort((a, b) => a.recursoId.localeCompare(b.recursoId)).map((a) => [a.recursoId, a.esforcoPrevisto, a.horasParaConcluir]),
            pred: [...r.predecessoras].sort(),
          });
          acao = atual === novo ? "IGNORAR" : "ATUALIZAR";
          if (acao === "ATUALIZAR") msgs.push({ nivel: "ALERTA", mensagem: "Já existe no sistema com valores diferentes: os da planilha vão substituir os atuais (datas, %, status, recursos)." });
        }
      }
    }

    const erro = msgs.some((m) => m.nivel === "ERRO");
    return { chave, acao: erro ? "IGNORAR" : acao, status: erro ? "ERRO" : msgs.length ? "ALERTA" : "OK", mensagens: msgs, resolvido: erro ? null : resolvido };
  });

  return { avaliacoes, pendencias: [...pend.values()] };
}
