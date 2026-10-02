import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth/sessao";
import { podeEditarProjeto } from "@/lib/auth/escopo";
import { prontidaoGoLive } from "@/lib/domain/execucao";
import { formatarData } from "@/lib/domain/datas";
import { DECISAO_GO, OBRIGATORIEDADE, STATUS_CHECKLIST, TOM_CHECKLIST, TOM_DECISAO_GO, TOM_VALIDACAO, VALIDACAO } from "@/lib/domain/rotulos";
import { resumoExecucao } from "@/lib/services/execucao";
import { Barra, Campo, Cartao, LinkBotao, opcoes, Selo, valorData, Vazio } from "@/components/ui";
import { BotaoAcao, Formulario } from "@/components/formulario";
import { excluirDeployment, excluirItemDeployment, salvarDeployment, salvarItemDeployment } from "../../execucao-acoes";

export default async function Deployment({ params, searchParams }: PageProps<"/projetos/[id]/deployment">) {
  const { id } = await params;
  const sp = await searchParams;
  const usuario = await usuarioAtual();
  const editavel = await podeEditarProjeto(usuario, id);
  const projeto = await db.projeto.findUnique({ where: { id }, select: { id: true, dataGoLiveAlvo: true, dataGoLiveReal: true, gp: { select: { nome: true } } } });
  if (!projeto) notFound();
  const [deployments, recursos, resumo] = await Promise.all([
    db.deployment.findMany({
      where: { projetoId: id },
      orderBy: { criadoEm: "asc" },
      include: { itens: { orderBy: { ordem: "asc" }, include: { responsavel: { select: { nome: true } } } } },
    }),
    db.recurso.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    resumoExecucao(id),
  ]);
  const base = `/projetos/${id}/deployment`;
  const novoDeployment = editavel && (sp.novo === "1" || deployments.length === 0);
  const dep = novoDeployment && sp.novo === "1" ? null : (deployments.find((d) => d.id === sp.dep) ?? deployments.at(-1) ?? null);
  const link = (extra: string) => `${base}?${dep ? `dep=${dep.id}&` : ""}${extra}`;
  const item = dep && typeof sp.item === "string" ? dep.itens.find((i) => i.id === sp.item) : null;
  const novoItem = editavel && dep && sp.novoItem === "1";
  const pront = dep
    ? prontidaoGoLive({ itens: dep.itens, defeitosGraves: resumo.defeitosGraves, uatReprovados: resumo.testesUat.reprovados, uatPendentes: resumo.testesUat.pendentes + resumo.testesUat.bloqueados })
    : null;

  return (
    <div className="space-y-6">
      {deployments.length > 1 && (
        <div className="flex flex-wrap gap-2 text-sm">
          {deployments.map((d) => (
            <Link key={d.id} href={`${base}?dep=${d.id}`} className={clsx("rounded-full px-3 py-1", d.id === dep?.id ? "bg-navy-900 text-white" : "bg-white text-ardosia-600 ring-1 ring-ardosia-200")}>
              {d.nome}
            </Link>
          ))}
        </div>
      )}

      {!dep && !editavel && <Vazio>Nenhum deployment planejado.</Vazio>}

      {dep && pront && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Cartao titulo="Prontidão para o Go Live" className="lg:col-span-2">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>
                Checklist aplicável concluído: <strong className="tabular-nums">{pront.percentual}%</strong>
              </span>
              <span className="flex items-center gap-2">
                Sugestão: <Selo tom={TOM_DECISAO_GO[pront.sugestao]}>{DECISAO_GO[pront.sugestao]}</Selo>
              </span>
            </div>
            <Barra valor={pront.percentual} tom={pront.bloqueios.length ? "critico" : pront.ressalvas.length ? "alerta" : "ok"} />
            <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <h3 className="mb-1 text-xs font-medium tracking-wide text-critico uppercase">Bloqueios ({pront.bloqueios.length})</h3>
                {pront.bloqueios.length ? (
                  <ul className="list-disc space-y-0.5 pl-4 text-ardosia-700">
                    {pront.bloqueios.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-ardosia-500">Nenhum.</p>
                )}
              </div>
              <div>
                <h3 className="mb-1 text-xs font-medium tracking-wide text-[#8a6a00] uppercase">Ressalvas ({pront.ressalvas.length})</h3>
                {pront.ressalvas.length ? (
                  <ul className="list-disc space-y-0.5 pl-4 text-ardosia-700">
                    {pront.ressalvas.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-ardosia-500">Nenhuma.</p>
                )}
              </div>
            </div>
            <p className="mt-3 text-xs text-ardosia-500">
              Considera o checklist abaixo, os defeitos altos/críticos abertos no Operacional ({resumo.defeitosGraves}) e o resultado da UAT ({resumo.testesUat.aprovados} aprovados de {resumo.testesUat.total}). A decisão final é dos aprovadores.
            </p>
          </Cartao>
          <Cartao titulo="Decisão" acoes={<Selo tom={TOM_DECISAO_GO[dep.decisao]}>{DECISAO_GO[dep.decisao]}</Selo>}>
            <dl className="space-y-2 text-sm">
              {[
                ["Janela", dep.janelaInicio ? `${formatarData(dep.janelaInicio)} a ${formatarData(dep.janelaFim)}` : "—"],
                ["Decidido em", formatarData(dep.dataDecisao)],
                ["Aprovadores", dep.aprovadores ?? "—"],
                ["Go Live real", formatarData(dep.dataGoLiveReal)],
                ["Hypercare", dep.hypercareInicio ? `${formatarData(dep.hypercareInicio)} a ${formatarData(dep.hypercareFim)}` : "—"],
              ].map(([r, v]) => (
                <div key={r} className="flex justify-between gap-3">
                  <dt className="text-ardosia-500">{r}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            {dep.justificativa && <p className="mt-3 text-xs text-ardosia-600">{dep.justificativa}</p>}
          </Cartao>
        </div>
      )}

      {dep && (
        <Cartao
          titulo={`Checklist · ${dep.nome}`}
          acoes={
            editavel &&
            !novoItem &&
            !item && (
              <span className="flex items-center gap-2">
                <LinkBotao href={`${base}?novo=1`} tamanho="sm" variante="secundario">
                  + Deployment
                </LinkBotao>
                <LinkBotao href={link("novoItem=1")} tamanho="sm">
                  + Item
                </LinkBotao>
              </span>
            )
          }
        >
          {dep.itens.length === 0 ? (
            <Vazio>Checklist vazio.</Vazio>
          ) : (
            <div className="-m-4 overflow-x-auto">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>Item</th>
                    <th>Obrigatório</th>
                    <th>Responsável</th>
                    <th>Previsto</th>
                    <th>Real</th>
                    <th>Status</th>
                    <th>Aprovação</th>
                    <th>Evidência / risco</th>
                  </tr>
                </thead>
                <tbody>
                  {dep.itens.map((i) => (
                    <tr key={i.id} className={i.id === item?.id ? "bg-destaque/5" : ""}>
                      <td className="text-xs whitespace-nowrap">{i.categoria}</td>
                      <td>
                        {editavel ? (
                          <Link href={link(`item=${i.id}`)} scroll={false} className="font-medium text-navy-800 hover:underline">
                            {i.item}
                          </Link>
                        ) : (
                          i.item
                        )}
                      </td>
                      <td className="text-xs">{OBRIGATORIEDADE[i.obrigatorio]}</td>
                      <td className="text-xs">{i.responsavel?.nome ?? i.responsavelTexto ?? "—"}</td>
                      <td className="text-xs whitespace-nowrap">{formatarData(i.dataPrevista)}</td>
                      <td className="text-xs whitespace-nowrap">{formatarData(i.dataReal)}</td>
                      <td>
                        <Selo tom={TOM_CHECKLIST[i.status]}>{STATUS_CHECKLIST[i.status]}</Selo>
                      </td>
                      <td>
                        <Selo tom={TOM_VALIDACAO[i.aprovacao]}>{VALIDACAO[i.aprovacao]}</Selo>
                      </td>
                      <td className="max-w-xs text-xs text-ardosia-600">{[i.evidencia, i.riscoObservacao].filter(Boolean).join(" · ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Cartao>
      )}

      {dep && (item || novoItem) && (
        <Cartao
          titulo={item ? "Editar item" : "Novo item"}
          acoes={
            <span className="flex items-center gap-2">
              {item && (
                <BotaoAcao acao={excluirItemDeployment.bind(null, item.id)} confirmar="Excluir este item?">
                  Excluir
                </BotaoAcao>
              )}
              <Link href={`${base}?dep=${dep.id}`} className="text-sm text-ardosia-500">
                ✕
              </Link>
            </span>
          }
        >
          <Formulario key={item?.id ?? "novo"} acao={salvarItemDeployment.bind(null, dep.id, item?.id ?? null)} limparAoSalvar={!item}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Campo rotulo="Categoria">
                <input name="categoria" required defaultValue={item?.categoria} className="campo" />
              </Campo>
              <Campo rotulo="Item" className="lg:col-span-3">
                <input name="item" required defaultValue={item?.item} className="campo" />
              </Campo>
              <Campo rotulo="Obrigatório?">
                <select name="obrigatorio" defaultValue={item?.obrigatorio ?? "SIM"} className="campo">
                  {opcoes(OBRIGATORIEDADE)}
                </select>
              </Campo>
              <Campo rotulo="Status">
                <select name="status" defaultValue={item?.status ?? "PENDENTE"} className="campo">
                  {opcoes(STATUS_CHECKLIST)}
                </select>
              </Campo>
              <Campo rotulo="Aprovação">
                <select name="aprovacao" defaultValue={item?.aprovacao ?? "PENDENTE"} className="campo">
                  {opcoes(VALIDACAO)}
                </select>
              </Campo>
              <Campo rotulo="Responsável MAIS i9">
                <select name="responsavelId" defaultValue={item?.responsavelId ?? ""} className="campo">
                  <option value="">—</option>
                  {recursos.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nome}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo rotulo="…ou responsável (texto)">
                <input name="responsavelTexto" defaultValue={item?.responsavelTexto ?? ""} className="campo" />
              </Campo>
              <Campo rotulo="Data prevista">
                <input name="dataPrevista" type="date" defaultValue={valorData(item?.dataPrevista)} className="campo" />
              </Campo>
              <Campo rotulo="Data real" ajuda="Preenchida com hoje ao concluir, se vazia.">
                <input name="dataReal" type="date" defaultValue={valorData(item?.dataReal)} className="campo" />
              </Campo>
              <Campo rotulo="Evidência">
                <input name="evidencia" defaultValue={item?.evidencia ?? ""} className="campo" />
              </Campo>
              <Campo rotulo="Risco / observação" className="sm:col-span-2 lg:col-span-4">
                <input name="riscoObservacao" defaultValue={item?.riscoObservacao ?? ""} className="campo" />
              </Campo>
            </div>
          </Formulario>
        </Cartao>
      )}

      {editavel && (novoDeployment || dep) && !item && !novoItem && (
        <Cartao
          titulo={dep ? `Janela, decisão e hypercare · ${dep.nome}` : "Planejar deployment"}
          acoes={
            dep ? (
              <BotaoAcao acao={excluirDeployment.bind(null, dep.id)} confirmar={`Excluir o deployment ${dep.nome} e o checklist?`}>
                Excluir deployment
              </BotaoAcao>
            ) : (
              deployments.length > 0 && (
                <Link href={base} className="text-sm text-ardosia-500">
                  ✕
                </Link>
              )
            )
          }
        >
          {!dep && <p className="mb-3 text-sm text-ardosia-600">O deployment nasce com o checklist-modelo do CTRL-001 (12 itens), que pode ser ajustado.</p>}
          <Formulario key={dep?.id ?? "novo"} acao={salvarDeployment.bind(null, id, dep?.id ?? null)} rotuloEnviar={dep ? "Salvar" : "Criar deployment"}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Campo rotulo="Nome">
                <input name="nome" required defaultValue={dep?.nome ?? (deployments.length ? `Onda ${deployments.length + 1}` : "Go Live")} className="campo" />
              </Campo>
              <Campo rotulo="Janela: início">
                <input name="janelaInicio" type="date" defaultValue={valorData(dep ? dep.janelaInicio : projeto.dataGoLiveAlvo)} className="campo" />
              </Campo>
              <Campo rotulo="Janela: fim">
                <input name="janelaFim" type="date" defaultValue={valorData(dep ? dep.janelaFim : projeto.dataGoLiveAlvo)} className="campo" />
              </Campo>
              <Campo rotulo="Decisão Go/No-Go">
                <select name="decisao" defaultValue={dep?.decisao ?? "PENDENTE"} className="campo">
                  {opcoes(DECISAO_GO)}
                </select>
              </Campo>
              <Campo rotulo="Data da decisão">
                <input name="dataDecisao" type="date" defaultValue={valorData(dep?.dataDecisao)} className="campo" />
              </Campo>
              <Campo rotulo="Aprovadores" className="lg:col-span-3" ajuda="Ex.: Carlos Camargo, Alexandre Camargo, Murilo Fernandes e sponsor do cliente.">
                <input name="aprovadores" defaultValue={dep?.aprovadores ?? ""} className="campo" />
              </Campo>
              <Campo rotulo="Justificativa / ressalvas" className="sm:col-span-2 lg:col-span-4">
                <textarea name="justificativa" rows={2} defaultValue={dep?.justificativa ?? ""} className="campo" />
              </Campo>
              <Campo rotulo="Go Live real">
                <input name="dataGoLiveReal" type="date" defaultValue={valorData(dep?.dataGoLiveReal)} className="campo" />
              </Campo>
              <label className="flex items-center gap-2 self-end pb-2 text-sm">
                <input type="checkbox" name="atualizarProjeto" defaultChecked={!projeto.dataGoLiveReal} />
                Atualizar o Go Live real do projeto
              </label>
              <Campo rotulo="Hypercare: início">
                <input name="hypercareInicio" type="date" defaultValue={valorData(dep?.hypercareInicio)} className="campo" />
              </Campo>
              <Campo rotulo="Hypercare: fim">
                <input name="hypercareFim" type="date" defaultValue={valorData(dep?.hypercareFim)} className="campo" />
              </Campo>
            </div>
          </Formulario>
        </Cartao>
      )}
    </div>
  );
}
