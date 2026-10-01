import Link from "next/link";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth/sessao";
import { pode } from "@/lib/auth/permissoes";
import { formatarData, somarDias } from "@/lib/domain/datas";
import { faltaAtribuicao, situacaoPrazo, type StatusItem } from "@/lib/domain/cronograma";
import { rotuloSemana, semanaDe, semanaPorId } from "@/lib/domain/semanas";
import { capacidadePorSemana } from "@/lib/services/capacidade";
import { previstas } from "@/lib/services/alocacoes";
import { Cabecalho, Cartao, Vazio } from "@/components/ui";
import { GradeApontamento, type LinhaApontamento } from "@/components/grade-apontamento";

export const metadata = { title: "Minhas horas" };

export default async function MinhasHoras({ searchParams }: PageProps<"/horas">) {
  const usuario = await usuarioAtual();
  const gestor = pode(usuario.perfil, "editar", "CAPACIDADE");
  const sp = await searchParams;
  const semana = (typeof sp.semana === "string" && semanaPorId(sp.semana)) || semanaDe(new Date());
  const meu = await db.recurso.findUnique({ where: { usuarioId: usuario.id }, select: { id: true, nome: true } });
  const recursos = gestor ? await db.recurso.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }) : [];
  const recursoId = (gestor && typeof sp.recurso === "string" && sp.recurso) || meu?.id;
  const recurso = recursoId ? (recursos.find((r) => r.id === recursoId) ?? meu) : null;

  const nav = (s: string) => `/horas?${new URLSearchParams({ semana: s, ...(gestor && recursoId ? { recurso: recursoId } : {}) })}`;
  const anterior = semanaDe(somarDias(semana.inicio, -7)).id;
  const proxima = semanaDe(somarDias(semana.inicio, 7)).id;

  if (!recurso) {
    return (
      <>
        <Cabecalho titulo="Minhas horas" />
        <Vazio>Seu usuário não está vinculado a um recurso. Peça a um administrador para fazer o vínculo em Administração → Usuários.</Vazio>
      </>
    );
  }

  const [atribuicoes, apontamentos, alocacoes, caps] = await Promise.all([
    db.atividadeAtribuicao.findMany({
      where: { recursoId: recurso.id, atividade: { status: { not: "CANCELADO" }, projeto: { arquivadoEm: null } } },
      include: { atividade: { include: { projeto: { select: { id: true, nome: true, cliente: { select: { nome: true } } } } } } },
    }),
    db.apontamento.findMany({ where: { recursoId: recurso.id } }),
    db.alocacaoSemanal.findMany({ where: { recursoId: recurso.id, semanaId: semana.id }, include: { projeto: { select: { id: true, nome: true, cliente: { select: { nome: true } }, _count: { select: { atividades: true } } } } } }),
    capacidadePorSemana([recurso.id], [semana]),
  ]);
  const doSemana = (atividadeId: string | null, projetoId: string) => apontamentos.filter((a) => a.semanaId === semana.id && a.atividadeId === atividadeId && a.projetoId === projetoId).reduce((t, a) => t + a.horas.toNumber(), 0);
  const total = (atividadeId: string | null, projetoId: string) => apontamentos.filter((a) => a.atividadeId === atividadeId && a.projetoId === projetoId).reduce((t, a) => t + a.horas.toNumber(), 0);

  // Atividades relevantes na semana: em aberto e já iniciadas (ou com horas lançadas nesta semana).
  const linhas: LinhaApontamento[] = atribuicoes
    .filter((at) => {
      const a = at.atividade;
      const lancou = doSemana(a.id, a.projetoId) > 0;
      const comecou = !a.inicioPrevisto || a.inicioPrevisto <= semana.fim;
      const aberta = a.status !== "CONCLUIDO" || (a.dataRealConclusao && a.dataRealConclusao >= semana.inicio);
      return lancou || (comecou && aberta);
    })
    .map((at) => {
      const a = at.atividade;
      const realizado = total(a.id, a.projetoId);
      const previsto = at.esforcoPrevisto.toNumber();
      const informada = at.horasParaConcluir !== null;
      return {
        chave: at.id,
        projetoId: a.projetoId,
        projeto: `${a.projeto.cliente.nome} · ${a.projeto.nome}`,
        atividadeId: a.id,
        atividade: `${a.codigo} ${a.tarefa}`,
        periodo: a.inicioPrevisto ? `${formatarData(a.inicioPrevisto).slice(0, 5)} a ${formatarData(a.fimPrevisto).slice(0, 5)}` : "sem datas",
        previsto,
        realizadoTotal: realizado,
        semana: doSemana(a.id, a.projetoId),
        falta: faltaAtribuicao({ previsto, paraConcluir: at.horasParaConcluir?.toNumber() ?? null, realizado }, a.status === "CONCLUIDO"),
        faltaInformada: informada,
        percentual: a.percentualConclusao,
        situacao: situacaoPrazo(a.status as StatusItem, a.fimPrevisto, new Date()) ?? undefined,
      };
    })
    .sort((x, y) => `${x.projeto}${x.atividade}`.localeCompare(`${y.projeto}${y.atividade}`, "pt-BR"));

  // Projetos sem cronograma (suporte, alocação, CTRL-003): horas lançadas direto no projeto.
  const semCronograma = alocacoes.filter((a) => a.projeto._count.atividades === 0);
  const idsSem = new Set(semCronograma.map((a) => a.projetoId));
  for (const ap of apontamentos.filter((a) => a.semanaId === semana.id && a.atividadeId === null && !idsSem.has(a.projetoId))) idsSem.add(ap.projetoId);
  const projetosSem = await db.projeto.findMany({ where: { id: { in: [...idsSem] } }, select: { id: true, nome: true, cliente: { select: { nome: true } } } });
  for (const p of projetosSem) {
    const aloc = alocacoes.find((a) => a.projetoId === p.id);
    linhas.push({
      chave: `projeto-${p.id}`,
      projetoId: p.id,
      projeto: `${p.cliente.nome} · ${p.nome}`,
      atividadeId: null,
      atividade: "Horas no projeto (sem cronograma)",
      periodo: aloc ? `planejado ${previstas(aloc)}h` : "—",
      previsto: null,
      realizadoTotal: total(null, p.id),
      semana: doSemana(null, p.id),
      falta: null,
      faltaInformada: false,
      percentual: null,
    });
  }
  const cap = caps.get(recurso.id)!.get(semana.id)!;
  const lancado = linhas.reduce((t, l) => t + l.semana, 0);

  return (
    <>
      <Cabecalho
        titulo={recurso.id === meu?.id ? "Minhas horas" : `Horas de ${recurso.nome}`}
        subtitulo="Aponte o que trabalhou em cada atividade e atualize quanto falta. O restante é redistribuído automaticamente nas próximas semanas."
        acoes={
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {gestor && (
              <form className="flex gap-2">
                <input type="hidden" name="semana" value={semana.id} />
                <select name="recurso" defaultValue={recurso.id} className="campo w-auto py-1.5">
                  {recursos.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nome}
                    </option>
                  ))}
                </select>
                <button className="rounded-md bg-navy-900 px-3 text-white">Ver</button>
              </form>
            )}
            <div className="flex items-center rounded-md border border-ardosia-200 bg-white">
              <Link href={nav(anterior)} className="px-2.5 py-1.5 text-ardosia-600" aria-label="Semana anterior">
                ◀
              </Link>
              <span className="border-x border-ardosia-200 px-3 py-1.5">
                {rotuloSemana(semana)} · {formatarData(semana.inicio).slice(0, 5)} a {formatarData(semana.fim).slice(0, 5)}
              </span>
              <Link href={nav(proxima)} className="px-2.5 py-1.5 text-ardosia-600" aria-label="Próxima semana">
                ▶
              </Link>
            </div>
          </div>
        }
      />
      <Cartao titulo={`Lançado ${lancado}h de ${cap.liquida}h de capacidade nesta semana`}>
        {linhas.length === 0 ? <Vazio>Nenhuma atividade em aberto nesta semana.</Vazio> : <GradeApontamento linhas={linhas} recursoId={recurso.id} semanaId={semana.id} />}
        <p className="mt-4 text-xs text-ardosia-500">Digite e saia do campo (Tab/Enter) para salvar. “Falta” vazio = previsto − realizado. % 100 conclui a atividade.</p>
      </Cartao>
    </>
  );
}
