import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth/sessao";
import { pode } from "@/lib/auth/permissoes";
import { somarDias } from "@/lib/domain/datas";
import { semanaDe, semanasEntre } from "@/lib/domain/semanas";
import { carregarProjeto } from "@/lib/services/projeto";
import { previstas } from "@/lib/services/alocacoes";
import { Cartao, Indicador, Vazio } from "@/components/ui";
import { Formulario } from "@/components/formulario";
import { CamposProjeto } from "@/components/campos-projeto";
import { GradeSemanal, type CelulaGrade } from "@/components/grade-semanal";
import { atualizarProjeto } from "../acoes";

const h = (n: number) => `${Math.round(n * 10) / 10}h`;

export default async function VisaoGeral({ params }: PageProps<"/projetos/[id]">) {
  const { id } = await params;
  const usuario = await usuarioAtual();
  const p = await carregarProjeto(id);
  if (!p) notFound();
  const editavel = pode(usuario.perfil, "editar", "PROJETOS");

  const atual = semanaDe(new Date());
  const semanas = semanasEntre(atual.inicio, somarDias(atual.inicio, 7 * 7));
  const ids = new Set(semanas.map((s) => s.id));
  const proximas = p.alocacoes.filter((a) => ids.has(a.semanaId));
  const recursos = [...new Map(proximas.map((a) => [a.recurso.id, a.recurso])).values()].sort((a, b) => a.nome.localeCompare(b.nome));
  const celulas = new Map<string, CelulaGrade>(proximas.map((a) => [`${a.recursoId}|${a.semanaId}`, { horas: previstas(a), dica: a.observacao ?? undefined }]));
  const futuras = p.alocacoes.filter((a) => a.semana.inicio >= atual.inicio).reduce((t, a) => t + previstas(a), 0);
  const vendidas = p.horasVendidas?.toNumber() ?? null;

  const [clientes, todosRecursos] = editavel
    ? await Promise.all([
        db.cliente.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
        db.recurso.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
      ])
    : [[], []];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador rotulo="Horas vendidas" valor={vendidas === null ? "—" : h(vendidas)} detalhe={vendidas === null ? "não informado no portfólio" : undefined} />
        <Indicador rotulo="Planejado (total)" valor={h(p.horasPlanejadas)} detalhe={vendidas ? `saldo ${h(vendidas - p.horasPlanejadas)}` : undefined} tom={vendidas !== null && p.horasPlanejadas > vendidas ? "critico" : "navy"} />
        <Indicador rotulo="Planejado a partir desta semana" valor={h(futuras)} />
        <Indicador rotulo="Realizado" valor={h(p.horasRealizadas)} detalhe="apontamento por atividade no incremento 4" />
      </div>

      <Cartao titulo="Carga planejada — próximas 8 semanas">
        {recursos.length === 0 ? (
          <Vazio>Nenhuma alocação nas próximas semanas.</Vazio>
        ) : (
          <GradeSemanal linhas={recursos.map((r) => ({ chave: r.id, rotulo: r.nome, href: `/recursos/${r.id}` }))} semanas={semanas} celulas={celulas} />
        )}
      </Cartao>

      {p.notas && (
        <Cartao titulo="Notas · bloqueios · ações">
          <p className="text-sm whitespace-pre-line">{p.notas}</p>
        </Cartao>
      )}

      {editavel && (
        <Cartao titulo="Dados do projeto">
          <Formulario acao={atualizarProjeto.bind(null, p.id)}>
            <CamposProjeto
              v={{ ...p, horasVendidas: vendidas, gpId: p.gpId }}
              clientes={clientes}
              recursos={todosRecursos}
            />
          </Formulario>
        </Cartao>
      )}
    </div>
  );
}
