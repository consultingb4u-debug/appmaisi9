import Link from "next/link";
import { db } from "@/lib/db";
import { exigirPagina } from "@/lib/auth/sessao";
import { pode } from "@/lib/auth/permissoes";
import { Cabecalho, Campo, Cartao, Selo, Vazio } from "@/components/ui";
import { Formulario } from "@/components/formulario";
import { formatoDataHora } from "@/components/historico";
import { STATUS_LOTE } from "@/lib/importacao/descricao";
import { enviarPlanilha } from "./acoes";

export const metadata = { title: "Importação" };


export default async function PaginaImportacao() {
  const u = await exigirPagina("ver", "IMPORTACAO");
  const lotes = await db.importLote.findMany({ orderBy: { carregadoEm: "desc" }, take: 50, include: { _count: { select: { linhas: true } } } });
  const usuarios = new Map((await db.usuario.findMany({ select: { id: true, nome: true } })).map((x) => [x.id, x.nome]));
  const projetos = await db.projeto.findMany({ where: { arquivadoEm: null }, orderBy: [{ cliente: { nome: "asc" } }, { nome: "asc" }], select: { id: true, nome: true, cliente: { select: { nome: true } } } });
  const nomeProjeto = new Map(projetos.map((p) => [p.id, `${p.cliente.nome} · ${p.nome}`]));

  return (
    <>
      <Cabecalho titulo="Importação de planilhas" subtitulo="O arquivo vai para uma área de revisão. Nada é gravado até você conferir e efetivar." />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Cartao titulo="Lotes">
          {lotes.length === 0 ? (
            <Vazio>Nenhuma planilha importada ainda.</Vazio>
          ) : (
            <table className="tabela">
              <thead>
                <tr>
                  <th>Arquivo</th>
                  <th>Tipo</th>
                  <th>Carregado</th>
                  <th className="text-right">Linhas</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {lotes.map((l) => {
                  const [rotulo, tom] = STATUS_LOTE[l.status];
                  return (
                    <tr key={l.id}>
                      <td>
                        <Link href={`/admin/importacao/${l.id}`} className="font-medium text-navy-800 hover:underline">
                          {l.arquivoNome}
                        </Link>
                      </td>
                      <td>{l.tipo === "CTRL003" ? "CTRL-003 Recursos" : <>CTRL-001 <span className="text-xs text-ardosia-500">{nomeProjeto.get(l.projetoId ?? "")}</span></>}</td>
                      <td className="text-xs text-ardosia-600">
                        {formatoDataHora.format(l.carregadoEm)} · {usuarios.get(l.carregadoPorId ?? "") ?? "—"}
                      </td>
                      <td className="text-right tabular-nums">{l._count.linhas}</td>
                      <td>
                        <Selo tom={tom}>{rotulo}</Selo>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Cartao>

        {pode(u.perfil, "editar", "IMPORTACAO") && (
          <Cartao titulo="Nova importação">
            <Formulario acao={enviarPlanilha} rotuloEnviar="Carregar para revisão">
              <Campo rotulo="Tipo">
                <select name="tipo" className="campo" defaultValue="CTRL003">
                  <option value="CTRL003">CTRL-003 Gestão de Recursos / Portfólio</option>
                  <option value="CTRL001">CTRL-001 Controle do Projeto</option>
                </select>
              </Campo>
              <Campo rotulo="Projeto (só para CTRL-001)" ajuda="Importe primeiro o CTRL-003 para os projetos existirem.">
                <select name="projetoId" className="campo" defaultValue="">
                  <option value="">—</option>
                  {projetos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.cliente.nome} · {p.nome}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo rotulo="Arquivo .xlsx" ajuda="CTRL-003: Portfólio, Planejamento, Capacidade, Indisponibilidades. CTRL-001: datas do Pré-Projeto, Backlog e Cronograma. Abas automáticas são ignoradas.">
                <input name="arquivo" type="file" accept=".xlsx" required className="campo file:mr-3 file:rounded file:border-0 file:bg-ardosia-100 file:px-2 file:py-1 file:text-sm" />
              </Campo>
            </Formulario>
          </Cartao>
        )}
      </div>
    </>
  );
}
