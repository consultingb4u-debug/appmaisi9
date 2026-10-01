"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import clsx from "clsx";
import { atualizarCampoAtividade } from "@/app/(app)/projetos/cronograma-acoes";

type Campo = "percentual" | "status" | "inicio" | "fim";

/** Campo editável direto na tabela do cronograma; salva ao mudar/sair e recarrega os cálculos. */
export function CampoInline({
  atividadeId,
  campo,
  valor,
  opcoes,
  className,
}: {
  atividadeId: string;
  campo: Campo;
  valor: string;
  opcoes?: [string, string][];
  className?: string;
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();

  const salvar = (novo: string) => {
    if (novo === valor || novo === "") return;
    setErro(null);
    iniciar(async () => {
      const r = await atualizarCampoAtividade(atividadeId, campo, novo);
      if (!r.ok) setErro(r.erro ?? "Erro ao salvar.");
      router.refresh();
    });
  };

  const base = clsx(
    "rounded border bg-transparent px-1 py-0.5 text-xs outline-none hover:border-ardosia-200 focus:border-navy-700 focus:bg-white",
    erro ? "border-critico" : salvando ? "border-alerta" : "border-transparent",
    className,
  );

  if (opcoes)
    return (
      <select key={valor} defaultValue={valor} onChange={(e) => salvar(e.currentTarget.value)} className={base} title={erro ?? undefined} aria-label={campo}>
        {opcoes.map(([v, r]) => (
          <option key={v} value={v}>
            {r}
          </option>
        ))}
      </select>
    );

  return (
    <input
      key={valor}
      type={campo === "percentual" ? "number" : "date"}
      min={campo === "percentual" ? 0 : undefined}
      max={campo === "percentual" ? 100 : undefined}
      defaultValue={valor}
      onBlur={(e) => salvar(e.currentTarget.value)}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      className={clsx(base, campo === "percentual" ? "w-12 text-right tabular-nums" : "w-[6.9rem] tabular-nums")}
      title={erro ?? undefined}
      aria-label={campo}
    />
  );
}
