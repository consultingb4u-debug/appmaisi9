import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { db } from "@/lib/db";
import { exigirPagina } from "@/lib/auth/sessao";
import { pode } from "@/lib/auth/permissoes";
import { pendenciasDoLote } from "@/lib/importacao/lotes";
import { descreverLinha, NOME_ENTIDADE, STATUS_LOTE } from "@/lib/importacao/descricao";
import { Cabecalho, Cartao, Selo, Vazio } from "@/components/ui";
import { BotaoAcao, Formulario } from "@/components/formulario";
import { formatoDataHora } from "@/components/historico";
import { descartar, efetivar, mapear, revalidar } from "../acoes";

const ACAO = { CRIAR: ["Criar", "ok"], ATUALIZAR: ["Atualizar", "livre"], IGNORAR: ["Sem alteração", "neutro"] } as const;
const NIVEL = { OK: ["OK", "ok"], ALERTA: ["Alerta", "alerta"], ERRO: ["Erro", "critico"] } as const;
const ENTIDADES = Object.keys(NOME_ENTIDADE);

export default async function PaginaLote({ params, searchParams }: PageProps<"/admin/importacao/[id]">) {
  const u = await exigirPagina("ver", "IMPORTACAO");
  const { id } = await params;
  const { status: fStatus, entidade: fEntidade } = await searchParams;
  const lote = await db.importLote.findUnique({ where: { id } });
  if (!lote) notFound();
  const projetoDoLote = lote.projetoId ? await db.projeto.findUnique({ where: { id: lote.projetoId }, select: { id: true, nome: true, cliente: { select: { nome: true } } } }) : null;
  const aberto = lote.status !== "EFETIVADO" && lote.status !== "DESCARTADO";
  const editavel = aberto && pode(u.perfil, "editar", "IMPORTACAO");

  const [linhas, pendencias, recursos, clientes] = await Promise.all([
    db.importLinha.findMany({ where: { loteId: id }, orderBy: [{ aba: "asc" }, { linhaOrigem: "asc" }], include: { mensagens: true } }),
    aberto ? pendenciasDoLote(id) : Promise.resolve([]),
    db.recurso.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    db.cliente.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);

  const resumo = ENTIDADES.map((e) => {
    const ls = linhas.filter((l) => l.entidade === e);
    return {
      entidade: e,
      total: ls.length,
      criar: ls.filter((l) => l.acao === "CRIAR").length,
      atualizar: ls.filter((l) => l.acao === "ATUALIZAR").length,
      ignorar: ls.filter((l) => l.acao === "IGNORAR" && l.status !== "ERRO").length,
      alertas: ls.filter((l) => l.status === "ALERTA").length,
      erros: ls.filter((l) => l.status === "ERRO").length,
    };
  }).filter((r) => r.total > 0);
  const totalErros = resumo.reduce((t, r) => t + r.erros, 0);
  const totalGravar = resumo.reduce((t, r) => t + r.criar + r.atualizar, 0);

  const efetivadoPor = lote.efetivadoPorId ? (await db.usuario.findUnique({ where: { id: lote.efetivadoPorId }, select: { nome: true } }))?.nome : null;
  const filtradas = linhas.filter((l) => (!fStatus || l.status === fStatus) && (!fEntidade || l.entidade === fEntidade));
  const [rotuloLote, tomLote] = STATUS_LOTE[lote.status];
  const filtro = (k: string, v: string | undefined) => {
    const p = new URLSearchParams();
    const atual = { status: typeof fStatus === "string" ? fStatus : undefined, entidade: typeof fEntidade === "string" ? fEntidade : undefined, [k]: v };
    for (const [kk, vv] of Object.entries(atual)) if (vv) p.set(kk, vv);
    return `/admin/importacao/${id}${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <Cabecalho
        titulo={lote.arquivoNome}
        subtitulo={`${lote.tipo === "CTRL001" ? `CTRL-001 do projeto ${projetoDoLote ? `${projetoDoLote.cliente.nome} · ${projetoDoLote.nome}` : "?"}` : "CTRL-003 Gestão de Recursos"} · carregado em ${formatoDataHora.format(lote.carregadoEm)}${lote.efetivadoEm ? ` · efetivado em ${formatoDataHora.format(lote.efetivadoEm)}` : ""}`}
        trilha={[{ rotulo: "Importação", href: "/admin/importacao" }]}
        acoes={
          <>
            <a href={`/admin/importacao/${id}/arquivo`} className="text-sm text-ardosia-600 hover:underline">
              Baixar original
            </a>
            <Selo tom={tomLote}>{rotuloLote}</Selo>
          </>
        }
      />
      {lote.status === "EFETIVADO" && projetoDoLote && (
        <Link href={`/projetos/${projetoDoLote.id}/cronograma`} className="mb-4 block text-sm text-navy-800 underline">
          Abrir o cronograma de {projetoDoLote.nome} →
        </Link>
      )}
      {lote.status === "EFETIVADO" && (
        <div className="mb-4 rounded-md border border-ok/30 bg-ok/10 px-4 py-3 text-sm text-ok">
          <strong>Importação efetivada</strong>
          {lote.efetivadoEm && ` em ${formatoDataHora.format(lote.efetivadoEm)}`}
          {efetivadoPor && ` por ${efetivadoPor}`}: {linhas.filter((l) => l.entidadeIdDestino).length} linha(s) gravada(s) no sistema,{" "}
          {linhas.filter((l) => !l.entidadeIdDestino && l.status !== "ERRO").length} sem alteração, {totalErros} com erro.
        </div>
      )}
      {lote.status === "DESCARTADO" && <div className="mb-4 rounded-md bg-ardosia-100 px-4 py-3 text-sm text-ardosia-600">Lote descartado — nada foi gravado.</div>}
      {lote.resumo && <div className="mb-4 rounded-md bg-alerta/10 px-4 py-2 text-sm text-[#8a6a00]">{lote.resumo}</div>}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {resumo.map((r) => (
          <Link key={r.entidade} href={filtro("entidade", r.entidade)} className="rounded-lg border border-ardosia-100 bg-white p-4 shadow-xs hover:border-ardosia-200">
            <div className="text-xs font-medium tracking-wide text-ardosia-500 uppercase">{NOME_ENTIDADE[r.entidade]}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{r.total}</div>
            <div className="mt-2 flex flex-wrap gap-1 text-xs">
              {r.criar > 0 && <Selo tom="ok">{r.criar} criar</Selo>}
              {r.atualizar > 0 && <Selo tom="livre">{r.atualizar} atualizar</Selo>}
              {r.ignorar > 0 && <Selo>{r.ignorar} sem alteração</Selo>}
              {r.alertas > 0 && <Selo tom="alerta">{r.alertas} alerta(s)</Selo>}
              {r.erros > 0 && <Selo tom="critico">{r.erros} erro(s)</Selo>}
            </div>
          </Link>
        ))}
      </div>

      {editavel && pendencias.length > 0 && (
        <Cartao titulo={`De-Para: ${pendencias.length} nome(s) não reconhecido(s)`} className="mb-6">
          <p className="mb-4 text-sm text-ardosia-600">Associe cada nome da planilha a um cadastro. A associação fica salva como apelido e vale para as próximas importações.</p>
          <div className="space-y-3">
            {pendencias.map((p) => (
              <div key={`${p.tipo}|${p.texto}`} className="flex flex-wrap items-center gap-3 rounded-md bg-fundo px-3 py-2">
                <Selo tom={p.tipo === "RECURSO" ? "livre" : "destaque"}>{p.tipo === "RECURSO" ? "Recurso" : "Cliente"}</Selo>
                <span className="font-medium">“{p.texto}”</span>
                <span className="text-xs text-ardosia-500">{p.ocorrencias} linha(s)</span>
                <Formulario acao={mapear.bind(null, id, p.tipo, p.texto)} rotuloEnviar="Associar" className="ml-auto !space-y-0">
                  <select name="destino" required defaultValue="" className="campo w-64 py-1.5">
                    <option value="" disabled>
                      Escolha…
                    </option>
                    {p.tipo === "CLIENTE" && <option value="__novo__">+ Cadastrar “{p.texto}” como novo cliente</option>}
                    {(p.tipo === "RECURSO" ? recursos : clientes).map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.nome}
                      </option>
                    ))}
                  </select>
                </Formulario>
              </div>
            ))}
          </div>
        </Cartao>
      )}

      {editavel && (
        <Cartao
          titulo="Efetivar importação"
          className="mb-6"
          acoes={
            <div className="flex gap-2">
              <BotaoAcao acao={revalidar.bind(null, id)} variante="secundario">
                Revalidar
              </BotaoAcao>
              <BotaoAcao acao={descartar.bind(null, id)} confirmar="Descartar este lote? Nada será gravado.">
                Descartar lote
              </BotaoAcao>
            </div>
          }
        >
          <Formulario acao={efetivar.bind(null, id)} rotuloEnviar={`Efetivar ${totalGravar} alteração(ões)`}>
            <p className="text-sm text-ardosia-600">
              Serão gravadas <strong>{totalGravar}</strong> linha(s) (criação ou atualização). Linhas “sem alteração” não mudam nada.
              {totalErros > 0 && (
                <>
                  {" "}
                  <strong className="text-critico">{totalErros} linha(s) com erro não serão importadas</strong> — corrija o De-Para e revalide, ou importe novamente depois.
                </>
              )}{" "}
              Dados existentes nunca são apagados; campos vazios na planilha não sobrescrevem o sistema.
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="confirmo" /> Conferi a revisão e quero gravar no sistema
            </label>
          </Formulario>
        </Cartao>
      )}

      <Cartao
        titulo={`Linhas (${filtradas.length} de ${linhas.length})`}
        acoes={
          <div className="flex flex-wrap gap-1 text-xs">
            {[undefined, "ERRO", "ALERTA", "OK"].map((s) => (
              <Link key={s ?? "todas"} href={filtro("status", s)} className={clsx("rounded-md px-2 py-1", (fStatus ?? undefined) === s ? "bg-navy-900 text-white" : "bg-ardosia-100 text-ardosia-600")}>
                {s ? NIVEL[s as keyof typeof NIVEL][0] : "Todas"}
              </Link>
            ))}
            {fEntidade && (
              <Link href={filtro("entidade", undefined)} className="rounded-md bg-destaque/15 px-2 py-1 text-destaque-escuro">
                {NOME_ENTIDADE[String(fEntidade)]} ✕
              </Link>
            )}
          </div>
        }
      >
        {filtradas.length === 0 ? (
          <Vazio>Nenhuma linha neste filtro.</Vazio>
        ) : (
          <div className="overflow-x-auto">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Aba · linha</th>
                  <th>Registro</th>
                  <th>Ação</th>
                  <th>Validação</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((l) => (
                  <tr key={l.id}>
                    <td className="text-xs whitespace-nowrap text-ardosia-600">
                      {l.aba} · {l.linhaOrigem}
                    </td>
                    <td>
                      <div className="text-xs text-ardosia-500">{NOME_ENTIDADE[l.entidade]}</div>
                      <div>{descreverLinha(l.entidade, l.dados as Record<string, unknown>)}</div>
                    </td>
                    <td>{l.acao && <Selo tom={ACAO[l.acao][1]}>{ACAO[l.acao][0]}</Selo>}</td>
                    <td>
                      {l.status && <Selo tom={NIVEL[l.status][1]}>{NIVEL[l.status][0]}</Selo>}
                      <ul className="mt-1 space-y-0.5 text-xs">
                        {l.mensagens.map((m) => (
                          <li key={m.id} className={m.nivel === "ERRO" ? "text-critico" : "text-[#8a6a00]"}>
                            {m.campo ? <strong>{m.campo}: </strong> : null}
                            {m.mensagem}
                          </li>
                        ))}
                      </ul>
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
