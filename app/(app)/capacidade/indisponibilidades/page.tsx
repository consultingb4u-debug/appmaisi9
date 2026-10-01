import Link from "next/link";
import clsx from "clsx";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth/sessao";
import { pode } from "@/lib/auth/permissoes";
import { diffDias, ehFimDeSemana, formatarData, somarDias } from "@/lib/domain/datas";
import { STATUS_INDISPONIBILIDADE, TIPO_INDISPONIBILIDADE } from "@/lib/domain/rotulos";
import { semanaDe } from "@/lib/domain/semanas";
import type { Prisma } from "@/lib/generated/prisma/client";
import { Campo, Cartao, Selo, Vazio } from "@/components/ui";
import { BotaoAcao, Formulario } from "@/components/formulario";
import { criarIndisponibilidade, decidirIndisponibilidade, excluirIndisponibilidade } from "../acoes";

export const metadata = { title: "Indisponibilidades" };

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function diasUteis(inicio: Date, fim: Date) {
  let n = 0;
  for (let d = inicio; d <= fim; d = somarDias(d, 1)) if (!ehFimDeSemana(d)) n++;
  return n;
}

export default async function Indisponibilidades({ searchParams }: PageProps<"/capacidade/indisponibilidades">) {
  const usuario = await usuarioAtual();
  const gestor = pode(usuario.perfil, "editar", "CAPACIDADE");
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : "";
  const recursoFiltro = typeof sp.recurso === "string" ? sp.recurso : "";
  const historico = sp.historico === "1";

  const meuRecurso = await db.recurso.findUnique({ where: { usuarioId: usuario.id }, select: { id: true, nome: true } });
  const recursos = await db.recurso.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } });
  const corte = somarDias(semanaDe(new Date()).inicio, -7);
  const where: Prisma.IndisponibilidadeWhereInput = {
    ...(status && { status: status as Prisma.IndisponibilidadeWhereInput["status"] }),
    ...(recursoFiltro && { recursoId: recursoFiltro }),
    ...(!historico && { fim: { gte: corte } }),
  };
  const itens = await db.indisponibilidade.findMany({ where, orderBy: [{ inicio: "asc" }], include: { recurso: { select: { id: true, nome: true, usuarioId: true } } } });
  const pendentes = itens.filter((i) => i.status === "PENDENTE").length;

  const grupos = new Map<string, typeof itens>();
  for (const i of itens) {
    const k = `${MESES[i.inicio.getUTCMonth()]} de ${i.inicio.getUTCFullYear()}`;
    grupos.set(k, [...(grupos.get(k) ?? []), i]);
  }
  const link = (extra: Record<string, string>) => `/capacidade/indisponibilidades?${new URLSearchParams({ ...(status && { status }), ...(recursoFiltro && { recurso: recursoFiltro }), ...(historico && { historico: "1" }), ...extra })}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Cartao
        titulo={historico ? "Todas as indisponibilidades" : "Indisponibilidades a partir da semana passada"}
        acoes={
          <form className="flex flex-wrap items-center gap-2 text-sm">
            {historico && <input type="hidden" name="historico" value="1" />}
            <select name="recurso" defaultValue={recursoFiltro} className="campo w-auto py-1">
              <option value="">Todos</option>
              {recursos.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
            </select>
            <select name="status" defaultValue={status} className="campo w-auto py-1">
              <option value="">Todas</option>
              {Object.entries(STATUS_INDISPONIBILIDADE).map(([k, r]) => (
                <option key={k} value={k}>
                  {r}
                </option>
              ))}
            </select>
            <button className="rounded-md bg-navy-900 px-3 py-1 text-white">Filtrar</button>
            <Link href={historico ? "/capacidade/indisponibilidades" : link({ historico: "1" })} className="text-xs text-ardosia-600 hover:underline">
              {historico ? "Só atuais" : "Incluir histórico"}
            </Link>
          </form>
        }
      >
        {gestor && pendentes > 0 && <div className="mb-4 rounded-md bg-alerta/10 px-3 py-2 text-sm text-[#8a6a00]">{pendentes} solicitação(ões) aguardando aprovação. Pendentes não reduzem a capacidade.</div>}
        {itens.length === 0 ? (
          <Vazio>Nenhuma indisponibilidade.</Vazio>
        ) : (
          <div className="space-y-6">
            {[...grupos.entries()].map(([mes, lista]) => (
              <div key={mes}>
                <h3 className="mb-2 text-xs font-semibold tracking-wide text-ardosia-500 uppercase">{mes}</h3>
                <ul className="divide-y divide-ardosia-100 rounded-md border border-ardosia-100">
                  {lista.map((i) => {
                    const dias = diasUteis(i.inicio, i.fim);
                    const proprio = i.recurso.usuarioId === usuario.id;
                    return (
                      <li key={i.id} className={clsx("flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm", i.status === "RECUSADA" && "opacity-50")}>
                        <div className="w-28 shrink-0 tabular-nums">
                          <div className="font-medium">
                            {formatarData(i.inicio).slice(0, 5)}
                            {diffDias(i.fim, i.inicio) > 0 && ` a ${formatarData(i.fim).slice(0, 5)}`}
                          </div>
                          <div className="text-xs text-ardosia-500">
                            {dias} dia(s) útil(eis) · {i.horasPorDia ? `${i.horasPorDia.toNumber()}h/dia` : "dia inteiro"}
                          </div>
                        </div>
                        <div className="min-w-40 flex-1">
                          <Link href={`/recursos/${i.recurso.id}`} className="font-medium hover:underline">
                            {i.recurso.nome}
                          </Link>
                          <span className="ml-2 text-ardosia-600">{TIPO_INDISPONIBILIDADE[i.tipo]}</span>
                          {i.observacao && <div className="text-xs text-ardosia-500">{i.observacao}</div>}
                        </div>
                        <Selo tom={i.status === "APROVADA" ? "ok" : i.status === "RECUSADA" ? "neutro" : "alerta"}>{STATUS_INDISPONIBILIDADE[i.status]}</Selo>
                        <div className="flex gap-1">
                          {gestor && i.status !== "APROVADA" && (
                            <BotaoAcao acao={decidirIndisponibilidade.bind(null, i.id, "APROVADA")} variante="secundario">
                              Aprovar
                            </BotaoAcao>
                          )}
                          {gestor && i.status === "PENDENTE" && (
                            <BotaoAcao acao={decidirIndisponibilidade.bind(null, i.id, "RECUSADA")} variante="fantasma">
                              Recusar
                            </BotaoAcao>
                          )}
                          {(gestor || (proprio && i.status === "PENDENTE")) && (
                            <BotaoAcao acao={excluirIndisponibilidade.bind(null, i.id)} confirmar="Excluir esta indisponibilidade?">
                              Excluir
                            </BotaoAcao>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Cartao>

      <Cartao titulo={gestor ? "Registrar indisponibilidade" : "Solicitar indisponibilidade"}>
        {!gestor && !meuRecurso ? (
          <Vazio>Seu usuário não está vinculado a um recurso. Peça a um administrador para fazer o vínculo.</Vazio>
        ) : (
          <Formulario acao={criarIndisponibilidade} rotuloEnviar={gestor ? "Registrar" : "Enviar solicitação"} limparAoSalvar>
            <Campo rotulo="Recurso">
              {gestor ? (
                <select name="recursoId" required defaultValue={recursoFiltro} className="campo">
                  <option value="" disabled>
                    Escolha…
                  </option>
                  {recursos.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nome}
                    </option>
                  ))}
                </select>
              ) : (
                <>
                  <input type="hidden" name="recursoId" value={meuRecurso!.id} />
                  <input disabled value={meuRecurso!.nome} className="campo" />
                </>
              )}
            </Campo>
            <Campo rotulo="Tipo">
              <select name="tipo" defaultValue="FERIAS" className="campo">
                {Object.entries(TIPO_INDISPONIBILIDADE).map(([k, r]) => (
                  <option key={k} value={k}>
                    {r}
                  </option>
                ))}
              </select>
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo rotulo="Início">
                <input type="date" name="inicio" required className="campo" />
              </Campo>
              <Campo rotulo="Fim">
                <input type="date" name="fim" className="campo" />
              </Campo>
            </div>
            <Campo rotulo="Horas por dia" ajuda="Deixe vazio para dia inteiro.">
              <input type="number" name="horasPorDia" step="0.5" min="0.5" max="12" className="campo" />
            </Campo>
            <Campo rotulo="Observação">
              <input name="observacao" className="campo" />
            </Campo>
            <p className="text-xs text-ardosia-500">{gestor ? "Registrada por gestor já entra aprovada e reduz a capacidade." : "Fica pendente até um gestor aprovar."}</p>
          </Formulario>
        )}
      </Cartao>
    </div>
  );
}
