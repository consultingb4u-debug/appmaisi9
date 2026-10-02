import { cache } from "react";
import { db } from "@/lib/db";
import { paraDia } from "@/lib/domain/datas";
import { semanaDe, semanasEntre } from "@/lib/domain/semanas";
import { somarDias } from "@/lib/domain/datas";
import { STATUS_OP_ABERTOS } from "@/lib/domain/execucao";
import { STATUS_ATIVOS, TIPO_INDISPONIBILIDADE } from "@/lib/domain/rotulos";
import {
  alertasAtividades,
  alertasDoUsuario,
  alertasIndisponibilidades,
  alertasPendencias,
  alertasSobrecarga,
  alertasStatusReport,
  ordenarAlertas,
  type Alerta,
} from "@/lib/domain/alertas";
import { cargaPorSemana } from "./capacidade";
import { DIAS_STATUS_REPORT } from "./dashboard";

/** Todos os alertas vigentes (calculados na hora a partir dos dados; nada fica armazenado). */
export const alertasVigentes = cache(async (hoje = new Date()): Promise<Alerta[]> => {
  const dia = paraDia(hoje);
  const projetoAtivo = { arquivadoEm: null, status: { in: STATUS_ATIVOS } };
  const selProjeto = { id: true, nome: true, cliente: { select: { nome: true } }, gp: { select: { id: true } } } as const;
  const proj = (p: { id: string; nome: string; cliente: { nome: string }; gp: { id: string } | null }) => ({ id: p.id, nome: p.nome, cliente: p.cliente.nome, gpRecursoId: p.gp?.id ?? null });
  // Sobrecarga: semana atual e a próxima.
  const atual = semanaDe(dia);
  const semanas = semanasEntre(atual.inicio, somarDias(atual.inicio, 13));

  const [atividades, itens, recursos, pendentes, projetos, reports] = await Promise.all([
    db.atividade.findMany({
      where: { status: { in: ["NAO_INICIADO", "EM_ANDAMENTO", "BLOQUEADO"] }, fimPrevisto: { lt: dia }, projeto: projetoAtivo },
      select: { id: true, codigo: true, tarefa: true, fimPrevisto: true, atribuicoes: { select: { recursoId: true } }, projeto: { select: selProjeto } },
    }),
    db.itemOperacional.findMany({
      where: { status: { in: STATUS_OP_ABERTOS }, prazo: { lt: dia }, projeto: projetoAtivo },
      select: { id: true, codigo: true, tipo: true, descricao: true, prazo: true, responsavelId: true, projeto: { select: selProjeto } },
    }),
    db.recurso.findMany({ where: { ativo: true }, select: { id: true, nome: true } }),
    db.indisponibilidade.findMany({ where: { status: "PENDENTE" }, include: { recurso: { select: { nome: true } } } }),
    db.projeto.findMany({ where: { ...projetoAtivo, tipo: "PROJETO" }, select: selProjeto }),
    db.statusReport.groupBy({ by: ["projetoId"], where: { publicado: true }, _max: { dataReferencia: true } }),
  ]);
  const carga = await cargaPorSemana(
    recursos.map((r) => r.id),
    semanas,
  );
  const ultimo = new Map(reports.map((r) => [r.projetoId, r._max.dataReferencia]));

  return ordenarAlertas([
    ...alertasAtividades(
      atividades.map((a) => ({ ...a, fimPrevisto: a.fimPrevisto!, projeto: proj(a.projeto), recursos: a.atribuicoes.map((x) => x.recursoId) })),
      hoje,
    ),
    ...alertasPendencias(itens.map((i) => ({ ...i, prazo: i.prazo!, projeto: proj(i.projeto) })), hoje),
    ...alertasSobrecarga(
      recursos.flatMap((r) =>
        semanas.map((s) => {
          const c = carga.get(r.id)!.get(s.id)!;
          return { recursoId: r.id, nome: r.nome, semana: s, planejado: c.planejado, capacidade: c.capacidade.liquida };
        }),
      ),
    ),
    ...alertasIndisponibilidades(pendentes.map((i) => ({ id: i.id, recurso: i.recurso.nome, tipo: TIPO_INDISPONIBILIDADE[i.tipo], inicio: i.inicio, fim: i.fim }))),
    ...alertasStatusReport(
      projetos.map((p) => ({ ...proj(p), ultimo: ultimo.get(p.id) ?? null })),
      hoje,
      DIAS_STATUS_REPORT,
    ),
  ]);
});

/** Alertas que dizem respeito ao usuário (pelo recurso vinculado e, para gestores, os de gestão). */
export async function alertasParaUsuario(usuario: { id: string; perfil: string }, hoje = new Date()) {
  const [todos, recurso] = await Promise.all([alertasVigentes(hoje), db.recurso.findUnique({ where: { usuarioId: usuario.id }, select: { id: true } })]);
  return alertasDoUsuario(todos, { recursoId: recurso?.id ?? null, gestor: usuario.perfil === "ADMIN" || usuario.perfil === "GESTOR" });
}
