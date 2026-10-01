import { db } from "@/lib/db";
import { semanaDe } from "@/lib/domain/semanas";
import { somarDias } from "@/lib/domain/datas";
import { normalizarTexto, STATUS_ATIVOS } from "@/lib/domain/rotulos";
import type { Prioridade, StatusProjeto, TipoProjeto } from "@/lib/generated/prisma/enums";
import type { Prisma } from "@/lib/generated/prisma/client";
import { previstas, realizadas } from "./alocacoes";

export type FiltrosPortfolio = {
  q?: string;
  cliente?: string;
  status?: string; // "ativos" (padrão), "todos" ou um StatusProjeto
  tipo?: string;
  gp?: string;
  recurso?: string;
  prioridade?: string;
  de?: Date | null;
  ate?: Date | null;
};

export type LinhaPortfolio = Awaited<ReturnType<typeof listarPortfolio>>[number];

export async function listarPortfolio(f: FiltrosPortfolio) {
  const where: Prisma.ProjetoWhereInput = { arquivadoEm: null };
  if (!f.status || f.status === "ativos") where.status = { in: STATUS_ATIVOS };
  else if (f.status !== "todos") where.status = f.status as StatusProjeto;
  if (f.cliente) where.clienteId = f.cliente;
  if (f.tipo) where.tipo = f.tipo as TipoProjeto;
  if (f.gp) where.gpId = f.gp;
  if (f.prioridade) where.prioridade = f.prioridade as Prioridade;
  if (f.recurso) where.OR = [{ membros: { some: { recursoId: f.recurso } } }, { alocacoes: { some: { recursoId: f.recurso } } }];

  const projetos = await db.projeto.findMany({
    where,
    include: {
      cliente: { select: { id: true, nome: true } },
      gp: { select: { id: true, nome: true } },
      membros: { select: { recursoId: true } },
      alocacoes: { include: { semana: { select: { inicio: true, fim: true } } } },
    },
    orderBy: [{ cliente: { nome: "asc" } }, { nome: "asc" }],
  });

  const atual = semanaDe(new Date());
  const limite4 = somarDias(atual.inicio, 28);
  const termo = f.q ? normalizarTexto(f.q) : null;

  return projetos
    .map((p) => {
      const semanas = p.alocacoes.map((a) => a.semana);
      const primeiraSemana = semanas.length ? semanas.reduce((m, s) => (s.inicio < m ? s.inicio : m), semanas[0].inicio) : null;
      const ultimaSemana = semanas.length ? semanas.reduce((m, s) => (s.fim > m ? s.fim : m), semanas[0].fim) : null;
      const equipe = new Set([...p.membros.map((m) => m.recursoId), ...p.alocacoes.map((a) => a.recursoId)]);
      return {
        id: p.id,
        codigo: p.codigo,
        nome: p.nome,
        cliente: p.cliente,
        gp: p.gp,
        tipo: p.tipo,
        status: p.status,
        prioridade: p.prioridade,
        statusExecutivo: p.statusExecutivo,
        dataKickoff: p.dataKickoff,
        dataGoLive: p.dataGoLiveReal ?? p.dataGoLiveAlvo,
        dataEncerramento: p.dataEncerramentoReal ?? p.dataEncerramentoPrevista,
        horasVendidas: p.horasVendidas?.toNumber() ?? null,
        horasPlanejadas: p.alocacoes.reduce((t, a) => t + previstas(a), 0),
        horasRealizadas: p.alocacoes.reduce((t, a) => t + realizadas(a), 0),
        horasProximas4: p.alocacoes.filter((a) => a.semana.inicio >= atual.inicio && a.semana.inicio < limite4).reduce((t, a) => t + previstas(a), 0),
        equipe: equipe.size,
        // Período: datas do projeto ou, na falta, as semanas com alocação.
        inicio: p.dataKickoff ?? primeiraSemana,
        fim: p.dataEncerramentoReal ?? p.dataEncerramentoPrevista ?? p.dataGoLiveAlvo ?? ultimaSemana,
        notas: p.notas,
      };
    })
    .filter((p) => !termo || normalizarTexto(`${p.codigo} ${p.nome} ${p.cliente.nome} ${p.notas ?? ""}`).includes(termo))
    .filter((p) => {
      if (!f.de && !f.ate) return true;
      if (!p.inicio && !p.fim) return false;
      const ini = p.inicio ?? p.fim!;
      const fim = p.fim ?? p.inicio!;
      return (!f.ate || ini <= f.ate) && (!f.de || fim >= f.de);
    });
}
