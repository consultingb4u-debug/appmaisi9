import type { LucideIcon } from "lucide-react";
import { BadgeCheck, Building2, Cpu, Handshake, Lightbulb, Target, Workflow } from "lucide-react";
import { CardArtigo } from "@/components/conteudos";
import { CtaFinal, Jornada, SecaoClientesCases } from "@/components/secoes";
import { Botao, CabecalhoSecao, CaixaIcone, LinkSeta, ListaCheck, Secao, Sobretitulo } from "@/components/ui";
import { HeroIntegracao } from "@/components/visuais/hero-integracao";
import { artigosOrdenados } from "@/conteudo/insights";

const diferenciais: { titulo: string; texto: string; icone: LucideIcon }[] = [
  {
    titulo: "Especialização",
    texto: "Foco em TOTVS Protheus e em gestão de armazéns — as frentes em que concentramos conhecimento e investimento.",
    icone: Target,
  },
  {
    titulo: "Experiência em ambientes empresariais",
    texto: "Atuação em operações reais, com rotinas críticas, várias áreas envolvidas e necessidade de continuidade.",
    icone: Building2,
  },
  {
    titulo: "Conhecimento técnico e funcional",
    texto: "Domínio da parametrização e do desenvolvimento, aliado ao entendimento de como as áreas usam o ERP.",
    icone: Cpu,
  },
  {
    titulo: "Visão de processos",
    texto: "Antes de configurar ou desenvolver, entendemos o processo de negócio que a tecnologia precisa sustentar.",
    icone: Workflow,
  },
  {
    titulo: "Compromisso com resultados",
    texto: "Prioridades acordadas, indicadores de acompanhamento e transparência sobre prazos e riscos.",
    icone: BadgeCheck,
  },
  {
    titulo: "Tecnologia própria",
    texto: "O MAIS i9 WMS é desenvolvido e evoluído pela MAIS i9, com conhecimento direto do produto e da integração.",
    icone: Lightbulb,
  },
  {
    titulo: "Atendimento próximo",
    texto: "Relacionamento direto com os especialistas que conhecem o seu ambiente e a sua operação.",
    icone: Handshake,
  },
];

export default function Inicio() {
  const recentes = artigosOrdenados().slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="grade-tecnica relative overflow-hidden bg-navy-950 text-white">
        <div aria-hidden className="pointer-events-none absolute -top-48 -right-24 size-[720px] rounded-full bg-azul-500/12 blur-3xl" />
        <div className="container-site relative grid items-center gap-14 py-16 sm:py-20 lg:grid-cols-12 lg:py-28">
          <div className="lg:col-span-6">
            <Sobretitulo claro>Consultoria TOTVS Protheus · MAIS i9 WMS</Sobretitulo>
            <h1 className="mt-6 text-[2.5rem] leading-[1.05] font-bold tracking-tight sm:text-5xl lg:text-[3.5rem]">
              Tecnologia e expertise para transformar a gestão do seu negócio.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ardosia-200 sm:text-xl">
              Consultoria especializada em TOTVS Protheus e soluções próprias para tornar sua operação mais eficiente,
              integrada e preparada para crescer.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Botao href="/consultoria-protheus" tamanho="lg" seta>
                Conhecer a Consultoria Protheus
              </Botao>
              <Botao href="/mais-i9-wms" variante="contorno-claro" tamanho="lg">
                Explorar o MAIS i9 WMS
              </Botao>
            </div>
            <ul className="mt-12 grid gap-x-6 gap-y-3 border-t border-white/10 pt-8 text-sm text-ardosia-300 sm:grid-cols-3">
              {["Sustentação e suporte contínuos", "Desenvolvimento ADVPL/TLPP", "WMS SaaS integrado ao Protheus"].map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <span aria-hidden className="size-1.5 shrink-0 rounded-[1px] bg-destaque" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="hidden sm:block lg:col-span-6">
            <HeroIntegracao />
          </div>
        </div>
      </section>

      {/* Nossas soluções */}
      <Secao id="solucoes">
        <CabecalhoSecao
          centro
          sobretitulo="Nossas soluções"
          titulo="Duas frentes, um mesmo compromisso: a continuidade da sua operação"
          descricao="Serviços especializados para quem utiliza o TOTVS Protheus e um produto próprio para quem precisa de controle no armazém."
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <article className="revelar flex flex-col rounded-3xl border border-ardosia-200 bg-white p-8 shadow-sm shadow-navy-950/5 sm:p-10">
            <p className="text-xs font-semibold tracking-[0.14em] text-azul-600 uppercase">Para quem utiliza TOTVS Protheus</p>
            <h3 className="mt-3 text-2xl font-bold text-navy-950 sm:text-[1.75rem]">MAIS i9 Consultoria Protheus</h3>
            <p className="mt-4 text-[17px] leading-relaxed text-ardosia-600">
              Sustentação, suporte, projetos e desenvolvimento para que o ERP acompanhe a evolução do seu negócio — com
              governança, indicadores e visão de processos.
            </p>
            <ListaCheck
              className="mt-7"
              itens={[
                "Continuidade operacional e estabilidade do ambiente",
                "Atendimento funcional e técnico especializado",
                "Evolução com projetos, integrações e customizações",
                "Governança de demandas e acompanhamento executivo",
              ]}
            />
            <div className="mt-auto flex flex-col gap-4 pt-10 sm:flex-row sm:items-center">
              <Botao href="/consultoria-protheus#formulario" variante="escuro" seta>
                Falar com um especialista Protheus
              </Botao>
              <LinkSeta href="/consultoria-protheus#servicos">Conhecer os serviços</LinkSeta>
            </div>
          </article>

          <article className="revelar grade-tecnica relative flex flex-col overflow-hidden rounded-3xl bg-navy-950 p-8 text-white sm:p-10">
            <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-destaque/15 blur-3xl" />
            <div className="relative flex flex-wrap items-center gap-3">
              <p className="text-xs font-semibold tracking-[0.14em] text-azul-300 uppercase">Produto próprio</p>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white">SaaS</span>
            </div>
            <h3 className="relative mt-3 text-2xl font-bold sm:text-[1.75rem]">MAIS i9 WMS</h3>
            <p className="relative mt-4 text-[17px] leading-relaxed text-ardosia-200">
              Gestão de armazéns com controle, rastreabilidade e mobilidade — recebimento, armazenagem, expedição e
              inventário, com integração padrão ao TOTVS Protheus e APIs para outros ERPs.
            </p>
            <ListaCheck
              claro
              className="relative mt-7"
              itens={[
                "Rastreabilidade das movimentações",
                "Gestão de lotes, validade e endereçamento",
                "Operação com mobilidade pelo App Operador",
                "Integração entre armazém e ERP",
              ]}
            />
            <div className="relative mt-auto flex flex-col gap-4 pt-10 sm:flex-row sm:items-center">
              <Botao href="/mais-i9-wms#demonstracao" seta>
                Agendar demonstração
              </Botao>
              <LinkSeta href="/mais-i9-wms" claro>
                Conhecer o MAIS i9 WMS
              </LinkSeta>
            </div>
          </article>
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
            {diferenciais.map(({ titulo, texto, icone: Icone }) => (
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
