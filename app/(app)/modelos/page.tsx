import Link from "next/link";
import { db } from "@/lib/db";
import { exigirPagina } from "@/lib/auth/sessao";
import { listarModelos } from "@/lib/services/modelos";
import { Cabecalho, Cartao, Vazio } from "@/components/ui";
import { BotaoAcao } from "@/components/formulario";
import { excluirModelo } from "../projetos/modelo-acoes";

export const metadata = { title: "Modelos de cronograma" };

export default async function Modelos() {
  const usuario = await exigirPagina("editar", "PROJETOS");
  const modelos = await listarModelos();
  const origens = new Map((await db.projeto.findMany({ where: { id: { in: modelos.map((m) => m.origemProjetoId).filter((x): x is string => !!x) } }, select: { id: true, nome: true, cliente: { select: { nome: true } } } })).map((p) => [p.id, p]));
  return (
    <>
      <Cabecalho titulo="Modelos de cronograma" subtitulo="Backlog e cronograma-padrão por tipo de projeto. Aplique num projeto novo, na aba Cronograma." />
      <Cartao>
        {modelos.length === 0 ? (
          <Vazio>Nenhum modelo. Abra o cronograma de um projeto de referência e use “Salvar como modelo”.</Vazio>
        ) : (
          <div className="-m-4 overflow-x-auto">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Modelo</th>
                  <th className="text-right">Atividades</th>
                  <th className="text-right">Requisitos</th>
                  <th className="text-right">Esforço</th>
                  <th className="text-right">Duração</th>
                  <th>Origem</th>
                  <th>Criado em</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {modelos.map((m) => {
                  const o = m.origemProjetoId ? origens.get(m.origemProjetoId) : null;
                  return (
                    <tr key={m.id}>
                      <td>
                        <div className="font-medium text-navy-900">{m.nome}</div>
                        {m.descricao && <div className="text-xs text-ardosia-500">{m.descricao}</div>}
                      </td>
                      <td className="text-right tabular-nums">{m.atividades}</td>
                      <td className="text-right tabular-nums">{m.requisitos}</td>
                      <td className="text-right tabular-nums">{m.esforco}h</td>
                      <td className="text-right tabular-nums">{m.duracaoDias} dias úteis</td>
                      <td className="text-xs">
                        {o ? (
                          <Link href={`/projetos/${o.id}/cronograma`} className="hover:underline">
                            {o.cliente.nome} · {o.nome}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="text-xs whitespace-nowrap">{m.criadoEm.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</td>
                      <td className="text-right">
                        {(usuario.perfil === "ADMIN" || m.criadoPorId === usuario.id) && (
                          <BotaoAcao acao={excluirModelo.bind(null, m.id)} variante="fantasma" confirmar={`Excluir o modelo "${m.nome}"? Projetos já criados não mudam.`}>
                            Excluir
                          </BotaoAcao>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Cartao>
    </>
  );
}
