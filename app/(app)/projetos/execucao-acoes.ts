"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { exigir } from "@/lib/auth/sessao";
import { ErroNegocio, executarAcao, lerFormulario } from "@/lib/acoes";
import { auditar } from "@/lib/services/auditoria";
import { avaliarComplexidade, PREFIXO_OPERACIONAL } from "@/lib/domain/execucao";
import { MODELO_DEPLOYMENT, MODELO_PRE_PROJETO } from "@/lib/domain/modelos";
import { proximoCodigo } from "@/lib/domain/cronograma";
import { parseDia, paraDia } from "@/lib/domain/datas";
import type { EstadoAcao } from "@/components/formulario";
import type { Prisma } from "@/lib/generated/prisma/client";

type Tx = Prisma.TransactionClient;

const zData = z
  .string()
  .optional()
  .transform((s, ctx) => {
    if (!s) return null;
    const d = parseDia(s);
    if (!d) ctx.addIssue({ code: "custom", message: "Data inválida." });
    return d;
  });
const zTexto = (max = 1000) => z.string().max(max).optional().transform((s) => s ?? null);
const zMarcado = z.string().optional().transform((s) => s === "on" || s === "true");
const zUuid = z.uuid().optional().transform((s) => s ?? null);
const zStatusCheck = z.enum(["PENDENTE", "EM_ANDAMENTO", "CONCLUIDO", "BLOQUEADO", "NA"]);
const zValidacao = z.enum(["PENDENTE", "APROVADO", "REPROVADO", "NA"]);

function revalidar(projetoId: string) {
  revalidatePath(`/projetos/${projetoId}`, "layout");
  revalidatePath("/portfolio");
  revalidatePath("/");
}

// ───────────────────────────── Complexidade ─────────────────────────────

/** Notas vêm como nota_<criterioId> (0–3 ou vazio), gatilho_<criterioId> e obs_<criterioId>. */
export async function salvarComplexidade(projetoId: string, _: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "PROJETOS");
    const f = lerFormulario(dados);
    const cab = z
      .object({ avaliador: zTexto(120), data: zData, horasEstimadas: z.coerce.number().min(0).max(100000).optional() })
      .parse({ avaliador: f.avaliador, data: f.data, horasEstimadas: f.horasEstimadas });
    const criterios = await db.criterioComplexidade.findMany({ where: { ativo: true }, orderBy: { ordem: "asc" } });
    const notas = criterios.map((c) => {
      const bruto = f[`nota_${c.id}`];
      const nota = bruto === undefined ? null : Number(bruto);
      if (nota !== null && (!Number.isInteger(nota) || nota < 0 || nota > 3)) throw new ErroNegocio(`Nota inválida em ${c.nome}.`);
      return { criterioId: c.id, nota, gatilhoCritico: f[`gatilho_${c.id}`] === "on", observacao: f[`obs_${c.id}`]?.slice(0, 500) ?? null };
    });
    const r = avaliarComplexidade(notas);
    await db.$transaction(async (tx) => {
      for (const n of notas) {
        await tx.projetoComplexidade.upsert({
          where: { projetoId_criterioId: { projetoId, criterioId: n.criterioId } },
          create: { projetoId, ...n },
          update: { nota: n.nota, gatilhoCritico: n.gatilhoCritico, observacao: n.observacao },
        });
      }
      const antes = await tx.avaliacaoComplexidade.findUnique({ where: { projetoId } });
      const dadosAval = { ...cab, horasEstimadas: cab.horasEstimadas ?? null, score: r.score, gatilhos: r.gatilhos, nivelFinal: r.final, atualizadoPorId: u.id };
      const depois = await tx.avaliacaoComplexidade.upsert({ where: { projetoId }, create: { projetoId, ...dadosAval }, update: dadosAval });
      await auditar(tx, {
        entidade: "AvaliacaoComplexidade",
        entidadeId: projetoId,
        projetoId,
        acao: antes ? "ALTERAR" : "CRIAR",
        usuarioId: u.id,
        resumo: r.final ? `Complexidade ${r.final} (score ${r.score}, ${r.gatilhos} gatilho(s))` : "Complexidade não avaliada",
        antes,
        depois,
      });
    });
    revalidar(projetoId);
    return { ok: true, mensagem: r.final ? `Avaliação salva: ${r.final} · ${r.governanca}.` : "Salvo (sem notas, projeto não avaliado)." };
  });
}

