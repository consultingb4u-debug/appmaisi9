"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { exigir } from "@/lib/auth/sessao";
import { ErroNegocio, executarAcao, lerFormulario } from "@/lib/acoes";
import { auditar } from "@/lib/services/auditoria";
import { recalcularProjeto } from "@/lib/services/cronograma";
import { coerenciaStatus, proximoCodigo } from "@/lib/domain/cronograma";
import { parseDia, paraDia } from "@/lib/domain/datas";
import type { EstadoAcao } from "@/components/formulario";

const zData = z
  .string()
  .optional()
  .transform((s, ctx) => {
    if (!s) return null;
    const d = parseDia(s);
    if (!d) ctx.addIssue({ code: "custom", message: "Data inválida." });
    return d;
  });
const zHoras = z.coerce.number().min(0, "Horas negativas.").max(5000);
const zStatus = z.enum(["NAO_INICIADO", "EM_ANDAMENTO", "BLOQUEADO", "CONCLUIDO", "CANCELADO"]);

function revalidar(projetoId: string) {
  revalidatePath(`/projetos/${projetoId}`, "layout");
  revalidatePath("/capacidade", "layout");
  revalidatePath("/");
}

// ───────────────────────────── Backlog ─────────────────────────────

const zBacklog = z.object({
  requisito: z.string({ error: "Descreva o requisito." }).min(2).max(500),
  moduloProcesso: z.string().max(120).optional(),
  tipo: z.enum(["ENTREGA", "REQUISITO", "MELHORIA", "INTEGRACAO", "RELATORIO", "CUSTOMIZACAO"]),
  prioridade: z.enum(["BAIXA", "MEDIA", "ALTA", "CRITICA"]),
  aderenciaPadrao: z.enum(["ADERENTE", "PARCIAL", "GAP", "A_VALIDAR"]),
  solucaoProposta: z.string().max(1000).optional(),
  customizacao: z.enum(["SIM", "NAO", "A_CONFIRMAR"]),
  criterioAceite: z.string().max(1000).optional(),
  estimativaHoras: zHoras.optional(),
  responsavelId: z.uuid().optional(),
  status: zStatus,
  validacaoCliente: z.enum(["PENDENTE", "APROVADO", "REPROVADO", "NA"]),
  observacao: z.string().max(1000).optional(),
});

export async function salvarBacklog(projetoId: string, id: string | null, _: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "PROJETOS");
    const v = zBacklog.parse(lerFormulario(dados));
    const data = {
      ...v,
      moduloProcesso: v.moduloProcesso ?? null,
      solucaoProposta: v.solucaoProposta ?? null,
      criterioAceite: v.criterioAceite ?? null,
      estimativaHoras: v.estimativaHoras ?? null,
      responsavelId: v.responsavelId ?? null,
      observacao: v.observacao ?? null,
      atualizadoPorId: u.id,
    };
    await db.$transaction(async (tx) => {
      if (id) {
        const antes = await tx.backlogItem.findUniqueOrThrow({ where: { id } });
        const depois = await tx.backlogItem.update({ where: { id }, data });
        await auditar(tx, { entidade: "BacklogItem", entidadeId: id, projetoId, acao: "ALTERAR", usuarioId: u.id, resumo: depois.codigo, antes, depois });
      } else {
        const codigos = (await tx.backlogItem.findMany({ where: { projetoId }, select: { codigo: true } })).map((x) => x.codigo);
        const novo = await tx.backlogItem.create({ data: { ...data, projetoId, codigo: proximoCodigo("REQ", codigos), ordem: codigos.length + 1, criadoPorId: u.id } });
        await auditar(tx, { entidade: "BacklogItem", entidadeId: novo.id, projetoId, acao: "CRIAR", usuarioId: u.id, resumo: `${novo.codigo} ${novo.requisito}` });
      }
    });
    revalidar(projetoId);
    return { ok: true, mensagem: id ? "Requisito salvo." : "Requisito incluído." };
  });
}

export async function excluirBacklog(id: string): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "PROJETOS");
    const b = await db.$transaction(async (tx) => {
      const b = await tx.backlogItem.delete({ where: { id } });
      await auditar(tx, { entidade: "BacklogItem", entidadeId: id, projetoId: b.projetoId, acao: "EXCLUIR", usuarioId: u.id, resumo: `${b.codigo} ${b.requisito}` });
      return b;
    });
    revalidar(b.projetoId);
  });
}

// ───────────────────────────── Cronograma ─────────────────────────────

const zAtividade = z.object({
  fase: z.enum(["ENVISIONING", "DEVELOPMENT", "DEPLOYMENT", "POST_DEPLOY"], { error: "Fase inválida." }),
  tarefa: z.string({ error: "Descreva a tarefa." }).min(2).max(300),
  backlogItemId: z.uuid().optional(),
  moduloProcesso: z.string().max(120).optional(),
  responsavelId: z.uuid().optional(),
  contatoClienteId: z.uuid().optional(),
  clienteParticipa: z.boolean(),
  inicioPrevisto: zData,
  fimPrevisto: zData,
  percentualConclusao: z.coerce.number().min(0).max(100),
  status: zStatus,
  marco: z.boolean(),
  dataRealConclusao: zData,
  observacao: z.string().max(2000).optional(),
});

