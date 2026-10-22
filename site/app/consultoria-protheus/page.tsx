import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { FormularioConsultoria } from "@/components/formularios/formularios";
import { CtaFinal, HeroPagina, PerguntasFrequentes } from "@/components/secoes";
import { Botao, CabecalhoSecao, CaixaIcone, JsonLd, Secao } from "@/components/ui";
import { PainelGovernanca } from "@/components/visuais/painel-governanca";
import {
  beneficiosConsultoria,
  desafiosProtheus,
  diferenciaisConsultoria,
  faqConsultoria,
  metodologiaAtendimento,
  modelosContratacao,
  pilaresConsultoria,
  servicosConsultoria,
} from "@/conteudo/consultoria";
import { avisoMarcas } from "@/conteudo/empresa";
import { idOrganizacao, perguntasFrequentes, trilha } from "@/lib/jsonld";
import { metadadosPagina, urlAbsoluta } from "@/lib/site";

export const metadata = metadadosPagina({
  titulo: "Consultoria TOTVS Protheus",
  descricao:
    "Sustentação, suporte especializado, projetos, desenvolvimento ADVPL/TLPP e governança para empresas que utilizam o TOTVS Protheus. Fale com um especialista da MAIS i9.",
  caminho: "/consultoria-protheus",
});

const caminhoTrilha = [
  { nome: "Início", caminho: "/" },
  { nome: "Consultoria Protheus", caminho: "/consultoria-protheus" },
];

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
      itemListElement: servicosConsultoria.map((s) => ({
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
        sobretitulo="MAIS i9 Consultoria Protheus"
        titulo="Especialistas em TOTVS Protheus para manter sua operação estável e em evolução."
        descricao="Sustentação, suporte, projetos, desenvolvimento e governança para que o ERP acompanhe o seu negócio — com método, indicadores e visão de processos."
        visual={<PainelGovernanca />}
      >
        <Botao href="#formulario" tamanho="lg" seta>
          Falar com um especialista Protheus
        </Botao>
        <Botao href="/consultoria-protheus?servico=diagnostico#formulario" variante="contorno-claro" tamanho="lg">
          Solicitar diagnóstico
        </Botao>
      </HeroPagina>

      {/* Proposta de valor */}
      <Secao>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <CabecalhoSecao
            className="lg:col-span-5"
            sobretitulo="Proposta de valor"
            titulo="Mais do que alocar profissionais: uma parceria responsável pelo resultado"
          />
          <div className="lg:col-span-7">
            <p className="text-lg leading-relaxed text-ardosia-600">
              A MAIS i9 atua como parceira do seu ambiente Protheus. Combinamos conhecimento técnico e funcional com
              gestão de demandas e visão de processos para garantir continuidade operacional, eficiência e evolução
              tecnológica alinhada aos objetivos da empresa — para que você extraia o máximo valor do investimento no ERP.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {pilaresConsultoria.map((p, i) => (
                <div key={p.titulo} className="revelar border-t-2 border-navy-900 pt-5">
                  <p className="font-display text-sm font-bold text-azul-600">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-2 text-lg font-semibold text-navy-950">{p.titulo}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ardosia-600">{p.texto}</p>
                </div>
              ))}
            </div>
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
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <CabecalhoSecao
            sobretitulo="Serviços"
            titulo="Tudo o que o seu ambiente Protheus precisa, com um único parceiro"
            descricao="Do atendimento do dia a dia aos projetos de evolução, com a mesma equipe conhecendo o seu ambiente."
          />
        </div>
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
              <Link
                href={`/consultoria-protheus?servico=${id}#formulario`}
                className="group mt-auto inline-flex items-center gap-1.5 pt-7 text-sm font-semibold text-azul-600 hover:text-navy-900"
              >
                Solicitar proposta
                <span className="sr-only"> de {titulo}</span>
                <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </article>
          ))}
        </div>
      </Secao>

      {/* Diferenciais */}
      <Secao fundo="escuro" id="diferenciais">
        <CabecalhoSecao
          claro
          sobretitulo="Diferenciais"
          titulo="Por que a MAIS i9 no seu Protheus"
          descricao="Uma forma de trabalhar que combina profundidade técnica, gestão e proximidade."
        />
        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {diferenciaisConsultoria.map((d) => (
            <div key={d.titulo} className="bg-navy-950 p-8">
              <span aria-hidden className="block h-0.5 w-8 bg-destaque" />
              <h3 className="mt-5 text-lg font-semibold text-white">{d.titulo}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ardosia-300">{d.texto}</p>
            </div>
          ))}
        </div>
      </Secao>

      {/* Modelos de contratação */}
      <Secao id="modelos">
        <CabecalhoSecao
          sobretitulo="Modelos de contratação"
          titulo="O formato certo para cada necessidade"
          descricao="Os modelos podem ser combinados. O escopo, o volume e os indicadores são definidos com você na proposta."
        />
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          {modelosContratacao.map((m) => (
            <article key={m.titulo} className="revelar flex flex-col rounded-2xl border border-ardosia-200 bg-white p-6 lg:col-span-1">
              <h3 className="text-lg font-semibold text-navy-950">{m.titulo}</h3>
              <p className="mt-3 text-[14.5px] leading-relaxed text-ardosia-600">{m.texto}</p>
              <p className="mt-5 border-t border-ardosia-100 pt-4 text-sm text-ardosia-700">
                <span className="font-semibold text-navy-900">Indicado para: </span>
                {m.indicado}
              </p>
            </article>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-4 rounded-2xl bg-fundo p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <p className="text-[15px] text-ardosia-700">
            Os valores são apresentados em proposta, de acordo com o escopo, o volume de demandas e o modelo de atendimento.
          </p>
          <Botao href="#formulario" variante="escuro" seta className="shrink-0">
            Solicitar proposta
          </Botao>
        </div>
      </Secao>

      {/* Metodologia */}
      <Secao fundo="cinza" id="metodologia">
        <CabecalhoSecao
          sobretitulo="Metodologia de atendimento"
          titulo="Cada demanda percorre um caminho claro"
          descricao="Método e registro em todas as etapas, para que o atendimento seja previsível e o conhecimento fique no ambiente."
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
      </Secao>

      {/* Benefícios */}
      <Secao id="beneficios">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <CabecalhoSecao
            className="lg:col-span-5"
            sobretitulo="Benefícios"
            titulo="O que a sua empresa ganha"
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
                <Link href="#formulario" className="font-semibold text-azul-600 hover:text-navy-900">
                  Fale com um especialista
                </Link>
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
              descricao="Conte o seu cenário. Avaliamos a necessidade e indicamos o melhor caminho: diagnóstico, sustentação, suporte, projeto ou desenvolvimento."
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
          </div>
          <div className="rounded-3xl border border-ardosia-200 bg-white p-6 shadow-xl shadow-navy-950/5 sm:p-10 lg:col-span-7">
            <FormularioConsultoria />
          </div>
        </div>
        <p className="mt-16 text-xs leading-relaxed text-ardosia-500">{avisoMarcas}</p>
      </Secao>

      <CtaFinal
        titulo="Seu armazém também precisa de controle?"
        descricao="Conheça o MAIS i9 WMS, solução própria da MAIS i9 com integração padrão ao TOTVS Protheus."
        rotulo="Conhecer o MAIS i9 WMS"
        href="/mais-i9-wms"
        atalhos={false}
      />
    </>
  );
}
