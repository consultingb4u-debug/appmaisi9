import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { CardArtigo } from "@/components/conteudos";
import { Credenciais, CtaFinal, Jornada, SecaoClientesCases } from "@/components/secoes";
import { Botao, CabecalhoSecao, CaixaIcone, LinkSeta, Secao, Sobretitulo } from "@/components/ui";
import { HeroIntegracao } from "@/components/visuais/hero-integracao";
import { cases } from "@/conteudo/cases";
import { combinacoesFrentes, diferenciaisInicio, frentes } from "@/conteudo/inicio";
import { artigosOrdenados } from "@/conteudo/insights";

export default function Inicio() {
  const recentes = artigosOrdenados().slice(0, 3);
  const caseIntegracao = cases.find((c) => c.publicado && c.tipo === "wms");

  return (
    <>
      {/* Hero: a empresa e as duas frentes, com o mesmo peso */}
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
            <p className="mt-8 flex max-w-xl gap-3 border-t border-white/10 pt-6 text-[15px] leading-relaxed text-ardosia-300">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-[1px] bg-destaque" />
              Duas frentes independentes: contrate a consultoria, o MAIS i9 WMS ou as duas, conforme a necessidade da sua
              empresa.
            </p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            {frentes.map((f) => (
              <li key={f.id}>
                <Link
                  href={f.saibaMais.href}
                  className="group flex h-full flex-col rounded-2xl bg-white/[0.05] p-6 ring-1 ring-white/12 transition hover:bg-white/[0.08] hover:ring-white/30 sm:p-7"
                >
                  <div className="flex items-center gap-3">
                    <CaixaIcone claro>
                      <f.icone className="size-5" strokeWidth={1.75} />
                    </CaixaIcone>
                    <span className="text-xs font-semibold tracking-[0.14em] text-azul-300 uppercase">{f.rotulo}</span>
                  </div>
                  <h2 className="mt-5 text-xl font-bold text-white">{f.nome}</h2>
                  <p className="mt-2 text-[15px] leading-relaxed text-ardosia-200">{f.resumo}</p>
                  <ul className="mt-5 flex flex-wrap gap-1.5">
                    {f.destaques.map((d) => (
                      <li key={d} className="rounded-full bg-white/8 px-2.5 py-1 text-xs text-ardosia-100">
                        {d}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold text-white">
                    {f.saibaMais.rotulo}
                    <ArrowRight aria-hidden className="size-4 text-destaque transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* As duas frentes, contratadas de forma independente */}
      <Secao id="solucoes">
        <CabecalhoSecao
          centro
          sobretitulo="Nossas soluções"
          titulo="Duas frentes independentes. Você contrata o que a sua empresa precisa."
          descricao="A consultoria atende ambientes TOTVS Protheus, com ou sem o MAIS i9 WMS. O MAIS i9 WMS é um produto próprio, contratado à parte, com integração padrão ao Protheus e APIs para outros ERPs."
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {frentes.map((f) => (
            <article
              key={f.id}
              className="revelar flex flex-col overflow-hidden rounded-3xl border border-ardosia-200 bg-white shadow-sm shadow-navy-950/5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ardosia-100 bg-fundo px-8 py-5 sm:px-10">
                <div className="flex items-center gap-3">
                  <CaixaIcone>
                    <f.icone className="size-5" strokeWidth={1.75} />
                  </CaixaIcone>
                  <p className="text-xs font-semibold tracking-[0.14em] text-azul-600 uppercase">{f.rotulo}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-navy-900 ring-1 ring-ardosia-200">
                  Contratação independente
                </span>
              </div>
              <div className="flex flex-1 flex-col p-8 sm:p-10">
                <h3 className="text-2xl font-bold text-navy-950 sm:text-[1.75rem]">{f.nome}</h3>
                <dl className="mt-6 space-y-6">
                  <div>
                    <dt className="text-sm font-semibold text-navy-900">Para quem é</dt>
                    <dd className="mt-1.5 text-[16px] leading-relaxed text-ardosia-600">{f.paraQuem}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-semibold text-navy-900">O que inclui</dt>
                    <dd className="mt-2">
                      <ul className="space-y-2.5">
                        {f.inclui.map((i) => (
                          <li key={i} className="flex gap-3 text-[15px] text-ardosia-700">
                            <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-azul-600" strokeWidth={2.5} />
                            {i}
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-semibold text-navy-900">Como contratar</dt>
                    <dd className="mt-1.5 text-[15px] leading-relaxed text-ardosia-600">{f.comoContratar}</dd>
                  </div>
                </dl>
                <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-4 pt-9">
                  <Botao href={f.cta.href} variante="escuro" seta>
                    {f.cta.rotulo}
                  </Botao>
                  <LinkSeta href={f.saibaMais.href}>{f.saibaMais.rotulo}</LinkSeta>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Secao>

      {/* Onde as frentes se encontram */}
      <Secao fundo="escuro" id="integracao">
        <div className="grid items-center gap-14 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <CabecalhoSecao
              claro
              sobretitulo="Especialista Protheus com WMS próprio"
              titulo="Independentes na contratação, integradas quando você precisa"
              descricao="Como especialista em TOTVS Protheus, a MAIS i9 desenvolveu o MAIS i9 WMS com um pacote padrão de integração ao ERP. Cada frente funciona por conta própria — e, quando a sua empresa usa as duas, conta com um único parceiro que conhece o ERP e o armazém."
            />
            <ul className="mt-10 space-y-5">
              {combinacoesFrentes.map(({ titulo, texto, icone: Icone }) => (
                <li key={titulo} className="flex gap-4">
                  <CaixaIcone claro>
                    <Icone className="size-5" strokeWidth={1.75} />
                  </CaixaIcone>
                  <div>
                    <p className="font-semibold text-white">{titulo}</p>
                    <p className="mt-1 text-[15px] leading-relaxed text-ardosia-300">{texto}</p>
                  </div>
                </li>
              ))}
            </ul>
            {caseIntegracao && caseIntegracao.resultados[0] && (
              <p className="mt-10 inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-white/[0.05] px-4 py-3 text-sm text-ardosia-200 ring-1 ring-white/10">
                <span className="font-semibold text-white">Case:</span> {caseIntegracao.titulo}
                <span className="rounded-md bg-destaque px-2 py-0.5 font-display font-bold text-navy-950">
                  {caseIntegracao.resultados[0]}
                </span>
              </p>
            )}
          </div>
          <div className="hidden sm:block lg:col-span-6">
            <HeroIntegracao />
          </div>
        </div>
      </Secao>

      {/* Por que escolher */}
      <Secao fundo="cinza" id="por-que">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <CabecalhoSecao
                sobretitulo="Por que a MAIS i9"
                titulo="Uma parceira especializada, não apenas uma fornecedora"
                descricao="Combinamos conhecimento técnico, visão de processos e tecnologia própria para cuidar do que sustenta a sua operação."
              />
              <Botao href="/sobre" variante="contorno" seta className="mt-8">
                Conhecer a MAIS i9
              </Botao>
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
        <div className="mt-16 border-t border-ardosia-200 pt-12">
          <Credenciais />
        </div>
      </Secao>

      {/* Como geramos valor */}
      <Secao fundo="escuro" id="como-geramos-valor">
        <CabecalhoSecao
          claro
          centro
          sobretitulo="Como geramos valor"
          titulo="Do entendimento do problema à evolução contínua"
          descricao="Uma jornada que vale para um projeto, para a sustentação do ERP e para a implantação do WMS."
        />
        <div className="mt-16">
          <Jornada />
        </div>
      </Secao>

      <SecaoClientesCases />

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
