"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { exigirProjeto, exigirRegistro } from "@/lib/auth/escopo";
import { ErroNegocio, executarAcao, lerFormulario } from "@/lib/acoes";
import { auditar } from "@/lib/services/auditoria";
import { fotografarIndicadores } from "@/lib/services/status-report";
import { sugerirStatusExecutivo } from "@/lib/domain/status";
import { paraDia, parseDia, somarDias } from "@/lib/domain/datas";
import { salvarArquivo } from "@/lib/storage";
import type { EstadoAcao } from "@/components/formulario";
import type { Prisma } from "@/lib/generated/prisma/client";

const zData = z
  .string()
  .optional()
  .transform((s, ctx) => {
    if (!s) return null;
    const d = parseDia(s);
    if (!d) ctx.addIssue({ code: "custom", message: "Data inválida." });
    return d;
  });
const zTexto = (max = 4000) => z.string().max(max).optional().transform((s) => s ?? null);

function revalidar(projetoId: string) {
  revalidatePath(`/projetos/${projetoId}`, "layout");
  revalidatePath("/portfolio");
  revalidatePath("/");
}

// ───────────────────────────── Status report ─────────────────────────────

/** Cria um rascunho com os indicadores de hoje; as próximas entregas do último report viram ponto de partida. */
export async function novoStatusReport(projetoId: string): Promise<EstadoAcao> {
  let id = "";
  const r = await executarAcao(async () => {
    const u = await exigirProjeto(projetoId);
    const rascunho = await db.statusReport.findFirst({ where: { projetoId, publicado: false } });
    if (rascunho) throw new ErroNegocio("Já existe um rascunho: publique ou exclua antes de criar outro.");
    const indicadores = await fotografarIndicadores(projetoId);
    const anterior = await db.statusReport.findFirst({ where: { projetoId, publicado: true }, orderBy: { dataReferencia: "desc" } });
    const hoje = paraDia(new Date());
    const novo = await db.$transaction(async (tx) => {
      const novo = await tx.statusReport.create({
        data: {
          projetoId,
          dataReferencia: hoje,
          periodoInicio: anterior ? somarDias(anterior.dataReferencia, 1) : somarDias(hoje, -6),
          periodoFim: hoje,
          statusExecutivo: sugerirStatusExecutivo(indicadores),
          faseAtual: indicadores.faseAtual,
          entregasConcluidas: anterior?.proximasEntregas ?? null,
          indicadores: indicadores as Prisma.InputJsonValue,
          criadoPorId: u.id,
        },
      });
      await auditar(tx, { entidade: "StatusReport", entidadeId: novo.id, projetoId, acao: "CRIAR", usuarioId: u.id, resumo: "Rascunho de status report" });
      return novo;
    });
    id = novo.id;
    revalidar(projetoId);
  });
  if (r?.erro) return r;
  redirect(`/projetos/${projetoId}/status?r=${id}`);
}

const zReport = z.object({
  dataReferencia: zData,
  periodoInicio: zData,
  periodoFim: zData,
  statusExecutivo: z.enum(["VERDE", "AMARELO", "VERMELHO"]),
  faseAtual: zTexto(80),
  resumo: zTexto(),
  entregasConcluidas: zTexto(),
  proximasEntregas: zTexto(),
  pontosAtencao: zTexto(),
  decisoesNecessarias: zTexto(),
});

async function rascunho(id: string) {
  const sr = await db.statusReport.findUniqueOrThrow({ where: { id } });
  if (sr.publicado) throw new ErroNegocio("Status report publicado não pode ser alterado.");
  return sr;
}

export async function salvarStatusReport(id: string, _: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigirRegistro("statusReport", id);
    const v = zReport.parse(lerFormulario(dados));
    if (v.periodoInicio && v.periodoFim && v.periodoFim < v.periodoInicio) throw new ErroNegocio("Fim do período anterior ao início.");
    const antes = await rascunho(id);
    await db.$transaction(async (tx) => {
      const depois = await tx.statusReport.update({ where: { id }, data: { ...v, dataReferencia: v.dataReferencia ?? antes.dataReferencia } });
      await auditar(tx, { entidade: "StatusReport", entidadeId: id, projetoId: antes.projetoId, acao: "ALTERAR", usuarioId: u.id, resumo: "Rascunho de status report", antes, depois });
    });
    revalidar(antes.projetoId);
    return { ok: true, mensagem: "Rascunho salvo." };
  });
}

export async function atualizarIndicadores(id: string): Promise<EstadoAcao> {
  return executarAcao(async () => {
    await exigirRegistro("statusReport", id);
    const sr = await rascunho(id);
    await db.statusReport.update({ where: { id }, data: { indicadores: (await fotografarIndicadores(sr.projetoId)) as Prisma.InputJsonValue } });
    revalidar(sr.projetoId);
    return { ok: true, mensagem: "Indicadores atualizados." };
  });
}

