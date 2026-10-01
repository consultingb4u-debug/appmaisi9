import Link from "next/link";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth/sessao";
import { pode } from "@/lib/auth/permissoes";
import { Cabecalho, Campo, Cartao, Selo, Vazio } from "@/components/ui";
import { Formulario } from "@/components/formulario";
import { criarCliente } from "./acoes";

export const metadata = { title: "Clientes" };

export default async function PaginaClientes({ searchParams }: PageProps<"/clientes">) {
  const usuario = await usuarioAtual();
  const { q } = await searchParams;
  const busca = typeof q === "string" ? q : "";
  const clientes = await db.cliente.findMany({
    where: busca ? { nome: { contains: busca, mode: "insensitive" } } : undefined,
    orderBy: { nome: "asc" },
    include: { _count: { select: { contatos: true } } },
  });

  return (
    <>
      <Cabecalho titulo="Clientes" subtitulo={`${clientes.length} cliente(s)`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Cartao
          titulo="Lista"
          acoes={
            <form className="w-56">
              <input name="q" defaultValue={busca} placeholder="Buscar cliente…" className="campo py-1.5" />
            </form>
          }
        >
          {clientes.length === 0 ? (
            <Vazio>Nenhum cliente encontrado.</Vazio>
          ) : (
            <table className="tabela">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Segmento</th>
                  <th className="text-right">Contatos</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/clientes/${c.id}`} className="font-medium text-navy-800 hover:underline">
                        {c.nome}
                      </Link>
                      {c.razaoSocial && <div className="text-xs text-ardosia-500">{c.razaoSocial}</div>}
                    </td>
                    <td className="text-ardosia-600">{c.segmento ?? "—"}</td>
                    <td className="text-right tabular-nums">{c._count.contatos}</td>
                    <td>{c.ativo ? <Selo tom="ok">Ativo</Selo> : <Selo>Inativo</Selo>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Cartao>

        {pode(usuario.perfil, "editar", "CLIENTES") && (
          <Cartao titulo="Novo cliente">
            <Formulario acao={criarCliente} rotuloEnviar="Cadastrar">
              <Campo rotulo="Nome">
                <input name="nome" required className="campo" placeholder="Ex.: Kover" />
              </Campo>
              <Campo rotulo="Razão social">
                <input name="razaoSocial" className="campo" />
              </Campo>
              <Campo rotulo="Segmento">
                <input name="segmento" className="campo" placeholder="Ex.: Indústria" />
              </Campo>
            </Formulario>
          </Cartao>
        )}
      </div>
    </>
  );
}
