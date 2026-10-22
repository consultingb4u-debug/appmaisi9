import { notFound } from "next/navigation";
import { CardArtigo, FiltroCategorias } from "@/components/conteudos";
import { CtaFinal, HeroPagina } from "@/components/secoes";
import { JsonLd, LinkSeta, Secao } from "@/components/ui";
import { artigosOrdenados, categorias, type CategoriaId } from "@/conteudo/insights";
import { trilha } from "@/lib/jsonld";
import { metadadosPagina } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(categorias).map((categoria) => ({ categoria }));
}

function buscarCategoria(id: string) {
  return id in categorias ? { id: id as CategoriaId, ...categorias[id as CategoriaId] } : null;
}

export async function generateMetadata({ params }: PageProps<"/conteudos/categoria/[categoria]">) {
  const categoria = buscarCategoria((await params).categoria);
  if (!categoria) return {};
  return metadadosPagina({
    titulo: `${categoria.nome} — Conteúdos`,
    descricao: `Artigos da MAIS i9 sobre ${categoria.nome.toLowerCase()}: ${categoria.descricao}`,
    caminho: `/conteudos/categoria/${categoria.id}`,
  });
}

export default async function CategoriaConteudos({ params }: PageProps<"/conteudos/categoria/[categoria]">) {
  const categoria = buscarCategoria((await params).categoria);
  if (!categoria) notFound();
  const lista = artigosOrdenados().filter((a) => a.categoria === categoria.id);
  const caminhoTrilha = [
    { nome: "Início", caminho: "/" },
    { nome: "Conteúdos", caminho: "/conteudos" },
    { nome: categoria.nome, caminho: `/conteudos/categoria/${categoria.id}` },
  ];

  return (
    <>
      <JsonLd dados={trilha(caminhoTrilha)} />
      <HeroPagina trilha={caminhoTrilha} sobretitulo="Conteúdos" titulo={categoria.nome} descricao={categoria.descricao} />
      <Secao>
        <FiltroCategorias atual={categoria.id} />
        {lista.length ? (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lista.map((a) => (
              <CardArtigo key={a.slug} artigo={a} />
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-2xl border border-dashed border-ardosia-300 bg-fundo p-10 text-center">
            <p className="text-lg font-semibold text-navy-950">Novos conteúdos sobre {categoria.nome.toLowerCase()} em breve.</p>
            <p className="mt-2 text-ardosia-600">Enquanto isso, veja os artigos já publicados.</p>
            <LinkSeta href="/conteudos" className="mt-6">
              Ver todos os conteúdos
            </LinkSeta>
          </div>
        )}
      </Secao>
      <CtaFinal />
    </>
  );
}
