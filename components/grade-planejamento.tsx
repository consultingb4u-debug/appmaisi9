"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import clsx from "clsx";
import { salvarHoras } from "@/app/(app)/capacidade/acoes";

export type CelulaPlanejamento = {
  id: string | null;
  previstas: number;
  calculadas: number;
  avulsas: number;
  override: boolean;
  status: string;
  observacao: string | null;
};

export type LinhaPlanejamento = {
  chave: string; // projetoId|recursoId
  projetoId: string;
  recursoId: string;
  titulo: string;
  subtitulo: string;
  href: string;
  celulas: Record<string, CelulaPlanejamento>;
};

export type SemanaColuna = { id: string; rotulo: string; atual: boolean; capacidade?: number };

type EstadoCelula = { valor: number; salvando?: boolean; erro?: string };

const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));

function corUtilizacao(u: number) {
  if (u > 1) return "bg-critico/15 text-critico";
  if (u >= 0.85) return "bg-alerta/20 text-[#8a6a00]";
  if (u < 0.5) return "bg-livre/10 text-livre";
  return "bg-ok/10 text-ok";
}

/**
 * Grade projeto+recurso × semana com edição inline.
 * Digite o total de horas da semana; salva ao sair do campo (Tab/Enter/clique fora).
 * Com `capacidade` nas semanas (filtro por um recurso), mostra a utilização recalculada na hora.
 */
