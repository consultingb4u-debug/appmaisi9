"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { exigir } from "@/lib/auth/sessao";
import { ErroNegocio, executarAcao, lerFormulario } from "@/lib/acoes";
import { auditar } from "@/lib/services/auditoria";
import { carregarCtrl001, carregarCtrl003, efetivarLote, validarLote } from "@/lib/importacao/lotes";
import type { EstadoAcao } from "@/components/formulario";

const LIMITE_BYTES = 10 * 1024 * 1024;

export async function enviarPlanilha(_: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  let id = "";
  const r = await executarAcao(async () => {
    const u = await exigir("editar", "IMPORTACAO");
    const arquivo = dados.get("arquivo");
    if (!(arquivo instanceof File) || arquivo.size === 0) throw new ErroNegocio("Selecione o arquivo .xlsx.");
    if (!arquivo.name.toLowerCase().endsWith(".xlsx")) throw new ErroNegocio("Envie um arquivo .xlsx (Excel).");
    if (arquivo.size > LIMITE_BYTES) throw new ErroNegocio("Arquivo maior que 10 MB.");
    const f = lerFormulario(dados);
    const tipo = f.tipo === "CTRL001" ? "CTRL001" : "CTRL003";
    if (tipo === "CTRL001" && !f.projetoId) throw new ErroNegocio("Escolha o projeto do CTRL-001.");
    try {
      const bytes = Buffer.from(await arquivo.arrayBuffer());
      id = tipo === "CTRL001" ? await carregarCtrl001(arquivo.name, bytes, f.projetoId!, u.id) : await carregarCtrl003(arquivo.name, bytes, u.id);
    } catch (e) {
      throw new ErroNegocio(e instanceof Error ? `Não foi possível ler a planilha: ${e.message}` : "Não foi possível ler a planilha.");
    }
  });
  if (r?.erro) return r;
  redirect(`/admin/importacao/${id}`);
}

export async function revalidar(loteId: string): Promise<EstadoAcao> {
  return executarAcao(async () => {
    await exigir("editar", "IMPORTACAO");
    await validarLote(loteId);
    revalidatePath(`/admin/importacao/${loteId}`);
    return { ok: true, mensagem: "Validação atualizada." };
  });
}

/** De-Para: associa um nome da planilha a um recurso/cliente existente (ou cria o cliente). */
export async function mapear(loteId: string, tipo: "RECURSO" | "CLIENTE", texto: string, _: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "IMPORTACAO");
    const destino = z.string({ error: "Escolha uma opção." }).min(1, "Escolha uma opção.").parse(lerFormulario(dados).destino);
    await db.$transaction(async (tx) => {
      if (tipo === "RECURSO") {
        await tx.recursoApelido.create({ data: { recursoId: destino, apelido: texto } });
        await auditar(tx, { entidade: "Recurso", entidadeId: destino, acao: "ALTERAR", usuarioId: u.id, resumo: `Apelido "${texto}" (De-Para da importação)` });
      } else if (destino === "__novo__") {
        const c = await tx.cliente.create({ data: { nome: texto, criadoPorId: u.id, atualizadoPorId: u.id } });
        await auditar(tx, { entidade: "Cliente", entidadeId: c.id, acao: "CRIAR", usuarioId: u.id, resumo: `${texto} (criado no De-Para da importação)` });
      } else {
        await tx.clienteApelido.create({ data: { clienteId: destino, apelido: texto } });
        await auditar(tx, { entidade: "Cliente", entidadeId: destino, acao: "ALTERAR", usuarioId: u.id, resumo: `Apelido "${texto}" (De-Para da importação)` });
      }
    });
    await validarLote(loteId);
    revalidatePath(`/admin/importacao/${loteId}`);
    return { ok: true, mensagem: "Mapeado." };
  });
}

export async function efetivar(loteId: string, _: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {
    const u = await exigir("editar", "IMPORTACAO");
    if (lerFormulario(dados).confirmo !== "on") throw new ErroNegocio("Marque a confirmação antes de efetivar.");
    const r = await efetivarLote(loteId, u.id);
    revalidatePath("/", "layout");
    return { ok: true, mensagem: `Importação efetivada: ${r.criados} criado(s), ${r.atualizados} atualizado(s), ${r.ignorados} sem alteração, ${r.comErro} com erro (não importados).` };
  });
}

export async function descartar(loteId: string): Promise<EstadoAcao> {
  return executarAcao(async () => {
    await exigir("editar", "IMPORTACAO");
    const lote = await db.importLote.findUniqueOrThrow({ where: { id: loteId } });
    if (lote.status === "EFETIVADO") throw new ErroNegocio("Lote já efetivado não pode ser descartado.");
    await db.importLote.update({ where: { id: loteId }, data: { status: "DESCARTADO" } });
    revalidatePath(`/admin/importacao/${loteId}`);
  });
}
