import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth/sessao";
import { pode } from "@/lib/auth/permissoes";
import { somarDias } from "@/lib/domain/datas";
import { semanaDe, semanasEntre } from "@/lib/domain/semanas";
import { carregarProjeto } from "@/lib/services/projeto";
import { cronogramaDoProjeto } from "@/lib/services/cronograma";
import { progresso as calcProgresso, type StatusItem } from "@/lib/domain/cronograma";
import { formatarData } from "@/lib/domain/datas";
import { FASE, FASES, SITUACAO_PRAZO } from "@/lib/domain/rotulos";
import Link from "next/link";
import { previstas } from "@/lib/services/alocacoes";
import { Cartao, Indicador, Selo, Vazio } from "@/components/ui";
import { Formulario } from "@/components/formulario";
import { CamposProjeto } from "@/components/campos-projeto";
import { GradeSemanal, type CelulaGrade } from "@/components/grade-semanal";
import { atualizarProjeto } from "../acoes";

const h = (n: number) => `${Math.round(n * 10) / 10}h`;

export default async function VisaoGeral({ params }: PageProps<"/projetos/[id]">) {
  const { id } = await params;
  const usuario = await usuarioAtual();
  const p = await carregarProjeto(id);
  if (!p) notFound();
  const editavel = pode(usuario.perfil, "editar", "PROJETOS");

  const atual = semanaDe(new Date());
  const semanas = semanasEntre(atual.inicio, somarDias(atual.inicio, 7 * 7));
  const ids = new Set(semanas.map((s) => s.id));
  const proximas = p.alocacoes.filter((a) => ids.has(a.semanaId));
  const recursos = [...new Map(proximas.map((a) => [a.recurso.id, a.recurso])).values()].sort((a, b) => a.nome.localeCompare(b.nome));
  const celulas = new Map<string, CelulaGrade>(proximas.map((a) => [`${a.recursoId}|${a.semanaId}`, { horas: previstas(a), dica: a.observacao ?? undefined }]));
  const futuras = p.alocacoes.filter((a) => a.semana.inicio >= atual.inicio).reduce((t, a) => t + previstas(a), 0);
  const vendidas = p.horasVendidas?.toNumber() ?? null;
  const crono = await cronogramaDoProjeto(p.id);
  const ativas = crono.atividades.filter((a) => a.status !== "CANCELADO");
  const fases = FASES.map((f) => {
    const doGrupo = ativas.filter((a) => a.fase === f);
    return {
      fase: f,
      n: doGrupo.length,
      progresso: calcProgresso(doGrupo.map((a) => ({ previsto: a.totais.previsto, percentual: a.percentualConclusao, status: a.status as StatusItem }))),
      previsto: doGrupo.reduce((t, a) => t + a.totais.previsto, 0),
    };
  });
  const marcos = ativas.filter((a) => a.marco && a.status !== "CONCLUIDO" && a.fimPrevisto).sort((a, b) => a.fimPrevisto!.getTime() - b.fimPrevisto!.getTime()).slice(0, 5);
  const atrasadas = ativas.filter((a) => a.situacao === "ATRASADO");

  const [clientes, todosRecursos] = editavel
    ? await Promise.all([
        db.cliente.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
        db.recurso.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
      ])
    : [[], []];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador rotulo="Horas vendidas" valor={vendidas === null ? "—" : h(vendidas)} detalhe={vendidas === null ? "não informado no portfólio" : undefined} />
        <Indicador rotulo="Planejado (total)" valor={h(p.horasPlanejadas)} detalhe={vendidas ? `saldo ${h(vendidas - p.horasPlanejadas)}` : undefined} tom={vendidas !== null && p.horasPlanejadas > vendidas ? "critico" : "navy"} />
        <Indicador rotulo="Planejado a partir desta semana" valor={h(futuras)} />
        <Indicador rotulo="Realizado" valor={h(p.horasRealizadas)} detalhe="soma das horas apontadas" />
      </div>

      {crono.atividades.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Cartao titulo="Fases">
            <ul className="space-y-3 text-sm">
              {fases.map((f) => (
                <li key={f.fase}>
                  <div className="mb-1 flex justify-between">
                    <span className={f.n ? "font-medium" : "text-ardosia-400"}>{FASE[f.fase]}</span>
                    <span className="text-xs text-ardosia-500 tabular-nums">{f.n ? `${f.progresso}% · ${h(f.previsto)}` : "sem atividades"}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-ardosia-100">
                    <div className={f.progresso >= 100 ? "h-full bg-ok" : "h-full bg-navy-700"} style={{ width: `${f.progresso}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Cartao>
          <Cartao titulo="Próximos marcos">
            {marcos.length === 0 ? (
              <Vazio>Nenhum marco pendente.</Vazio>
            ) : (
              <ul className="space-y-2 text-sm">
                {marcos.map((m) => (
                  <li key={m.id} className="flex items-start gap-2">
                    <span className="w-12 shrink-0 font-medium tabular-nums">{formatarData(m.fimPrevisto).slice(0, 5)}</span>
                    <Link href={`/projetos/${p.id}/cronograma?editar=${m.id}`} className="flex-1 hover:underline">
                      {m.tarefa}
                    </Link>
                    {m.situacao && <Selo tom={SITUACAO_PRAZO[m.situacao][1]}>{SITUACAO_PRAZO[m.situacao][0]}</Selo>}
                  </li>
                ))}
              </ul>
            )}
          </Cartao>
          <Cartao titulo={`Atrasadas (${atrasadas.length})`}>
            {atrasadas.length === 0 ? (
              <Vazio>Nenhuma atividade atrasada.</Vazio>
            ) : (
              <ul className="space-y-2 text-sm">
                {atrasadas.slice(0, 6).map((a) => (
                  <li key={a.id}>
                    <Link href={`/projetos/${p.id}/cronograma?editar=${a.id}`} className="hover:underline">
                      <span className="text-xs text-ardosia-500">{a.codigo}</span> {a.tarefa}
                    </Link>
                    <div className="text-xs text-critico">fim previsto {formatarData(a.fimPrevisto)} · {a.percentualConclusao}%</div>
                  </li>
                ))}
              </ul>
            )}
            {crono.alertas.length > 0 && (
              <Link href={`/projetos/${p.id}/cronograma`} className="mt-3 block text-xs text-[#8a6a00] hover:underline">
                {crono.alertas.length} ponto(s) de qualidade no cronograma →
              </Link>
            )}
          </Cartao>
        </div>
      )}

      <Cartao titulo="Carga planejada — próximas 8 semanas">
        {recursos.length === 0 ? (
          <Vazio>Nenhuma alocação nas próximas semanas.</Vazio>
        ) : (
          <GradeSemanal linhas={recursos.map((r) => ({ chave: r.id, rotulo: r.nome, href: `/recursos/${r.id}` }))} semanas={semanas} celulas={celulas} />
        )}
      </Cartao>

      {p.notas && (
        <Cartao titulo="Notas · bloqueios · ações">
          <p className="text-sm whitespace-pre-line">{p.notas}</p>
        </Cartao>
      )}

      {editavel && (
        <Cartao titulo="Dados do projeto">
          <Formulario acao={atualizarProjeto.bind(null, p.id)}>
            <CamposProjeto
              v={{ ...p, horasVendidas: vendidas, gpId: p.gpId }}
              clientes={clientes}
              recursos={todosRecursos}
            />
          </Formulario>
        </Cartao>
      )}
    </div>
  );
}
