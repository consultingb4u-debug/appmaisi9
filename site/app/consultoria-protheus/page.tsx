import clsx from "clsx";
import { ArrowRight, Check, Mail, MessageCircle, Phone, Ticket, Video } from "lucide-react";
import type { ReactNode } from "react";
import { FormularioConsultoria } from "@/components/formularios/formularios";
import { Credenciais, HeroPagina, PerguntasFrequentes } from "@/components/secoes";
import { Botao, CabecalhoSecao, CaixaIcone, JsonLd, LinkDestino, Secao, Sobretitulo } from "@/components/ui";
import { PainelGovernanca } from "@/components/visuais/painel-governanca";
import {
  beneficiosConsultoria,
  condicoesAtendimento,
  desafiosProtheus,
  diferenciaisConsultoria,
  faqConsultoria,
  ganhosConsultoria,
  matrizModelos,
  metodologiaAtendimento,
  modelosContratacao,
  papelMaisI9,
  prioridadesAtendimento,
  servicoDba,
  servicosConsultoria,
} from "@/conteudo/consultoria";
import { avisoMarcas, ctaProposta, ctaWhatsapp, empresa } from "@/conteudo/empresa";
import { idOrganizacao, perguntasFrequentes, trilha } from "@/lib/jsonld";
import { metadadosPagina, urlAbsoluta } from "@/lib/site";

export const metadata = metadadosPagina({
  titulo: "Consultoria TOTVS Protheus",
  descricao:
    "Suporte N1 a N3, sustentação, projetos, fábrica de software ADVPL/TLPP, DBA Oracle e SQL Server e governança para empresas que utilizam o TOTVS Protheus. Mais de 20 anos de experiência.",
  caminho: "/consultoria-protheus",
});

const caminhoTrilha = [
  { nome: "Início", caminho: "/" },
  { nome: "Consultoria Protheus", caminho: "/consultoria-protheus" },
];

const corPrioridade = { critico: "bg-critico", alto: "bg-destaque", medio: "bg-alerta", baixo: "bg-azul-500" };

function Canal({ icone, titulo, children }: { icone: ReactNode; titulo: string; children?: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span aria-hidden className="mt-0.5 text-azul-600">
        {icone}
      </span>
      <span>
        <span className="block font-medium text-navy-950">{titulo}</span>
        {children && <span className="block text-sm text-ardosia-600">{children}</span>}
      </span>
    </li>
  );
}

