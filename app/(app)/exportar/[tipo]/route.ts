import { auth } from "@/auth";
import { db } from "@/lib/db";
import { pode, type Modulo } from "@/lib/auth/permissoes";
import { chaveDia } from "@/lib/domain/datas";
import { gerarXlsx, respostaXlsx, type Aba } from "@/lib/exportacao/xlsx";
import { exportarBacklog, exportarCapacidade, exportarCronograma, exportarOperacional, exportarPortfolio, exportarTestes } from "@/lib/exportacao/relatorios";

const EXPORTACOES: Record<string, { modulo: Modulo; projeto?: boolean; gerar: (p: Record<string, string | undefined>) => Promise<Aba[]> }> = {
  portfolio: { modulo: "PORTFOLIO", gerar: exportarPortfolio },
  capacidade: { modulo: "CAPACIDADE", gerar: exportarCapacidade },
  cronograma: { modulo: "PROJETOS", projeto: true, gerar: (p) => exportarCronograma(p.projeto!) },
  backlog: { modulo: "PROJETOS", projeto: true, gerar: (p) => exportarBacklog(p.projeto!) },
  operacional: { modulo: "PROJETOS", projeto: true, gerar: (p) => exportarOperacional(p.projeto!) },
  testes: { modulo: "PROJETOS", projeto: true, gerar: (p) => exportarTestes(p.projeto!, "INTERNO") },
  uat: { modulo: "PROJETOS", projeto: true, gerar: (p) => exportarTestes(p.projeto!, "UAT") },
};

/** Download em Excel das listas: /exportar/portfolio?status=todos, /exportar/cronograma?projeto=<id>… */
export async function GET(req: Request, { params }: RouteContext<"/exportar/[tipo]">) {
  const sessao = await auth();
  const u = sessao?.user?.id ? await db.usuario.findUnique({ where: { id: sessao.user.id } }) : null;
  if (!u?.ativo) return new Response("Faça login.", { status: 401 });
  const { tipo } = await params;
  const e = EXPORTACOES[tipo];
  if (!e) return new Response("Exportação desconhecida.", { status: 404 });
  if (!pode(u.perfil, "ver", e.modulo)) return new Response("Sem permissão.", { status: 403 });
  const p = Object.fromEntries([...new URL(req.url).searchParams.entries()].filter(([, v]) => v)) as Record<string, string | undefined>;
  let sufixo = "";
  if (e.projeto) {
    const projeto = p.projeto ? await db.projeto.findUnique({ where: { id: p.projeto }, select: { codigo: true } }).catch(() => null) : null;
    if (!projeto) return new Response("Projeto não encontrado.", { status: 404 });
    sufixo = `-${projeto.codigo}`;
  }
  const arquivo = await gerarXlsx(await e.gerar(p));
  return respostaXlsx(arquivo, `${tipo}${sufixo}-${chaveDia(new Date())}.xlsx`);
}
