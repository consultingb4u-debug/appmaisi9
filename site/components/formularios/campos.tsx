"use client";

import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { createContext, Suspense, useCallback, useContext, useEffect, useRef, type ReactNode } from "react";

type ContextoCampos = { idForm: string; erros: Record<string, string> };

export const ContextoFormulario = createContext<ContextoCampos>({ idForm: "form", erros: {} });

function useCampo(nome: string) {
  const { idForm, erros } = useContext(ContextoFormulario);
  const id = `${idForm}-${nome}`;
  const erro = erros[nome];
  return {
    id,
    erro,
    attrs: {
      id,
      name: nome,
      "aria-invalid": erro ? true : undefined,
      "aria-describedby": erro ? `${id}-erro` : undefined,
    },
  };
}

function Rotulo({ id, rotulo, opcional }: { id: string; rotulo: string; opcional?: boolean }) {
  return (
    <label htmlFor={id} className="rotulo">
      {rotulo}
      {opcional && <span className="ml-1 font-normal text-ardosia-500">(opcional)</span>}
    </label>
  );
}

function Erro({ id, erro }: { id: string; erro?: string }) {
  if (!erro) return null;
  return (
    <p id={`${id}-erro`} className="mt-1.5 text-sm text-critico">
      {erro}
    </p>
  );
}

export function Campo({
  nome,
  rotulo,
  tipo = "text",
  opcional,
  autoComplete,
  placeholder,
  className,
}: {
  nome: string;
  rotulo: string;
  tipo?: "text" | "email" | "tel";
  opcional?: boolean;
  autoComplete?: string;
  placeholder?: string;
  className?: string;
}) {
  const { id, erro, attrs } = useCampo(nome);
  return (
    <div className={className}>
      <Rotulo id={id} rotulo={rotulo} opcional={opcional} />
      <input
        {...attrs}
        type={tipo}
        required={!opcional}
        autoComplete={autoComplete}
        placeholder={placeholder}
        inputMode={tipo === "tel" ? "tel" : undefined}
        maxLength={tipo === "tel" ? 30 : 160}
        className="campo"
      />
      <Erro id={id} erro={erro} />
    </div>
  );
}

export function CampoTexto({
  nome,
  rotulo,
  opcional,
  placeholder,
  linhas = 4,
  className,
}: {
  nome: string;
  rotulo: string;
  opcional?: boolean;
  placeholder?: string;
  linhas?: number;
  className?: string;
}) {
  const { id, erro, attrs } = useCampo(nome);
  return (
    <div className={className}>
      <Rotulo id={id} rotulo={rotulo} opcional={opcional} />
      <textarea {...attrs} required={!opcional} rows={linhas} maxLength={3000} placeholder={placeholder} className="campo resize-y" />
      <Erro id={id} erro={erro} />
    </div>
  );
}

type Opcoes = { valor: string; rotulo: string }[];

/** Lê a opção indicada no endereço (ex.: ?servico=diagnostico), inclusive em navegações na mesma página. */
function PreSelecaoUrl({ parametro, opcoes, aoAplicar }: { parametro: string; opcoes: Opcoes; aoAplicar: (valor: string) => void }) {
  const valor = useSearchParams().get(parametro);
  useEffect(() => {
    if (valor && opcoes.some((o) => o.valor === valor)) aoAplicar(valor);
  }, [valor, opcoes, aoAplicar]);
  return null;
}

/**
 * Lista de opções. `parametroUrl` pré-seleciona a opção vinda do endereço; a leitura
 * fica num Suspense próprio para a página continuar estática.
 */
export function CampoSelecao({
  nome,
  rotulo,
  opcoes,
  parametroUrl,
  aoMudar,
  className,
}: {
  nome: string;
  rotulo: string;
  opcoes: Opcoes;
  parametroUrl?: string;
  aoMudar?: (valor: string) => void;
  className?: string;
}) {
  const { id, erro, attrs } = useCampo(nome);
  const ref = useRef<HTMLSelectElement>(null);
  const aplicar = useCallback(
    (valor: string) => {
      if (ref.current) ref.current.value = valor;
      aoMudar?.(valor);
    },
    [aoMudar],
  );

  return (
    <div className={className}>
      <Rotulo id={id} rotulo={rotulo} />
      <div className="relative">
        <select
          {...attrs}
          ref={ref}
          required
          defaultValue=""
          onChange={(e) => aoMudar?.(e.target.value)}
          className="campo appearance-none pr-10"
        >
          <option value="" disabled>
            Selecione
          </option>
          {opcoes.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ardosia-500" />
      </div>
      {parametroUrl && (
        <Suspense fallback={null}>
          <PreSelecaoUrl parametro={parametroUrl} opcoes={opcoes} aoAplicar={aplicar} />
        </Suspense>
      )}
      <Erro id={id} erro={erro} />
    </div>
  );
}

export function CampoCaixa({ nome, children, className }: { nome: string; children: ReactNode; className?: string }) {
  const { id, erro, attrs } = useCampo(nome);
  return (
    <div className={className}>
      <div className="flex gap-3">
        <input
          {...attrs}
          type="checkbox"
          className={clsx(
            "mt-0.5 size-4.5 shrink-0 cursor-pointer rounded border-ardosia-300 accent-navy-800",
            erro && "outline-2 outline-offset-2 outline-critico",
          )}
        />
        <label htmlFor={id} className="cursor-pointer text-sm leading-relaxed text-ardosia-600">
          {children}
        </label>
      </div>
      <Erro id={id} erro={erro} />
    </div>
  );
}
