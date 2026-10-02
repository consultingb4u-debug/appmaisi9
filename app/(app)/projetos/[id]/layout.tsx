import { notFound } from "next/navigation";
import { usuarioAtual } from "@/lib/auth/sessao";
import { carregarProjeto } from "@/lib/services/projeto";
import { cronogramaDoProjeto } from "@/lib/services/cronograma";
import { formatarData } from "@/lib/domain/datas";
import { PRIORIDADE, STATUS_EXECUTIVO, STATUS_PROJETO, TIPO_PROJETO, TOM_NIVEL, TOM_PRIORIDADE, TOM_STATUS_PROJETO } from "@/lib/domain/rotulos";
import { db } from "@/lib/db";
import { GOVERNANCA } from "@/lib/domain/execucao";
import { Selo } from "@/components/ui";
import { Abas } from "@/components/abas";
import Link from "next/link";

const COR_EXEC = { VERDE: "bg-ok", AMARELO: "bg-alerta", VERMELHO: "bg-critico" } as const;
const h = (n: number) => `${Math.round(n * 10) / 10}h`;

export default async function LayoutProjeto({ children, params }: LayoutProps<"/projetos/[id]">) {
  await usuarioAtual();
  const { id } = await params;
  const p = await carregarProjeto(id);
  if (!p) notFound();
  const base = `/projetos/${p.id}`;
  const vendidas = p.horasVendidas?.toNumber() ?? null;
  const [crono, aval] = await Promise.all([cronogramaDoProjeto(p.id), db.avaliacaoComplexidade.findUnique({ where: { projetoId: p.id }, select: { nivelFinal: true } })]);
  const temCronograma = crono.atividades.length > 0;
  const forecast = crono.atividades.filter((a) => a.status !== "CANCELADO").reduce((t, a) => t + a.totais.forecast, 0);

  const info: [string, string][] = [
    ["GP", p.gp?.nome ?? "—"],
    ["Tipo", TIPO_PROJETO[p.tipo]],
    ["Kick-off", formatarData(p.dataKickoff)],
    ["Go Live", formatarData(p.dataGoLiveReal ?? p.dataGoLiveAlvo)],
    ["Encerramento", formatarData(p.dataEncerramentoReal ?? p.dataEncerramentoPrevista)],
    ["Horas vendidas", vendidas === null ? "—" : h(vendidas)],
    ["Planejado", h(p.horasPlanejadas)],
    ["Realizado", h(p.horasRealizadas)],
    ...(temCronograma ? ([["Forecast", h(forecast)]] as [string, string][]) : []),
  ];

  return (
    <>
      <nav className="mb-1 text-xs text-ardosia-500">
        <Link href="/portfolio" className="hover:text-navy-900 hover:underline">
          Portfólio
        </Link>
        <span className="mx-1.5">›</span>
        <Link href={`/clientes/${p.cliente.id}`} className="hover:text-navy-900 hover:underline">
          {p.cliente.nome}
        </Link>
      </nav>
      <div className="mb-4 rounded-lg border border-ardosia-100 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-medium text-ardosia-500">
              {p.cliente.nome} · {p.codigo}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-navy-900">{p.nome}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Selo tom={TOM_STATUS_PROJETO[p.status]}>{STATUS_PROJETO[p.status]}</Selo>
            <Selo tom={TOM_PRIORIDADE[p.prioridade]}>Prioridade {PRIORIDADE[p.prioridade]}</Selo>
            {aval?.nivelFinal ? (
              <Link href={`${base}/pre-projeto`} title={GOVERNANCA[aval.nivelFinal]}>
                <Selo tom={TOM_NIVEL[aval.nivelFinal]}>Complexidade {aval.nivelFinal}</Selo>
              </Link>
            ) : (
              <Link href={`${base}/pre-projeto`}>
                <Selo>Complexidade não avaliada</Selo>
              </Link>
            )}
            {p.statusExecutivo ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-fundo px-2 py-0.5 text-xs font-medium">
                <span className={`h-2.5 w-2.5 rounded-full ${COR_EXEC[p.statusExecutivo]}`} />
                {STATUS_EXECUTIVO[p.statusExecutivo]}
              </span>
            ) : (
              <Selo>Sem status executivo</Selo>
            )}
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-9">
          {info.map(([r, v]) => (
            <div key={r}>
              <dt className="text-[11px] font-medium tracking-wide text-ardosia-500 uppercase">{r}</dt>
              <dd className="font-medium tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
        {temCronograma && (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-ardosia-500">
              <span>Conclusão (ponderada pelo esforço)</span>
              <span className="font-medium text-navy-900">{crono.progresso}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-ardosia-100">
              <div className="h-full bg-ok" style={{ width: `${crono.progresso}%` }} />
            </div>
          </div>
        )}
        {vendidas !== null && vendidas > 0 && (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-ardosia-500">
              <span>Planejado sobre horas vendidas</span>
              <span className={p.horasPlanejadas > vendidas ? "font-medium text-critico" : ""}>{Math.round((p.horasPlanejadas / vendidas) * 100)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-ardosia-100">
              <div className={`h-full ${p.horasPlanejadas > vendidas ? "bg-critico" : "bg-navy-700"}`} style={{ width: `${Math.min(100, (p.horasPlanejadas / vendidas) * 100)}%` }} />
            </div>
          </div>
        )}
      </div>
      <Abas
        abas={[
          { href: base, rotulo: "Visão Geral" },
          { href: `${base}/pre-projeto`, rotulo: "Pré-Projeto" },
          { href: `${base}/backlog`, rotulo: "Backlog" },
          { href: `${base}/cronograma`, rotulo: "Cronograma" },
          { href: `${base}/linha-base`, rotulo: "Linha de base" },
          { href: `${base}/calendario`, rotulo: "Calendário" },
          { href: `${base}/operacional`, rotulo: "Operacional" },
          { href: `${base}/testes`, rotulo: "Testes Internos" },
          { href: `${base}/uat`, rotulo: "UAT" },
          { href: `${base}/deployment`, rotulo: "Deployment" },
          { href: `${base}/status`, rotulo: "Status Reports" },
          { href: `${base}/riscos`, rotulo: "Riscos" },
          { href: `${base}/equipe`, rotulo: "Equipe" },
          { href: `${base}/documentos`, rotulo: "Documentos" },
          { href: `${base}/historico`, rotulo: "Histórico" },
        ]}
      />
      {children}
    </>
  );
}
