import clsx from "clsx";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/** Links externos (ex.: WhatsApp) abrem em nova aba. */
export function propsDestino(href: ComponentProps<typeof Link>["href"]) {
  return typeof href === "string" && /^https?:/.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {};
}

/** `Link` que abre destinos externos (ex.: WhatsApp) em nova aba. */
export function LinkDestino({ href, ...props }: ComponentProps<typeof Link>) {
  return <Link href={href} {...propsDestino(href)} {...props} />;
}

type VarianteBotao = "primario" | "escuro" | "contorno" | "contorno-claro";

const estiloBotao: Record<VarianteBotao, string> = {
  // Laranja com texto navy: contraste AA (o branco sobre laranja não passa).
  primario:
    "bg-destaque text-navy-950 shadow-[0_10px_28px_-10px_rgb(242_140_40/0.7)] hover:bg-[#f59b45] hover:shadow-[0_14px_32px_-10px_rgb(242_140_40/0.85)]",
  escuro: "bg-navy-900 text-white shadow-[0_10px_24px_-12px_rgb(10_26_48/0.6)] hover:bg-navy-800",
  contorno: "border border-ardosia-200 bg-white text-navy-900 hover:border-navy-700 hover:bg-fundo",
  "contorno-claro": "border border-white/20 bg-white/[0.04] text-white hover:border-white/45 hover:bg-white/10",
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
      {...propsDestino(href)}
      className={clsx(
        "group inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-200 active:translate-y-px",
        tamanho === "lg" ? "px-7 py-3.5 text-[15px]" : "px-5 py-2.5 text-sm",
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
      {...propsDestino(href)}
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
        "inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1 text-[13px] leading-snug font-medium ring-1",
        claro ? "bg-white/[0.06] text-azul-300 ring-white/12" : "bg-azul-100/70 text-azul-600 ring-azul-600/10",
        className,
      )}
    >
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-destaque shadow-[0_0_0_3px_rgb(242_140_40/0.18)]" />
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
          "mt-5 text-[2rem] leading-[1.12] font-bold sm:text-4xl lg:text-[2.6rem]",
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
 * preenchida antes da publicação. Nunca substituir por dado inventado.
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
        "flex size-11 shrink-0 items-center justify-center rounded-2xl ring-1",
        claro
          ? "bg-linear-to-b from-white/12 to-white/[0.03] text-azul-300 ring-white/12"
          : "bg-linear-to-b from-azul-100 to-white text-azul-600 shadow-sm ring-azul-600/10",
        className,
      )}
    >
      {children}
    </span>
  );
}
