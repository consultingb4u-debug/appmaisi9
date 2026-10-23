"use client";

import { CircleCheck, LoaderCircle, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { textoComunicacoes, textoConsentimento } from "@/conteudo/formularios";
import { validarLead, type TipoLead } from "@/lib/leads/esquemas";
import { enderecoEnvio, estadoInicial, lerResposta, type EstadoFormulario } from "@/lib/leads/estado";
import { CampoCaixa, ContextoFormulario } from "./campos";
import { lerOrigemNavegador } from "./origem";

type Props = {
  tipo: TipoLead;
  rotuloEnviar: string;
  /** Texto exibido após o envio bem-sucedido (próximos passos). */
  aposEnvio: string;
  /** Contato alternativo exibido se o envio falhar ou não estiver configurado. */
  alternativa?: ReactNode;
  children: ReactNode;
};

export function FormularioLead(props: Props) {
  // Trocar a chave remonta o formulário vazio ("Enviar outra mensagem").
  const [rodada, setRodada] = useState(0);
  return <Formulario key={rodada} {...props} aoReiniciar={() => setRodada((n) => n + 1)} />;
}

function Formulario({ tipo, rotuloEnviar, aposEnvio, alternativa, children, aoReiniciar }: Props & { aoReiniciar: () => void }) {
  const idForm = useId().replace(/:/g, "");
  const [estado, setEstado] = useState<EstadoFormulario>(estadoInicial);
  const [pendente, setPendente] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const aviso = useRef<HTMLDivElement>(null);

  // Início do preenchimento (armadilha de tempo contra robôs).
  const inicio = useRef(0);
  useEffect(() => {
    inicio.current = Date.now();
  }, []);

  // Leva o foco ao primeiro campo com erro, ou à mensagem de resultado.
  useEffect(() => {
    if (estado.status === "invalido") form.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
    else if (estado.status !== "inicial") aviso.current?.focus();
  }, [estado]);

  async function aoEnviar(e: FormEvent<HTMLFormElement>) {
    // Envia por fetch, preservando o que foi digitado se houver erro. Sem JavaScript,
    // o formulário vai direto para o PHP (atributos action/method).
    e.preventDefault();
    if (pendente) return;
    const dados = new FormData(e.currentTarget);
    const origem = lerOrigemNavegador();
    dados.set("inicio", String(inicio.current));
    dados.set("origemPagina", window.location.pathname);
    dados.set("origemReferencia", origem.referencia);
    for (const [k, v] of Object.entries(origem.utm)) dados.set(k, v);

    // Mesmas regras do servidor, para apontar os erros sem esperar a resposta.
    const validacao = validarLead(tipo, Object.fromEntries(dados.entries()));
    if (!validacao.ok) {
      setEstado({ status: "invalido", erros: validacao.erros });
      return;
    }

    setPendente(true);
    try {
      const resposta = await fetch(enderecoEnvio, { method: "POST", body: dados, headers: { Accept: "application/json" } });
      const ehJson = resposta.headers.get("content-type")?.includes("application/json");
      setEstado(ehJson ? lerResposta(await resposta.json()) : { status: "nao-configurado" });
    } catch {
      setEstado({ status: "falha", mensagem: "Não conseguimos enviar sua mensagem. Verifique sua conexão e tente novamente." });
    } finally {
      setPendente(false);
    }
  }

  if (estado.status === "enviado") {
    return (
      <div ref={aviso} tabIndex={-1} role="status" className="rounded-2xl border border-ok/25 bg-ok/5 p-8 outline-none">
        <CircleCheck aria-hidden className="size-10 text-ok" />
        <h3 className="mt-4 text-xl font-semibold text-navy-950">Recebemos sua solicitação</h3>
        <p className="mt-2 text-ardosia-600">{aposEnvio}</p>
        <p className="mt-4 text-sm text-ardosia-500">
          Protocolo: <strong className="font-mono text-navy-900">{estado.protocolo}</strong>
        </p>
        <button type="button" onClick={aoReiniciar} className="mt-6 text-sm font-semibold text-azul-600 hover:text-navy-900">
          Enviar outra mensagem
        </button>
      </div>
    );
  }

  return (
    <ContextoFormulario value={{ idForm, erros: estado.status === "invalido" ? estado.erros : {} }}>
      <form ref={form} action={enderecoEnvio} method="post" onSubmit={aoEnviar} noValidate className="space-y-5">
        <input type="hidden" name="tipo" value={tipo} />
        {/* Armadilha para robôs: invisível para pessoas e leitores de tela. */}
        <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Não preencha este campo
            <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>

        {children}

        <div className="space-y-3 pt-1">
          <CampoCaixa nome="consentimento">
            {textoConsentimento.inicio}{" "}
            <Link href="/politica-de-privacidade" target="_blank" className="font-medium text-azul-600 underline underline-offset-2">
              {textoConsentimento.link}
            </Link>
            .
          </CampoCaixa>
          <CampoCaixa nome="aceitaComunicacoes">{textoComunicacoes}</CampoCaixa>
        </div>

        {estado.status === "invalido" && (
          <p role="alert" className="text-sm font-medium text-critico">
            Revise os campos destacados.
          </p>
        )}

        {(estado.status === "falha" || estado.status === "nao-configurado") && (
          <div ref={aviso} tabIndex={-1} role="alert" className="flex gap-3 rounded-xl border border-alerta/40 bg-alerta/10 p-4 text-sm outline-none">
            <TriangleAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-[#8a6a00]" />
            <div className="space-y-1.5 text-navy-900">
              {estado.status === "falha" ? (
                <p className="font-medium">{estado.mensagem}</p>
              ) : (
                <>
                  <p className="font-medium">
                    O envio de formulários não está disponível neste endereço. Sua mensagem <strong>não foi enviada</strong>.
                  </p>
                  {process.env.NODE_ENV === "development" && (
                    <p className="text-ardosia-600">
                      O envio usa o contato.php: teste com <code>npm run build</code> e <code>php -S localhost:8080 -t out</code>.
                    </p>
                  )}
                </>
              )}
              {alternativa && <div className="text-ardosia-600">{alternativa}</div>}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={pendente}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-destaque px-6 py-3.5 text-[15px] font-semibold text-navy-950 shadow-sm shadow-destaque/20 transition-colors hover:bg-[#f59b45] disabled:cursor-wait disabled:opacity-70"
        >
          {pendente && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
          {pendente ? "Enviando…" : rotuloEnviar}
        </button>
        <p className="text-center text-xs text-ardosia-500">Seus dados são usados apenas para responder a esta solicitação.</p>
      </form>
    </ContextoFormulario>
  );
}
