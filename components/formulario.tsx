"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import clsx from "clsx";
import { classeBotao } from "./ui";

export type EstadoAcao = { ok?: boolean; erro?: string; mensagem?: string } | null;

/**
 * Formulário ligado a uma Server Action com retorno { ok, erro, mensagem }.
 * Mostra o erro de validação, desabilita o botão enquanto envia e, se
 * `limparAoSalvar`, zera os campos depois de um envio bem-sucedido.
 */
export function Formulario({
  acao,
  children,
  rotuloEnviar = "Salvar",
  limparAoSalvar = false,
  className,
  acoesExtras,
  somenteLeitura = false,
}: {
  acao: (estado: EstadoAcao, dados: FormData) => Promise<EstadoAcao>;
  children: ReactNode;
  rotuloEnviar?: string;
  limparAoSalvar?: boolean;
  className?: string;
  acoesExtras?: ReactNode;
  /** Exibe os campos bloqueados e sem botão (perfil sem permissão de edição). */
  somenteLeitura?: boolean;
}) {
  const [estado, executar, enviando] = useActionState(acao, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado?.ok && limparAoSalvar) ref.current?.reset();
  }, [estado, limparAoSalvar]);

  return (
    <form ref={ref} action={executar} className={clsx("space-y-4", className)}>
      <fieldset disabled={somenteLeitura} className="space-y-4">
        {children}
      </fieldset>
      <div className={clsx("flex flex-wrap items-center gap-3", somenteLeitura && "hidden")}>
        <button type="submit" disabled={enviando} className={classeBotao("primario")}>
          {enviando ? "Salvando…" : rotuloEnviar}
        </button>
        {acoesExtras}
        {estado?.erro && <span className="text-sm text-critico">{estado.erro}</span>}
        {estado?.ok && estado.mensagem && <span className="text-sm text-ok">{estado.mensagem}</span>}
      </div>
    </form>
  );
}

/** Botão isolado que dispara uma Server Action (ex.: excluir), com confirmação opcional. */
export function BotaoAcao({
  acao,
  children,
  confirmar,
  variante = "perigo",
}: {
  acao: (estado: EstadoAcao, dados: FormData) => Promise<EstadoAcao>;
  children: ReactNode;
  confirmar?: string;
  variante?: "perigo" | "secundario" | "fantasma";
}) {
  const [estado, executar, enviando] = useActionState(acao, null);
  return (
    <form
      action={executar}
      onSubmit={(e) => {
        if (confirmar && !window.confirm(confirmar)) e.preventDefault();
      }}
      className="inline-flex items-center gap-2"
    >
      <button type="submit" disabled={enviando} className={classeBotao(variante, "sm")}>
        {children}
      </button>
      {estado?.erro && <span className="text-xs text-critico">{estado.erro}</span>}
    </form>
  );
}
