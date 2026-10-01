import Link from "next/link";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth/sessao";
import { pode } from "@/lib/auth/permissoes";
import { semanaDe, semanasEntre, rotuloSemana } from "@/lib/domain/semanas";
import { somarDias } from "@/lib/domain/datas";
import { capacidadePorSemana } from "@/lib/services/capacidade";
import { Cabecalho, Campo, Cartao, Selo, Vazio } from "@/components/ui";
import { Formulario } from "@/components/formulario";
import { criarRecurso } from "./acoes";

export const metadata = { title: "Recursos" };

export default async function PaginaRecursos({ searchParams }: PageProps<"/recursos">) {
  const usuario = await usuarioAtual();
  const { inativos } = await searchParams;
  const mostrarInativos = inativos === "1";
  const recursos = await db.recurso.findMany({
    where: mostrarInativos ? undefined : { ativo: true },
    orderBy: { nome: "asc" },
    include: { usuario: { select: { perfil: true } } },
  });
  const atual = semanaDe(new Date());
  const semanas = semanasEntre(atual.inicio, somarDias(atual.inicio, 7 * 5));
  const capacidades = await capacidadePorSemana(recursos.map((r) => r.id), semanas);
  const totais = semanas.map((s) => recursos.reduce((t, r) => t + (r.ativo ? (capacidades.get(r.id)?.get(s.id)?.liquida ?? 0) : 0), 0));

  return (
    <>
      <Cabecalho
        titulo="Recursos"
        subtitulo="Equipe MAIS i9 e capacidade líquida das próximas semanas (capacidade − feriados)"
        acoes={
          <Link href={mostrarInativos ? "/recursos" : "/recursos?inativos=1"} className="text-sm text-ardosia-600 hover:underline">
            {mostrarInativos ? "Ocultar inativos" : "Mostrar inativos"}
          </Link>
        }
      />
      <div className="space-y-6">
        <Cartao titulo={`${recursos.length} recurso(s)`}>
          {recursos.length === 0 ? (
            <Vazio>Nenhum recurso cadastrado.</Vazio>
          ) : (
            <div className="overflow-x-auto">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Recurso</th>
                    <th>Cargo / área</th>
                    <th>Acesso</th>
                    {semanas.map((s) => (
                      <th key={s.id} className="text-right">
                        {rotuloSemana(s)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recursos.map((r) => {
                    const caps = capacidades.get(r.id);
                    return (
                      <tr key={r.id} className={r.ativo ? "" : "opacity-50"}>
                        <td>
                          <Link href={`/recursos/${r.id}`} className="font-medium text-navy-800 hover:underline">
                            {r.nome}
                          </Link>
                          {r.tipo === "TERCEIRO" && <span className="ml-2"><Selo>Terceiro</Selo></span>}
                        </td>
                        <td className="text-ardosia-600">{[r.cargo, r.area].filter(Boolean).join(" · ") || "—"}</td>
                        <td>{r.usuario ? <Selo tom="ok">Com login</Selo> : <Selo>Sem login</Selo>}</td>
                        {semanas.map((s) => {
                          const c = caps?.get(s.id);
                          return (
                            <td key={s.id} className="text-right tabular-nums" title={c?.diasFeriado ? `${c.diasFeriado} dia(s) de feriado` : undefined}>
                              {c?.bruta ? (
                                <span className={c.diasFeriado ? "font-medium text-destaque-escuro" : ""}>{c.liquida}h</span>
                              ) : (
                                <span className="text-critico">sem cap.</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  <tr className="font-semibold">
                    <td colSpan={3} className="text-right text-ardosia-600">
                      Capacidade líquida da equipe
                    </td>
                    {totais.map((t, i) => (
                      <td key={semanas[i].id} className="text-right tabular-nums">
                        {t}h
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </Cartao>

        {pode(usuario.perfil, "editar", "RECURSOS") && (
          <Cartao titulo="Novo recurso">
            <Formulario acao={criarRecurso} rotuloEnviar="Cadastrar recurso">
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <Campo rotulo="Nome" className="sm:col-span-2">
                  <input name="nome" required className="campo" />
                </Campo>
                <Campo rotulo="E-mail corporativo" className="sm:col-span-2" ajuda="Vincula o login Microsoft 365 automaticamente.">
                  <input name="email" type="email" className="campo" />
                </Campo>
                <Campo rotulo="Cargo">
                  <input name="cargo" className="campo" placeholder="Consultor" />
                </Campo>
                <Campo rotulo="Área">
                  <input name="area" className="campo" placeholder="Funcional" />
                </Campo>
                <Campo rotulo="Tipo">
                  <select name="tipo" className="campo" defaultValue="INTERNO">
                    <option value="INTERNO">Interno</option>
                    <option value="TERCEIRO">Terceiro</option>
                  </select>
                </Campo>
                <Campo rotulo="Horas / semana">
                  <input name="horasSemanais" type="number" step="0.5" min="0" max="80" defaultValue={40} required className="campo" />
                </Campo>
                <Campo rotulo="Capacidade a partir de">
                  <input name="vigenciaInicio" type="date" className="campo" />
                </Campo>
                <Campo rotulo="Data de entrada">
                  <input name="dataEntrada" type="date" className="campo" />
                </Campo>
              </div>
            </Formulario>
          </Cartao>
        )}
      </div>
    </>
  );
}
