import Link from "next/link";
import clsx from "clsx";
import { diffDias, formatarData, somarDias } from "@/lib/domain/datas";
import { FASE, FASES } from "@/lib/domain/rotulos";
import { rotuloSemana, semanaDe, semanasEntre } from "@/lib/domain/semanas";
import type { AtividadeCarregada } from "@/lib/services/cronograma";

const COR = { ATRASADO: "bg-critico", ATENCAO: "bg-alerta", NO_PRAZO: "bg-navy-700", CONCLUIDO: "bg-ok" } as const;

/** Gantt semanal: barra do período, preenchimento pelo % concluído, marcos em losango, hoje em laranja. */
export function GanttCronograma({ atividades, base }: { atividades: AtividadeCarregada[]; base: string }) {
  const comData = atividades.filter((a) => a.inicioPrevisto && a.fimPrevisto && a.status !== "CANCELADO");
  if (comData.length === 0) return <p className="text-sm text-ardosia-500">Nenhuma atividade com datas.</p>;
  const ini = comData.reduce((m, a) => (a.inicioPrevisto! < m ? a.inicioPrevisto! : m), comData[0].inicioPrevisto!);
  const fim = comData.reduce((m, a) => (a.fimPrevisto! > m ? a.fimPrevisto! : m), comData[0].fimPrevisto!);
  const semanas = semanasEntre(ini, fim);
  const inicio = semanas[0].inicio;
  const total = diffDias(semanas.at(-1)!.fim, inicio) + 1;
  const pos = (d: Date) => (diffDias(d, inicio) / total) * 100;
  const hoje = new Date();
  const atual = semanaDe(hoje).id;

  return (
    <div className="-m-4 overflow-x-auto">
      <div style={{ minWidth: 320 + semanas.length * 56 }}>
        <div className="flex border-b border-ardosia-100 bg-fundo text-[10px] font-medium text-ardosia-500">
          <div className="w-80 shrink-0 px-3 py-2">Atividade</div>
          <div className="flex flex-1">
            {semanas.map((s) => (
              <div key={s.id} className={clsx("flex-1 border-l border-ardosia-100 py-1 text-center", s.id === atual && "bg-destaque/10 text-destaque-escuro")}>
                {rotuloSemana(s).slice(0, 3)}
                <div className="font-normal">{formatarData(s.inicio).slice(0, 5)}</div>
              </div>
            ))}
          </div>
        </div>
        {FASES.map((fase) => {
          const doGrupo = comData.filter((a) => a.fase === fase);
          if (!doGrupo.length) return null;
          return (
            <div key={fase}>
              <div className="border-b border-ardosia-100 bg-fundo/60 px-3 py-1 text-[11px] font-semibold tracking-wide text-navy-900 uppercase">{FASE[fase]}</div>
              {doGrupo.map((a) => {
                const esq = pos(a.inicioPrevisto!);
                const larg = Math.max(0.8, pos(somarDias(a.fimPrevisto!, 1)) - esq);
                const cor = COR[a.situacao ?? "NO_PRAZO"];
                return (
                  <div key={a.id} className="flex items-center border-b border-ardosia-100 text-sm hover:bg-fundo/60">
                    <div className="w-80 shrink-0 truncate px-3 py-1.5">
                      <Link href={`${base}editar=${a.id}`} scroll={false} className="hover:underline">
                        <span className="text-xs text-ardosia-500">{a.codigo}</span> {a.tarefa}
                      </Link>
                    </div>
                    <div className="relative h-8 flex-1">
                      {hoje >= inicio && <div className="absolute inset-y-0 w-px bg-destaque" style={{ left: `${pos(hoje)}%` }} />}
                      <div
                        className={clsx("absolute top-2 h-4 overflow-hidden rounded", cor, "bg-opacity-30")}
                        style={{ left: `${esq}%`, width: `${larg}%`, opacity: a.status === "CONCLUIDO" ? 0.6 : 1 }}
                        title={`${a.codigo} · ${formatarData(a.inicioPrevisto)} a ${formatarData(a.fimPrevisto)} · ${a.percentualConclusao}% · ${a.atrib.map((x) => x.recurso).join(", ") || "sem recurso"}${a.predecessoras.length ? ` · após ${a.predecessoras.map((p) => p.predecessora.codigo).join(", ")}` : ""}`}
                      >
                        <div className="h-full bg-white/35" style={{ width: `${a.percentualConclusao}%` }} />
                      </div>
                      {a.marco && <div className="absolute top-2.5 h-3 w-3 -translate-x-1/2 rotate-45 border border-white bg-destaque" style={{ left: `${pos(somarDias(a.fimPrevisto!, 1))}%` }} title={`Marco: ${formatarData(a.fimPrevisto)}`} />}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
        <div className="flex flex-wrap gap-4 px-3 py-2 text-xs text-ardosia-500">
          {(["NO_PRAZO", "ATENCAO", "ATRASADO", "CONCLUIDO"] as const).map((s) => (
            <span key={s} className="flex items-center gap-1">
              <span className={clsx("inline-block h-2.5 w-4 rounded", COR[s])} /> {{ NO_PRAZO: "no prazo", ATENCAO: "vence em até 3 dias", ATRASADO: "atrasada", CONCLUIDO: "concluída" }[s]}
            </span>
          ))}
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rotate-45 bg-destaque" /> marco
          </span>
          <span>· faixa clara = % concluído</span>
        </div>
      </div>
    </div>
  );
}
