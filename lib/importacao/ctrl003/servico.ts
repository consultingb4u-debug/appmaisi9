import { db } from "@/lib/db";
import { auditar } from "@/lib/services/auditoria";
import { proximoCodigoProjeto } from "@/lib/services/projeto";
import { lerArquivo, salvarArquivo } from "@/lib/storage";
import { parseDia, somarDias } from "@/lib/domain/datas";
import type { Prisma } from "@/lib/generated/prisma/client";
import { abrirPlanilha, type Primitivo } from "../planilha";
import { lerCtrl003, type LinhaLida } from "./ler";
import {
  avaliarCtrl003,
  type ContextoCtrl003,
  type ResolvidoAlocacao,
  type ResolvidoCapacidade,
  type ResolvidoIndisponibilidade,
  type ResolvidoProjeto,
} from "./avaliar";

type Cliente = Prisma.TransactionClient | typeof db;

const num = (d: { toNumber(): number } | null | undefined) => (d == null ? null : d.toNumber());

/** Estado atual do banco necessário para conciliar a planilha. */
export async function contextoCtrl003(c: Cliente = db): Promise<ContextoCtrl003> {
  const [recursos, clientes, projetos, alocacoes, capacidades, indisp, gp] = await Promise.all([
    c.recurso.findMany({ include: { apelidos: true } }),
    c.cliente.findMany({ include: { apelidos: true } }),
    c.projeto.findMany({ include: { membros: true } }),
    c.alocacaoSemanal.findMany(),
    c.recursoCapacidade.findMany(),
    c.indisponibilidade.findMany(),
    c.recurso.findUnique({ where: { nome: "Carlos Camargo" }, select: { id: true } }), // GP padrão (decisão de negócio)
  ]);
  const caps = new Map<string, { vigenciaInicio: Date; vigenciaFim: Date | null; horasSemanais: number }[]>();
  for (const v of capacidades) {
    caps.set(v.recursoId, [...(caps.get(v.recursoId) ?? []), { vigenciaInicio: v.vigenciaInicio, vigenciaFim: v.vigenciaFim, horasSemanais: v.horasSemanais.toNumber() }]);
  }
  return {
    recursos: recursos.map((r) => ({ id: r.id, nome: r.nome, apelidos: r.apelidos.map((a) => a.apelido) })),
    clientes: clientes.map((x) => ({ id: x.id, nome: x.nome, apelidos: x.apelidos.map((a) => a.apelido) })),
    projetos: projetos.map((p) => ({
      id: p.id,
      clienteId: p.clienteId,
      nome: p.nome,
      status: p.status,
      notas: p.notas,
      horasVendidas: num(p.horasVendidas),
      dataKickoff: p.dataKickoff,
      dataGoLiveAlvo: p.dataGoLiveAlvo,
      dataEncerramentoPrevista: p.dataEncerramentoPrevista,
      membros: p.membros.map((m) => ({ recursoId: m.recursoId, papel: m.papel })),
    })),
    alocacoes: new Map(
      alocacoes.map((a) => [
        `${a.projetoId}|${a.recursoId}|${a.semanaId}`,
        { horasManuais: num(a.horasManuais), horasAvulsas: a.horasAvulsas.toNumber(), horasRealizadas: a.horasRealizadas.toNumber(), status: a.status, prioridade: a.prioridade, observacao: a.observacao },
      ]),
    ),
    capacidades: caps,
    indisponibilidades: new Set(indisp.map((i) => `${i.recursoId}|${i.inicio.toISOString().slice(0, 10)}|${i.fim.toISOString().slice(0, 10)}|${i.tipo}`)),
    gpPadraoId: gp?.id ?? null,
    hoje: new Date(),
  };
}

