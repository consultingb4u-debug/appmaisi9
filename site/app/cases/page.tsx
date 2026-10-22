import { CardsCases, CtaFinal, Depoimentos, HeroPagina, LogosClientes } from "@/components/secoes";
import { CabecalhoSecao, JsonLd, Secao } from "@/components/ui";
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

const secoes = [
  { href: "#clientes", rotulo: "Clientes" },
  { href: "#cases", rotulo: "Cases" },
  { href: "#depoimentos", rotulo: "Depoimentos" },
];

export default function Cases() {
  return (
    <>
      <JsonLd dados={trilha(caminhoTrilha)} />
      <HeroPagina
        trilha={caminhoTrilha}
        sobretitulo="Cases e clientes"
        titulo="Projetos reais, contados com autorização dos nossos clientes."
        descricao="Cases de sustentação, integração e operações com o MAIS i9 WMS, e as empresas que confiam na MAIS i9 para cuidar do seu ERP e da sua logística."
      >
        <nav aria-label="Seções da página" className="flex flex-wrap gap-2">
          {secoes.map((l) => (
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

      <Secao id="cases" fundo="cinza">
        <CabecalhoSecao
          sobretitulo="Cases"
          titulo="Resultados de projetos da MAIS i9"
          descricao="Sustentação do Protheus e integração com o MAIS i9 WMS. Os cases são apresentados sem identificar o cliente; novos cases entram aqui à medida que forem autorizados."
        />
        <div className="mt-12">
          <CardsCases tipos={["implantacao", "evolucao", "sustentacao", "wms"]} />
        </div>
      </Secao>

      <Secao id="depoimentos">
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
