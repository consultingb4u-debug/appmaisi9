import Link from "next/link";
import clsx from "clsx";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth/sessao";
import { pode } from "@/lib/auth/permissoes";
import { diffDias, formatarData, parseDia, somarDias } from "@/lib/domain/datas";
import { PRIORIDADE, STATUS_PROJETO, TIPO_PROJETO, TOM_PRIORIDADE, TOM_STATUS_PROJETO } from "@/lib/domain/rotulos";
import { rotuloSemana, semanaDe, semanasEntre } from "@/lib/domain/semanas";
import { listarPortfolio, type LinhaPortfolio } from "@/lib/services/portfolio";
import { Cabecalho, Cartao, LinkBotao, Selo, Vazio } from "@/components/ui";
import { ThOrdenavel } from "@/components/ordenavel";

export const metadata = { title: "Portfólio" };

const h = (n: number | null) => (n === null ? "—" : `${Math.round(n * 10) / 10}h`);

const ORDENS: Record<string, (p: LinhaPortfolio) => string | number> = {
  codigo: (p) => p.codigo,
  cliente: (p) => `${p.cliente.nome} ${p.nome}`,
  projeto: (p) => p.nome,
  status: (p) => p.status,
  prioridade: (p) => ["BAIXA", "MEDIA", "ALTA", "CRITICA"].indexOf(p.prioridade),
  gp: (p) => p.gp?.nome ?? "~",
  golive: (p) => p.dataGoLive?.getTime() ?? Number.MAX_SAFE_INTEGER,
  planejado: (p) => p.horasPlanejadas,
  proximas: (p) => p.horasProximas4,
};

