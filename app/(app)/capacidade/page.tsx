import Link from "next/link";
import clsx from "clsx";
import { VisoesSalvas } from "@/components/visoes-salvas";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth/sessao";
import { formatarData } from "@/lib/domain/datas";
import { rotuloSemana, semanaDe } from "@/lib/domain/semanas";
import { cargaPorSemana, COR_FAIXA, formatarUtilizacao, ROTULO_FAIXA } from "@/lib/services/capacidade";
import { Cartao, LinkBotao, Selo, Vazio, BotaoExportar } from "@/components/ui";
import { janelaDeSemanas, NavegadorSemanas } from "@/components/navegador-semanas";

export const metadata = { title: "Mapa de carga" };

export default async function MapaDeCarga({ searchParams }: PageProps<"/capacidade">) {
  const usuario = await usuarioAtual();
  const sp = await searchParams;
  const p = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, typeof v === "string" && v ? v : undefined])) as Record<string, string | undefined>;
  const semanas = janelaDeSemanas(p.de, p.n);
  const atual = semanaDe(new Date()).id;

  const areas = (await db.recurso.findMany({ where: { ativo: true, area: { not: null } }, distinct: ["area"], select: { area: true } })).map((a) => a.area!);
  const recursos = await db.recurso.findMany({ where: { ativo: true, ...(p.area && { area: p.area }) }, orderBy: { nome: "asc" }, select: { id: true, nome: true, cargo: true } });
  const carga = await cargaPorSemana(recursos.map((r) => r.id), semanas);

  const visiveis = p.criticos
    ? recursos.filter((r) => semanas.some((s) => ["ATENCAO", "SOBRECARREGADO"].includes(carga.get(r.id)!.get(s.id)!.faixa ?? "")))
    : recursos;
  const sel = p.r && p.s ? { recurso: recursos.find((r) => r.id === p.r), semana: semanas.find((s) => s.id === p.s), c: carga.get(p.r)?.get(p.s) } : null;
  const link = (extra: Record<string, string | undefined>) => `/capacidade?${new URLSearchParams(Object.entries({ ...p, ...extra }).filter(([, v]) => v) as [string, string][])}`;

  const totalCap = (sid: string) => visiveis.reduce((t, r) => t + carga.get(r.id)!.get(sid)!.capacidade.liquida, 0);
  const totalPlan = (sid: string) => visiveis.reduce((t, r) => t + carga.get(r.id)!.get(sid)!.planejado, 0);

  return (
    <div className="space-y-6">
      <VisoesSalvas tela="capacidade" base="/capacidade" params={p} usuario={usuario} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <NavegadorSemanas base="/capacidade" params={p} semanas={semanas} />
          <BotaoExportar href={`/exportar/capacidade?${new URLSearchParams(Object.entries(p).filter(([k, x]) => x && ["de", "n", "area"].includes(k)) as [string, string][])}`} rotulo="Excel" />
        </div>
        <form className="flex items-center gap-2 text-sm">
          {Object.entries(p)
            .filter(([k, v]) => v && ["de", "n"].includes(k))
            .map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
          {areas.length > 0 && (
            <select name="area" defaultValue={p.area ?? ""} className="campo w-auto py-1.5">
              <option value="">Todas as áreas</option>
              {areas.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          )}
          <label className="flex items-center gap-1.5 text-ardosia-600">
            <input type="checkbox" name="criticos" value="1" defaultChecked={!!p.criticos} /> só ≥ 85%
          </label>
          <button className="rounded-md bg-navy-900 px-3 py-1.5 text-white">Aplicar</button>
        </form>
      </div>

      <div className={clsx("grid gap-6", sel?.c && "xl:grid-cols-[1fr_380px]")}>
        <Cartao>
          {visiveis.length === 0 ? (
            <Vazio>Nenhum recurso neste filtro.</Vazio>
          ) : (
            <div className="-m-4 overflow-x-auto">
              <table className="tabela">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-fundo">Recurso</th>
                    {semanas.map((s) => (
                      <th key={s.id} className={clsx("text-center", s.id === atual && "!text-destaque-escuro")}>
                        {rotuloSemana(s)}
                        <div className="font-normal normal-case">{formatarData(s.inicio).slice(0, 5)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visiveis.map((r) => (
                    <tr key={r.id}>
                      <td className="sticky left-0 bg-white whitespace-nowrap">
                        <Link href={`/recursos/${r.id}`} className="font-medium text-navy-800 hover:underline">
                          {r.nome}
                        </Link>
                        {r.cargo && <div className="text-xs text-ardosia-500">{r.cargo}</div>}
                      </td>
                      {semanas.map((s) => {
                        const c = carga.get(r.id)!.get(s.id)!;
                        const ativo = p.r === r.id && p.s === s.id;
                        const reducao = c.capacidade.horasFeriado + c.capacidade.horasIndisponivel;
                        return (
                          <td key={s.id} className="p-1 text-center">
                            <Link
                              href={link({ r: r.id, s: s.id })}
                              scroll={false}
                              className={clsx(
                                "block rounded px-1 py-1.5 tabular-nums transition hover:ring-2 hover:ring-navy-700/30",
                                c.planejado > 0 && c.faixa ? COR_FAIXA[c.faixa] : "text-ardosia-300",
                                ativo && "ring-2 ring-navy-900",
                              )}
                              title={`${c.planejado}h planejadas / ${c.capacidade.liquida}h líquidas`}
                            >
                              <span className="block text-sm font-semibold">{c.planejado > 0 ? formatarUtilizacao(c.utilizacao) : "—"}</span>
                              <span className="block text-[10px] opacity-80">
                                {c.planejado}/{c.capacidade.liquida}h{reducao > 0 && " ✦"}
                              </span>
                            </Link>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="text-xs font-semibold">
                    <td className="sticky left-0 bg-white px-3 py-2 text-ardosia-600">Equipe</td>
                    {semanas.map((s) => (
                      <td key={s.id} className="px-1 py-2 text-center tabular-nums">
                        {formatarUtilizacao(totalCap(s.id) ? totalPlan(s.id) / totalCap(s.id) : null)}
                        <div className="font-normal text-ardosia-500">
                          {totalPlan(s.id)}/{totalCap(s.id)}h
                        </div>
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-2 text-xs text-ardosia-500">
            {(Object.keys(ROTULO_FAIXA) as (keyof typeof ROTULO_FAIXA)[]).map((f) => (
              <span key={f} className={clsx("rounded px-1.5", COR_FAIXA[f])}>
                {ROTULO_FAIXA[f]}
              </span>
            ))}
            <span>· ✦ semana com feriado ou ausência · clique numa célula para ver os projetos</span>
          </div>
        </Cartao>

        {sel?.c && sel.recurso && sel.semana && (
          <Cartao
            titulo={`${sel.recurso.nome} · ${rotuloSemana(sel.semana)}`}
            acoes={
              <Link href={link({ r: undefined, s: undefined })} scroll={false} className="text-sm text-ardosia-500 hover:text-navy-900">
                ✕
              </Link>
            }
          >
            <div className="mb-4 text-xs text-ardosia-500">
              {formatarData(sel.semana.inicio)} a {formatarData(sel.semana.fim)}
            </div>
            <dl className="mb-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-ardosia-600">Capacidade semanal</dt>
                <dd className="tabular-nums">{sel.c.capacidade.bruta}h</dd>
              </div>
              {sel.c.capacidade.horasFeriado > 0 && (
                <div className="flex justify-between">
                  <dt className="text-ardosia-600">− Feriados ({sel.c.capacidade.diasFeriado} dia)</dt>
                  <dd className="tabular-nums">{sel.c.capacidade.horasFeriado}h</dd>
                </div>
              )}
              {sel.c.capacidade.horasIndisponivel > 0 && (
                <div className="flex justify-between">
                  <dt className="text-ardosia-600">− Ausências aprovadas</dt>
                  <dd className="tabular-nums">{sel.c.capacidade.horasIndisponivel}h</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-ardosia-100 pt-1 font-medium">
                <dt>Capacidade líquida</dt>
                <dd className="tabular-nums">{sel.c.capacidade.liquida}h</dd>
              </div>
              <div className="flex justify-between font-medium">
                <dt>Planejado</dt>
                <dd className="tabular-nums">{sel.c.planejado}h</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ardosia-600">Utilização</dt>
                <dd>{sel.c.faixa ? <Selo tom={sel.c.faixa === "SOBRECARREGADO" ? "critico" : sel.c.faixa === "ATENCAO" ? "alerta" : sel.c.faixa === "ADEQUADO" ? "ok" : "livre"}>{formatarUtilizacao(sel.c.utilizacao)} · {ROTULO_FAIXA[sel.c.faixa]}</Selo> : "—"}</dd>
              </div>
            </dl>
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-ardosia-500 uppercase">Projetos nesta semana</h3>
            {sel.c.projetos.length === 0 ? (
              <Vazio>Sem alocação.</Vazio>
            ) : (
              <ul className="space-y-2 text-sm">
                {sel.c.projetos.map((pr) => (
                  <li key={pr.projetoId} className="rounded-md bg-fundo px-3 py-2">
                    <div className="flex justify-between gap-2">
                      <Link href={`/projetos/${pr.projetoId}`} className="font-medium hover:underline">
                        {pr.cliente} · {pr.projeto}
                      </Link>
                      <span className="font-semibold tabular-nums">{pr.horas}h</span>
                    </div>
                    {pr.observacao && <div className="mt-0.5 text-xs text-ardosia-500">{pr.observacao}</div>}
                  </li>
                ))}
              </ul>
            )}
            <LinkBotao href={`/capacidade/planejamento?recurso=${sel.recurso.id}&de=${sel.semana.id}`} variante="secundario" className="mt-4 w-full">
              Ajustar planejamento de {sel.recurso.nome.split(" ")[0]}
            </LinkBotao>
          </Cartao>
        )}
      </div>
    </div>
  );
}
