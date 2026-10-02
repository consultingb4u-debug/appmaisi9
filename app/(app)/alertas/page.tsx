import Link from "next/link";
import clsx from "clsx";
import { db } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth/sessao";
import { pode } from "@/lib/auth/permissoes";
import { ROTULO_ALERTA, type TipoAlerta } from "@/lib/domain/alertas";
import { alertasParaUsuario, alertasVigentes } from "@/lib/services/alertas";
import { emailConfigurado } from "@/lib/email";
import { Cabecalho, Cartao, Selo, Vazio } from "@/components/ui";
import { BotaoAcao } from "@/components/formulario";
import { alternarEmail, rodarRotinaAgora } from "./acoes";

export const metadata = { title: "Alertas" };

export default async function Alertas({ searchParams }: PageProps<"/alertas">) {
  const usuario = await usuarioAtual();
  const { ver, tipo } = await searchParams;
  const gestor = usuario.perfil === "ADMIN" || usuario.perfil === "GESTOR";
  const todos = gestor && ver === "todos";
  const [lista, u, enviados] = await Promise.all([
    todos ? alertasVigentes() : alertasParaUsuario(usuario),
    db.usuario.findUniqueOrThrow({ where: { id: usuario.id }, select: { notificarEmail: true, recurso: { select: { nome: true } } } }),
    db.notificacaoEnviada.findMany({ where: { usuarioId: usuario.id }, select: { chave: true, enviadoEm: true } }),
  ]);
  const enviadoEm = new Map(enviados.map((e) => [e.chave, e.enviadoEm]));
  const filtrados = typeof tipo === "string" ? lista.filter((a) => a.tipo === tipo) : lista;
  const contagem = (t: string) => lista.filter((a) => a.tipo === t).length;
  const link = (extra: Record<string, string | undefined>) => {
    const q = new URLSearchParams(Object.entries({ ver: todos ? "todos" : undefined, tipo: typeof tipo === "string" ? tipo : undefined, ...extra }).filter(([, v]) => v) as [string, string][]);
    return `/alertas${q.size ? `?${q}` : ""}`;
  };

  return (
    <>
      <Cabecalho
        titulo="Alertas"
        subtitulo={todos ? "Todos os alertas do sistema" : u.recurso ? `Alertas para ${u.recurso.nome}${gestor ? " e de gestão" : ""}` : gestor ? "Alertas de gestão" : "Seu usuário não está ligado a um recurso: peça ao administrador para vincular."}
        acoes={
          gestor && (
            <div className="flex rounded-md border border-ardosia-200 bg-white p-0.5 text-sm">
              <Link href="/alertas" className={clsx("rounded px-3 py-1", !todos ? "bg-navy-900 text-white" : "text-ardosia-600")}>
                Meus
              </Link>
              <Link href="/alertas?ver=todos" className={clsx("rounded px-3 py-1", todos ? "bg-navy-900 text-white" : "text-ardosia-600")}>
                Todos
              </Link>
            </div>
          )
        }
      />
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link href={link({ tipo: undefined })} className={clsx("rounded-full px-3 py-1", typeof tipo !== "string" ? "bg-navy-900 text-white" : "bg-white text-ardosia-600 ring-1 ring-ardosia-200")}>
          Todos <span className="ml-1 text-xs opacity-70">{lista.length}</span>
        </Link>
        {(Object.keys(ROTULO_ALERTA) as TipoAlerta[]).map((t) => (
          <Link key={t} href={link({ tipo: t })} className={clsx("rounded-full px-3 py-1", tipo === t ? "bg-navy-900 text-white" : "bg-white text-ardosia-600 ring-1 ring-ardosia-200")}>
            {ROTULO_ALERTA[t]} <span className="ml-1 text-xs opacity-70">{contagem(t)}</span>
          </Link>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Cartao titulo={`${filtrados.length} alerta(s)`}>
          {filtrados.length === 0 ? (
            <Vazio>Nada pendente. Atrasos, pendências vencidas, sobrecargas, ausências a aprovar e status reports atrasados aparecem aqui.</Vazio>
          ) : (
            <ul className="-my-2 divide-y divide-ardosia-100">
              {filtrados.map((a) => (
                <li key={a.chave} className="flex items-start gap-3 py-2.5">
                  <span className={clsx("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", a.gravidade === "ALTA" ? "bg-critico" : "bg-alerta")} title={a.gravidade === "ALTA" ? "Gravidade alta" : "Gravidade média"} />
                  <div className="min-w-0 flex-1">
                    <Link href={a.href} className="font-medium text-navy-800 hover:underline">
                      {a.titulo}
                    </Link>
                    <div className="text-xs text-ardosia-500">{a.detalhe}</div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Selo>{ROTULO_ALERTA[a.tipo]}</Selo>
                    {enviadoEm.has(a.chave) && <span className="text-[11px] text-ardosia-400">e-mail em {enviadoEm.get(a.chave)!.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
        <div className="space-y-6">
          <Cartao titulo="Preferências">
            <p className="mb-3 text-sm text-ardosia-600">
              {u.notificarEmail ? "Você recebe por e-mail, nos dias úteis às 7h, os alertas novos." : "Você não recebe os alertas por e-mail."}
            </p>
            <BotaoAcao acao={alternarEmail} variante="secundario">
              {u.notificarEmail ? "Desligar e-mails" : "Ligar e-mails"}
            </BotaoAcao>
          </Cartao>
          {pode(usuario.perfil, "editar", "USUARIOS") && (
            <Cartao titulo="Rotina diária">
              <p className="mb-3 text-sm text-ardosia-600">
                {emailConfigurado() ? "SMTP configurado. A rotina envia cada alerta uma única vez por pessoa." : "SMTP não configurado: a rotina só simula. Configure SMTP_HOST, SMTP_USER e SMTP_PASS no .env."}
              </p>
              <BotaoAcao acao={rodarRotinaAgora} variante="secundario">
                Rodar agora
              </BotaoAcao>
            </Cartao>
          )}
        </div>
      </div>
    </>
  );
}
