import Link from "next/link";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth/sessao";
import { formatarData, somarDias } from "@/lib/domain/datas";
import { rotuloSemana, semanaDe, semanasEntre } from "@/lib/domain/semanas";
import { STATUS_ATIVOS, STATUS_PROJETO, TOM_STATUS_PROJETO } from "@/lib/domain/rotulos";
import { cargaPorSemana, COR_FAIXA, formatarUtilizacao, ROTULO_FAIXA } from "@/lib/services/capacidade";
import { Cabecalho, Cartao, Indicador, Selo, Vazio } from "@/components/ui";
import clsx from "clsx";

const ENTREGAS = [
  { n: 1, titulo: "Fundação", itens: "Login Microsoft 365, perfis, cadastros, calendário, auditoria", feito: true },
  { n: 2, titulo: "Portfólio e projetos", itens: "Portfólio, página do projeto, importação do CTRL-003", feito: true },
  { n: 3, titulo: "Capacidade", itens: "Planejamento semanal editável, indisponibilidades, mapa de carga", feito: true },
  { n: 4, titulo: "Cronograma", itens: "Backlog, cronograma, Gantt, rateio automático, importação do CTRL-001" },
  { n: 5, titulo: "Execução", itens: "Pré-projeto, complexidade, RAID, testes, UAT, deployment" },
  { n: 6, titulo: "Status e dashboard", itens: "Status reports, documentos, dashboard executivo final" },
];

