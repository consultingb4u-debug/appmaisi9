// Telas gerais: Início, Portfólio, Capacidade, Recursos e Alertas.
declare const React: typeof import("react");
import type { Calculo, Estado, Indisp, Recurso } from "./calculo";
import { FERIADOS, janela } from "./calculo";
import type { Loja } from "./dados";
import { novoId } from "./dados";
import { chaveDia, PRIORIDADE, ROTULO_ALERTA, rotuloSemana, semanaDe, somarDias, STATUS_ATIVOS, STATUS_INDISPONIBILIDADE, STATUS_PROJETO, TIPO_INDISPONIBILIDADE } from "./dominio";
import { Botao, BotaoExcluir, CAMPO, Campo, Cartao, cx, dataBR, h, Indicador, Opcoes, Painel, Selo, Vazio, type Tom } from "./ui";

export type Ir = (tela: string, projetoId?: string) => void;

const COR_FAIXA: Record<string, string> = {
  DISPONIVEL: "bg-livre/10 text-livre",
  ADEQUADO: "bg-ok/10 text-ok",
  ATENCAO: "bg-alerta/20 text-alertaTexto",
  SOBRECARREGADO: "bg-critico/15 text-critico",
};
const ROTULO_FAIXA: Record<string, string> = { DISPONIVEL: "Disponível (< 50%)", ADEQUADO: "Adequado (50–85%)", ATENCAO: "Atenção (85–100%)", SOBRECARREGADO: "Sobrecarregado (> 100%)" };
const pct = (u: number | null) => (u === null ? "—" : Number.isFinite(u) ? `${Math.round(u * 100)}%` : "sem cap.");
const COR_EXEC: Record<string, string> = { VERDE: "bg-ok", AMARELO: "bg-alerta", VERMELHO: "bg-critico" };
const ativo = (s: string) => STATUS_ATIVOS.includes(s as never);

// ───────────────────────────── Início ─────────────────────────────

