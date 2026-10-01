import Link from "next/link";
import { db } from "@/lib/db";
import { exigirPagina } from "@/lib/auth/sessao";
import { pode } from "@/lib/auth/permissoes";
import { dia, diaDaSemanaIso, formatarData } from "@/lib/domain/datas";
import { rotuloSemana, semanaDe } from "@/lib/domain/semanas";
import { Cabecalho, Campo, Cartao, Selo, Vazio } from "@/components/ui";
import { BotaoAcao, Formulario } from "@/components/formulario";
import { criarFeriado, excluirFeriado, gerarNacionais } from "./acoes";

export const metadata = { title: "Feriados" };

const DIAS = ["", "seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

export default async function PaginaFeriados({ searchParams }: PageProps<"/admin/feriados">) {
  const u = await exigirPagina("ver", "FERIADOS");
  const editavel = pode(u.perfil, "editar", "FERIADOS");
  const anoAtual = new Date().getUTCFullYear();
  const ano = Number((await searchParams).ano) || anoAtual;
  const feriados = await db.feriado.findMany({ where: { data: { gte: dia(ano, 1, 1), lte: dia(ano, 12, 31) } }, orderBy: { data: "asc" } });
  const uteis = feriados.filter((f) => diaDaSemanaIso(f.data) <= 5).length;

  return (
    <>
      <Cabecalho
        titulo="Feriados"
        subtitulo="Calendário da empresa. Feriados em dias úteis reduzem a capacidade de todos os recursos."
        acoes={
          <div className="flex items-center gap-1 text-sm">
            {[ano - 1, ano, ano + 1].map((a) => (
              <Link key={a} href={`/admin/feriados?ano=${a}`} className={`rounded-md px-3 py-1.5 ${a === ano ? "bg-navy-900 text-white" : "text-ardosia-600 hover:bg-ardosia-100"}`}>
                {a}
              </Link>
            ))}
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Cartao
          titulo={`${feriados.length} feriado(s) em ${ano} · ${uteis} em dia útil`}
          acoes={editavel && <BotaoAcao acao={gerarNacionais.bind(null, ano)} variante="secundario">Gerar nacionais de {ano}</BotaoAcao>}
        >
          {feriados.length === 0 ? (
            <Vazio>Nenhum feriado cadastrado para {ano}.</Vazio>
          ) : (
            <table className="tabela">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Semana</th>
                  <th>Descrição</th>
                  <th>Abrangência</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {feriados.map((f) => {
                  const fds = diaDaSemanaIso(f.data) > 5;
                  return (
                    <tr key={f.id} className={fds ? "text-ardosia-400" : ""}>
                      <td className="tabular-nums">
                        {formatarData(f.data)} <span className="text-xs text-ardosia-500">{DIAS[diaDaSemanaIso(f.data)]}</span>
                      </td>
                      <td className="text-xs">{rotuloSemana(semanaDe(f.data))}</td>
                      <td>{f.descricao}</td>
                      <td>
                        <Selo tom={f.abrangencia === "NACIONAL" ? "navy" : "livre"}>
                          {f.abrangencia === "NACIONAL" ? "Nacional" : [f.abrangencia === "ESTADUAL" ? "Estadual" : "Municipal", f.uf, f.municipio].filter(Boolean).join(" · ")}
                        </Selo>
                      </td>
                      <td className="text-right">
                        {editavel && (
                          <BotaoAcao acao={excluirFeriado.bind(null, f.id)} confirmar={`Excluir ${f.descricao}?`}>
                            Excluir
                          </BotaoAcao>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Cartao>
        {editavel && (
          <Cartao titulo="Incluir feriado">
            <Formulario acao={criarFeriado} rotuloEnviar="Incluir" limparAoSalvar>
              <Campo rotulo="Data">
                <input name="data" type="date" required className="campo" />
              </Campo>
              <Campo rotulo="Descrição">
                <input name="descricao" required className="campo" placeholder="Aniversário da cidade" />
              </Campo>
              <Campo rotulo="Abrangência">
                <select name="abrangencia" defaultValue="MUNICIPAL" className="campo">
                  <option value="NACIONAL">Nacional</option>
                  <option value="ESTADUAL">Estadual</option>
                  <option value="MUNICIPAL">Municipal</option>
                </select>
              </Campo>
              <div className="grid grid-cols-[80px_1fr] gap-3">
                <Campo rotulo="UF">
                  <input name="uf" maxLength={2} className="campo uppercase" />
                </Campo>
                <Campo rotulo="Município">
                  <input name="municipio" className="campo" />
                </Campo>
              </div>
            </Formulario>
          </Cartao>
        )}
      </div>
    </>
  );
}
