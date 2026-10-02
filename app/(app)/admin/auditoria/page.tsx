import { db } from "@/lib/db";
import { exigirPagina } from "@/lib/auth/sessao";
import { Cabecalho, Cartao, Selo, Vazio } from "@/components/ui";
import { formatarValor, formatoDataHora, rotuloCampo } from "@/components/historico";

export const metadata = { title: "Auditoria" };

const TONS = { CRIAR: "ok", ALTERAR: "livre", EXCLUIR: "critico", IMPORTAR: "destaque", PUBLICAR: "navy" } as const;

export default async function PaginaAuditoria({ searchParams }: PageProps<"/admin/auditoria">) {
  await exigirPagina("ver", "AUDITORIA");
  const { entidade, usuario } = await searchParams;
  const filtroEntidade = typeof entidade === "string" && entidade ? entidade : undefined;
  const filtroUsuario = typeof usuario === "string" && usuario ? usuario : undefined;

  const [linhas, entidades, usuarios] = await Promise.all([
    db.auditoria.findMany({
      where: { entidade: filtroEntidade, usuarioId: filtroUsuario },
      orderBy: { dataHora: "desc" },
      take: 200,
      include: { usuario: { select: { nome: true } } },
    }),
    db.auditoria.findMany({ distinct: ["entidade"], select: { entidade: true }, orderBy: { entidade: "asc" } }),
    db.usuario.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);

  return (
    <>
      <Cabecalho titulo="Auditoria" subtitulo="Quem criou, alterou ou excluiu o quê — últimos 200 registros" />
      <Cartao
        titulo="Registros"
        acoes={
          <form className="flex flex-wrap gap-2">
            <select name="entidade" defaultValue={filtroEntidade ?? ""} className="campo w-auto py-1.5">
              <option value="">Todas as entidades</option>
              {entidades.map((e) => (
                <option key={e.entidade}>{e.entidade}</option>
              ))}
            </select>
            <select name="usuario" defaultValue={filtroUsuario ?? ""} className="campo w-auto py-1.5">
              <option value="">Todos os usuários</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
            <button className="rounded-md bg-navy-900 px-3 text-sm text-white">Filtrar</button>
          </form>
        }
      >
        {linhas.length === 0 ? (
          <Vazio>Nenhum registro.</Vazio>
        ) : (
          <div className="overflow-x-auto">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Quando</th>
                  <th>Quem</th>
                  <th>Ação</th>
                  <th>Registro</th>
                  <th>Alterações</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.id}>
                    <td className="text-xs whitespace-nowrap text-ardosia-600">{formatoDataHora.format(l.dataHora)}</td>
                    <td className="whitespace-nowrap">{l.usuario?.nome ?? "Sistema"}</td>
                    <td>
                      <Selo tom={TONS[l.acao]}>{l.acao}</Selo>
                    </td>
                    <td>
                      <div className="font-medium">{l.entidade}</div>
                      <div className="text-xs text-ardosia-500">{l.resumo}</div>
                    </td>
                    <td className="text-xs text-ardosia-600">
                      {l.acao === "ALTERAR" &&
                        Object.entries((l.alteracoes ?? {}) as Record<string, [unknown, unknown]>).map(([c, [a, d]]) => (
                          <div key={c}>
                            {rotuloCampo(c)}: {formatarValor(a)} → {formatarValor(d)}
                          </div>
                        ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Cartao>
    </>
  );
}