export default async function PaginaPortfolio({ searchParams }: PageProps<"/portfolio">) {
  const usuario = await usuarioAtual();
  const sp = await searchParams;
  const p = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, typeof v === "string" && v ? v : undefined])) as Record<string, string | undefined>;
  const visao = p.visao === "linha" ? "linha" : "tabela";

  const [projetos, clientes, recursos] = await Promise.all([
    listarPortfolio({ ...p, de: parseDia(p.de), ate: parseDia(p.ate) }),
    db.cliente.findMany({ where: { projetos: { some: {} } }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    db.recurso.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);
  const ordem = ORDENS[p.ordem ?? ""] ?? ORDENS.cliente;
  projetos.sort((a, b) => {
    const [x, y] = [ordem(a), ordem(b)];
    const r = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "pt-BR");
    return p.dir === "desc" ? -r : r;
  });
  const temFiltro = ["q", "cliente", "tipo", "gp", "recurso", "prioridade", "de", "ate"].some((k) => p[k]) || (p.status && p.status !== "ativos");

  return (
    <>
      <Cabecalho
        titulo="Portfólio"
        subtitulo={`${projetos.length} projeto(s)${!p.status || p.status === "ativos" ? " ativos" : ""}`}
        acoes={
          <>
            <div className="flex rounded-md border border-ardosia-200 bg-white p-0.5 text-sm">
              {(["tabela", "linha"] as const).map((v) => (
                <Link key={v} href={`/portfolio?${new URLSearchParams({ ...Object.fromEntries(Object.entries(p).filter(([, x]) => x) as [string, string][]), visao: v })}`} className={clsx("rounded px-3 py-1", visao === v ? "bg-navy-900 text-white" : "text-ardosia-600")}>
                  {v === "tabela" ? "Tabela" : "Linha do tempo"}
                </Link>
              ))}
            </div>
            {pode(usuario.perfil, "editar", "PORTFOLIO") && <LinkBotao href="/portfolio/novo">+ Novo projeto</LinkBotao>}
          </>
        }
      />

      <form className="mb-4 grid gap-2 rounded-lg border border-ardosia-100 bg-white p-3 sm:grid-cols-4 lg:grid-cols-9">
        <input type="hidden" name="visao" value={visao} />
        <input name="q" defaultValue={p.q} placeholder="Buscar projeto, cliente, nota…" className="campo py-1.5 sm:col-span-2" />
        <select name="cliente" defaultValue={p.cliente ?? ""} className="campo py-1.5">
          <option value="">Cliente</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={p.status ?? "ativos"} className="campo py-1.5">
          <option value="ativos">Status: ativos</option>
          <option value="todos">Todos os status</option>
          {Object.entries(STATUS_PROJETO).map(([v, r]) => (
            <option key={v} value={v}>
              {r}
            </option>
          ))}
        </select>
        <select name="gp" defaultValue={p.gp ?? ""} className="campo py-1.5">
          <option value="">GP</option>
          {recursos.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nome}
            </option>
          ))}
        </select>
        <select name="recurso" defaultValue={p.recurso ?? ""} className="campo py-1.5">
          <option value="">Recurso</option>
          {recursos.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nome}
            </option>
          ))}
        </select>
        <select name="prioridade" defaultValue={p.prioridade ?? ""} className="campo py-1.5">
          <option value="">Prioridade</option>
          {Object.entries(PRIORIDADE).map(([v, r]) => (
            <option key={v} value={v}>
              {r}
            </option>
          ))}
        </select>
        <select name="tipo" defaultValue={p.tipo ?? ""} className="campo py-1.5">
          <option value="">Tipo</option>
          {Object.entries(TIPO_PROJETO).map(([v, r]) => (
            <option key={v} value={v}>
              {r}
            </option>
          ))}
        </select>
        <div className="flex gap-2 sm:col-span-4 lg:col-span-9">
          <label className="flex items-center gap-2 text-xs text-ardosia-600">
            Período
            <input type="date" name="de" defaultValue={p.de} className="campo w-auto py-1" />
            a
            <input type="date" name="ate" defaultValue={p.ate} className="campo w-auto py-1" />
          </label>
          <span className="ml-auto flex gap-2">
            {temFiltro && (
              <Link href={`/portfolio?visao=${visao}`} className="self-center text-sm text-ardosia-600 hover:underline">
                Limpar
              </Link>
            )}
            <button className="rounded-md bg-navy-900 px-4 py-1.5 text-sm text-white">Filtrar</button>
          </span>
        </div>
      </form>

      {projetos.length === 0 ? (
        <Vazio>
          Nenhum projeto encontrado.{" "}
          {pode(usuario.perfil, "editar", "IMPORTACAO") && (
            <Link href="/admin/importacao" className="underline">
              Importar o CTRL-003
            </Link>
          )}
        </Vazio>
      ) : visao === "tabela" ? (
        <Cartao>
          <div className="-m-4 overflow-x-auto">
            <table className="tabela">
              <thead>
                <tr>
                  <ThOrdenavel campo="cliente" rotulo="Cliente · Projeto" params={p} base="/portfolio" />
                  <th>Tipo</th>
                  <ThOrdenavel campo="status" rotulo="Status" params={p} base="/portfolio" />
                  <ThOrdenavel campo="prioridade" rotulo="Prioridade" params={p} base="/portfolio" />
                  <ThOrdenavel campo="gp" rotulo="GP" params={p} base="/portfolio" />
                  <th className="text-right">Equipe</th>
                  <ThOrdenavel campo="golive" rotulo="Go Live" params={p} base="/portfolio" />
                  <th className="text-right">Vendidas</th>
                  <ThOrdenavel campo="planejado" rotulo="Planejado" params={p} base="/portfolio" className="text-right" />
                  <ThOrdenavel campo="proximas" rotulo="Próx. 4 sem." params={p} base="/portfolio" className="text-right" />
                </tr>
              </thead>
              <tbody>
                {projetos.map((x) => (
                  <tr key={x.id}>
                    <td>
                      <div className="text-xs text-ardosia-500">
                        {x.cliente.nome} · {x.codigo}
                      </div>
                      <Link href={`/projetos/${x.id}`} className="font-medium text-navy-800 hover:underline">
                        {x.nome}
                      </Link>
                    </td>
                    <td className="text-ardosia-600">{TIPO_PROJETO[x.tipo]}</td>
                    <td>
                      <Selo tom={TOM_STATUS_PROJETO[x.status]}>{STATUS_PROJETO[x.status]}</Selo>
                    </td>
                    <td>
                      <Selo tom={TOM_PRIORIDADE[x.prioridade]}>{PRIORIDADE[x.prioridade]}</Selo>
                    </td>
                    <td className="whitespace-nowrap">{x.gp?.nome ?? <span className="text-ardosia-400">—</span>}</td>
                    <td className="text-right tabular-nums">{x.equipe}</td>
                    <td className="whitespace-nowrap tabular-nums">{x.dataGoLive ? formatarData(x.dataGoLive) : <span className="text-ardosia-400">—</span>}</td>
                    <td className="text-right tabular-nums">{h(x.horasVendidas)}</td>
                    <td className="text-right tabular-nums">{h(x.horasPlanejadas)}</td>
                    <td className="text-right font-medium tabular-nums">{x.horasProximas4 ? h(x.horasProximas4) : <span className="font-normal text-ardosia-400">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Cartao>
      ) : (
        <LinhaDoTempo projetos={projetos} />
      )}
    </>
  );
}

/** Gantt do portfólio: barra do período (datas do projeto ou semanas alocadas) e marco de Go Live. */
function LinhaDoTempo({ projetos }: { projetos: LinhaPortfolio[] }) {
  const atual = semanaDe(new Date());
  const inicio = somarDias(atual.inicio, -14);
  const semanas = semanasEntre(inicio, somarDias(inicio, 7 * 18 - 1));
  const fim = semanas.at(-1)!.fim;
  const total = diffDias(fim, inicio) + 1;
  const pos = (d: Date) => Math.min(100, Math.max(0, (diffDias(d, inicio) / total) * 100));
  const hoje = pos(new Date());

  return (
    <Cartao>
      <div className="-m-4 overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="flex border-b border-ardosia-100 bg-fundo text-[10px] font-medium text-ardosia-500">
            <div className="w-64 shrink-0 px-3 py-2">Projeto</div>
            <div className="flex flex-1">
              {semanas.map((s) => (
                <div key={s.id} className={clsx("flex-1 border-l border-ardosia-100 py-2 text-center", s.id === atual.id && "bg-destaque/10 text-destaque-escuro")}>
                  {rotuloSemana(s).slice(0, 3)}
                </div>
              ))}
            </div>
          </div>
          {projetos.map((p) => {
            const temPeriodo = p.inicio && p.fim;
            const esq = temPeriodo ? pos(p.inicio!) : 0;
            const larg = temPeriodo ? Math.max(1, pos(p.fim!) - esq) : 0;
            return (
              <div key={p.id} className="flex items-center border-b border-ardosia-100 text-sm hover:bg-fundo/60">
                <div className="w-64 shrink-0 truncate px-3 py-2">
                  <Link href={`/projetos/${p.id}`} className="hover:underline">
                    <span className="text-ardosia-500">{p.cliente.nome} · </span>
                    {p.nome}
                  </Link>
                </div>
                <div className="relative h-9 flex-1">
                  <div className="absolute inset-y-0 w-px bg-destaque/60" style={{ left: `${hoje}%` }} />
                  {temPeriodo ? (
                    <div
                      className={clsx("absolute top-2.5 h-4 rounded", p.status === "BLOQUEADO" ? "bg-critico/70" : p.dataKickoff ? "bg-navy-700" : "bg-ardosia-400")}
                      style={{ left: `${esq}%`, width: `${larg}%` }}
                      title={`${formatarData(p.inicio)} a ${formatarData(p.fim)}${p.dataKickoff ? "" : " (pelas semanas alocadas)"}`}
                    />
                  ) : (
                    <span className="absolute top-2 left-2 text-xs text-ardosia-400">sem datas nem alocação</span>
                  )}
                  {p.dataGoLive && <div className="absolute top-1.5 h-3 w-3 -translate-x-1/2 rotate-45 bg-destaque" style={{ left: `${pos(p.dataGoLive)}%`, top: "12px" }} title={`Go Live ${formatarData(p.dataGoLive)}`} />}
                </div>
              </div>
            );
          })}
          <div className="flex gap-4 px-3 py-2 text-xs text-ardosia-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-4 rounded bg-navy-700" /> datas do projeto
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-4 rounded bg-ardosia-400" /> período pelas semanas alocadas
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rotate-45 bg-destaque" /> Go Live
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-px bg-destaque" /> hoje
            </span>
          </div>
        </div>
      </div>
    </Cartao>
  );
}
