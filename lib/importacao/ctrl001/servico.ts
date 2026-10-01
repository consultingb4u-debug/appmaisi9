import { db } from "@/lib/db";
import { auditar } from "@/lib/services/auditoria";
import { recalcularProjeto, sincronizarRealizadas } from "@/lib/services/cronograma";
import { garantirSemana } from "@/lib/services/semanas";
import { salvarArquivo } from "@/lib/storage";
import { parseDia, paraDia } from "@/lib/domain/datas";
import { semanaDe } from "@/lib/domain/semanas";
import type { Prisma } from "@/lib/generated/prisma/client";
import { abrirPlanilha, type Primitivo } from "../planilha";
import { lerCtrl001, type LinhaLida001 } from "./ler";
import { avaliarCtrl001, type ContextoCtrl001, type ResolvidoAtividade, type ResolvidoBacklog, type ResolvidoCabecalho } from "./avaliar";
import type {
  ContextoExecucao,
  ResolvidoCaso,
  ResolvidoComplexidade,
  ResolvidoDeployItem,
  ResolvidoOperacional,
  ResolvidoPreItem,
  ResolvidoPreProjeto,
  ResolvidoStatusReport,
} from "./execucao";
import { avaliarComplexidade, PREFIXO_OPERACIONAL } from "@/lib/domain/execucao";
import { chaveDia } from "@/lib/domain/datas";
import { fotografarIndicadores } from "@/lib/services/status-report";

type Cliente = Prisma.TransactionClient | typeof db;
const num = (d: { toNumber(): number } | null | undefined) => (d == null ? null : d.toNumber());

const dt = (d: Date | null) => (d ? chaveDia(d) : null);

/** Estado atual das abas de execução no formato de comparação da importação (mesma ordem de chaves dos tipos Resolvido*). */
async function contextoExecucao(projetoId: string, c: Cliente): Promise<ContextoExecucao> {
  // Em série: dentro da transação a conexão é única (consultas paralelas geram aviso do driver pg).
  const criterios = await c.criterioComplexidade.findMany({ where: { ativo: true }, orderBy: { ordem: "asc" } });
  const notas = await c.projetoComplexidade.findMany({ where: { projetoId } });
  const aval = await c.avaliacaoComplexidade.findUnique({ where: { projetoId } });
  const pre = await c.preProjeto.findUnique({ where: { projetoId } });
  const preItens = await c.preProjetoItem.findMany({ where: { projetoId } });
  const ops = await c.itemOperacional.findMany({ where: { projetoId } });
  const casos = await c.casoTeste.findMany({ where: { projetoId }, include: { backlogItem: { select: { codigo: true } }, execucoes: { orderBy: { ciclo: "desc" }, take: 1 } } });
  const dep = await c.deployment.findFirst({ where: { projetoId }, orderBy: { criadoEm: "desc" }, include: { itens: true } });
  const srs = await c.statusReport.findMany({ where: { projetoId }, select: { resumo: true } });
  const notaDe = new Map(notas.map((n) => [n.criterioId, n]));
  return {
    criterios: criterios.map((x) => x.nome),
    complexidade: aval
      ? JSON.stringify({
          avaliador: aval.avaliador,
          data: dt(aval.data),
          horasEstimadas: num(aval.horasEstimadas),
          notas: criterios.map((x) => ({ criterio: x.nome, nota: notaDe.get(x.id)?.nota ?? null, gatilhoCritico: notaDe.get(x.id)?.gatilhoCritico ?? false })),
        } satisfies ResolvidoComplexidade)
      : null,
    preProjetoStatus: pre?.status ?? null,
    preItens: new Map(
      preItens.map((i) => [
        i.item,
        JSON.stringify({
          categoria: i.categoria,
          item: i.item,
          responsavel: i.responsavel,
          informacaoContato: i.informacaoContato,
          validacaoEsperada: i.validacaoEsperada,
          status: i.status,
          prazo: dt(i.prazo),
          observacao: i.observacao,
        } satisfies ResolvidoPreItem),
      ]),
    ),
    operacional: new Map(
      ops.map((o) => [
        o.codigo,
        JSON.stringify({
          codigo: o.codigo,
          tipo: o.tipo,
          descricao: o.descricao,
          origemCausa: o.origemCausa,
          impactoConsequencia: o.impactoConsequencia,
          responsavelId: o.responsavelId,
          responsavelTexto: o.responsavelTexto,
          dataAbertura: dt(o.dataAbertura),
          prazo: dt(o.prazo),
          status: o.status,
          impactoEscopo: o.impactoEscopo,
          impactoPrazo: o.impactoPrazo,
          impactoHoras: o.impactoHoras,
          acaoResposta: o.acaoResposta,
          decisaoAprovador: o.decisaoAprovador,
          evidencia: o.evidencia,
        } satisfies ResolvidoOperacional),
      ]),
    ),
    casos: new Map(
      casos.map((x) => [
        `${x.tipo}|${x.codigo}`,
        {
          json: JSON.stringify({
            tipo: x.tipo,
            codigo: x.codigo,
            backlogCodigo: x.backlogItem?.codigo ?? null,
            moduloProcesso: x.moduloProcesso,
            cenario: x.cenario,
            preCondicao: x.preCondicao,
            passos: x.passos,
            resultadoEsperado: x.resultadoEsperado,
            responsavelId: x.responsavelId,
            responsavelTexto: x.responsavelTexto,
          } satisfies Omit<ResolvidoCaso, "execucao">),
          ultima: x.execucoes[0] ? { resultado: x.execucoes[0].resultado, validacao: x.execucoes[0].validacao } : null,
        },
      ]),
    ),
    deployItens: new Map(
      (dep?.itens ?? []).map((i) => [
        i.item,
        JSON.stringify({
          categoria: i.categoria,
          item: i.item,
          obrigatorio: i.obrigatorio,
          status: i.status,
          responsavelId: i.responsavelId,
          responsavelTexto: i.responsavelTexto,
          evidencia: i.evidencia,
          riscoObservacao: i.riscoObservacao,
          aprovacao: i.aprovacao,
        } satisfies ResolvidoDeployItem),
      ]),
    ),
    statusReports: new Set(srs.map((x) => x.resumo).filter((x): x is string => !!x)),
  };
}

