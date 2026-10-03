// Tela do projeto: cabeçalho editável, cronograma (CRUD com recursos e esforço), Gantt, Operacional e carga semanal.
declare const React: typeof import("react");
import type { AtividadeCalc, Calculo, Estado, ItemOp, Projeto, ProjetoCalc } from "./calculo";
import { janela } from "./calculo";
import type { Loja } from "./dados";
import { novoId } from "./dados";
import {
  coerenciaStatus,
  diffDias,
  FASE,
  FASES,
  itemAberto,
  itemVencido,
  parseDia,
  PREFIXO_OPERACIONAL,
  PRIORIDADE,
  proximoCodigo,
  rotuloSemana,
  SEVERIDADE,
  SITUACAO_PRAZO,
  STATUS_EXECUTIVO,
  STATUS_ITEM,
  STATUS_OPERACIONAL,
  STATUS_PROJETO,
  TIPO_OPERACIONAL,
  TIPO_PROJETO,
  type StatusItem,
} from "./dominio";
import { Barra, Botao, BotaoExcluir, CAMPO, Campo, Cartao, cx, dataBR, h, Opcoes, Painel, Selo, Vazio, type Tom } from "./ui";

const TOM_OP: Record<string, Tom> = { ABERTO: "alerta", EM_ANDAMENTO: "livre", AGUARDANDO: "alerta", BLOQUEADO: "critico", APROVADO: "ok", REPROVADO: "critico", FECHADO: "neutro", CANCELADO: "neutro" };
const TOM_SEV: Record<string, Tom> = { BAIXA: "ok", MEDIA: "alerta", ALTA: "destaque", CRITICA: "critico" };
const COR_EXEC: Record<string, string> = { VERDE: "bg-ok", AMARELO: "bg-alerta", VERMELHO: "bg-critico" };

type Props = { projeto: ProjetoCalc; estado: Estado; calc: Calculo; loja: Loja; voltar: () => void };

export function TelaProjeto({ projeto: p, estado, calc, loja, voltar }: Props) {
  const [aba, setAba] = React.useState<"cronograma" | "gantt" | "operacional" | "carga">("cronograma");
  const [editando, setEditando] = React.useState(false);
  const vendidas = p.horasVendidas;
  return (
    <div className="space-y-5">
      <nav className="text-xs text-ardosia-500">
        <button type="button" onClick={voltar} className="hover:text-navy-900 hover:underline">
          Portfólio
        </button>{" "}
        › {p.cliente}
      </nav>
      <section className="rounded-lg border border-ardosia-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-medium text-ardosia-500">
              {p.cliente} · {p.codigo}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-navy-900">{p.nome}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Selo tom={p.status === "BLOQUEADO" ? "critico" : p.status === "EM_ANDAMENTO" ? "ok" : "neutro"}>{STATUS_PROJETO[p.status as keyof typeof STATUS_PROJETO] ?? p.status}</Selo>
            <Selo tom={p.prioridade === "CRITICA" ? "critico" : p.prioridade === "ALTA" ? "alerta" : "livre"}>Prioridade {PRIORIDADE[p.prioridade as keyof typeof PRIORIDADE]}</Selo>
            {p.statusExecutivo && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-fundo px-2 py-0.5 text-xs font-medium">
                <span className={cx("h-2.5 w-2.5 rounded-full", COR_EXEC[p.statusExecutivo])} />
                {STATUS_EXECUTIVO[p.statusExecutivo as keyof typeof STATUS_EXECUTIVO]}
              </span>
            )}
            <Botao variante="secundario" pequeno onClick={() => setEditando(true)}>
              Editar projeto
            </Botao>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4 lg:grid-cols-7">
          {[
            ["GP", p.gp ?? "—"],
            ["Tipo", TIPO_PROJETO[p.tipo as keyof typeof TIPO_PROJETO] ?? p.tipo],
            ["Go Live", dataBR(p.goLive)],
            ["Horas vendidas", h(vendidas)],
            ["Previsto", h(p.previsto)],
            ["Realizado", h(p.realizado)],
            ["Forecast", h(p.forecast)],
          ].map(([r, v]) => (
            <div key={r}>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-ardosia-500">{r}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        {p.atividades.length > 0 && (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-ardosia-500">
              <span>Conclusão (ponderada pelo esforço)</span>
              <span className="font-medium text-navy-900">{p.progresso}%</span>
            </div>
            <Barra valor={p.progresso} />
          </div>
        )}
        {vendidas != null && vendidas > 0 && p.forecast > vendidas && <p className="mt-3 text-sm text-critico">Forecast {h(p.forecast)} acima das {h(vendidas)} vendidas.</p>}
      </section>

      <nav className="flex gap-1 overflow-x-auto border-b border-ardosia-200">
        {(
          [
            ["cronograma", `Cronograma (${p.atividades.length})`],
            ["gantt", "Gantt"],
            ["operacional", `Operacional (${estado.operacional.filter((o) => o.projetoId === p.id && itemAberto(o.status)).length})`],
            ["carga", "Carga semanal"],
          ] as const
        ).map(([k, r]) => (
          <button key={k} type="button" onClick={() => setAba(k)} className={cx("-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm", aba === k ? "border-destaque font-medium text-navy-900" : "border-transparent text-ardosia-600 hover:text-navy-900")}>
            {r}
          </button>
        ))}
      </nav>

      {aba === "cronograma" && <Cronograma p={p} estado={estado} loja={loja} />}
      {aba === "gantt" && <Gantt atividades={p.atividades} />}
      {aba === "operacional" && <Operacional p={p} estado={estado} loja={loja} />}
      {aba === "carga" && <CargaProjeto p={p} estado={estado} calc={calc} />}
      {editando && <FormProjeto projeto={estado.projetos.find((x) => x.id === p.id)!} estado={estado} loja={loja} aoFechar={() => setEditando(false)} />}
    </div>
  );
}