// ───────────────────────────── Pré-projeto ─────────────────────────────

export async function salvarStatusPreProjeto(projetoId: string, _: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "PROJETOS");
    const v = z.object({ status: z.enum(["EM_PREPARACAO", "PRONTO", "PRONTO_COM_RESSALVAS", "BLOQUEADO"]), observacao: zTexto() }).parse(lerFormulario(dados));
    await db.$transaction(async (tx) => {
      const antes = await tx.preProjeto.findUnique({ where: { projetoId } });
      const depois = await tx.preProjeto.upsert({ where: { projetoId }, create: { projetoId, ...v }, update: v });
      await auditar(tx, { entidade: "PreProjeto", entidadeId: projetoId, projetoId, acao: antes ? "ALTERAR" : "CRIAR", usuarioId: u.id, resumo: `Pré-projeto: ${v.status}`, antes, depois });
    });
    revalidar(projetoId);
  });
}

const zItemPre = z.object({
  categoria: z.string({ error: "Informe a categoria." }).min(1).max(80),
  item: z.string({ error: "Descreva o item." }).min(2).max(300),
  responsavel: zTexto(120),
  informacaoContato: zTexto(),
  validacaoEsperada: zTexto(120),
  status: zStatusCheck,
  prazo: zData,
  observacao: zTexto(),
});

export async function salvarItemPreProjeto(projetoId: string, id: string | null, _: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "PROJETOS");
    const v = zItemPre.parse(lerFormulario(dados));
    await db.$transaction(async (tx) => {
      if (id) {
        const antes = await tx.preProjetoItem.findUniqueOrThrow({ where: { id } });
        const depois = await tx.preProjetoItem.update({ where: { id }, data: v });
        await auditar(tx, { entidade: "PreProjetoItem", entidadeId: id, projetoId, acao: "ALTERAR", usuarioId: u.id, resumo: v.item, antes, depois });
      } else {
        const ordem = await tx.preProjetoItem.count({ where: { projetoId } });
        const novo = await tx.preProjetoItem.create({ data: { ...v, projetoId, ordem: ordem + 1 } });
        await auditar(tx, { entidade: "PreProjetoItem", entidadeId: novo.id, projetoId, acao: "CRIAR", usuarioId: u.id, resumo: v.item });
      }
    });
    revalidar(projetoId);
    return { ok: true, mensagem: id ? "Item salvo." : "Item incluído." };
  });
}

export async function excluirItemPreProjeto(id: string): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "PROJETOS");
    const i = await db.$transaction(async (tx) => {
      const i = await tx.preProjetoItem.delete({ where: { id } });
      await auditar(tx, { entidade: "PreProjetoItem", entidadeId: id, projetoId: i.projetoId, acao: "EXCLUIR", usuarioId: u.id, resumo: i.item });
      return i;
    });
    revalidar(i.projetoId);
  });
}

/** Inclui os itens do checklist-modelo que ainda não existem no projeto. */
export async function aplicarModeloPreProjeto(projetoId: string): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "PROJETOS");
    const n = await db.$transaction(async (tx) => {
      const existentes = new Set((await tx.preProjetoItem.findMany({ where: { projetoId }, select: { item: true } })).map((i) => i.item));
      const novos = MODELO_PRE_PROJETO.filter((m) => !existentes.has(m.item));
      await tx.preProjetoItem.createMany({ data: novos.map((m, i) => ({ ...m, projetoId, ordem: existentes.size + i + 1 })) });
      if (novos.length) await auditar(tx, { entidade: "PreProjetoItem", entidadeId: projetoId, projetoId, acao: "CRIAR", usuarioId: u.id, resumo: `Checklist-modelo aplicado (${novos.length} itens)` });
      return novos.length;
    });
    revalidar(projetoId);
    return { ok: true, mensagem: n ? `${n} item(ns) incluído(s).` : "O checklist já tem todos os itens do modelo." };
  });
}

// ───────────────────────────── Registro operacional (RAID) ─────────────────────────────

