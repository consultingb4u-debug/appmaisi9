import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth/sessao";
import { pode } from "@/lib/auth/permissoes";
import { avaliarComplexidade, sugestaoPreProjeto } from "@/lib/domain/execucao";
import { formatarData } from "@/lib/domain/datas";
import { DIMENSAO, STATUS_CHECKLIST, STATUS_PRE_PROJETO, TOM_CHECKLIST, TOM_NIVEL, TOM_PRE_PROJETO } from "@/lib/domain/rotulos";
import { Campo, Cartao, LinkBotao, opcoes, Selo, valorData, Vazio } from "@/components/ui";
import { BotaoAcao, Formulario } from "@/components/formulario";
import { aplicarModeloPreProjeto, excluirItemPreProjeto, salvarComplexidade, salvarItemPreProjeto, salvarStatusPreProjeto } from "../../execucao-acoes";

export default async function PreProjeto({ params, searchParams }: PageProps<"/projetos/[id]/pre-projeto">) {
  const { id } = await params;
  const { editar, novo } = await searchParams;
  const usuario = await usuarioAtual();
  const editavel = pode(usuario.perfil, "editar", "PROJETOS");
  const projeto = await db.projeto.findUnique({ where: { id }, select: { id: true, gp: { select: { nome: true } } } });
  if (!projeto) notFound();
  const [criterios, notas, aval, pre, itens] = await Promise.all([
    db.criterioComplexidade.findMany({ where: { ativo: true }, orderBy: { ordem: "asc" } }),
    db.projetoComplexidade.findMany({ where: { projetoId: id } }),
    db.avaliacaoComplexidade.findUnique({ where: { projetoId: id } }),
    db.preProjeto.findUnique({ where: { projetoId: id } }),
    db.preProjetoItem.findMany({ where: { projetoId: id }, orderBy: [{ ordem: "asc" }] }),
  ]);
  const notaDe = new Map(notas.map((n) => [n.criterioId, n]));
  const r = avaliarComplexidade(criterios.map((c) => ({ nota: notaDe.get(c.id)?.nota ?? null, gatilhoCritico: notaDe.get(c.id)?.gatilhoCritico ?? false })));
  const sugestao = sugestaoPreProjeto(itens.map((i) => i.status));
  const sel = typeof editar === "string" ? itens.find((i) => i.id === editar) : null;
  const mostrarForm = editavel && (sel || novo === "1");
  const base = `/projetos/${id}/pre-projeto`;

  return (
    <div className="space-y-6">
      <Cartao
        titulo="Complexidade do projeto"
        acoes={
          r.final ? (
            <span className="flex items-center gap-2 text-sm">
              <Selo tom={TOM_NIVEL[r.final]}>{r.final}</Selo>
              <span className="font-medium text-navy-900">{r.governanca}</span>
            </span>
          ) : (
            <Selo>Não avaliado</Selo>
          )
        }
      >
        <div className="mb-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
          {[
            ["Score", `${r.score} / ${criterios.length * 3}`],
            ["Gatilhos críticos", r.gatilhos],
            ["Nível base", r.base ?? "—"],
            ["Nível mínimo", r.minimo ?? "—"],
            ["Respondidos", `${r.respondidos} de ${criterios.length}`],
          ].map(([rot, v]) => (
            <div key={rot as string} className="rounded-md bg-fundo px-3 py-2">
              <div className="text-[11px] font-medium tracking-wide text-ardosia-500 uppercase">{rot}</div>
              <div className="font-semibold tabular-nums">{v}</div>
            </div>
          ))}
        </div>
        <p className="mb-4 text-xs text-ardosia-500">
          Regra (CTRL-001): soma das notas ≤ 8 → N1 · ≤ 16 → N2 · ≤ 24 → N3 · acima → N4. Nota 3 marcada como gatilho crítico: 1 gatilho eleva para no mínimo N3, 2 ou mais para N4. O nível final é o maior dos dois.
        </p>
        <Formulario acao={salvarComplexidade.bind(null, id)} somenteLeitura={!editavel} rotuloEnviar="Salvar avaliação">
          <div className="grid gap-3 sm:grid-cols-3">
            <Campo rotulo="Avaliador">
              <input name="avaliador" defaultValue={aval?.avaliador ?? projeto.gp?.nome ?? ""} className="campo" />
            </Campo>
            <Campo rotulo="Data da avaliação">
              <input name="data" type="date" defaultValue={valorData(aval?.data)} className="campo" />
            </Campo>
            <Campo rotulo="Horas estimadas">
              <input name="horasEstimadas" type="number" min="0" step="1" defaultValue={aval?.horasEstimadas?.toNumber() ?? ""} className="campo" />
            </Campo>
          </div>
          <div className="-mx-4 overflow-x-auto">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Dimensão</th>
                  <th>Critério</th>
                  <th title="Sem resposta">—</th>
                  <th>0</th>
                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>Gatilho crítico?</th>
                  <th>Observação</th>
                </tr>
              </thead>
              <tbody>
                {criterios.map((c) => {
                  const n = notaDe.get(c.id);
                  return (
                    <tr key={c.id}>
                      <td className="text-xs text-ardosia-500">{DIMENSAO[c.dimensao]}</td>
                      <td className="font-medium whitespace-nowrap">{c.nome}</td>
                      <td>
                        <input type="radio" name={`nota_${c.id}`} value="" defaultChecked={n?.nota == null} aria-label="Sem resposta" />
                      </td>
                      {[c.descricao0, c.descricao1, c.descricao2, c.descricao3].map((d, i) => (
                        <td key={i}>
                          <label className="flex cursor-pointer items-center gap-1.5 text-xs whitespace-nowrap">
                            <input type="radio" name={`nota_${c.id}`} value={i} defaultChecked={n?.nota === i} />
                            {d}
                          </label>
                        </td>
                      ))}
                      <td className="text-center">
                        <input type="checkbox" name={`gatilho_${c.id}`} defaultChecked={n?.gatilhoCritico} title="Conta como gatilho quando a nota for 3" />
                      </td>
                      <td>
                        <input name={`obs_${c.id}`} defaultValue={n?.observacao ?? ""} className="campo min-w-40 py-1 text-xs" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Formulario>
      </Cartao>

      <Cartao
        titulo={`Checklist de pré-projeto · ${itens.filter((i) => i.status === "CONCLUIDO" || i.status === "NA").length}/${itens.length} resolvidos`}
        acoes={
          editavel &&
          !mostrarForm && (
            <span className="flex items-center gap-2">
              {itens.length < 7 && (
                <BotaoAcao acao={aplicarModeloPreProjeto.bind(null, id)} variante="secundario">
                  Aplicar modelo
                </BotaoAcao>
              )}
              <LinkBotao href={`${base}?novo=1`} tamanho="sm">
                + Item
              </LinkBotao>
            </span>
          )
        }
      >
        {itens.length === 0 ? (
          <Vazio>Nenhum item. Use “Aplicar modelo” para incluir os 7 itens do CTRL-001 (equipe, acessos, ambiente, governança, agenda, escopo, liberação).</Vazio>
        ) : (
          <div className="-m-4 overflow-x-auto">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Item</th>
                  <th>Responsável</th>
                  <th>Informação / contato</th>
                  <th>Validação</th>
                  <th>Prazo</th>
                  <th>Status</th>
                  <th>Observação</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((i) => (
                  <tr key={i.id} className={i.id === sel?.id ? "bg-destaque/5" : ""}>
                    <td className="whitespace-nowrap">{i.categoria}</td>
                    <td>
                      {editavel ? (
                        <Link href={`${base}?editar=${i.id}`} scroll={false} className="font-medium text-navy-800 hover:underline">
                          {i.item}
                        </Link>
                      ) : (
                        i.item
                      )}
                    </td>
                    <td className="text-xs">{i.responsavel ?? "—"}</td>
                    <td className="text-xs">{i.informacaoContato ?? "—"}</td>
                    <td className="text-xs">{i.validacaoEsperada ?? "—"}</td>
                    <td className="text-xs whitespace-nowrap">{formatarData(i.prazo)}</td>
                    <td>
                      <Selo tom={TOM_CHECKLIST[i.status]}>{STATUS_CHECKLIST[i.status]}</Selo>
                    </td>
                    <td className="max-w-xs text-xs text-ardosia-600">{i.observacao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Cartao>

      {mostrarForm && (
        <Cartao
          titulo={sel ? "Editar item" : "Novo item do checklist"}
          acoes={
            <span className="flex items-center gap-2">
              {sel && (
                <BotaoAcao acao={excluirItemPreProjeto.bind(null, sel.id)} confirmar="Excluir este item?">
                  Excluir
                </BotaoAcao>
              )}
              <Link href={base} className="text-sm text-ardosia-500">
                ✕
              </Link>
            </span>
          }
        >
          <Formulario key={sel?.id ?? "novo"} acao={salvarItemPreProjeto.bind(null, id, sel?.id ?? null)} limparAoSalvar={!sel}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Campo rotulo="Categoria">
                <input name="categoria" required defaultValue={sel?.categoria} className="campo" />
              </Campo>
              <Campo rotulo="Item / requisito" className="sm:col-span-1 lg:col-span-3">
                <input name="item" required defaultValue={sel?.item} className="campo" />
              </Campo>
              <Campo rotulo="Responsável">
                <input name="responsavel" defaultValue={sel?.responsavel ?? ""} className="campo" />
              </Campo>
              <Campo rotulo="Validação esperada">
                <input name="validacaoEsperada" defaultValue={sel?.validacaoEsperada ?? ""} className="campo" />
              </Campo>
              <Campo rotulo="Status">
                <select name="status" defaultValue={sel?.status ?? "PENDENTE"} className="campo">
                  {opcoes(STATUS_CHECKLIST)}
                </select>
              </Campo>
              <Campo rotulo="Prazo">
                <input name="prazo" type="date" defaultValue={valorData(sel?.prazo)} className="campo" />
              </Campo>
              <Campo rotulo="Informação / contato" className="sm:col-span-2">
                <input name="informacaoContato" defaultValue={sel?.informacaoContato ?? ""} className="campo" />
              </Campo>
              <Campo rotulo="Observação" className="sm:col-span-2">
                <input name="observacao" defaultValue={sel?.observacao ?? ""} className="campo" />
              </Campo>
            </div>
          </Formulario>
        </Cartao>
      )}

      <Cartao
        titulo="Status do pré-projeto"
        acoes={pre ? <Selo tom={TOM_PRE_PROJETO[pre.status]}>{STATUS_PRE_PROJETO[pre.status]}</Selo> : <Selo>Não definido</Selo>}
      >
        <p className="mb-3 text-sm text-ardosia-600">
          Sugestão pelo checklist: <strong>{STATUS_PRE_PROJETO[sugestao]}</strong>. O GP confirma o status (com bloqueio em qualquer item, a sugestão é “Bloqueado”).
        </p>
        <Formulario acao={salvarStatusPreProjeto.bind(null, id)} somenteLeitura={!editavel}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Campo rotulo="Status">
              <select name="status" defaultValue={pre?.status ?? sugestao} className="campo">
                {opcoes(STATUS_PRE_PROJETO)}
              </select>
            </Campo>
            <Campo rotulo="Observação" className="sm:col-span-2">
              <input name="observacao" defaultValue={pre?.observacao ?? ""} className="campo" />
            </Campo>
          </div>
        </Formulario>
      </Cartao>
    </div>
  );
}
