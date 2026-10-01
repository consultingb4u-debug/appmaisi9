import Link from "next/link";
import clsx from "clsx";
import { chaveDia, formatarData } from "@/lib/domain/datas";
import { FASE, FASES, SITUACAO_PRAZO, STATUS_ITEM, TOM_STATUS_ITEM } from "@/lib/domain/rotulos";
import type { AtividadeCarregada } from "@/lib/services/cronograma";
import { CampoInline } from "@/components/campo-inline";
import { Selo } from "@/components/ui";

const h = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));
const OPCOES_STATUS = Object.entries(STATUS_ITEM) as [string, string][];

/** Tabela do cronograma agrupada pelas 4 fases oficiais, com subtotais e edição inline de %, status e datas. */
export function TabelaCronograma({ atividades, editavel, base, selecionada }: { atividades: AtividadeCarregada[]; editavel: boolean; base: string; selecionada?: string }) {
  return (
    <div className="-m-4 overflow-x-auto">
      <table className="tabela [&_td]:px-2 [&_th]:px-2">
        <thead>
          <tr>
            <th>ID</th>
            <th className="min-w-56">Tarefa</th>
            <th>Recursos</th>
            <th>Início</th>
            <th>Fim</th>
            <th className="text-right" title="Dias úteis (sem feriados)">Dur.</th>
            <th className="text-right">Prev.</th>
            <th className="text-right">Real.</th>
            <th className="text-right">Falta</th>
            <th className="text-right">Forecast</th>
            <th className="text-right">Desvio</th>
            <th className="text-right">%</th>
            <th>Status</th>
            <th>Prazo</th>
          </tr>
        </thead>
        {FASES.map((fase) => {
          const doGrupo = atividades.filter((a) => a.fase === fase);
          if (doGrupo.length === 0) return null;
          const soma = (k: "previsto" | "realizado" | "paraConcluir" | "forecast") => doGrupo.filter((a) => a.status !== "CANCELADO").reduce((t, a) => t + a.totais[k], 0);
          return (
            <tbody key={fase}>
              <tr className="bg-fundo/80">
                <td colSpan={6} className="text-xs font-semibold tracking-wide text-navy-900 uppercase">
                  {FASE[fase]} <span className="font-normal text-ardosia-500">· {doGrupo.length} atividade(s)</span>
                </td>
                <td className="text-right text-xs font-semibold tabular-nums">{h(soma("previsto"))}</td>
                <td className="text-right text-xs font-semibold tabular-nums">{h(soma("realizado"))}</td>
                <td className="text-right text-xs font-semibold tabular-nums">{h(soma("paraConcluir"))}</td>
                <td className="text-right text-xs font-semibold tabular-nums">{h(soma("forecast"))}</td>
                <td colSpan={4} />
              </tr>
              {doGrupo.map((a) => {
                const [rotSit, tomSit] = a.situacao ? SITUACAO_PRAZO[a.situacao] : ["—", "neutro" as const];
                return (
                  <tr key={a.id} className={clsx(a.status === "CANCELADO" && "opacity-50", a.id === selecionada && "bg-destaque/5")}>
                    <td className="text-xs whitespace-nowrap">
                      {editavel ? (
                        <Link href={`${base}editar=${a.id}`} scroll={false} className="font-medium text-navy-800 hover:underline">
                          {a.codigo}
                        </Link>
                      ) : (
                        <span className="font-medium">{a.codigo}</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-start gap-1.5">
                        {a.marco && <span className="mt-1 inline-block h-2 w-2 shrink-0 rotate-45 bg-destaque" title="Marco" />}
                        <span>{a.tarefa}</span>
                      </div>
                      <div className="text-xs text-ardosia-500">
                        {[a.backlogItem?.codigo, a.moduloProcesso, a.clienteParticipa && `cliente${a.contatoCliente ? `: ${a.contatoCliente.nome}` : ""}`, a.predecessoras.length && `após ${a.predecessoras.map((p) => p.predecessora.codigo).join(", ")}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </td>
                    <td className="text-xs whitespace-nowrap">
                      {a.atrib.length ? a.atrib.map((x) => <div key={x.id}>{x.recurso.split(" ")[0]} {h(x.previsto)}h</div>) : <span className="text-ardosia-400">—</span>}
                    </td>
                    <td>{editavel ? <CampoInline atividadeId={a.id} campo="inicio" valor={a.inicioPrevisto ? chaveDia(a.inicioPrevisto) : ""} /> : formatarData(a.inicioPrevisto)}</td>
                    <td>{editavel ? <CampoInline atividadeId={a.id} campo="fim" valor={a.fimPrevisto ? chaveDia(a.fimPrevisto) : ""} /> : formatarData(a.fimPrevisto)}</td>
                    <td className="text-right tabular-nums">{a.duracao ?? "—"}</td>
                    <td className="text-right tabular-nums">{h(a.totais.previsto)}</td>
                    <td className="text-right tabular-nums">{h(a.totais.realizado)}</td>
                    <td className="text-right tabular-nums">{h(a.totais.paraConcluir)}</td>
                    <td className="text-right tabular-nums">{h(a.totais.forecast)}</td>
                    <td className={clsx("text-right tabular-nums", a.totais.desvio > 0 ? "text-critico" : a.totais.desvio < 0 ? "text-ok" : "text-ardosia-400")}>
                      {a.totais.desvio > 0 ? "+" : ""}
                      {h(a.totais.desvio)}
                    </td>
                    <td className="text-right">{editavel ? <CampoInline atividadeId={a.id} campo="percentual" valor={String(a.percentualConclusao)} /> : `${a.percentualConclusao}%`}</td>
                    <td>{editavel ? <CampoInline atividadeId={a.id} campo="status" valor={a.status} opcoes={OPCOES_STATUS} /> : <Selo tom={TOM_STATUS_ITEM[a.status]}>{STATUS_ITEM[a.status]}</Selo>}</td>
                    <td>{a.situacao ? <Selo tom={tomSit}>{rotSit}</Selo> : <span className="text-ardosia-400">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}
