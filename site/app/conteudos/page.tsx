import { CardArtigo, FiltroCategorias } from "@/components/conteudos";
import { CtaFinal, HeroPagina } from "@/components/secoes";
import { JsonLd, Secao } from "@/components/ui";
import { artigosOrdenados } from "@/conteudo/insights";
import { trilha } from "@/lib/jsonld";
import { metadadosPagina } from "@/lib/site";

export const metadata = metadadosPagina({
  titulo: "Conteúdos e insights",
  descricao:
    "Artigos sobre TOTVS Protheus, gestão de ERP, sustentação e suporte, gestão de armazéns, WMS, integração ERP e WMS, eficiência operacional e transformação digital.",
  caminho: "/conteudos",
});

const caminhoTrilha = [
  { nome: "Início", caminho: "/" },
  { nome: "Conteúdos", caminho: "/conteudos" },
];

export default function Conteudos() {
  const lista = artigosOrdenados();
  return (
    <>
      <JsonLd dados={trilha(caminhoTrilha)} />
      <HeroPagina
        trilha={caminhoTrilha}
        sobretitulo="Conteúdos"
        titulo="Insights sobre ERP, operações e tecnologia."
        descricao="Artigos para gestores de TI, operações, logística e direção sobre TOTVS Protheus, gestão de armazéns e eficiência operacional."
      />
      <Secao>
        <FiltroCategorias />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {lista.map((a) => (
            <CardArtigo key={a.slug} artigo={a} />
          ))}
        </div>
      </Secao>
      <CtaFinal />
    </>
  );
}