async function linhasDoLote(loteId: string, c: Cliente = db) {
  const linhas = await c.importLinha.findMany({ where: { loteId }, orderBy: [{ aba: "asc" }, { linhaOrigem: "asc" }] });
  const lidas: LinhaLida[] = linhas.map((l) => ({ aba: l.aba, linhaOrigem: l.linhaOrigem, entidade: l.entidade as LinhaLida["entidade"], dados: l.dados as Record<string, Primitivo> }));
  return { linhas, lidas };
}

/** Recalcula ação/status/mensagens de todas as linhas do lote. */
export async function validarLote(loteId: string) {
  const lote = await db.importLote.findUniqueOrThrow({ where: { id: loteId } });
  if (lote.status === "EFETIVADO" || lote.status === "DESCARTADO") return;
  const { linhas, lidas } = await linhasDoLote(loteId);
  const { avaliacoes } = avaliarCtrl003(lidas, await contextoCtrl003());
  await db.$transaction(
    async (tx) => {
      await tx.importMensagem.deleteMany({ where: { linha: { loteId } } });
      for (let i = 0; i < linhas.length; i++) {
        const a = avaliacoes[i];
        await tx.importLinha.update({ where: { id: linhas[i].id }, data: { acao: a.acao, status: a.status, chave: a.chave } });
      }
      await tx.importMensagem.createMany({
        data: avaliacoes.flatMap((a, i) => a.mensagens.map((m) => ({ linhaId: linhas[i].id, nivel: m.nivel, campo: m.campo ?? null, mensagem: m.mensagem }))),
      });
      const erros = avaliacoes.filter((a) => a.status === "ERRO").length;
      await tx.importLote.update({ where: { id: loteId }, data: { status: erros ? "COM_ERROS" : "VALIDADO" } });
    },
    { timeout: 60_000 },
  );
}

/** Salva o arquivo, extrai as linhas para a área de revisão e valida. Não altera dados de negócio. */
export async function carregarCtrl003(nomeArquivo: string, conteudo: Buffer, usuarioId: string): Promise<string> {
  const wb = await abrirPlanilha(conteudo);
  const { linhas, avisos } = lerCtrl003(wb);
  if (linhas.length === 0) throw new Error(`Nenhuma linha reconhecida. ${avisos.join(" ")}`);
  const chave = await salvarArquivo("importacoes", nomeArquivo, conteudo);
  const lote = await db.importLote.create({
    data: {
      tipo: "CTRL003",
      arquivoNome: nomeArquivo,
      arquivoChave: chave,
      carregadoPorId: usuarioId,
      resumo: avisos.length ? avisos.join(" ") : null,
      linhas: {
        createMany: { data: linhas.map((l) => ({ aba: l.aba, linhaOrigem: l.linhaOrigem, entidade: l.entidade, chave: `${l.aba}#${l.linhaOrigem}`, dados: l.dados as Prisma.InputJsonValue })) },
      },
    },
  });
  await validarLote(lote.id);
  return lote.id;
}

export type ResultadoEfetivacao = { criados: number; atualizados: number; ignorados: number; comErro: number };

/**
 * Grava no banco as linhas OK/ALERTA (linhas com erro são puladas).
 * Reavalia contra o estado atual dentro da transação: reimportar o mesmo arquivo não duplica nada.
 */
