import { db } from "@/lib/db";
import { exigirPagina } from "@/lib/auth/sessao";
import { NOME_PERFIL, pode } from "@/lib/auth/permissoes";
import { Cabecalho, Campo, Cartao, Selo } from "@/components/ui";
import { Formulario } from "@/components/formulario";
import { formatoDataHora } from "@/components/historico";
import { atualizarUsuario, criarUsuario } from "./acoes";

export const metadata = { title: "Usuários" };

const DESCRICAO_PERFIS = {
  ADMIN: "Tudo, inclusive usuários e parâmetros",
  GESTOR: "Mantém portfólio, projetos, recursos, capacidade e aprova indisponibilidades",
  CONSULTOR: "Consulta tudo; atualiza suas atividades e aponta horas",
  VISUALIZADOR: "Somente consulta",
} as const;

export default async function PaginaUsuarios() {
  const eu = await exigirPagina("ver", "USUARIOS");
  const editavel = pode(eu.perfil, "editar", "USUARIOS");
  const [usuarios, recursos] = await Promise.all([
    db.usuario.findMany({ orderBy: { nome: "asc" }, include: { recurso: { select: { id: true, nome: true } } } }),
    db.recurso.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true, usuarioId: true } }),
  ]);

  const opcoesRecurso = (atual: string | null) =>
    recursos.filter((r) => !r.usuarioId || r.id === atual).map((r) => (
      <option key={r.id} value={r.id}>
        {r.nome}
      </option>
    ));

  return (
    <>
      <Cabecalho titulo="Usuários e perfis" subtitulo="Login com a conta Microsoft 365. Novos acessos entram como Visualização até um administrador definir o perfil." />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(DESCRICAO_PERFIS) as (keyof typeof DESCRICAO_PERFIS)[]).map((p) => (
          <div key={p} className="rounded-lg border border-ardosia-100 bg-white p-3">
            <div className="text-sm font-semibold text-navy-900">{NOME_PERFIL[p]}</div>
            <div className="mt-1 text-xs text-ardosia-500">{DESCRICAO_PERFIS[p]}</div>
            <div className="mt-2 text-xs font-medium text-ardosia-600">{usuarios.filter((u) => u.perfil === p && u.ativo).length} ativo(s)</div>
          </div>
        ))}
      </div>

      <Cartao titulo={`${usuarios.length} usuário(s)`} className="mb-6">
        <div className="overflow-x-auto">
          <table className="tabela">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Último acesso</th>
                <th>Perfil · Recurso vinculado · Situação</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="font-medium">{u.nome}</div>
                    <div className="text-xs text-ardosia-500">{u.email}</div>
                  </td>
                  <td className="text-xs text-ardosia-600">{u.ultimoAcesso ? formatoDataHora.format(u.ultimoAcesso) : "nunca"}</td>
                  <td>
                    {editavel ? (
                      <Formulario acao={atualizarUsuario.bind(null, u.id)} className="!space-y-0" rotuloEnviar="Salvar">
                        <div className="flex flex-wrap items-center gap-2">
                          <select name="perfil" defaultValue={u.perfil} className="campo w-auto py-1">
                            {Object.entries(NOME_PERFIL).map(([v, r]) => (
                              <option key={v} value={v}>
                                {r}
                              </option>
                            ))}
                          </select>
                          <select name="recursoId" defaultValue={u.recurso?.id ?? ""} className="campo w-auto py-1">
                            <option value="">— sem recurso —</option>
                            {opcoesRecurso(u.recurso?.id ?? null)}
                          </select>
                          <label className="flex items-center gap-1 text-sm">
                            <input type="checkbox" name="ativo" defaultChecked={u.ativo} /> ativo
                          </label>
                        </div>
                      </Formulario>
                    ) : (
                      <div className="flex gap-2">
                        <Selo tom="navy">{NOME_PERFIL[u.perfil]}</Selo>
                        {u.recurso && <Selo>{u.recurso.nome}</Selo>}
                        {!u.ativo && <Selo tom="critico">Inativo</Selo>}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Cartao>

      {editavel && (
        <Cartao titulo="Pré-cadastrar usuário">
          <Formulario acao={criarUsuario} rotuloEnviar="Cadastrar" limparAoSalvar>
            <div className="grid gap-3 sm:grid-cols-4">
              <Campo rotulo="Nome">
                <input name="nome" required className="campo" />
              </Campo>
              <Campo rotulo="E-mail Microsoft 365">
                <input name="email" type="email" required className="campo" />
              </Campo>
              <Campo rotulo="Perfil">
                <select name="perfil" defaultValue="CONSULTOR" className="campo">
                  {Object.entries(NOME_PERFIL).map(([v, r]) => (
                    <option key={v} value={v}>
                      {r}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo rotulo="Recurso">
                <select name="recursoId" defaultValue="" className="campo">
                  <option value="">— sem recurso —</option>
                  {opcoesRecurso(null)}
                </select>
              </Campo>
            </div>
          </Formulario>
        </Cartao>
      )}
    </>
  );
}