export default function ConsultoriaProtheus() {
  const servicoJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "MAIS i9 Consultoria Protheus",
    serviceType: "Consultoria em ERP TOTVS Protheus",
    url: urlAbsoluta("/consultoria-protheus"),
    provider: { "@id": idOrganizacao },
    areaServed: { "@type": "Country", name: "Brasil" },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Serviços de consultoria Protheus",
      itemListElement: [...servicosConsultoria, servicoDba].map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.titulo, description: s.resumo },
      })),
    },
  };

  return (
    <>
      <JsonLd dados={[servicoJsonLd, perguntasFrequentes(faqConsultoria), trilha(caminhoTrilha)]} />

      <HeroPagina
        trilha={caminhoTrilha}
        sobretitulo="Especialista em ambientes TOTVS Protheus"
        titulo="Continuidade operacional e evolução para ambientes TOTVS Protheus."
        descricao="Apoiamos empresas a extrair o máximo valor do Protheus com estabilidade, governança e evolução contínua do ERP — suporte, sustentação, projetos e fábrica de software com o mesmo time."
        visual={<PainelGovernanca />}
      >
        <Botao href={ctaWhatsapp("especialistaProtheus")} tamanho="lg" seta>
          Falar com um especialista Protheus
        </Botao>
        <Botao href={ctaWhatsapp("diagnostico")} variante="contorno-claro" tamanho="lg">
          Solicitar diagnóstico
        </Botao>
      </HeroPagina>

      {/* O que sua empresa ganha */}
      <Secao>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <CabecalhoSecao
              sobretitulo="O que sua empresa ganha"
              titulo="Mais do que alocar profissionais: uma parceria responsável pelo resultado"
            />
            <p className="mt-6 text-lg leading-relaxed text-ardosia-600">
              A MAIS i9 é uma consultoria especializada em maximizar o valor que as empresas extraem do TOTVS Protheus,
              atuando com suporte, sustentação, governança, projetos, integrações e soluções tecnológicas.
            </p>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 lg:col-span-7">
            {ganhosConsultoria.map(({ titulo, texto, icone: Icone }) => (
              <li key={titulo} className="revelar rounded-2xl border border-ardosia-200 bg-white p-7">
                <CaixaIcone>
                  <Icone className="size-5" strokeWidth={1.75} />
                </CaixaIcone>
                <h3 className="mt-5 text-lg font-semibold text-navy-950">{titulo}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ardosia-600">{texto}</p>
              </li>
            ))}
          </ul>
        </div>
      </Secao>

      {/* Experiência */}
      <Secao fundo="escuro" id="experiencia">
        <CabecalhoSecao claro centro sobretitulo="Experiência que suporta nossa atuação" titulo="Conhecimento acumulado em ambientes Protheus reais" />
        <Credenciais claro className="mt-14" />
        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white/[0.04] p-7 ring-1 ring-white/10">
            <p className="text-xs font-semibold tracking-[0.14em] text-azul-300 uppercase">Equipe experiente em</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {empresa.especialidadesEquipe.map((e) => (
                <li key={e} className="rounded-full bg-white/10 px-3.5 py-1.5 text-sm text-white">
                  {e}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-white/[0.04] p-7 ring-1 ring-white/10">
            <p className="text-xs font-semibold tracking-[0.14em] text-azul-300 uppercase">
              {empresa.horasProjetos} de projetos em
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {empresa.tiposProjeto.map((e) => (
                <li key={e} className="rounded-full bg-white/10 px-3.5 py-1.5 text-sm text-white">
                  {e}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Secao>

      {/* Desafios */}
      <Secao fundo="cinza" id="desafios">
        <CabecalhoSecao
          sobretitulo="Desafios comuns"
          titulo="Sinais de que o seu Protheus precisa de mais atenção"
          descricao="Situações frequentes em empresas que dependem do ERP no dia a dia — e que uma parceria especializada ajuda a resolver."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {desafiosProtheus.map(({ titulo, texto, icone: Icone }) => (
            <div key={titulo} className="revelar rounded-2xl border border-ardosia-200 bg-white p-7">
              <Icone aria-hidden className="size-6 text-destaque-escuro" strokeWidth={1.75} />
              <h3 className="mt-5 text-lg font-semibold text-navy-950">{titulo}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ardosia-600">{texto}</p>
            </div>
          ))}
        </div>
      </Secao>

      {/* Serviços */}
      <Secao id="servicos">
        <CabecalhoSecao
          sobretitulo="Como apoiamos sua operação"
          titulo="Tudo o que o seu ambiente Protheus precisa, com um único parceiro"
          descricao="Do atendimento do dia a dia aos projetos de evolução, com a mesma equipe conhecendo o seu ambiente."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {servicosConsultoria.map(({ id, titulo, resumo, itens, icone: Icone }) => (
            <article key={id} id={`servico-${id}`} className="revelar flex flex-col rounded-2xl border border-ardosia-200 bg-white p-7">
              <CaixaIcone>
                <Icone className="size-5" strokeWidth={1.75} />
              </CaixaIcone>
              <h3 className="mt-6 text-xl font-semibold text-navy-950">{titulo}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ardosia-600">{resumo}</p>
              <ul className="mt-5 space-y-2 border-t border-ardosia-100 pt-5">
                {itens.map((item) => (
                  <li key={item} className="flex gap-2.5 text-[14.5px] text-ardosia-700">
                    <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-[1px] bg-destaque" />
                    {item}
                  </li>
                ))}
              </ul>
              <LinkDestino
                href={ctaProposta(`${titulo} (TOTVS Protheus)`)}
                className="group mt-auto inline-flex items-center gap-1.5 pt-7 text-sm font-semibold text-azul-600 hover:text-navy-900"
              >
                Solicitar proposta
                <span className="sr-only"> de {titulo}</span>
                <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
              </LinkDestino>
            </article>
          ))}
        </div>

        {/* Serviço complementar: DBA */}
        <div id="dba" className="revelar mt-8 grid gap-8 rounded-2xl bg-fundo p-7 sm:p-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold tracking-[0.14em] text-azul-600 uppercase">Serviço especializado complementar</p>
            <h3 className="mt-3 text-2xl font-bold text-navy-950">{servicoDba.titulo}</h3>
            <p className="mt-3 text-[15.5px] leading-relaxed text-ardosia-600">{servicoDba.resumo}</p>
            <LinkDestino
              href={ctaProposta(servicoDba.titulo)}
              className="group mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-azul-600 hover:text-navy-900"
            >
              Falar sobre DBA
              <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
            </LinkDestino>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
            {servicoDba.itens.map((item) => (
              <li key={item} className="flex gap-3 rounded-xl bg-white p-4 text-[14.5px] text-ardosia-700 ring-1 ring-ardosia-100">
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-azul-600" strokeWidth={2.5} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Secao>

      {/* Diferenciais */}
      <Secao fundo="cinza" id="diferenciais">
        <CabecalhoSecao
          sobretitulo="Diferenciais"
          titulo="Por que a MAIS i9 no seu Protheus"
          descricao="Uma forma de trabalhar que combina profundidade técnica, gestão e proximidade."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {diferenciaisConsultoria.map((d) => (
            <div key={d.titulo} className="revelar rounded-2xl bg-white p-7 ring-1 ring-ardosia-200">
              <span aria-hidden className="block h-0.5 w-8 bg-destaque" />
              <h3 className="mt-5 text-lg font-semibold text-navy-950">{d.titulo}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ardosia-600">{d.texto}</p>
            </div>
          ))}
        </div>
      </Secao>

      {/* Modelos de contratação */}
      <Secao id="modelos">
        <CabecalhoSecao
          sobretitulo="Modelos de contratação"
          titulo="O formato certo para cada necessidade"
          descricao="Do atendimento pontual ao modelo evolutivo, que combina suporte e sustentação. Escopo, capacidade e níveis de serviço são definidos com você na proposta."
        />
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          {modelosContratacao.map((m) => (
            <article
              key={m.id}
              className={clsx(
                "revelar relative flex flex-col rounded-2xl p-6",
                m.recomendado ? "bg-navy-950 text-white shadow-xl shadow-navy-950/20 ring-2 ring-destaque" : "border border-ardosia-200 bg-white",
              )}
            >
              {m.recomendado && (
                <span className="absolute -top-3 left-6 rounded-full bg-destaque px-3 py-1 text-[11px] font-bold tracking-wide text-navy-950 uppercase">
                  Recomendado
                </span>
              )}
              <p className={clsx("text-xs font-semibold tracking-[0.14em] uppercase", m.recomendado ? "text-azul-300" : "text-azul-600")}>
                Opção
              </p>
              <h3 className={clsx("mt-1 text-xl font-bold", m.recomendado ? "text-white" : "text-navy-950")}>{m.titulo}</h3>
              <p className={clsx("mt-4 text-[15px] font-semibold", m.recomendado ? "text-white" : "text-navy-900")}>{m.formato}</p>
              <p className={clsx("text-sm", m.recomendado ? "text-ardosia-300" : "text-ardosia-600")}>{m.base}</p>
              <p className={clsx("mt-5 border-t pt-4 text-xs font-semibold tracking-wide uppercase", m.recomendado ? "border-white/15 text-ardosia-300" : "border-ardosia-100 text-ardosia-500")}>
                Indicado para
              </p>
              <ul className="mt-2 space-y-1.5">
                {m.indicado.map((i) => (
                  <li key={i} className={clsx("flex gap-2 text-[14.5px]", m.recomendado ? "text-ardosia-100" : "text-ardosia-700")}>
                    <Check aria-hidden className={clsx("mt-0.5 size-4 shrink-0", m.recomendado ? "text-destaque" : "text-azul-600")} strokeWidth={2.5} />
                    {i}
                  </li>
                ))}
              </ul>
              <LinkDestino
                href={ctaProposta(`modelo ${m.titulo} de consultoria TOTVS Protheus`)}
                className={clsx(
                  "group mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold",
                  m.recomendado ? "text-white hover:text-azul-300" : "text-azul-600 hover:text-navy-900",
                )}
              >
                Solicitar proposta
                <span className="sr-only"> do modelo {m.titulo}</span>
                <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
              </LinkDestino>
            </article>
          ))}
        </div>

        <div className="mt-14">
          <h3 className="text-xl font-semibold text-navy-950">O que cada modelo contempla</h3>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-ardosia-200">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="bg-fundo">
                  <th scope="col" className="px-4 py-3 font-semibold text-navy-900">
                    Benefício
                  </th>
                  {modelosContratacao.map((m) => (
                    <th
                      key={m.id}
                      scope="col"
                      className={clsx("px-3 py-3 text-center font-semibold", m.recomendado ? "bg-navy-950 text-white" : "text-navy-900")}
                    >
                      {m.titulo}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ardosia-100">
                {matrizModelos.map((linha) => (
                  <tr key={linha.beneficio}>
                    <th scope="row" className="px-4 py-2.5 font-normal text-ardosia-700">
                      {linha.beneficio}
                    </th>
                    {modelosContratacao.map((m) => (
                      <td key={m.id} className={clsx("px-3 py-2.5 text-center", m.recomendado && "bg-navy-950/[0.04]")}>
                        {linha.modelos.includes(m.id) ? (
                          <Check aria-label="Contempla" className="mx-auto size-4 text-azul-600" strokeWidth={2.75} />
                        ) : (
                          <span aria-label="Não contempla" className="text-ardosia-300">
                            —
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-fundo">
                  <th scope="row" className="px-4 py-3 font-semibold text-navy-900">
                    Formato
                  </th>
                  {modelosContratacao.map((m) => (
                    <td key={m.id} className="px-3 py-3 text-center text-[13px] font-medium text-navy-900">
                      {m.formato}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-6 rounded-2xl bg-fundo p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <ul className="grid gap-2 text-[15px] text-ardosia-700 sm:grid-cols-2 lg:max-w-3xl">
            {condicoesAtendimento.map((c) => (
              <li key={c} className="flex gap-2.5">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-[1px] bg-destaque" />
                {c}
              </li>
            ))}
          </ul>
          <Botao href={ctaWhatsapp("propostaConsultoria")} variante="escuro" seta className="shrink-0">
            Solicitar proposta
          </Botao>
        </div>
      </Secao>

      {/* Metodologia */}
      <Secao fundo="cinza" id="metodologia">
        <CabecalhoSecao
          sobretitulo="Metodologia de atendimento"
          titulo="Cada solicitação percorre um caminho claro"
          descricao="Registro, priorização e acompanhamento em todas as etapas, para que o atendimento seja previsível e o conhecimento fique no ambiente."
        />
        <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {metodologiaAtendimento.map((etapa, i) => (
            <li key={etapa.titulo} className="revelar relative rounded-2xl bg-white p-6 ring-1 ring-ardosia-200">
              <span className="font-display text-3xl font-bold text-ardosia-200">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-3 text-[17px] font-semibold text-navy-950">{etapa.titulo}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-ardosia-600">{etapa.texto}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          <div className="rounded-2xl bg-white p-7 ring-1 ring-ardosia-200 lg:col-span-7">
            <h3 className="text-lg font-semibold text-navy-950">Classificação das solicitações</h3>
            <dl className="mt-5 divide-y divide-ardosia-100">
              {prioridadesAtendimento.map((p) => (
                <div key={p.nivel} className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4">
                  <dt className="flex items-center gap-2.5 font-semibold text-navy-900">
                    <span aria-hidden className={clsx("size-2.5 rounded-full", corPrioridade[p.tom])} />
                    {p.nivel}
                  </dt>
                  <dd className="text-[15px] text-ardosia-600">{p.texto}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-sm leading-relaxed text-ardosia-500">
              Tempos de primeira resposta, horários de cobertura e regras de escalonamento são formalizados no quadro de SLA de
              cada contratação. O SLA se refere ao início do atendimento.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-7 ring-1 ring-ardosia-200 lg:col-span-5">
            <h3 className="text-lg font-semibold text-navy-950">Canais de atendimento</h3>
            <ul className="mt-5 space-y-4">
              <Canal icone={<Ticket className="size-5" />} titulo="Central de atendimento e registro de chamados" />
              <Canal icone={<Mail className="size-5" />} titulo="E-mail">
                {empresa.emailChamados}
              </Canal>
              <Canal icone={<MessageCircle className="size-5" />} titulo="WhatsApp" />
              <Canal icone={<Phone className="size-5" />} titulo="Telefone">
                {empresa.telefoneComercial}
              </Canal>
              <Canal icone={<Video className="size-5" />} titulo="Reuniões remotas, quando necessárias" />
            </ul>
          </div>
        </div>
      </Secao>

      {/* Benefícios */}
      <Secao id="beneficios">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <CabecalhoSecao
            className="lg:col-span-5"
            sobretitulo="Benefícios"
            titulo="O que muda no dia a dia da sua equipe"
            descricao="Um ERP estável, bem utilizado e preparado para evoluir — com a gestão acompanhando de perto."
          />
          <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            {beneficiosConsultoria.map(({ texto, icone: Icone }) => (
              <li key={texto} className="revelar flex items-center gap-4 rounded-xl border border-ardosia-200 p-4">
                <CaixaIcone className="size-10">
                  <Icone className="size-5" strokeWidth={1.75} />
                </CaixaIcone>
                <span className="text-[15px] font-medium text-navy-900">{texto}</span>
              </li>
            ))}
          </ul>
        </div>
      </Secao>

      {/* O papel da MAIS i9 */}
      <section className="grade-tecnica bg-navy-950 py-16 text-white sm:py-20">
        <div className="container-site grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-4">
            <Sobretitulo claro>O papel da MAIS i9</Sobretitulo>
          </div>
          <p className="font-display text-2xl leading-snug font-semibold text-balance sm:text-[1.75rem] lg:col-span-8">{papelMaisI9}</p>
        </div>
      </section>

      {/* FAQ */}
      <Secao fundo="cinza" id="perguntas">
        <div className="grid gap-12 lg:grid-cols-12">
          <CabecalhoSecao
            className="lg:col-span-4"
            sobretitulo="Perguntas frequentes"
            titulo="Dúvidas sobre a consultoria"
            descricao={
              <>
                Não encontrou o que procurava?{" "}
                <LinkDestino href={ctaWhatsapp("especialistaProtheus")} className="font-semibold text-azul-600 hover:text-navy-900">
                  Fale com um especialista
                </LinkDestino>
                .
              </>
            }
          />
          <div className="lg:col-span-8">
            <PerguntasFrequentes itens={faqConsultoria} />
          </div>
        </div>
      </Secao>

      {/* Formulário */}
      <Secao id="formulario">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <CabecalhoSecao
              sobretitulo="Fale com a MAIS i9"
              titulo="Converse com um especialista Protheus"
              descricao="Conte o seu cenário. Avaliamos a necessidade e indicamos o melhor caminho: diagnóstico, suporte, sustentação, modelo evolutivo, projeto ou desenvolvimento."
            />
            <ol className="mt-10 space-y-6">
              {[
                ["Recebemos sua solicitação", "A mensagem chega diretamente à equipe da consultoria."],
                ["Conversa com um especialista", "Entendemos o ambiente, as demandas e as prioridades."],
                ["Proposta ou plano de diagnóstico", "Você recebe uma proposta alinhada ao escopo combinado."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-navy-900 text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-navy-950">{t}</p>
                    <p className="mt-0.5 text-[15px] text-ardosia-600">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-10 text-sm text-ardosia-600">
              Já é cliente? Abra um chamado pelo e-mail <strong className="font-semibold text-navy-900">{empresa.emailChamados}</strong>.
            </p>
          </div>
          <div className="rounded-3xl border border-ardosia-200 bg-white p-6 shadow-xl shadow-navy-950/5 sm:p-10 lg:col-span-7">
            <FormularioConsultoria />
          </div>
        </div>
        <p className="mt-16 text-xs leading-relaxed text-ardosia-500">{avisoMarcas}</p>
      </Secao>
    </>
  );
}
