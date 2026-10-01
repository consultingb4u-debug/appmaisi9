"use client";

import { useState } from "react";
import { classeBotao } from "./ui";

type Linha = { chave: number; recursoId: string; previsto: string; falta: string; realizado?: number };

/**
 * Pessoas que executam a atividade, cada uma com seu esforço.
 * Substitui as linhas duplicadas CRON-xxx.2 / .3 da planilha.
 * "Falta" vazio = previsto − realizado (calculado).
 */
export function EditorAtribuicoes({
  recursos,
  iniciais,
}: {
  recursos: { id: string; nome: string }[];
  iniciais: { recursoId: string; previsto: number; falta: number | null; realizado: number }[];
}) {
  const [linhas, setLinhas] = useState<Linha[]>(() =>
    iniciais.length
      ? iniciais.map((a, i) => ({ chave: i, recursoId: a.recursoId, previsto: String(a.previsto), falta: a.falta === null ? "" : String(a.falta), realizado: a.realizado }))
      : [{ chave: 0, recursoId: "", previsto: "", falta: "" }],
  );
  const atualizar = (chave: number, campo: keyof Linha, v: string) => setLinhas((ls) => ls.map((l) => (l.chave === chave ? { ...l, [campo]: v } : l)));
  const total = linhas.reduce((t, l) => t + (Number(l.previsto) || 0), 0);

  return (
    <div className="rounded-md border border-ardosia-100">
      <table className="w-full text-sm">
        <thead className="bg-fundo text-xs text-ardosia-600 uppercase">
          <tr>
            <th className="px-2 py-1.5 text-left">Recurso MAIS i9</th>
            <th className="px-2 py-1.5 text-right">Previsto (h)</th>
            <th className="px-2 py-1.5 text-right">Realizado</th>
            <th className="px-2 py-1.5 text-right">Falta (h)</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.chave} className="border-t border-ardosia-100">
              <td className="px-2 py-1">
                <select name="atribRecurso" value={l.recursoId} onChange={(e) => atualizar(l.chave, "recursoId", e.target.value)} className="campo py-1">
                  <option value="">— escolha —</option>
                  {recursos.map((r) => (
                    <option key={r.id} value={r.id} disabled={r.id !== l.recursoId && linhas.some((x) => x.recursoId === r.id)}>
                      {r.nome}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-2 py-1">
                <input name="atribPrevisto" type="number" step="0.5" min="0" value={l.previsto} onChange={(e) => atualizar(l.chave, "previsto", e.target.value)} className="campo w-24 py-1 text-right" />
              </td>
              <td className="px-2 py-1 text-right text-ardosia-500 tabular-nums">{l.realizado ?? 0}h</td>
              <td className="px-2 py-1">
                <input name="atribFalta" type="number" step="0.5" min="0" value={l.falta} placeholder="auto" onChange={(e) => atualizar(l.chave, "falta", e.target.value)} className="campo w-24 py-1 text-right" />
              </td>
              <td className="px-2 py-1 text-right">
                <button type="button" onClick={() => setLinhas((ls) => ls.filter((x) => x.chave !== l.chave))} className="text-xs text-ardosia-500 hover:text-critico" aria-label="Remover recurso">
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t border-ardosia-100 px-2 py-1.5 text-xs">
        <button type="button" onClick={() => setLinhas((ls) => [...ls, { chave: Math.max(0, ...ls.map((x) => x.chave)) + 1, recursoId: "", previsto: "", falta: "" }])} className={classeBotao("secundario", "sm")}>
          + Recurso
        </button>
        <span className="text-ardosia-600">
          Esforço total: <strong className="tabular-nums">{total}h</strong>
        </span>
      </div>
    </div>
  );
}
