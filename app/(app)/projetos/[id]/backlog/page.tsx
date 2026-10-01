import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth/sessao";
import { pode } from "@/lib/auth/permissoes";
import { ADERENCIA, PRIORIDADE, SIM_NAO, STATUS_ITEM, TIPO_BACKLOG, TOM_PRIORIDADE, TOM_STATUS_ITEM, TOM_VALIDACAO, VALIDACAO } from "@/lib/domain/rotulos";
import { Campo, Cartao, LinkBotao, Selo, Vazio } from "@/components/ui";
import { BotaoAcao, Formulario } from "@/components/formulario";
import { excluirBacklog, salvarBacklog } from "../../cronograma-acoes";

const opcoes = (m: Record<string, string>) =>
  Object.entries(m).map(([k, r]) => (
    <option key={k} value={k}>
      {r}
    </option>
  ));

export default async function Backlog({ params, searchParams }: PageProps<"/projetos/[id]/backlog">) {
  const { id } = await params;
  const { editar, novo } = await searchParams;
  const usuario = await usuarioAtual();
  const editavel = pode(usuario.perfil, "editar", "PROJETOS");
  const projeto = await db.projeto.findUnique({ where: { id }, select: { id: true } });
  if (!projeto) notFound();
  const [itens, recursos] = await Promise.all([
    db.backlogItem.findMany({
      where: { projetoId: id },
      orderBy: [{ ordem: "asc" }, { codigo: "asc" }],
      include: { responsavel: { select: { nome: true } }, atividades: { select: { status: true, percentualConclusao: true } } },
    }),
    db.recurso.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);
  const sel = typeof editar === "string" ? itens.find((i) => i.id === editar) : null;
  const mostrarForm = editavel && (sel || novo === "1");
  const total = itens.filter((i) => i.status !== "CANCELADO").reduce((t, i) => t + (i.estimativaHoras?.toNumber() ?? 0), 0);

  return (
    <div className="space-y-6">
      <Cartao
        titulo={`Backlog · ${itens.length} item(ns) · ${total}h estimadas`}
        acoes={editavel && !mostrarForm && <LinkBotao href={`/projetos/${id}/backlog?novo=1`} tamanho="sm">+ Requisito</LinkBotao>}
      >
        {itens.length === 0 ? (
          <Vazio>Nenhum requisito. Inclua manualmente ou importe o CTRL-001 do projeto.</Vazio>
        ) : (
          <div className="-m-4 overflow-x-auto">
            <table className="tabela">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Requisito</th>
                  <th>Tipo</th>
                  <th>Prioridade</th>
                  <th>Aderência</th>
                  <th>Custom.</th>
                  <th className="text-right">Estim.</th>
                  <th>Atividades</th>
                  <th>Status</th>
                  <th>Validação cliente</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((i) => {
                  const concl = i.atividades.filter((a) => a.status === "CONCLUIDO").length;
                  return (
                    <tr key={i.id} className={i.id === sel?.id ? "bg-destaque/5" : ""}>
                      <td className="whitespace-nowrap">
                        {editavel ? (
                          <Link href={`/projetos/${id}/backlog?editar=${i.id}`} scroll={false} className="font-medium text-navy-800 hover:underline">
                            {i.codigo}
                          </Link>
                        ) : (
                          i.codigo
                        )}
                      </td>
                      <td>
                        <div>{i.requisito}</div>
                        <div className="text-xs text-ardosia-500">{[i.moduloProcesso, i.responsavel?.nome].filter(Boolean).join(" · ")}</div>
                      </td>
                      <td>{TIPO_BACKLOG[i.tipo]}</td>
                      <td>
                        <Selo tom={TOM_PRIORIDADE[i.prioridade]}>{PRIORIDADE[i.prioridade]}</Selo>
                      </td>
                      <td>{ADERENCIA[i.aderenciaPadrao]}</td>
                      <td>{SIM_NAO[i.customizacao]}</td>
                      <td className="text-right tabular-nums">{i.estimativaHoras ? `${i.estimativaHoras.toNumber()}h` : "—"}</td>
                      <td className="text-xs whitespace-nowrap">
                        {i.atividades.length ? (
                          <Link href={`/projetos/${id}/cronograma?req=${i.id}`} className="hover:underline">
                            {concl}/{i.atividades.length} concluídas
                          </Link>
                        ) : (
                          <span className="text-ardosia-400">nenhuma</span>
                        )}
                      </td>
                      <td>
                        <Selo tom={TOM_STATUS_ITEM[i.status]}>{STATUS_ITEM[i.status]}</Selo>
                      </td>
                      <td>
                        <Selo tom={TOM_VALIDACAO[i.validacaoCliente]}>{VALIDACAO[i.validacaoCliente]}</Selo>
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
          titulo={sel ? `Editar ${sel.codigo}` : "Novo requisito"}
          acoes={
            <span className="flex items-center gap-2">
              {sel && (
                <BotaoAcao acao={excluirBacklog.bind(null, sel.id)} confirmar={`Excluir ${sel.codigo}? As atividades ligadas ficam sem requisito.`}>
                  Excluir
                </BotaoAcao>
              )}
              <Link href={`/projetos/${id}/backlog`} className="text-sm text-ardosia-500">
                ✕
              </Link>
            </span>
          }
        >
          <Formulario key={sel?.id ?? "novo"} acao={salvarBacklog.bind(null, id, sel?.id ?? null)} limparAoSalvar={!sel}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Campo rotulo="Requisito" className="sm:col-span-2 lg:col-span-3">
                <input name="requisito" required defaultValue={sel?.requisito} className="campo" />
              </Campo>
              <Campo rotulo="Módulo · processo">
                <input name="moduloProcesso" defaultValue={sel?.moduloProcesso ?? ""} className="campo" />
              </Campo>
              <Campo rotulo="Tipo">
                <select name="tipo" defaultValue={sel?.tipo ?? "ENTREGA"} className="campo">
                  {opcoes(TIPO_BACKLOG)}
                </select>
              </Campo>
              <Campo rotulo="Prioridade">
                <select name="prioridade" defaultValue={sel?.prioridade ?? "MEDIA"} className="campo">
                  {opcoes(PRIORIDADE)}
                </select>
              </Campo>
              <Campo rotulo="Aderência ao padrão">
                <select name="aderenciaPadrao" defaultValue={sel?.aderenciaPadrao ?? "A_VALIDAR"} className="campo">
                  {opcoes(ADERENCIA)}
                </select>
              </Campo>
              <Campo rotulo="Customização?">
                <select name="customizacao" defaultValue={sel?.customizacao ?? "A_CONFIRMAR"} className="campo">
                  {opcoes(SIM_NAO)}
                </select>
              </Campo>
              <Campo rotulo="Estimativa (h)">
                <input name="estimativaHoras" type="number" step="0.5" min="0" defaultValue={sel?.estimativaHoras?.toNumber() ?? ""} className="campo" />
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
              <Campo rotulo="Status">
                <select name="status" defaultValue={sel?.status ?? "NAO_INICIADO"} className="campo">
                  {opcoes(STATUS_ITEM)}
                </select>
              </Campo>
              <Campo rotulo="Validação do cliente">
                <select name="validacaoCliente" defaultValue={sel?.validacaoCliente ?? "PENDENTE"} className="campo">
                  {opcoes(VALIDACAO)}
                </select>
              </Campo>
              <Campo rotulo="Solução proposta" className="sm:col-span-2">
                <textarea name="solucaoProposta" rows={2} defaultValue={sel?.solucaoProposta ?? ""} className="campo" />
              </Campo>
              <Campo rotulo="Critério de aceite" className="sm:col-span-2">
                <textarea name="criterioAceite" rows={2} defaultValue={sel?.criterioAceite ?? ""} className="campo" />
              </Campo>
              <Campo rotulo="Observação" className="sm:col-span-2 lg:col-span-4">
                <input name="observacao" defaultValue={sel?.observacao ?? ""} className="campo" />
              </Campo>
            </div>
          </Formulario>
        </Cartao>
      )}
    </div>
  );
}