const zTipoOp = z.enum(["PENDENCIA", "DECISAO", "DEPENDENCIA", "PROBLEMA", "RISCO", "CHANGE_REQUEST", "DEFEITO"]);
const zNivel = z.enum(["NAO", "BAIXO", "MEDIO", "ALTO"]);
const zEscala = z.coerce.number().int().min(1, "Use 1 a 5.").max(5, "Use 1 a 5.").optional().transform((n) => n ?? null);

const zItemOp = z.object({
  tipo: zTipoOp,
  descricao: z.string({ error: "Descreva o item." }).min(2).max(1000),
  origemCausa: zTexto(),
  impactoConsequencia: zTexto(),
  responsavelId: zUuid,
  responsavelTexto: zTexto(120),
  dataAbertura: zData,
  prazo: zData,
  status: z.enum(["ABERTO", "EM_ANDAMENTO", "AGUARDANDO", "BLOQUEADO", "APROVADO", "REPROVADO", "FECHADO", "CANCELADO"]),
  impactoEscopo: zNivel,
  impactoPrazo: zNivel,
  impactoHoras: zNivel,
  acaoResposta: zTexto(),
  decisaoAprovador: zTexto(300),
  evidencia: zTexto(),
  probabilidade: zEscala,
  impacto: zEscala,
  horasCr: z.coerce.number().min(-10000).max(10000).optional().transform((n) => n ?? null),
  diasCr: z.coerce.number().int().min(-1000).max(1000).optional().transform((n) => n ?? null),
  atividadeId: zUuid,
  backlogItemId: zUuid,
});

const FECHADOS = ["APROVADO", "REPROVADO", "FECHADO", "CANCELADO"];

async function codigoOperacional(tx: Tx, projetoId: string, tipo: z.infer<typeof zTipoOp>) {
  const prefixo = PREFIXO_OPERACIONAL[tipo];
  const codigos = (await tx.itemOperacional.findMany({ where: { projetoId, codigo: { startsWith: `${prefixo}-` } }, select: { codigo: true } })).map((c) => c.codigo);
  return proximoCodigo(prefixo, codigos);
}

export async function salvarItemOperacional(projetoId: string, id: string | null, _: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "PROJETOS");
    const { dataAbertura, ...v } = zItemOp.parse(lerFormulario(dados));
    if (v.prazo && dataAbertura && v.prazo < dataAbertura) throw new ErroNegocio("Prazo anterior à abertura.");
    if (v.tipo === "RISCO" && (!v.probabilidade || !v.impacto)) throw new ErroNegocio("Risco precisa de probabilidade e impacto (1 a 5).");
    const codigo = await db.$transaction(async (tx) => {
      if (id) {
        const antes = await tx.itemOperacional.findUniqueOrThrow({ where: { id } });
        const fechou = FECHADOS.includes(v.status) && !FECHADOS.includes(antes.status);
        const reabriu = !FECHADOS.includes(v.status);
        const depois = await tx.itemOperacional.update({
          where: { id },
          data: {
            ...v,
            ...(dataAbertura ? { dataAbertura } : {}),
            dataFechamento: fechou ? paraDia(new Date()) : reabriu ? null : antes.dataFechamento,
            atualizadoPorId: u.id,
          },
        });
        await auditar(tx, { entidade: "ItemOperacional", entidadeId: id, projetoId, acao: "ALTERAR", usuarioId: u.id, resumo: `${depois.codigo} ${depois.descricao.slice(0, 80)}`, antes, depois });
        return depois.codigo;
      }
      const codigo = await codigoOperacional(tx, projetoId, v.tipo);
      const novo = await tx.itemOperacional.create({
        data: { ...v, projetoId, codigo, dataAbertura: dataAbertura ?? paraDia(new Date()), dataFechamento: FECHADOS.includes(v.status) ? paraDia(new Date()) : null, criadoPorId: u.id, atualizadoPorId: u.id },
      });
      await auditar(tx, { entidade: "ItemOperacional", entidadeId: novo.id, projetoId, acao: "CRIAR", usuarioId: u.id, resumo: `${codigo} ${v.descricao.slice(0, 80)}` });
      return codigo;
    });
    revalidar(projetoId);
    return { ok: true, mensagem: id ? `${codigo} salvo.` : `${codigo} registrado.` };
  });
}