// ───────────────────────────── Projeto (novo e edição) ─────────────────────────────

export function FormProjeto({ projeto, estado, loja, aoFechar, aoCriar }: { projeto: Projeto | null; estado: Estado; loja: Loja; aoFechar: () => void; aoCriar?: (id: string) => void }) {
  const [f, setF] = React.useState<Projeto>(
    projeto ?? {
      id: novoId(),
      codigo: proximoCodigo("PRJ", estado.projetos.map((x) => x.codigo)).replace(/-(\d+)$/, (_, n) => `-${String(n).padStart(4, "0")}`),
      nome: "",
      clienteId: estado.clientes[0]?.id ?? "",
      gpId: estado.recursos.find((r) => r.nome === "Carlos Camargo")?.id ?? null,
      tipo: "PROJETO",
      status: "EM_ANDAMENTO",
      prioridade: "MEDIA",
      statusExecutivo: null,
      kickoff: null,
      goLive: null,
      horasVendidas: null,
      notas: null,
    },
  );
  const [novoCliente, setNovoCliente] = React.useState("");
  const [erro, setErro] = React.useState<string | null>(null);
  const set = (k: keyof Projeto, v: unknown) => setF((x) => ({ ...x, [k]: v }));
  const salvar = async () => {
    if (f.nome.trim().length < 2) return setErro("Dê um nome ao projeto.");
    let clienteId = f.clienteId;
    if (novoCliente.trim()) {
      clienteId = novoId();
      await loja.salvar("clientes", { id: clienteId, nome: novoCliente.trim() });
    }
    if (!clienteId) return setErro("Escolha ou cadastre o cliente.");
    await loja.salvar("projetos", { ...f, clienteId, nome: f.nome.trim() });
    aoFechar();
    if (!projeto) aoCriar?.(f.id);
  };
  const excluir = async () => {
    for (const a of estado.atividades.filter((x) => x.projetoId === f.id)) await loja.excluir("atividades", a.id);
    for (const o of estado.operacional.filter((x) => x.projetoId === f.id)) await loja.excluir("operacional", o.id);
    for (const a of estado.alocacoes.filter((x) => x.projetoId === f.id)) await loja.excluir("alocacoes", a.id);
    await loja.excluir("projetos", f.id);
    aoFechar();
  };
  return (
    <Painel
      titulo={projeto ? `Editar ${projeto.codigo}` : "Novo projeto"}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao onClick={salvar}>{projeto ? "Salvar" : "Criar projeto"}</Botao>
          {erro && <span className="text-sm text-critico">{erro}</span>}
          {projeto && (
            <span className="ml-auto">
              <BotaoExcluir aoConfirmar={excluir} rotulo="Excluir projeto" />
            </span>
          )}
        </>
      }
    >
      <Campo rotulo="Nome do projeto">
        <input id="prj-nome" className={CAMPO} value={f.nome} onChange={(e) => set("nome", e.target.value)} autoFocus />
      </Campo>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo rotulo="Cliente">
          <select id="prj-cliente" className={CAMPO} value={f.clienteId} onChange={(e) => set("clienteId", e.target.value)}>
            {[...estado.clientes]
              .sort((a, b) => a.nome.localeCompare(b.nome))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
          </select>
        </Campo>
        <Campo rotulo="…ou novo cliente">
          <input id="prj-novo-cliente" className={CAMPO} value={novoCliente} onChange={(e) => setNovoCliente(e.target.value)} placeholder="Nome do cliente" />
        </Campo>
        <Campo rotulo="GP">
          <select id="prj-gp" className={CAMPO} value={f.gpId ?? ""} onChange={(e) => set("gpId", e.target.value || null)}>
            <option value="">—</option>
            {estado.recursos
              .filter((r) => r.ativo)
              .sort((a, b) => a.nome.localeCompare(b.nome))
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
          </select>
        </Campo>
        <Campo rotulo="Tipo">
          <select id="prj-tipo" className={CAMPO} value={f.tipo} onChange={(e) => set("tipo", e.target.value)}>
            <Opcoes mapa={TIPO_PROJETO} />
          </select>
        </Campo>
        <Campo rotulo="Status">
          <select id="prj-status" className={CAMPO} value={f.status} onChange={(e) => set("status", e.target.value)}>
            <Opcoes mapa={STATUS_PROJETO} />
          </select>
        </Campo>
        <Campo rotulo="Prioridade">
          <select id="prj-prioridade" className={CAMPO} value={f.prioridade} onChange={(e) => set("prioridade", e.target.value)}>
            <Opcoes mapa={PRIORIDADE} />
          </select>
        </Campo>
        <Campo rotulo="Status executivo">
          <select id="prj-exec" className={CAMPO} value={f.statusExecutivo ?? ""} onChange={(e) => set("statusExecutivo", e.target.value || null)}>
            <option value="">—</option>
            <Opcoes mapa={STATUS_EXECUTIVO} />
          </select>
        </Campo>
        <Campo rotulo="Horas vendidas">
          <input id="prj-horas" type="number" min="0" className={CAMPO} value={f.horasVendidas ?? ""} onChange={(e) => set("horasVendidas", e.target.value === "" ? null : Number(e.target.value))} />
        </Campo>
        <Campo rotulo="Kick-off">
          <input id="prj-kickoff" type="date" className={CAMPO} value={f.kickoff ?? ""} onChange={(e) => set("kickoff", e.target.value || null)} />
        </Campo>
        <Campo rotulo="Go Live">
          <input id="prj-golive" type="date" className={CAMPO} value={f.goLive ?? ""} onChange={(e) => set("goLive", e.target.value || null)} />
        </Campo>
      </div>
      <Campo rotulo="Notas · bloqueios · ações">
        <textarea id="prj-notas" rows={3} className={CAMPO} value={f.notas ?? ""} onChange={(e) => set("notas", e.target.value || null)} />
      </Campo>
    </Painel>
  );
}

// ───────────────────────────── Cronograma ─────────────────────────────

function Cronograma({ p, estado, loja }: { p: Props["projeto"]; estado: Estado; loja: Loja }) {
  const [sel, setSel] = React.useState<string | "nova" | null>(null);
  const recursos = new Map(estado.recursos.map((r) => [r.id, r.nome]));
  const atualizar = (a: AtividadeCalc, mud: { status?: StatusItem; percentual?: number }) => {
    const c = coerenciaStatus(mud.status ?? a.status, mud.percentual ?? a.percentual);
    const orig = estado.atividades.find((x) => x.id === a.id)!;
    loja.salvar("atividades", { ...orig, status: c.status, percentual: c.percentual });
  };
  return (
    <Cartao
      titulo={`${p.atividades.length} atividade(s) · ${p.atrasadas} atrasada(s)`}
      acoes={
        <Botao pequeno onClick={() => setSel("nova")}>
          + Atividade
        </Botao>
      }
    >
      {p.atividades.length === 0 ? (
        <Vazio>Nenhuma atividade. Use “+ Atividade”: as horas de cada recurso vão para a Capacidade nas semanas entre início e fim.</Vazio>
      ) : (
        <table className="tabela -m-4">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fase</th>
              <th>Tarefa</th>
              <th>Recursos</th>
              <th>Início</th>
              <th>Fim</th>
              <th className="text-right">Previsto</th>
              <th className="text-right">Realizado</th>
              <th className="text-right">%</th>
              <th>Status</th>
              <th>Prazo</th>
            </tr>
          </thead>
          <tbody>
            {p.atividades.map((a) => (
              <tr key={a.id} className={a.status === "CANCELADO" ? "opacity-50" : ""}>
                <td className="whitespace-nowrap">
                  <button type="button" onClick={() => setSel(a.id)} className="font-medium text-navy-800 hover:underline">
                    {a.codigo}
                  </button>
                  {a.marco && <span title="Marco"> ◆</span>}
                </td>
                <td className="whitespace-nowrap text-xs">{FASE[a.fase as keyof typeof FASE] ?? a.fase}</td>
                <td className="min-w-48">{a.tarefa}</td>
                <td className="text-xs">{a.atribuicoes.map((x) => `${recursos.get(x.recursoId) ?? "?"} ${x.esforco}h`).join(" · ") || <span className="text-ardosia-400">sem recurso</span>}</td>
                <td className="whitespace-nowrap text-xs">{dataBR(a.inicio)}</td>
                <td className="whitespace-nowrap text-xs">{dataBR(a.fim)}</td>
                <td className="text-right tabular-nums">{h(a.previsto)}</td>
                <td className="text-right tabular-nums">{h(a.realizado)}</td>
                <td className="text-right">
                  <input
                    aria-label={`% de ${a.codigo}`}
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={a.percentual}
                    key={`${a.id}-${a.percentual}`}
                    onBlur={(e) => Number(e.target.value) !== a.percentual && atualizar(a, { percentual: Number(e.target.value) })}
                    className="w-16 rounded border border-ardosia-200 px-1.5 py-1 text-right text-xs tabular-nums"
                  />
                </td>
                <td>
                  <select aria-label={`Status de ${a.codigo}`} value={a.status} onChange={(e) => atualizar(a, { status: e.target.value as StatusItem })} className="rounded border border-ardosia-200 bg-white px-1.5 py-1 text-xs">
                    <Opcoes mapa={STATUS_ITEM} />
                  </select>
                </td>
                <td>{a.situacao ? <Selo tom={SITUACAO_PRAZO[a.situacao][1] as Tom}>{SITUACAO_PRAZO[a.situacao][0]}</Selo> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="mt-6 text-xs text-ardosia-500">% e status mudam direto na tabela. Clique no ID para mudar datas, recursos e esforço; a Capacidade recalcula na hora.</p>
      {sel && <FormAtividade projetoId={p.id} atividade={sel === "nova" ? null : (estado.atividades.find((a) => a.id === sel) ?? null)} estado={estado} loja={loja} aoFechar={() => setSel(null)} />}
    </Cartao>
  );
}

function FormAtividade({ projetoId, atividade, estado, loja, aoFechar }: { projetoId: string; atividade: Estado["atividades"][number] | null; estado: Estado; loja: Loja; aoFechar: () => void }) {
  const doProjeto = estado.atividades.filter((a) => a.projetoId === projetoId);
  const [f, setF] = React.useState(
    atividade ?? {
      id: novoId(),
      projetoId,
      codigo: proximoCodigo("CRON", doProjeto.map((a) => a.codigo)),
      fase: "DEVELOPMENT",
      tarefa: "",
      inicio: null as string | null,
      fim: null as string | null,
      status: "NAO_INICIADO" as StatusItem,
      percentual: 0,
      marco: false,
      ordem: doProjeto.length + 1,
      atribuicoes: [] as { recursoId: string; esforco: number; realizado: number }[],
    },
  );
  const [erro, setErro] = React.useState<string | null>(null);
  const set = (k: string, v: unknown) => setF((x) => ({ ...x, [k]: v }));
  const recursos = estado.recursos.filter((r) => r.ativo).sort((a, b) => a.nome.localeCompare(b.nome));
  const livres = recursos.filter((r) => !f.atribuicoes.some((x) => x.recursoId === r.id));
  const salvar = async () => {
    if (f.tarefa.trim().length < 2) return setErro("Descreva a tarefa.");
    if (f.inicio && f.fim && f.fim < f.inicio) return setErro("Fim anterior ao início.");
    const c = coerenciaStatus(f.status, f.percentual);
    await loja.salvar("atividades", { ...f, tarefa: f.tarefa.trim(), status: c.status, percentual: c.percentual });
    aoFechar();
  };
  const dias = f.inicio && f.fim ? diffDias(parseDia(f.fim)!, parseDia(f.inicio)!) + 1 : null;
  return (
    <Painel
      titulo={atividade ? `Editar ${atividade.codigo}` : `Nova atividade ${f.codigo}`}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao onClick={salvar}>{atividade ? "Salvar" : "Incluir"}</Botao>
          {erro && <span className="text-sm text-critico">{erro}</span>}
          {atividade && (
            <span className="ml-auto">
              <BotaoExcluir
                aoConfirmar={async () => {
                  await loja.excluir("atividades", atividade.id);
                  aoFechar();
                }}
              />
            </span>
          )}
        </>
      }
    >
      <Campo rotulo="Tarefa">
        <input id="atv-tarefa" className={CAMPO} value={f.tarefa} onChange={(e) => set("tarefa", e.target.value)} autoFocus />
      </Campo>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo rotulo="Fase">
          <select id="atv-fase" className={CAMPO} value={f.fase} onChange={(e) => set("fase", e.target.value)}>
            {FASES.map((x) => (
              <option key={x} value={x}>
                {FASE[x]}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Status">
          <select id="atv-status" className={CAMPO} value={f.status} onChange={(e) => set("status", e.target.value)}>
            <Opcoes mapa={STATUS_ITEM} />
          </select>
        </Campo>
        <Campo rotulo="Início previsto">
          <input id="atv-inicio" type="date" className={CAMPO} value={f.inicio ?? ""} onChange={(e) => set("inicio", e.target.value || null)} />
        </Campo>
        <Campo rotulo="Fim previsto" ajuda={dias ? `${dias} dia(s) corridos` : undefined}>
          <input id="atv-fim" type="date" className={CAMPO} value={f.fim ?? ""} onChange={(e) => set("fim", e.target.value || null)} />
        </Campo>
        <Campo rotulo="% concluído">
          <input id="atv-pct" type="number" min="0" max="100" className={CAMPO} value={f.percentual} onChange={(e) => set("percentual", Number(e.target.value))} />
        </Campo>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input id="atv-marco" type="checkbox" checked={f.marco} onChange={(e) => set("marco", e.target.checked)} /> Marco
        </label>
      </div>
      <div>
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-ardosia-600">Recursos MAIS i9 (uma linha por pessoa)</div>
        {f.atribuicoes.length === 0 && <p className="mb-2 text-sm text-ardosia-500">Sem recurso: a atividade não entra na Capacidade.</p>}
        <div className="space-y-2">
          {f.atribuicoes.map((x, i) => (
            <div key={x.recursoId} className="grid grid-cols-[1fr_6rem_6rem_auto] items-end gap-2">
              <Campo rotulo={i === 0 ? "Recurso" : ""}>
                <select
                  className={CAMPO}
                  value={x.recursoId}
                  onChange={(e) => set("atribuicoes", f.atribuicoes.map((y, j) => (j === i ? { ...y, recursoId: e.target.value } : y)))}
                >
                  {[recursos.find((r) => r.id === x.recursoId) ?? { id: x.recursoId, nome: "(inativo)" }, ...livres].map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nome}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo rotulo={i === 0 ? "Previsto (h)" : ""}>
                <input type="number" min="0" step="0.5" className={CAMPO} value={x.esforco} onChange={(e) => set("atribuicoes", f.atribuicoes.map((y, j) => (j === i ? { ...y, esforco: Number(e.target.value) } : y)))} />
              </Campo>
              <Campo rotulo={i === 0 ? "Realizado (h)" : ""}>
                <input type="number" min="0" step="0.5" className={CAMPO} value={x.realizado} onChange={(e) => set("atribuicoes", f.atribuicoes.map((y, j) => (j === i ? { ...y, realizado: Number(e.target.value) } : y)))} />
              </Campo>
              <Botao variante="fantasma" pequeno onClick={() => set("atribuicoes", f.atribuicoes.filter((_, j) => j !== i))} aria-label="Remover recurso">
                ✕
              </Botao>
            </div>
          ))}
        </div>
        {livres.length > 0 && (
          <Botao variante="secundario" pequeno className="mt-2" onClick={() => set("atribuicoes", [...f.atribuicoes, { recursoId: livres[0].id, esforco: 8, realizado: 0 }])}>
            + Recurso
          </Botao>
        )}
      </div>
    </Painel>
  );
}

// ───────────────────────────── Gantt ─────────────────────────────

function Gantt({ atividades }: { atividades: AtividadeCalc[] }) {
  const com = atividades.filter((a) => a.inicio && a.fim && a.status !== "CANCELADO");
  if (com.length === 0) return <Vazio>Nenhuma atividade com datas.</Vazio>;
  const ini = com.reduce((m, a) => (a.inicio! < m ? a.inicio! : m), com[0].inicio!);
  const fim = com.reduce((m, a) => (a.fim! > m ? a.fim! : m), com[0].fim!);
  const total = diffDias(parseDia(fim)!, parseDia(ini)!) + 1;
  const pos = (s: string) => (diffDias(parseDia(s)!, parseDia(ini)!) / total) * 100;
  const hoje = new Date().toISOString().slice(0, 10);
  const cor: Record<string, string> = { CONCLUIDO: "bg-ok", BLOQUEADO: "bg-critico", EM_ANDAMENTO: "bg-livre", NAO_INICIADO: "bg-ardosia-400" };
  return (
    <Cartao titulo={`Gantt · ${dataBR(ini)} a ${dataBR(fim)}`}>
      <div className="min-w-[44rem] space-y-1.5">
        {com.map((a) => (
          <div key={a.id} className="grid grid-cols-[14rem_1fr] items-center gap-3 text-xs">
            <div className="truncate" title={a.tarefa}>
              <span className="font-medium">{a.codigo}</span> {a.tarefa}
            </div>
            <div className="relative h-5 rounded bg-fundo">
              {hoje >= ini && hoje <= fim && <div className="absolute inset-y-0 w-px bg-destaque" style={{ left: `${pos(hoje)}%` }} title="Hoje" />}
              <div
                className={cx("absolute inset-y-0.5 rounded", a.marco ? "bg-navy-900" : cor[a.status], a.situacao === "ATRASADO" && "ring-2 ring-critico")}
                style={{ left: `${pos(a.inicio!)}%`, width: `${Math.max(1.2, ((diffDias(parseDia(a.fim!)!, parseDia(a.inicio!)!) + 1) / total) * 100)}%` }}
                title={`${dataBR(a.inicio)} a ${dataBR(a.fim)} · ${a.percentual}%`}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ardosia-500">Linha laranja: hoje. Contorno vermelho: atrasada. Cinza: não iniciada · azul: em andamento · verde: concluída · escuro: marco.</p>
    </Cartao>
  );
}

// ───────────────────────────── Operacional ─────────────────────────────

function Operacional({ p, estado, loja }: { p: Props["projeto"]; estado: Estado; loja: Loja }) {
  const [sel, setSel] = React.useState<string | null>(null);
  const [todos, setTodos] = React.useState(false);
  const recursos = new Map(estado.recursos.map((r) => [r.id, r.nome]));
  const hoje = new Date();
  const itens = estado.operacional.filter((o) => o.projetoId === p.id && (todos || itemAberto(o.status))).sort((a, b) => a.codigo.localeCompare(b.codigo));
  return (
    <Cartao
      titulo="Registro operacional"
      acoes={
        <span className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-ardosia-600">
            <input type="checkbox" checked={todos} onChange={(e) => setTodos(e.target.checked)} /> mostrar fechados
          </label>
          <Botao pequeno onClick={() => setSel("novo")}>
            + Item
          </Botao>
        </span>
      }
    >
      {itens.length === 0 ? (
        <Vazio>Nenhum item aberto. Pendências, riscos, decisões, change requests e defeitos ficam aqui.</Vazio>
      ) : (
        <table className="tabela -m-4">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tipo</th>
              <th>Descrição</th>
              <th>Responsável</th>
              <th>Prazo</th>
              <th>Severidade</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((o) => {
              const sev = o.probabilidade && o.impacto ? (o.probabilidade * o.impacto <= 4 ? "BAIXA" : o.probabilidade * o.impacto <= 9 ? "MEDIA" : o.probabilidade * o.impacto <= 15 ? "ALTA" : "CRITICA") : null;
              const vencido = itemVencido(o.status, parseDia(o.prazo), hoje);
              return (
                <tr key={o.id}>
                  <td>
                    <button type="button" onClick={() => setSel(o.id)} className="font-medium text-navy-800 hover:underline">
                      {o.codigo}
                    </button>
                  </td>
                  <td className="whitespace-nowrap text-xs">{TIPO_OPERACIONAL[o.tipo as keyof typeof TIPO_OPERACIONAL]}</td>
                  <td className="min-w-56">{o.descricao}</td>
                  <td className="text-xs">{(o.responsavelId && recursos.get(o.responsavelId)) || o.responsavelTexto || "—"}</td>
                  <td className={cx("whitespace-nowrap text-xs", vencido && "font-medium text-critico")}>
                    {dataBR(o.prazo)}
                    {vencido && " · vencido"}
                  </td>
                  <td>{sev ? <Selo tom={TOM_SEV[sev]}>{SEVERIDADE[sev as keyof typeof SEVERIDADE]}</Selo> : "—"}</td>
                  <td>
                    <Selo tom={TOM_OP[o.status]}>{STATUS_OPERACIONAL[o.status]}</Selo>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {sel && <FormItem projetoId={p.id} item={sel === "novo" ? null : (estado.operacional.find((o) => o.id === sel) ?? null)} estado={estado} loja={loja} aoFechar={() => setSel(null)} />}
    </Cartao>
  );
}

function FormItem({ projetoId, item, estado, loja, aoFechar }: { projetoId: string; item: ItemOp | null; estado: Estado; loja: Loja; aoFechar: () => void }) {
  const [f, setF] = React.useState<ItemOp>(
    item ?? {
      id: novoId(),
      projetoId,
      codigo: "",
      tipo: "PENDENCIA",
      descricao: "",
      responsavelId: null,
      responsavelTexto: null,
      abertura: new Date().toISOString().slice(0, 10),
      prazo: null,
      status: "ABERTO",
      probabilidade: null,
      impacto: null,
      horasCr: null,
      diasCr: null,
    },
  );
  const [erro, setErro] = React.useState<string | null>(null);
  const set = (k: keyof ItemOp, v: unknown) => setF((x) => ({ ...x, [k]: v }));
  const salvar = async () => {
    if (f.descricao.trim().length < 2) return setErro("Descreva o item.");
    if (f.tipo === "RISCO" && (!f.probabilidade || !f.impacto)) return setErro("Risco precisa de probabilidade e impacto (1 a 5).");
    let codigo = f.codigo;
    if (!item) {
      const pref = PREFIXO_OPERACIONAL[f.tipo as keyof typeof PREFIXO_OPERACIONAL];
      codigo = proximoCodigo(pref, estado.operacional.filter((o) => o.projetoId === projetoId && o.codigo.startsWith(`${pref}-`)).map((o) => o.codigo));
    }
    await loja.salvar("operacional", { ...f, codigo, descricao: f.descricao.trim() });
    aoFechar();
  };
  const escala = (k: "probabilidade" | "impacto") => (
    <select className={CAMPO} value={f[k] ?? ""} onChange={(e) => set(k, e.target.value ? Number(e.target.value) : null)}>
      <option value="">—</option>
      {[1, 2, 3, 4, 5].map((n) => (
        <option key={n}>{n}</option>
      ))}
    </select>
  );
  return (
    <Painel
      titulo={item ? `Editar ${item.codigo}` : "Novo item do Operacional"}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao onClick={salvar}>{item ? "Salvar" : "Registrar"}</Botao>
          {erro && <span className="text-sm text-critico">{erro}</span>}
          {item && (
            <span className="ml-auto">
              <BotaoExcluir
                aoConfirmar={async () => {
                  await loja.excluir("operacional", item.id);
                  aoFechar();
                }}
              />
            </span>
          )}
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo rotulo="Tipo">
          <select id="op-tipo" className={CAMPO} value={f.tipo} disabled={!!item} onChange={(e) => set("tipo", e.target.value)}>
            <Opcoes mapa={TIPO_OPERACIONAL} />
          </select>
        </Campo>
        <Campo rotulo="Status">
          <select id="op-status" className={CAMPO} value={f.status} onChange={(e) => set("status", e.target.value)}>
            <Opcoes mapa={STATUS_OPERACIONAL} />
          </select>
        </Campo>
      </div>
      <Campo rotulo="Descrição">
        <input id="op-descricao" className={CAMPO} value={f.descricao} onChange={(e) => set("descricao", e.target.value)} autoFocus />
      </Campo>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo rotulo="Responsável MAIS i9">
          <select id="op-resp" className={CAMPO} value={f.responsavelId ?? ""} onChange={(e) => set("responsavelId", e.target.value || null)}>
            <option value="">—</option>
            {estado.recursos
              .filter((r) => r.ativo)
              .sort((a, b) => a.nome.localeCompare(b.nome))
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
          </select>
        </Campo>
        <Campo rotulo="…ou responsável (texto)">
          <input id="op-resp-texto" className={CAMPO} value={f.responsavelTexto ?? ""} onChange={(e) => set("responsavelTexto", e.target.value || null)} placeholder="Cliente, terceiro" />
        </Campo>
        <Campo rotulo="Prazo">
          <input id="op-prazo" type="date" className={CAMPO} value={f.prazo ?? ""} onChange={(e) => set("prazo", e.target.value || null)} />
        </Campo>
        <div className="grid grid-cols-2 gap-2">
          <Campo rotulo="Probabilidade">{escala("probabilidade")}</Campo>
          <Campo rotulo="Impacto">{escala("impacto")}</Campo>
        </div>
        {f.tipo === "CHANGE_REQUEST" && (
          <>
            <Campo rotulo="CR: horas adicionais">
              <input type="number" className={CAMPO} value={f.horasCr ?? ""} onChange={(e) => set("horasCr", e.target.value === "" ? null : Number(e.target.value))} />
            </Campo>
            <Campo rotulo="CR: dias de prazo">
              <input type="number" className={CAMPO} value={f.diasCr ?? ""} onChange={(e) => set("diasCr", e.target.value === "" ? null : Number(e.target.value))} />
            </Campo>
          </>
        )}
      </div>
      <p className="text-xs text-ardosia-500">Severidade = probabilidade × impacto (até 4 baixa, até 9 média, até 15 alta, acima crítica).</p>
    </Painel>
  );
}

// ───────────────────────────── Carga do projeto ─────────────────────────────

function CargaProjeto({ p, estado, calc }: { p: Props["projeto"]; estado: Estado; calc: Calculo }) {
  const semanas = janela(calc.atual.id, 8);
  const linhas = estado.recursos
    .map((r) => ({ r, horas: semanas.map((s) => calc.celula(r.id, s).projetos.get(p.id) ?? 0) }))
    .filter((x) => x.horas.some((v) => v > 0))
    .sort((a, b) => a.r.nome.localeCompare(b.r.nome));
  return (
    <Cartao titulo="Horas do projeto por recurso · próximas 8 semanas">
      {linhas.length === 0 ? (
        <Vazio>Nenhuma hora prevista nas próximas semanas.</Vazio>
      ) : (
        <table className="tabela -m-4">
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
            {linhas.map(({ r, horas }) => (
              <tr key={r.id}>
                <td className="whitespace-nowrap">{r.nome}</td>
                {horas.map((v, i) => (
                  <td key={i} className="text-center tabular-nums">
                    {v ? h(v) : <span className="text-ardosia-300">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="mt-6 text-xs text-ardosia-500">Calculado do cronograma: o que falta de cada recurso é dividido pelos dias úteis entre início e fim, sem feriados e ausências aprovadas.</p>
    </Cartao>
  );
}

