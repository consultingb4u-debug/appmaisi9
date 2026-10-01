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

type Cliente = Prisma.TransactionClient | typeof db;
const num = (d: { toNumber(): number } | null | undefined) => (d == null ? null : d.toNumber());

export async function contextoCtrl001(projetoId: string, c: Cliente = db): Promise<ContextoCtrl001> {
  const [projeto, recursos, backlog, atividades] = await Promise.all([
    c.projeto.findUniqueOrThrow({ where: { id: projetoId }, include: { cliente: true } }),
    c.recurso.findMany({ include: { apelidos: true } }),
    c.backlogItem.findMany({ where: { projetoId } }),
    c.atividade.findMany({ where: { projetoId }, include: { atribuicoes: true, backlogItem: { select: { codigo: true } }, predecessoras: { include: { predecessora: { select: { codigo: true } } } } } }),
  ]);
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
      resumo: [...avisos, "Pré-projeto/complexidade, operacional, testes, deployment e status report entram nos próximos incrementos (reimporte o mesmo arquivo depois)."].join(" "),
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
  return db.$transaction(
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
      const ordem = ["Cabecalho", "Backlog", "Atividade"];
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
}
