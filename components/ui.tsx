import Link from "next/link";
import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";

type Variante = "primario" | "secundario" | "perigo" | "fantasma";

const VARIANTES: Record<Variante, string> = {
  primario: "bg-navy-900 text-white hover:bg-navy-800",
  secundario: "border border-ardosia-200 bg-white text-navy-900 hover:bg-fundo",
  perigo: "border border-critico/30 bg-white text-critico hover:bg-critico/5",
  fantasma: "text-ardosia-600 hover:bg-ardosia-100 hover:text-navy-900",
};

export function classeBotao(variante: Variante = "primario", tamanho: "md" | "sm" = "md") {
  return clsx(
    "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
    tamanho === "md" ? "px-3.5 py-2 text-sm" : "px-2.5 py-1 text-xs",
    VARIANTES[variante],
  );
}

export function Botao({
  variante = "primario",
  tamanho = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variante?: Variante; tamanho?: "md" | "sm" }) {
  return <button className={clsx(classeBotao(variante, tamanho), className)} {...props} />;
}

export function LinkBotao({
  variante = "primario",
  tamanho = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variante?: Variante; tamanho?: "md" | "sm" }) {
  return <Link className={clsx(classeBotao(variante, tamanho), className)} {...props} />;
}

export function Cartao({ titulo, acoes, children, className }: { titulo?: ReactNode; acoes?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={clsx("rounded-lg border border-ardosia-100 bg-white shadow-xs", className)}>
      {(titulo || acoes) && (
        <header className="flex items-center justify-between gap-3 border-b border-ardosia-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-navy-900">{titulo}</h2>
          {acoes}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Cabecalho({ titulo, subtitulo, trilha, acoes }: { titulo: ReactNode; subtitulo?: ReactNode; trilha?: { rotulo: string; href: string }[]; acoes?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {trilha && (
          <nav className="mb-1 text-xs text-ardosia-500">
            {trilha.map((t) => (
              <span key={t.href}>
                <Link href={t.href} className="hover:text-navy-900 hover:underline">
                  {t.rotulo}
                </Link>
                <span className="mx-1.5">›</span>
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-sm text-ardosia-500">{subtitulo}</p>}
      </div>
      {acoes && <div className="flex items-center gap-2">{acoes}</div>}
    </div>
  );
}

type Tom = "neutro" | "ok" | "alerta" | "critico" | "livre" | "destaque" | "navy";

const TONS: Record<Tom, string> = {
  neutro: "bg-ardosia-100 text-ardosia-600",
  ok: "bg-ok/10 text-ok",
  alerta: "bg-alerta/15 text-[#8a6a00]",
  critico: "bg-critico/10 text-critico",
  livre: "bg-livre/10 text-livre",
  destaque: "bg-destaque/15 text-destaque-escuro",
  navy: "bg-navy-900 text-white",
};

export function Selo({ tom = "neutro", children }: { tom?: Tom; children: ReactNode }) {
  return <span className={clsx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", TONS[tom])}>{children}</span>;
}

export function Indicador({ rotulo, valor, detalhe, href, tom = "navy" }: { rotulo: string; valor: ReactNode; detalhe?: ReactNode; href?: string; tom?: "navy" | "ok" | "alerta" | "critico" | "destaque" }) {
  const cor = { navy: "text-navy-900", ok: "text-ok", alerta: "text-[#8a6a00]", critico: "text-critico", destaque: "text-destaque-escuro" }[tom];
  const corpo = (
    <div className="h-full rounded-lg border border-ardosia-100 bg-white p-4 shadow-xs transition hover:border-ardosia-200">
      <div className="text-xs font-medium tracking-wide text-ardosia-500 uppercase">{rotulo}</div>
      <div className={clsx("mt-2 text-3xl font-semibold tabular-nums", cor)}>{valor}</div>
      {detalhe && <div className="mt-1 text-xs text-ardosia-500">{detalhe}</div>}
    </div>
  );
  return href ? <Link href={href}>{corpo}</Link> : corpo;
}

export function Vazio({ children }: { children: ReactNode }) {
  return <div className="rounded-md border border-dashed border-ardosia-200 px-4 py-8 text-center text-sm text-ardosia-500">{children}</div>;
}

export function Campo({ rotulo, children, ajuda, className }: { rotulo: string; children: ReactNode; ajuda?: ReactNode; className?: string }) {
  return (
    <label className={clsx("block", className)}>
      <span className="rotulo">{rotulo}</span>
      {children}
      {ajuda && <span className="mt-1 block text-xs text-ardosia-500">{ajuda}</span>}
    </label>
  );
}
