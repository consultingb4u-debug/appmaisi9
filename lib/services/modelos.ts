import { db } from "@/lib/db";
import { chaveDia } from "@/lib/domain/datas";
import { datasDaPosicao, posicoesDoCronograma } from "@/lib/domain/modelo-cronograma";
import type { Prisma } from "@/lib/generated/prisma/client";
import { recalcularProjeto } from "./cronograma";

type Tx = Prisma.TransactionClient;
type BacklogModelo = { codigo: string; requisito: string; tipo: string; prioridade: string; moduloProcesso: string | null; estimativaHoras: number | null };
type AtribuicaoModelo = { recursoId: string; esforco: number };

async function feriados(tx: Tx) {
  return new Set((await tx.feriado.findMany({ select: { data: true } })).map((f) => chaveDia(f.data)));
}

/** Salva o cronograma (e o backlog) do projeto como modelo, com datas relativas em dias úteis. */
export async function salvarComoModelo(tx: Tx, projetoId: string, nome: string, descricao: string | null, usuarioId: string) {
  // Consultas em série: dentro da transação a conexão é única.
  const atividades = await tx.atividade.findMany({
      where: { projetoId, status: { not: "CANCELADO" } },
      orderBy: [{ ordem: "asc" }, { codigo: "asc" }],
      include: { atribuicoes: true, backlogItem: { select: { codigo: true } }, predecessoras: { include: { predecessora: { select: { codigo: true } } } } },
  });
  const backlog = await tx.backlogItem.findMany({ where: { projetoId, status: { not: "CANCELADO" } }, orderBy: [{ ordem: "asc" }, { codigo: "asc" }] });
  const fer = await feriados(tx);
  const pos = posicoesDoCronograma(
    atividades.map((a) => ({ codigo: a.codigo, inicio: a.inicioPrevisto, fim: a.fimPrevisto })),
    fer,
  );
  return tx.modeloCronograma.create({
    data: {
      nome,
      descricao,
      origemProjetoId: projetoId,
      criadoPorId: usuarioId,
      backlog: backlog.map((b) => ({ codigo: b.codigo, requisito: b.requisito, tipo: b.tipo, prioridade: b.prioridade, moduloProcesso: b.moduloProcesso, estimativaHoras: b.estimativaHoras?.toNumber() ?? null })) satisfies BacklogModelo[],
      itens: {
        create: atividades.map((a, i) => ({
          codigo: a.codigo,
          fase: a.fase,
          tarefa: a.tarefa,
          moduloProcesso: a.moduloProcesso,
          backlogCodigo: a.backlogItem?.codigo ?? null,
          ...pos.get(a.codigo)!,
          atribuicoes: a.atribuicoes.map((x) => ({ recursoId: x.recursoId, esforco: x.esforcoPrevisto.toNumber() })) satisfies AtribuicaoModelo[],
          marco: a.marco,
          clienteParticipa: a.clienteParticipa,
          predecessoras: a.predecessoras.map((p) => p.predecessora.codigo),
          ordem: i + 1,
        })),
      },
    },
  });
}

/**
 * Cria backlog e cronograma do projeto a partir do modelo, com início em `inicio`.
 * O cronograma do projeto precisa estar vazio. `manterRecursos`: copia as pessoas e o esforço do modelo
 * (só recursos ativos); senão, as atividades nascem sem recurso para o GP atribuir.
 */
