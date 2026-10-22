import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { categorias, formatarData, type Artigo, type CategoriaId } from "@/conteudo/insights";

export function CardArtigo({ artigo }: { artigo: Artigo }) {
  const categoria = categorias[artigo.categoria];
  return (
    <article className="revelar group relative flex flex-col rounded-2xl border border-ardosia-200 bg-white p-7 transition-shadow hover:shadow-lg hover:shadow-navy-950/5">
      <div className="flex items-center gap-3 text-xs">
        <Link
          href={`/conteudos/categoria/${artigo.categoria}`}
          className="relative z-10 rounded-full bg-azul-100 px-2.5 py-1 font-semibold text-azul-600 hover:bg-azul-300/40"
        >
          {categoria.nome}
        </Link>
        <span className="text-ardosia-500">{artigo.minutosLeitura} min de leitura</span>
      </div>
      <h3 className="mt-5 text-lg leading-snug font-semibold text-navy-950">
        <Link href={`/conteudos/${artigo.slug}`} className="after:absolute after:inset-0 group-hover:text-azul-600">
          {artigo.titulo}
        </Link>
      </h3>
      <p className="mt-3 text-[15px] leading-relaxed text-ardosia-600">{artigo.resumo}</p>
      <div className="mt-auto flex items-center justify-between pt-6 text-sm">
        <time dateTime={artigo.publicadoEm} className="text-ardosia-500">
          {formatarData(artigo.publicadoEm)}
        </time>
        <ArrowRight aria-hidden className="size-4 text-azul-600 transition-transform group-hover:translate-x-0.5" />
      </div>
    </article>
  );
}

export function FiltroCategorias({ atual }: { atual?: CategoriaId }) {
  const item = (href: string, rotulo: string, ativo: boolean) => (
    <li key={href}>
      <Link
        href={href}
        aria-current={ativo ? "page" : undefined}
        className={clsx(
          "inline-flex rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
          ativo ? "border-navy-900 bg-navy-900 text-white" : "border-ardosia-200 bg-white text-ardosia-700 hover:border-navy-700",
        )}
      >
        {rotulo}
      </Link>
    </li>
  );
  return (
    <nav aria-label="Categorias">
      <ul className="flex flex-wrap gap-2">
        {item("/conteudos", "Todos", !atual)}
        {(Object.keys(categorias) as CategoriaId[]).map((c) => item(`/conteudos/categoria/${c}`, categorias[c].nome, c === atual))}
      </ul>
    </nav>
  );
}