/** Atribuições vêm do formulário como listas paralelas: atribRecurso[], atribPrevisto[], atribFalta[]. */
function lerAtribuicoes(dados: FormData) {
  const recursos = dados.getAll("atribRecurso").map(String);
  const previstos = dados.getAll("atribPrevisto").map(String);
  const faltas = dados.getAll("atribFalta").map(String);
  const lista = recursos
    .map((recursoId, i) => ({ recursoId, previsto: previstos[i] ?? "", falta: faltas[i] ?? "" }))
    .filter((x) => x.recursoId);
  if (new Set(lista.map((x) => x.recursoId)).size !== lista.length) throw new ErroNegocio("O mesmo recurso aparece duas vezes na atividade.");
  return lista.map((x) => ({
    recursoId: z.uuid().parse(x.recursoId),
    esforcoPrevisto: zHoras.parse(x.previsto || 0),
    horasParaConcluir: x.falta === "" ? null : zHoras.parse(x.falta),
  }));
}

/** Impede ciclos: a nova predecessora não pode depender (direta ou indiretamente) da própria atividade. */
async function validarPredecessoras(tx: Parameters<Parameters<typeof db.$transaction>[0]>[0], projetoId: string, atividadeId: string | null, ids: string[]) {
  if (ids.length === 0) return;
  const todas = await tx.atividadePredecessora.findMany({ where: { atividade: { projetoId } } });
  const validas = await tx.atividade.count({ where: { id: { in: ids }, projetoId } });
  if (validas !== ids.length) throw new ErroNegocio("Predecessora de outro projeto.");
  if (!atividadeId) return;
  if (ids.includes(atividadeId)) throw new ErroNegocio("A atividade não pode ser predecessora dela mesma.");
  const deps = new Map<string, string[]>();
  for (const p of todas) if (p.atividadeId !== atividadeId) deps.set(p.atividadeId, [...(deps.get(p.atividadeId) ?? []), p.predecessoraId]);
  const pilha = [...ids];
  const visto = new Set<string>();
  while (pilha.length) {
    const x = pilha.pop()!;
    if (x === atividadeId) throw new ErroNegocio("Essa predecessora cria uma dependência circular.");
    if (visto.has(x)) continue;
    visto.add(x);
    pilha.push(...(deps.get(x) ?? []));
  }
}

export async function salvarAtividade(projetoId: string, id: string | null, _: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "PROJETOS");
    const f = lerFormulario(dados);
    const v = zAtividade.parse({ ...f, clienteParticipa: f.clienteParticipa === "on", marco: f.marco === "on" });
    if (v.inicioPrevisto && v.fimPrevisto && v.fimPrevisto < v.inicioPrevisto) throw new ErroNegocio("Fim previsto anterior ao início.");
    const atribuicoes = lerAtribuicoes(dados);
    const predecessoras = dados.getAll("predecessoras").map(String).filter(Boolean);
    const { status, percentual } = coerenciaStatus(v.status, v.percentualConclusao);
    const data = {
      fase: v.fase,
      tarefa: v.tarefa,
      backlogItemId: v.backlogItemId ?? null,
      moduloProcesso: v.moduloProcesso ?? null,
      responsavelId: v.responsavelId ?? null,
      contatoClienteId: v.contatoClienteId ?? null,
      clienteParticipa: v.clienteParticipa,
      inicioPrevisto: v.inicioPrevisto,
      fimPrevisto: v.fimPrevisto,
      percentualConclusao: percentual,
      status,
      marco: v.marco,
      dataRealConclusao: status === "CONCLUIDO" ? (v.dataRealConclusao ?? paraDia(new Date())) : v.dataRealConclusao,
      observacao: v.observacao ?? null,
      atualizadoPorId: u.id,
    };

    await db.$transaction(
      async (tx) => {
        await validarPredecessoras(tx, projetoId, id, predecessoras);
        let atividadeId = id;
        if (id) {
          const antes = await tx.atividade.findUniqueOrThrow({ where: { id } });
          const depois = await tx.atividade.update({ where: { id }, data });
          await auditar(tx, { entidade: "Atividade", entidadeId: id, projetoId, acao: "ALTERAR", usuarioId: u.id, resumo: depois.codigo, antes, depois });
        } else {
          const codigos = (await tx.atividade.findMany({ where: { projetoId }, select: { codigo: true } })).map((x) => x.codigo);
          const nova = await tx.atividade.create({ data: { ...data, projetoId, codigo: proximoCodigo("CRON", codigos), ordem: codigos.length + 1, criadoPorId: u.id } });
          atividadeId = nova.id;
          await auditar(tx, { entidade: "Atividade", entidadeId: nova.id, projetoId, acao: "CRIAR", usuarioId: u.id, resumo: `${nova.codigo} ${nova.tarefa}` });
        }

        // Sincroniza atribuições (não remove quem já apontou horas).
        const atuais = await tx.atividadeAtribuicao.findMany({ where: { atividadeId: atividadeId! }, include: { recurso: true } });
        for (const a of atuais) {
          if (atribuicoes.some((n) => n.recursoId === a.recursoId)) continue;
          const apontou = await tx.apontamento.count({ where: { atividadeId: atividadeId!, recursoId: a.recursoId } });
          if (apontou) throw new ErroNegocio(`${a.recurso.nome} já apontou horas nesta atividade e não pode ser removido.`);
          await tx.atividadeAtribuicao.delete({ where: { id: a.id } });
        }
        for (const n of atribuicoes) {
          await tx.atividadeAtribuicao.upsert({
            where: { atividadeId_recursoId: { atividadeId: atividadeId!, recursoId: n.recursoId } },
            update: { esforcoPrevisto: n.esforcoPrevisto, horasParaConcluir: n.horasParaConcluir },
            create: { atividadeId: atividadeId!, ...n },
          });
          // Quem executa passa a fazer parte da equipe do projeto.
          const membro = await tx.projetoMembro.findFirst({ where: { projetoId, recursoId: n.recursoId } });
          if (!membro) await tx.projetoMembro.create({ data: { projetoId, recursoId: n.recursoId, papel: "FUNCIONAL" } });
        }
        await tx.atividadePredecessora.deleteMany({ where: { atividadeId: atividadeId! } });
        if (predecessoras.length) await tx.atividadePredecessora.createMany({ data: predecessoras.map((p) => ({ atividadeId: atividadeId!, predecessoraId: p })) });

        await recalcularProjeto(tx, projetoId);
      },
      { timeout: 30_000 },
    );
    revalidar(projetoId);
    return { ok: true, mensagem: id ? "Atividade salva. Capacidade recalculada." : "Atividade incluída. Capacidade recalculada." };
  });
}

