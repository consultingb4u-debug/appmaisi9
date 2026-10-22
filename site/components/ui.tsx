import clsx from "clsx";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type VarianteBotao = "primario" | "escuro" | "contorno" | "contorno-claro";

const estiloBotao: Record<VarianteBotao, string> = {
  // Laranja com texto navy: contraste AA (o branco sobre laranja não passa).
  primario: "bg-destaque text-navy-950 hover:bg-[#f59b45] shadow-sm shadow-destaque/20",
  escuro: "bg-navy-900 text-white hover:bg-navy-800",
  contorno: "border border-ardosia-200 bg-white text-navy-900 hover:border-navy-700 hover:bg-fundo",
  "contorno-claro": "border border-white/25 text-white hover:border-white/60 hover:bg-white/5",
};

export function Botao({
  href,
  variante = "primario",
  tamanho = "md",
  seta = false,
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & { variante?: VarianteBotao; tamanho?: "md" | "lg"; seta?: boolean }) {
  return (
    <Link
      href={href}
      className={clsx(
        "group inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors",
        tamanho === "lg" ? "px-6 py-3.5 text-[15px]" : "px-4.5 py-2.5 text-sm",
        estiloBotao[variante],
        className,
      )}
      {...props}
    >
      {children}
      {seta && <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />}
    </Link>
  );
}

/** Link de texto com seta, para chamadas secundárias. */
export function LinkSeta({ href, children, claro = false, className }: { href: string; children: ReactNode; claro?: boolean; className?: string }) {
  return (
    <Link
      href={href}
      className={clsx(
        "group inline-flex items-center gap-1.5 text-sm font-semibold",
        claro ? "text-white hover:text-azul-300" : "text-azul-600 hover:text-navy-900",
        className,
      )}
    >
      {children}
      <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export type Fundo = "branco" | "cinza" | "escuro";

export function Secao({
  id,
  fundo = "branco",
  className,
  children,
  ...props
}: { id?: string; fundo?: Fundo; className?: string; children: ReactNode } & ComponentProps<"section">) {
  return (
    <section
      id={id}
      className={clsx(
        "relative py-20 sm:py-24 lg:py-28",
        fundo === "cinza" && "bg-fundo",
        fundo === "escuro" && "grade-tecnica bg-navy-950 text-white",
        className,
      )}
      {...props}
    >
      <div className="container-site">{children}</div>
    </section>
  );
}

/** Sobretítulo curto com marcador laranja. */
export function Sobretitulo({ children, claro = false, className }: { children: ReactNode; claro?: boolean; className?: string }) {
  return (
    <p
      className={clsx(
        "inline-flex items-center gap-2.5 text-xs font-semibold tracking-[0.14em] uppercase",
        claro ? "text-azul-300" : "text-azul-600",
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-[1px] bg-destaque" />
      {children}
    </p>
  );
}

export function CabecalhoSecao({
  sobretitulo,
  titulo,
  descricao,
  centro = false,
  claro = false,
  nivel = 2,
  className,
}: {
  sobretitulo?: string;
  titulo: ReactNode;
  descricao?: ReactNode;
  centro?: boolean;
  claro?: boolean;
  nivel?: 1 | 2;
  className?: string;
}) {
  const Titulo = nivel === 1 ? "h1" : "h2";
  return (
    <div className={clsx("max-w-3xl", centro && "mx-auto text-center", className)}>
      {sobretitulo && <Sobretitulo claro={claro}>{sobretitulo}</Sobretitulo>}
      <Titulo
        className={clsx(
          "mt-4 text-3xl leading-tight font-bold sm:text-4xl",
          nivel === 1 && "lg:text-5xl",
          claro ? "text-white" : "text-navy-950",
        )}
      >
        {titulo}
      </Titulo>
      {descricao && (
        <div className={clsx("mt-5 text-lg leading-relaxed", claro ? "text-ardosia-200" : "text-ardosia-600")}>{descricao}</div>
      )}
    </div>
  );
}

export function ListaCheck({ itens, claro = false, className }: { itens: readonly string[]; claro?: boolean; className?: string }) {
  return (
    <ul className={clsx("space-y-3", className)}>
      {itens.map((item) => (
        <li key={item} className={clsx("flex gap-3 text-[15px] leading-snug", claro ? "text-ardosia-200" : "text-ardosia-700")}>
          <span
            aria-hidden
            className={clsx(
              "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
              claro ? "bg-white/10 text-destaque" : "bg-azul-100 text-azul-600",
            )}
          >
            <Check className="size-3" strokeWidth={3} />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

/**
 * Informação institucional ainda não fornecida. Aparece de forma visível para ser
 * preenchida antes da publicação — nunca substituir por dado inventado.
 */
export function Pendente({ children, claro = false }: { children: ReactNode; claro?: boolean }) {
  return (
    <span
      title="Informação a preencher antes da publicação"
      className={clsx(
        "inline-flex items-center rounded border border-dashed px-1.5 py-0.5 align-middle font-mono text-[0.8em] leading-tight",
        claro ? "border-destaque/60 bg-destaque/10 text-destaque" : "border-destaque-escuro/60 bg-destaque-claro text-[#8a4a0e]",
      )}
    >
      [A preencher: {children}]
    </span>
  );
}

export function JsonLd({ dados }: { dados: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // Escapa "<" para impedir fechamento do <script> por conteúdo (recomendação da documentação do Next).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(dados).replace(/</g, "\\u003c") }}
    />
  );
}

/** Ícone em caixa, usado em cards e listas de diferenciais. */
export function CaixaIcone({ children, claro = false, className }: { children: ReactNode; claro?: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={clsx(
        "flex size-11 shrink-0 items-center justify-center rounded-xl",
        claro ? "bg-white/8 text-azul-300 ring-1 ring-white/10" : "bg-azul-100 text-azul-600",
        className,
      )}
    >
      {children}
    </span>
  );
}
