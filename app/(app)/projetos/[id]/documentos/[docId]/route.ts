import { auth } from "@/auth";
import { db } from "@/lib/db";
import { pode } from "@/lib/auth/permissoes";
import { lerArquivo } from "@/lib/storage";

/** Download de um documento enviado ao projeto. */
export async function GET(_: Request, { params }: RouteContext<"/projetos/[id]/documentos/[docId]">) {
  const sessao = await auth();
  const u = sessao?.user?.id ? await db.usuario.findUnique({ where: { id: sessao.user.id } }) : null;
  if (!u?.ativo || !pode(u.perfil, "ver", "PROJETOS")) return new Response("Sem permissão", { status: 403 });
  const { id, docId } = await params;
  const d = await db.documento.findFirst({ where: { id: docId, projetoId: id } });
  if (!d) return new Response("Não encontrado", { status: 404 });
  if (d.tipo === "LINK" || !d.arquivoChave) return Response.redirect(d.url!, 302);
  const conteudo = await lerArquivo(d.arquivoChave);
  return new Response(new Uint8Array(conteudo), {
    headers: {
      "Content-Type": d.mimeType ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(d.arquivoNome ?? "arquivo")}`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
