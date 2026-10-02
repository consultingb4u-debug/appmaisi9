import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth/sessao";
import { pode } from "@/lib/auth/permissoes";
import { resumoTestes, type Resultado } from "@/lib/domain/execucao";
import { formatarData } from "@/lib/domain/datas";
import { NIVEL_IMPACTO, RESULTADO_TESTE, STATUS_OPERACIONAL, TOM_RESULTADO, TOM_VALIDACAO, VALIDACAO } from "@/lib/domain/rotulos";
import { casosComUltima } from "@/lib/services/execucao";
import { Barra, BotaoExportar, Campo, Cartao, Indicador, LinkBotao, opcoes, Selo, valorData, Vazio } from "@/components/ui";
import { BotaoAcao, Formulario } from "@/components/formulario";
import { excluirCaso, excluirExecucao, registrarExecucao, salvarCaso } from "@/app/(app)/projetos/execucao-acoes";

/** Tela compartilhada por "Testes Internos" (TI-xxx) e "UAT" (UAT-xxx): casos + ciclos de execução. */
export async function PaginaTestes({ projetoId, tipo, sp }: { projetoId: string; tipo: "INTERNO" | "UAT"; sp: Record<string, string | string[] | undefined> }) {
  const usuario = await usuarioAtual();
  const editavel = pode(usuario.perfil, "editar", "PROJETOS");
  const projeto = await db.projeto.findUnique({ where: { id: projetoId }, select: { id: true, cliente: { select: { nome: true } } } });
  if (!projeto) notFound();
  const [casos, recursos, backlog] = await Promise.all([
    casosComUltima(projetoId, tipo),
    db.recurso.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    db.backlogItem.findMany({ where: { projetoId }, orderBy: [{ ordem: "asc" }, { codigo: "asc" }], select: { id: true, codigo: true, requisito: true } }),
  ]);
  const uat = tipo === "UAT";
  const base = `/projetos/${projetoId}/${uat ? "uat" : "testes"}`;
  const filtro = typeof sp.resultado === "string" ? sp.resultado : null;
  const lista = filtro ? casos.filter((c) => (c.ultima?.resultado ?? "PLANEJADO") === filtro || (filtro === "PENDENTE" && (!c.ultima || ["PLANEJADO", "NAO_EXECUTADO"].includes(c.ultima.resultado)))) : casos;
  const r = resumoTestes(casos.map((c) => (c.ultima?.resultado as Resultado) ?? null));
  const sel = typeof sp.caso === "string" ? casos.find((c) => c.id === sp.caso) : null;
  const novo = editavel && sp.novo === "1";
  const nomeResp = uat ? "Key user / cliente" : "Responsável MAIS i9";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Indicador rotulo="Casos" valor={r.total} detalhe={r.na ? `${r.na} N/A` : undefined} href={base} />
        <Indicador rotulo="Aprovados" valor={r.aprovados} tom="ok" href={`${base}?resultado=APROVADO`} detalhe={`${r.aprovado}% dos aplicáveis`} />
        <Indicador rotulo="Reprovados" valor={r.reprovados} tom={r.reprovados ? "critico" : "navy"} href={`${base}?resultado=REPROVADO`} />
        <Indicador rotulo="Bloqueados" valor={r.bloqueados} tom={r.bloqueados ? "alerta" : "navy"} href={`${base}?resultado=BLOQUEADO`} />
        <Indicador rotulo="Pendentes" valor={r.pendentes} href={`${base}?resultado=PENDENTE`} detalhe={`${r.executado}% executado`} />
      </div>
      {r.total > 0 && <Barra valor={r.aprovado} tom={r.reprovados ? "alerta" : "ok"} />}

      <Cartao
        titulo={`${uat ? "Roteiro de UAT" : "Casos de teste interno"}${filtro ? ` · filtro: ${filtro === "PENDENTE" ? "pendentes" : RESULTADO_TESTE[filtro as Resultado]}` : ""}`}
        acoes={
          <span className="flex items-center gap-2">
            <BotaoExportar href={`/exportar/${uat ? "uat" : "testes"}?projeto=${projetoId}`} rotulo="Excel" />
            {filtro && (
              <Link href={base} className="text-xs text-ardosia-500 hover:underline">
                limpar filtro
              </Link>
            )}
            {editavel && !novo && (
              <LinkBotao href={`${base}?novo=1`} tamanho="sm">
                + Caso
              </LinkBotao>
            )}
          </span>
        }
      >
        {lista.length === 0 ? (
          <Vazio>{casos.length ? "Nenhum caso neste filtro." : `Nenhum caso de ${uat ? "UAT" : "teste interno"}. Inclua manualmente ou importe o CTRL-001 do projeto.`}</Vazio>
        ) : (
          <div className="-m-4 overflow-x-auto">
            <table className="tabela">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Requisito</th>
                  <th>Módulo</th>
                  <th>Cenário</th>
                  <th>{nomeResp}</th>
                  <th>Ciclo</th>
                  <th>Data</th>
                  <th>Resultado</th>
                  <th>{uat ? "Aceite" : "Validação"}</th>
                  <th>Defeito</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((c) => (
                  <tr key={c.id} className={c.id === sel?.id ? "bg-destaque/5" : ""}>
                    <td className="whitespace-nowrap">
                      <Link href={`${base}?caso=${c.id}`} scroll={false} className="font-medium text-navy-800 hover:underline">
                        {c.codigo}
                      </Link>
                    </td>
                    <td className="text-xs">{c.backlogItem?.codigo ?? "—"}</td>
                    <td className="text-xs">{c.moduloProcesso ?? "—"}</td>
                    <td className="max-w-md">{c.cenario.split("\n")[0]}</td>
                    <td className="text-xs">{c.responsavel?.nome ?? c.responsavelTexto ?? "—"}</td>
                    <td className="text-center text-xs tabular-nums">{c.ultima?.ciclo ?? "—"}</td>
                    <td className="text-xs whitespace-nowrap">{formatarData(c.ultima?.data)}</td>
                    <td>
                      <Selo tom={TOM_RESULTADO[c.ultima?.resultado ?? "PLANEJADO"]}>{RESULTADO_TESTE[c.ultima?.resultado ?? "PLANEJADO"]}</Selo>
                    </td>
                    <td>{c.ultima ? <Selo tom={TOM_VALIDACAO[c.ultima.validacao]}>{VALIDACAO[c.ultima.validacao]}</Selo> : "—"}</td>
                    <td className="text-xs whitespace-nowrap">
                      {c.execucoes
                        .filter((e) => e.defeito)
                        .map((e) => (
                          <Link key={e.id} href={`/projetos/${projetoId}/operacional?editar=${e.defeito!.id}&situacao=todos`} className="mr-1 hover:underline" title={STATUS_OPERACIONAL[e.defeito!.status]}>
                            {e.defeito!.codigo}
                          </Link>
                        ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Cartao>

      {(sel || novo) && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Cartao
            titulo={sel ? `Caso ${sel.codigo}` : "Novo caso"}
            acoes={
              <span className="flex items-center gap-2">
                {sel && editavel && (
                  <BotaoAcao acao={excluirCaso.bind(null, sel.id)} confirmar={`Excluir ${sel.codigo} e todos os ciclos?`}>
                    Excluir
                  </BotaoAcao>
                )}
                <Link href={base} className="text-sm text-ardosia-500">
                  ✕
                </Link>
              </span>
            }
          >
            <Formulario key={sel?.id ?? "novo"} acao={salvarCaso.bind(null, projetoId, tipo, sel?.id ?? null)} limparAoSalvar={!sel} somenteLeitura={!editavel}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo rotulo="Requisito">
                  <select name="backlogItemId" defaultValue={sel?.backlogItemId ?? ""} className="campo">
                    <option value="">—</option>
                    {backlog.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.codigo} · {b.requisito.slice(0, 50)}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo rotulo="Módulo · processo">
                  <input name="moduloProcesso" defaultValue={sel?.moduloProcesso ?? ""} className="campo" />
                </Campo>
                <Campo rotulo="Cenário" className="sm:col-span-2">
                  <input name="cenario" required defaultValue={sel?.cenario} className="campo" />
                </Campo>
                {!uat && (
                  <Campo rotulo="Pré-condição" className="sm:col-span-2">
                    <input name="preCondicao" defaultValue={sel?.preCondicao ?? ""} className="campo" />
                  </Campo>
                )}
                <Campo rotulo="Passos" className="sm:col-span-2">
                  <textarea name="passos" rows={4} defaultValue={sel?.passos ?? ""} className="campo" />
                </Campo>
                <Campo rotulo="Resultado esperado" className="sm:col-span-2">
                  <input name="resultadoEsperado" defaultValue={sel?.resultadoEsperado ?? ""} className="campo" />
                </Campo>
                {!uat && (
                  <Campo rotulo="Responsável MAIS i9">
                    <select name="responsavelId" defaultValue={sel?.responsavelId ?? ""} className="campo">
                      <option value="">—</option>
                      {recursos.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.nome}
                        </option>
                      ))}
                    </select>
                  </Campo>
                )}
                <Campo rotulo={uat ? "Key user / cliente" : "…ou responsável (texto)"}>
                  <input name="responsavelTexto" defaultValue={sel?.responsavelTexto ?? (uat && !sel ? projeto.cliente.nome : "")} className="campo" />
                </Campo>
              </div>
            </Formulario>
          </Cartao>

          {sel && (
            <Cartao titulo={`Execuções · ${sel.execucoes.length} ciclo(s)`}>
              {sel.execucoes.length > 0 && (
                <ul className="mb-4 divide-y divide-ardosia-100 text-sm">
                  {sel.execucoes.map((e) => (
                    <li key={e.id} className="flex items-start justify-between gap-3 py-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Ciclo {e.ciclo}</span>
                          <Selo tom={TOM_RESULTADO[e.resultado]}>{RESULTADO_TESTE[e.resultado]}</Selo>
                          <span className="text-xs text-ardosia-500">
                            {formatarData(e.data)} {e.executor && `· ${e.executor}`} · {uat ? "aceite" : "validação"} {VALIDACAO[e.validacao].toLowerCase()}
                          </span>
                        </div>
                        {(e.resultadoObtido || e.observacao || e.evidencia) && (
                          <div className="mt-0.5 text-xs text-ardosia-600">{[e.resultadoObtido, e.observacao, e.evidencia && `Evidência: ${e.evidencia}`].filter(Boolean).join(" · ")}</div>
                        )}
                        {e.defeito && (
                          <Link href={`/projetos/${projetoId}/operacional?editar=${e.defeito.id}&situacao=todos`} className="text-xs text-critico hover:underline">
                            Defeito {e.defeito.codigo} ({STATUS_OPERACIONAL[e.defeito.status].toLowerCase()})
                          </Link>
                        )}
                      </div>
                      {editavel && (
                        <BotaoAcao acao={excluirExecucao.bind(null, e.id)} confirmar={`Excluir o ciclo ${e.ciclo}?`} variante="fantasma">
                          ✕
                        </BotaoAcao>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {editavel && (
                <>
                  <h3 className="mb-2 text-sm font-semibold text-navy-900">Registrar ciclo {Math.max(0, ...sel.execucoes.map((e) => e.ciclo)) + 1}</h3>
                  <Formulario key={sel.id} acao={registrarExecucao.bind(null, sel.id)} rotuloEnviar="Registrar execução" limparAoSalvar>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Campo rotulo="Data">
                        <input name="data" type="date" defaultValue={valorData(new Date())} className="campo" />
                      </Campo>
                      <Campo rotulo="Executor">
                        <input name="executor" defaultValue={sel.responsavel?.nome ?? sel.responsavelTexto ?? ""} className="campo" />
                      </Campo>
                      <Campo rotulo="Resultado">
                        <select name="resultado" defaultValue="APROVADO" className="campo">
                          {opcoes(RESULTADO_TESTE)}
                        </select>
                      </Campo>
                      <Campo rotulo={uat ? "Aceite do cliente" : "Validação MAIS i9"}>
                        <select name="validacao" defaultValue="PENDENTE" className="campo">
                          {opcoes(VALIDACAO)}
                        </select>
                      </Campo>
                      <Campo rotulo="Resultado obtido" className="sm:col-span-2">
                        <input name="resultadoObtido" className="campo" />
                      </Campo>
                      <Campo rotulo="Evidência (link ou referência)">
                        <input name="evidencia" className="campo" />
                      </Campo>
                      <Campo rotulo="Observação">
                        <input name="observacao" className="campo" />
                      </Campo>
                      <label className="flex items-center gap-2 text-sm sm:col-span-1">
                        <input type="checkbox" name="abrirDefeito" defaultChecked />
                        Se reprovado/bloqueado, abrir defeito no Operacional
                      </label>
                      <Campo rotulo="Gravidade do defeito">
                        <select name="gravidade" defaultValue="MEDIO" className="campo">
                          {opcoes({ BAIXO: NIVEL_IMPACTO.BAIXO, MEDIO: NIVEL_IMPACTO.MEDIO, ALTO: NIVEL_IMPACTO.ALTO })}
                        </select>
                      </Campo>
                    </div>
                  </Formulario>
                </>
              )}
            </Cartao>
          )}
        </div>
      )}
    </div>
  );
}
