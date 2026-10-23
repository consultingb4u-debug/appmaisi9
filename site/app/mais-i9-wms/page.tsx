import clsx from "clsx";
import { ArrowLeftRight, Check, Cloud, Database, Plug, ScanBarcode, Warehouse } from "lucide-react";
import { FormularioDemoWms } from "@/components/formularios/formularios";
import { HeroPagina, PerguntasFrequentes } from "@/components/secoes";
import { Botao, CabecalhoSecao, CaixaIcone, JsonLd, LinkDestino, Secao, Sobretitulo } from "@/components/ui";
import { Aplicativos, BaseOperacional, FluxoOperacao, NotaIlustracao, VisaoProduto, VitrineHero } from "@/components/wms";
import { avisoMarcas, ctaWhatsapp, empresa } from "@/conteudo/empresa";
import {
  baseOperacional,
  beneficiosWms,
  conexaoProtheus,
  diferenciaisWms,
  etapasImplantacao,
  faqWms,
  impactoWms,
  introducaoWms,
  modeloContratacaoWms,
  modulosComplementares,
  papelWms,
  pontosIntegracao,
} from "@/conteudo/wms";
import { idOrganizacao, perguntasFrequentes, trilha } from "@/lib/jsonld";
import { metadadosPagina, urlAbsoluta } from "@/lib/site";

export const metadata = metadadosPagina({
  titulo: "MAIS i9 WMS — Gestão de Armazéns SaaS",
  descricao:
    "MAIS i9 WMS: plataforma SaaS de gestão de armazéns com recebimento, armazenagem, expedição, App Operador e indicadores, conectada ao TOTVS Protheus pelo Addon MAIS i9 (API). Agende uma demonstração.",
  caminho: "/mais-i9-wms",
});

const caminhoTrilha = [
  { nome: "Início", caminho: "/" },
  { nome: "MAIS i9 WMS", caminho: "/mais-i9-wms" },
];

