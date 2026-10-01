import Link from "next/link";
import { notFound } from "next/navigation";
import { STATUS_PROJETO, TOM_STATUS_PROJETO } from "@/lib/domain/rotulos";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth/sessao";
import { pode } from "@/lib/auth/permissoes";
import { Cabecalho, Campo, Cartao, Selo, Vazio } from "@/components/ui";
import { BotaoAcao, Formulario } from "@/components/formulario";
import { HistoricoEntidade } from "@/components/historico";
import { atualizarCliente, criarContato, excluirContato } from "../acoes";

const FUNCOES = { SPONSOR: "Sponsor", GP_CLIENTE: "GP Cliente", KEY_USER: "Key User", TI: "TI", OUTRO: "Outro" } as const;

export default async function PaginaCliente({ params }: PageProps<"/clientes/[id]">) {
  const { id } = await params;
  const usuario = await usuarioAtual();
  const cliente = await db.cliente.findUnique({
    where: { id },
    include: { contatos: { orderBy: { nome: "asc" } }, projetos: { orderBy: { nome: "asc" }, select: { id: true, codigo: true, nome: true, status: true } }, apelidos: true },
  });
  if (!cliente) notFound();
  const editavel = pode(usuario.perfil, "editar", "CLIENTES");

  return (
    <>
      <Cabecalho
        titulo={cliente.nome}
        subtitulo={cliente.razaoSocial ?? undefined}
        trilha={[{ rotulo: "Clientes", href: "/clientes" }]}
        acoes={cliente.ativo ? <Selo tom="ok">Ativo</Selo> : <Selo>Inativo</Selo>}
      />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Cartao titulo="Dados do cliente">
          <Formulario acao={atualizarCliente.bind(null, cliente.id)} somenteLeitura={!editavel}>
            <Campo rotulo="Nome">
              <input name="nome" required defaultValue={cliente.nome} className="campo" />
            </Campo>
            <Campo rotulo="Razão social">
              <input name="razaoSocial" defaultValue={cliente.razaoSocial ?? ""} className="campo" />
            </Campo>
            <Campo rotulo="Segmento">
              <input name="segmento" defaultValue={cliente.segmento ?? ""} className="campo" />
            </Campo>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="ativo" defaultChecked={cliente.ativo} /> Cliente ativo
            </label>
          </Formulario>
        </Cartao>

        <div className="space-y-6">
          <Cartao titulo={`Projetos (${cliente.projetos.length})`}>
            {cliente.projetos.length === 0 ? (
              <Vazio>Nenhum projeto.</Vazio>
            ) : (
              <ul className="divide-y divide-ardosia-100 text-sm">
                {cliente.projetos.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2">
                    <Link href={`/projetos/${p.id}`} className="hover:underline">
                      <span className="text-xs text-ardosia-500">{p.codigo}</span> {p.nome}
                    </Link>
                    <Selo tom={TOM_STATUS_PROJETO[p.status]}>{STATUS_PROJETO[p.status]}</Selo>
                  </li>
                ))}
              </ul>
            )}
            {cliente.apelidos.length > 0 && <p className="mt-3 text-xs text-ardosia-500">Também aparece nas planilhas como: {cliente.apelidos.map((a) => a.apelido).join(", ")}</p>}
          </Cartao>

          <Cartao titulo="Contatos (key users, sponsor, TI)">
            {cliente.contatos.length === 0 ? (
              <Vazio>Nenhum contato cadastrado.</Vazio>
            ) : (
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Função</th>
                    <th>E-mail</th>
                    <th>Telefone</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {cliente.contatos.map((c) => (
                    <tr key={c.id}>
                      <td className="font-medium">{c.nome}</td>
                      <td>
                        <Selo tom="livre">{FUNCOES[c.funcao]}</Selo>
                      </td>
                      <td className="text-ardosia-600">{c.email ?? "—"}</td>
                      <td className="text-ardosia-600">{c.telefone ?? "—"}</td>
                      <td className="text-right">
                        {editavel && (
                          <BotaoAcao acao={excluirContato.bind(null, c.id)} confirmar={`Excluir o contato ${c.nome}?`}>
                            Excluir
                          </BotaoAcao>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {editavel && (
              <Formulario acao={criarContato.bind(null, cliente.id)} rotuloEnviar="Adicionar contato" limparAoSalvar className="mt-4 border-t border-ardosia-100 pt-4">
                <div className="grid gap-3 sm:grid-cols-4">
                  <Campo rotulo="Nome">
                    <input name="nome" required className="campo" />
                  </Campo>
                  <Campo rotulo="Função">
                    <select name="funcao" className="campo" defaultValue="KEY_USER">
                      {Object.entries(FUNCOES).map(([v, r]) => (
                        <option key={v} value={v}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </Campo>
                  <Campo rotulo="E-mail">
                    <input name="email" type="email" className="campo" />
                  </Campo>
                  <Campo rotulo="Telefone">
                    <input name="telefone" className="campo" />
                  </Campo>
                </div>
              </Formulario>
            )}
          </Cartao>
          <HistoricoEntidade entidade="Cliente" entidadeId={cliente.id} />
        </div>
      </div>
    </>
  );
}
