import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, entraHabilitado, loginDevHabilitado, signIn } from "@/auth";
import { classeBotao } from "@/components/ui";

export const metadata = { title: "Entrar" };

const ERROS: Record<string, string> = {
  inativo: "Seu usuário está inativo. Fale com um administrador.",
  CredentialsSignin: "Usuário não encontrado ou inativo.",
  AccessDenied: "Acesso negado.",
};

export default async function PaginaLogin({ searchParams }: PageProps<"/login">) {
  const { erro, error } = await searchParams;
  const sessao = await auth();
  if (sessao?.user?.id && !erro) redirect("/");
  const mensagem = ERROS[String(erro ?? error ?? "")] ?? (error ? "Não foi possível entrar." : null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold text-navy-900">
            MAIS <span className="text-destaque">i9</span>
          </div>
          <div className="text-sm text-ardosia-500">Gestão de Projetos, Portfólio e Recursos</div>
        </div>

        {mensagem && <div className="mb-4 rounded-md bg-critico/10 px-3 py-2 text-sm text-critico">{mensagem}</div>}

        {entraHabilitado && (
          <form
            action={async () => {
              "use server";
              await signIn("microsoft-entra-id", { redirectTo: "/" });
            }}
          >
            <button className={`${classeBotao("primario")} w-full py-2.5`}>Entrar com Microsoft 365</button>
          </form>
        )}

        {!entraHabilitado && !loginDevHabilitado && (
          <p className="text-center text-sm text-ardosia-500">Nenhum método de login configurado. Veja o README.</p>
        )}

        {loginDevHabilitado && (
          <form
            className="mt-6 space-y-3 border-t border-ardosia-100 pt-6"
            action={async (dados: FormData) => {
              "use server";
              try {
                await signIn("dev", { email: dados.get("email"), redirectTo: "/" });
              } catch (e) {
                if (e instanceof AuthError) redirect(`/login?erro=${e.type}`);
                throw e;
              }
            }}
          >
            <div className="text-xs font-medium tracking-wide text-destaque-escuro uppercase">Login de desenvolvimento</div>
            <input name="email" type="email" required placeholder="email do usuário cadastrado" className="campo" defaultValue="admin@maisi9.local" />
            <button className={`${classeBotao("secundario")} w-full`}>Entrar sem senha</button>
          </form>
        )}
      </div>
    </div>
  );
}
