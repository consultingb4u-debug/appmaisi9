import { db } from "@/lib/db";
import { chaveDia } from "@/lib/domain/datas";
import { compararComBase, curvaS, progressoPlanejado, type ItemAtual, type ItemBase } from "@/lib/domain/linha-base";
import type { Prisma } from "@/lib/generated/prisma/client";
import { previstas } from "./alocacoes";
import { carregarCronograma } from "./cronograma";

type Cliente = Prisma.TransactionClient | typeof db;

/** Cronograma atual no formato da linha de base (esforço = soma das atribuições). */
export async function itensAtuais(projetoId: string, c: Cliente = db): Promise<ItemAtual[]> {
  const atividades = await c.atividade.findMany({ where: { projetoId }, orderBy: [{ ordem: "asc" }, { codigo: "asc" }], include: { atribuicoes: { select: { esforcoPrevisto: true } } } });
  return atividades.map((a) => ({
    codigo: a.codigo,
    tarefa: a.tarefa,
    fase: a.fase,
    inicio: a.inicioPrevisto,
    fim: a.fimPrevisto,
    esforco: a.atribuicoes.reduce((t, x) => t + x.esforcoPrevisto.toNumber(), 0),
    marco: a.marco,
    status: a.status,
  }));
}

/** Congela o cronograma atual (atividades não canceladas) como nova linha de base. */
export async function criarLinhaBase(tx: Prisma.TransactionClient, projetoId: string, nome: string, observacao: string | null, usuarioId: string) {
  const [itens, projeto, ids] = await Promise.all([
    itensAtuais(projetoId, tx),
    tx.projeto.findUniqueOrThrow({ where: { id: projetoId }, select: { horasVendidas: true, dataGoLiveAlvo: true } }),
    tx.atividade.findMany({ where: { projetoId }, select: { id: true, codigo: true } }),
  ]);
  const idPorCodigo = new Map(ids.map((a) => [a.codigo, a.id]));
  return tx.linhaBase.create({
    data: {
      projetoId,
      nome,
      observacao,
      horasVendidas: projeto.horasVendidas,
      goLive: projeto.dataGoLiveAlvo,
      criadaPorId: usuarioId,
      itens: {
        create: itens
          .filter((i) => i.status !== "CANCELADO")
          .map((i) => ({ atividadeId: idPorCodigo.get(i.codigo) ?? null, codigo: i.codigo, fase: i.fase, tarefa: i.tarefa, inicio: i.inicio, fim: i.fim, esforco: i.esforco, marco: i.marco })),
      },
    },
  });
}

async function itensDaBase(linhaBaseId: string): Promise<ItemBase[]> {
  const itens = await db.linhaBaseItem.findMany({ where: { linhaBaseId }, orderBy: { codigo: "asc" } });
  return itens.map((i) => ({ codigo: i.codigo, tarefa: i.tarefa, fase: i.fase, inicio: i.inicio, fim: i.fim, esforco: i.esforco.toNumber(), marco: i.marco }));
}

async function feriados() {
  return new Set((await db.feriado.findMany({ select: { data: true } })).map((f) => chaveDia(f.data)));
}

/** Progresso planejado (% da linha de base vigente que deveria estar feito hoje); null sem linha de base. */
export async function progressoPlanejadoDoProjeto(projetoId: string, hoje = new Date()): Promise<number | null> {
  const lb = await db.linhaBase.findFirst({ where: { projetoId }, orderBy: { criadaEm: "desc" }, select: { id: true } });
  if (!lb) return null;
  return progressoPlanejado(await itensDaBase(lb.id), hoje, await feriados());
}

/** Tudo da tela de linha de base: bases salvas, comparação com a escolhida e curva S. */
export async function painelLinhaBase(projetoId: string, linhaBaseId?: string, hoje = new Date()) {
  const linhas = await db.linhaBase.findMany({ where: { projetoId }, orderBy: { criadaEm: "desc" }, include: { _count: { select: { itens: true } } } });
  const sel = linhas.find((l) => l.id === linhaBaseId) ?? linhas[0] ?? null;
  const [base, atual, alocacoes, fer, crono] = await Promise.all([
    sel ? itensDaBase(sel.id) : Promise.resolve([] as ItemBase[]),
    itensAtuais(projetoId),
    db.alocacaoSemanal.findMany({ where: { projetoId, status: { not: "CANCELADO" } } }),
    feriados(),
    carregarCronograma(projetoId, hoje),
  ]);
  const realizado = new Map<string, number>();
  const previsto = new Map<string, number>();
  for (const a of alocacoes) {
    realizado.set(a.semanaId, (realizado.get(a.semanaId) ?? 0) + a.horasRealizadas.toNumber());
    previsto.set(a.semanaId, (previsto.get(a.semanaId) ?? 0) + previstas(a));
  }
  return {
    linhas,
    sel,
    comparacao: sel ? compararComBase(base, atual) : null,
    curva: curvaS({ base, realizadoPorSemana: realizado, previstoPorSemana: previsto, hoje, feriados: fer }),
    progressoPlanejado: sel ? progressoPlanejado(base, hoje, fer) : null,
    progressoReal: crono.progresso,
  };
}
