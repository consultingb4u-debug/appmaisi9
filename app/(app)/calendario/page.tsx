import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth/sessao";
import { gradeDoMes, lerMes } from "@/lib/domain/calendario";
import { STATUS_ATIVOS } from "@/lib/domain/rotulos";
import { eventosDoPeriodo } from "@/lib/services/calendario";
import { Cabecalho } from "@/components/ui";
import { Calendario } from "@/components/calendario";
import { VisoesSalvas } from "@/components/visoes-salvas";

export const metadata = { title: "Calendário" };

export default async function PaginaCalendario({ searchParams }: PageProps<"/calendario">) {
  const usuario = await usuarioAtual();
  const sp = await searchParams;
  const p = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, typeof v === "string" && v ? v : undefined])) as Record<string, string | undefined>;
  const { ano, mes } = lerMes(p.mes);
  const [meuRecurso, projetos, recursos] = await Promise.all([
    db.recurso.findUnique({ where: { usuarioId: usuario.id }, select: { id: true } }),
    db.projeto.findMany({ where: { arquivadoEm: null, status: { in: STATUS_ATIVOS } }, orderBy: [{ cliente: { nome: "asc" } }, { nome: "asc" }], select: { id: true, nome: true, cliente: { select: { nome: true } } } }),
    db.recurso.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);
  // Consultor vinculado a um recurso começa vendo a própria agenda; "todos" mostra tudo.
  const recursoId = p.recurso === "todos" ? undefined : (p.recurso ?? (usuario.perfil === "CONSULTOR" ? meuRecurso?.id : undefined));
  const grade = gradeDoMes(ano, mes);
  const eventos = await eventosDoPeriodo({ de: grade[0][0].data, ate: grade.at(-1)![6].data, projetoId: p.projeto, recursoId });

  return (
    <>
      <Cabecalho titulo="Calendário" subtitulo="Marcos, entregas, Go Lives, prazos do Operacional, feriados e ausências" />
      <VisoesSalvas tela="calendario" base="/calendario" params={{ projeto: p.projeto, recurso: p.recurso }} usuario={usuario} />
      <form className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-ardosia-100 bg-white p-3 text-sm">
        <input type="hidden" name="mes" value={`${ano}-${String(mes).padStart(2, "0")}`} />
        <select name="projeto" defaultValue={p.projeto ?? ""} className="campo w-auto py-1.5">
          <option value="">Todos os projetos ativos</option>
          {projetos.map((x) => (
            <option key={x.id} value={x.id}>
              {x.cliente.nome} · {x.nome}
            </option>
          ))}
        </select>
        <select name="recurso" defaultValue={recursoId ?? "todos"} className="campo w-auto py-1.5">
          <option value="todos">Todos os recursos</option>
          {recursos.map((r) => (
            <option key={r.id} value={r.id}>
              {r.id === meuRecurso?.id ? `${r.nome} (eu)` : r.nome}
            </option>
          ))}
        </select>
        <button className="rounded-md bg-navy-900 px-3 py-1.5 text-white">Filtrar</button>
      </form>
      <Calendario ano={ano} mes={mes} eventos={eventos} base="/calendario" params={{ projeto: p.projeto, recurso: p.recurso }} />
    </>
  );
}
