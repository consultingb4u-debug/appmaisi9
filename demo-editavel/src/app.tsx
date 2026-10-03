// Demo interativa do app MAIS i9: mesmas regras do sistema, dados salvos no banco do artefato.
declare const React: typeof import("react");
declare const ReactDOM: typeof import("react-dom/client");
import { calcular, COLECOES } from "./calculo";
import { useDados } from "./dados";
import { formatarData, rotuloSemana } from "./dominio";
import { FormProjeto, TelaProjeto } from "./projeto";
import { Alertas, Capacidade, Inicio, Portfolio, Recursos } from "./telas";
import { cx, Vazio } from "./ui";

type Tela = "inicio" | "portfolio" | "projeto" | "capacidade" | "recursos" | "alertas";
const MENU: [Tela, string, string][] = [
  ["inicio", "Início", "◧"],
  ["portfolio", "Portfólio", "▤"],
  ["capacidade", "Capacidade", "▦"],
  ["recursos", "Recursos", "◉"],
  ["alertas", "Alertas", "⚑"],
];
const TITULO: Record<Tela, string> = { inicio: "Painel", portfolio: "Portfólio", projeto: "Projeto", capacidade: "Capacidade", recursos: "Recursos e indisponibilidades", alertas: "Alertas" };

function lerTela(): Tela {
  try {
    const t = localStorage.getItem("maisi9-demo-tela") as Tela | null;
    return t && t !== "projeto" && TITULO[t] ? t : "inicio";
  } catch {
    return "inicio";
  }
}

function App() {
  const { estado, modo, loja, erro, carregadas } = useDados();
  const [tela, setTela] = React.useState<Tela>(lerTela);
  const [projetoId, setProjetoId] = React.useState<string | null>(null);
  const [novoProjeto, setNovoProjeto] = React.useState(false);
  const hoje = React.useMemo(() => new Date(), []);
  const calc = React.useMemo(() => calcular(estado, hoje), [estado, hoje]);
  const ir = React.useCallback((t: string, id?: string) => {
    setTela(t as Tela);
    setProjetoId(id ?? null);
    try {
      if (t !== "projeto") localStorage.setItem("maisi9-demo-tela", t);
    } catch {
      /* armazenamento indisponível */
    }
    window.scrollTo(0, 0);
  }, []);
  const projeto = projetoId ? calc.projetosPorId.get(projetoId) : undefined;
  const pronto = modo === "teste" || (modo === "banco" && carregadas === COLECOES.length);
  const semDados = pronto && estado.projetos.length === 0 && estado.recursos.length === 0;

  return (
    <div className="flex min-h-full">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col bg-navy-900 py-5 md:flex">
        <div className="px-5">
          <div className="text-lg font-bold text-white">
            MAIS <span className="text-destaque">i9</span>
          </div>
          <div className="text-[11px] uppercase tracking-wider text-ardosia-400">Gestão de projetos · demo</div>
        </div>
        <nav className="mt-6 space-y-0.5 px-3">
          {MENU.map(([t, r, i]) => (
            <button key={t} type="button" onClick={() => ir(t)} className={cx("flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm", tela === t || (t === "portfolio" && tela === "projeto") ? "bg-white/10 font-medium text-white" : "text-ardosia-200 hover:bg-white/5 hover:text-white")}>
              <span className={cx("w-4 text-center", (tela === t || (t === "portfolio" && tela === "projeto")) && "text-destaque")}>{i}</span>
              {r}
              {t === "alertas" && calc.alertas.length > 0 && <span className="ml-auto rounded-full bg-destaque px-1.5 text-[11px] font-semibold text-white">{calc.alertas.length}</span>}
            </button>
          ))}
        </nav>
        <p className="mt-auto px-5 text-[11px] leading-relaxed text-ardosia-400">Demonstração: sem login, importação de planilhas ou e-mails. Regras de cálculo iguais às do sistema.</p>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-2 overflow-x-auto bg-navy-900 px-4 py-2 md:hidden">
          <span className="mr-2 font-bold text-white">
            MAIS <span className="text-destaque">i9</span>
          </span>
          {MENU.map(([t, r]) => (
            <button key={t} type="button" onClick={() => ir(t)} className={cx("whitespace-nowrap rounded px-2 py-1 text-xs", tela === t ? "bg-white/15 text-white" : "text-ardosia-200")}>
              {r}
            </button>
          ))}
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8">
          {tela !== "projeto" && (
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight text-navy-900">{TITULO[tela]}</h1>
              <p className="mt-1 text-sm text-ardosia-500">
                Hoje {formatarData(hoje)} · semana {rotuloSemana(calc.atual)}
                {modo === "banco" && " · alterações salvas automaticamente"}
                {modo === "teste" && " · modo de teste local (nada é salvo)"}
              </p>
            </div>
          )}
          {erro && <div className="mb-4 rounded-md border border-critico/30 bg-critico/5 px-4 py-3 text-sm text-critico">{erro}</div>}
          {modo === "sem-banco" ? (
            <Vazio>Para editar, abra esta demo pelo link no claude.ai com sua conta: os dados ficam guardados no banco do próprio link.</Vazio>
          ) : !pronto ? (
            <Vazio>Carregando projetos, recursos e cronogramas…</Vazio>
          ) : semDados ? (
            <Vazio>Ainda não há dados nesta demo. Peça ao Claude para carregar os dados das planilhas, ou comece cadastrando recursos e projetos.</Vazio>
          ) : tela === "projeto" && projeto ? (
            <TelaProjeto projeto={projeto} estado={estado} calc={calc} loja={loja} voltar={() => ir("portfolio")} />
          ) : tela === "portfolio" || tela === "projeto" ? (
            <Portfolio calc={calc} ir={ir} aoNovo={() => setNovoProjeto(true)} />
          ) : tela === "capacidade" ? (
            <Capacidade calc={calc} estado={estado} loja={loja} ir={ir} />
          ) : tela === "recursos" ? (
            <Recursos estado={estado} calc={calc} loja={loja} />
          ) : tela === "alertas" ? (
            <Alertas calc={calc} ir={ir} />
          ) : (
            <Inicio calc={calc} estado={estado} ir={ir} />
          )}
        </main>
      </div>
      {novoProjeto && <FormProjeto projeto={null} estado={estado} loja={loja} aoFechar={() => setNovoProjeto(false)} aoCriar={(id) => ir("projeto", id)} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("raiz")!).render(<App />);
