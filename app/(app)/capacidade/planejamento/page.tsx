import Link from "next/link";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth/sessao";
import { pode } from "@/lib/auth/permissoes";
import { PRIORIDADE, STATUS_ALOCACAO } from "@/lib/domain/rotulos";
import { rotuloSemana, semanaDe } from "@/lib/domain/semanas";
import { capacidadePorSemana } from "@/lib/services/capacidade";
import { previstas } from "@/lib/services/alocacoes";
import { Campo, Cartao, Vazio } from "@/components/ui";
import { Formulario } from "@/components/formulario";
import { janelaDeSemanas, NavegadorSemanas } from "@/components/navegador-semanas";
import { GradePlanejamento, type LinhaPlanejamento } from "@/components/grade-planejamento";
import { salvarDetalheAlocacao } from "../acoes";

export const metadata = { title: "Planejamento semanal" };

export default async function Planejamento({ searchParams }: PageProps<"/capacidade/planejamento">) {
  const usuario = await usuarioAtual();
  const editavel = pode(usuario.perfil, "editar", "CAPACIDADE");
  const sp = await searchParams;
  const p = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, typeof v === "string" && v ? v : undefined])) as Record<string, string | undefined>;
  const semanas = janelaDeSemanas(p.de, p.n);
  const ids = semanas.map((s) => s.id);
  const atual = semanaDe(new Date()).id;

  const [projetos, recursos, clientes] = await Promise.all([
    db.projeto.findMany({ where: { arquivadoEm: null, status: { notIn: ["CANCELADO", "NAO_APROVADO"] } }, orderBy: [{ cliente: { nome: "asc" } }, { nome: "asc" }], select: { id: true, nome: true, clienteId: true, cliente: { select: { nome: true } } } }),
    db.recurso.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    db.cliente.findMany({ where: { projetos: { some: {} } }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);

  const alocacoes = await db.alocacaoSemanal.findMany({
    where: {
      semanaId: { in: ids },
      ...(p.projeto && { projetoId: p.projeto }),
      ...(p.recurso && { recursoId: p.recurso }),
      ...(p.cliente && { projeto: { clienteId: p.cliente } }),
    },
  });

  // Linhas: pares projeto+recurso com alocação na janela, membros do projeto filtrado e a linha adicionada (?addProjeto=…&addRecurso=…).
  const pares = new Map<string, { projetoId: string; recursoId: string }>();
  for (const a of alocacoes) pares.set(`${a.projetoId}|${a.recursoId}`, { projetoId: a.projetoId, recursoId: a.recursoId });
  if (p.projeto) {
    const membros = await db.projetoMembro.findMany({ where: { projetoId: p.projeto, ...(p.recurso && { recursoId: p.recurso }) }, select: { projetoId: true, recursoId: true } });
    for (const m of membros) pares.set(`${m.projetoId}|${m.recursoId}`, m);
  }
  if (p.addProjeto && p.addRecurso) {
    const [projetoId, recursoId] = [p.addProjeto, p.addRecurso];
    if (projetos.some((x) => x.id === projetoId) && recursos.some((x) => x.id === recursoId)) pares.set(`${projetoId}|${recursoId}`, { projetoId, recursoId });
  }
  const nomeProjeto = new Map(projetos.map((x) => [x.id, x]));
  const nomeRecurso = new Map(recursos.map((x) => [x.id, x.nome]));
  const porRecurso = !!p.recurso && !p.projeto && !p.cliente;

  const linhas: LinhaPlanejamento[] = [...pares.values()]
    .filter((x) => nomeProjeto.has(x.projetoId) && nomeRecurso.has(x.recursoId))
    .map((x) => {
      const pr = nomeProjeto.get(x.projetoId)!;
      const rec = nomeRecurso.get(x.recursoId)!;
      const celulas: LinhaPlanejamento["celulas"] = {};
      for (const a of alocacoes.filter((a) => a.projetoId === x.projetoId && a.recursoId === x.recursoId)) {
        celulas[a.semanaId] = {
          id: a.id,
          previstas: previstas(a),
          calculadas: a.horasCalculadas.toNumber(),
          avulsas: a.horasAvulsas.toNumber(),
          override: a.horasManuais !== null,
          status: a.status,
          observacao: a.observacao,
        };
      }
      return {
        chave: `${x.projetoId}|${x.recursoId}`,
        projetoId: x.projetoId,
        recursoId: x.recursoId,
        titulo: porRecurso ? pr.nome : `${pr.nome}`,
        subtitulo: porRecurso ? pr.cliente.nome : `${pr.cliente.nome} · ${rec}`,
        href: `/projetos/${x.projetoId}/equipe`,
        celulas,
      };
    })
    .sort((a, b) => `${a.subtitulo}${a.titulo}`.localeCompare(`${b.subtitulo}${b.titulo}`, "pt-BR"));

  // Com filtro por recurso, a grade mostra a capacidade e a utilização recalculadas a cada edição.
  const cap = porRecurso ? (await capacidadePorSemana([p.recurso!], semanas)).get(p.recurso!) : undefined;
  const colunas = semanas.map((s) => ({ id: s.id, rotulo: rotuloSemana(s), atual: s.id === atual, capacidade: cap?.get(s.id)?.liquida }));

  const celulaSel = p.celula ? await db.alocacaoSemanal.findUnique({ where: { id: p.celula }, include: { projeto: { select: { nome: true } }, recurso: { select: { nome: true } }, semana: true } }) : null;
  const qs = (extra: Record<string, string | undefined>) => new URLSearchParams(Object.entries({ ...p, ...extra }).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <NavegadorSemanas base="/capacidade/planejamento" params={p} semanas={semanas} />
        <form className="flex flex-wrap items-center gap-2 text-sm">
          {p.de && <input type="hidden" name="de" value={p.de} />}
          {p.n && <input type="hidden" name="n" value={p.n} />}
          <select name="recurso" defaultValue={p.recurso ?? ""} className="campo w-auto py-1.5">
            <option value="">Todos os recursos</option>
            {recursos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome}
              </option>
            ))}
          </select>
          <select name="cliente" defaultValue={p.cliente ?? ""} className="campo w-auto py-1.5">
            <option value="">Todos os clientes</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
          <select name="projeto" defaultValue={p.projeto ?? ""} className="campo w-auto max-w-64 py-1.5">
            <option value="">Todos os projetos</option>
            {projetos.map((x) => (
              <option key={x.id} value={x.id}>
                {x.cliente.nome} · {x.nome}
              </option>
            ))}
          </select>
          <button className="rounded-md bg-navy-900 px-3 py-1.5 text-white">Filtrar</button>
          {(p.recurso || p.cliente || p.projeto) && (
            <Link href={`/capacidade/planejamento?${qs({ recurso: undefined, cliente: undefined, projeto: undefined, addProjeto: undefined, addRecurso: undefined, celula: undefined })}`} className="text-ardosia-600 hover:underline">
              Limpar
            </Link>
          )}
        </form>
      </div>

      <Cartao
        titulo={porRecurso ? `Planejamento de ${nomeRecurso.get(p.recurso!)}` : "Planejamento semanal"}
        acoes={editavel && <span className="text-xs text-ardosia-500">Digite o total de horas da semana · Tab/Enter salva · Esc desfaz</span>}
      >
        {linhas.length === 0 ? (
          <Vazio>Nenhuma alocação nesta janela e filtro. {editavel && "Use “Adicionar linha” abaixo."}</Vazio>
        ) : (
          <GradePlanejamento key={qs({ celula: undefined })} linhas={linhas} semanas={colunas} editavel={editavel} baseDetalhe={`/capacidade/planejamento?${qs({ celula: undefined })}`} />
        )}
        {!editavel && <p className="mt-3 text-xs text-ardosia-500">Somente leitura para o seu perfil.</p>}
      </Cartao>

      {editavel && (
        <Cartao titulo="Adicionar linha (projeto + recurso)">
          <form action="/capacidade/planejamento" className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            {Object.entries(p)
              .filter(([k, v]) => v && ["de", "n", "recurso", "cliente", "projeto"].includes(k))
              .map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
            <AdicionarLinha projetos={projetos} recursos={recursos} recursoFixo={p.recurso} projetoFixo={p.projeto} />
          </form>
        </Cartao>
      )}

      {celulaSel && (
        <Cartao titulo={`${celulaSel.recurso.nome} · ${celulaSel.projeto.nome} · ${rotuloSemana(celulaSel.semana)}`} acoes={<Link href={`/capacidade/planejamento?${qs({ celula: undefined })}`} className="text-sm text-ardosia-500">✕</Link>}>
          <dl className="mb-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-ardosia-500">Previstas</dt>
              <dd className="font-semibold tabular-nums">{previstas(celulaSel)}h</dd>
            </div>
            <div>
              <dt className="text-xs text-ardosia-500">Do cronograma</dt>
              <dd className="tabular-nums">{celulaSel.horasCalculadas.toNumber()}h</dd>
            </div>
            <div>
              <dt className="text-xs text-ardosia-500">Gestão / avulsas</dt>
              <dd className="tabular-nums">{celulaSel.horasAvulsas.toNumber()}h</dd>
            </div>
            <div>
              <dt className="text-xs text-ardosia-500">Realizadas</dt>
              <dd className="tabular-nums">{celulaSel.horasRealizadas.toNumber()}h</dd>
            </div>
          </dl>
          <Formulario acao={salvarDetalheAlocacao.bind(null, celulaSel.id)} somenteLeitura={!editavel}>
            <div className="grid gap-3 sm:grid-cols-3">
              <Campo rotulo="Status">
                <select name="status" defaultValue={celulaSel.status} className="campo">
                  {Object.entries(STATUS_ALOCACAO).map(([k, r]) => (
                    <option key={k} value={k}>
                      {r}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo rotulo="Prioridade">
                <select name="prioridade" defaultValue={celulaSel.prioridade ?? ""} className="campo">
                  <option value="">—</option>
                  {Object.entries(PRIORIDADE).map(([k, r]) => (
                    <option key={k} value={k}>
                      {r}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo rotulo="Observação" className="sm:col-span-3">
                <textarea name="observacao" rows={2} defaultValue={celulaSel.observacao ?? ""} className="campo" />
              </Campo>
            </div>
            {celulaSel.horasCalculadas.toNumber() > 0 && celulaSel.horasManuais !== null && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="voltarCalculado" /> Voltar ao valor do cronograma ({celulaSel.horasCalculadas.toNumber()}h)
              </label>
            )}
          </Formulario>
        </Cartao>
      )}
    </div>
  );
}

function AdicionarLinha({
  projetos,
  recursos,
  recursoFixo,
  projetoFixo,
}: {
  projetos: { id: string; nome: string; cliente: { nome: string } }[];
  recursos: { id: string; nome: string }[];
  recursoFixo?: string;
  projetoFixo?: string;
}) {
  return (
    <>
      <Campo rotulo="Projeto">
        <select name="addProjeto" required defaultValue={projetoFixo ?? ""} className="campo">
          <option value="" disabled>
            Escolha…
          </option>
          {projetos.map((x) => (
            <option key={x.id} value={x.id}>
              {x.cliente.nome} · {x.nome}
            </option>
          ))}
        </select>
      </Campo>
      <Campo rotulo="Recurso">
        <select name="addRecurso" required defaultValue={recursoFixo ?? ""} className="campo">
          <option value="" disabled>
            Escolha…
          </option>
          {recursos.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nome}
            </option>
          ))}
        </select>
      </Campo>
      <button className="self-end rounded-md bg-navy-900 px-4 py-2 text-sm text-white">Adicionar</button>
    </>
  );
}
