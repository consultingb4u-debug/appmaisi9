import { CardsCases, CtaFinal, Depoimentos, HeroPagina, LogosClientes } from "@/components/secoes";
import { CabecalhoSecao, JsonLd, Secao } from "@/components/ui";
import type { TipoCase } from "@/conteudo/cases";
import { trilha } from "@/lib/jsonld";
import { metadadosPagina } from "@/lib/site";

export const metadata = metadadosPagina({
  titulo: "Cases e clientes",
  descricao:
    "Cases de implantação, projetos de evolução, sustentação TOTVS Protheus e utilização do MAIS i9 WMS, publicados com autorização dos clientes.",
  caminho: "/cases",
});

const caminhoTrilha = [
  { nome: "Início", caminho: "/" },
  { nome: "Cases", caminho: "/cases" },
];

const grupos: { id: string; titulo: string; descricao: string; tipos: TipoCase[] }[] = [
  {
    id: "consultoria",
    titulo: "Consultoria Protheus",
    descricao: "Implantações, projetos de evolução e resultados de sustentação em ambientes TOTVS Protheus.",
    tipos: ["implantacao", "evolucao", "sustentacao"],
  },
  {
    id: "wms",
    titulo: "MAIS i9 WMS",
    descricao: "Operações logísticas que utilizam o MAIS i9 WMS: processos, integração e resultados.",
    tipos: ["wms"],
  },
];

export default function Cases() {
  return (
    <>
      <JsonLd dados={trilha(caminhoTrilha)} />
      <HeroPagina
        trilha={caminhoTrilha}
        sobretitulo="Cases e clientes"
        titulo="Projetos reais, contados com autorização dos nossos clientes."
        descricao="Aqui você vai encontrar cases de implantação, projetos de evolução, resultados de sustentação e operações com o MAIS i9 WMS. Cada case é publicado somente após a aprovação do cliente."
      >
        <nav aria-label="Seções da página" className="flex flex-wrap gap-2">
          {[...grupos.map((g) => ({ href: `#${g.id}`, rotulo: g.titulo })), { href: "#depoimentos", rotulo: "Depoimentos" }].map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white hover:border-white/50 hover:bg-white/5"
            >
              {l.rotulo}
            </a>
          ))}
        </nav>
      </HeroPagina>

      <Secao id="clientes">
        <CabecalhoSecao sobretitulo="Clientes" titulo="Empresas que confiam na MAIS i9" />
        <div className="mt-10">
          <LogosClientes quantidade={12} />
        </div>
      </Secao>

      {grupos.map((g, i) => (
        <Secao key={g.id} id={g.id} fundo={i % 2 === 0 ? "cinza" : "branco"}>
          <CabecalhoSecao sobretitulo="Cases" titulo={g.titulo} descricao={g.descricao} />
          <div className="mt-12">
            <CardsCases tipos={g.tipos} />
          </div>
        </Secao>
      ))}

      <Secao id="depoimentos" fundo="cinza">
        <div className="grid gap-12 lg:grid-cols-12">
          <CabecalhoSecao
            className="lg:col-span-4"
            sobretitulo="Depoimentos"
            titulo="O que dizem os clientes"
            descricao="Depoimentos publicados com autorização de quem os concedeu."
          />
          <div className="lg:col-span-8">
            <Depoimentos />
          </div>
        </div>
      </Secao>

      <CtaFinal titulo="Vamos construir o próximo case juntos?" />
    </>
  );
}
