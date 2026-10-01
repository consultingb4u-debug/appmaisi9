import Link from "next/link";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth/sessao";
import { formatarData, somarDias } from "@/lib/domain/datas";
import { rotuloSemana, semanaDe, semanasEntre } from "@/lib/domain/semanas";
import { capacidadePorSemana } from "@/lib/services/capacidade";
import { Cabecalho, Cartao, Indicador, Selo } from "@/components/ui";

const ENTREGAS = [
  { n: 1, titulo: "Fundação", itens: "Login Microsoft 365, perfis, cadastros, calendário, auditoria", feito: true },
  { n: 2, titulo: "Portfólio e projetos", itens: "Portfólio, página do projeto, importação do CTRL-003" },
  { n: 3, titulo: "Capacidade", itens: "Planejamento semanal, indisponibilidades, mapa de carga, página do recurso" },
  { n: 4, titulo: "Cronograma", itens: "Backlog, cronograma, Gantt, rateio automático, importação do CTRL-001" },
  { n: 5, titulo: "Execução", itens: "Pré-projeto, complexidade, RAID, testes, UAT, deployment" },
  { n: 6, titulo: "Status e dashboard", itens: "Status reports, documentos, dashboard executivo final" },
];

export default async function Inicio({ searchParams }: PageProps<"/">) {
  const usuario = await usuarioAtual();
  const { aviso } = await searchParams;
  const atual = semanaDe(new Date());
  const semanas = semanasEntre(atual.inicio, somarDias(atual.inicio, 7 * 3));
  const [recursos, clientes, usuarios, feriados] = await Promise.all([
    db.recurso.findMany({ where: { ativo: true }, select: { id: true } }),
    db.cliente.count({ where: { ativo: true } }),
    db.usuario.count({ where: { ativo: true } }),
    db.feriado.findMany({ where: { data: { gte: atual.inicio } }, orderBy: { data: "asc" }, take: 5 }),
  ]);
  const caps = await capacidadePorSemana(recursos.map((r) => r.id), semanas);
  const total = (semanaId: string) => recursos.reduce((t, r) => t + (caps.get(r.id)?.get(semanaId)?.liquida ?? 0), 0);
  const brutaAtual = recursos.reduce((t, r) => t + (caps.get(r.id)?.get(atual.id)?.bruta ?? 0), 0);

  return (
    <>
      <Cabecalho titulo={`Olá, ${usuario.nome.split(" ")[0]}`} subtitulo={`Semana ${rotuloSemana(atual)} · ${formatarData(atual.inicio)} a ${formatarData(atual.fim)}`} />

      {aviso === "sem-permissao" && (
        <div className="mb-6 rounded-md border border-alerta/40 bg-alerta/10 px-4 py-3 text-sm text-[#8a6a00]">
          Seu perfil não tem acesso à página solicitada. Fale com um administrador se precisar.
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador rotulo="Recursos ativos" valor={recursos.length} href="/recursos" />
        <Indicador
          rotulo={`Capacidade líquida ${rotuloSemana(atual)}`}
          valor={`${total(atual.id)}h`}
          detalhe={brutaAtual !== total(atual.id) ? `bruta ${brutaAtual}h − feriados` : "sem feriados na semana"}
          href="/recursos"
        />
        <Indicador rotulo="Clientes ativos" valor={clientes} href="/clientes" />
        <Indicador rotulo="Usuários com acesso" valor={usuarios} href="/admin/usuarios" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Cartao titulo="Capacidade da equipe — próximas semanas">
          <div className="grid grid-cols-4 gap-3">
            {semanas.map((s) => (
              <div key={s.id} className="rounded-md bg-fundo px-3 py-3 text-center">
                <div className="text-xs font-medium text-ardosia-500">{rotuloSemana(s)}</div>
                <div className="text-xl font-semibold tabular-nums">{total(s.id)}h</div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-ardosia-500">
            Próximos feriados:{" "}
            {feriados.length === 0
              ? "nenhum cadastrado"
              : feriados.map((f) => `${formatarData(f.data).slice(0, 5)} ${f.descricao}`).join(" · ")}{" "}
            · <Link href="/admin/feriados" className="underline">ver calendário</Link>
          </div>
        </Cartao>

        <Cartao titulo="Entregas do sistema">
          <ol className="space-y-2">
            {ENTREGAS.map((e) => (
              <li key={e.n} className="flex items-start gap-3 text-sm">
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${e.feito ? "bg-ok text-white" : "bg-ardosia-100 text-ardosia-600"}`}>{e.n}</span>
                <div>
                  <span className="font-medium">{e.titulo}</span> {e.feito && <Selo tom="ok">disponível</Selo>}
                  <div className="text-xs text-ardosia-500">{e.itens}</div>
                </div>
              </li>
            ))}
          </ol>
        </Cartao>
      </div>
    </>
  );
}