export default async function Inicio({ searchParams }: PageProps<"/">) {
  const usuario = await usuarioAtual();
  const { aviso } = await searchParams;
  const atual = semanaDe(new Date());
  const semanas = semanasEntre(atual.inicio, somarDias(atual.inicio, 7 * 3));
  const hoje = atual.inicio;

  const [recursos, projetos] = await Promise.all([
    db.recurso.findMany({ where: { ativo: true }, select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    db.projeto.findMany({
      where: { arquivadoEm: null },
      select: {
        id: true,
        nome: true,
        status: true,
        dataGoLiveAlvo: true,
        dataGoLiveReal: true,
        cliente: { select: { nome: true } },
        _count: { select: { alocacoes: { where: { semana: { inicio: { gte: hoje } } } } } },
      },
    }),
  ]);
  const carga = await cargaPorSemana(recursos.map((r) => r.id), semanas);
  const daSemana = (sid: string) => recursos.map((r) => ({ recurso: r, c: carga.get(r.id)!.get(sid)! }));
  const semanaAtual = daSemana(atual.id);
  const capLiquida = semanaAtual.reduce((t, x) => t + x.c.capacidade.liquida, 0);
  const planejado = semanaAtual.reduce((t, x) => t + x.c.planejado, 0);
  const sobrecarregados = semanaAtual.filter((x) => x.c.faixa === "SOBRECARREGADO").sort((a, b) => (b.c.utilizacao ?? 0) - (a.c.utilizacao ?? 0));
  const disponiveis = semanaAtual.filter((x) => x.c.faixa === "DISPONIVEL" || (x.c.faixa === null && x.c.capacidade.liquida > 0));

  const ativos = projetos.filter((p) => STATUS_ATIVOS.includes(p.status));
  const porStatus = Object.entries(STATUS_PROJETO)
    .map(([s, r]) => ({ s: s as keyof typeof STATUS_PROJETO, r, n: projetos.filter((p) => p.status === s).length }))
    .filter((x) => x.n > 0);
  const limiteGoLive = somarDias(hoje, 45);
  const goLives = projetos
    .map((p) => ({ ...p, goLive: p.dataGoLiveReal ?? p.dataGoLiveAlvo }))
    .filter((p) => p.goLive && p.goLive >= hoje && p.goLive <= limiteGoLive)
    .sort((a, b) => a.goLive!.getTime() - b.goLive!.getTime());
  const semPlanejamento = ativos.filter((p) => p._count.alocacoes === 0);

  return (
    <>
      <Cabecalho titulo={`Olá, ${usuario.nome.split(" ")[0]}`} subtitulo={`Semana ${rotuloSemana(atual)} · ${formatarData(atual.inicio)} a ${formatarData(atual.fim)}`} />
      {aviso === "sem-permissao" && (
        <div className="mb-6 rounded-md border border-alerta/40 bg-alerta/10 px-4 py-3 text-sm text-[#8a6a00]">Seu perfil não tem acesso à página solicitada. Fale com um administrador se precisar.</div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Indicador rotulo="Projetos ativos" valor={ativos.length} href="/portfolio" />
        <Indicador rotulo="Bloqueados" valor={projetos.filter((p) => p.status === "BLOQUEADO").length} href="/portfolio?status=BLOQUEADO" tom={projetos.some((p) => p.status === "BLOQUEADO") ? "critico" : "navy"} />
        <Indicador rotulo={`Utilização ${rotuloSemana(atual)}`} valor={formatarUtilizacao(capLiquida ? planejado / capLiquida : null)} detalhe={`${planejado}h planejadas de ${capLiquida}h líquidas`} href="/capacidade" />
        <Indicador rotulo="Sobrecarregados" valor={sobrecarregados.length} detalhe="acima de 100% nesta semana" tom={sobrecarregados.length ? "critico" : "ok"} href="/capacidade?criticos=1" />
        <Indicador rotulo="Disponíveis" valor={disponiveis.length} detalhe="abaixo de 50% nesta semana" tom="ok" href="/capacidade" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Cartao titulo="Carga da equipe — próximas 4 semanas">
          <div className="overflow-x-auto">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Recurso</th>
                  {semanas.map((s) => (
                    <th key={s.id} className="text-center">
                      {rotuloSemana(s)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recursos.map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap">
                      <Link href={`/recursos/${r.id}`} className="hover:underline">
                        {r.nome}
                      </Link>
                    </td>
                    {semanas.map((s) => {
                      const c = carga.get(r.id)!.get(s.id)!;
                      return (
                        <td key={s.id} className="p-1 text-center tabular-nums" title={c.projetos.map((p) => `${p.cliente} · ${p.projeto}: ${p.horas}h`).join("\n") || "sem alocação"}>
                          <span className={clsx("block rounded px-1.5 py-1 text-xs font-medium", c.faixa && c.planejado ? COR_FAIXA[c.faixa] : "text-ardosia-300")}>{c.planejado ? formatarUtilizacao(c.utilizacao) : "—"}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {(Object.keys(ROTULO_FAIXA) as (keyof typeof ROTULO_FAIXA)[]).map((f) => (
              <span key={f} className={clsx("rounded px-1.5", COR_FAIXA[f])}>
                {ROTULO_FAIXA[f]}
              </span>
            ))}
          </div>
        </Cartao>

        <div className="space-y-6">
          {sobrecarregados.length > 0 && (
            <Cartao titulo={`Sobrecarregados em ${rotuloSemana(atual)}`}>
              <ul className="space-y-3 text-sm">
                {sobrecarregados.map(({ recurso, c }) => (
                  <li key={recurso.id}>
                    <div className="flex items-center justify-between">
                      <Link href={`/capacidade?r=${recurso.id}&s=${atual.id}`} className="font-medium hover:underline">
                        {recurso.nome}
                      </Link>
                      <Selo tom="critico">
                        {formatarUtilizacao(c.utilizacao)} · {c.planejado}h / {c.capacidade.liquida}h
                      </Selo>
                    </div>
                    <div className="mt-0.5 text-xs text-ardosia-500">{c.projetos.map((p) => `${p.cliente} · ${p.projeto} ${p.horas}h`).join(" · ")}</div>
                  </li>
                ))}
              </ul>
            </Cartao>
          )}

          <Cartao titulo="Próximos Go Lives (45 dias)">
            {goLives.length === 0 ? (
              <Vazio>Nenhum Go Live com data nos próximos 45 dias. Datas são preenchidas no projeto (o CTRL-003 não as tinha).</Vazio>
            ) : (
              <ul className="space-y-2 text-sm">
                {goLives.map((p) => (
                  <li key={p.id} className="flex items-center gap-3">
                    <span className="w-12 font-medium tabular-nums">{formatarData(p.goLive).slice(0, 5)}</span>
                    <Link href={`/projetos/${p.id}`} className="hover:underline">
                      {p.cliente.nome} · {p.nome}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>

          <Cartao titulo="Projetos por status">
            {porStatus.length === 0 ? (
              <Vazio>Nenhum projeto cadastrado.</Vazio>
            ) : (
              <ul className="space-y-2 text-sm">
                {porStatus.map((x) => (
                  <li key={x.s} className="flex items-center gap-3">
                    <Link href={`/portfolio?status=${x.s}`} className="w-40">
                      <Selo tom={TOM_STATUS_PROJETO[x.s]}>{x.r}</Selo>
                    </Link>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-ardosia-100">
                      <div className="h-full bg-navy-700" style={{ width: `${(x.n / projetos.length) * 100}%` }} />
                    </div>
                    <span className="w-8 text-right tabular-nums">{x.n}</span>
                  </li>
                ))}
              </ul>
            )}
            {semPlanejamento.length > 0 && (
              <p className="mt-4 text-xs text-ardosia-500">
                <strong className="text-[#8a6a00]">{semPlanejamento.length} projeto(s) ativo(s) sem alocação futura:</strong> {semPlanejamento.map((p) => `${p.cliente.nome} · ${p.nome}`).join(", ")}
              </p>
            )}
          </Cartao>

          <Cartao titulo="Entregas do sistema">
            <ol className="space-y-2">
              {ENTREGAS.map((e) => (
                <li key={e.n} className="flex items-start gap-3 text-sm">
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${e.feito ? "bg-ok text-white" : "bg-ardosia-100 text-ardosia-600"}`}>{e.n}</span>
                  <div>
                    <span className="font-medium">{e.titulo}</span> {e.feito && <Selo tom="ok">disponível</Selo>}
                    <div className="text-xs text-ardosia-500">{e.itens}</div>
                  </div>
                </li>
              ))}
            </ol>
          </Cartao>
        </div>
      </div>
    </>
  );
}
