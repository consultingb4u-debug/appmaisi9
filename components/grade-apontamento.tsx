"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import clsx from "clsx";
import { apontar, atualizarAndamento } from "@/app/(app)/horas/acoes";

export type LinhaApontamento = {
  chave: string;
  projetoId: string;
  projeto: string;
  atividadeId: string | null;
  atividade: string;
  periodo: string;
  previsto: number | null;
  realizadoTotal: number;
  semana: number;
  falta: number | null;
  faltaInformada: boolean;
  percentual: number | null;
  situacao?: string;
};

const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));

function Entrada({ valor, onSalvar, largura = "w-16", placeholder, rotulo }: { valor: string; onSalvar: (v: string) => Promise<{ ok: boolean; erro?: string }>; largura?: string; placeholder?: string; rotulo: string }) {
  const router = useRouter();
  const [estado, setEstado] = useState<"" | "salvando" | "erro">("");
  const [erro, setErro] = useState<string>();
  const [, iniciar] = useTransition();
  return (
    <input
      key={valor}
      defaultValue={valor}
      placeholder={placeholder}
      inputMode="decimal"
      aria-label={rotulo}
      onFocus={(e) => e.currentTarget.select()}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      onBlur={(e) => {
        const v = e.currentTarget.value.trim().replace(",", ".");
        if (v === valor) return;
        setEstado("salvando");
        iniciar(async () => {
          const r = await onSalvar(v);
          setEstado(r.ok ? "" : "erro");
          setErro(r.erro);
          router.refresh();
        });
      }}
      title={erro}
      className={clsx(
        largura,
        "rounded border px-1.5 py-1 text-right text-sm tabular-nums outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/15",
        estado === "erro" ? "border-critico bg-critico/5" : estado === "salvando" ? "border-alerta bg-alerta/10" : "border-ardosia-200 bg-white",
      )}
    />
  );
}

/** Apontamento semanal por atividade, com "falta" e % do executor. */
export function GradeApontamento({ linhas, recursoId, semanaId }: { linhas: LinhaApontamento[]; recursoId: string; semanaId: string }) {
  const total = linhas.reduce((t, l) => t + l.semana, 0);
  return (
    <div className="overflow-x-auto">
      <table className="tabela">
        <thead>
          <tr>
            <th>Projeto · atividade</th>
            <th>Período</th>
            <th className="text-right">Previsto</th>
            <th className="text-right">Realizado</th>
            <th className="text-right">Nesta semana</th>
            <th className="text-right" title="Vazio = previsto − realizado">Falta</th>
            <th className="text-right">%</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.chave}>
              <td>
                <div className="text-xs text-ardosia-500">{l.projeto}</div>
                <Link href={`/projetos/${l.projetoId}/cronograma${l.atividadeId ? `?editar=${l.atividadeId}` : ""}`} className="hover:underline">
                  {l.atividade}
                </Link>
                {l.situacao === "ATRASADO" && <span className="ml-2 text-xs text-critico">atrasada</span>}
              </td>
              <td className="text-xs whitespace-nowrap text-ardosia-600">{l.periodo}</td>
              <td className="text-right tabular-nums">{l.previsto === null ? "—" : `${fmt(l.previsto)}h`}</td>
              <td className="text-right tabular-nums">{fmt(l.realizadoTotal)}h</td>
              <td className="text-right">
                <Entrada rotulo={`Horas ${l.atividade}`} valor={l.semana ? fmt(l.semana) : ""} onSalvar={(v) => apontar(recursoId, l.projetoId, l.atividadeId, semanaId, v === "" ? 0 : Number(v))} />
              </td>
              <td className="text-right">
                {l.atividadeId ? (
                  <Entrada rotulo={`Falta ${l.atividade}`} valor={l.faltaInformada && l.falta !== null ? fmt(l.falta) : ""} placeholder={l.falta !== null ? fmt(l.falta) : ""} onSalvar={(v) => atualizarAndamento(l.atividadeId!, recursoId, "falta", v)} />
                ) : (
                  "—"
                )}
              </td>
              <td className="text-right">
                {l.atividadeId && l.percentual !== null ? <Entrada rotulo={`Percentual ${l.atividade}`} largura="w-14" valor={String(l.percentual)} onSalvar={(v) => atualizarAndamento(l.atividadeId!, recursoId, "percentual", v || "0")} /> : "—"}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-semibold">
            <td colSpan={4} className="px-3 py-2 text-right text-ardosia-600">
              Total da semana
            </td>
            <td className="px-3 py-2 text-right tabular-nums">{fmt(total)}h</td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
