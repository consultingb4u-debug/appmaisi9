// Validação e conciliação do CTRL-003 — função pura (sem banco), testada em tests/importacao.
import { lerHoras } from "@/lib/domain/alocacao";
import { capacidadeVigente, type Vigencia } from "@/lib/domain/capacidade";
import { chaveDia, diffDias, ehFimDeSemana, parseDia, somarDias } from "@/lib/domain/datas";
import { semanaDe } from "@/lib/domain/semanas";
import {
  enumPorRotulo,
  normalizarTexto,
  PRIORIDADE,
  STATUS_ALOCACAO,
  STATUS_INDISPONIBILIDADE,
  STATUS_PROJETO,
} from "@/lib/domain/rotulos";
import type {
  Prioridade,
  StatusAlocacao,
  StatusIndisponibilidade,
  StatusProjeto,
  TipoIndisponibilidade,
  TipoProjeto,
} from "@/lib/generated/prisma/enums";
import type { LinhaLida } from "./ler";

export type Nivel = "OK" | "ALERTA" | "ERRO";
export type Mensagem = { nivel: Exclude<Nivel, "OK">; campo?: string; mensagem: string };
export type Acao = "CRIAR" | "ATUALIZAR" | "IGNORAR";

type ProjetoCtx = {
  id: string;
  clienteId: string;
  nome: string;
  status: StatusProjeto;
  notas: string | null;
  horasVendidas: number | null;
  dataKickoff: Date | null;
  dataGoLiveAlvo: Date | null;
  dataEncerramentoPrevista: Date | null;
  membros: { recursoId: string; papel: string }[];
};

export type ContextoCtrl003 = {
  recursos: { id: string; nome: string; apelidos: string[] }[];
  clientes: { id: string; nome: string; apelidos: string[] }[];
  projetos: ProjetoCtx[];
  /** chave projetoId|recursoId|semanaId */
  alocacoes: Map<string, { horasManuais: number | null; horasAvulsas: number; horasRealizadas: number; status: StatusAlocacao; prioridade: Prioridade | null; observacao: string | null }>;
  capacidades: Map<string, Vigencia[]>;
  /** chave recursoId|inicio|fim|tipo */
  indisponibilidades: Set<string>;
  gpPadraoId: string | null;
  hoje: Date;
};

/** Referência a projeto: existente (id) ou criado neste mesmo lote (chave). */
export type RefProjeto = { id: string } | { novo: string };

export type ResolvidoProjeto = {
  ref: RefProjeto;
  clienteId: string;
  nome: string;
  tipo: TipoProjeto;
  status: StatusProjeto;
  prioridade: Prioridade;
  notas: string | null;
  horasVendidas: number | null;
  dataKickoff: string | null;
  dataGoLiveAlvo: string | null;
  dataEncerramentoPrevista: string | null;
  gpId: string | null;
  membros: { recursoId: string; papel: "FUNCIONAL" | "TECNICO" }[];
};

export type ResolvidoAlocacao = {
  projeto: RefProjeto;
  recursoId: string;
  semanaId: string;
  horasManuais: number | null;
  horasAvulsas: number;
  horasRealizadas: number;
  status: StatusAlocacao;
  prioridade: Prioridade | null;
  observacao: string | null;
};

export type ResolvidoCapacidade = { recursoId: string; vigenciaInicio: string; horasSemanais: number };

export type ResolvidoIndisponibilidade = {
  recursoId: string;
  tipo: TipoIndisponibilidade;
  inicio: string;
  fim: string;
  horasPorDia: number | null;
  observacao: string | null;
  status: StatusIndisponibilidade;
};

export type Avaliacao = {
  chave: string;
  acao: Acao;
  status: Nivel;
  mensagens: Mensagem[];
  resolvido: ResolvidoProjeto | ResolvidoAlocacao | ResolvidoCapacidade | ResolvidoIndisponibilidade | null;
};

export type Pendencia = { tipo: "RECURSO" | "CLIENTE"; texto: string; ocorrencias: number };

const txt = (v: unknown): string | null => (v === null || v === undefined || String(v).trim() === "" ? null : String(v).trim());

function indice(itens: { id: string; nome: string; apelidos: string[] }[]) {
  const m = new Map<string, string>();
  for (const i of itens) {
    m.set(normalizarTexto(i.nome), i.id);
    for (const a of i.apelidos) m.set(normalizarTexto(a), i.id);
  }
  return m;
}

