import Link from "next/link";
import type { ReactNode } from "react";

/** Cabeçalho de coluna que ordena a lista via query string (?ordem=campo&dir=asc|desc). */
export function ThOrdenavel({ campo, rotulo, params, base, className }: { campo: string; rotulo: ReactNode; params: Record<string, string | undefined>; base: string; className?: string }) {
  const ativo = params.ordem === campo;
  const dir = ativo && params.dir !== "desc" ? "desc" : "asc";
  const qs = new URLSearchParams(Object.entries({ ...params, ordem: campo, dir }).filter(([, v]) => v) as [string, string][]);
  return (
    <th className={className}>
      <Link href={`${base}?${qs}`} className="inline-flex items-center gap-1 hover:text-navy-900">
        {rotulo}
        <span className="text-[10px]">{ativo ? (params.dir === "desc" ? "▼" : "▲") : ""}</span>
      </Link>
    </th>
  );
}
