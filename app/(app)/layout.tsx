import { signOut } from "@/auth";
import { MenuLateral, type ItemMenu } from "@/components/menu-lateral";
import { NOME_PERFIL, pode } from "@/lib/auth/permissoes";
import { usuarioAtual } from "@/lib/auth/sessao";

export default async function LayoutApp({ children }: LayoutProps<"/">) {
  const usuario = await usuarioAtual();

  const principal: ItemMenu[] = [
    { href: "/", rotulo: "Início", icone: "◧" },
    { href: "/portfolio", rotulo: "Portfólio", icone: "▤" },
    { href: "/recursos", rotulo: "Recursos", icone: "◉" },
    { href: "/capacidade", rotulo: "Capacidade", icone: "▦", emBreve: "incremento 3" },
    { href: "/clientes", rotulo: "Clientes", icone: "◆" },
  ];
  const admin: ItemMenu[] = [
    pode(usuario.perfil, "ver", "USUARIOS") && { href: "/admin/usuarios", rotulo: "Usuários", icone: "☺" },
    pode(usuario.perfil, "ver", "FERIADOS") && { href: "/admin/feriados", rotulo: "Feriados", icone: "✦" },
    pode(usuario.perfil, "ver", "IMPORTACAO") && { href: "/admin/importacao", rotulo: "Importação", icone: "⇪" },
    pode(usuario.perfil, "ver", "AUDITORIA") && { href: "/admin/auditoria", rotulo: "Auditoria", icone: "≡" },
  ].filter(Boolean) as ItemMenu[];

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-navy-900 py-5 md:flex">
        <div className="mb-8 px-6">
          <div className="text-lg font-bold tracking-tight text-white">
            MAIS <span className="text-destaque">i9</span>
          </div>
          <div className="text-[11px] tracking-wide text-ardosia-400 uppercase">Gestão de Projetos</div>
        </div>
        <MenuLateral principal={principal} admin={admin} />
        <div className="mx-3 mt-4 rounded-md bg-white/5 px-3 py-3">
          <div className="truncate text-sm font-medium text-white">{usuario.nome}</div>
          <div className="text-xs text-ardosia-400">{NOME_PERFIL[usuario.perfil]}</div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button className="mt-2 text-xs text-ardosia-200 hover:text-white hover:underline">Sair</button>
          </form>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <details className="group bg-navy-900 md:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
            <span className="font-bold text-white">
              MAIS <span className="text-destaque">i9</span>
            </span>
            <span className="text-sm text-ardosia-200">
              <span className="group-open:hidden">☰ Menu</span>
              <span className="hidden group-open:inline">✕ Fechar</span>
            </span>
          </summary>
          <div className="pb-4">
            <MenuLateral principal={principal} admin={admin} />
            <div className="mt-3 px-6 text-xs text-ardosia-400">
              {usuario.nome} · {NOME_PERFIL[usuario.perfil]}
            </div>
          </div>
        </details>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
