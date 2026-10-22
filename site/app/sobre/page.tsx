import { ArrowRight, Eye, Handshake, Lock, RefreshCw, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { CtaFinal, HeroPagina } from "@/components/secoes";
import { CabecalhoSecao, CaixaIcone, JsonLd, Pendente, Secao } from "@/components/ui";
import { empresa } from "@/conteudo/empresa";
import { trilha } from "@/lib/jsonld";
import { metadadosPagina } from "@/lib/site";

export const metadata = metadadosPagina({
  titulo: "Sobre a MAIS i9",
  descricao:
    "Conheça a MAIS i9: empresa brasileira de tecnologia com consultoria especializada em TOTVS Protheus e o MAIS i9 WMS, solução própria de gestão de armazéns.",
  caminho: "/sobre",
});

const caminhoTrilha = [
  { nome: "Início", caminho: "/" },
  { nome: "Sobre Nós", caminho: "/sobre" },
];

const visao = [
  {
    titulo: "Processo antes da ferramenta",
    texto: "Tecnologia só gera valor quando sustenta processos bem definidos. Por isso, começamos entendendo como a empresa funciona.",
  },
  {
    titulo: "Continuidade importa tanto quanto a implantação",
    texto: "Um sistema em produção precisa de cuidado contínuo. Sustentar bem é o que permite evoluir com segurança.",
  },
  {
    titulo: "Evolução com responsabilidade",
    texto: "Mudanças são planejadas, testadas e comunicadas, para que a operação não pare enquanto o ambiente evolui.",
  },
  {
    titulo: "Proximidade gera resultado",
    texto: "Conhecer o cliente, o histórico do ambiente e as pessoas envolvidas faz diferença em cada decisão.",
  },
];

const compromissos = [
  { titulo: "Transparência", texto: "Status, prazos e riscos comunicados com clareza, inclusive quando a notícia não é boa.", icone: Eye },
  { titulo: "Responsabilidade sobre as entregas", texto: "Compromisso com o que foi combinado e com a qualidade do que é entregue.", icone: ShieldCheck },
  { titulo: "Proximidade", texto: "Interlocução direta com os especialistas que conhecem o seu ambiente.", icone: Handshake },
  { titulo: "Confidencialidade", texto: "Cuidado com as informações e os dados a que temos acesso no ambiente do cliente.", icone: Lock },
  { titulo: "Melhoria contínua", texto: "Indicadores e aprendizados usados para melhorar o atendimento e os produtos.", icone: RefreshCw },
];

export default function Sobre() {
  const fatos: { rotulo: string; valor: ReactNode }[] = [
    { rotulo: "Fundação", valor: empresa.anoFundacao ?? <Pendente>ano de fundação</Pendente> },
    { rotulo: "Sede", valor: empresa.sede ?? <Pendente>cidade/UF</Pendente> },
    { rotulo: "Equipe", valor: empresa.tamanhoEquipe ?? <Pendente>tamanho da equipe</Pendente> },
    {
      rotulo: "Certificações",
      valor: empresa.certificacoes.length ? empresa.certificacoes.join(" · ") : <Pendente>certificações, se houver</Pendente>,
    },
  ];

  return (
    <>
      <JsonLd dados={trilha(caminhoTrilha)} />
      <HeroPagina
        trilha={caminhoTrilha}
        sobretitulo="Sobre a MAIS i9"
        titulo="Tecnologia com visão de negócio, construída com proximidade."
        descricao="Unimos conhecimento de ERP, processos e tecnologia própria para fortalecer a gestão das empresas e a continuidade das suas operações."
      />

      {/* Quem somos */}
      <Secao>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <CabecalhoSecao sobretitulo="Quem somos" titulo="Uma empresa brasileira de tecnologia com duas frentes complementares" />
            <div className="mt-6 space-y-5 text-lg leading-relaxed text-ardosia-600">
              <p>
                A MAIS i9 atua com <strong className="font-semibold text-navy-900">consultoria especializada em TOTVS Protheus</strong>{" "}
                — sustentação, suporte, projetos, desenvolvimento e governança — e com o{" "}
                <strong className="font-semibold text-navy-900">MAIS i9 WMS</strong>, solução própria para gestão de armazéns
                comercializada no modelo SaaS.
              </p>
              <p>
                As duas frentes compartilham o mesmo propósito: ajudar as empresas a operar com mais controle, eficiência e
                segurança, conectando tecnologia, processos e pessoas.
              </p>
            </div>
          </div>
          <aside className="lg:col-span-5">
            <dl className="divide-y divide-ardosia-200 rounded-2xl border border-ardosia-200 bg-fundo px-6">
              {fatos.map((f) => (
                <div key={f.rotulo} className="flex flex-col gap-1 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                  <dt className="text-sm font-medium text-ardosia-600">{f.rotulo}</dt>
                  <dd className="text-[15px] font-semibold text-navy-950 sm:text-right">{f.valor}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </Secao>

      {/* Nossa atuação */}
      <Secao fundo="cinza" id="atuacao">
        <CabecalhoSecao sobretitulo="Nossa atuação" titulo="Onde a MAIS i9 gera valor" />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {[
            {
              href: "/consultoria-protheus",
              rotulo: "Serviços",
              titulo: "MAIS i9 Consultoria Protheus",
              texto:
                "Para empresas que utilizam o TOTVS Protheus e precisam de continuidade operacional, evolução e governança do ERP.",
              cta: "Conhecer a consultoria",
            },
            {
              href: "/mais-i9-wms",
              rotulo: "Produto SaaS",
              titulo: "MAIS i9 WMS",
              texto: "Para operações logísticas que precisam de controle, rastreabilidade e mobilidade no armazém, integradas ao ERP.",
              cta: "Conhecer o MAIS i9 WMS",
            },
          ].map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group revelar flex flex-col rounded-2xl border border-ardosia-200 bg-white p-8 transition-shadow hover:shadow-lg hover:shadow-navy-950/5"
            >
              <p className="text-xs font-semibold tracking-[0.14em] text-azul-600 uppercase">{c.rotulo}</p>
              <h3 className="mt-3 text-2xl font-bold text-navy-950">{c.titulo}</h3>
              <p className="mt-3 text-[16px] leading-relaxed text-ardosia-600">{c.texto}</p>
              <span className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-azul-600 group-hover:text-navy-900">
                {c.cta}
                <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </Secao>

      {/* Visão */}
      <Secao fundo="escuro" id="visao">
        <CabecalhoSecao claro sobretitulo="Nossa visão" titulo="O que acreditamos sobre tecnologia e negócios" />
        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {visao.map((v, i) => (
            <div key={v.titulo} className="revelar border-t border-white/15 pt-6">
              <p className="font-display text-sm font-bold text-destaque">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-3 text-lg font-semibold text-white">{v.titulo}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ardosia-300">{v.texto}</p>
            </div>
          ))}
        </div>
      </Secao>

      {/* Compromisso */}
      <Secao id="compromisso">
        <div className="grid gap-12 lg:grid-cols-12">
          <CabecalhoSecao
            className="lg:col-span-4"
            sobretitulo="Compromisso com os clientes"
            titulo="Como nos relacionamos"
            descricao="Princípios que orientam o trabalho da MAIS i9 em cada projeto, atendimento e implantação."
          />
          <ul className="grid gap-6 sm:grid-cols-2 lg:col-span-8">
            {compromissos.map(({ titulo, texto, icone: Icone }) => (
              <li key={titulo} className="revelar flex gap-4">
                <CaixaIcone>
                  <Icone className="size-5" strokeWidth={1.75} />
                </CaixaIcone>
                <div>
                  <h3 className="font-semibold text-navy-950">{titulo}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-ardosia-600">{texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Secao>

      {/* Equipe */}
      <Secao fundo="cinza" id="equipe">
        <div className="grid gap-12 lg:grid-cols-12">
          <CabecalhoSecao className="lg:col-span-5" sobretitulo="Experiência da equipe" titulo="Especialistas em ERP, processos e operações" />
          <div className="space-y-6 text-[16px] leading-relaxed text-ardosia-600 lg:col-span-7">
            <p>
              A equipe da MAIS i9 reúne profissionais com conhecimento técnico e funcional em TOTVS Protheus, desenvolvimento
              ADVPL/TLPP, gestão de projetos e operações logísticas.
            </p>
            <p>{empresa.experienciaEquipe ?? <Pendente>resumo da experiência da equipe (áreas, tempo de atuação, perfis)</Pendente>}</p>
            <div>
              <p className="text-sm font-semibold text-navy-900">Segmentos atendidos</p>
              <div className="mt-2">
                {empresa.segmentosAtendidos.length ? (
                  <ul className="flex flex-wrap gap-2">
                    {empresa.segmentosAtendidos.map((s) => (
                      <li key={s} className="rounded-full bg-white px-3 py-1 text-sm text-navy-900 ring-1 ring-ardosia-200">
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Pendente>segmentos atendidos</Pendente>
                )}
              </div>
            </div>
          </div>
        </div>
      </Secao>

      <CtaFinal />
    </>
  );
}
