import { auth } from "@/auth";
import { db } from "@/lib/db";
import { pode } from "@/lib/auth/permissoes";
import { arquivoDoLote } from "@/lib/importacao/ctrl003/servico";

/** Download do arquivo original do lote (rastreabilidade da importação). */
export async function GET(_: Request, { params }: RouteContext<"/admin/importacao/[id]/arquivo">) {
  const sessao = await auth();
  const u = sessao?.user?.id ? await db.usuario.findUnique({ where: { id: sessao.user.id } }) : null;
  if (!u?.ativo || !pode(u.perfil, "ver", "IMPORTACAO")) return new Response("Sem permissão", { status: 403 });
  const { id } = await params;
  const { nome, conteudo } = await arquivoDoLote(id);
  return new Response(new Uint8Array(conteudo), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(nome)}`,
    },
  });
}