export function GradePlanejamento({
  linhas,
  semanas,
  editavel,
  baseDetalhe,
}: {
  linhas: LinhaPlanejamento[];
  semanas: SemanaColuna[];
  editavel: boolean;
  /** URL da página com os filtros atuais; o detalhe da célula abre com &celula=<id>. */
  baseDetalhe: string;
}) {
  const [estado, setEstado] = useState<Record<string, EstadoCelula>>(() => {
    const e: Record<string, EstadoCelula> = {};
    for (const l of linhas) for (const s of semanas) e[`${l.chave}|${s.id}`] = { valor: l.celulas[s.id]?.previstas ?? 0 };
    return e;
  });
  const [, iniciar] = useTransition();

  const valor = (l: LinhaPlanejamento, s: string) => estado[`${l.chave}|${s}`]?.valor ?? 0;
  const totalSemana = (s: string) => linhas.reduce((t, l) => t + valor(l, s), 0);
  const comCapacidade = semanas.some((s) => s.capacidade !== undefined);

  function salvar(l: LinhaPlanejamento, semanaId: string, texto: string) {
    const k = `${l.chave}|${semanaId}`;
    const anterior = estado[k]?.valor ?? 0;
    const novo = texto.trim() === "" ? 0 : Number(texto.replace(",", "."));
    if (Number.isNaN(novo) || novo < 0 || novo > 80) {
      setEstado((e) => ({ ...e, [k]: { valor: anterior, erro: "Use um número de 0 a 80." } }));
      return;
    }
    if (novo === anterior) {
      setEstado((e) => ({ ...e, [k]: { valor: anterior } }));
      return;
    }
    setEstado((e) => ({ ...e, [k]: { valor: novo, salvando: true } }));
    iniciar(async () => {
      const r = await salvarHoras(l.projetoId, l.recursoId, semanaId, novo);
      setEstado((e) => ({ ...e, [k]: r.ok ? { valor: novo } : { valor: anterior, erro: r.erro } }));
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="tabela">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 min-w-56 bg-fundo">Projeto · recurso</th>
            {semanas.map((s) => (
              <th key={s.id} className={clsx("min-w-16 text-center", s.atual && "!text-destaque-escuro")}>
                {s.rotulo}
              </th>
            ))}
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.chave}>
              <td className="sticky left-0 z-10 bg-white">
                <Link href={l.href} className="font-medium text-navy-800 hover:underline">
                  {l.titulo}
                </Link>
                <div className="text-xs text-ardosia-500">{l.subtitulo}</div>
              </td>
              {semanas.map((s) => {
                const k = `${l.chave}|${s.id}`;
                const st = estado[k] ?? { valor: 0 };
                const c = l.celulas[s.id];
                const dica = [
                  c?.calculadas ? `Cronograma: ${fmt(c.calculadas)}h` : null,
                  c?.override && c.calculadas ? "Ajustado manualmente" : null,
                  c?.avulsas ? `Inclui ${fmt(c.avulsas)}h de gestão/avulsas` : null,
                  c?.status && c.status !== "PLANEJADO" ? c.status.replace("_", " ").toLowerCase() : null,
                  c?.observacao,
                  st.erro,
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <td key={s.id} className="group p-1 text-center" title={dica || undefined}>
                    <span className="relative inline-block">
                      {editavel ? (
                        <input
                          key={`${k}-${st.valor}-${st.erro ?? ""}`}
                          defaultValue={st.valor ? fmt(st.valor) : ""}
                          inputMode="decimal"
                          aria-label={`${l.titulo} ${l.subtitulo} ${s.rotulo}`}
                          onFocus={(e) => e.currentTarget.select()}
                          onBlur={(e) => salvar(l, s.id, e.currentTarget.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                            if (e.key === "Escape") {
                              e.currentTarget.value = st.valor ? fmt(st.valor) : "";
                              e.currentTarget.blur();
                            }
                          }}
                          className={clsx(
                            "w-14 rounded border px-1 py-1 text-center text-sm tabular-nums outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/15",
                            st.erro ? "border-critico bg-critico/5" : st.salvando ? "border-alerta bg-alerta/10" : st.valor ? "border-transparent bg-navy-900/5" : "border-transparent bg-transparent hover:border-ardosia-200",
                            c?.override && c.calculadas > 0 && "italic",
                            c?.status === "BLOQUEADO" && "text-critico",
                            c?.status === "AGUARDANDO_CLIENTE" && "text-[#8a6a00]",
                          )}
                        />
                      ) : (
                        <span className="tabular-nums">{st.valor ? fmt(st.valor) : <span className="text-ardosia-200">—</span>}</span>
                      )}
                      {c?.id && (
                        <Link
                          href={`${baseDetalhe}${baseDetalhe.includes("?") ? "&" : "?"}celula=${c.id}`}
                          scroll={false}
                          className={clsx(
                            "absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border border-white",
                            c.status === "BLOQUEADO" || c.status === "AGUARDANDO_CLIENTE" ? "bg-destaque" : "bg-ardosia-400 opacity-0 group-hover:opacity-100 focus:opacity-100",
                          )}
                          title="Status, prioridade e observação"
                          aria-label="Detalhes da célula"
                        />
                      )}
                    </span>
                  </td>
                );
              })}
              <td className="text-right font-medium tabular-nums">{fmt(semanas.reduce((t, s) => t + valor(l, s.id), 0))}h</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-semibold">
            <td className="sticky left-0 z-10 bg-white px-3 py-2 text-ardosia-600">Total</td>
            {semanas.map((s) => (
              <td key={s.id} className="px-1 py-2 text-center tabular-nums">
                {fmt(totalSemana(s.id))}
              </td>
            ))}
            <td className="px-3 py-2 text-right tabular-nums">{fmt(semanas.reduce((t, s) => t + totalSemana(s.id), 0))}h</td>
          </tr>
          {comCapacidade && (
            <>
              <tr className="text-xs">
                <td className="sticky left-0 z-10 bg-white px-3 py-1.5 text-ardosia-600">Capacidade líquida</td>
                {semanas.map((s) => (
                  <td key={s.id} className="px-1 py-1.5 text-center tabular-nums">
                    {s.capacidade ?? "—"}
                  </td>
                ))}
                <td />
              </tr>
              <tr className="text-xs">
                <td className="sticky left-0 z-10 bg-white px-3 py-1.5 text-ardosia-600">Utilização</td>
                {semanas.map((s) => {
                  const t = totalSemana(s.id);
                  const cap = s.capacidade ?? 0;
                  const u = cap > 0 ? t / cap : t > 0 ? Infinity : 0;
                  return (
                    <td key={s.id} className="p-1 text-center tabular-nums">
                      {t > 0 || cap > 0 ? <span className={clsx("block rounded px-1 py-0.5 font-medium", corUtilizacao(u))}>{Number.isFinite(u) ? `${Math.round(u * 100)}%` : "sem cap."}</span> : null}
                    </td>
                  );
                })}
                <td />
              </tr>
            </>
          )}
        </tfoot>
      </table>
    </div>
  );
}
