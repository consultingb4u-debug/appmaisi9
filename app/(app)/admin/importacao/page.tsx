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
                      <td>{l.tipo === "CTRL003" ? "CTRL-003 Recursos" : "CTRL-001 Projeto"}</td>
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
                  <option value="CTRL001" disabled>
                    CTRL-001 Controle do Projeto (incremento 4)
                  </option>
                </select>
              </Campo>
              <Campo rotulo="Arquivo .xlsx" ajuda="Lidas: Portfólio Projetos, Planejamento Recursos, Capacidade e Indisponibilidades. As abas automáticas são ignoradas.">
                <input name="arquivo" type="file" accept=".xlsx" required className="campo file:mr-3 file:rounded file:border-0 file:bg-ardosia-100 file:px-2 file:py-1 file:text-sm" />
              </Campo>
            </Formulario>
          </Cartao>
        )}
      </div>
    </>
  );
}
