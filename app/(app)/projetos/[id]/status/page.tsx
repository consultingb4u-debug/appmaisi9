import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth/sessao";
import { podeEditarProjeto } from "@/lib/auth/escopo";
import { formatarData } from "@/lib/domain/datas";
import { sugerirStatusExecutivo, type Indicadores } from "@/lib/domain/status";
import { DECISAO_GO, STATUS_EXECUTIVO } from "@/lib/domain/rotulos";
import { Campo, Cartao, opcoes, Selo, valorData, Vazio } from "@/components/ui";
import { BotaoAcao, Formulario } from "@/components/formulario";
import { BotaoImprimir } from "@/components/botao-imprimir";
import { atualizarIndicadores, excluirStatusReport, novoStatusReport, publicarStatusReport, salvarStatusReport } from "../../status-acoes";

const COR = { VERDE: "bg-ok", AMARELO: "bg-alerta", VERMELHO: "bg-critico" } as const;

function Farol({ s }: { s: keyof typeof COR }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium">
      <span className={clsx("h-3 w-3 rounded-full", COR[s])} />
      {STATUS_EXECUTIVO[s]}
    </span>
  );
}

/** Quadro com a fotografia dos indicadores gravada no report. */
function QuadroIndicadores({ i }: { i: Partial<Indicadores> }) {
  if (!i.geradoEm) return <Vazio>Indicadores ainda não calculados.</Vazio>;
  const h = (n: number | null | undefined) => (n === null || n === undefined ? "—" : `${n}h`);
  const linhas: [string, string, boolean?][] = [
    ["Progresso real × planejado", i.progressoPlanejado == null ? `${i.progresso ?? 0}% · sem linha de base` : `${i.progresso ?? 0}% · ${i.progressoPlanejado}%`, i.progressoPlanejado != null && (i.progresso ?? 0) < i.progressoPlanejado],
    ["Fase atual", i.faseAtual ?? "—"],
    ["Go Live", formatarData(i.goLive ? new Date(i.goLive) : null)],
    ["Horas vendidas", h(i.horas?.vendidas)],
    ["Planejado", h(i.horas?.planejadas)],
    ["Realizado", h(i.horas?.realizadas)],
    ["Forecast", h(i.horas?.forecast), !!(i.horas?.vendidas && i.horas.forecast && i.horas.forecast > i.horas.vendidas)],
    ["Atividades concluídas", `${i.atividades?.concluidas ?? 0} de ${i.atividades?.total ?? 0}`],
    ["Atividades atrasadas", String(i.atividades?.atrasadas ?? 0), (i.atividades?.atrasadas ?? 0) > 0],
    ["Pendências vencidas", String(i.pendenciasVencidas ?? 0), (i.pendenciasVencidas ?? 0) > 0],
    ["Riscos abertos (altos)", `${i.riscosAbertos ?? 0} (${i.riscosAltos ?? 0})`, (i.riscosAltos ?? 0) > 0],
    ["Change requests", String(i.changeRequests ?? 0)],
    ["Defeitos abertos (graves)", `${i.defeitosAbertos ?? 0} (${i.defeitosGraves ?? 0})`, (i.defeitosGraves ?? 0) > 0],
    ["Testes internos aprovados", i.testesInternos?.total ? `${i.testesInternos.aprovado}% de ${i.testesInternos.total}` : "—"],
    ["UAT aceito", i.uat?.total ? `${i.uat.aprovado}% de ${i.uat.total}` : "—"],
    ["Prontidão Go Live", i.prontidaoGoLive ? `${i.prontidaoGoLive.percentual}% · ${DECISAO_GO[i.prontidaoGoLive.sugestao as keyof typeof DECISAO_GO]}` : "—", (i.prontidaoGoLive?.bloqueios ?? 0) > 0],
    ["Complexidade", i.complexidade ?? "não avaliada"],
  ];
  return (
    <div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
        {linhas.map(([r, v, alerta]) => (
          <div key={r} className="flex justify-between gap-2 border-b border-ardosia-100 py-1">
            <dt className="text-ardosia-500">{r}</dt>
            <dd className={clsx("text-right font-medium tabular-nums", alerta && "text-critico")}>{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-ardosia-400">Calculados em {new Date(i.geradoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.</p>
    </div>
  );
}

type CampoTexto = "resumo" | "entregasConcluidas" | "proximasEntregas" | "pontosAtencao" | "decisoesNecessarias";
const TEXTOS: [CampoTexto, string][] = [
  ["resumo", "Resumo executivo"],
  ["entregasConcluidas", "Principais entregas concluídas"],
  ["proximasEntregas", "Próximas entregas"],
  ["pontosAtencao", "Pontos de atenção · riscos"],
  ["decisoesNecessarias", "Decisões necessárias"],
];

export default async function StatusReports({ params, searchParams }: PageProps<"/projetos/[id]/status">) {
  const { id } = await params;
  const sp = await searchParams;
  const usuario = await usuarioAtual();
  const editavel = await podeEditarProjeto(usuario, id);
  const projeto = await db.projeto.findUnique({ where: { id }, select: { id: true } });
  if (!projeto) notFound();
  const reports = await db.statusReport.findMany({ where: { projetoId: id }, orderBy: [{ dataReferencia: "desc" }, { criadoEm: "desc" }] });
  const sel = reports.find((r) => r.id === sp.r) ?? reports[0] ?? null;
  const base = `/projetos/${id}/status`;
  const temRascunho = reports.some((r) => !r.publicado);
  const ind = (sel?.indicadores ?? {}) as Partial<Indicadores>;
  const sugestao = sel && ind.geradoEm ? sugerirStatusExecutivo(ind as Indicadores) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
      <Cartao titulo="Histórico" className="nao-imprimir h-fit" acoes={editavel && !temRascunho && <BotaoAcao acao={novoStatusReport.bind(null, id)} variante="secundario">+ Novo</BotaoAcao>}>
        {reports.length === 0 ? (
          <p className="text-sm text-ardosia-500">Nenhum status report. “+ Novo” gera um rascunho com os indicadores de hoje.</p>
        ) : (
          <ul className="-m-2 space-y-1">
            {reports.map((r) => (
              <li key={r.id}>
                <Link href={`${base}?r=${r.id}`} className={clsx("flex items-center justify-between gap-2 rounded px-2 py-1.5 text-sm", r.id === sel?.id ? "bg-fundo font-medium" : "hover:bg-fundo")}>
                  <span className="flex items-center gap-2">
                    <span className={clsx("h-2.5 w-2.5 rounded-full", COR[r.statusExecutivo])} />
                    {formatarData(r.dataReferencia)}
                  </span>
                  {!r.publicado && <Selo tom="alerta">Rascunho</Selo>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Cartao>

      {!sel ? (
        <Vazio>Os status reports ficam aqui, com o histórico e os indicadores da época.</Vazio>
      ) : (
        <div className="space-y-6">
          <Cartao
            titulo={
              <span className="flex items-center gap-3">
                Status report de {formatarData(sel.dataReferencia)}
                {sel.publicado ? <Selo tom="navy">Publicado</Selo> : <Selo tom="alerta">Rascunho</Selo>}
              </span>
            }
            acoes={
              <span className="nao-imprimir flex items-center gap-2">
                <BotaoImprimir />
                {editavel && !sel.publicado && (
                  <>
                    <BotaoAcao acao={atualizarIndicadores.bind(null, sel.id)} variante="secundario">
                      Atualizar indicadores
                    </BotaoAcao>
                    <BotaoAcao acao={publicarStatusReport.bind(null, sel.id)} variante="secundario" confirmar="Publicar? O report fica congelado e o status executivo do projeto é atualizado.">
                      Publicar
                    </BotaoAcao>
                    <BotaoAcao acao={excluirStatusReport.bind(null, sel.id)} confirmar="Excluir este rascunho?">
                      Excluir
                    </BotaoAcao>
                  </>
                )}
              </span>
            }
          >
            <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span>
                Status executivo: <Farol s={sel.statusExecutivo} />
              </span>
              <span className="text-ardosia-500">
                Período: {formatarData(sel.periodoInicio)} a {formatarData(sel.periodoFim)}
              </span>
              {sel.faseAtual && <span className="text-ardosia-500">Fase: {sel.faseAtual}</span>}
              {sel.publicadoEm && <span className="text-ardosia-500">Publicado em {sel.publicadoEm.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</span>}
            </div>
            <QuadroIndicadores i={ind} />
            {sel.publicado && (
              <div className="mt-6 space-y-4">
                {TEXTOS.map(([k, r]) =>
                  sel[k] ? (
                    <section key={k}>
                      <h3 className="mb-1 text-xs font-semibold tracking-wide text-ardosia-500 uppercase">{r}</h3>
                      <p className="text-sm whitespace-pre-line">{sel[k]}</p>
                    </section>
                  ) : null,
                )}
              </div>
            )}
          </Cartao>

          {!sel.publicado && (
            <Cartao titulo="Conteúdo" className="nao-imprimir">
              {sugestao && sugestao !== sel.statusExecutivo && (
                <p className="mb-3 text-sm text-ardosia-600">
                  Pelos indicadores, a sugestão é <Farol s={sugestao} />. O GP decide.
                </p>
              )}
              <Formulario key={sel.id} acao={salvarStatusReport.bind(null, sel.id)} somenteLeitura={!editavel} rotuloEnviar="Salvar rascunho">
                <div className="grid gap-3 sm:grid-cols-4">
                  <Campo rotulo="Data de referência">
                    <input name="dataReferencia" type="date" defaultValue={valorData(sel.dataReferencia)} className="campo" />
                  </Campo>
                  <Campo rotulo="Período: de">
                    <input name="periodoInicio" type="date" defaultValue={valorData(sel.periodoInicio)} className="campo" />
                  </Campo>
                  <Campo rotulo="até">
                    <input name="periodoFim" type="date" defaultValue={valorData(sel.periodoFim)} className="campo" />
                  </Campo>
                  <Campo rotulo="Status executivo">
                    <select name="statusExecutivo" defaultValue={sel.statusExecutivo} className="campo">
                      {opcoes(STATUS_EXECUTIVO)}
                    </select>
                  </Campo>
                  <Campo rotulo="Fase atual">
                    <input name="faseAtual" defaultValue={sel.faseAtual ?? ""} className="campo" />
                  </Campo>
                  {TEXTOS.map(([k, r]) => (
                    <Campo key={k} rotulo={r} className="sm:col-span-4">
                      <textarea name={k} rows={k === "resumo" ? 4 : 3} defaultValue={sel[k] ?? ""} className="campo" />
                    </Campo>
                  ))}
                </div>
              </Formulario>
            </Cartao>
          )}
        </div>
      )}
    </div>
  );
}