export default function MaisI9Wms() {
  const produtoJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "MAIS i9 WMS",
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Warehouse Management System",
    operatingSystem: "Web",
    url: urlAbsoluta("/mais-i9-wms"),
    description:
      "Solução SaaS de gestão de armazéns da MAIS i9, conectada ao TOTVS Protheus pelo Addon MAIS i9 (API) e com APIs para integração com outros ERPs.",
    publisher: { "@id": idOrganizacao },
    featureList: [...baseOperacional, ...modulosComplementares].map((m) => m.titulo),
  };

  return (
    <>
      <JsonLd dados={[produtoJsonLd, perguntasFrequentes(faqWms), trilha(caminhoTrilha)]} />

      <HeroPagina
        trilha={caminhoTrilha}
        sobretitulo="MAIS i9 WMS · Gestão Inteligente de Armazéns"
        titulo="Mais controle, rastreabilidade e produtividade para sua operação logística."
        descricao="Conheça o MAIS i9 WMS: uma plataforma completa para gestão de armazéns, conectando pessoas, processos e sistemas em uma operação mais inteligente."
        visual={<VitrineHero />}
      >
        <Botao href={ctaWhatsapp("demonstracaoWms")} tamanho="lg" seta>
          Agendar demonstração
        </Botao>
        <Botao href="#funcionalidades" variante="contorno-claro" tamanho="lg">
          Explorar funcionalidades
        </Botao>
      </HeroPagina>

      {/* Faixa de credenciais do produto */}
      <div className="border-b border-ardosia-100 bg-white">
        <ul className="container-site grid grid-cols-2 gap-x-6 gap-y-4 py-7 text-sm font-medium text-navy-900 lg:grid-cols-4">
          {[
            { t: "100% SaaS, produto próprio MAIS i9", I: Cloud },
            { t: "Addon MAIS i9 para o TOTVS Protheus (API)", I: ArrowLeftRight },
            { t: "App Operador em dispositivos Android", I: ScanBarcode },
            { t: "APIs para integração com outros ERPs", I: Plug },
          ].map(({ t, I }) => (
            <li key={t} className="flex items-center gap-3">
              <I aria-hidden className="size-5 shrink-0 text-azul-600" strokeWidth={1.75} />
              {t}
            </li>
          ))}
        </ul>
      </div>

      {/* Visão do produto */}
      <Secao fundo="cinza" id="produto">
        <CabecalhoSecao
          centro
          sobretitulo="Visão do produto"
          titulo="Do painel de gestão ao coletor na mão do operador"
          descricao={introducaoWms}
        />
        <div className="mt-12">
          <VisaoProduto />
        </div>
        <div className="mt-8 text-center">
          <NotaIlustracao telas={["dashboard", "appOperador", "operacional", "torreExpedicao"]} />
        </div>
      </Secao>

      {/* Impacto e benefícios */}
      <Secao id="beneficios">
        <CabecalhoSecao
          sobretitulo="O impacto na operação"
          titulo="Pessoas, processos e tecnologia conectados no armazém"
          descricao="O MAIS i9 WMS conecta pessoas, processos e tecnologia para reduzir perdas, aumentar a produtividade e elevar a confiabilidade da operação logística."
        />
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {impactoWms.map(({ titulo, texto, icone: Icone }) => (
            <li key={titulo} className="revelar rounded-2xl border border-ardosia-200 bg-white p-7">
              <span aria-hidden className="flex size-12 items-center justify-center rounded-full bg-destaque-claro text-destaque-escuro">
                <Icone className="size-6" strokeWidth={1.75} />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-navy-950">{titulo}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ardosia-600">{texto}</p>
            </li>
          ))}
        </ul>
        <ul aria-label="Benefícios" className="mt-10 flex flex-wrap gap-2.5">
          {beneficiosWms.map(({ titulo, icone: Icone }) => (
            <li key={titulo} className="flex items-center gap-2 rounded-full bg-fundo px-3.5 py-2 text-sm font-medium text-navy-900">
              <Icone aria-hidden className="size-4 text-azul-600" strokeWidth={1.75} />
              {titulo}
            </li>
          ))}
        </ul>
      </Secao>

      {/* Como funciona */}
      <Secao fundo="cinza" id="como-funciona">
        <CabecalhoSecao
          centro
          sobretitulo="Como funciona"
          titulo="O ERP planeja. O WMS conduz a execução física."
          descricao="As informações do ERP orientam o trabalho no armazém, e cada etapa executada volta para o ERP — sem redigitação."
        />
        <div className="mt-16">
          <FluxoOperacao />
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-7 ring-1 ring-ardosia-200">
            <p className="text-xs font-semibold tracking-wider text-azul-600 uppercase">Do ERP para o armazém</p>
            <p className="mt-3 text-[15.5px] leading-relaxed text-ardosia-700">
              Cadastros, documentos de entrada e pedidos de saída registrados no ERP chegam ao MAIS i9 WMS e se transformam
              em tarefas para a equipe do armazém.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-7 ring-1 ring-ardosia-200">
            <p className="text-xs font-semibold tracking-wider text-azul-600 uppercase">Do armazém para o ERP</p>
            <p className="mt-3 text-[15.5px] leading-relaxed text-ardosia-700">
              O que foi conferido, armazenado, movimentado e expedido retorna ao ERP, mantendo os dois sistemas consistentes
              e a operação rastreável.
            </p>
          </div>
        </div>
      </Secao>

      {/* Base operacional */}
      <Secao id="funcionalidades">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <CabecalhoSecao
            sobretitulo="Base operacional"
            titulo="Sete componentes que estruturam a operação do armazém"
            descricao="Selecione um componente para ver o que ele cobre."
          />
        </div>
        <div className="mt-12">
          <BaseOperacional />
        </div>
      </Secao>

      {/* Módulos complementares */}
      <Secao fundo="cinza" id="modulos-complementares">
        <CabecalhoSecao
          sobretitulo="Módulos complementares"
          titulo="Recursos para ampliar o controle além do armazém"
          descricao="Inventário, produção, entregas e embalagens, para operações que precisam de mais abrangência."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {modulosComplementares.map((m) => (
            <article key={m.id} className="revelar flex flex-col rounded-2xl border border-ardosia-200 bg-white p-7 sm:p-8">
              <div className="flex items-start gap-5">
                <CaixaIcone>
                  <m.icone className="size-5" strokeWidth={1.75} />
                </CaixaIcone>
                <div>
                  <h3 className="text-xl font-semibold text-navy-950">{m.titulo}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-ardosia-600">{m.resumo}</p>
                </div>
              </div>
              <ul className="mt-6 space-y-2.5 border-t border-ardosia-100 pt-6">
                {m.itens.map((item) => (
                  <li key={item} className="flex gap-3 text-[14.5px] text-ardosia-700">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-azul-600" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-auto pt-6 text-[15px] font-medium text-navy-900">{m.beneficio}</p>
            </article>
          ))}
        </div>
        <div className="mt-10 rounded-2xl border border-azul-300/50 bg-azul-100/60 p-6 text-[15px] leading-relaxed text-navy-900 sm:p-8">
          <strong className="font-semibold">Todos esses recursos fazem parte do produto padrão.</strong> A implantação é
          dimensionada conforme os processos e os módulos utilizados pela sua operação.
        </div>
      </Secao>

      {/* Integração com TOTVS Protheus */}
      <Secao fundo="escuro" id="integracao">
        <div className="grid items-center gap-14 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <CabecalhoSecao
              claro
              sobretitulo="Conexão com o TOTVS Protheus"
              titulo="Conectado ao Protheus pelo Addon MAIS i9"
              descricao="O MAIS i9 WMS se conecta ao TOTVS Protheus por meio do Addon MAIS i9, via API, para que armazém e gestão trabalhem com a mesma informação. A conexão já está contemplada na implantação de cada componente."
            />
            <dl className="mt-10 space-y-6">
              {pontosIntegracao.map((p) => (
                <div key={p.titulo} className="flex gap-4">
                  <span aria-hidden className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-destaque">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  <div>
                    <dt className="font-semibold text-white">{p.titulo}</dt>
                    <dd className="mt-1 text-[15px] leading-relaxed text-ardosia-300">{p.texto}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-3xl bg-white/[0.04] p-6 ring-1 ring-white/10 sm:p-8">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
                <div className="rounded-2xl bg-navy-900 p-5 text-center ring-1 ring-white/10">
                  <Database aria-hidden className="mx-auto size-7 text-azul-300" strokeWidth={1.75} />
                  <p className="mt-3 text-[11px] tracking-wider text-ardosia-400 uppercase">ERP</p>
                  <p className="font-semibold text-white">TOTVS Protheus</p>
                </div>
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <ArrowLeftRight aria-hidden className="size-7 text-destaque" />
                  <span className="rounded-full bg-destaque px-2.5 py-1 text-[11px] font-bold whitespace-nowrap text-navy-950">Addon MAIS i9</span>
                  <span className="text-[11px] tracking-wider text-ardosia-300 uppercase">via API</span>
                </div>
                <div className="rounded-2xl bg-navy-900 p-5 text-center ring-1 ring-destaque/40">
                  <Warehouse aria-hidden className="mx-auto size-7 text-destaque" strokeWidth={1.75} />
                  <p className="mt-3 text-[11px] tracking-wider text-ardosia-400 uppercase">WMS</p>
                  <p className="font-semibold text-white">MAIS i9 WMS</p>
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {conexaoProtheus.sentidos.map((sentido, i) => (
                  <div key={sentido.rotulo} className="rounded-xl bg-navy-900/70 p-4 ring-1 ring-white/5">
                    <p className={clsx("text-xs font-semibold", i === 0 ? "text-azul-300" : "text-destaque")}>{sentido.rotulo}</p>
                    <p className="mt-2 text-sm leading-relaxed text-ardosia-200">{sentido.texto}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 flex gap-3 rounded-xl bg-destaque/10 p-4 text-sm leading-relaxed text-ardosia-100 ring-1 ring-destaque/30">
                <ArrowLeftRight aria-hidden className="mt-0.5 size-4 shrink-0 text-destaque" />
                {conexaoProtheus.integracoes}
              </p>
              <div className="mt-6 flex gap-4 rounded-xl border border-dashed border-white/20 p-4">
                <Plug aria-hidden className="mt-0.5 size-5 shrink-0 text-azul-300" strokeWidth={1.75} />
                <p className="text-sm leading-relaxed text-ardosia-200">
                  <strong className="font-semibold text-white">Outros ERPs:</strong> o MAIS i9 WMS disponibiliza APIs de
                  integração. O escopo de cada integração é avaliado com a sua equipe no início do projeto.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Secao>

      {/* Diferenciais */}
      <Secao fundo="cinza" id="diferenciais">
        <CabecalhoSecao
          centro
          sobretitulo="Diferenciais da solução"
          titulo="Pensado para a realidade da operação logística"
          descricao="Tecnologia acessível, integrada ao ERP e simples para quem executa."
        />
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {diferenciaisWms.map(({ titulo, texto, icone: Icone }) => (
            <li key={titulo} className="revelar flex gap-5 rounded-2xl border border-ardosia-200 bg-white p-7">
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
      </Secao>

      {/* Aplicativos */}
      <Secao id="aplicativos">
        <CabecalhoSecao
          centro
          sobretitulo="Aplicativos"
          titulo="Mobilidade dentro e fora do armazém"
          descricao="Aplicativos pensados para quem executa a operação: no armazém e na rua."
        />
        <div className="mt-14">
          <Aplicativos />
        </div>
        <div className="mt-6 text-center">
          <NotaIlustracao telas={["appOperadorConsulta", "appMotorista"]} />
        </div>
      </Secao>

      {/* Contratação e implantação */}
      <Secao fundo="cinza" id="implantacao">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <CabecalhoSecao
              sobretitulo="Contratação e implantação"
              titulo="Uma solução completa, no ritmo da sua operação"
              descricao="Comece pelos processos essenciais e cresça com segurança, à medida que novas necessidades surgirem."
            />
            <dl className="mt-10 space-y-6">
              {[
                ["Assinatura SaaS", modeloContratacaoWms.assinatura],
                ["Implantação por componente", modeloContratacaoWms.implantacao],
                ["Integração Protheus contemplada", modeloContratacaoWms.integracao],
              ].map(([t, d]) => (
                <div key={t} className="border-l-2 border-destaque pl-5">
                  <dt className="font-semibold text-navy-950">{t}</dt>
                  <dd className="mt-1.5 text-[15px] leading-relaxed text-ardosia-600">{d}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="lg:col-span-7">
            <h3 className="text-lg font-semibold text-navy-950">Como acontece a implantação</h3>
            <ol className="mt-6 grid gap-4 sm:grid-cols-2">
              {etapasImplantacao.map((etapa, i) => (
                <li key={etapa.titulo} className="revelar flex gap-4 rounded-2xl bg-white p-5 ring-1 ring-ardosia-200">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-navy-900 font-display text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-navy-950">{etapa.titulo}</p>
                    <p className="mt-1 text-[14.5px] leading-relaxed text-ardosia-600">{etapa.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-sm leading-relaxed text-ardosia-500">
              O planejamento é construído com a sua equipe, considerando os módulos escolhidos, a disponibilidade das equipes e
              os marcos de validação e entrada em produção. Demandas adicionais são avaliadas e aprovadas antes da execução.
            </p>
          </div>
        </div>
      </Secao>

      {/* O papel do MAIS i9 WMS */}
      <section className="grade-tecnica bg-navy-950 py-16 text-white sm:py-20">
        <div className="container-site grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-4">
            <Sobretitulo claro>O papel do MAIS i9 WMS</Sobretitulo>
          </div>
          <p className="font-display text-2xl leading-snug font-semibold text-balance sm:text-[1.75rem] lg:col-span-8">{papelWms}</p>
        </div>
      </section>

      {/* FAQ */}
      <Secao id="perguntas">
        <div className="grid gap-12 lg:grid-cols-12">
          <CabecalhoSecao
            className="lg:col-span-4"
            sobretitulo="Perguntas frequentes"
            titulo="Dúvidas sobre o MAIS i9 WMS"
            descricao={
              <>
                Quer ver o produto funcionando?{" "}
                <LinkDestino href={ctaWhatsapp("demonstracaoWms")} className="font-semibold text-azul-600 hover:text-navy-900">
                  Agende uma demonstração
                </LinkDestino>
                .
              </>
            }
          />
          <div className="lg:col-span-8">
            <PerguntasFrequentes itens={faqWms} />
          </div>
        </div>
      </Secao>

      {/* Demonstração */}
      <Secao fundo="cinza" id="demonstracao">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <CabecalhoSecao
              sobretitulo="Demonstração"
              titulo="Agende uma demonstração do MAIS i9 WMS"
              descricao="Mostramos o MAIS i9 WMS aplicado aos processos da sua operação e como ele se conecta ao seu ERP."
            />
            <ul className="mt-10 space-y-4">
              {[
                "Conversa inicial para entender a operação e os desafios",
                "Apresentação do WMS a partir dos seus processos",
                "Orientação sobre integração com o seu ERP e próximos passos",
              ].map((t) => (
                <li key={t} className="flex gap-3 text-[15.5px] text-ardosia-700">
                  <span aria-hidden className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-azul-100 text-azul-600">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-10 text-sm leading-relaxed text-ardosia-600">
              Prefere falar agora? {empresa.telefoneComercial} · {empresa.emailComercial}
              {empresa.siteWms && (
                <>
                  <br />
                  Conheça também:{" "}
                  <a href={empresa.siteWms} target="_blank" rel="noopener noreferrer" className="font-semibold text-azul-600 hover:text-navy-900">
                    {empresa.siteWms.replace("https://", "")}
                  </a>
                </>
              )}
            </p>
          </div>
          <div className="rounded-3xl border border-ardosia-200 bg-white p-6 shadow-xl shadow-navy-950/5 sm:p-10 lg:col-span-7">
            <FormularioDemoWms />
          </div>
        </div>
        <p className="mt-16 text-xs leading-relaxed text-ardosia-500">
          O MAIS i9 WMS é um produto desenvolvido e mantido pela MAIS i9. {avisoMarcas}
        </p>
      </Secao>
    </>
  );
}
