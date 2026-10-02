import { usuarioAtual } from "@/lib/auth/sessao";
import { gradeDoMes, lerMes } from "@/lib/domain/calendario";
import { eventosDoPeriodo } from "@/lib/services/calendario";
import { Calendario } from "@/components/calendario";

export default async function CalendarioDoProjeto({ params, searchParams }: PageProps<"/projetos/[id]/calendario">) {
  await usuarioAtual();
  const { id } = await params;
  const { mes: m } = await searchParams;
  const { ano, mes } = lerMes(typeof m === "string" ? m : undefined);
  const grade = gradeDoMes(ano, mes);
  const eventos = await eventosDoPeriodo({ de: grade[0][0].data, ate: grade.at(-1)![6].data, projetoId: id });
  return <Calendario ano={ano} mes={mes} eventos={eventos} base={`/projetos/${id}/calendario`} />;
}
