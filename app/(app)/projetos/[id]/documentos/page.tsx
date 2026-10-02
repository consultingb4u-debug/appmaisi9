import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth/sessao";
import { podeEditarProjeto } from "@/lib/auth/escopo";
import { formatarData } from "@/lib/domain/datas";
import { Campo, Cartao, Selo, Vazio } from "@/components/ui";
import { BotaoAcao, Formulario } from "@/components/formulario";
import { excluirDocumento, salvarDocumento } from "../../status-acoes";

const CATEGORIAS = ["Proposta", "Contrato", "Escopo / especificação", "Ata", "Evidência", "Homologação / aceite", "Treinamento", "Outros"];

const tamanho = (n: number | null) => (n === null ? "" : n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`);

export default async function Documentos({ params }: PageProps<"/projetos/[id]/documentos">) {
  const { id } = await params;
  const usuario = await usuarioAtual();
  const editavel = await podeEditarProjeto(usuario, id);
  const projeto = await db.projeto.findUnique({ where: { id }, select: { id: true } });
  if (!projeto) notFound();
  const docs = await db.documento.findMany({ where: { projetoId: id }, orderBy: [{ categoria: "asc" }, { criadoEm: "desc" }] });
  const autores = new Map((await db.usuario.findMany({ where: { id: { in: docs.map((d) => d.criadoPorId).filter((x): x is string => !!x) } }, select: { id: true, nome: true } })).map((u) => [u.id, u.nome]));

  return (
    <div className="space-y-6">
      <Cartao titulo={`Documentos · ${docs.length}`}>
        {docs.length === 0 ? (
          <Vazio>Nenhum documento. Registre links do SharePoint/Teams (recomendado) ou envie arquivos de até 10 MB.</Vazio>
        ) : (
          <div className="-m-4 overflow-x-auto">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Título</th>
                  <th>Tipo</th>
                  <th>Incluído</th>
                  <th>Observação</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td className="text-xs whitespace-nowrap">{d.categoria}</td>
                    <td>
                      <a href={`/projetos/${id}/documentos/${d.id}`} target={d.tipo === "LINK" ? "_blank" : undefined} rel="noreferrer" className="font-medium text-navy-800 hover:underline">
                        {d.titulo}
                      </a>
                      {d.arquivoNome && <div className="text-xs text-ardosia-500">{d.arquivoNome}</div>}
                    </td>
                    <td>{d.tipo === "LINK" ? <Selo tom="livre">Link</Selo> : <Selo>Arquivo {tamanho(d.tamanho)}</Selo>}</td>
                    <td className="text-xs whitespace-nowrap">
                      {formatarData(d.criadoEm)}
                      {d.criadoPorId && autores.get(d.criadoPorId) && <div className="text-ardosia-500">{autores.get(d.criadoPorId)}</div>}
                    </td>
                    <td className="max-w-xs text-xs text-ardosia-600">{d.observacao}</td>
                    <td className="text-right">
                      {editavel && (
                        <BotaoAcao acao={excluirDocumento.bind(null, d.id)} confirmar={`Remover "${d.titulo}"?`} variante="fantasma">
                          Remover
                        </BotaoAcao>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Cartao>

      {editavel && (
        <Cartao titulo="Incluir documento">
          <Formulario acao={salvarDocumento.bind(null, id)} limparAoSalvar rotuloEnviar="Incluir">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Campo rotulo="Título" className="lg:col-span-2">
                <input name="titulo" required className="campo" />
              </Campo>
              <Campo rotulo="Categoria">
                <select name="categoria" defaultValue="Outros" className="campo">
                  {CATEGORIAS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Campo>
              <Campo rotulo="Observação">
                <input name="observacao" className="campo" />
              </Campo>
              <Campo rotulo="Link (SharePoint, Teams, OneDrive…)" className="lg:col-span-2">
                <input name="url" type="url" placeholder="https://…" className="campo" />
              </Campo>
              <Campo rotulo="…ou arquivo (até 10 MB)" className="lg:col-span-2">
                <input name="arquivo" type="file" className="campo py-1.5" />
              </Campo>
            </div>
          </Formulario>
        </Cartao>
      )}
    </div>
  );
}
