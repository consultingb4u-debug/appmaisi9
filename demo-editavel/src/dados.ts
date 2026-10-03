// Camada de dados: o banco do próprio artefato (capability `db`), com assinatura ao vivo das coleções.
// Fora do claude.ai (arquivo local para teste) usa `window.__DADOS_TESTE` em memória.
import { COLECOES, type Colecao, type Estado } from "./calculo";

declare const React: typeof import("react");

type Doc = { id: string } & Record<string, unknown>;
export type Modo = "carregando" | "banco" | "teste" | "sem-banco";
export type Loja = {
  salvar: (c: Colecao, obj: Doc) => Promise<void>;
  excluir: (c: Colecao, id: string) => Promise<void>;
};

const VAZIO: Estado = { recursos: [], clientes: [], projetos: [], atividades: [], operacional: [], alocacoes: [], indisponibilidades: [] };

type DbLike = {
  collection(p: string): { onSnapshot(n: (s: { docs: { id: string; data(): Record<string, unknown> | undefined }[] }) => void, e?: (err: { code: string; message: string }) => void): () => void; doc(id: string): { set(d: Record<string, unknown>): Promise<void>; delete(): Promise<void> } };
};

/** Garante as listas que as telas percorrem, mesmo em documentos gravados incompletos. */
function normalizar(c: Colecao, doc: Doc): Doc {
  return c === "atividades" && !Array.isArray(doc.atribuicoes) ? { ...doc, atribuicoes: [] } : doc;
}

export function novoId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function useDados(): { estado: Estado; modo: Modo; loja: Loja; erro: string | null; carregadas: number } {
  const [estado, setEstado] = React.useState<Estado>(VAZIO);
  const [modo, setModo] = React.useState<Modo>("carregando");
  const [erro, setErro] = React.useState<string | null>(null);
  const [carregadas, setCarregadas] = React.useState(0);
  const dbRef = React.useRef<DbLike | null>(null);

  React.useEffect(() => {
    const teste = (window as unknown as { __DADOS_TESTE?: Estado }).__DADOS_TESTE;
    const cl = (window as unknown as { claude?: { use(n: string): Promise<unknown> } }).claude;
    if (!cl) {
      if (teste) {
        setEstado(teste);
        setCarregadas(COLECOES.length);
        setModo("teste");
      } else setModo("sem-banco");
      return;
    }
    let ativo = true;
    const parar: (() => void)[] = [];
    cl.use("db").then((db) => {
      if (!ativo) return;
      if (!db) {
        setModo("sem-banco");
        return;
      }
      dbRef.current = db as DbLike;
      setModo("banco");
      const vistas = new Set<string>();
      for (const c of COLECOES) {
        parar.push(
          dbRef.current.collection(c).onSnapshot(
            (snap) => {
              const docs = snap.docs.map((x) => normalizar(c, { ...(x.data() ?? {}), id: x.id }));
              setEstado((e) => ({ ...e, [c]: docs }));
              if (!vistas.has(c)) {
                vistas.add(c);
                setCarregadas(vistas.size);
              }
            },
            (err) => setErro(`Não foi possível ler os dados (${err.code}).`),
          ),
        );
      }
    });
    return () => {
      ativo = false;
      parar.forEach((f) => f());
    };
  }, []);

  const loja: Loja = React.useMemo(
    () => ({
      async salvar(c, obj) {
        const { id, ...corpo } = obj;
        const limpo = JSON.parse(JSON.stringify(corpo)) as Record<string, unknown>;
        if (dbRef.current) {
          try {
            await dbRef.current.collection(c).doc(id).set(limpo);
          } catch (e) {
            const code = (e as { code?: string }).code;
            setErro(code === "invalid_argument" ? "Você pode ver a demo, mas não tem permissão para alterar os dados." : `Não foi possível salvar (${code ?? "erro"}).`);
            throw e;
          }
        } else setEstado((e) => ({ ...e, [c]: [...(e[c] as Doc[]).filter((x) => x.id !== id), { ...limpo, id }] }));
      },
      async excluir(c, id) {
        if (dbRef.current) {
          try {
            await dbRef.current.collection(c).doc(id).delete();
          } catch (e) {
            setErro(`Não foi possível excluir (${(e as { code?: string }).code ?? "erro"}).`);
            throw e;
          }
        } else setEstado((e) => ({ ...e, [c]: (e[c] as Doc[]).filter((x) => x.id !== id) }));
      },
    }),
    [],
  );

  return { estado, modo, loja, erro, carregadas };
}
