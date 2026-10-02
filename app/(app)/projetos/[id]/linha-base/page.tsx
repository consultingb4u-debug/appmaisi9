import Link from "next/link";
import clsx from "clsx";
import { usuarioAtual } from "@/lib/auth/sessao";
import { pode } from "@/lib/auth/permissoes";
import { formatarData } from "@/lib/domain/datas";
import { semanaDe } from "@/lib/domain/semanas";
import { painelLinhaBase } from "@/lib/services/linha-base";
import { Campo, Cartao, Indicador, Selo, Vazio } from "@/components/ui";
import { BotaoAcao, Formulario } from "@/components/formulario";
import { CurvaS } from "@/components/curva-s";
import { excluirLinhaBase, salvarLinhaBase } from "../../linha-base-acoes";

const SITUACAO = { IGUAL: ["Igual", "neutro"], ALTERADA: ["Alterada", "alerta"], NOVA: ["Nova", "livre"], REMOVIDA: ["Removida", "critico"] } as const;
const sinal = (n: number | null, un: string) => (n === null ? "—" : n === 0 ? "0" : `${n > 0 ? "+" : ""}${n.toLocaleString("pt-BR")}${un}`);

export default async function LinhaDeBase({ params, searchParams }: PageProps<"/projetos/[id]/linha-base">) {
  const { id } = await params;
  const { lb, todas } = await searchParams;
  const usuario = await usuarioAtual();
  const editavel = pode(usuario.perfil, "editar", "PROJETOS");
  const d = await painelLinhaBase(id, typeof lb === "string" ? lb : undefined);
  const atual = semanaDe(new Date()).id;
  const r = d.comparacao?.resumo;
  const linhas = d.comparacao ? (todas === "1" ? d.comparacao.linhas : d.comparacao.linhas.filter((l) => l.situacao !== "IGUAL")) : [];
  const base = `/projetos/${id}/linha-base`;

  return (
    <div className="space-y-6">
      {d.sel && r && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Indicador
            rotulo="Progresso real × planejado"
            valor={`${d.progressoReal}% · ${d.progressoPlanejado ?? 0}%`}
            detalhe={d.progressoPlanejado !== null && d.progressoReal < d.progressoPlanejado ? `${Math.round((d.progressoPlanejado - d.progressoReal) * 10) / 10} p.p. abaixo da base` : "em linha com a base"}
            tom={d.progressoPlanejado !== null && d.progressoReal + 10 < d.progressoPlanejado ? "critico" : d.progressoPlanejado !== null && d.progressoReal < d.progressoPlanejado ? "alerta" : "ok"}
          />
          <Indicador
            rotulo="Fim do cronograma"
            valor={sinal(r.deslizamentoDias, " d")}
            detalhe={`base ${formatarData(r.fimBase)} · atual ${formatarData(r.fimAtual)}`}
            tom={(r.deslizamentoDias ?? 0) > 0 ? "critico" : "ok"}
          />
          <Indicador rotulo="Esforço" valor={sinal(Math.round((r.esforcoAtual - r.esforcoBase) * 10) / 10, "h")} detalhe={`base ${r.esforcoBase}h · atual ${r.esforcoAtual}h`} tom={r.esforcoAtual > r.esforcoBase ? "alerta" : "ok"} />
          <Indicador rotulo="Mudanças" valor={r.alteradas + r.novas + r.removidas} detalhe={`${r.alteradas} alteradas · ${r.novas} novas · ${r.removidas} removidas · ${r.marcosAtrasados} marco(s) atrasado(s)`} tom={r.marcosAtrasados ? "critico" : "navy"} />
        </div>
      )}

      <Cartao titulo="Curva S (horas acumuladas)">
        {d.curva.length === 0 ? (
          <Vazio>Sem horas planejadas, apontadas ou previstas para desenhar a curva.</Vazio>
        ) : (
          <>
            {!d.sel && <p className="mb-2 text-sm text-ardosia-500">Sem linha de base: a curva mostra só realizado e forecast. Crie uma linha de base para comparar com o planejado.</p>}
            <CurvaS pontos={d.curva.map((p) => ({ rotulo: p.rotulo, planejado: p.planejado, realizado: p.realizado, forecast: p.forecast, atual: p.semanaId === atual }))} />
          </>
        )}
      </Cartao>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Cartao
          titulo={d.sel ? `Atual × "${d.sel.nome}"` : "Comparação com a linha de base"}
          acoes={
            d.comparacao && (
              <Link href={todas === "1" ? `${base}?lb=${d.sel!.id}` : `${base}?lb=${d.sel!.id}&todas=1`} className="text-xs text-ardosia-600 hover:underline">
                {todas === "1" ? "só mudanças" : "mostrar todas"}
              </Link>
            )
          }
        >
          {!d.sel ? (
            <Vazio>Nenhuma linha de base. Congele o cronograma aprovado (no kick-off ou após um change request) para medir desvios de prazo e esforço.</Vazio>
          ) : linhas.length === 0 ? (
            <Vazio>O cronograma atual está igual à linha de base.</Vazio>
          ) : (
            <div className="-m-4 overflow-x-auto">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tarefa</th>
                    <th>Situação</th>
                    <th>Fim base</th>
                    <th>Fim atual</th>
                    <th className="text-right">Desvio fim</th>
                    <th className="text-right">Esforço base</th>
                    <th className="text-right">Atual</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((l) => (
                    <tr key={l.codigo}>
                      <td className="whitespace-nowrap">
                        {l.codigo}
                        {l.base?.marco && <span title="Marco"> ◆</span>}
                      </td>
                      <td className="max-w-sm">{l.tarefa}</td>
                      <td>
                        <Selo tom={SITUACAO[l.situacao][1]}>{SITUACAO[l.situacao][0]}</Selo>
                      </td>
                      <td className="text-xs whitespace-nowrap">{formatarData(l.base?.fim)}</td>
                      <td className="text-xs whitespace-nowrap">{formatarData(l.atual?.fim)}</td>
                      <td className={clsx("text-right tabular-nums", (l.desvioFim ?? 0) > 0 && "font-medium text-critico")}>{sinal(l.desvioFim, " d")}</td>
                      <td className="text-right tabular-nums">{l.base ? `${l.base.esforco}h` : "—"}</td>
                      <td className="text-right tabular-nums">{l.atual && l.situacao !== "REMOVIDA" ? `${l.atual.esforco}h` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Cartao>

        <div className="space-y-6">
          <Cartao titulo="Linhas de base">
            {d.linhas.length === 0 ? (
              <p className="text-sm text-ardosia-500">Nenhuma ainda.</p>
            ) : (
              <ul className="-m-2 space-y-1">
                {d.linhas.map((l, k) => (
                  <li key={l.id} className={clsx("flex items-start justify-between gap-2 rounded px-2 py-1.5 text-sm", l.id === d.sel?.id && "bg-fundo")}>
                    <Link href={`${base}?lb=${l.id}`} className="min-w-0">
                      <div className="font-medium text-navy-900">
                        {l.nome} {k === 0 && <Selo tom="ok">vigente</Selo>}
                      </div>
                      <div className="text-xs text-ardosia-500">
                        {l.criadaEm.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })} · {l._count.itens} atividades{l.goLive ? ` · Go Live ${formatarData(l.goLive)}` : ""}
                      </div>
                      {l.observacao && <div className="text-xs text-ardosia-600">{l.observacao}</div>}
                    </Link>
                    {editavel && (
                      <BotaoAcao acao={excluirLinhaBase.bind(null, l.id)} variante="fantasma" confirmar={`Excluir a linha de base "${l.nome}"?`}>
                        ✕
                      </BotaoAcao>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Cartao>
          {editavel && (
            <Cartao titulo="Congelar cronograma atual">
              <Formulario acao={salvarLinhaBase.bind(null, id)} limparAoSalvar rotuloEnviar="Criar linha de base">
                <Campo rotulo="Nome">
                  <input name="nome" required placeholder={d.linhas.length ? `Rebaseline ${d.linhas.length}` : "Baseline do kick-off"} className="campo" />
                </Campo>
                <Campo rotulo="Motivo / observação">
                  <input name="observacao" placeholder="Ex.: CR-001 aprovado" className="campo" />
                </Campo>
              </Formulario>
            </Cartao>
          )}
        </div>
      </div>
    </div>
  );
}
