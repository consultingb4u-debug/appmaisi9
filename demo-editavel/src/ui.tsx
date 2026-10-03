// Peças visuais da demo, no padrão do app (navy, ardósia, laranja de destaque, semáforo).
declare const React: typeof import("react");
type Filhos = { children?: React.ReactNode };

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export type Tom = "neutro" | "ok" | "alerta" | "critico" | "livre" | "destaque" | "navy";
const TONS: Record<Tom, string> = {
  neutro: "bg-ardosia-100 text-ardosia-600",
  ok: "bg-ok/10 text-ok",
  alerta: "bg-alerta/15 text-alertaTexto",
  critico: "bg-critico/10 text-critico",
  livre: "bg-livre/10 text-livre",
  destaque: "bg-destaque/15 text-destaqueEscuro",
  navy: "bg-navy-900 text-white",
};

export function Selo({ tom = "neutro", children }: { tom?: Tom } & Filhos) {
  return <span className={cx("inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium", TONS[tom])}>{children}</span>;
}

type Var = "primario" | "secundario" | "perigo" | "fantasma";
const VARS: Record<Var, string> = {
  primario: "bg-navy-900 text-white hover:bg-navy-800",
  secundario: "border border-ardosia-200 bg-white text-navy-900 hover:bg-fundo",
  perigo: "border border-critico/30 bg-white text-critico hover:bg-critico/5",
  fantasma: "text-ardosia-600 hover:bg-ardosia-100 hover:text-navy-900",
};
export function Botao({ variante = "primario", pequeno = false, className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Var; pequeno?: boolean }) {
  return (
    <button
      type="button"
      {...p}
      className={cx("inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-destaque disabled:cursor-not-allowed disabled:opacity-50", pequeno ? "px-2.5 py-1 text-xs" : "px-3.5 py-2 text-sm", VARS[variante], className)}
    />
  );
}

export function Cartao({ titulo, acoes, children, className }: { titulo?: React.ReactNode; acoes?: React.ReactNode; className?: string } & Filhos) {
  return (
    <section className={cx("min-w-0 rounded-lg border border-ardosia-100 bg-white shadow-sm", className)}>
      {(titulo || acoes) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ardosia-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-navy-900">{titulo}</h2>
          {acoes}
        </header>
      )}
      <div className="overflow-x-auto p-4">{children}</div>
    </section>
  );
}

export function Indicador({ rotulo, valor, detalhe, tom = "navy", onClick }: { rotulo: string; valor: React.ReactNode; detalhe?: React.ReactNode; tom?: "navy" | "ok" | "alerta" | "critico"; onClick?: () => void }) {
  const cor = { navy: "text-navy-900", ok: "text-ok", alerta: "text-alertaTexto", critico: "text-critico" }[tom];
  const Tag = onClick ? "button" : "div";
  return (
    <Tag type={onClick ? "button" : undefined} onClick={onClick} className={cx("h-full rounded-lg border border-ardosia-100 bg-white p-4 text-left shadow-sm", onClick && "transition hover:border-ardosia-200")}>
      <div className="text-xs font-medium uppercase tracking-wide text-ardosia-500">{rotulo}</div>
      <div className={cx("mt-2 text-3xl font-semibold", cor)}>{valor}</div>
      {detalhe && <div className="mt-1 text-xs text-ardosia-500">{detalhe}</div>}
    </Tag>
  );
}

export function Campo({ rotulo, children, className, ajuda }: { rotulo: string; className?: string; ajuda?: string } & Filhos) {
  return (
    <label className={cx("block min-w-0", className)}>
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ardosia-600">{rotulo}</span>
      {children}
      {ajuda && <span className="mt-1 block text-xs text-ardosia-500">{ajuda}</span>}
    </label>
  );
}
export const CAMPO = "w-full min-w-0 rounded-md border border-ardosia-200 bg-white px-3 py-2 text-sm text-navy-950 shadow-sm outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/15";

export function Opcoes({ mapa }: { mapa: Record<string, string> }) {
  return (
    <>
      {Object.entries(mapa).map(([k, v]) => (
        <option key={k} value={k}>
          {v}
        </option>
      ))}
    </>
  );
}

export function Vazio({ children }: Filhos) {
  return <div className="rounded-md border border-dashed border-ardosia-200 px-4 py-8 text-center text-sm text-ardosia-500">{children}</div>;
}

/** Painel lateral para formulários (fecha no ✕ ou no fundo escuro). */
export function Painel({ titulo, aoFechar, children, rodape }: { titulo: string; aoFechar: () => void; rodape?: React.ReactNode } & Filhos) {
  React.useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && aoFechar();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [aoFechar]);
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-navy-950/40" onClick={aoFechar} />
      <aside className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl" role="dialog" aria-label={titulo}>
        <header className="flex items-center justify-between border-b border-ardosia-100 px-5 py-4">
          <h2 className="text-base font-semibold text-navy-900">{titulo}</h2>
          <button type="button" onClick={aoFechar} className="rounded p-1 text-ardosia-500 hover:bg-ardosia-100" aria-label="Fechar">
            ✕
          </button>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">{children}</div>
        {rodape && <footer className="flex flex-wrap items-center gap-2 border-t border-ardosia-100 px-5 py-3">{rodape}</footer>}
      </aside>
    </div>
  );
}

/** Excluir em dois cliques (o viewer não mostra confirm()). */
export function BotaoExcluir({ aoConfirmar, rotulo = "Excluir" }: { aoConfirmar: () => void; rotulo?: string }) {
  const [armado, setArmado] = React.useState(false);
  React.useEffect(() => {
    if (!armado) return;
    const t = setTimeout(() => setArmado(false), 4000);
    return () => clearTimeout(t);
  }, [armado]);
  return armado ? (
    <Botao variante="perigo" pequeno onClick={aoConfirmar}>
      Confirmar exclusão
    </Botao>
  ) : (
    <Botao variante="fantasma" pequeno onClick={() => setArmado(true)}>
      {rotulo}
    </Botao>
  );
}

export function Barra({ valor, tom = "ok" }: { valor: number; tom?: "ok" | "critico" | "navy" }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-ardosia-100">
      <div className={cx("h-full", { ok: "bg-ok", critico: "bg-critico", navy: "bg-navy-700" }[tom])} style={{ width: `${Math.max(0, Math.min(100, valor))}%` }} />
    </div>
  );
}

export const h = (n: number | null | undefined) => (n == null ? "—" : `${Math.round(n * 10) / 10}h`);
export const dataBR = (s: string | null | undefined) => (s ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : "—");