export async function excluirItemOperacional(id: string): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "PROJETOS");
    const i = await db.$transaction(async (tx) => {
      const i = await tx.itemOperacional.delete({ where: { id } });
      await auditar(tx, { entidade: "ItemOperacional", entidadeId: id, projetoId: i.projetoId, acao: "EXCLUIR", usuarioId: u.id, resumo: `${i.codigo} ${i.descricao.slice(0, 80)}` });
      return i;
    });
    revalidar(i.projetoId);
  });
}

// ───────────────────────────── Testes e UAT ─────────────────────────────

const zCaso = z.object({
  cenario: z.string({ error: "Descreva o cenário." }).min(2).max(2000),
  moduloProcesso: zTexto(120),
  preCondicao: zTexto(),
  passos: zTexto(4000),
  resultadoEsperado: zTexto(),
  backlogItemId: zUuid,
  responsavelId: zUuid,
  responsavelTexto: zTexto(120),
});

export async function salvarCaso(projetoId: string, tipo: "INTERNO" | "UAT", id: string | null, _: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "PROJETOS");
    const v = zCaso.parse(lerFormulario(dados));
    const codigo = await db.$transaction(async (tx) => {
      if (id) {
        const antes = await tx.casoTeste.findUniqueOrThrow({ where: { id } });
        const depois = await tx.casoTeste.update({ where: { id }, data: v });
        await auditar(tx, { entidade: "CasoTeste", entidadeId: id, projetoId, acao: "ALTERAR", usuarioId: u.id, resumo: depois.codigo, antes, depois });
        return depois.codigo;
      }
      const prefixo = tipo === "UAT" ? "UAT" : "TI";
      const codigos = (await tx.casoTeste.findMany({ where: { projetoId, tipo }, select: { codigo: true } })).map((c) => c.codigo);
      const codigo = proximoCodigo(prefixo, codigos);
      const novo = await tx.casoTeste.create({ data: { ...v, projetoId, tipo, codigo, ordem: codigos.length + 1 } });
      await auditar(tx, { entidade: "CasoTeste", entidadeId: novo.id, projetoId, acao: "CRIAR", usuarioId: u.id, resumo: `${codigo} ${v.cenario.slice(0, 80)}` });
      return codigo;
    });
    revalidar(projetoId);
    return { ok: true, mensagem: id ? `${codigo} salvo.` : `${codigo} incluído.` };
  });
}

export async function excluirCaso(id: string): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "PROJETOS");
    const c = await db.$transaction(async (tx) => {
      const c = await tx.casoTeste.delete({ where: { id } });
      await auditar(tx, { entidade: "CasoTeste", entidadeId: id, projetoId: c.projetoId, acao: "EXCLUIR", usuarioId: u.id, resumo: `${c.codigo} ${c.cenario.slice(0, 80)}` });
      return c;
    });
    revalidar(c.projetoId);
  });
}

const zExecucao = z.object({
  data: zData,
  executor: zTexto(120),
  resultadoObtido: zTexto(2000),
  resultado: z.enum(["PLANEJADO", "NAO_EXECUTADO", "APROVADO", "REPROVADO", "BLOQUEADO", "NA"]),
  validacao: zValidacao,
  evidencia: zTexto(),
  observacao: zTexto(),
  abrirDefeito: zMarcado,
  gravidade: zNivel.optional(),
});

/**
 * Registra um novo ciclo de execução do caso (o anterior fica no histórico).
 * Reprovado com "abrir defeito": cria um item DEFEITO no registro operacional, ligado à execução.
 */
