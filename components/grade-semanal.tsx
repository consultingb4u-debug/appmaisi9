import Link from "next/link";
import clsx from "clsx";
import { rotuloSemana, semanaDe, type SemanaIso } from "@/lib/domain/semanas";

export type CelulaGrade = { horas: number; dica?: string; destaque?: "alerta" | "critico" | "ok" | "livre" };
export type LinhaGrade = { chave: string; rotulo: string; sub?: string; href?: string };

const COR = {
  alerta: "bg-alerta/20 text-[#8a6a00]",
  critico: "bg-critico/15 text-critico font-semibold",
  ok: "bg-ok/10 text-ok",
  livre: "bg-livre/10 text-livre",
} as const;

const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));

/** Grade linha × semana com horas (somente leitura). Total por semana no rodapé. */
export function GradeSemanal({
  linhas,
  semanas,
  celulas,
  rodape,
  vazio = "—",
  rotuloLinha = "Recurso",
}: {
  linhas: LinhaGrade[];
  semanas: SemanaIso[];
  celulas: Map<string, CelulaGrade>; // chave `${linha}|${semanaId}`
  /** Linhas extras abaixo do total (ex.: capacidade, utilização). */
  rodape?: { rotulo: string; valores: Map<string, { texto: string; dica?: string; destaque?: CelulaGrade["destaque"] }> }[];
  vazio?: string;
  rotuloLinha?: string;
}) {
  const atual = semanaDe(new Date()).id;
  const totalSemana = (s: string) => linhas.reduce((t, l) => t + (celulas.get(`${l.chave}|${s}`)?.horas ?? 0), 0);
  return (
    <div className="overflow-x-auto">
      <table className="tabela">
        <thead>
          <tr>
            <th className="sticky left-0 bg-fundo">{rotuloLinha}</th>
            {semanas.map((s) => (
              <th key={s.id} className={clsx("text-center", s.id === atual && "!text-destaque-escuro")}>
                {rotuloSemana(s)}
              </th>
            ))}
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => {
            const total = semanas.reduce((t, s) => t + (celulas.get(`${l.chave}|${s.id}`)?.horas ?? 0), 0);
            return (
              <tr key={l.chave}>
                <td className="sticky left-0 bg-white whitespace-nowrap">
                  {l.href ? (
                    <Link href={l.href} className="font-medium text-navy-800 hover:underline">
                      {l.rotulo}
                    </Link>
                  ) : (
                    <span className="font-medium">{l.rotulo}</span>
                  )}
                  {l.sub && <div className="text-xs text-ardosia-500">{l.sub}</div>}
                </td>
                {semanas.map((s) => {
                  const c = celulas.get(`${l.chave}|${s.id}`);
                  return (
                    <td key={s.id} className="p-1 text-center tabular-nums" title={c?.dica}>
                      {c && c.horas !== 0 ? <span className={clsx("block rounded px-1.5 py-1", c.destaque ? COR[c.destaque] : "bg-navy-900/5")}>{fmt(c.horas)}</span> : <span className="text-ardosia-200">{vazio}</span>}
                    </td>
                  );
                })}
                <td className="text-right font-medium tabular-nums">{fmt(total)}h</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="font-semibold">
            <td className="sticky left-0 bg-white px-3 py-2 text-ardosia-600">Total</td>
            {semanas.map((s) => (
              <td key={s.id} className="px-1 py-2 text-center tabular-nums">
                {fmt(totalSemana(s.id))}
              </td>
            ))}
            <td className="px-3 py-2 text-right tabular-nums">{fmt(semanas.reduce((t, s) => t + totalSemana(s.id), 0))}h</td>
          </tr>
          {rodape?.map((r) => (
            <tr key={r.rotulo} className="text-xs">
              <td className="sticky left-0 bg-white px-3 py-1.5 text-ardosia-600">{r.rotulo}</td>
              {semanas.map((s) => {
                const c = r.valores.get(s.id);
                return (
                  <td key={s.id} className="p-1 text-center tabular-nums" title={c?.dica}>
                    {c && <span className={clsx("block rounded px-1 py-0.5", c.destaque && COR[c.destaque])}>{c.texto}</span>}
                  </td>
                );
              })}
              <td />
            </tr>
          ))}
        </tfoot>
      </table>
    </div>
  );
}