export async function contextoCtrl001(projetoId: string, c: Cliente = db): Promise<ContextoCtrl001> {
  const projeto = await c.projeto.findUniqueOrThrow({ where: { id: projetoId }, include: { cliente: true } });
  const recursos = await c.recurso.findMany({ include: { apelidos: true } });
  const backlog = await c.backlogItem.findMany({ where: { projetoId } });
  const atividades = await c.atividade.findMany({ where: { projetoId }, include: { atribuicoes: true, backlogItem: { select: { codigo: true } }, predecessoras: { include: { predecessora: { select: { codigo: true } } } } } });
  const execucao = await contextoExecucao(projetoId, c);
  return {
    projeto: { nome: projeto.nome, cliente: projeto.cliente.nome, dataKickoff: projeto.dataKickoff, dataGoLiveAlvo: projeto.dataGoLiveAlvo },
    recursos: recursos.map((r) => ({ id: r.id, nome: r.nome, apelidos: r.apelidos.map((a) => a.apelido) })),
    // Mesma ordem de chaves de ResolvidoBacklog: a comparação é feita por JSON.
    backlog: new Map(
      backlog.map((b) => [
        b.codigo,
        {
          codigo: b.codigo,
          requisito: b.requisito,
          moduloProcesso: b.moduloProcesso,
          tipo: b.tipo,
          prioridade: b.prioridade,
          aderenciaPadrao: b.aderenciaPadrao,
          solucaoProposta: b.solucaoProposta,
          customizacao: b.customizacao,
          criterioAceite: b.criterioAceite,
          estimativaHoras: num(b.estimativaHoras),
          responsavelId: b.responsavelId,
          status: b.status,
          validacaoCliente: b.validacaoCliente,
          observacao: b.observacao,
        } satisfies ResolvidoBacklog,
      ]),
    ),
    atividades: new Map(
      atividades.map((a) => [
        a.codigo,
        {
          codigo: a.codigo,
          fase: a.fase,
          tarefa: a.tarefa,
          backlogCodigo: a.backlogItem?.codigo ?? null,
          inicioPrevisto: a.inicioPrevisto,
          fimPrevisto: a.fimPrevisto,
          percentualConclusao: a.percentualConclusao,
          status: a.status,
          marco: a.marco,
          responsavelId: a.responsavelId,
          atribuicoes: a.atribuicoes.map((x) => ({ recursoId: x.recursoId, esforcoPrevisto: x.esforcoPrevisto.toNumber(), horasParaConcluir: num(x.horasParaConcluir) })),
          predecessoras: a.predecessoras.map((p) => p.predecessora.codigo),
        },
      ]),
    ),
    execucao,
  };
}

