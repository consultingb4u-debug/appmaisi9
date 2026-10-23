import { artigos, buscarArtigo, categorias } from "@/conteudo/insights";
import { imagemOg, tamanhoOg } from "@/lib/og";

export const dynamic = "force-static";
export const alt = "Conteúdo MAIS i9";
export const size = tamanhoOg;
export const contentType = "image/png";

export function generateStaticParams() {
  return artigos.map((a) => ({ slug: a.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const artigo = buscarArtigo((await params).slug);
  return imagemOg({
    sobretitulo: artigo ? `Conteúdos · ${categorias[artigo.categoria].nome}` : "Conteúdos MAIS i9",
    titulo: artigo?.titulo ?? "Conteúdos MAIS i9",
  });
}
