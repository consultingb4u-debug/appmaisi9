import { db } from "@/lib/db";
import { Cartao, Selo, Vazio } from "@/components/ui";

const ACOES = { CRIAR: ["Criou", "ok"], ALTERAR: ["Alterou", "livre"], EXCLUIR: ["Excluiu", "critico"], IMPORTAR: ["Importou", "destaque"], PUBLICAR: ["Publicou", "navy"] } as const;

export function rotuloCampo(campo: string): string {
  return campo.replace(/Id$/, "").replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

export function formatarValor(v: unknown): string {
  if (v === null || v === undefined || v === "") return "vazio";
  if (typeof v === "boolean") return v ? "sim" : "não";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/.test(v)) {
    const [a, m, d] = v.slice(0, 10).split("-");
    return `${d}/${m}/${a}`;
  }
  return String(v);
}

export const formatoDataHora = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

/** Histórico de alterações de um registro (auditoria). */
export async function HistoricoEntidade({ entidade, entidadeId }: { entidade: string; entidadeId: string }) {
  const linhas = await db.auditoria.findMany({
    where: { entidade, entidadeId },
    orderBy: { dataHora: "desc" },
    take: 30,
    include: { usuario: { select: { nome: true } } },
  });
  return (
    <Cartao titulo="Histórico">
      {linhas.length === 0 ? (
        <Vazio>Sem alterações registradas.</Vazio>
      ) : (
        <ol className="space-y-3">
          {linhas.map((l) => {
            const [rotulo, tom] = ACOES[l.acao];
            const alteracoes = (l.alteracoes ?? {}) as Record<string, [unknown, unknown]>;
            return (
              <li key={l.id} className="text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Selo tom={tom}>{rotulo}</Selo>
                  <span className="font-medium">{l.usuario?.nome ?? "Sistema"}</span>
                  <span className="text-xs text-ardosia-500">{formatoDataHora.format(l.dataHora)}</span>
                </div>
                {l.acao === "ALTERAR" && (
                  <ul className="mt-1 ml-1 space-y-0.5 text-xs text-ardosia-600">
                    {Object.entries(alteracoes).map(([campo, [a, d]]) => (
                      <li key={campo}>
                        <span className="font-medium">{rotuloCampo(campo)}</span>: {formatarValor(a)} → <span className="text-navy-900">{formatarValor(d)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Cartao>
  );
}
