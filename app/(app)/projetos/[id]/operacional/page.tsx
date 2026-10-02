import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth/sessao";
import { pode } from "@/lib/auth/permissoes";
import { itemAberto, itemVencido } from "@/lib/domain/execucao";
import { formatarData } from "@/lib/domain/datas";
import { NIVEL_IMPACTO, SEVERIDADE, STATUS_OPERACIONAL, TIPO_OPERACIONAL, TOM_OPERACIONAL, TOM_SEVERIDADE } from "@/lib/domain/rotulos";
import { severidadeDe } from "@/lib/services/execucao";
import { Campo, Cartao, LinkBotao, opcoes, Selo, valorData, Vazio, BotaoExportar } from "@/components/ui";
import { BotaoAcao, Formulario } from "@/components/formulario";
import { excluirItemOperacional, salvarItemOperacional } from "../../execucao-acoes";
import { decidirChangeRequest } from "../../linha-base-acoes";

const SITUACOES = { abertos: "Abertos", vencidos: "Vencidos", todos: "Todos" } as const;
type Situacao = keyof typeof SITUACOES;

export default async function Operacional({ params, searchParams }: PageProps<"/projetos/[id]/operacional">) {
  const { id } = await params;
  const sp = await searchParams;
  const tipo = typeof sp.tipo === "string" && sp.tipo in TIPO_OPERACIONAL ? (sp.tipo as keyof typeof TIPO_OPERACIONAL) : null;
  const situacao: Situacao = typeof sp.situacao === "string" && sp.situacao in SITUACOES ? (sp.situacao as Situacao) : "abertos";
  const usuario = await usuarioAtual();
  const editavel = pode(usuario.perfil, "editar", "PROJETOS");
  const projeto = await db.projeto.findUnique({ where: { id }, select: { id: true } });
  if (!projeto) notFound();
  const hoje = new Date();
  const [todos, recursos, atividades, backlog] = await Promise.all([
    db.itemOperacional.findMany({
      where: { projetoId: id },
      orderBy: [{ dataAbertura: "desc" }, { codigo: "desc" }],
      include: {
        responsavel: { select: { nome: true } },
        atividade: { select: { codigo: true } },
        backlogItem: { select: { codigo: true } },
        execucaoTeste: { select: { ciclo: true, caso: { select: { codigo: true, tipo: true } } } },
      },
    }),
    db.recurso.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    db.atividade.findMany({ where: { projetoId: id }, orderBy: [{ ordem: "asc" }, { codigo: "asc" }], select: { id: true, codigo: true, tarefa: true } }),
    db.backlogItem.findMany({ where: { projetoId: id }, orderBy: [{ ordem: "asc" }, { codigo: "asc" }], select: { id: true, codigo: true, requisito: true } }),
  ]);
  const itens = todos.filter(
    (i) => (!tipo || i.tipo === tipo) && (situacao === "todos" || (situacao === "abertos" ? itemAberto(i.status) : itemVencido(i.status, i.prazo, hoje))),
  );
  const sel = typeof sp.editar === "string" ? todos.find((i) => i.id === sp.editar) : null;
  const novoTipo = typeof sp.novo === "string" && sp.novo in TIPO_OPERACIONAL ? (sp.novo as keyof typeof TIPO_OPERACIONAL) : sp.novo ? "PENDENCIA" : null;
  const mostrarForm = editavel && (sel || novoTipo);
  const base = `/projetos/${id}/operacional`;
  const filtro = (p: Record<string, string | null>) => {
    const q = new URLSearchParams();
    const t = "tipo" in p ? p.tipo : tipo;
    const s = "situacao" in p ? p.situacao : situacao;
    if (t) q.set("tipo", t);
    if (s && s !== "abertos") q.set("situacao", s);
    return `${base}${q.size ? `?${q}` : ""}`;
  };
  const contagem = (t: string) => todos.filter((i) => i.tipo === t && itemAberto(i.status)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link href={filtro({ tipo: null })} className={clsx("rounded-full px-3 py-1", !tipo ? "bg-navy-900 text-white" : "bg-white text-ardosia-600 ring-1 ring-ardosia-200")}>
          Todos os tipos
        </Link>
        {Object.entries(TIPO_OPERACIONAL).map(([k, r]) => (
          <Link key={k} href={filtro({ tipo: k })} className={clsx("rounded-full px-3 py-1", tipo === k ? "bg-navy-900 text-white" : "bg-white text-ardosia-600 ring-1 ring-ardosia-200")}>
            {r} {contagem(k) > 0 && <span className="ml-1 text-xs opacity-70">{contagem(k)}</span>}
          </Link>
        ))}
        <span className="mx-2 text-ardosia-300">|</span>
        {Object.entries(SITUACOES).map(([k, r]) => (
          <Link key={k} href={filtro({ situacao: k })} className={clsx("rounded-full px-3 py-1", situacao === k ? "bg-destaque text-white" : "bg-white text-ardosia-600 ring-1 ring-ardosia-200")}>
            {r}
          </Link>
        ))}
      </div>

      <Cartao
        titulo={`Registro operacional · ${itens.length} item(ns)`}
        acoes={
          <span className="flex items-center gap-2">
            <BotaoExportar href={`/exportar/operacional?projeto=${id}`} rotulo="Excel" />
            {editavel && !mostrarForm && (
              <LinkBotao href={`${base}?novo=${tipo ?? "PENDENCIA"}`} tamanho="sm">
                + {tipo ? TIPO_OPERACIONAL[tipo] : "Item"}
              </LinkBotao>
            )}
          </span>
        }
      >
        {itens.length === 0 ? (
          <Vazio>Nenhum item neste filtro. Pendências, decisões, dependências, problemas, riscos, change requests e defeitos ficam aqui.</Vazio>
        ) : (
          <div className="-m-4 overflow-x-auto">
            <table className="tabela">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tipo</th>
                  <th>Descrição</th>
                  <th>Responsável</th>
                  <th>Abertura</th>
                  <th>Prazo</th>
                  <th>Severidade</th>
                  <th>Impactos (E/P/H)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((i) => {
                  const sev = severidadeDe(i);
                  const vencido = itemVencido(i.status, i.prazo, hoje);
                  const ligacoes = [i.atividade?.codigo, i.backlogItem?.codigo, i.execucaoTeste && `${i.execucaoTeste.caso.codigo} c${i.execucaoTeste.ciclo}`].filter(Boolean);
                  return (
                    <tr key={i.id} className={i.id === sel?.id ? "bg-destaque/5" : ""}>
                      <td className="whitespace-nowrap">
                        {editavel ? (
                          <Link href={`${base}?editar=${i.id}`} scroll={false} className="font-medium text-navy-800 hover:underline">
                            {i.codigo}
                          </Link>
                        ) : (
                          i.codigo
                        )}
                      </td>
                      <td className="text-xs whitespace-nowrap">{TIPO_OPERACIONAL[i.tipo]}</td>
                      <td>
                        <div className="max-w-md">{i.descricao}</div>
                        {(i.acaoResposta || ligacoes.length > 0) && (
                          <div className="text-xs text-ardosia-500">{[i.acaoResposta && `Ação: ${i.acaoResposta}`, ligacoes.length ? `Ligado a ${ligacoes.join(", ")}` : null].filter(Boolean).join(" · ")}</div>
                        )}
                      </td>
                      <td className="text-xs">{i.responsavel?.nome ?? i.responsavelTexto ?? "—"}</td>
                      <td className="text-xs whitespace-nowrap">{formatarData(i.dataAbertura)}</td>
                      <td className={clsx("text-xs whitespace-nowrap", vencido && "font-medium text-critico")}>
                        {formatarData(i.prazo)}
                        {vencido && " · vencido"}
                      </td>
                      <td>{sev ? <Selo tom={TOM_SEVERIDADE[sev]}>{SEVERIDADE[sev]}</Selo> : <span className="text-ardosia-400">—</span>}</td>
                      <td className="text-xs whitespace-nowrap">{[i.impactoEscopo, i.impactoPrazo, i.impactoHoras].map((n) => NIVEL_IMPACTO[n]).join(" / ")}</td>
                      <td>
                        <Selo tom={TOM_OPERACIONAL[i.status]}>{STATUS_OPERACIONAL[i.status]}</Selo>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Cartao>

      {mostrarForm && (
        <Cartao
          titulo={sel ? `Editar ${sel.codigo}` : `Novo item: ${TIPO_OPERACIONAL[novoTipo!]}`}
          acoes={
            <span className="flex items-center gap-2">
              {sel && (
                <BotaoAcao acao={excluirItemOperacional.bind(null, sel.id)} confirmar={`Excluir ${sel.codigo}?`}>
                  Excluir
                </BotaoAcao>
              )}
              <Link href={filtro({})} className="text-sm text-ardosia-500">
                ✕
              </Link>
            </span>
          }
        >
          <Formulario key={sel?.id ?? `novo-${novoTipo}`} acao={salvarItemOperacional.bind(null, id, sel?.id ?? null)} limparAoSalvar={!sel}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Campo rotulo="Tipo">
                <select name="tipo" defaultValue={sel?.tipo ?? novoTipo ?? "PENDENCIA"} className="campo" disabled={!!sel}>
                  {opcoes(TIPO_OPERACIONAL)}
                </select>
                {sel && <input type="hidden" name="tipo" value={sel.tipo} />}
              </Campo>
              <Campo rotulo="Descrição" className="sm:col-span-1 lg:col-span-3">
                <input name="descricao" required defaultValue={sel?.descricao} className="campo" />
              </Campo>
              <Campo rotulo="Origem / causa" className="sm:col-span-2">
                <input name="origemCausa" defaultValue={sel?.origemCausa ?? ""} className="campo" />
              </Campo>
              <Campo rotulo="Impacto / consequência" className="sm:col-span-2">
                <input name="impactoConsequencia" defaultValue={sel?.impactoConsequencia ?? ""} className="campo" />
              </Campo>
              <Campo rotulo="Responsável MAIS i9">
                <select name="responsavelId" defaultValue={sel?.responsavelId ?? ""} className="campo">
                  <option value="">—</option>
                  {recursos.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nome}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo rotulo="…ou responsável (texto)" ajuda="Cliente, terceiro, área.">
                <input name="responsavelTexto" defaultValue={sel?.responsavelTexto ?? ""} className="campo" />
              </Campo>
              <Campo rotulo="Abertura">
                <input name="dataAbertura" type="date" defaultValue={valorData(sel?.dataAbertura ?? new Date())} className="campo" />
              </Campo>
              <Campo rotulo="Prazo">
                <input name="prazo" type="date" defaultValue={valorData(sel?.prazo)} className="campo" />
              </Campo>
              <Campo rotulo="Status">
                <select name="status" defaultValue={sel?.status ?? "ABERTO"} className="campo">
                  {opcoes(STATUS_OPERACIONAL)}
                </select>
              </Campo>
              <Campo rotulo="Impacto escopo">
                <select name="impactoEscopo" defaultValue={sel?.impactoEscopo ?? "NAO"} className="campo">
                  {opcoes(NIVEL_IMPACTO)}
                </select>
              </Campo>
              <Campo rotulo="Impacto prazo">
                <select name="impactoPrazo" defaultValue={sel?.impactoPrazo ?? "NAO"} className="campo">
                  {opcoes(NIVEL_IMPACTO)}
                </select>
              </Campo>
              <Campo rotulo="Impacto horas">
                <select name="impactoHoras" defaultValue={sel?.impactoHoras ?? "NAO"} className="campo">
                  {opcoes(NIVEL_IMPACTO)}
                </select>
              </Campo>
              <Campo rotulo="Probabilidade (1–5)" ajuda="Obrigatório para riscos.">
                <input name="probabilidade" type="number" min="1" max="5" defaultValue={sel?.probabilidade ?? ""} className="campo" />
              </Campo>
              <Campo rotulo="Impacto (1–5)" ajuda="Severidade = P × I.">
                <input name="impacto" type="number" min="1" max="5" defaultValue={sel?.impacto ?? ""} className="campo" />
              </Campo>
              <Campo rotulo="CR: horas adicionais">
                <input name="horasCr" type="number" step="0.5" defaultValue={sel?.horasCr?.toNumber() ?? ""} className="campo" />
              </Campo>
              <Campo rotulo="CR: dias de prazo">
                <input name="diasCr" type="number" step="1" defaultValue={sel?.diasCr ?? ""} className="campo" />
              </Campo>
              <Campo rotulo="Ação / resposta" className="sm:col-span-2">
                <input name="acaoResposta" defaultValue={sel?.acaoResposta ?? ""} className="campo" />
              </Campo>
              <Campo rotulo="Decisão / aprovador" className="sm:col-span-2">
                <input name="decisaoAprovador" defaultValue={sel?.decisaoAprovador ?? ""} className="campo" />
              </Campo>
              <Campo rotulo="Atividade relacionada">
                <select name="atividadeId" defaultValue={sel?.atividadeId ?? ""} className="campo">
                  <option value="">—</option>
                  {atividades.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.codigo} · {a.tarefa.slice(0, 50)}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo rotulo="Requisito relacionado">
                <select name="backlogItemId" defaultValue={sel?.backlogItemId ?? ""} className="campo">
                  <option value="">—</option>
                  {backlog.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.codigo} · {b.requisito.slice(0, 50)}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo rotulo="Evidência / observação" className="sm:col-span-2">
                <input name="evidencia" defaultValue={sel?.evidencia ?? ""} className="campo" />
              </Campo>
            </div>
            {sel?.dataFechamento && <p className="text-xs text-ardosia-500">Fechado em {formatarData(sel.dataFechamento)}.</p>}
          </Formulario>
        </Cartao>
      )}

      {sel?.tipo === "CHANGE_REQUEST" && !itemAberto(sel.status) && (
        <Cartao titulo={`Decisão do ${sel.codigo}`}>
          <p className="text-sm">
            <Selo tom={TOM_OPERACIONAL[sel.status]}>{STATUS_OPERACIONAL[sel.status]}</Selo> {sel.decisaoAprovador && <span className="text-ardosia-600">· {sel.decisaoAprovador}</span>}
          </p>
          <p className="mt-2 text-sm text-ardosia-600">
            {sel.crAplicadoEm
              ? `Impacto aplicado ao projeto em ${sel.crAplicadoEm.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}: ${sel.horasCr ? `+${sel.horasCr.toNumber()}h vendidas` : "sem horas"}${sel.diasCr ? `, Go Live deslocado ${sel.diasCr} dia(s) útil(eis)` : ""}. Considere criar uma nova linha de base.`
              : "Impacto não aplicado ao projeto."}
          </p>
        </Cartao>
      )}

      {editavel && sel?.tipo === "CHANGE_REQUEST" && itemAberto(sel.status) && (
        <Cartao titulo={`Decisão do ${sel.codigo}`}>
          <p className="mb-3 text-sm text-ardosia-600">
            Impacto informado: {sel.horasCr ? `${sel.horasCr.toNumber()}h` : "sem horas"} · {sel.diasCr ? `${sel.diasCr} dia(s) útil(eis) de prazo` : "sem prazo"}. Aprovado com
            “aplicar”, as horas entram nas horas vendidas do projeto e o Go Live alvo é deslocado.
          </p>
          <Formulario key={`cr-${sel.id}`} acao={decidirChangeRequest.bind(null, sel.id)} rotuloEnviar="Registrar decisão">
            <div className="grid gap-3 sm:grid-cols-3">
              <Campo rotulo="Decisão">
                <select name="decisao" defaultValue="APROVADO" className="campo">
                  <option value="APROVADO">Aprovar</option>
                  <option value="REPROVADO">Reprovar</option>
                </select>
              </Campo>
              <Campo rotulo="Aprovador(es)" className="sm:col-span-2">
                <input name="aprovador" required placeholder="Ex.: sponsor do cliente e Carlos Camargo" className="campo" />
              </Campo>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="aplicar" defaultChecked /> Aplicar o impacto ao projeto (horas vendidas e Go Live)
            </label>
          </Formulario>
        </Cartao>
      )}

      {tipo === "CHANGE_REQUEST" && (
        <Cartao titulo="Resumo dos change requests">
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {[
              ["Aprovados", todos.filter((i) => i.tipo === "CHANGE_REQUEST" && i.status === "APROVADO").length],
              ["Horas aprovadas", `${todos.filter((i) => i.tipo === "CHANGE_REQUEST" && i.status === "APROVADO").reduce((t, i) => t + (i.horasCr?.toNumber() ?? 0), 0)}h`],
              ["Dias aprovados", todos.filter((i) => i.tipo === "CHANGE_REQUEST" && i.status === "APROVADO").reduce((t, i) => t + (i.diasCr ?? 0), 0)],
              ["Em análise", todos.filter((i) => i.tipo === "CHANGE_REQUEST" && itemAberto(i.status)).length],
            ].map(([r, v]) => (
              <div key={r as string} className="rounded-md bg-fundo px-3 py-2">
                <dt className="text-[11px] font-medium tracking-wide text-ardosia-500 uppercase">{r}</dt>
                <dd className="font-semibold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </Cartao>
      )}
    </div>
  );
}
