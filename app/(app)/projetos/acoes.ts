"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { exigir } from "@/lib/auth/sessao";
import { ErroNegocio, executarAcao, lerFormulario } from "@/lib/acoes";
import { auditar } from "@/lib/services/auditoria";
import { proximoCodigoProjeto } from "@/lib/services/projeto";
import { parseDia } from "@/lib/domain/datas";
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

const zProjeto = z
  .object({
    nome: z.string({ error: "Informe o nome do projeto." }).min(2, "Nome muito curto.").max(160),
    clienteId: z.uuid("Escolha o cliente."),
    tipo: z.enum(["PROJETO", "SUPORTE", "SUSTENTACAO", "ALOCACAO", "INTERNO"]),
    status: z.enum(["PROJETO_IDENTIFICADO", "APROVACAO_CLIENTE", "NAO_APROVADO", "EM_ANDAMENTO", "BLOQUEADO", "CONCLUIDO", "CANCELADO"]),
    prioridade: z.enum(["BAIXA", "MEDIA", "ALTA", "CRITICA"]),
    gpId: z.uuid().optional(),
    dataKickoff: zData,
    dataGoLiveAlvo: zData,
    dataGoLiveReal: zData,
    dataEncerramentoPrevista: zData,
    dataEncerramentoReal: zData,
    horasVendidas: z.coerce.number().min(0, "Horas inválidas.").max(100000).optional(),
    statusExecutivo: z.enum(["VERDE", "AMARELO", "VERMELHO"]).optional(),
    notas: z.string().max(2000).optional(),
  })
  .refine((v) => !v.dataKickoff || !v.dataEncerramentoPrevista || v.dataEncerramentoPrevista >= v.dataKickoff, { message: "Encerramento previsto anterior ao kick-off." })
  .refine((v) => !v.dataKickoff || !v.dataGoLiveAlvo || v.dataGoLiveAlvo >= v.dataKickoff, { message: "Go Live anterior ao kick-off." });

function normalizar(v: z.infer<typeof zProjeto>) {
  return { ...v, gpId: v.gpId ?? null, horasVendidas: v.horasVendidas ?? null, statusExecutivo: v.statusExecutivo ?? null, notas: v.notas ?? null };
}

export async function criarProjeto(_: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  let id = "";
  const r = await executarAcao(async () => {
    const u = await exigir("editar", "PORTFOLIO");
    const v = normalizar(zProjeto.parse(lerFormulario(dados)));
    const p = await db.$transaction(async (tx) => {
      const p = await tx.projeto.create({
        data: {
          ...v,
          codigo: await proximoCodigoProjeto(tx),
          criadoPorId: u.id,
          atualizadoPorId: u.id,
          membros: v.gpId ? { create: { recursoId: v.gpId, papel: "GP" } } : undefined,
        },
      });
      await auditar(tx, { entidade: "Projeto", entidadeId: p.id, projetoId: p.id, acao: "CRIAR", usuarioId: u.id, resumo: `${p.codigo} ${p.nome}`, depois: p });
      return p;
    });
    id = p.id;
  });
  if (r?.erro) return r;
  redirect(`/projetos/${id}`);
}

export async function atualizarProjeto(id: string, _: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "PROJETOS");
    const v = normalizar(zProjeto.parse(lerFormulario(dados)));
    await db.$transaction(async (tx) => {
      const antes = await tx.projeto.findUniqueOrThrow({ where: { id } });
      const depois = await tx.projeto.update({ where: { id }, data: { ...v, atualizadoPorId: u.id } });
      // O GP também aparece na equipe do projeto.
      if (v.gpId && v.gpId !== antes.gpId) {
        await tx.projetoMembro.upsert({
          where: { projetoId_recursoId_papel: { projetoId: id, recursoId: v.gpId, papel: "GP" } },
          update: {},
          create: { projetoId: id, recursoId: v.gpId, papel: "GP" },
        });
        if (antes.gpId) await tx.projetoMembro.deleteMany({ where: { projetoId: id, recursoId: antes.gpId, papel: "GP" } });
      }
      await auditar(tx, { entidade: "Projeto", entidadeId: id, projetoId: id, acao: "ALTERAR", usuarioId: u.id, resumo: depois.nome, antes, depois });
    });
    revalidatePath(`/projetos/${id}`, "layout");
  });
}

export async function adicionarMembro(projetoId: string, _: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "PROJETOS");
    const v = z
      .object({ recursoId: z.uuid("Escolha o recurso."), papel: z.enum(["GP", "FUNCIONAL", "TECNICO", "DEV", "ANALISTA", "APOIO"]) })
      .parse(lerFormulario(dados));
    if (v.papel === "GP") throw new ErroNegocio("Para trocar o GP, edite os dados do projeto.");
    await db.$transaction(async (tx) => {
      const m = await tx.projetoMembro.create({ data: { projetoId, ...v }, include: { recurso: true } });
      await auditar(tx, { entidade: "ProjetoMembro", entidadeId: m.id, projetoId, acao: "CRIAR", usuarioId: u.id, resumo: `${m.recurso.nome} (${v.papel})` });
    });
    revalidatePath(`/projetos/${projetoId}`, "layout");
    return { ok: true, mensagem: "Membro adicionado." };
  });
}

export async function removerMembro(id: string): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "PROJETOS");
    const m = await db.$transaction(async (tx) => {
      const m = await tx.projetoMembro.delete({ where: { id }, include: { recurso: true } });
      await auditar(tx, { entidade: "ProjetoMembro", entidadeId: id, projetoId: m.projetoId, acao: "EXCLUIR", usuarioId: u.id, resumo: `${m.recurso.nome} (${m.papel})` });
      return m;
    });
    revalidatePath(`/projetos/${m.projetoId}`, "layout");
  });
}
