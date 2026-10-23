import { ArrowRight, Eye, Handshake, Lock, RefreshCw, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Credenciais, CtaFinal, HeroPagina } from "@/components/secoes";
import { CabecalhoSecao, CaixaIcone, JsonLd, Pendente, Secao, Sobretitulo } from "@/components/ui";
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
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <CabecalhoSecao sobretitulo="Quem somos" titulo="Uma empresa brasileira de tecnologia para gestão empresarial" />
          </div>
          <div className="lg:col-span-7 lg:pt-9">
            <div className="space-y-5 text-lg leading-relaxed text-ardosia-600">
              <p>
                A MAIS i9 é uma <strong className="font-semibold text-navy-900">consultoria especializada em TOTVS Protheus</strong>,
                com mais de 20 anos de experiência e uma equipe de especialistas funcionais e técnicos. Atuamos com suporte,
                sustentação, governança, projetos, integrações e soluções tecnológicas.
              </p>
              <p>
                Também desenvolvemos soluções próprias, como o{" "}
                <strong className="font-semibold text-navy-900">MAIS i9 WMS</strong>, plataforma de gestão de armazéns
                oferecida no modelo SaaS.
              </p>
              <p>
                Mais do que resolver incidentes, buscamos contribuir para que o ERP permaneça estável, seguro, atualizado e
                preparado para acompanhar o crescimento de cada organização.
              </p>
            </div>
          </div>
        </div>
      </Secao>

      {/* Missão e credenciais */}
      <Secao fundo="escuro" id="missao">
        {empresa.missao && (
          <figure className="mx-auto max-w-4xl text-center">
            <Sobretitulo claro>Nossa missão</Sobretitulo>
            <blockquote className="mt-6 font-display text-2xl leading-snug font-semibold text-balance text-white sm:text-3xl">
              “{empresa.missao}”
            </blockquote>
          </figure>
        )}
        <Credenciais claro className="mt-16" />
      </Secao>

      {/* Nossa atuação */}
      <Secao fundo="cinza" id="atuacao">
        <CabecalhoSecao
          sobretitulo="Nossa atuação"
          titulo="Serviços e produtos MAIS i9"
          descricao="Consultoria especializada em TOTVS Protheus e o MAIS i9 WMS, nossa plataforma de gestão de armazéns."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {[
            {
              href: "/consultoria-protheus",
              rotulo: "Serviço",
              titulo: "MAIS i9 Consultoria Protheus",
              texto:
                "Para empresas que utilizam o TOTVS Protheus e precisam de continuidade operacional, evolução e governança do ERP.",
              cta: "Conhecer a consultoria",
            },
            {
              href: "/mais-i9-wms",
              rotulo: "Produto",
              titulo: "MAIS i9 WMS",
              texto: "Para operações logísticas que precisam de controle, rastreabilidade e mobilidade no armazém, do recebimento à expedição.",
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
      <Secao id="visao">
        <CabecalhoSecao sobretitulo="Nossa visão" titulo="O que acreditamos sobre tecnologia e negócios" />
        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {visao.map((v, i) => (
            <div key={v.titulo} className="revelar border-t-2 border-navy-900 pt-6">
              <p className="font-display text-sm font-bold text-azul-600">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-3 text-lg font-semibold text-navy-950">{v.titulo}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ardosia-600">{v.texto}</p>
            </div>
          ))}
        </div>
      </Secao>

      {/* Compromisso */}
      <Secao fundo="cinza" id="compromisso">
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
      <Secao id="equipe">
        <div className="grid gap-12 lg:grid-cols-12">
          <CabecalhoSecao className="lg:col-span-5" sobretitulo="Experiência da equipe" titulo="Especialistas em ERP, processos e operações" />
          <div className="space-y-7 text-[16px] leading-relaxed text-ardosia-600 lg:col-span-7">
            <p>{empresa.experienciaEquipe ?? <Pendente>resumo da experiência da equipe (áreas, tempo de atuação, perfis)</Pendente>}</p>
            {[
              ["Equipe experiente em", empresa.especialidadesEquipe],
              [`${empresa.horasProjetos ?? "Horas"} de projetos em`, empresa.tiposProjeto],
            ].map(([titulo, itens]) => (
              <div key={titulo as string}>
                <p className="text-sm font-semibold text-navy-900">{titulo}</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {(itens as string[]).map((e) => (
                    <li key={e} className="rounded-full bg-white px-3 py-1 text-sm text-navy-900 ring-1 ring-ardosia-200">
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <p className="text-sm font-semibold text-navy-900">Segmentos atendidos</p>
              <p className="mt-2">{empresa.segmentosAtendidos ?? <Pendente>segmentos atendidos</Pendente>}</p>
            </div>
          </div>
        </div>
      </Secao>

      <CtaFinal />
    </>
  );
}