export async function aplicarModelo(tx: Tx, projetoId: string, modeloId: string, inicio: Date, manterRecursos: boolean, usuarioId: string) {
  const modelo = await tx.modeloCronograma.findUniqueOrThrow({ where: { id: modeloId }, include: { itens: { orderBy: { ordem: "asc" } } } });
  const fer = await feriados(tx);
  const ativos = await tx.recurso.findMany({ where: { ativo: true }, select: { id: true } });
  const backlogAtual = await tx.backlogItem.findMany({ where: { projetoId }, select: { id: true, codigo: true } });
  const recursosAtivos = new Set(ativos.map((r) => r.id));
  const backlogPorCodigo = new Map(backlogAtual.map((b) => [b.codigo, b.id]));
  for (const [i, b] of (modelo.backlog as BacklogModelo[]).entries()) {
    if (backlogPorCodigo.has(b.codigo)) continue;
    const novo = await tx.backlogItem.create({
      data: {
        projetoId,
        codigo: b.codigo,
        requisito: b.requisito,
        tipo: b.tipo as "ENTREGA",
        prioridade: b.prioridade as "MEDIA",
        moduloProcesso: b.moduloProcesso,
        estimativaHoras: b.estimativaHoras,
        ordem: i + 1,
        criadoPorId: usuarioId,
        atualizadoPorId: usuarioId,
      },
    });
    backlogPorCodigo.set(b.codigo, novo.id);
  }
  const idPorCodigo = new Map<string, string>();
  const membros = new Set<string>();
  for (const it of modelo.itens) {
    const datas = datasDaPosicao({ inicioDia: it.inicioDia, duracaoDias: it.duracaoDias }, inicio, fer);
    const atribs = manterRecursos ? (it.atribuicoes as AtribuicaoModelo[]).filter((a) => recursosAtivos.has(a.recursoId)) : [];
    const a = await tx.atividade.create({
      data: {
        projetoId,
        codigo: it.codigo,
        fase: it.fase,
        tarefa: it.tarefa,
        moduloProcesso: it.moduloProcesso,
        backlogItemId: it.backlogCodigo ? (backlogPorCodigo.get(it.backlogCodigo) ?? null) : null,
        inicioPrevisto: datas.inicio,
        fimPrevisto: datas.fim,
        marco: it.marco,
        clienteParticipa: it.clienteParticipa,
        responsavelId: atribs[0]?.recursoId ?? null,
        ordem: it.ordem,
        criadoPorId: usuarioId,
        atualizadoPorId: usuarioId,
        atribuicoes: { create: atribs.map((x) => ({ recursoId: x.recursoId, esforcoPrevisto: x.esforco })) },
      },
    });
    atribs.forEach((x) => membros.add(x.recursoId));
    idPorCodigo.set(it.codigo, a.id);
  }
  const preds = modelo.itens.flatMap((it) =>
    it.predecessoras.filter((c) => idPorCodigo.has(c) && c !== it.codigo).map((c) => ({ atividadeId: idPorCodigo.get(it.codigo)!, predecessoraId: idPorCodigo.get(c)! })),
  );
  if (preds.length) await tx.atividadePredecessora.createMany({ data: preds, skipDuplicates: true });
  const jaMembros = new Set((await tx.projetoMembro.findMany({ where: { projetoId }, select: { recursoId: true } })).map((m) => m.recursoId));
  const novos = [...membros].filter((r) => !jaMembros.has(r));
  if (novos.length) await tx.projetoMembro.createMany({ data: novos.map((recursoId) => ({ projetoId, recursoId, papel: "FUNCIONAL" as const })) });
  await recalcularProjeto(tx, projetoId);
  return { atividades: modelo.itens.length, backlog: (modelo.backlog as BacklogModelo[]).length, nome: modelo.nome };
}

export async function listarModelos() {
  const modelos = await db.modeloCronograma.findMany({ orderBy: { nome: "asc" }, include: { itens: { select: { atribuicoes: true, inicioDia: true, duracaoDias: true } } } });
  return modelos.map((m) => ({
    ...m,
    atividades: m.itens.length,
    esforco: Math.round(m.itens.reduce((t, i) => t + (i.atribuicoes as AtribuicaoModelo[]).reduce((s, a) => s + a.esforco, 0), 0) * 10) / 10,
    duracaoDias: m.itens.reduce((t, i) => Math.max(t, (i.inicioDia ?? 0) + (i.duracaoDias ?? 0)), 0),
    requisitos: (m.backlog as BacklogModelo[]).length,
  }));
}
