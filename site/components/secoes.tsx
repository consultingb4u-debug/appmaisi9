import clsx from "clsx";
import { Award, ChevronDown, Clock, CodeXml, Puzzle, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Botao, LinkSeta, Sobretitulo } from "@/components/ui";
import { credenciais, ctaWhatsapp } from "@/conteudo/empresa";

const iconesCredenciais = [Award, Clock, Users, CodeXml, Puzzle];

/** Credenciais da MAIS i9 (+20 anos, +10.000 horas…), em faixa clara ou escura. */
export function Credenciais({ claro = false, className }: { claro?: boolean; className?: string }) {
  return (
    <ul className={clsx("grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5", className)}>
      {credenciais.map((c, i) => {
        const Icone = iconesCredenciais[i % iconesCredenciais.length];
        return (
          <li key={c.destaque} className="flex flex-col items-start gap-3 lg:items-center lg:text-center">
            <Icone aria-hidden className={clsx("size-7", claro ? "text-azul-300" : "text-azul-600")} strokeWidth={1.5} />
            <p className="leading-tight">
              <span className={clsx("block font-display text-xl font-bold sm:text-2xl", claro ? "text-white" : "text-navy-950")}>
                {c.destaque}
              </span>
              <span className={clsx("mt-1 block text-sm", claro ? "text-ardosia-300" : "text-ardosia-600")}>{c.complemento}</span>
            </p>
          </li>
        );
      })}
    </ul>
  );
}

/** Topo das páginas internas: trilha, título e chamadas. */
export function HeroPagina({
  trilha,
  sobretitulo,
  titulo,
  descricao,
  children,
  visual,
}: {
  trilha: { nome: string; caminho: string }[];
  sobretitulo: string;
  titulo: ReactNode;
  descricao: ReactNode;
  children?: ReactNode;
  visual?: ReactNode;
}) {
  return (
    <section className="grade-tecnica relative overflow-hidden bg-navy-950 text-white">
      <div aria-hidden className="pointer-events-none absolute -top-40 right-0 size-[640px] rounded-full bg-azul-500/10 blur-3xl" />
      <div className={clsx("container-site relative py-16 sm:py-20 lg:py-24", visual && "grid items-center gap-14 lg:grid-cols-12")}>
        <div className={clsx(visual ? "lg:col-span-6" : "max-w-3xl")}>
          <nav aria-label="Trilha de navegação" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-ardosia-300">
              {trilha.map((item, i) => (
                <li key={item.caminho} className="flex items-center gap-2">
                  {i > 0 && <span aria-hidden>/</span>}
                  {i === trilha.length - 1 ? (
                    <span aria-current="page" className="text-ardosia-200">
                      {item.nome}
                    </span>
                  ) : (
                    <Link href={item.caminho} className="hover:text-white">
                      {item.nome}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
          <Sobretitulo claro>{sobretitulo}</Sobretitulo>
          <h1 className="mt-5 text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl">{titulo}</h1>
          <div className="mt-6 max-w-2xl text-lg leading-relaxed text-ardosia-200">{descricao}</div>
          {children && <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{children}</div>}
        </div>
        {visual && <div className="lg:col-span-6">{visual}</div>}
      </div>
    </section>
  );
}

export function CtaFinal({
  titulo = "Vamos conversar sobre os desafios da sua operação?",
  descricao = "Conte o que você precisa — sustentação do Protheus, um projeto de evolução ou a gestão do seu armazém. Um especialista da MAIS i9 retorna para entender o seu cenário.",
  rotulo = "Falar com a MAIS i9",
  href = ctaWhatsapp("geral"),
  atalhos = true,
}: {
  titulo?: string;
  descricao?: string;
  rotulo?: string;
  href?: string;
  /** Links secundários para diagnóstico Protheus e demonstração do WMS. */
  atalhos?: boolean;
}) {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="container-site">
        <div className="grade-tecnica relative overflow-hidden rounded-3xl bg-navy-950 px-6 py-14 text-center sm:px-12 lg:py-20">
          <div aria-hidden className="pointer-events-none absolute -bottom-32 left-1/2 h-64 w-[720px] -translate-x-1/2 rounded-full bg-destaque/15 blur-3xl" />
          <h2 className="relative mx-auto max-w-3xl text-3xl leading-tight font-bold text-white sm:text-4xl">{titulo}</h2>
          <p className="relative mx-auto mt-5 max-w-2xl text-lg text-ardosia-200">{descricao}</p>
          <div className="relative mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Botao href={href} tamanho="lg" seta>
              {rotulo}
            </Botao>
          </div>
          {atalhos && (
          <div className="relative mt-8 flex flex-col items-center justify-center gap-x-8 gap-y-3 sm:flex-row">
            <LinkSeta href={ctaWhatsapp("diagnostico")} claro>
              Solicitar diagnóstico Protheus
            </LinkSeta>
            <LinkSeta href={ctaWhatsapp("demonstracaoWms")} claro>
              Agendar demonstração do WMS
            </LinkSeta>
          </div>
          )}
        </div>
      </div>
    </section>
  );
}

const etapasJornada = [
  { titulo: "Entender", texto: "Levantamos processos, ambiente e objetivos para compreender o problema real antes de propor a solução." },
  { titulo: "Planejar", texto: "Definimos escopo, prioridades, responsáveis e indicadores, em um plano acordado com a sua equipe." },
  { titulo: "Implementar", texto: "Executamos com método: parametrização, desenvolvimento, integração, testes e preparação dos usuários." },
  { titulo: "Sustentar", texto: "Garantimos a continuidade da operação com atendimento, correções e acompanhamento de indicadores." },
  { titulo: "Evoluir", texto: "Identificamos oportunidades de melhoria e conduzimos a evolução funcional e tecnológica do ambiente." },
];

/** Jornada Entender → Planejar → Implementar → Sustentar → Evoluir. */
export function Jornada() {
  return (
    <ol className="relative grid gap-10 lg:grid-cols-5 lg:gap-6">
      <span aria-hidden className="absolute top-7 bottom-7 left-7 w-px bg-white/15 lg:top-7 lg:right-[10%] lg:bottom-auto lg:left-[10%] lg:h-px lg:w-auto" />
      {etapasJornada.map((etapa, i) => (
        <li key={etapa.titulo} className="revelar relative flex gap-6 lg:flex-col lg:gap-0 lg:text-center">
          <span
            className={clsx(
              "relative z-10 flex size-14 shrink-0 items-center justify-center rounded-2xl font-display text-lg font-bold ring-1 lg:mx-auto",
              i === etapasJornada.length - 1
                ? "bg-destaque text-navy-950 ring-destaque"
                : "bg-navy-900 text-white ring-white/15",
            )}
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="lg:mt-6">
            <h3 className="text-xl font-semibold text-white">{etapa.titulo}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ardosia-300">{etapa.texto}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function PerguntasFrequentes({ itens }: { itens: { pergunta: string; resposta: string }[] }) {
  return (
    <div className="divide-y divide-ardosia-200 border-y border-ardosia-200">
      {itens.map((item) => (
        <details key={item.pergunta} className="group py-1">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-[17px] font-semibold text-navy-950 [&::-webkit-details-marker]:hidden">
            {item.pergunta}
            <ChevronDown aria-hidden className="size-5 shrink-0 text-ardosia-500 transition-transform group-open:rotate-180" />
          </summary>
          <p className="pb-6 text-[15px] leading-relaxed text-ardosia-600">{item.resposta}</p>
        </details>
      ))}
    </div>
  );
}
