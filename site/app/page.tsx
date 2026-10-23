import { ArrowDown, ArrowRight } from "lucide-react";
import Link from "next/link";
import { CardArtigo } from "@/components/conteudos";
import { Credenciais, CtaFinal, Jornada } from "@/components/secoes";
import { Botao, CabecalhoSecao, CaixaIcone, LinkSeta, ListaCheck, Secao, Sobretitulo } from "@/components/ui";
import { PainelGovernanca } from "@/components/visuais/painel-governanca";
import { NotaIlustracao, VitrineHero } from "@/components/wms";
import { consultoriaInicio, diferenciaisInicio, ofertasInicio, quemSomosInicio, wmsInicio } from "@/conteudo/inicio";
import { artigosOrdenados } from "@/conteudo/insights";

export default function Inicio() {
  const recentes = artigosOrdenados().slice(0, 3);

  return (
    <>
      {/* Hero institucional, com acesso direto à consultoria e ao WMS */}
      <section className="grade-tecnica relative overflow-hidden bg-navy-950 text-white">
        <div aria-hidden className="pointer-events-none absolute -top-48 -right-24 size-[720px] rounded-full bg-azul-500/12 blur-3xl" />
        <div className="container-site relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-12 lg:gap-14 lg:py-24">
          <div className="lg:col-span-5">
            <Sobretitulo claro>Tecnologia, consultoria e soluções para gestão empresarial</Sobretitulo>
            <h1 className="mt-6 text-[2.5rem] leading-[1.05] font-bold tracking-tight sm:text-5xl lg:text-[3.25rem]">
              Tecnologia e expertise para transformar a gestão do seu negócio.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ardosia-200 sm:text-xl">
              Consultoria especializada em TOTVS Protheus e soluções próprias para tornar sua operação mais eficiente,
              integrada e preparada para crescer.
            </p>
            <p className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-ardosia-300">
              Conheça nossos serviços e produtos
              <ArrowDown aria-hidden className="size-4 text-destaque lg:hidden" />
              <ArrowRight aria-hidden className="hidden size-4 text-destaque lg:block" />
            </p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            {ofertasInicio.map((o) => (
              <li key={o.id}>
                <Link
                  href={o.cta.href}
                  className="group flex h-full flex-col rounded-2xl bg-white/[0.05] p-6 ring-1 ring-white/12 transition hover:bg-white/[0.08] hover:ring-white/30 sm:p-7"
                >
                  <div className="flex items-center gap-3">
                    <CaixaIcone claro>
                      <o.icone className="size-5" strokeWidth={1.75} />
                    </CaixaIcone>
                    <span className="text-xs font-semibold tracking-[0.14em] text-azul-300 uppercase">{o.rotulo}</span>
                  </div>
                  <p className="mt-5 text-xl font-bold text-white">{o.nome}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-ardosia-200">{o.chamada}</p>
                  <ul className="mt-5 flex flex-wrap gap-1.5">
                    {o.destaques.map((d) => (
                      <li key={d} className="rounded-full bg-white/8 px-2.5 py-1 text-xs text-ardosia-100">
                        {d}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold text-white">
                    {o.cta.rotulo}
                    <ArrowRight aria-hidden className="size-4 text-destaque transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Quem somos */}
      <Secao id="quem-somos">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <CabecalhoSecao sobretitulo="Quem somos" titulo={quemSomosInicio.titulo} />
          </div>
          <div className="lg:col-span-7 lg:pt-9">
            {quemSomosInicio.paragrafos.map((p) => (
              <p key={p} className="mt-4 text-lg leading-relaxed text-ardosia-600 first:mt-0">
                {p}
              </p>
            ))}
            <LinkSeta href="/sobre" className="mt-8">
              Conhecer a MAIS i9
            </LinkSeta>
          </div>
        </div>
        <div className="mt-16 border-t border-ardosia-200 pt-12">
          <Credenciais />
        </div>
      </Secao>

      {/* Serviço: MAIS i9 Consultoria Protheus */}
      <Secao fundo="cinza" id={consultoriaInicio.id} aria-labelledby="titulo-consultoria">
        <div className="grid items-center gap-14 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-6">
            <Sobretitulo>
              {consultoriaInicio.rotulo} · {consultoriaInicio.nome}
            </Sobretitulo>
            <h2 id="titulo-consultoria" className="mt-5 text-3xl leading-tight font-bold text-navy-950 sm:text-4xl">
              {consultoriaInicio.titulo}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ardosia-600">{consultoriaInicio.texto}</p>
            <ListaCheck itens={consultoriaInicio.itens} className="mt-8" />
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Botao href={consultoriaInicio.cta.href} seta>
                {consultoriaInicio.cta.rotulo}
              </Botao>
              <LinkSeta href={consultoriaInicio.ctaSecundario.href}>{consultoriaInicio.ctaSecundario.rotulo}</LinkSeta>
            </div>
          </div>
          <div className="min-w-0 lg:col-span-6">
            <PainelGovernanca />
          </div>
        </div>
      </Secao>

      {/* Produto: MAIS i9 WMS */}
      <Secao fundo="escuro" id={wmsInicio.id} aria-labelledby="titulo-wms">
        <div className="grid items-center gap-14 lg:grid-cols-12">
          <div className="min-w-0 lg:order-2 lg:col-span-5">
            <Sobretitulo claro>
              {wmsInicio.rotulo} · {wmsInicio.nome}
            </Sobretitulo>
            <h2 id="titulo-wms" className="mt-5 text-3xl leading-tight font-bold text-white sm:text-4xl">
              {wmsInicio.titulo}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ardosia-200">{wmsInicio.texto}</p>
            <ListaCheck itens={wmsInicio.itens} claro className="mt-8" />
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Botao href={wmsInicio.cta.href} seta>
                {wmsInicio.cta.rotulo}
              </Botao>
              <LinkSeta href={wmsInicio.ctaSecundario.href} claro>
                {wmsInicio.ctaSecundario.rotulo}
              </LinkSeta>
            </div>
          </div>
          <div className="min-w-0 lg:order-1 lg:col-span-7">
            <VitrineHero />
            <div className="mt-4">
              <NotaIlustracao claro telas={["dashboard", "appOperador"]} />
            </div>
          </div>
        </div>
      </Secao>

      {/* Por que escolher */}
      <Secao id="por-que">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <CabecalhoSecao
                sobretitulo="Por que a MAIS i9"
                titulo="Uma parceira especializada, não apenas uma fornecedora"
                descricao="Conhecimento técnico, visão de processos e tecnologia própria para cuidar do que sustenta a sua operação."
              />
            </div>
          </div>
          <ul className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:col-span-8">
            {diferenciaisInicio.map(({ titulo, texto, icone: Icone }) => (
              <li key={titulo} className="revelar flex gap-5">
                <CaixaIcone>
                  <Icone className="size-5" strokeWidth={1.75} />
                </CaixaIcone>
                <div>
                  <h3 className="text-lg font-semibold text-navy-950">{titulo}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-ardosia-600">{texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Secao>

      {/* Como geramos valor */}
      <Secao fundo="escuro" id="como-geramos-valor">
        <CabecalhoSecao
          claro
          centro
          sobretitulo="Como geramos valor"
          titulo="Do entendimento do problema à evolução contínua"
          descricao="Nossa forma de trabalhar, do primeiro diagnóstico ao acompanhamento contínuo."
        />
        <div className="mt-16">
          <Jornada />
        </div>
      </Secao>

      {/* Conteúdos */}
      <Secao id="conteudos">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <CabecalhoSecao
            sobretitulo="Conteúdos"
            titulo="Insights sobre ERP, operações e tecnologia"
            descricao="Artigos para gestores de TI, operações e logística."
          />
          <LinkSeta href="/conteudos" className="shrink-0">
            Ver todos os conteúdos
          </LinkSeta>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {recentes.map((a) => (
            <CardArtigo key={a.slug} artigo={a} />
          ))}
        </div>
      </Secao>

      <CtaFinal />
    </>
  );
}
