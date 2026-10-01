"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { exigir } from "@/lib/auth/sessao";
import { ErroNegocio, executarAcao, lerFormulario, zTextoOpcional } from "@/lib/acoes";
import { auditar } from "@/lib/services/auditoria";
import { parseDia, somarDias } from "@/lib/domain/datas";
import { validarVigencias } from "@/lib/domain/capacidade";
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

const zHoras = z.coerce.number({ error: "Informe as horas semanais." }).min(0, "Horas inválidas.").max(80, "Máximo de 80h por semana.");

const zRecurso = z.object({
  nome: z.string({ error: "Informe o nome." }).min(2).max(120),
  email: z.email("E-mail inválido.").optional(),
  cargo: zTextoOpcional,
  area: zTextoOpcional,
  tipo: z.enum(["INTERNO", "TERCEIRO"]),
  dataEntrada: zData,
  dataSaida: zData,
});

export async function criarRecurso(_: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  let id = "";
  const r = await executarAcao(async () => {
    const u = await exigir("editar", "RECURSOS");
    const f = lerFormulario(dados);
    const v = zRecurso.parse(f);
    const horas = zHoras.parse(f.horasSemanais);
    const inicio = parseDia(f.vigenciaInicio) ?? v.dataEntrada ?? new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1));
    const rec = await db.$transaction(async (tx) => {
      const rec = await tx.recurso.create({
        data: { ...v, email: v.email?.toLowerCase(), criadoPorId: u.id, atualizadoPorId: u.id, capacidades: { create: { vigenciaInicio: inicio, horasSemanais: horas, criadoPorId: u.id } } },
      });
      await auditar(tx, { entidade: "Recurso", entidadeId: rec.id, acao: "CRIAR", usuarioId: u.id, resumo: `${rec.nome} · ${horas}h/semana`, depois: rec });
      return rec;
    });
    id = rec.id;
  });
  if (r?.erro) return r;
  redirect(`/recursos/${id}`);
}

export async function atualizarRecurso(id: string, _: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "RECURSOS");
    const f = lerFormulario(dados);
    const v = zRecurso.extend({ ativo: z.boolean() }).parse({ ...f, ativo: f.ativo === "on" });
    await db.$transaction(async (tx) => {
      const antes = await tx.recurso.findUniqueOrThrow({ where: { id } });
      const depois = await tx.recurso.update({
        where: { id },
        data: {
          ...v,
          email: v.email?.toLowerCase() ?? null,
          cargo: v.cargo ?? null,
          area: v.area ?? null,
          atualizadoPorId: u.id,
        },
      });
      await auditar(tx, { entidade: "Recurso", entidadeId: id, acao: "ALTERAR", usuarioId: u.id, resumo: depois.nome, antes, depois });
    });
    revalidatePath("/recursos");
    revalidatePath(`/recursos/${id}`);
  });
}

/** Nova capacidade a partir de uma data: encerra a vigência aberta no dia anterior. */
export async function definirCapacidade(recursoId: string, _: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "RECURSOS");
    const f = lerFormulario(dados);
    const horas = zHoras.parse(f.horasSemanais);
    const inicio = parseDia(f.vigenciaInicio);
    if (!inicio) throw new ErroNegocio("Informe a data de início da vigência.");

    await db.$transaction(async (tx) => {
      const existentes = await tx.recursoCapacidade.findMany({ where: { recursoId } });
      const aberta = existentes.find((v) => !v.vigenciaFim && v.vigenciaInicio < inicio);
      const simulado = existentes
        .map((v) => ({
          vigenciaInicio: v.vigenciaInicio,
          vigenciaFim: aberta && v.id === aberta.id ? somarDias(inicio, -1) : v.vigenciaFim,
          horasSemanais: v.horasSemanais.toNumber(),
        }))
        .concat({ vigenciaInicio: inicio, vigenciaFim: null, horasSemanais: horas });
      const erro = validarVigencias(simulado);
      if (erro) throw new ErroNegocio(`${erro} Ajuste ou exclua a vigência existente.`);

      if (aberta) await tx.recursoCapacidade.update({ where: { id: aberta.id }, data: { vigenciaFim: somarDias(inicio, -1) } });
      const nova = await tx.recursoCapacidade.create({ data: { recursoId, vigenciaInicio: inicio, horasSemanais: horas, criadoPorId: u.id } });
      await auditar(tx, {
        entidade: "Recurso",
        entidadeId: recursoId,
        acao: "ALTERAR",
        usuarioId: u.id,
        resumo: `Capacidade ${horas}h/semana a partir de ${f.vigenciaInicio}`,
        antes: { capacidadeSemanal: aberta?.horasSemanais.toNumber() ?? null },
        depois: { capacidadeSemanal: nova.horasSemanais.toNumber() },
      });
    });
    revalidatePath(`/recursos/${recursoId}`);
    return { ok: true, mensagem: "Capacidade registrada." };
  });
}

export async function excluirCapacidade(id: string): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "RECURSOS");
    const v = await db.$transaction(async (tx) => {
      const v = await tx.recursoCapacidade.delete({ where: { id } });
      await auditar(tx, { entidade: "Recurso", entidadeId: v.recursoId, acao: "ALTERAR", usuarioId: u.id, resumo: "Vigência de capacidade excluída", antes: { capacidadeSemanal: v.horasSemanais.toNumber() }, depois: { capacidadeSemanal: null } });
      return v;
    });
    revalidatePath(`/recursos/${v.recursoId}`);
  });
}

export async function adicionarApelido(recursoId: string, _: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    await exigir("editar", "RECURSOS");
    const apelido = z.string({ error: "Informe o apelido." }).min(2).max(120).parse(lerFormulario(dados).apelido);
    await db.recursoApelido.create({ data: { recursoId, apelido } });
    revalidatePath(`/recursos/${recursoId}`);
    return { ok: true, mensagem: "Apelido adicionado." };
  });
}

export async function excluirApelido(id: string): Promise<EstadoAcao> {
  return executarAcao(async () => {
    await exigir("editar", "RECURSOS");
    const a = await db.recursoApelido.delete({ where: { id } });
    revalidatePath(`/recursos/${a.recursoId}`);
  });
}
