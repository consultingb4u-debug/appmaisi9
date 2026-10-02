import Link from "next/link";
import clsx from "clsx";
import { chaveDia, diaDaSemanaIso, paraDia } from "@/lib/domain/datas";
import { eventosPorDia, gradeDoMes, idMes, mesVizinho, type Evento, type TipoEvento } from "@/lib/domain/calendario";

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export const ESTILO_EVENTO: Record<TipoEvento, { rotulo: string; marca: string; classe: string }> = {
  GO_LIVE: { rotulo: "Go Live", marca: "★", classe: "bg-destaque/15 text-destaque-escuro font-medium" },
  DEPLOY: { rotulo: "Janela de deploy", marca: "⇡", classe: "bg-destaque/10 text-destaque-escuro" },
  MARCO: { rotulo: "Marco", marca: "◆", classe: "bg-navy-900 text-white" },
  FIM: { rotulo: "Fim de atividade", marca: "■", classe: "bg-navy-700/10 text-navy-900" },
  INICIO: { rotulo: "Início de atividade", marca: "▶", classe: "bg-ardosia-100 text-ardosia-600" },
  PRAZO: { rotulo: "Prazo do Operacional", marca: "!", classe: "bg-alerta/20 text-[#8a6a00]" },
  FERIADO: { rotulo: "Feriado", marca: "✦", classe: "bg-livre/10 text-livre" },
  AUSENCIA: { rotulo: "Ausência aprovada", marca: "○", classe: "bg-ardosia-100 text-ardosia-500 italic" },
};

/** Calendário mensal (segunda a domingo) com os eventos de cada dia; mostra até 4 por dia e o restante em "+N". */
export function Calendario({ ano, mes, eventos, base, params = {}, hoje = new Date() }: { ano: number; mes: number; eventos: Evento[]; base: string; params?: Record<string, string | undefined>; hoje?: Date }) {
  const grade = gradeDoMes(ano, mes);
  const de = grade[0][0].data;
  const ate = grade.at(-1)![6].data;
  const porDia = eventosPorDia(eventos, de, ate);
  const hojeK = chaveDia(paraDia(hoje));
  const url = (m: string) => `${base}?${new URLSearchParams(Object.entries({ ...params, mes: m }).filter(([, v]) => v) as [string, string][])}`;
  const presentes = new Set(eventos.map((e) => e.tipo));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Link href={url(mesVizinho(ano, mes, -1))} className="rounded px-2 py-1 text-ardosia-600 hover:bg-ardosia-100" aria-label="Mês anterior">
            ◀
          </Link>
          <h2 className="min-w-40 text-center text-lg font-semibold text-navy-900">
            {MESES[mes - 1]} {ano}
          </h2>
          <Link href={url(mesVizinho(ano, mes, 1))} className="rounded px-2 py-1 text-ardosia-600 hover:bg-ardosia-100" aria-label="Próximo mês">
            ▶
          </Link>
          <Link href={url(idMes(hoje.getUTCFullYear(), hoje.getUTCMonth() + 1))} className="ml-2 text-xs text-ardosia-500 hover:underline">
            hoje
          </Link>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ardosia-500">
          {(Object.keys(ESTILO_EVENTO) as TipoEvento[])
            .filter((t) => presentes.has(t))
            .map((t) => (
              <span key={t} className="flex items-center gap-1">
                <span className={clsx("rounded px-1", ESTILO_EVENTO[t].classe)}>{ESTILO_EVENTO[t].marca}</span>
                {ESTILO_EVENTO[t].rotulo}
              </span>
            ))}
          <span className="flex items-center gap-1">
            <span className="rounded px-1 ring-1 ring-critico">■</span>atrasado
          </span>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-ardosia-100 bg-white">
        <div className="grid min-w-[56rem] grid-cols-7">
          {DIAS.map((d) => (
            <div key={d} className="border-b border-ardosia-100 px-2 py-1.5 text-xs font-medium tracking-wide text-ardosia-500 uppercase">
              {d}
            </div>
          ))}
          {grade.flat().map(({ data, doMes }) => {
            const k = chaveDia(data);
            const lista = porDia.get(k) ?? [];
            const feriado = lista.some((e) => e.tipo === "FERIADO");
            return (
              <div
                key={k}
                className={clsx(
                  "min-h-28 border-b border-l border-ardosia-100 p-1.5 first:border-l-0 [&:nth-child(7n+1)]:border-l-0",
                  !doMes && "bg-fundo/60 text-ardosia-400",
                  (diaDaSemanaIso(data) >= 6 || feriado) && doMes && "bg-fundo/40",
                )}
              >
                <div className={clsx("mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs tabular-nums", k === hojeK ? "bg-destaque font-semibold text-white" : "text-ardosia-600")}>{data.getUTCDate()}</div>
                <ul className="space-y-0.5">
                  {lista.slice(0, 4).map((e, i) => {
                    const est = ESTILO_EVENTO[e.tipo];
                    const corpo = (
                      <span className={clsx("block truncate rounded px-1 py-0.5 text-[11px] leading-tight", est.classe, e.atrasado && "ring-1 ring-critico")} title={[e.titulo, e.detalhe].filter(Boolean).join("\n")}>
                        {est.marca} {e.titulo}
                      </span>
                    );
                    return <li key={i}>{e.href ? <Link href={e.href}>{corpo}</Link> : corpo}</li>;
                  })}
                  {lista.length > 4 && (
                    <li className="px-1 text-[11px] text-ardosia-500" title={lista.slice(4).map((e) => e.titulo).join("\n")}>
                      +{lista.length - 4} mais
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