export const chaveProjeto = (clienteId: string, nome: string) => `${clienteId}|${normalizarTexto(nome)}`;

/** "Treinamento PMI" → TREINAMENTO, "Férias" → FERIAS … */
export function tipoIndisponibilidade(texto: string | null): TipoIndisponibilidade {
  const t = normalizarTexto(texto ?? "");
  if (t.includes("feria")) return t.includes("feriado") ? "FERIADO_LOCAL" : "FERIAS";
  if (t.includes("trein") || t.includes("curso") || t.includes("certific")) return "TREINAMENTO";
  if (t.includes("bloq")) return "BLOQUEIO";
  if (t.includes("ausen") || t.includes("atestado") || t.includes("folga") || t.includes("licen")) return "AUSENCIA";
  return "OUTROS";
}

export function tipoProjetoPorNome(nome: string): TipoProjeto {
  const t = normalizarTexto(nome);
  if (t.startsWith("alocacao")) return "ALOCACAO";
  if (t.startsWith("sustentacao")) return "SUSTENTACAO";
  if (t.startsWith("suporte")) return "SUPORTE";
  return "PROJETO";
}

function diasUteis(inicio: Date, fim: Date): number {
  let n = 0;
  for (let d = inicio; d <= fim; d = somarDias(d, 1)) if (!ehFimDeSemana(d)) n++;
  return n;
}