async function linhasDoLote(loteId: string, c: Cliente = db) {
  const linhas = await c.importLinha.findMany({ where: { loteId }, orderBy: [{ aba: "asc" }, { linhaOrigem: "asc" }] });
  const lidas: LinhaLida001[] = linhas.map((l) => ({ aba: l.aba, linhaOrigem: l.linhaOrigem, entidade: l.entidade as LinhaLida001["entidade"], dados: l.dados as Record<string, Primitivo> }));
  return { linhas, lidas };
}

export async function validarLoteCtrl001(loteId: string) {
  const lote = await db.importLote.findUniqueOrThrow({ where: { id: loteId } });
  if (lote.status === "EFETIVADO" || lote.status === "DESCARTADO" || !lote.projetoId) return;
  const { linhas, lidas } = await linhasDoLote(loteId);
  const { avaliacoes } = avaliarCtrl001(lidas, await contextoCtrl001(lote.projetoId));
  await db.$transaction(
    async (tx) => {
      await tx.importMensagem.deleteMany({ where: { linha: { loteId } } });
      for (let i = 0; i < linhas.length; i++) await tx.importLinha.update({ where: { id: linhas[i].id }, data: { acao: avaliacoes[i].acao, status: avaliacoes[i].status, chave: avaliacoes[i].chave } });
      await tx.importMensagem.createMany({ data: avaliacoes.flatMap((a, i) => a.mensagens.map((m) => ({ linhaId: linhas[i].id, nivel: m.nivel, campo: m.campo ?? null, mensagem: m.mensagem }))) });
      await tx.importLote.update({ where: { id: loteId }, data: { status: avaliacoes.some((a) => a.status === "ERRO") ? "COM_ERROS" : "VALIDADO" } });
    },
    { timeout: 60_000 },
  );
}

export async function carregarCtrl001(nomeArquivo: string, conteudo: Buffer, projetoId: string, usuarioId: string): Promise<string> {
  const { linhas, avisos } = lerCtrl001(await abrirPlanilha(conteudo));
  if (!linhas.some((l) => l.entidade !== "Cabecalho")) throw new Error(`Nenhuma linha de backlog ou cronograma reconhecida. ${avisos.join(" ")}`);
  const chave = await salvarArquivo("importacoes", nomeArquivo, conteudo);
  const lote = await db.importLote.create({
    data: {
      tipo: "CTRL001",
      projetoId,
      arquivoNome: nomeArquivo,
      arquivoChave: chave,
      carregadoPorId: usuarioId,
      resumo: avisos.join(" ") || null,
      linhas: { createMany: { data: linhas.map((l) => ({ aba: l.aba, linhaOrigem: l.linhaOrigem, entidade: l.entidade, chave: `${l.aba}#${l.linhaOrigem}`, dados: l.dados as Prisma.InputJsonValue })) } },
    },
  });
  await validarLoteCtrl001(lote.id);
  return lote.id;
}

export async function pendenciasCtrl001(loteId: string) {
  const lote = await db.importLote.findUniqueOrThrow({ where: { id: loteId } });
  const { lidas } = await linhasDoLote(loteId);
  return avaliarCtrl001(lidas, await contextoCtrl001(lote.projetoId!)).pendencias;
}

