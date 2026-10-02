import Link from "next/link";
import clsx from "clsx";
import { db } from "@/lib/db";
import type { UsuarioAtual } from "@/lib/auth/sessao";
import { BotaoAcao, Formulario } from "./formulario";
import { excluirVisao, salvarVisao } from "@/app/(app)/visoes-acoes";

/** Atalhos de filtros salvos (do usuário e compartilhados) e um formulário para salvar os filtros atuais. */
export async function VisoesSalvas({ tela, base, params, usuario }: { tela: "portfolio" | "capacidade" | "calendario"; base: string; params: Record<string, string | undefined>; usuario: UsuarioAtual }) {
  const visoes = await db.visaoSalva.findMany({
    where: { tela, OR: [{ usuarioId: usuario.id }, { compartilhada: true }] },
    orderBy: [{ compartilhada: "desc" }, { nome: "asc" }],
    include: { usuario: { select: { nome: true } } },
  });
  const atual = new URLSearchParams(Object.entries(params).filter(([k, v]) => v && !["r", "s", "editar", "mes"].includes(k)) as [string, string][]).toString();
  const gestor = usuario.perfil === "ADMIN" || usuario.perfil === "GESTOR";
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
      <span className="text-xs font-medium tracking-wide text-ardosia-500 uppercase">Visões</span>
      {visoes.length === 0 && <span className="text-xs text-ardosia-400">nenhuma salva</span>}
      {visoes.map((v) => (
        <span key={v.id} className={clsx("inline-flex items-center gap-1 rounded-full py-0.5 pr-1 pl-3 ring-1", v.parametros === atual ? "bg-navy-900 text-white ring-navy-900" : "bg-white text-navy-900 ring-ardosia-200")}>
          <Link href={`${base}?${v.parametros}`} title={v.compartilhada ? `Compartilhada por ${v.usuario.nome}` : "Só sua"}>
            {v.compartilhada && "◎ "}
            {v.nome}
          </Link>
          {(v.usuarioId === usuario.id || usuario.perfil === "ADMIN") && (
            <BotaoAcao acao={excluirVisao.bind(null, v.id)} variante="fantasma" confirmar={`Excluir a visão "${v.nome}"?`}>
              ✕
            </BotaoAcao>
          )}
        </span>
      ))}
      {atual && (
        <details className="relative">
          <summary className="cursor-pointer list-none rounded-full px-3 py-0.5 text-xs text-ardosia-600 ring-1 ring-dashed ring-ardosia-300 hover:text-navy-900">+ salvar filtros atuais</summary>
          <div className="absolute z-20 mt-2 w-72 rounded-lg border border-ardosia-100 bg-white p-3 shadow-lg">
            <Formulario acao={salvarVisao.bind(null, tela, atual)} rotuloEnviar="Salvar visão">
              <input name="nome" required placeholder="Ex.: Meus projetos críticos" className="campo" />
              {gestor && (
                <label className="flex items-center gap-2 text-xs text-ardosia-600">
                  <input type="checkbox" name="compartilhada" /> Compartilhar com todos
                </label>
              )}
            </Formulario>
          </div>
        </details>
      )}
    </div>
  );
}