export function avaliarCtrl003(linhas: LinhaLida[], ctx: ContextoCtrl003): { avaliacoes: Avaliacao[]; pendencias: Pendencia[] } {
  const recursos = indice(ctx.recursos);
  const clientes = indice(ctx.clientes);
  const projetosDb = new Map(ctx.projetos.map((p) => [chaveProjeto(p.clienteId, p.nome), p]));
  const pend = new Map<string, Pendencia>();

  const resolverRecurso = (texto: unknown, msgs: Mensagem[], campo: string, nivel: "ERRO" | "ALERTA" = "ERRO") => {
    const t = txt(texto);
    if (!t) return null;
    const id = recursos.get(normalizarTexto(t));
    if (!id) {
      msgs.push({ nivel, campo, mensagem: `Recurso "${t}" não reconhecido — mapeie no De-Para.` });
      const k = `RECURSO|${normalizarTexto(t)}`;
      pend.set(k, { tipo: "RECURSO", texto: t, ocorrencias: (pend.get(k)?.ocorrencias ?? 0) + 1 });
    }
    return id ?? null;
  };
  const resolverCliente = (texto: unknown, msgs: Mensagem[]) => {
    const t = txt(texto);
    if (!t) {
      msgs.push({ nivel: "ERRO", campo: "Cliente", mensagem: "Cliente vazio." });
      return null;
    }
    const id = clientes.get(normalizarTexto(t));
    if (!id) {
      msgs.push({ nivel: "ERRO", campo: "Cliente", mensagem: `Cliente "${t}" não cadastrado — mapeie ou crie no De-Para.` });
      const k = `CLIENTE|${normalizarTexto(t)}`;
      pend.set(k, { tipo: "CLIENTE", texto: t, ocorrencias: (pend.get(k)?.ocorrencias ?? 0) + 1 });
    }
    return id ?? null;
  };

  // Projetos do portfólio presentes neste lote (para as alocações referenciarem projetos ainda não criados).
  const projetosLote = new Set<string>();
  const alocacoesLote = new Set<string>();
  // Ano de referência das colunas "S40" da aba Capacidade: o da primeira semana planejada.
  const iniciosPlanejamento = linhas
    .filter((l) => l.entidade === "Alocacao")
    .map((l) => parseDia(txt(l.dados.inicioSemana)))
    .filter((d): d is Date => !!d)
    .sort((a, b) => a.getTime() - b.getTime());
  // O Portfólio não tem prioridade: novos projetos herdam a maior prioridade do seu planejamento.
  const ORDEM_PRIORIDADE: Prioridade[] = ["BAIXA", "MEDIA", "ALTA", "CRITICA"];
  const prioridadePlanejada = new Map<string, Prioridade>();
  for (const l of linhas) {
    if (l.entidade !== "Alocacao") continue;
    const cid = clientes.get(normalizarTexto(String(l.dados.cliente ?? "")));
    const pr = enumPorRotulo(PRIORIDADE, txt(l.dados.prioridade));
    if (!cid || !pr || !txt(l.dados.projeto)) continue;
    const k = chaveProjeto(cid, String(l.dados.projeto));
    const atual = prioridadePlanejada.get(k);
    if (!atual || ORDEM_PRIORIDADE.indexOf(pr) > ORDEM_PRIORIDADE.indexOf(atual)) prioridadePlanejada.set(k, pr);
  }
  const anoReferencia = iniciosPlanejamento[0] ? semanaDe(iniciosPlanejamento[0]).anoIso : semanaDe(ctx.hoje).anoIso;

  const avaliacoes: Avaliacao[] = linhas.map((l) => {
    const msgs: Mensagem[] = [];
    const d = l.dados;
    let acao: Acao = "IGNORAR";
    let resolvido: Avaliacao["resolvido"] = null;
    let chave = `${l.aba}#${l.linhaOrigem}`;

    if (l.entidade === "Projeto") {
      const nome = txt(d.projeto);
      const clienteId = resolverCliente(d.cliente, msgs);
      const status = enumPorRotulo(STATUS_PROJETO, txt(d.status));
      if (!status) msgs.push({ nivel: "ERRO", campo: "Status", mensagem: `Status "${txt(d.status) ?? ""}" desconhecido.` });
      const horas = lerHoras(d.horas);
      if (Number.isNaN(horas)) msgs.push({ nivel: "ERRO", campo: "Horas Projeto", mensagem: `Horas "${d.horas}" inválidas.` });
      const datas = { kickoff: parseDia(txt(d.kickoff)), goLive: parseDia(txt(d.goLive)), encerramento: parseDia(txt(d.encerramento)) };
      if (!datas.kickoff && !datas.goLive) msgs.push({ nivel: "ALERTA", mensagem: "Sem datas de kick-off e Go Live no portfólio." });
      if (horas === null) msgs.push({ nivel: "ALERTA", campo: "Horas Projeto", mensagem: "Sem horas do projeto." });
      const membros: ResolvidoProjeto["membros"] = [];
      const f = resolverRecurso(d.funcional, msgs, "Funcional", "ALERTA");
      if (f) membros.push({ recursoId: f, papel: "FUNCIONAL" });
      const t = resolverRecurso(d.tecnico, msgs, "Técnico", "ALERTA");
      if (t) membros.push({ recursoId: t, papel: "TECNICO" });

      if (nome && clienteId && status && !Number.isNaN(horas)) {
        chave = chaveProjeto(clienteId, nome);
        if (projetosLote.has(chave)) msgs.push({ nivel: "ERRO", mensagem: "Projeto repetido no portfólio." });
        projetosLote.add(chave);
        const existente = projetosDb.get(chave);
        const r: ResolvidoProjeto = {
          ref: existente ? { id: existente.id } : { novo: chave },
          clienteId,
          nome,
          tipo: tipoProjetoPorNome(nome),
          status,
          prioridade: prioridadePlanejada.get(chave) ?? "MEDIA",
          notas: txt(d.notas),
          horasVendidas: horas,
          dataKickoff: datas.kickoff ? chaveDia(datas.kickoff) : null,
          dataGoLiveAlvo: datas.goLive ? chaveDia(datas.goLive) : null,
          dataEncerramentoPrevista: datas.encerramento ? chaveDia(datas.encerramento) : null,
          gpId: existente ? null : ctx.gpPadraoId,
          membros,
        };
        resolvido = r;
        if (!existente) acao = "CRIAR";
        else {
          // Atualiza só o que a planilha traz preenchido e difere do sistema.
          const dataIgual = (a: Date | null, b: string | null) => b === null || (a !== null && chaveDia(a) === b);
          const membrosNovos = membros.some((m) => !existente.membros.some((e) => e.recursoId === m.recursoId && e.papel === m.papel));
          const mudou =
            existente.status !== status ||
            (r.notas !== null && r.notas !== existente.notas) ||
            (horas !== null && horas !== existente.horasVendidas) ||
            !dataIgual(existente.dataKickoff, r.dataKickoff) ||
            !dataIgual(existente.dataGoLiveAlvo, r.dataGoLiveAlvo) ||
            !dataIgual(existente.dataEncerramentoPrevista, r.dataEncerramentoPrevista) ||
            membrosNovos;
          acao = mudou ? "ATUALIZAR" : "IGNORAR";
        }
      } else if (!nome) msgs.push({ nivel: "ERRO", campo: "Projeto", mensagem: "Nome do projeto vazio." });
    }

    if (l.entidade === "Alocacao") {
      const clienteId = resolverCliente(d.cliente, msgs);
      const nome = txt(d.projeto);
      const recursoId = resolverRecurso(d.recurso, msgs, "Recurso");
      const inicio = parseDia(txt(d.inicioSemana));
      if (!inicio) msgs.push({ nivel: "ERRO", campo: "Início Semana", mensagem: "Início da semana vazio ou inválido." });
      const semana = inicio ? semanaDe(inicio) : null;
      if (semana && txt(d.semana) && txt(d.semana)!.toUpperCase() !== `S${semana.numero}` && txt(d.semana)!.toUpperCase() !== `S${String(semana.numero).padStart(2, "0")}`)
        msgs.push({ nivel: "ALERTA", campo: "Semana", mensagem: `Semana "${txt(d.semana)}" não confere com a data ${chaveDia(inicio!)} (S${semana.numero}). Usada a data.` });
      const prev = lerHoras(d.horasPrevistas);
      const real = lerHoras(d.horasRealizadas);
      if (Number.isNaN(prev)) msgs.push({ nivel: "ERRO", campo: "Horas Previstas", mensagem: `Horas "${d.horasPrevistas}" inválidas.` });
      if (Number.isNaN(real)) msgs.push({ nivel: "ERRO", campo: "Horas Realizadas", mensagem: `Horas "${d.horasRealizadas}" inválidas.` });
      if (typeof d.horasPrevistas === "string" && !Number.isNaN(prev))
        msgs.push({ nivel: "ALERTA", campo: "Horas Previstas", mensagem: `Horas digitadas como texto ("${d.horasPrevistas}") — convertidas para ${prev}.` });
      const statusTxt = txt(d.status);
      const status = enumPorRotulo(STATUS_ALOCACAO, statusTxt) ?? "PLANEJADO";
      if (statusTxt && !enumPorRotulo(STATUS_ALOCACAO, statusTxt)) msgs.push({ nivel: "ALERTA", campo: "Status", mensagem: `Status "${statusTxt}" desconhecido — usado Planejado.` });
      const prioTxt = txt(d.prioridade);
      const prioridade = enumPorRotulo(PRIORIDADE, prioTxt);
      if (prioTxt && !prioridade) msgs.push({ nivel: "ALERTA", campo: "Prioridade", mensagem: `Prioridade "${prioTxt}" desconhecida.` });

      let projeto: RefProjeto | null = null;
      if (clienteId && nome) {
        const k = chaveProjeto(clienteId, nome);
        const existente = projetosDb.get(k);
        if (existente) projeto = { id: existente.id };
        else if (linhas.some((x) => x.entidade === "Projeto" && normalizarTexto(String(x.dados.projeto ?? "")) === normalizarTexto(nome) && clientes.get(normalizarTexto(String(x.dados.cliente ?? ""))) === clienteId))
          projeto = { novo: k };
        else msgs.push({ nivel: "ERRO", campo: "Projeto", mensagem: `Projeto "${nome}" não está no Portfólio.` });
      }

      if (projeto && recursoId && semana && !Number.isNaN(prev) && !Number.isNaN(real)) {
        // Horas de gestão do GP ("GP | …") não vêm de atividade: entram como avulsas.
        const obs = txt(d.observacao);
        const ehGestao = !!obs && /^gp\b/i.test(obs);
        const r: ResolvidoAlocacao = {
          projeto,
          recursoId,
          semanaId: semana.id,
          horasManuais: ehGestao ? null : (prev ?? 0),
          horasAvulsas: ehGestao ? (prev ?? 0) : 0,
          horasRealizadas: real ?? 0,
          status,
          prioridade,
          observacao: obs,
        };
        resolvido = r;
        chave = `${"id" in projeto ? projeto.id : projeto.novo}|${recursoId}|${semana.id}`;
        if (alocacoesLote.has(chave)) msgs.push({ nivel: "ERRO", mensagem: "Linha repetida: mesmo projeto, recurso e semana." });
        alocacoesLote.add(chave);
        const existente = "id" in projeto ? ctx.alocacoes.get(chave) : undefined;
        if (!existente) acao = "CRIAR";
        else
          acao =
            existente.horasManuais !== r.horasManuais ||
            existente.horasAvulsas !== r.horasAvulsas ||
            existente.horasRealizadas !== r.horasRealizadas ||
            existente.status !== r.status ||
            existente.prioridade !== r.prioridade ||
            existente.observacao !== r.observacao
              ? "ATUALIZAR"
              : "IGNORAR";
      }
    }

    if (l.entidade === "Capacidade") {
      const recursoId = resolverRecurso(d.recurso, msgs, "Recurso");
      const semanas = d.semanas as Record<string, number | null>;
      const valores = Object.entries(semanas).filter(([, v]) => typeof v === "number" && !Number.isNaN(v)) as [string, number][];
      if (recursoId) {
        chave = `capacidade|${recursoId}`;
        if (valores.length === 0) {
          msgs.push({ nivel: "ALERTA", mensagem: "Sem capacidade preenchida na planilha — mantida a do sistema." });
        } else {
          const distintos = [...new Set(valores.map(([, v]) => v))];
          const [primeira, horas] = valores[0];
          const numero = Number(primeira.slice(1));
          // Segunda-feira da semana ISO `numero` do ano de referência.
          const jan4 = new Date(Date.UTC(anoReferencia, 0, 4));
          const inicio = somarDias(semanaDe(jan4).inicio, (numero - 1) * 7);
          if (distintos.length > 1) {
            msgs.push({ nivel: "ALERTA", mensagem: `Capacidade varia entre semanas (${distintos.join("h, ")}h) — ajuste as vigências manualmente.` });
          } else {
            const atual = capacidadeVigente(ctx.capacidades.get(recursoId) ?? [], inicio);
            if (atual !== horas) {
              acao = "ATUALIZAR";
              resolvido = { recursoId, vigenciaInicio: chaveDia(inicio), horasSemanais: horas } satisfies ResolvidoCapacidade;
              msgs.push({ nivel: "ALERTA", mensagem: `Capacidade passa de ${atual}h para ${horas}h a partir de ${chaveDia(inicio)}.` });
            }
          }
        }
      }
    }

    if (l.entidade === "Indisponibilidade") {
      const recursoId = resolverRecurso(d.recurso, msgs, "Recurso");
      const inicio = parseDia(txt(d.inicio));
      const fim = parseDia(txt(d.fim)) ?? inicio;
      if (!inicio) msgs.push({ nivel: "ERRO", campo: "Início", mensagem: "Data de início inválida." });
      if (inicio && fim && fim < inicio) msgs.push({ nivel: "ERRO", campo: "Fim", mensagem: "Fim anterior ao início." });
      const tipo = tipoIndisponibilidade(txt(d.tipo));
      const statusTxt = txt(d.status);
      const status = enumPorRotulo(STATUS_INDISPONIBILIDADE, statusTxt) ?? "PENDENTE";
      const horas = lerHoras(d.horas);
      if (Number.isNaN(horas)) msgs.push({ nivel: "ERRO", campo: "Horas", mensagem: `Horas "${d.horas}" inválidas.` });
      if (recursoId && inicio && fim && fim >= inicio && !Number.isNaN(horas)) {
        const dias = Math.max(1, diasUteis(inicio, fim));
        const r: ResolvidoIndisponibilidade = {
          recursoId,
          tipo,
          inicio: chaveDia(inicio),
          fim: chaveDia(fim),
          horasPorDia: horas === null ? null : Math.round((horas / dias) * 10) / 10,
          observacao: [txt(d.tipo), txt(d.observacao)].filter(Boolean).join(" · ") || null,
          status,
        };
        resolvido = r;
        chave = `${recursoId}|${r.inicio}|${r.fim}|${tipo}`;
        acao = ctx.indisponibilidades.has(chave) ? "IGNORAR" : "CRIAR";
        if (status === "PENDENTE") msgs.push({ nivel: "ALERTA", mensagem: "Indisponibilidade pendente de aprovação — não reduz a capacidade até ser aprovada." });
        if (diffDias(fim, inicio) > 60) msgs.push({ nivel: "ALERTA", mensagem: "Período maior que 60 dias — confira as datas." });
      }
    }

    const temErro = msgs.some((m) => m.nivel === "ERRO");
    const status: Nivel = temErro ? "ERRO" : msgs.length ? "ALERTA" : "OK";
    return { chave, acao: temErro ? "IGNORAR" : acao, status, mensagens: msgs, resolvido: temErro ? null : resolvido };
  });

  return { avaliacoes, pendencias: [...pend.values()] };
}
