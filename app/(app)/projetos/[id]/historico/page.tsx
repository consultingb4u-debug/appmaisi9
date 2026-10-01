import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth/sessao";
import { Cartao, Selo, Vazio } from "@/components/ui";
import { formatarValor, formatoDataHora, rotuloCampo } from "@/components/historico";

const TONS = { CRIAR: "ok", ALTERAR: "livre", EXCLUIR: "critico", IMPORTAR: "destaque", PUBLICAR: "navy" } as const;
const ACOES = { CRIAR: "Criou", ALTERAR: "Alterou", EXCLUIR: "Excluiu", IMPORTAR: "Importou", PUBLICAR: "Publicou" } as const;

export default async function Historico({ params }: PageProps<"/projetos/[id]/historico">) {
  await usuarioAtual();
  const { id } = await params;
  const linhas = await db.auditoria.findMany({
    where: { projetoId: id },
    orderBy: { dataHora: "desc" },
    take: 200,
    include: { usuario: { select: { nome: true } } },
  });
  return (
    <Cartao titulo="Histórico do projeto">
      {linhas.length === 0 ? (
        <Vazio>Sem registros.</Vazio>
      ) : (
        <ol className="space-y-4">
          {linhas.map((l) => (
            <li key={l.id} className="text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Selo tom={TONS[l.acao]}>{ACOES[l.acao]}</Selo>
                <span className="text-ardosia-600">{l.entidade === "Projeto" ? "projeto" : l.entidade === "ProjetoMembro" ? "equipe" : l.entidade}</span>
                <span className="font-medium">{l.usuario?.nome ?? "Sistema"}</span>
                <span className="text-xs text-ardosia-500">{formatoDataHora.format(l.dataHora)}</span>
              </div>
              {l.resumo && <div className="mt-0.5 text-xs text-ardosia-600">{l.resumo}</div>}
              {l.acao === "ALTERAR" && (
                <ul className="mt-1 ml-1 space-y-0.5 text-xs text-ardosia-600">
                  {Object.entries((l.alteracoes ?? {}) as Record<string, [unknown, unknown]>).map(([c, [a, d]]) => (
                    <li key={c}>
                      <span className="font-medium">{rotuloCampo(c)}</span>: {formatarValor(a)} → <span className="text-navy-900">{formatarValor(d)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      )}
    </Cartao>
  );
}
