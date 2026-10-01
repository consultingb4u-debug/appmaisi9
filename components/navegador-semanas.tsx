import Link from "next/link";
import clsx from "clsx";
import { somarDias } from "@/lib/domain/datas";
import { rotuloSemana, semanaDe, semanaPorId, semanasEntre, type SemanaIso } from "@/lib/domain/semanas";

/** Lê ?de=2026-W40&n=8 e devolve as semanas da janela (padrão: semana atual, 8 semanas). */
export function janelaDeSemanas(de?: string, n?: string): SemanaIso[] {
  const inicio = (de && semanaPorId(de)) || semanaDe(new Date());
  const qtd = [4, 8, 12, 16].includes(Number(n)) ? Number(n) : 8;
  return semanasEntre(inicio.inicio, somarDias(inicio.inicio, 7 * qtd - 1));
}

/** Navegação ◀ hoje ▶ e tamanho da janela, preservando os demais filtros da URL. */
export function NavegadorSemanas({ base, params, semanas }: { base: string; params: Record<string, string | undefined>; semanas: SemanaIso[] }) {
  const n = semanas.length;
  const url = (extra: Record<string, string | undefined>) => {
    const qs = new URLSearchParams(Object.entries({ ...params, ...extra }).filter(([, v]) => v) as [string, string][]);
    return `${base}?${qs}`;
  };
  const passo = Math.max(1, Math.floor(n / 2));
  const anterior = semanaDe(somarDias(semanas[0].inicio, -7 * passo)).id;
  const proxima = semanaDe(somarDias(semanas[0].inicio, 7 * passo)).id;
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <div className="flex items-center rounded-md border border-ardosia-200 bg-white">
        <Link href={url({ de: anterior })} className="px-2.5 py-1.5 text-ardosia-600 hover:text-navy-900" aria-label="Semanas anteriores">
          ◀
        </Link>
        <Link href={url({ de: undefined })} className="border-x border-ardosia-200 px-3 py-1.5 text-ardosia-600 hover:text-navy-900">
          {rotuloSemana(semanas[0])} – {rotuloSemana(semanas.at(-1)!)}
        </Link>
        <Link href={url({ de: proxima })} className="px-2.5 py-1.5 text-ardosia-600 hover:text-navy-900" aria-label="Próximas semanas">
          ▶
        </Link>
      </div>
      <div className="flex rounded-md border border-ardosia-200 bg-white p-0.5">
        {[4, 8, 12, 16].map((q) => (
          <Link key={q} href={url({ n: String(q) })} className={clsx("rounded px-2 py-1 text-xs", q === n ? "bg-navy-900 text-white" : "text-ardosia-600")}>
            {q} sem.
          </Link>
        ))}
      </div>
    </div>
  );
}
