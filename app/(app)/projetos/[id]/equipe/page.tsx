import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth/sessao";
import { pode } from "@/lib/auth/permissoes";
import { PAPEL_PROJETO, STATUS_ALOCACAO } from "@/lib/domain/rotulos";
import { semanasEntre } from "@/lib/domain/semanas";
import { carregarProjeto } from "@/lib/services/projeto";
import { previstas } from "@/lib/services/alocacoes";
import { Campo, Cartao, Selo, Vazio } from "@/components/ui";
import { BotaoAcao, Formulario } from "@/components/formulario";
import { GradeSemanal, type CelulaGrade } from "@/components/grade-semanal";
import { adicionarMembro, removerMembro } from "../../acoes";

export default async function Equipe({ params }: PageProps<"/projetos/[id]/equipe">) {
  const { id } = await params;
  const usuario = await usuarioAtual();
  const p = await carregarProjeto(id);
  if (!p) notFound();
  const editavel = pode(usuario.perfil, "editar", "PROJETOS");
  const [membros, recursos] = await Promise.all([
    db.projetoMembro.findMany({ where: { projetoId: id }, include: { recurso: { select: { id: true, nome: true, cargo: true } } }, orderBy: [{ papel: "asc" }] }),
    db.recurso.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);

  // Todas as semanas com alocação (histórico + futuro).
  const semanasAloc = p.alocacoes.map((a) => a.semana);
  const semanas = semanasAloc.length
    ? semanasEntre(
        semanasAloc.reduce((m, s) => (s.inicio < m ? s.inicio : m), semanasAloc[0].inicio),
        semanasAloc.reduce((m, s) => (s.fim > m ? s.fim : m), semanasAloc[0].fim),
      )
    : [];
  const pessoas = [...new Map(p.alocacoes.map((a) => [a.recurso.id, a.recurso])).values()].sort((a, b) => a.nome.localeCompare(b.nome));
  const celulas = new Map<string, CelulaGrade>(
    p.alocacoes.map((a) => [
      `${a.recursoId}|${a.semanaId}`,
      {
        horas: previstas(a),
        dica: [STATUS_ALOCACAO[a.status], a.observacao].filter(Boolean).join(" · "),
        destaque: a.status === "BLOQUEADO" ? "critico" : a.status === "AGUARDANDO_CLIENTE" ? "alerta" : a.horasAvulsas.toNumber() > 0 && !a.horasManuais ? "livre" : undefined,
      },
    ]),
  );

  return (
    <div className="space-y-6">
      <Cartao titulo="Membros do projeto">
        {membros.length === 0 ? (
          <Vazio>Nenhum membro definido.</Vazio>
        ) : (
          <table className="tabela">
            <thead>
              <tr>
                <th>Recurso</th>
                <th>Papel</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {membros.map((m) => (
                <tr key={m.id}>
                  <td>
                    <a href={`/recursos/${m.recurso.id}`} className="font-medium text-navy-800 hover:underline">
                      {m.recurso.nome}
                    </a>
                    {m.recurso.cargo && <span className="ml-2 text-xs text-ardosia-500">{m.recurso.cargo}</span>}
                  </td>
                  <td>
                    <Selo tom={m.papel === "GP" ? "navy" : "livre"}>{PAPEL_PROJETO[m.papel]}</Selo>
                  </td>
                  <td className="text-right">
                    {editavel && m.papel !== "GP" && (
                      <BotaoAcao acao={removerMembro.bind(null, m.id)} confirmar={`Remover ${m.recurso.nome} da equipe?`}>
                        Remover
                      </BotaoAcao>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {editavel && (
          <Formulario acao={adicionarMembro.bind(null, id)} rotuloEnviar="Adicionar à equipe" limparAoSalvar className="mt-4 border-t border-ardosia-100 pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo rotulo="Recurso">
                <select name="recursoId" required defaultValue="" className="campo">
                  <option value="" disabled>
                    Escolha…
                  </option>
                  {recursos.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nome}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo rotulo="Papel">
                <select name="papel" defaultValue="FUNCIONAL" className="campo">
                  {Object.entries(PAPEL_PROJETO)
                    .filter(([k]) => k !== "GP")
                    .map(([k, r]) => (
                      <option key={k} value={k}>
                        {r}
                      </option>
                    ))}
                </select>
              </Campo>
            </div>
          </Formulario>
        )}
      </Cartao>

      <Cartao
        titulo="Alocação semanal (horas previstas)"
        acoes={
          <Link href={`/capacidade/planejamento?projeto=${id}&n=12`} className="text-sm text-navy-800 hover:underline">
            Editar planejamento
          </Link>
        }
      >
        {pessoas.length === 0 ? (
          <Vazio>Sem alocação planejada. Use “Editar planejamento”; o rateio automático do cronograma chega no incremento 4.</Vazio>
        ) : (
          <>
            <GradeSemanal linhas={pessoas.map((r) => ({ chave: r.id, rotulo: r.nome, href: `/recursos/${r.id}` }))} semanas={semanas} celulas={celulas} />
            <p className="mt-3 text-xs text-ardosia-500">
              Passe o mouse sobre a célula para ver status e observação. <span className="rounded bg-livre/10 px-1 text-livre">azul</span> = horas de gestão/avulsas,{" "}
              <span className="rounded bg-critico/15 px-1 text-critico">vermelho</span> = bloqueado, <span className="rounded bg-alerta/20 px-1 text-[#8a6a00]">amarelo</span> = aguardando cliente.
            </p>
          </>
        )}
      </Cartao>
    </div>
  );
}
