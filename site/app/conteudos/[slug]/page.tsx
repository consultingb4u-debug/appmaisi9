import { notFound } from "next/navigation";
import { CardArtigo } from "@/components/conteudos";
import { HeroPagina } from "@/components/secoes";
import { Botao, JsonLd } from "@/components/ui";
import { ctaWhatsapp, empresa } from "@/conteudo/empresa";
import { artigos, artigosOrdenados, buscarArtigo, categorias, formatarData } from "@/conteudo/insights";
import { idOrganizacao, trilha } from "@/lib/jsonld";
import { metadadosPagina, urlAbsoluta } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return artigos.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/conteudos/[slug]">) {
  const artigo = buscarArtigo((await params).slug);
  if (!artigo) return {};
  const base = metadadosPagina({ titulo: artigo.titulo, descricao: artigo.resumo, caminho: `/conteudos/${artigo.slug}` });
  return {
    ...base,
    authors: [{ name: artigo.autor }],
    openGraph: { ...base.openGraph, type: "article", publishedTime: artigo.publicadoEm, authors: [artigo.autor] },
  };
}

const chamadas = {
  consultoria: {
    titulo: "Seu Protheus precisa de atenção?",
    texto: "Converse com um especialista e entenda como está o seu ambiente.",
    rotulo: "Solicitar diagnóstico",
    href: ctaWhatsapp("diagnostico"),
  },
  wms: {
    titulo: "Quer ver o MAIS i9 WMS na prática?",
    texto: "Mostramos o WMS aplicado aos processos da sua operação.",
    rotulo: "Agendar demonstração",
    href: ctaWhatsapp("demonstracaoWms"),
  },
  geral: {
    titulo: "Vamos conversar sobre a sua operação?",
    texto: "Consultoria Protheus e gestão de armazéns com a MAIS i9.",
    rotulo: "Falar com a MAIS i9",
    href: ctaWhatsapp("geral"),
  },
};

export default async function Artigo({ params }: PageProps<"/conteudos/[slug]">) {
  const { slug } = await params;
  const artigo = buscarArtigo(slug);
  if (!artigo) notFound();
  const { default: Corpo } = await import(`@/conteudo/artigos/${slug}.mdx`);
  const categoria = categorias[artigo.categoria];
  const chamada = chamadas[categoria.frente];
  const relacionados = artigosOrdenados()
    .filter((a) => a.slug !== artigo.slug)
    .slice(0, 3);
  const caminhoTrilha = [
    { nome: "Início", caminho: "/" },
    { nome: "Conteúdos", caminho: "/conteudos" },
    { nome: categoria.nome, caminho: `/conteudos/categoria/${artigo.categoria}` },
  ];

  const artigoJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: artigo.titulo,
    description: artigo.resumo,
    datePublished: artigo.publicadoEm,
    inLanguage: "pt-BR",
    url: urlAbsoluta(`/conteudos/${artigo.slug}`),
    mainEntityOfPage: urlAbsoluta(`/conteudos/${artigo.slug}`),
    image: urlAbsoluta(`/conteudos/${artigo.slug}/opengraph-image`),
    author: { "@type": "Organization", name: artigo.autor === "Equipe MAIS i9" ? empresa.nome : artigo.autor },
    publisher: { "@id": idOrganizacao },
    articleSection: categoria.nome,
  };

  return (
    <>
      <JsonLd dados={[artigoJsonLd, trilha([...caminhoTrilha, { nome: artigo.titulo, caminho: `/conteudos/${artigo.slug}` }])]} />
      <HeroPagina trilha={caminhoTrilha} sobretitulo={categoria.nome} titulo={artigo.titulo} descricao={artigo.resumo}>
        <p className="text-sm text-ardosia-300">
          {artigo.autor} · <time dateTime={artigo.publicadoEm}>{formatarData(artigo.publicadoEm)}</time> · {artigo.minutosLeitura} min de
          leitura
        </p>
      </HeroPagina>

      <div className="container-site grid gap-12 py-16 sm:py-20 lg:grid-cols-12">
        <article className="artigo lg:col-span-8">
          <Corpo />
        </article>
        <aside className="lg:col-span-4">
          <div className="rounded-2xl bg-navy-950 p-7 text-white lg:sticky lg:top-28">
            <span aria-hidden className="block h-0.5 w-8 bg-destaque" />
            <p className="mt-5 text-xl font-semibold">{chamada.titulo}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-ardosia-300">{chamada.texto}</p>
            <Botao href={chamada.href} seta className="mt-6 w-full">
              {chamada.rotulo}
            </Botao>
          </div>
        </aside>
      </div>

      {relacionados.length > 0 && (
        <section className="bg-fundo py-16 sm:py-20">
          <div className="container-site">
            <h2 className="text-2xl font-bold text-navy-950">Continue lendo</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {relacionados.map((a) => (
                <CardArtigo key={a.slug} artigo={a} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