/** Publica: congela o report e leva o status executivo para o cabeçalho do projeto. */
export async function publicarStatusReport(id: string): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigirRegistro("statusReport", id);
    const sr = await rascunho(id);
    if (!sr.resumo) throw new ErroNegocio("Escreva o resumo executivo antes de publicar.");
    await db.$transaction(async (tx) => {
      await tx.statusReport.update({ where: { id }, data: { publicado: true, publicadoEm: new Date(), publicadoPorId: u.id } });
      await auditar(tx, { entidade: "StatusReport", entidadeId: id, projetoId: sr.projetoId, acao: "ALTERAR", usuarioId: u.id, resumo: `Status report publicado (${sr.statusExecutivo})` });
      const antes = await tx.projeto.findUniqueOrThrow({ where: { id: sr.projetoId } });
      if (antes.statusExecutivo !== sr.statusExecutivo) {
        const depois = await tx.projeto.update({ where: { id: sr.projetoId }, data: { statusExecutivo: sr.statusExecutivo, atualizadoPorId: u.id } });
        await auditar(tx, { entidade: "Projeto", entidadeId: sr.projetoId, projetoId: sr.projetoId, acao: "ALTERAR", usuarioId: u.id, resumo: "Status executivo (pelo status report)", antes, depois });
      }
    });
    revalidar(sr.projetoId);
    return { ok: true, mensagem: "Publicado." };
  });
}

export async function excluirStatusReport(id: string): Promise<EstadoAcao> {
  const r = await executarAcao(async () => {
    const u = await exigirRegistro("statusReport", id);
    const sr = await rascunho(id);
    await db.$transaction(async (tx) => {
      await tx.statusReport.delete({ where: { id } });
      await auditar(tx, { entidade: "StatusReport", entidadeId: id, projetoId: sr.projetoId, acao: "EXCLUIR", usuarioId: u.id, resumo: "Rascunho de status report" });
    });
    revalidar(sr.projetoId);
    id = sr.projetoId;
  });
  if (r?.erro) return r;
  redirect(`/projetos/${id}/status`);
}

// ───────────────────────────── Documentos ─────────────────────────────

const LIMITE_ARQUIVO = 10 * 1024 * 1024;

const zDocumento = z.object({
  titulo: z.string({ error: "Dê um título." }).min(2).max(200),
  categoria: z.string().min(1).max(60),
  url: z.url({ error: "Link inválido (comece com https://)." }).max(1000).optional(),
  observacao: zTexto(500),
});

export async function salvarDocumento(projetoId: string, _: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigirProjeto(projetoId);
    const v = zDocumento.parse(lerFormulario(dados));
    const arquivo = dados.get("arquivo");
    const temArquivo = arquivo instanceof File && arquivo.size > 0;
    if (!temArquivo && !v.url) throw new ErroNegocio("Informe um link (SharePoint, Teams…) ou escolha um arquivo.");
    if (temArquivo && v.url) throw new ErroNegocio("Use link ou arquivo, não os dois.");
    if (temArquivo && arquivo.size > LIMITE_ARQUIVO) throw new ErroNegocio("Arquivo acima de 10 MB: guarde no SharePoint e registre o link.");
    const extra = temArquivo
      ? {
          tipo: "ARQUIVO" as const,
          arquivoNome: arquivo.name.slice(0, 200),
          arquivoChave: await salvarArquivo(`documentos/${projetoId}`, arquivo.name, Buffer.from(await arquivo.arrayBuffer())),
          tamanho: arquivo.size,
          mimeType: arquivo.type || "application/octet-stream",
        }
      : { tipo: "LINK" as const, url: v.url! };
    await db.$transaction(async (tx) => {
      const d = await tx.documento.create({ data: { projetoId, titulo: v.titulo, categoria: v.categoria, observacao: v.observacao, ...extra, criadoPorId: u.id } });
      await auditar(tx, { entidade: "Documento", entidadeId: d.id, projetoId, acao: "CRIAR", usuarioId: u.id, resumo: `${v.categoria}: ${v.titulo}` });
    });
    revalidar(projetoId);
    return { ok: true, mensagem: "Documento registrado." };
  });
}

/** Exclui o registro; o arquivo físico fica no armazenamento (recuperável pelo backup). */
export async function excluirDocumento(id: string): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigirRegistro("documento", id);
    const d = await db.$transaction(async (tx) => {
      const d = await tx.documento.delete({ where: { id } });
      await auditar(tx, { entidade: "Documento", entidadeId: id, projetoId: d.projetoId, acao: "EXCLUIR", usuarioId: u.id, resumo: `${d.categoria}: ${d.titulo}`, antes: d });
      return d;
    });
    revalidar(d.projetoId);
  });
}
