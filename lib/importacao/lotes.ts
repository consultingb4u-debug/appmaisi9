import { db } from "@/lib/db";
import * as ctrl003 from "./ctrl003/servico";
import * as ctrl001 from "./ctrl001/servico";

/** Ponto único das telas de importação: despacha pelo tipo do lote. */
export async function validarLote(loteId: string) {
  const { tipo } = await db.importLote.findUniqueOrThrow({ where: { id: loteId }, select: { tipo: true } });
  return tipo === "CTRL001" ? ctrl001.validarLoteCtrl001(loteId) : ctrl003.validarLote(loteId);
}

export async function efetivarLote(loteId: string, usuarioId: string) {
  const { tipo } = await db.importLote.findUniqueOrThrow({ where: { id: loteId }, select: { tipo: true } });
  return tipo === "CTRL001" ? ctrl001.efetivarLoteCtrl001(loteId, usuarioId) : ctrl003.efetivarLote(loteId, usuarioId);
}

export async function pendenciasDoLote(loteId: string): Promise<{ tipo: "RECURSO" | "CLIENTE"; texto: string; ocorrencias: number }[]> {
  const { tipo } = await db.importLote.findUniqueOrThrow({ where: { id: loteId }, select: { tipo: true } });
  return tipo === "CTRL001" ? ctrl001.pendenciasCtrl001(loteId) : ctrl003.pendenciasDoLote(loteId);
}

export { carregarCtrl003 } from "./ctrl003/servico";
export { carregarCtrl001 } from "./ctrl001/servico";
export { arquivoDoLote } from "./ctrl003/servico";
