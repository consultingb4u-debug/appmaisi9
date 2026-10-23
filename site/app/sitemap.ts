import type { MetadataRoute } from "next";
import { artigos, categorias } from "@/conteudo/insights";
import { paginasInstitucionais } from "@/lib/rotas";
import { urlAbsoluta } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...paginasInstitucionais.map((p) => ({ url: urlAbsoluta(p.caminho), priority: p.prioridade })),
    ...Object.keys(categorias).map((c) => ({ url: urlAbsoluta(`/conteudos/categoria/${c}`), priority: 0.4 })),
    ...artigos.map((a) => ({ url: urlAbsoluta(`/conteudos/${a.slug}`), lastModified: a.publicadoEm, priority: 0.6 })),
  ];
}
