"use client";

import clsx from "clsx";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type Aba = { id: string; rotulo: ReactNode; conteudo: ReactNode };

/**
 * Abas acessíveis (padrão WAI-ARIA): setas, Home e End trocam a aba ativa.
 * Sem JavaScript, a primeira aba aparece aberta.
 */
export function Abas({
  abas,
  rotuloLista,
  orientacao = "horizontal",
  classeLista,
  classeAba,
  classeAbaAtiva,
  classeAbaInativa,
  classePainel,
}: {
  abas: Aba[];
  rotuloLista: string;
  orientacao?: "horizontal" | "vertical";
  classeLista?: string;
  /** Classes de cada aba; as variantes ativa/inativa são somadas a elas (strings, pois vêm de Server Components). */
  classeAba?: string;
  classeAbaAtiva?: string;
  classeAbaInativa?: string;
  classePainel?: string;
}) {
  const base = useId().replace(/:/g, "");
  const [ativa, setAtiva] = useState(0);
  const botoes = useRef<(HTMLButtonElement | null)[]>([]);

  function aoTeclar(e: KeyboardEvent<HTMLDivElement>) {
    const proxima = orientacao === "vertical" ? ["ArrowDown", "ArrowRight"] : ["ArrowRight", "ArrowDown"];
    const anterior = orientacao === "vertical" ? ["ArrowUp", "ArrowLeft"] : ["ArrowLeft", "ArrowUp"];
    let i: number | null = null;
    if (proxima.includes(e.key)) i = (ativa + 1) % abas.length;
    else if (anterior.includes(e.key)) i = (ativa - 1 + abas.length) % abas.length;
    else if (e.key === "Home") i = 0;
    else if (e.key === "End") i = abas.length - 1;
    if (i === null) return;
    e.preventDefault();
    setAtiva(i);
    botoes.current[i]?.focus();
  }

  return (
    <>
      <div role="tablist" aria-label={rotuloLista} aria-orientation={orientacao} onKeyDown={aoTeclar} className={classeLista}>
        {abas.map((aba, i) => (
          <button
            key={aba.id}
            ref={(el) => {
              botoes.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${base}-aba-${aba.id}`}
            aria-selected={i === ativa}
            aria-controls={`${base}-painel-${aba.id}`}
            tabIndex={i === ativa ? 0 : -1}
            onClick={() => setAtiva(i)}
            className={clsx("text-left transition-colors", classeAba, i === ativa ? classeAbaAtiva : classeAbaInativa)}
          >
            {aba.rotulo}
          </button>
        ))}
      </div>
      {abas.map((aba, i) => (
        <div
          key={aba.id}
          role="tabpanel"
          id={`${base}-painel-${aba.id}`}
          aria-labelledby={`${base}-aba-${aba.id}`}
          hidden={i !== ativa}
          tabIndex={0}
          className={classePainel}
        >
          {aba.conteudo}
        </div>
      ))}
    </>
  );
}
