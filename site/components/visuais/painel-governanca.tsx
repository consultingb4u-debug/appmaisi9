import clsx from "clsx";
import { ChartGantt, CodeXml, Headset, Layers, LifeBuoy } from "lucide-react";

const demandas = [
  { id: "#2381", titulo: "Ajuste no cálculo de comissões", tipo: "Sustentação", I: LifeBuoy, prioridade: "Alta", status: "Em análise" },
  { id: "#2377", titulo: "Orientação: rotina de inventário", tipo: "Suporte", I: Headset, prioridade: "Média", status: "Concluída" },
  { id: "#2364", titulo: "Integração com portal de pedidos", tipo: "Projeto", I: Layers, prioridade: "Alta", status: "Em execução" },
  { id: "#2359", titulo: "Relatório de margem por filial", tipo: "Desenvolvimento", I: CodeXml, prioridade: "Baixa", status: "Validação" },
];

/** Ilustração da governança de demandas da consultoria (dados fictícios). */
export function PainelGovernanca() {
  return (
    <figure className="relative">
      <div className="rounded-2xl bg-navy-900 p-5 ring-1 ring-white/10 sm:p-6" aria-hidden>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-navy-800 text-azul-300">
              <ChartGantt className="size-4.5" />
            </span>
            <div>
              <p className="text-[11px] tracking-wider text-ardosia-400 uppercase">Governança de demandas</p>
              <p className="text-sm font-semibold text-white">Ambiente Protheus · visão do mês</p>
            </div>
          </div>
          <span className="hidden rounded-full bg-ok/15 px-2.5 py-1 text-[11px] font-semibold text-[#5fd39a] sm:inline">Ambiente estável</span>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2">
          {[
            ["Abertas", "14"],
            ["Em análise", "5"],
            ["Em execução", "6"],
            ["Concluídas", "41"],
          ].map(([r, v], i) => (
            <div key={r} className="rounded-lg bg-white/5 px-2.5 py-2.5 ring-1 ring-white/5">
              <p className="text-[10px] leading-tight text-ardosia-400">{r}</p>
              <p className={clsx("mt-1 font-display text-xl font-bold", i === 3 ? "text-white" : "text-ardosia-100")}>{v}</p>
            </div>
          ))}
        </div>

        <ul className="mt-4 space-y-2">
          {demandas.map((d) => (
            <li key={d.id} className="flex items-center gap-3 rounded-lg bg-white/[0.04] px-3 py-2.5">
              <d.I className="size-4 shrink-0 text-azul-300" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-white">{d.titulo}</p>
                <p className="text-[11px] text-ardosia-400">
                  {d.id} · {d.tipo} · prioridade {d.prioridade.toLowerCase()}
                </p>
              </div>
              <span
                className={clsx(
                  "rounded-full px-2 py-0.5 text-[10.5px] font-semibold whitespace-nowrap",
                  d.status === "Concluída" ? "bg-ok/15 text-[#5fd39a]" : d.status === "Em análise" ? "bg-destaque/15 text-destaque" : "bg-azul-500/20 text-azul-300",
                )}
              >
                {d.status}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-[11px] text-ardosia-400">
          <span>Prazos e prioridades acompanhados por indicadores</span>
          <span className="hidden text-ardosia-300 sm:inline">Status executivo mensal</span>
        </div>
      </div>
      <figcaption className="mt-3 text-xs text-ardosia-400">Ilustração com dados fictícios.</figcaption>
    </figure>
  );
}