export async function efetivarLoteCtrl001(loteId: string, usuarioId: string) {
  const statusCriados: string[] = [];
  const r = await db.$transaction(
    async (tx) => {
      const lote = await tx.importLote.findUniqueOrThrow({ where: { id: loteId } });
      if (lote.status === "EFETIVADO" || lote.status === "DESCARTADO") throw new Error("Este lote já foi encerrado.");
      const projetoId = lote.projetoId!;
      const projeto = await tx.projeto.findUniqueOrThrow({ where: { id: projetoId } });
      const { linhas, lidas } = await linhasDoLote(loteId, tx);
      const { avaliacoes } = avaliarCtrl001(lidas, await contextoCtrl001(projetoId, tx));
      const r = { criados: 0, atualizados: 0, ignorados: 0, comErro: 0 };
      const origem = (i: number) => `Importação ${lote.arquivoNome} · ${linhas[i].aba} linha ${linhas[i].linhaOrigem}`;
      const marcar = (i: number, id: string) => tx.importLinha.update({ where: { id: linhas[i].id }, data: { entidadeIdDestino: id } });
      const ordem = ["Cabecalho", "Backlog", "Atividade", "Complexidade", "PreProjeto", "PreProjetoItem", "Operacional", "TesteInterno", "Uat", "DeploymentItem", "StatusReport"];
      let deploymentId: string | null = null;
      const indices = linhas.map((_, i) => i).sort((a, b) => ordem.indexOf(lidas[a].entidade) - ordem.indexOf(lidas[b].entidade));
      const idPorCodigo = new Map((await tx.atividade.findMany({ where: { projetoId }, select: { id: true, codigo: true } })).map((a) => [a.codigo, a.id]));
      const predecessorasPendentes: { atividadeId: string; codigos: string[] }[] = [];
      const realizadosPendentes: { atividadeId: string; recursoId: string; horas: number; quando: Date }[] = [];

      for (const i of indices) {
        const a = avaliacoes[i];
        if (a.status === "ERRO") {
          r.comErro++;
          continue;
        }
        if (a.acao === "IGNORAR" || !a.resolvido) {
          r.ignorados++;
          continue;
        }
        const ent = lidas[i].entidade;

        if (ent === "Cabecalho") {
          const c = a.resolvido as ResolvidoCabecalho;
          const depois = await tx.projeto.update({
            where: { id: projetoId },
            data: { ...(c.dataKickoff && { dataKickoff: parseDia(c.dataKickoff) }), ...(c.dataGoLiveAlvo && { dataGoLiveAlvo: parseDia(c.dataGoLiveAlvo) }), atualizadoPorId: usuarioId },
          });
          await auditar(tx, { entidade: "Projeto", entidadeId: projetoId, projetoId, acao: "ALTERAR", usuarioId, resumo: origem(i), antes: projeto, depois });
          await marcar(i, projetoId);
          r.atualizados++;
        }

        if (ent === "Backlog") {
          const b = a.resolvido as ResolvidoBacklog;
          const salvo = await tx.backlogItem.upsert({
            where: { projetoId_codigo: { projetoId, codigo: b.codigo } },
            update: { ...b, atualizadoPorId: usuarioId },
            create: { ...b, projetoId, ordem: Number(b.codigo.replace(/\D/g, "")) || 0, importLinhaId: linhas[i].id, criadoPorId: usuarioId, atualizadoPorId: usuarioId },
          });
          await auditar(tx, { entidade: "BacklogItem", entidadeId: salvo.id, projetoId, acao: "IMPORTAR", usuarioId, resumo: `${b.codigo} · ${origem(i)}` });
          await marcar(i, salvo.id);
          if (a.acao === "CRIAR") r.criados++;
          else r.atualizados++;
        }

        if (ent === "Atividade") {
          const at = a.resolvido as ResolvidoAtividade;
          const backlogItem = at.backlogCodigo ? await tx.backlogItem.findUnique({ where: { projetoId_codigo: { projetoId, codigo: at.backlogCodigo } } }) : null;
          let contatoId: string | null = null;
          if (at.contatoNome) {
            const contato = await tx.contatoCliente.upsert({
              where: { clienteId_nome: { clienteId: projeto.clienteId, nome: at.contatoNome } },
              update: {},
              create: { clienteId: projeto.clienteId, nome: at.contatoNome, funcao: "KEY_USER" },
            });
            contatoId = contato.id;
          }
          const dados = {
            fase: at.fase,
            tarefa: at.tarefa,
            backlogItemId: backlogItem?.id ?? null,
            moduloProcesso: at.moduloProcesso,
            responsavelId: at.responsavelId,
            contatoClienteId: contatoId,
            clienteParticipa: at.clienteParticipa,
            inicioPrevisto: parseDia(at.inicioPrevisto),
            fimPrevisto: parseDia(at.fimPrevisto),
            percentualConclusao: at.percentualConclusao,
            status: at.status,
            marco: at.marco,
            dataRealConclusao: parseDia(at.dataRealConclusao),
            observacao: at.observacao,
            atualizadoPorId: usuarioId,
          };
          const salvo = await tx.atividade.upsert({
            where: { projetoId_codigo: { projetoId, codigo: at.codigo } },
            update: dados,
            create: { ...dados, projetoId, codigo: at.codigo, ordem: Number(at.codigo.replace(/\D/g, "")) || 0, importLinhaId: linhas[i].id, criadoPorId: usuarioId },
          });
          idPorCodigo.set(at.codigo, salvo.id);
          // Atribuições: sincroniza com a planilha, sem remover quem já apontou horas.
          const atuais = await tx.atividadeAtribuicao.findMany({ where: { atividadeId: salvo.id } });
          for (const x of atuais) {
            if (at.atribuicoes.some((n) => n.recursoId === x.recursoId)) continue;
            if (!(await tx.apontamento.count({ where: { atividadeId: salvo.id, recursoId: x.recursoId } }))) await tx.atividadeAtribuicao.delete({ where: { id: x.id } });
          }
          for (const n of at.atribuicoes) {
            await tx.atividadeAtribuicao.upsert({
              where: { atividadeId_recursoId: { atividadeId: salvo.id, recursoId: n.recursoId } },
              update: { esforcoPrevisto: n.esforcoPrevisto, horasParaConcluir: n.horasParaConcluir },
              create: { atividadeId: salvo.id, recursoId: n.recursoId, esforcoPrevisto: n.esforcoPrevisto, horasParaConcluir: n.horasParaConcluir },
            });
            if (!(await tx.projetoMembro.findFirst({ where: { projetoId, recursoId: n.recursoId } }))) await tx.projetoMembro.create({ data: { projetoId, recursoId: n.recursoId, papel: "FUNCIONAL" } });
            if (n.realizado > 0) realizadosPendentes.push({ atividadeId: salvo.id, recursoId: n.recursoId, horas: n.realizado, quando: parseDia(at.dataRealConclusao) ?? parseDia(at.fimPrevisto) ?? paraDia(new Date()) });
          }
          predecessorasPendentes.push({ atividadeId: salvo.id, codigos: at.predecessoras });
          await auditar(tx, { entidade: "Atividade", entidadeId: salvo.id, projetoId, acao: "IMPORTAR", usuarioId, resumo: `${at.codigo} · ${origem(i)}` });
          await marcar(i, salvo.id);
          if (a.acao === "CRIAR") r.criados++;
          else r.atualizados++;
        }

        if (["Complexidade", "PreProjeto", "PreProjetoItem", "Operacional", "TesteInterno", "Uat", "DeploymentItem", "StatusReport"].includes(ent)) {
          const ctxDep = {
            obterDeployment: async () => {
              if (deploymentId) return deploymentId;
              const d = (await tx.deployment.findFirst({ where: { projetoId }, orderBy: { criadoEm: "desc" } })) ?? (await tx.deployment.create({ data: { projetoId, nome: "Go Live", janelaInicio: projeto.dataGoLiveAlvo, janelaFim: projeto.dataGoLiveAlvo } }));
              deploymentId = d.id;
              return d.id;
            },
          };
          const id = await gravarExecucao(tx, ent, a.resolvido, { projetoId, usuarioId, linhaId: linhas[i].id, origem: origem(i), ...ctxDep });
          if (ent === "StatusReport") statusCriados.push(id);
          await marcar(i, id);
          if (a.acao === "CRIAR") r.criados++;
          else r.atualizados++;
        }
      }

      for (const p of predecessorasPendentes) {
        await tx.atividadePredecessora.deleteMany({ where: { atividadeId: p.atividadeId } });
        const ids = p.codigos.map((c) => idPorCodigo.get(c)).filter((x): x is string => !!x && x !== p.atividadeId);
        if (ids.length) await tx.atividadePredecessora.createMany({ data: ids.map((predecessoraId) => ({ atividadeId: p.atividadeId, predecessoraId })), skipDuplicates: true });
      }
      // Realizado da planilha (sem detalhe semanal) vira um apontamento na semana de conclusão/fim — só se ainda não houver apontamentos.
      for (const x of realizadosPendentes) {
        if (await tx.apontamento.count({ where: { atividadeId: x.atividadeId, recursoId: x.recursoId } })) continue;
        const semana = await garantirSemana(tx, semanaDe(x.quando).id);
        await tx.apontamento.create({ data: { recursoId: x.recursoId, projetoId, atividadeId: x.atividadeId, semanaId: semana.id, horas: x.horas, descricao: "Saldo importado do CTRL-001", criadoPorId: usuarioId } });
        await sincronizarRealizadas(tx, projetoId, x.recursoId, semana.id);
      }

      await recalcularProjeto(tx, projetoId);
      await auditar(tx, { entidade: "ImportLote", entidadeId: loteId, projetoId, acao: "IMPORTAR", usuarioId, resumo: `${lote.arquivoNome}: ${r.criados} criado(s), ${r.atualizados} atualizado(s), ${r.ignorados} sem alteração, ${r.comErro} com erro` });
      await tx.importLote.update({ where: { id: loteId }, data: { status: "EFETIVADO", efetivadoPorId: usuarioId, efetivadoEm: new Date() } });
      return r;
    },
    { timeout: 120_000 },
  );
  // Indicadores do status report importado: calculados depois do commit, com os dados já gravados.
  for (const id of statusCriados) {
    const sr = await db.statusReport.findUniqueOrThrow({ where: { id } });
    await db.statusReport.update({ where: { id }, data: { indicadores: (await fotografarIndicadores(sr.projetoId)) as Prisma.InputJsonValue } });
  }
  return r;
}