export async function efetivarLote(loteId: string, usuarioId: string): Promise<ResultadoEfetivacao> {
  return db.$transaction(
    async (tx) => {
      const lote = await tx.importLote.findUniqueOrThrow({ where: { id: loteId } });
      if (lote.status === "EFETIVADO" || lote.status === "DESCARTADO") throw new Error("Este lote já foi encerrado.");
      const { linhas, lidas } = await linhasDoLote(loteId, tx);
      const { avaliacoes } = avaliarCtrl003(lidas, await contextoCtrl003(tx));
      const r: ResultadoEfetivacao = { criados: 0, atualizados: 0, ignorados: 0, comErro: 0 };
      const novosProjetos = new Map<string, string>();
      const origem = (i: number) => `Importação ${lote.arquivoNome} · ${linhas[i].aba} linha ${linhas[i].linhaOrigem}`;
      const marcar = (i: number, entidadeId: string) => tx.importLinha.update({ where: { id: linhas[i].id }, data: { entidadeIdDestino: entidadeId, acao: avaliacoes[i].acao, status: avaliacoes[i].status } });

      // Ordem: projetos → capacidades → alocações → indisponibilidades
      const ordem = ["Projeto", "Capacidade", "Alocacao", "Indisponibilidade"];
      const indices = linhas.map((_, i) => i).sort((a, b) => ordem.indexOf(lidas[a].entidade) - ordem.indexOf(lidas[b].entidade));

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
        const entidade = lidas[i].entidade;

        if (entidade === "Projeto") {
          const p = a.resolvido as ResolvidoProjeto;
          const datas = {
            dataKickoff: parseDia(p.dataKickoff),
            dataGoLiveAlvo: parseDia(p.dataGoLiveAlvo),
            dataEncerramentoPrevista: parseDia(p.dataEncerramentoPrevista),
          };
          if ("novo" in p.ref) {
            const criado = await tx.projeto.create({
              data: {
                codigo: await proximoCodigoProjeto(tx),
                clienteId: p.clienteId,
                nome: p.nome,
                tipo: p.tipo,
                status: p.status,
                prioridade: p.prioridade,
                notas: p.notas,
                horasVendidas: p.horasVendidas,
                gpId: p.gpId,
                ...datas,
                criadoPorId: usuarioId,
                atualizadoPorId: usuarioId,
                membros: {
                  create: [...(p.gpId ? [{ recursoId: p.gpId, papel: "GP" as const }] : []), ...p.membros],
                },
              },
            });
            novosProjetos.set(p.ref.novo, criado.id);
            await auditar(tx, { entidade: "Projeto", entidadeId: criado.id, projetoId: criado.id, acao: "IMPORTAR", usuarioId, resumo: `${criado.codigo} ${criado.nome} · ${origem(i)}` });
            await marcar(i, criado.id);
            r.criados++;
          } else {
            const id = p.ref.id;
            const antes = await tx.projeto.findUniqueOrThrow({ where: { id } });
            const depois = await tx.projeto.update({
              where: { id },
              data: {
                status: p.status,
                ...(p.notas !== null && { notas: p.notas }),
                ...(p.horasVendidas !== null && { horasVendidas: p.horasVendidas }),
                ...(datas.dataKickoff && { dataKickoff: datas.dataKickoff }),
                ...(datas.dataGoLiveAlvo && { dataGoLiveAlvo: datas.dataGoLiveAlvo }),
                ...(datas.dataEncerramentoPrevista && { dataEncerramentoPrevista: datas.dataEncerramentoPrevista }),
                atualizadoPorId: usuarioId,
              },
            });
            for (const m of p.membros) {
              await tx.projetoMembro.upsert({
                where: { projetoId_recursoId_papel: { projetoId: id, recursoId: m.recursoId, papel: m.papel } },
                update: {},
                create: { projetoId: id, recursoId: m.recursoId, papel: m.papel },
              });
            }
            await auditar(tx, { entidade: "Projeto", entidadeId: id, projetoId: id, acao: "ALTERAR", usuarioId, resumo: origem(i), antes, depois });
            await marcar(i, id);
            r.atualizados++;
          }
        }

        if (entidade === "Capacidade") {
          const c = a.resolvido as ResolvidoCapacidade;
          const inicio = parseDia(c.vigenciaInicio)!;
          // Não sobrescreve vigências futuras já cadastradas no sistema (importação não destrutiva).
          if (await tx.recursoCapacidade.count({ where: { recursoId: c.recursoId, vigenciaInicio: { gte: inicio } } })) {
            r.ignorados++;
            continue;
          }
          const aberta = await tx.recursoCapacidade.findFirst({ where: { recursoId: c.recursoId, vigenciaFim: null, vigenciaInicio: { lt: inicio } } });
          if (aberta) await tx.recursoCapacidade.update({ where: { id: aberta.id }, data: { vigenciaFim: somarDias(inicio, -1) } });
          const nova = await tx.recursoCapacidade.create({ data: { recursoId: c.recursoId, vigenciaInicio: inicio, horasSemanais: c.horasSemanais, criadoPorId: usuarioId } });
          await auditar(tx, {
            entidade: "Recurso",
            entidadeId: c.recursoId,
            acao: "IMPORTAR",
            usuarioId,
            resumo: `Capacidade ${c.horasSemanais}h/semana a partir de ${c.vigenciaInicio} · ${origem(i)}`,
          });
          await marcar(i, nova.id);
          r.atualizados++;
        }

        if (entidade === "Alocacao") {
          const al = a.resolvido as ResolvidoAlocacao;
          const projetoId = "id" in al.projeto ? al.projeto.id : novosProjetos.get(al.projeto.novo);
          if (!projetoId) {
            r.comErro++;
            continue;
          }
          const dados = {
            horasManuais: al.horasManuais,
            horasAvulsas: al.horasAvulsas,
            horasRealizadas: al.horasRealizadas,
            status: al.status,
            prioridade: al.prioridade,
            observacao: al.observacao,
            importLinhaId: linhas[i].id,
            atualizadoPorId: usuarioId,
          };
          const salvo = await tx.alocacaoSemanal.upsert({
            where: { projetoId_recursoId_semanaId: { projetoId, recursoId: al.recursoId, semanaId: al.semanaId } },
            update: dados,
            create: { projetoId, recursoId: al.recursoId, semanaId: al.semanaId, ...dados, criadoPorId: usuarioId },
          });
          await marcar(i, salvo.id);
          if (a.acao === "CRIAR") r.criados++;
          else r.atualizados++;
        }

        if (entidade === "Indisponibilidade") {
          const ind = a.resolvido as ResolvidoIndisponibilidade;
          const criada = await tx.indisponibilidade.create({
            data: {
              recursoId: ind.recursoId,
              tipo: ind.tipo,
              inicio: parseDia(ind.inicio)!,
              fim: parseDia(ind.fim)!,
              horasPorDia: ind.horasPorDia,
              observacao: ind.observacao,
              status: ind.status,
              importLinhaId: linhas[i].id,
              criadoPorId: usuarioId,
            },
          });
          await auditar(tx, { entidade: "Indisponibilidade", entidadeId: criada.id, acao: "IMPORTAR", usuarioId, resumo: origem(i) });
          await marcar(i, criada.id);
          r.criados++;
        }
      }

      // Uma linha de auditoria resume as alocações (evita centenas de registros iguais).
      await auditar(tx, {
        entidade: "ImportLote",
        entidadeId: loteId,
        acao: "IMPORTAR",
        usuarioId,
        resumo: `${lote.arquivoNome}: ${r.criados} criado(s), ${r.atualizados} atualizado(s), ${r.ignorados} sem alteração, ${r.comErro} com erro`,
      });
      await tx.importLote.update({ where: { id: loteId }, data: { status: "EFETIVADO", efetivadoPorId: usuarioId, efetivadoEm: new Date() } });
      return r;
    },
    { timeout: 120_000 },
  );
}

/** Para reprocessar o arquivo original (ex.: depois de corrigir o leitor). */
export async function arquivoDoLote(loteId: string) {
  const lote = await db.importLote.findUniqueOrThrow({ where: { id: loteId } });
  return { nome: lote.arquivoNome, conteudo: await lerArquivo(lote.arquivoChave) };
}

/** Nomes da planilha ainda sem correspondência no sistema (para o De-Para). */
export async function pendenciasDoLote(loteId: string) {
  const { lidas } = await linhasDoLote(loteId);
  return avaliarCtrl003(lidas, await contextoCtrl003()).pendencias;
}
