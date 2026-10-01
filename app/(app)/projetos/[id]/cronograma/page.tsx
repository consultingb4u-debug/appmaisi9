import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth/sessao";
import { pode } from "@/lib/auth/permissoes";
import { chaveDia } from "@/lib/domain/datas";
import { FASE, STATUS_ITEM } from "@/lib/domain/rotulos";
import { rotuloSemana, semanaPorId } from "@/lib/domain/semanas";
import { carregarCronograma } from "@/lib/services/cronograma";
import { Campo, Cartao, Indicador, LinkBotao, Vazio } from "@/components/ui";
import { BotaoAcao, Formulario } from "@/components/formulario";
import { EditorAtribuicoes } from "@/components/editor-atribuicoes";
import { TabelaCronograma } from "@/components/cronograma/tabela";
import { GanttCronograma } from "@/components/cronograma/gantt";
import { excluirAtividade, salvarAtividade } from "../../cronograma-acoes";

const h = (n: number) => `${Math.round(n * 10) / 10}h`;

export default async function Cronograma({ params, searchParams }: PageProps<"/projetos/[id]/cronograma">) {
  const { id } = await params;
  const sp = await searchParams;
  const visao = sp.visao === "gantt" ? "gantt" : "tabela";
  const req = typeof sp.req === "string" ? sp.req : undefined;
  const usuario = await usuarioAtual();
  const editavel = pode(usuario.perfil, "editar", "PROJETOS");
  const projeto = await db.projeto.findUnique({ where: { id }, select: { id: true, clienteId: true } });
  if (!projeto) notFound();

  const { atividades, progresso, alertas } = await carregarCronograma(id);
  const filtradas = req ? atividades.filter((a) => a.backlogItemId === req) : atividades;
  const ativas = atividades.filter((a) => a.status !== "CANCELADO");
  const soma = (k: "previsto" | "realizado" | "paraConcluir" | "forecast") => ativas.reduce((t, a) => t + a.totais[k], 0);
  const atrasadas = ativas.filter((a) => a.situacao === "ATRASADO").length;

  const editarId = typeof sp.editar === "string" ? sp.editar : undefined;
  const nova = sp.nova === "1";
  const sel = editarId ? atividades.find((a) => a.id === editarId) : undefined;
  const qs = new URLSearchParams(Object.entries({ visao: visao === "gantt" ? "gantt" : undefined, req }).filter(([, v]) => v) as [string, string][]).toString();
  const base = `/projetos/${id}/cronograma?${qs ? `${qs}&` : ""}`;

  const [recursos, backlog, contatos, rateio] = await Promise.all([
    editavel ? db.recurso.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }) : [],
    db.backlogItem.findMany({ where: { projetoId: id }, orderBy: { codigo: "asc" }, select: { id: true, codigo: true, requisito: true } }),
    editavel ? db.contatoCliente.findMany({ where: { clienteId: projeto.clienteId }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }) : [],
    sel ? db.atribuicaoSemana.findMany({ where: { atribuicao: { atividadeId: sel.id } }, include: { atribuicao: { include: { recurso: { select: { nome: true } } } } }, orderBy: { semanaId: "asc" } }) : [],
  ]);
  const reqSel = req ? backlog.find((b) => b.id === req) : undefined;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Indicador rotulo="Progresso" valor={`${progresso}%`} detalhe="ponderado pelo esforço" />
        <Indicador rotulo="Previsto" valor={h(soma("previsto"))} />
        <Indicador rotulo="Realizado" valor={h(soma("realizado"))} />
        <Indicador rotulo="Falta" valor={h(soma("paraConcluir"))} />
        <Indicador rotulo="Forecast" valor={h(soma("forecast"))} detalhe={`desvio ${soma("forecast") - soma("previsto") > 0 ? "+" : ""}${h(soma("forecast") - soma("previsto"))}`} tom={soma("forecast") > soma("previsto") ? "critico" : "navy"} />
        <Indicador rotulo="Atrasadas" valor={atrasadas} tom={atrasadas ? "critico" : "ok"} />
      </div>

      {alertas.length > 0 && (
        <details className="rounded-lg border border-alerta/40 bg-alerta/5 px-4 py-3 text-sm">
          <summary className="cursor-pointer font-medium text-[#8a6a00]">Qualidade do cronograma: {alertas.length} ponto(s) para revisar</summary>
          <ul className="mt-2 space-y-1 text-xs text-ardosia-600">
            {alertas.map((a, i) => (
              <li key={i}>
                <Link href={`${base}editar=${a.atividadeId}`} scroll={false} className="font-medium text-navy-800 hover:underline">
                  {a.codigo}
                </Link>{" "}
                {a.mensagem}
              </li>
            ))}
          </ul>
        </details>
      )}

      <Cartao
        titulo={reqSel ? `Atividades de ${reqSel.codigo} · ${reqSel.requisito}` : `${atividades.length} atividade(s)`}
        acoes={
          <div className="flex items-center gap-2">
            {reqSel && (
              <Link href={`/projetos/${id}/cronograma${visao === "gantt" ? "?visao=gantt" : ""}`} className="text-xs text-ardosia-600 hover:underline">
                ver todas ✕
              </Link>
            )}
            <div className="flex rounded-md border border-ardosia-200 p-0.5 text-xs">
              {(["tabela", "gantt"] as const).map((v) => (
                <Link key={v} href={`/projetos/${id}/cronograma?${new URLSearchParams(Object.entries({ visao: v === "gantt" ? "gantt" : undefined, req }).filter(([, x]) => x) as [string, string][])}`} className={clsx("rounded px-2.5 py-1", visao === v ? "bg-navy-900 text-white" : "text-ardosia-600")}>
                  {v === "tabela" ? "Tabela" : "Gantt"}
                </Link>
              ))}
            </div>
            {editavel && (
              <LinkBotao href={`${base}nova=1`} tamanho="sm" scroll={false}>
                + Atividade
              </LinkBotao>
            )}
          </div>
        }
      >
        {filtradas.length === 0 ? (
          <Vazio>Nenhuma atividade. Inclua manualmente ou importe o CTRL-001 em Administração → Importação.</Vazio>
        ) : visao === "gantt" ? (
          <GanttCronograma atividades={filtradas} base={base} />
        ) : (
          <TabelaCronograma atividades={filtradas} editavel={editavel} base={base} selecionada={sel?.id} />
        )}
        {editavel && visao === "tabela" && filtradas.length > 0 && <p className="mt-6 text-xs text-ardosia-500">Datas, % e status podem ser alterados direto na tabela. Clique no ID para editar recursos, esforço, predecessoras e demais campos. Toda alteração redistribui as horas na Capacidade.</p>}
      </Cartao>

      {editavel && (sel || nova) && (
        <Cartao
          titulo={sel ? `${sel.codigo} · ${sel.tarefa}` : "Nova atividade"}
          acoes={
            <span className="flex items-center gap-2">
              {sel && (
                <BotaoAcao acao={excluirAtividade.bind(null, sel.id)} confirmar={`Excluir ${sel.codigo}?`}>
                  Excluir
                </BotaoAcao>
              )}
              <Link href={`/projetos/${id}/cronograma${qs ? `?${qs}` : ""}`} scroll={false} className="text-sm text-ardosia-500">
                ✕
              </Link>
            </span>
          }
        >
          <Formulario key={sel?.id ?? "nova"} acao={salvarAtividade.bind(null, id, sel?.id ?? null)} limparAoSalvar={!sel}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Campo rotulo="Tarefa" className="sm:col-span-2 lg:col-span-3">
                <input name="tarefa" required defaultValue={sel?.tarefa} className="campo" />
              </Campo>
              <Campo rotulo="Fase">
                <select name="fase" defaultValue={sel?.fase ?? "DEVELOPMENT"} className="campo">
                  {Object.entries(FASE).map(([k, r]) => (
                    <option key={k} value={k}>
                      {r}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo rotulo="Requisito (backlog)">
                <select name="backlogItemId" defaultValue={sel?.backlogItemId ?? req ?? ""} className="campo">
                  <option value="">—</option>
                  {backlog.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.codigo} · {b.requisito.slice(0, 60)}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo rotulo="Módulo · processo">
                <input name="moduloProcesso" defaultValue={sel?.moduloProcesso ?? ""} className="campo" />
              </Campo>
              <Campo rotulo="Responsável">
                <select name="responsavelId" defaultValue={sel?.responsavelId ?? ""} className="campo">
                  <option value="">—</option>
                  {recursos.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nome}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo rotulo="Recurso do cliente">
                <select name="contatoClienteId" defaultValue={sel?.contatoClienteId ?? ""} className="campo">
                  <option value="">—</option>
                  {contatos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo rotulo="Início previsto">
                <input type="date" name="inicioPrevisto" defaultValue={sel?.inicioPrevisto ? chaveDia(sel.inicioPrevisto) : ""} className="campo" />
              </Campo>
              <Campo rotulo="Fim previsto">
                <input type="date" name="fimPrevisto" defaultValue={sel?.fimPrevisto ? chaveDia(sel.fimPrevisto) : ""} className="campo" />
              </Campo>
              <Campo rotulo="% conclusão">
                <input type="number" name="percentualConclusao" min="0" max="100" defaultValue={sel?.percentualConclusao ?? 0} className="campo" />
              </Campo>
              <Campo rotulo="Status">
                <select name="status" defaultValue={sel?.status ?? "NAO_INICIADO"} className="campo">
                  {Object.entries(STATUS_ITEM).map(([k, r]) => (
                    <option key={k} value={k}>
                      {r}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo rotulo="Data real de conclusão">
                <input type="date" name="dataRealConclusao" defaultValue={sel?.dataRealConclusao ? chaveDia(sel.dataRealConclusao) : ""} className="campo" />
              </Campo>
              <div className="flex flex-col justify-end gap-2 pb-1 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="marco" defaultChecked={sel?.marco} /> Marco
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="clienteParticipa" defaultChecked={sel?.clienteParticipa} /> Cliente participa
                </label>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <span className="rotulo">Recursos MAIS i9 e esforço</span>
                <EditorAtribuicoes recursos={recursos} iniciais={sel?.atrib.map((x) => ({ recursoId: x.recursoId, previsto: x.previsto, falta: x.paraConcluir, realizado: x.realizado })) ?? []} />
              </div>
              <Campo rotulo="Predecessoras" ajuda="Ctrl/Cmd + clique para várias.">
                <select name="predecessoras" multiple size={7} defaultValue={sel?.predecessoras.map((p) => p.predecessora.id) ?? []} className="campo">
                  {atividades
                    .filter((a) => a.id !== sel?.id)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.codigo} · {a.tarefa.slice(0, 40)}
                      </option>
                    ))}
                </select>
              </Campo>
              <Campo rotulo="Observação" className="sm:col-span-2 lg:col-span-4">
                <textarea name="observacao" rows={2} defaultValue={sel?.observacao ?? ""} className="campo" />
              </Campo>
            </div>
          </Formulario>

          {sel && rateio.length > 0 && (
            <div className="mt-6 border-t border-ardosia-100 pt-4">
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-ardosia-500 uppercase">Distribuição automática nas semanas (o que falta, por dia útil)</h3>
              <div className="flex flex-wrap gap-2 text-sm">
                {rateio.map((r) => {
                  const s = semanaPorId(r.semanaId);
                  return (
                    <span key={`${r.atribuicaoId}${r.semanaId}`} className="rounded-md bg-fundo px-2 py-1">
                      {r.atribuicao.recurso.nome.split(" ")[0]} · {s ? rotuloSemana(s) : r.semanaId}: <strong className="tabular-nums">{r.horasCalculadas.toNumber()}h</strong>
                    </span>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-ardosia-500">
                Para ajustar uma semana específica, use{" "}
                <Link href={`/capacidade/planejamento?projeto=${id}`} className="underline">
                  Capacidade › Planejamento
                </Link>
                : o valor digitado lá vira um ajuste manual por cima do cronograma.
              </p>
            </div>
          )}
        </Cartao>
      )}
    </div>
  );
}