type Destino = { projetoId: string; usuarioId: string; linhaId: string; origem: string; obterDeployment: () => Promise<string> };

/** Grava uma linha das abas de execução (já validada) e devolve o id do registro de destino. */
async function gravarExecucao(tx: Prisma.TransactionClient, ent: string, resolvido: unknown, o: Destino): Promise<string> {
  const { projetoId, usuarioId } = o;
  const auditarImport = (entidade: string, entidadeId: string, resumo: string) => auditar(tx, { entidade, entidadeId, projetoId, acao: "IMPORTAR", usuarioId, resumo: `${resumo} · ${o.origem}` });

  if (ent === "Complexidade") {
    const c = resolvido as ResolvidoComplexidade;
    const criterios = await tx.criterioComplexidade.findMany({ where: { nome: { in: c.notas.map((n) => n.criterio) } } });
    for (const n of c.notas) {
      const criterioId = criterios.find((x) => x.nome === n.criterio)!.id;
      await tx.projetoComplexidade.upsert({
        where: { projetoId_criterioId: { projetoId, criterioId } },
        create: { projetoId, criterioId, nota: n.nota, gatilhoCritico: n.gatilhoCritico },
        update: { nota: n.nota, gatilhoCritico: n.gatilhoCritico },
      });
    }
    const res = avaliarComplexidade(c.notas);
    const dados = { avaliador: c.avaliador, data: parseDia(c.data), horasEstimadas: c.horasEstimadas, score: res.score, gatilhos: res.gatilhos, nivelFinal: res.final, atualizadoPorId: usuarioId };
    await tx.avaliacaoComplexidade.upsert({ where: { projetoId }, create: { projetoId, ...dados }, update: dados });
    await auditarImport("AvaliacaoComplexidade", projetoId, `Complexidade ${res.final} (score ${res.score})`);
    return projetoId;
  }

  if (ent === "PreProjeto") {
    const p = resolvido as ResolvidoPreProjeto;
    await tx.preProjeto.upsert({ where: { projetoId }, create: { projetoId, status: p.status }, update: { status: p.status } });
    await auditarImport("PreProjeto", projetoId, `Status ${p.status}`);
    return projetoId;
  }

  if (ent === "PreProjetoItem") {
    const p = resolvido as ResolvidoPreItem;
    const dados = { ...p, prazo: parseDia(p.prazo) };
    const ordem = await tx.preProjetoItem.count({ where: { projetoId } });
    const salvo = await tx.preProjetoItem.upsert({ where: { projetoId_item: { projetoId, item: p.item } }, create: { ...dados, projetoId, ordem: ordem + 1 }, update: dados });
    await auditarImport("PreProjetoItem", salvo.id, p.item);
    return salvo.id;
  }

  if (ent === "Operacional") {
    const p = resolvido as ResolvidoOperacional;
    const fechado = ["APROVADO", "REPROVADO", "FECHADO", "CANCELADO"].includes(p.status);
    const dados = { ...p, dataAbertura: parseDia(p.dataAbertura) ?? paraDia(new Date()), prazo: parseDia(p.prazo), atualizadoPorId: usuarioId };
    const atual = await tx.itemOperacional.findUnique({ where: { projetoId_codigo: { projetoId, codigo: p.codigo } } });
    const salvo = await tx.itemOperacional.upsert({
      where: { projetoId_codigo: { projetoId, codigo: p.codigo } },
      create: { ...dados, projetoId, dataFechamento: fechado ? paraDia(new Date()) : null, importLinhaId: o.linhaId, criadoPorId: usuarioId },
      update: { ...dados, dataFechamento: fechado ? (atual?.dataFechamento ?? paraDia(new Date())) : null },
    });
    await auditarImport("ItemOperacional", salvo.id, p.codigo);
    return salvo.id;
  }

  if (ent === "TesteInterno" || ent === "Uat") {
    const { execucao, backlogCodigo, ...p } = resolvido as ResolvidoCaso;
    const backlogItem = backlogCodigo ? await tx.backlogItem.findUnique({ where: { projetoId_codigo: { projetoId, codigo: backlogCodigo } } }) : null;
    const dados = { ...p, backlogItemId: backlogItem?.id ?? null };
    const salvo = await tx.casoTeste.upsert({
      where: { projetoId_tipo_codigo: { projetoId, tipo: p.tipo, codigo: p.codigo } },
      create: { ...dados, projetoId, ordem: Number(p.codigo.replace(/\D/g, "")) || 0, importLinhaId: o.linhaId },
      update: dados,
    });
    if (execucao) {
      const ultima = await tx.execucaoTeste.findFirst({ where: { casoId: salvo.id }, orderBy: { ciclo: "desc" } });
      if (!ultima || ultima.resultado !== execucao.resultado || ultima.validacao !== execucao.validacao) {
        const ciclo = (ultima?.ciclo ?? 0) + 1;
        const reprovou = execucao.resultado === "REPROVADO" || execucao.resultado === "BLOQUEADO";
        const ex = await tx.execucaoTeste.create({
          data: {
            casoId: salvo.id,
            ciclo,
            data: parseDia(execucao.data),
            executor: p.responsavelTexto,
            resultado: execucao.resultado,
            validacao: execucao.validacao,
            evidencia: execucao.evidencia,
            observacao: [execucao.observacao, !reprovou ? execucao.defeito : null].filter(Boolean).join(" · ") || null,
            resultadoObtido: reprovou ? execucao.defeito : null,
            criadoPorId: usuarioId,
          },
        });
        if (reprovou && execucao.defeito) {
          const codigos = (await tx.itemOperacional.findMany({ where: { projetoId, codigo: { startsWith: "DEF-" } }, select: { codigo: true } })).map((x) => x.codigo);
          const max = codigos.reduce((m, c) => Math.max(m, Number(c.slice(4)) || 0), 0);
          await tx.itemOperacional.create({
            data: {
              projetoId,
              codigo: `${PREFIXO_OPERACIONAL.DEFEITO}-${String(max + 1).padStart(3, "0")}`,
              tipo: "DEFEITO",
              descricao: `${p.codigo}: ${execucao.defeito}`.slice(0, 1000),
              origemCausa: `${p.tipo === "UAT" ? "UAT" : "Teste interno"} ${p.codigo}, ciclo ${ciclo} (importado)`,
              responsavelId: p.responsavelId,
              responsavelTexto: p.responsavelId ? null : p.responsavelTexto,
              dataAbertura: parseDia(execucao.data) ?? paraDia(new Date()),
              impactoEscopo: "MEDIO",
              backlogItemId: backlogItem?.id ?? null,
              execucaoTesteId: ex.id,
              importLinhaId: o.linhaId,
              criadoPorId: usuarioId,
              atualizadoPorId: usuarioId,
            },
          });
        }
      }
    }
    await auditarImport("CasoTeste", salvo.id, p.codigo);
    return salvo.id;
  }

  if (ent === "DeploymentItem") {
    const p = resolvido as ResolvidoDeployItem;
    const deploymentId = await o.obterDeployment();
    const ordem = await tx.deploymentItem.count({ where: { deploymentId } });
    const salvo = await tx.deploymentItem.upsert({ where: { deploymentId_item: { deploymentId, item: p.item } }, create: { ...p, deploymentId, ordem: ordem + 1 }, update: p });
    await auditarImport("DeploymentItem", salvo.id, p.item);
    return salvo.id;
  }

  // StatusReport: rascunho; indicadores preenchidos após o commit.
  const p = resolvido as ResolvidoStatusReport;
  const salvo = await tx.statusReport.create({
    data: { ...p, projetoId, dataReferencia: parseDia(p.dataReferencia) ?? paraDia(new Date()), indicadores: {}, importLinhaId: o.linhaId, criadoPorId: usuarioId },
  });
  await auditarImport("StatusReport", salvo.id, "Status report (rascunho)");
  return salvo.id;
}