export async function registrarExecucao(casoId: string, _: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "PROJETOS");
    const { abrirDefeito, gravidade, ...v } = zExecucao.parse(lerFormulario(dados));
    const caso = await db.casoTeste.findUniqueOrThrow({ where: { id: casoId }, include: { execucoes: { select: { ciclo: true } } } });
    const ciclo = Math.max(0, ...caso.execucoes.map((e) => e.ciclo)) + 1;
    const defeito = await db.$transaction(async (tx) => {
      const ex = await tx.execucaoTeste.create({ data: { ...v, casoId, ciclo, data: v.data ?? paraDia(new Date()), criadoPorId: u.id } });
      await auditar(tx, { entidade: "ExecucaoTeste", entidadeId: ex.id, projetoId: caso.projetoId, acao: "CRIAR", usuarioId: u.id, resumo: `${caso.codigo} ciclo ${ciclo}: ${v.resultado}` });
      if (!abrirDefeito || (v.resultado !== "REPROVADO" && v.resultado !== "BLOQUEADO")) return null;
      const codigo = await codigoOperacional(tx, caso.projetoId, "DEFEITO");
      const nivel = gravidade ?? "MEDIO";
      const d = await tx.itemOperacional.create({
        data: {
          projetoId: caso.projetoId,
          codigo,
          tipo: "DEFEITO",
          descricao: `${caso.codigo}: ${v.resultadoObtido ?? caso.cenario}`.slice(0, 1000),
          origemCausa: `${caso.tipo === "UAT" ? "UAT" : "Teste interno"} ${caso.codigo}, ciclo ${ciclo}`,
          responsavelId: caso.responsavelId,
          responsavelTexto: caso.responsavelId ? null : caso.responsavelTexto,
          dataAbertura: ex.data ?? paraDia(new Date()),
          impactoEscopo: nivel,
          backlogItemId: caso.backlogItemId,
          execucaoTesteId: ex.id,
          evidencia: v.evidencia,
          criadoPorId: u.id,
          atualizadoPorId: u.id,
        },
      });
      await auditar(tx, { entidade: "ItemOperacional", entidadeId: d.id, projetoId: caso.projetoId, acao: "CRIAR", usuarioId: u.id, resumo: `${codigo} aberto pelo teste ${caso.codigo}` });
      return codigo;
    });
    revalidar(caso.projetoId);
    return { ok: true, mensagem: defeito ? `Ciclo ${ciclo} registrado; defeito ${defeito} aberto no Operacional.` : `Ciclo ${ciclo} registrado.` };
  });
}

export async function excluirExecucao(id: string): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "PROJETOS");
    const e = await db.$transaction(async (tx) => {
      const e = await tx.execucaoTeste.delete({ where: { id }, include: { caso: true } });
      await auditar(tx, { entidade: "ExecucaoTeste", entidadeId: id, projetoId: e.caso.projetoId, acao: "EXCLUIR", usuarioId: u.id, resumo: `${e.caso.codigo} ciclo ${e.ciclo}` });
      return e;
    });
    revalidar(e.caso.projetoId);
  });
}

// ───────────────────────────── Deployment ─────────────────────────────

const zDeployment = z.object({
  nome: z.string({ error: "Dê um nome (ex.: Go Live, Onda 1)." }).min(2).max(120),
  janelaInicio: zData,
  janelaFim: zData,
  decisao: z.enum(["PENDENTE", "GO", "NO_GO", "GO_COM_RESSALVAS"]),
  dataDecisao: zData,
  aprovadores: zTexto(300),
  justificativa: zTexto(2000),
  dataGoLiveReal: zData,
  hypercareInicio: zData,
  hypercareFim: zData,
  atualizarProjeto: zMarcado,
});

