import { db } from "@/lib/db";
import { situacaoPrazo, type StatusItem } from "@/lib/domain/cronograma";
import type { Evento } from "@/lib/domain/calendario";
import { STATUS_OP_ABERTOS } from "@/lib/domain/execucao";
import { TIPO_INDISPONIBILIDADE, TIPO_OPERACIONAL } from "@/lib/domain/rotulos";
import type { Prisma } from "@/lib/generated/prisma/client";

/**
 * Eventos do calendário no período: início/fim e marcos do cronograma, Go Lives, janelas de deploy,
 * prazos do Operacional, feriados e ausências aprovadas. Filtra por projeto e/ou recurso.
 */
export async function eventosDoPeriodo(f: { de: Date; ate: Date; projetoId?: string; recursoId?: string }, hoje = new Date()): Promise<Evento[]> {
  const noPeriodo = { gte: f.de, lte: f.ate };
  const filtroProjeto: Prisma.ProjetoWhereInput = {
    arquivadoEm: null,
    ...(f.projetoId && { id: f.projetoId }),
    ...(f.recursoId && { OR: [{ membros: { some: { recursoId: f.recursoId } } }, { atividades: { some: { atribuicoes: { some: { recursoId: f.recursoId } } } } }] }),
  };
  // Ausências: do recurso escolhido ou, no calendário do projeto, de quem trabalha nele.
  const recursosDoProjeto = f.projetoId && !f.recursoId ? (await db.atividadeAtribuicao.findMany({ where: { atividade: { projetoId: f.projetoId } }, distinct: ["recursoId"], select: { recursoId: true } })).map((x) => x.recursoId) : null;

  const [atividades, projetos, itens, deployments, feriados, ausencias] = await Promise.all([
    db.atividade.findMany({
      where: {
        status: { not: "CANCELADO" },
        projeto: filtroProjeto,
        ...(f.recursoId && { atribuicoes: { some: { recursoId: f.recursoId } } }),
        OR: [{ inicioPrevisto: noPeriodo }, { fimPrevisto: noPeriodo }],
      },
      select: { id: true, codigo: true, tarefa: true, status: true, marco: true, inicioPrevisto: true, fimPrevisto: true, projeto: { select: { id: true, nome: true, cliente: { select: { nome: true } } } } },
    }),
    db.projeto.findMany({
      where: { ...filtroProjeto, OR: [{ dataGoLiveReal: noPeriodo }, { dataGoLiveReal: null, dataGoLiveAlvo: noPeriodo }] },
      select: { id: true, nome: true, dataGoLiveAlvo: true, dataGoLiveReal: true, cliente: { select: { nome: true } } },
    }),
    db.itemOperacional.findMany({
      where: { prazo: noPeriodo, status: { in: STATUS_OP_ABERTOS }, projeto: filtroProjeto, ...(f.recursoId && { responsavelId: f.recursoId }) },
      select: { id: true, codigo: true, tipo: true, descricao: true, prazo: true, projeto: { select: { id: true, nome: true, cliente: { select: { nome: true } } } } },
    }),
    db.deployment.findMany({
      where: { projeto: filtroProjeto, janelaInicio: { lte: f.ate }, OR: [{ janelaFim: { gte: f.de } }, { janelaFim: null, janelaInicio: { gte: f.de } }] },
      select: { id: true, nome: true, janelaInicio: true, janelaFim: true, decisao: true, projeto: { select: { id: true, nome: true, cliente: { select: { nome: true } } } } },
    }),
    db.feriado.findMany({ where: { data: noPeriodo } }),
    db.indisponibilidade.findMany({
      where: { status: "APROVADA", inicio: { lte: f.ate }, fim: { gte: f.de }, ...(f.recursoId ? { recursoId: f.recursoId } : recursosDoProjeto ? { recursoId: { in: recursosDoProjeto } } : {}) },
      include: { recurso: { select: { nome: true } } },
    }),
  ]);

  const nomeProj = (p: { nome: string; cliente: { nome: string } }) => `${p.cliente.nome} · ${p.nome}`;
  const eventos: Evento[] = [];
  for (const a of atividades) {
    const detalhe = nomeProj(a.projeto);
    const href = `/projetos/${a.projeto.id}/cronograma`;
    // No calendário geral, o cliente na frente distingue o CRON-001 de cada projeto.
    const titulo = f.projetoId ? `${a.codigo} · ${a.tarefa}` : `${a.projeto.cliente.nome} · ${a.codigo} ${a.tarefa}`;
    const atrasado = situacaoPrazo(a.status as StatusItem, a.fimPrevisto, hoje) === "ATRASADO";
    const mesmoDia = a.inicioPrevisto && a.fimPrevisto && a.inicioPrevisto.getTime() === a.fimPrevisto.getTime();
    if (a.inicioPrevisto && !mesmoDia) eventos.push({ tipo: "INICIO", data: a.inicioPrevisto, titulo, detalhe, href });
    if (a.fimPrevisto) eventos.push({ tipo: a.marco ? "MARCO" : "FIM", data: a.fimPrevisto, titulo, detalhe, href, atrasado });
  }
  for (const p of projetos) eventos.push({ tipo: "GO_LIVE", data: (p.dataGoLiveReal ?? p.dataGoLiveAlvo)!, titulo: `Go Live · ${p.nome}`, detalhe: `${p.cliente.nome}${p.dataGoLiveReal ? " (realizado)" : ""}`, href: `/projetos/${p.id}` });
  for (const i of itens)
    eventos.push({
      tipo: "PRAZO",
      data: i.prazo!,
      titulo: `${i.codigo} · ${i.descricao}`,
      detalhe: `${TIPO_OPERACIONAL[i.tipo]} · ${nomeProj(i.projeto)}`,
      href: `/projetos/${i.projeto.id}/operacional?situacao=todos`,
      atrasado: i.prazo! < hoje,
    });
  for (const d of deployments)
    eventos.push({ tipo: "DEPLOY", data: d.janelaInicio!, ate: d.janelaFim, titulo: `${d.nome} · ${d.projeto.nome}`, detalhe: `Janela de deploy · ${d.projeto.cliente.nome}`, href: `/projetos/${d.projeto.id}/deployment` });
  for (const fe of feriados) eventos.push({ tipo: "FERIADO", data: fe.data, titulo: fe.descricao });
  for (const a of ausencias) eventos.push({ tipo: "AUSENCIA", data: a.inicio, ate: a.fim, titulo: `${a.recurso.nome} · ${TIPO_INDISPONIBILIDADE[a.tipo]}`, href: `/capacidade/indisponibilidades` });
  return eventos;
}
