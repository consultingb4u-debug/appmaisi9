import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth/sessao";
import { NOME_PERFIL, pode } from "@/lib/auth/permissoes";
import { chaveDia, formatarData, somarDias } from "@/lib/domain/datas";
import { rotuloSemana, semanaDe, semanasEntre } from "@/lib/domain/semanas";
import { capacidadePorSemana } from "@/lib/services/capacidade";
import { Cabecalho, Campo, Cartao, Selo, Vazio } from "@/components/ui";
import { BotaoAcao, Formulario } from "@/components/formulario";
import { HistoricoEntidade } from "@/components/historico";
import { adicionarApelido, atualizarRecurso, definirCapacidade, excluirApelido, excluirCapacidade } from "../acoes";

const valorData = (d: Date | null) => (d ? chaveDia(d) : "");

export default async function PaginaRecurso({ params }: PageProps<"/recursos/[id]">) {
  const { id } = await params;
  const usuario = await usuarioAtual();
  const recurso = await db.recurso.findUnique({
    where: { id },
    include: {
      usuario: true,
      apelidos: { orderBy: { apelido: "asc" } },
      capacidades: { orderBy: { vigenciaInicio: "desc" } },
    },
  });
  if (!recurso) notFound();
  const editavel = pode(usuario.perfil, "editar", "RECURSOS");

  const atual = semanaDe(new Date());
  const semanas = semanasEntre(atual.inicio, somarDias(atual.inicio, 7 * 11));
  const caps = (await capacidadePorSemana([recurso.id], semanas)).get(recurso.id)!;
  const feriados = await db.feriado.findMany({ where: { data: { gte: semanas[0].inicio, lte: semanas.at(-1)!.fim } }, orderBy: { data: "asc" } });

  return (
    <>
      <Cabecalho
        titulo={recurso.nome}
        subtitulo={[recurso.cargo, recurso.area].filter(Boolean).join(" · ") || undefined}
        trilha={[{ rotulo: "Recursos", href: "/recursos" }]}
        acoes={
          <>
            {recurso.usuario ? <Selo tom="ok">Login: {NOME_PERFIL[recurso.usuario.perfil]}</Selo> : <Selo>Sem login</Selo>}
            {recurso.ativo ? <Selo tom="ok">Ativo</Selo> : <Selo>Inativo</Selo>}
          </>
        }
      />

      <Cartao titulo="Capacidade líquida — próximas 12 semanas" className="mb-6">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
          {semanas.map((s) => {
            const c = caps.get(s.id)!;
            return (
              <div key={s.id} className={`rounded-md border px-2 py-2 text-center ${c.diasFeriado ? "border-destaque/40 bg-destaque/5" : "border-ardosia-100"}`}>
                <div className="text-[11px] font-medium text-ardosia-500">{rotuloSemana(s)}</div>
                <div className="text-lg font-semibold tabular-nums">{c.liquida}h</div>
                <div className="text-[10px] text-ardosia-500">{c.diasFeriado ? `−${c.horasFeriado}h feriado` : `${formatarData(s.inicio).slice(0, 5)}`}</div>
              </div>
            );
          })}
        </div>
        {feriados.length > 0 && (
          <p className="mt-3 text-xs text-ardosia-500">
            Feriados no período: {feriados.map((f) => `${formatarData(f.data).slice(0, 5)} ${f.descricao}`).join(" · ")}
          </p>
        )}
        <p className="mt-1 text-xs text-ardosia-500">Férias, ausências e projetos alocados entram nesta visão nos próximos incrementos.</p>
      </Cartao>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Cartao titulo="Dados do recurso">
          <Formulario acao={atualizarRecurso.bind(null, recurso.id)} somenteLeitura={!editavel}>
            <Campo rotulo="Nome">
              <input name="nome" required defaultValue={recurso.nome} className="campo" />
            </Campo>
            <Campo rotulo="E-mail corporativo">
              <input name="email" type="email" defaultValue={recurso.email ?? ""} className="campo" />
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo rotulo="Cargo">
                <input name="cargo" defaultValue={recurso.cargo ?? ""} className="campo" />
              </Campo>
              <Campo rotulo="Área">
                <input name="area" defaultValue={recurso.area ?? ""} className="campo" />
              </Campo>
              <Campo rotulo="Tipo">
                <select name="tipo" defaultValue={recurso.tipo} className="campo">
                  <option value="INTERNO">Interno</option>
                  <option value="TERCEIRO">Terceiro</option>
                </select>
              </Campo>
              <div />
              <Campo rotulo="Entrada">
                <input name="dataEntrada" type="date" defaultValue={valorData(recurso.dataEntrada)} className="campo" />
              </Campo>
              <Campo rotulo="Saída">
                <input name="dataSaida" type="date" defaultValue={valorData(recurso.dataSaida)} className="campo" />
              </Campo>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="ativo" defaultChecked={recurso.ativo} /> Recurso ativo
            </label>
          </Formulario>
        </Cartao>

        <div className="space-y-6">
          <Cartao titulo="Capacidade semanal (vigências)">
            {recurso.capacidades.length === 0 ? (
              <Vazio>Sem capacidade definida — o recurso aparecerá com capacidade 0.</Vazio>
            ) : (
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Início</th>
                    <th>Fim</th>
                    <th className="text-right">Horas / semana</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {recurso.capacidades.map((c) => (
                    <tr key={c.id}>
                      <td>{formatarData(c.vigenciaInicio)}</td>
                      <td>{c.vigenciaFim ? formatarData(c.vigenciaFim) : <Selo tom="ok">vigente</Selo>}</td>
                      <td className="text-right font-medium tabular-nums">{c.horasSemanais.toNumber()}h</td>
                      <td className="text-right">
                        {editavel && recurso.capacidades.length > 1 && (
                          <BotaoAcao acao={excluirCapacidade.bind(null, c.id)} confirmar="Excluir esta vigência?">
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
              <Formulario acao={definirCapacidade.bind(null, recurso.id)} rotuloEnviar="Registrar nova capacidade" limparAoSalvar className="mt-4 border-t border-ardosia-100 pt-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Campo rotulo="A partir de">
                    <input name="vigenciaInicio" type="date" required className="campo" />
                  </Campo>
                  <Campo rotulo="Horas / semana">
                    <input name="horasSemanais" type="number" step="0.5" min="0" max="80" required className="campo" />
                  </Campo>
                </div>
                <p className="text-xs text-ardosia-500">A vigência atual é encerrada no dia anterior automaticamente.</p>
              </Formulario>
            )}
          </Cartao>

          <Cartao titulo="Apelidos usados nas planilhas">
            <p className="mb-3 text-xs text-ardosia-500">Usados na importação para reconhecer o recurso (ex.: “Dornelles”, “Laura Iris”).</p>
            <div className="flex flex-wrap gap-2">
              {recurso.apelidos.length === 0 && <span className="text-sm text-ardosia-500">Nenhum.</span>}
              {recurso.apelidos.map((a) => (
                <span key={a.id} className="inline-flex items-center gap-1 rounded-full bg-ardosia-100 py-0.5 pr-1 pl-3 text-sm">
                  {a.apelido}
                  {editavel && (
                    <BotaoAcao acao={excluirApelido.bind(null, a.id)} variante="fantasma">
                      ×
                    </BotaoAcao>
                  )}
                </span>
              ))}
            </div>
            {editavel && (
              <Formulario acao={adicionarApelido.bind(null, recurso.id)} rotuloEnviar="Adicionar" limparAoSalvar className="mt-3">
                <input name="apelido" required className="campo" placeholder="Novo apelido" />
              </Formulario>
            )}
          </Cartao>

          <HistoricoEntidade entidade="Recurso" entidadeId={recurso.id} />
        </div>
      </div>
    </>
  );
}