/** Edição inline na tabela do cronograma: %, status e datas. */
export async function atualizarCampoAtividade(id: string, campo: "percentual" | "status" | "inicio" | "fim", valor: string): Promise<{ ok: boolean; erro?: string }> {
  const r = await executarAcao(async () => {
    const u = await exigir("editar", "PROJETOS");
    await db.$transaction(
      async (tx) => {
        const antes = await tx.atividade.findUniqueOrThrow({ where: { id } });
        let data: Record<string, unknown> = {};
        if (campo === "percentual" || campo === "status") {
          const s = campo === "status" ? zStatus.parse(valor) : antes.status;
          const p = campo === "percentual" ? z.coerce.number().min(0, "0 a 100").max(100, "0 a 100").parse(valor) : antes.percentualConclusao;
          const c = coerenciaStatus(s, p);
          data = { status: c.status, percentualConclusao: c.percentual, ...(c.status === "CONCLUIDO" && !antes.dataRealConclusao && { dataRealConclusao: paraDia(new Date()) }) };
        } else {
          const d = parseDia(valor);
          if (!d) throw new ErroNegocio("Data inválida.");
          const inicio = campo === "inicio" ? d : antes.inicioPrevisto;
          const fim = campo === "fim" ? d : antes.fimPrevisto;
          if (inicio && fim && fim < inicio) throw new ErroNegocio("Fim anterior ao início.");
          data = campo === "inicio" ? { inicioPrevisto: d } : { fimPrevisto: d };
        }
        const depois = await tx.atividade.update({ where: { id }, data: { ...data, atualizadoPorId: u.id } });
        await auditar(tx, { entidade: "Atividade", entidadeId: id, projetoId: antes.projetoId, acao: "ALTERAR", usuarioId: u.id, resumo: depois.codigo, antes, depois });
        await recalcularProjeto(tx, antes.projetoId);
        revalidar(antes.projetoId);
      },
      { timeout: 30_000 },
    );
  });
  return r?.erro ? { ok: false, erro: r.erro } : { ok: true };
}

export async function excluirAtividade(id: string): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "PROJETOS");
    const a = await db.atividade.findUniqueOrThrow({ where: { id } });
    if (await db.apontamento.count({ where: { atividadeId: id } })) throw new ErroNegocio("A atividade tem horas apontadas; cancele-a em vez de excluir.");
    await db.$transaction(async (tx) => {
      await tx.atividade.delete({ where: { id } });
      await auditar(tx, { entidade: "Atividade", entidadeId: id, projetoId: a.projetoId, acao: "EXCLUIR", usuarioId: u.id, resumo: `${a.codigo} ${a.tarefa}` });
      await recalcularProjeto(tx, a.projetoId);
    });
    revalidar(a.projetoId);
  });
}
