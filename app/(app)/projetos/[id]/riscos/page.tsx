import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth/sessao";
import { pode } from "@/lib/auth/permissoes";
import { itemAberto, severidade, type Severidade } from "@/lib/domain/execucao";
import { formatarData } from "@/lib/domain/datas";
import { SEVERIDADE, STATUS_OPERACIONAL, TOM_OPERACIONAL, TOM_SEVERIDADE } from "@/lib/domain/rotulos";
import { Cartao, LinkBotao, Selo, Vazio } from "@/components/ui";

const COR_CELULA: Record<Severidade, string> = {
  BAIXA: "bg-ok/15",
  MEDIA: "bg-alerta/25",
  ALTA: "bg-destaque/30",
  CRITICA: "bg-critico/30",
};

export default async function Riscos({ params }: PageProps<"/projetos/[id]/riscos">) {
  const { id } = await params;
  const usuario = await usuarioAtual();
  const editavel = pode(usuario.perfil, "editar", "PROJETOS");
  const projeto = await db.projeto.findUnique({ where: { id }, select: { id: true } });
  if (!projeto) notFound();
  const riscos = await db.itemOperacional.findMany({
    where: { projetoId: id, tipo: "RISCO" },
    include: { responsavel: { select: { nome: true } } },
    orderBy: { codigo: "asc" },
  });
  const abertos = riscos.filter((r) => itemAberto(r.status));
  const pontuacao = (r: (typeof riscos)[number]) => (r.probabilidade ?? 0) * (r.impacto ?? 0);
  const ordenados = [...riscos].sort((a, b) => Number(itemAberto(b.status)) - Number(itemAberto(a.status)) || pontuacao(b) - pontuacao(a));
  const op = `/projetos/${id}/operacional`;

  return (
    <div className="space-y-6">
      <Cartao
        titulo={`Matriz de riscos · ${abertos.length} aberto(s)`}
        acoes={
          editavel && (
            <LinkBotao href={`${op}?novo=RISCO&tipo=RISCO`} tamanho="sm">
              + Risco
            </LinkBotao>
          )
        }
      >
        <div className="flex gap-3">
          <div className="flex items-center">
            <span className="-rotate-90 text-xs font-medium tracking-wide whitespace-nowrap text-ardosia-500 uppercase">Probabilidade</span>
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-[2rem_repeat(5,minmax(0,1fr))] gap-1">
              {[5, 4, 3, 2, 1].map((p) => (
                <div key={p} className="contents">
                  <div className="flex items-center justify-center text-xs font-medium text-ardosia-500">{p}</div>
                  {[1, 2, 3, 4, 5].map((i) => {
                    const aqui = abertos.filter((r) => r.probabilidade === p && r.impacto === i);
                    return (
                      <div key={i} className={clsx("min-h-16 rounded p-1.5 text-xs", COR_CELULA[severidade(p, i)!])} title={`P${p} × I${i} = ${p * i}`}>
                        <div className="flex flex-wrap gap-1">
                          {aqui.map((r) => (
                            <Link key={r.id} href={`${op}?editar=${r.id}&tipo=RISCO`} className="rounded bg-white/80 px-1.5 py-0.5 font-medium text-navy-900 shadow-xs hover:bg-white" title={r.descricao}>
                              {r.codigo}
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="text-center text-xs font-medium text-ardosia-500">
                  {i}
                </div>
              ))}
            </div>
            <div className="mt-1 text-center text-xs font-medium tracking-wide text-ardosia-500 uppercase">Impacto</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-ardosia-500">
          {(Object.keys(SEVERIDADE) as Severidade[]).map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className={clsx("h-3 w-3 rounded", COR_CELULA[s])} /> {SEVERIDADE[s]}
            </span>
          ))}
          <span>· Severidade = probabilidade × impacto (≤4 baixa, ≤9 média, ≤15 alta, &gt;15 crítica). Só riscos abertos aparecem na matriz.</span>
        </div>
      </Cartao>

      <Cartao titulo="Riscos">
        {ordenados.length === 0 ? (
          <Vazio>Nenhum risco registrado. Riscos são itens do registro operacional com probabilidade e impacto.</Vazio>
        ) : (
          <div className="-m-4 overflow-x-auto">
            <table className="tabela">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Descrição</th>
                  <th>Responsável</th>
                  <th className="text-center">P × I</th>
                  <th>Severidade</th>
                  <th>Resposta</th>
                  <th>Prazo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ordenados.map((r) => {
                  const sev = severidade(r.probabilidade, r.impacto);
                  return (
                    <tr key={r.id} className={itemAberto(r.status) ? "" : "opacity-60"}>
                      <td className="whitespace-nowrap">
                        <Link href={`${op}?editar=${r.id}&tipo=RISCO`} className="font-medium text-navy-800 hover:underline">
                          {r.codigo}
                        </Link>
                      </td>
                      <td className="max-w-md">{r.descricao}</td>
                      <td className="text-xs">{r.responsavel?.nome ?? r.responsavelTexto ?? "—"}</td>
                      <td className="text-center tabular-nums">{r.probabilidade && r.impacto ? `${r.probabilidade} × ${r.impacto} = ${pontuacao(r)}` : "—"}</td>
                      <td>{sev ? <Selo tom={TOM_SEVERIDADE[sev]}>{SEVERIDADE[sev]}</Selo> : "—"}</td>
                      <td className="max-w-xs text-xs">{r.acaoResposta ?? "—"}</td>
                      <td className="text-xs whitespace-nowrap">{formatarData(r.prazo)}</td>
                      <td>
                        <Selo tom={TOM_OPERACIONAL[r.status]}>{STATUS_OPERACIONAL[r.status]}</Selo>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Cartao>
    </div>
  );
}