export function Inicio({ calc, estado, ir }: { calc: Calculo; estado: Estado; ir: Ir }) {
  const ativos = calc.projetos.filter((p) => ativo(p.status));
  const semana = calc.atual;
  const daSemana = estado.recursos.filter((r) => r.ativo).map((r) => ({ r, c: calc.celula(r.id, semana) }));
  const cap = daSemana.reduce((t, x) => t + x.c.capacidade.liquida, 0);
  const plan = daSemana.reduce((t, x) => t + x.c.horas, 0);
  const sobre = daSemana.filter((x) => x.c.faixa === "SOBRECARREGADO").sort((a, b) => (b.c.utilizacao ?? 0) - (a.c.utilizacao ?? 0));
  const peso = (p: (typeof ativos)[number]) => (p.statusExecutivo === "VERMELHO" ? 100 : p.statusExecutivo === "AMARELO" ? 30 : 0) + p.atrasadas * 5 + p.pendenciasVencidas * 4 + p.riscosAltos * 10 + (p.status === "BLOQUEADO" ? 50 : 0);
  const saude = [...ativos].sort((a, b) => peso(b) - peso(a) || a.cliente.localeCompare(b.cliente));
  const semanas = janela(semana.id, 4);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Indicador rotulo="Projetos ativos" valor={ativos.length} onClick={() => ir("portfolio")} />
        <Indicador rotulo={`Utilização ${rotuloSemana(semana)}`} valor={pct(cap ? plan / cap : null)} detalhe={`${h(plan)} planejadas de ${h(cap)} líquidas`} onClick={() => ir("capacidade")} />
        <Indicador rotulo="Sobrecarregados" valor={sobre.length} tom={sobre.length ? "critico" : "ok"} detalhe="acima de 100% nesta semana" onClick={() => ir("capacidade")} />
        <Indicador rotulo="Atividades atrasadas" valor={ativos.reduce((t, p) => t + p.atrasadas, 0)} tom={ativos.some((p) => p.atrasadas) ? "alerta" : "ok"} />
        <Indicador rotulo="Alertas" valor={calc.alertas.length} tom={calc.alertas.some((a) => a.gravidade === "ALTA") ? "critico" : "navy"} detalhe={`${calc.alertas.filter((a) => a.gravidade === "ALTA").length} de gravidade alta`} onClick={() => ir("alertas")} />
      </div>

      <Cartao titulo="Saúde dos projetos ativos">
        <table className="tabela -m-4">
          <thead>
            <tr>
              <th>Projeto</th>
              <th>GP</th>
              <th>Status</th>
              <th className="text-right">Conclusão</th>
              <th className="text-right">Atrasadas</th>
              <th className="text-right">Pend. vencidas</th>
              <th className="text-right">Riscos altos</th>
              <th className="text-right">Próx. 4 sem.</th>
              <th>Go Live</th>
            </tr>
          </thead>
          <tbody>
            {saude.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="text-xs text-ardosia-500">{p.cliente}</div>
                  <button type="button" onClick={() => ir("projeto", p.id)} className="text-left font-medium text-navy-800 hover:underline">
                    {p.nome}
                  </button>
                </td>
                <td className="whitespace-nowrap text-xs">{p.gp ?? "—"}</td>
                <td>{p.statusExecutivo ? <span className={cx("inline-block h-2.5 w-2.5 rounded-full", COR_EXEC[p.statusExecutivo])} title={p.statusExecutivo} /> : <span className="text-ardosia-300">—</span>}</td>
                <td className="text-right tabular-nums">{p.atividades.length ? `${p.progresso}%` : <span className="text-ardosia-300">—</span>}</td>
                <td className={cx("text-right tabular-nums", p.atrasadas > 0 && "font-medium text-critico")}>{p.atrasadas || <span className="text-ardosia-300">—</span>}</td>
                <td className={cx("text-right tabular-nums", p.pendenciasVencidas > 0 && "font-medium text-critico")}>{p.pendenciasVencidas || <span className="text-ardosia-300">—</span>}</td>
                <td className={cx("text-right tabular-nums", p.riscosAltos > 0 && "font-medium text-critico")}>{p.riscosAltos || <span className="text-ardosia-300">—</span>}</td>
                <td className="text-right tabular-nums">{p.proximas4 ? h(p.proximas4) : <span className="text-ardosia-300">—</span>}</td>
                <td className="whitespace-nowrap text-xs">{dataBR(p.goLive)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Cartao>

      <div className="grid gap-6 lg:grid-cols-2">
        <Cartao titulo="Carga da equipe · próximas 4 semanas">
          <MapaCarga calc={calc} recursos={estado.recursos.filter((r) => r.ativo)} semanas={semanas} />
        </Cartao>
        <Cartao titulo={`Sobrecarregados em ${rotuloSemana(semana)}`}>
          {sobre.length === 0 ? (
            <Vazio>Ninguém acima de 100% nesta semana.</Vazio>
          ) : (
            <ul className="space-y-3 text-sm">
              {sobre.map(({ r, c }) => (
                <li key={r.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{r.nome}</span>
                    <Selo tom="critico">
                      {pct(c.utilizacao)} · {h(c.horas)} / {h(c.capacidade.liquida)}
                    </Selo>
                  </div>
                  <div className="mt-0.5 text-xs text-ardosia-500">
                    {[...c.projetos.entries()]
                      .sort((a, b) => b[1] - a[1])
                      .map(([pid, hrs]) => `${calc.projetosPorId.get(pid)?.nome ?? "?"} ${h(hrs)}`)
                      .join(" · ")}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      </div>
    </div>
  );
}

function MapaCarga({ calc, recursos, semanas, aoClicar, sel }: { calc: Calculo; recursos: Recurso[]; semanas: ReturnType<typeof janela>; aoClicar?: (r: string, s: string) => void; sel?: string }) {
  return (
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
        {[...recursos]
          .sort((a, b) => a.nome.localeCompare(b.nome))
          .map((r) => (
            <tr key={r.id}>
              <td className="whitespace-nowrap">{r.nome}</td>
              {semanas.map((s) => {
                const c = calc.celula(r.id, s);
                const conteudo = <span className={cx("block rounded px-1.5 py-1 text-xs font-medium", c.faixa && c.horas ? COR_FAIXA[c.faixa] : "text-ardosia-300", sel === `${r.id}|${s.id}` && "ring-2 ring-destaque")}>{c.horas ? pct(c.utilizacao) : "—"}</span>;
                return (
                  <td key={s.id} className="p-1 text-center tabular-nums" title={`${h(c.horas)} de ${h(c.capacidade.liquida)}`}>
                    {aoClicar ? (
                      <button type="button" className="w-full" onClick={() => aoClicar(r.id, s.id)}>
                        {conteudo}
                      </button>
                    ) : (
                      conteudo
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
      </tbody>
    </table>
  );
}

// ───────────────────────────── Portfólio ─────────────────────────────

export function Portfolio({ calc, ir, aoNovo }: { calc: Calculo; ir: Ir; aoNovo: () => void }) {
  const [busca, setBusca] = React.useState("");
  const [status, setStatus] = React.useState("ativos");
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const lista = calc.projetos
    .filter((p) => (status === "ativos" ? ativo(p.status) : status === "todos" ? true : p.status === status))
    .filter((p) => !busca || norm(`${p.codigo} ${p.nome} ${p.cliente} ${p.gp ?? ""}`).includes(norm(busca)))
    .sort((a, b) => a.cliente.localeCompare(b.cliente) || a.nome.localeCompare(b.nome));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-ardosia-100 bg-white p-3">
        <input id="port-busca" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar projeto, cliente, GP…" className={cx(CAMPO, "max-w-xs py-1.5")} />
        <select id="port-status" value={status} onChange={(e) => setStatus(e.target.value)} className={cx(CAMPO, "w-auto py-1.5")}>
          <option value="ativos">Ativos</option>
          <option value="todos">Todos</option>
          <Opcoes mapa={STATUS_PROJETO} />
        </select>
        <span className="text-sm text-ardosia-500">{lista.length} projeto(s)</span>
        <Botao className="ml-auto" onClick={aoNovo}>
          + Novo projeto
        </Botao>
      </div>
      <Cartao>
        {lista.length === 0 ? (
          <Vazio>Nenhum projeto neste filtro.</Vazio>
        ) : (
          <table className="tabela -m-4">
            <thead>
              <tr>
                <th>Cliente · Projeto</th>
                <th>Status</th>
                <th>Prioridade</th>
                <th>GP</th>
                <th>Go Live</th>
                <th className="text-right">Vendidas</th>
                <th className="text-right">Previsto</th>
                <th className="text-right">Conclusão</th>
                <th className="text-right">Próx. 4 sem.</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="text-xs text-ardosia-500">
                      {p.cliente} · {p.codigo}
                    </div>
                    <button type="button" onClick={() => ir("projeto", p.id)} className="text-left font-medium text-navy-800 hover:underline">
                      {p.nome}
                    </button>
                  </td>
                  <td>
                    <Selo tom={p.status === "BLOQUEADO" ? "critico" : p.status === "EM_ANDAMENTO" ? "ok" : p.status === "CONCLUIDO" ? "navy" : "neutro"}>{STATUS_PROJETO[p.status as keyof typeof STATUS_PROJETO] ?? p.status}</Selo>
                  </td>
                  <td>
                    <Selo tom={(({ BAIXA: "neutro", MEDIA: "livre", ALTA: "alerta", CRITICA: "critico" }) as Record<string, Tom>)[p.prioridade]}>{PRIORIDADE[p.prioridade as keyof typeof PRIORIDADE]}</Selo>
                  </td>
                  <td className="whitespace-nowrap text-xs">{p.gp ?? "—"}</td>
                  <td className="whitespace-nowrap text-xs">{dataBR(p.goLive)}</td>
                  <td className="text-right tabular-nums">{h(p.horasVendidas)}</td>
                  <td className="text-right tabular-nums">{p.previsto ? h(p.previsto) : <span className="text-ardosia-300">—</span>}</td>
                  <td className="text-right tabular-nums">{p.atividades.length ? `${p.progresso}%` : <span className="text-ardosia-300">—</span>}</td>
                  <td className="text-right font-medium tabular-nums">{p.proximas4 ? h(p.proximas4) : <span className="font-normal text-ardosia-300">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Cartao>
    </div>
  );
}

// ───────────────────────────── Capacidade ─────────────────────────────

export function Capacidade({ calc, estado, loja, ir }: { calc: Calculo; estado: Estado; loja: Loja; ir: Ir }) {
  const [inicio, setInicio] = React.useState(calc.atual.id);
  const [sel, setSel] = React.useState<{ r: string; s: string } | null>(null);
  const [avulsa, setAvulsa] = React.useState<{ projetoId: string; horas: string }>({ projetoId: "", horas: "" });
  const semanas = janela(inicio, 8);
  const mover = (n: number) => setInicio(semanaDe(somarDias(semanas[0].inicio, n * 7)).id);
  const recurso = sel ? estado.recursos.find((r) => r.id === sel.r) : null;
  const semana = sel ? semanas.find((s) => s.id === sel.s) : null;
  const c = recurso && semana ? calc.celula(recurso.id, semana) : null;
  const feriadosSemana = semana ? Array.from({ length: 5 }, (_, i) => chaveDia(somarDias(semana.inicio, i))).filter((k) => FERIADOS.has(k)) : [];
  const avulsas = sel ? estado.alocacoes.filter((a) => a.recursoId === sel.r && a.semana === sel.s) : [];
  const ativosProj = calc.projetos.filter((p) => ativo(p.status)).sort((a, b) => a.cliente.localeCompare(b.cliente));
  const incluir = async () => {
    const horas = Number(avulsa.horas.replace(",", "."));
    if (!sel || !avulsa.projetoId || !(horas > 0)) return;
    await loja.salvar("alocacoes", { id: novoId(), projetoId: avulsa.projetoId, recursoId: sel.r, semana: sel.s, horas });
    setAvulsa({ projetoId: "", horas: "" });
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Botao variante="secundario" pequeno onClick={() => mover(-4)} aria-label="Semanas anteriores">
          ◀
        </Botao>
        <Botao variante="secundario" pequeno onClick={() => setInicio(calc.atual.id)}>
          Hoje
        </Botao>
        <Botao variante="secundario" pequeno onClick={() => mover(4)} aria-label="Próximas semanas">
          ▶
        </Botao>
        <span className="text-sm text-ardosia-600">
          {rotuloSemana(semanas[0])} a {rotuloSemana(semanas[7])} · clique numa célula para ver o detalhe
        </span>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Cartao titulo="Mapa de carga (planejado ÷ capacidade líquida)">
          <MapaCarga calc={calc} recursos={estado.recursos.filter((r) => r.ativo)} semanas={semanas} aoClicar={(r, s) => setSel({ r, s })} sel={sel ? `${sel.r}|${sel.s}` : undefined} />
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            {Object.entries(ROTULO_FAIXA).map(([k, v]) => (
              <span key={k} className={cx("rounded px-1.5", COR_FAIXA[k])}>
                {v}
              </span>
            ))}
          </div>
        </Cartao>
        <Cartao titulo={recurso && semana ? `${recurso.nome} · ${rotuloSemana(semana)}` : "Detalhe"}>
          {!c || !recurso || !semana ? (
            <p className="text-sm text-ardosia-500">Escolha uma célula do mapa.</p>
          ) : (
            <div className="space-y-4 text-sm">
              <dl className="grid grid-cols-2 gap-2">
                {[
                  ["Capacidade", h(c.capacidade.bruta)],
                  ["Líquida", h(c.capacidade.liquida)],
                  ["Planejado", h(c.horas)],
                  ["Utilização", pct(c.utilizacao)],
                ].map(([r, v]) => (
                  <div key={r} className="rounded bg-fundo px-2 py-1.5">
                    <dt className="text-[11px] uppercase tracking-wide text-ardosia-500">{r}</dt>
                    <dd className="font-semibold tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
              {(feriadosSemana.length > 0 || c.capacidade.horasIndisponivel > 0) && (
                <p className="text-xs text-ardosia-600">
                  {feriadosSemana.map((k) => `${FERIADOS.get(k)} (${dataBR(k)})`).join(" · ")}
                  {c.capacidade.horasIndisponivel > 0 && ` · ${h(c.capacidade.horasIndisponivel)} de ausência aprovada`}
                </p>
              )}
              <div>
                <div className="mb-1 text-xs font-medium uppercase tracking-wide text-ardosia-600">Projetos na semana</div>
                {c.projetos.size === 0 ? (
                  <p className="text-ardosia-500">Nenhum.</p>
                ) : (
                  <ul className="space-y-1">
                    {[...c.projetos.entries()]
                      .sort((a, b) => b[1] - a[1])
                      .map(([pid, hrs]) => (
                        <li key={pid} className="flex justify-between gap-2">
                          <button type="button" className="truncate text-left hover:underline" onClick={() => ir("projeto", pid)}>
                            {calc.projetosPorId.get(pid)?.cliente} · {calc.projetosPorId.get(pid)?.nome}
                          </button>
                          <span className="tabular-nums">{h(hrs)}</span>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
              <div className="border-t border-ardosia-100 pt-3">
                <div className="mb-1 text-xs font-medium uppercase tracking-wide text-ardosia-600">Horas avulsas (fora do cronograma)</div>
                {avulsas.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate">{calc.projetosPorId.get(a.projetoId)?.nome ?? "?"}</span>
                    <span className="flex items-center gap-1">
                      {h(a.horas)}
                      <BotaoExcluir aoConfirmar={() => loja.excluir("alocacoes", a.id)} rotulo="✕" />
                    </span>
                  </div>
                ))}
                <div className="mt-2 grid grid-cols-[1fr_4.5rem_auto] gap-2">
                  <select aria-label="Projeto" className={cx(CAMPO, "py-1.5")} value={avulsa.projetoId} onChange={(e) => setAvulsa({ ...avulsa, projetoId: e.target.value })}>
                    <option value="">Projeto…</option>
                    {ativosProj.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.cliente} · {p.nome}
                      </option>
                    ))}
                  </select>
                  <input aria-label="Horas" className={cx(CAMPO, "py-1.5")} placeholder="h" value={avulsa.horas} onChange={(e) => setAvulsa({ ...avulsa, horas: e.target.value })} />
                  <Botao pequeno onClick={incluir}>
                    Incluir
                  </Botao>
                </div>
              </div>
            </div>
          )}
        </Cartao>
      </div>
    </div>
  );
}

// ───────────────────────────── Recursos e indisponibilidades ─────────────────────────────

export function Recursos({ estado, calc, loja }: { estado: Estado; calc: Calculo; loja: Loja }) {
  const [sel, setSel] = React.useState<Recurso | "novo" | null>(null);
  const [aus, setAus] = React.useState<Indisp | null>(null);
  const nomes = new Map(estado.recursos.map((r) => [r.id, r.nome]));
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Cartao
        titulo={`Recursos · ${estado.recursos.filter((r) => r.ativo).length} ativos`}
        acoes={
          <Botao pequeno onClick={() => setSel("novo")}>
            + Recurso
          </Botao>
        }
      >
        <table className="tabela -m-4">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Cargo</th>
              <th className="text-right">Capacidade</th>
              <th className="text-right">{rotuloSemana(calc.atual)}</th>
            </tr>
          </thead>
          <tbody>
            {[...estado.recursos]
              .sort((a, b) => Number(b.ativo) - Number(a.ativo) || a.nome.localeCompare(b.nome))
              .map((r) => {
                const c = calc.celula(r.id, calc.atual);
                return (
                  <tr key={r.id} className={r.ativo ? "" : "opacity-50"}>
                    <td>
                      <button type="button" className="font-medium text-navy-800 hover:underline" onClick={() => setSel(r)}>
                        {r.nome}
                      </button>
                      {!r.ativo && <span className="ml-2 text-xs">(inativo)</span>}
                    </td>
                    <td className="text-xs">{r.cargo ?? "—"}</td>
                    <td className="text-right tabular-nums">{h(r.horasSemanais)}/sem</td>
                    <td className="text-right">{c.horas ? <span className={cx("rounded px-1.5 py-0.5 text-xs font-medium", c.faixa ? COR_FAIXA[c.faixa] : "")}>{pct(c.utilizacao)}</span> : "—"}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </Cartao>
      <Cartao
        titulo="Indisponibilidades (férias, ausências)"
        acoes={
          <Botao pequeno onClick={() => setAus({ id: novoId(), recursoId: estado.recursos.find((r) => r.ativo)?.id ?? "", tipo: "FERIAS", inicio: "", fim: "", status: "PENDENTE", observacao: null })}>
            + Indisponibilidade
          </Botao>
        }
      >
        {estado.indisponibilidades.length === 0 ? (
          <Vazio>Nenhuma. Ausências aprovadas descontam da capacidade e tiram as horas desses dias do rateio.</Vazio>
        ) : (
          <table className="tabela -m-4">
            <thead>
              <tr>
                <th>Recurso</th>
                <th>Tipo</th>
                <th>Período</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {[...estado.indisponibilidades]
                .sort((a, b) => b.inicio.localeCompare(a.inicio))
                .map((i) => (
                  <tr key={i.id}>
                    <td>
                      <button type="button" className="text-navy-800 hover:underline" onClick={() => setAus(i)}>
                        {nomes.get(i.recursoId) ?? "?"}
                      </button>
                    </td>
                    <td className="text-xs">{TIPO_INDISPONIBILIDADE[i.tipo as keyof typeof TIPO_INDISPONIBILIDADE] ?? i.tipo}</td>
                    <td className="whitespace-nowrap text-xs">
                      {dataBR(i.inicio)} a {dataBR(i.fim)}
                    </td>
                    <td>
                      <Selo tom={i.status === "APROVADA" ? "ok" : i.status === "RECUSADA" ? "neutro" : "alerta"}>{STATUS_INDISPONIBILIDADE[i.status as keyof typeof STATUS_INDISPONIBILIDADE]}</Selo>
                    </td>
                    <td className="whitespace-nowrap text-right">
                      {i.status === "PENDENTE" && (
                        <span className="flex justify-end gap-1">
                          <Botao pequeno variante="secundario" onClick={() => loja.salvar("indisponibilidades", { ...i, status: "APROVADA" })}>
                            Aprovar
                          </Botao>
                          <Botao pequeno variante="fantasma" onClick={() => loja.salvar("indisponibilidades", { ...i, status: "RECUSADA" })}>
                            Recusar
                          </Botao>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </Cartao>
      {sel && <FormRecurso recurso={sel === "novo" ? null : sel} loja={loja} aoFechar={() => setSel(null)} />}
      {aus && <FormAusencia item={aus} estado={estado} loja={loja} aoFechar={() => setAus(null)} />}
    </div>
  );
}

function FormRecurso({ recurso, loja, aoFechar }: { recurso: Recurso | null; loja: Loja; aoFechar: () => void }) {
  const [f, setF] = React.useState<Recurso>(recurso ?? { id: novoId(), nome: "", cargo: null, area: null, ativo: true, horasSemanais: 40 });
  const [erro, setErro] = React.useState<string | null>(null);
  const salvar = async () => {
    if (f.nome.trim().length < 2) return setErro("Informe o nome.");
    if (!(f.horasSemanais >= 0 && f.horasSemanais <= 60)) return setErro("Capacidade entre 0 e 60 h/semana.");
    await loja.salvar("recursos", { ...f, nome: f.nome.trim() });
    aoFechar();
  };
  return (
    <Painel
      titulo={recurso ? recurso.nome : "Novo recurso"}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao onClick={salvar}>Salvar</Botao>
          {erro && <span className="text-sm text-critico">{erro}</span>}
        </>
      }
    >
      <Campo rotulo="Nome">
        <input id="rec-nome" className={CAMPO} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} autoFocus />
      </Campo>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo rotulo="Cargo">
          <input id="rec-cargo" className={CAMPO} value={f.cargo ?? ""} onChange={(e) => setF({ ...f, cargo: e.target.value || null })} />
        </Campo>
        <Campo rotulo="Capacidade (h/semana)" ajuda="Base da utilização no mapa de carga.">
          <input id="rec-horas" type="number" min="0" max="60" className={CAMPO} value={f.horasSemanais} onChange={(e) => setF({ ...f, horasSemanais: Number(e.target.value) })} />
        </Campo>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input id="rec-ativo" type="checkbox" checked={f.ativo} onChange={(e) => setF({ ...f, ativo: e.target.checked })} /> Ativo
      </label>
    </Painel>
  );
}

function FormAusencia({ item, estado, loja, aoFechar }: { item: Indisp; estado: Estado; loja: Loja; aoFechar: () => void }) {
  const existe = estado.indisponibilidades.some((i) => i.id === item.id);
  const [f, setF] = React.useState<Indisp>(item);
  const [erro, setErro] = React.useState<string | null>(null);
  const salvar = async () => {
    if (!f.recursoId || !f.inicio || !f.fim) return setErro("Informe recurso, início e fim.");
    if (f.fim < f.inicio) return setErro("Fim anterior ao início.");
    await loja.salvar("indisponibilidades", f);
    aoFechar();
  };
  return (
    <Painel
      titulo={existe ? "Editar indisponibilidade" : "Nova indisponibilidade"}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao onClick={salvar}>Salvar</Botao>
          {erro && <span className="text-sm text-critico">{erro}</span>}
          {existe && (
            <span className="ml-auto">
              <BotaoExcluir
                aoConfirmar={async () => {
                  await loja.excluir("indisponibilidades", f.id);
                  aoFechar();
                }}
              />
            </span>
          )}
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo rotulo="Recurso">
          <select id="aus-recurso" className={CAMPO} value={f.recursoId} onChange={(e) => setF({ ...f, recursoId: e.target.value })}>
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
          <select id="aus-tipo" className={CAMPO} value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })}>
            <Opcoes mapa={TIPO_INDISPONIBILIDADE} />
          </select>
        </Campo>
        <Campo rotulo="Início">
          <input id="aus-inicio" type="date" className={CAMPO} value={f.inicio} onChange={(e) => setF({ ...f, inicio: e.target.value })} />
        </Campo>
        <Campo rotulo="Fim">
          <input id="aus-fim" type="date" className={CAMPO} value={f.fim} onChange={(e) => setF({ ...f, fim: e.target.value })} />
        </Campo>
        <Campo rotulo="Status">
          <select id="aus-status" className={CAMPO} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            <Opcoes mapa={STATUS_INDISPONIBILIDADE} />
          </select>
        </Campo>
      </div>
      <p className="text-xs text-ardosia-500">Só ausências aprovadas descontam da capacidade e tiram esses dias do rateio das atividades.</p>
    </Painel>
  );
}

// ───────────────────────────── Alertas ─────────────────────────────

export function Alertas({ calc, ir }: { calc: Calculo; ir: Ir }) {
  const [tipo, setTipo] = React.useState<string | null>(null);
  const lista = tipo ? calc.alertas.filter((a) => a.tipo === tipo) : calc.alertas;
  const abrir = (a: (typeof lista)[number]) => (a.projetoId ? ir("projeto", a.projetoId) : a.tipo === "SOBRECARGA" ? ir("capacidade") : ir("recursos"));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-sm">
        <button type="button" onClick={() => setTipo(null)} className={cx("rounded-full px-3 py-1", !tipo ? "bg-navy-900 text-white" : "bg-white text-ardosia-600 ring-1 ring-ardosia-200")}>
          Todos <span className="ml-1 text-xs opacity-70">{calc.alertas.length}</span>
        </button>
        {Object.entries(ROTULO_ALERTA)
          .filter(([k]) => k !== "STATUS_REPORT_ATRASADO")
          .map(([k, r]) => (
            <button key={k} type="button" onClick={() => setTipo(k)} className={cx("rounded-full px-3 py-1", tipo === k ? "bg-navy-900 text-white" : "bg-white text-ardosia-600 ring-1 ring-ardosia-200")}>
              {r} <span className="ml-1 text-xs opacity-70">{calc.alertas.filter((a) => a.tipo === k).length}</span>
            </button>
          ))}
      </div>
      <Cartao titulo={`${lista.length} alerta(s)`}>
        {lista.length === 0 ? (
          <Vazio>Nada pendente.</Vazio>
        ) : (
          <ul className="-my-2 divide-y divide-ardosia-100">
            {lista.map((a) => (
              <li key={a.chave} className="flex items-start gap-3 py-2.5">
                <span className={cx("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", a.gravidade === "ALTA" ? "bg-critico" : "bg-alerta")} title={a.gravidade === "ALTA" ? "Gravidade alta" : "Gravidade média"} />
                <div className="min-w-0 flex-1">
                  <button type="button" onClick={() => abrir(a)} className="text-left font-medium text-navy-800 hover:underline">
                    {a.titulo}
                  </button>
                  <div className="text-xs text-ardosia-500">{a.detalhe}</div>
                </div>
                <Selo>{ROTULO_ALERTA[a.tipo]}</Selo>
              </li>
            ))}
          </ul>
        )}
      </Cartao>
      <p className="text-xs text-ardosia-500">No sistema, cada pessoa recebe por e-mail (dias úteis, 7h) os alertas novos que dizem respeito a ela.</p>
    </div>
  );
}