export async function salvarDeployment(projetoId: string, id: string | null, _: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "PROJETOS");
    const { atualizarProjeto, ...v } = zDeployment.parse(lerFormulario(dados));
    if (v.janelaInicio && v.janelaFim && v.janelaFim < v.janelaInicio) throw new ErroNegocio("Fim da janela anterior ao início.");
    if (v.hypercareInicio && v.hypercareFim && v.hypercareFim < v.hypercareInicio) throw new ErroNegocio("Fim do hypercare anterior ao início.");
    if (v.decisao !== "PENDENTE" && !v.aprovadores) throw new ErroNegocio("Informe quem aprovou a decisão de Go/No-Go.");
    if (v.decisao === "NO_GO" && v.dataGoLiveReal) throw new ErroNegocio("Decisão No-Go com data de Go Live real: revise.");
    await db.$transaction(async (tx) => {
      if (id) {
        const antes = await tx.deployment.findUniqueOrThrow({ where: { id } });
        const depois = await tx.deployment.update({ where: { id }, data: v });
        await auditar(tx, { entidade: "Deployment", entidadeId: id, projetoId, acao: "ALTERAR", usuarioId: u.id, resumo: v.nome, antes, depois });
      } else {
        const d = await tx.deployment.create({ data: { ...v, projetoId, itens: { create: MODELO_DEPLOYMENT.map((m, i) => ({ ...m, ordem: i + 1 })) } } });
        await auditar(tx, { entidade: "Deployment", entidadeId: d.id, projetoId, acao: "CRIAR", usuarioId: u.id, resumo: `${v.nome} (checklist-modelo com ${MODELO_DEPLOYMENT.length} itens)` });
      }
      // Go Live real informado e marcado para refletir no projeto: atualiza o cabeçalho do projeto.
      if (atualizarProjeto && v.dataGoLiveReal) {
        const antes = await tx.projeto.findUniqueOrThrow({ where: { id: projetoId } });
        if (antes.dataGoLiveReal?.getTime() !== v.dataGoLiveReal.getTime()) {
          const depois = await tx.projeto.update({ where: { id: projetoId }, data: { dataGoLiveReal: v.dataGoLiveReal, atualizadoPorId: u.id } });
          await auditar(tx, { entidade: "Projeto", entidadeId: projetoId, projetoId, acao: "ALTERAR", usuarioId: u.id, resumo: "Go Live real (pelo Deployment)", antes, depois });
        }
      }
    });
    revalidar(projetoId);
    return { ok: true, mensagem: id ? "Deployment salvo." : "Deployment criado com o checklist-modelo." };
  });
}

export async function excluirDeployment(id: string): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "PROJETOS");
    const d = await db.$transaction(async (tx) => {
      const d = await tx.deployment.delete({ where: { id } });
      await auditar(tx, { entidade: "Deployment", entidadeId: id, projetoId: d.projetoId, acao: "EXCLUIR", usuarioId: u.id, resumo: d.nome });
      return d;
    });
    revalidar(d.projetoId);
  });
}

const zItemDep = z.object({
  categoria: z.string({ error: "Informe a categoria." }).min(1).max(80),
  item: z.string({ error: "Descreva o item." }).min(2).max(300),
  obrigatorio: z.enum(["SIM", "NAO", "CONDICIONAL"]),
  status: zStatusCheck,
  responsavelId: zUuid,
  responsavelTexto: zTexto(120),
  dataPrevista: zData,
  dataReal: zData,
  evidencia: zTexto(),
  riscoObservacao: zTexto(),
  aprovacao: zValidacao,
});

export async function salvarItemDeployment(deploymentId: string, id: string | null, _: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "PROJETOS");
    const v = zItemDep.parse(lerFormulario(dados));
    const dep = await db.deployment.findUniqueOrThrow({ where: { id: deploymentId }, select: { projetoId: true } });
    const data = { ...v, dataReal: v.status === "CONCLUIDO" ? (v.dataReal ?? paraDia(new Date())) : v.dataReal };
    await db.$transaction(async (tx) => {
      if (id) {
        const antes = await tx.deploymentItem.findUniqueOrThrow({ where: { id } });
        const depois = await tx.deploymentItem.update({ where: { id }, data });
        await auditar(tx, { entidade: "DeploymentItem", entidadeId: id, projetoId: dep.projetoId, acao: "ALTERAR", usuarioId: u.id, resumo: v.item, antes, depois });
      } else {
        const ordem = await tx.deploymentItem.count({ where: { deploymentId } });
        const novo = await tx.deploymentItem.create({ data: { ...data, deploymentId, ordem: ordem + 1 } });
        await auditar(tx, { entidade: "DeploymentItem", entidadeId: novo.id, projetoId: dep.projetoId, acao: "CRIAR", usuarioId: u.id, resumo: v.item });
      }
    });
    revalidar(dep.projetoId);
    return { ok: true, mensagem: id ? "Item salvo." : "Item incluído." };
  });
}

export async function excluirItemDeployment(id: string): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "PROJETOS");
    const i = await db.$transaction(async (tx) => {
      const i = await tx.deploymentItem.delete({ where: { id }, include: { deployment: { select: { projetoId: true } } } });
      await auditar(tx, { entidade: "DeploymentItem", entidadeId: id, projetoId: i.deployment.projetoId, acao: "EXCLUIR", usuarioId: u.id, resumo: i.item });
      return i;
    });
    revalidar(i.deployment.projetoId);
  });
}
