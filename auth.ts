import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { db } from "@/lib/db";
import type { Perfil } from "@/lib/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: { id: string; nome: string; email: string; perfil: Perfil };
  }
}

export const entraHabilitado = Boolean(process.env.AUTH_MICROSOFT_ENTRA_ID_ID);
export const loginDevHabilitado = process.env.AUTH_DEV_LOGIN === "true";

const providers: NextAuthConfig["providers"] = [];

if (entraHabilitado) {
  providers.push(
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    }),
  );
}

if (loginDevHabilitado) {
  // Somente para desenvolvimento local: entra como um usuário já cadastrado, sem senha.
  providers.push(
    Credentials({
      id: "dev",
      name: "Login de desenvolvimento",
      credentials: { email: { label: "E-mail" } },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        const usuario = await db.usuario.findUnique({ where: { email } });
        if (!usuario?.ativo) return null;
        return { id: usuario.id, email: usuario.email, name: usuario.nome };
      },
    }),
  );
}

const adminsIniciais = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    // Login corporativo: cria o usuário no primeiro acesso como Visualização
    // (ou Administrador, se estiver em ADMIN_EMAILS). Usuários inativos são barrados.
    async signIn({ user }) {
      const email = user.email?.toLowerCase().trim();
      if (!email) return false;
      const existente = await db.usuario.findUnique({ where: { email } });
      if (existente) {
        if (!existente.ativo) return false;
        await db.usuario.update({ where: { id: existente.id }, data: { ultimoAcesso: new Date() } });
        return true;
      }
      const novo = await db.usuario.create({
        data: {
          email,
          nome: user.name ?? email,
          perfil: adminsIniciais.includes(email) ? "ADMIN" : "VISUALIZADOR",
          ultimoAcesso: new Date(),
        },
      });
      // Vincula automaticamente ao recurso com o mesmo e-mail, se houver.
      await db.recurso.updateMany({ where: { email, usuarioId: null }, data: { usuarioId: novo.id } });
      return true;
    },
    async jwt({ token }) {
      if (token.email) {
        const u = await db.usuario.findUnique({ where: { email: token.email.toLowerCase() } });
        if (u) {
          token.uid = u.id;
          token.perfil = u.perfil;
          token.nome = u.nome;
          token.ativo = u.ativo;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: String(token.uid ?? ""),
        nome: String(token.nome ?? session.user?.name ?? ""),
        email: String(token.email ?? ""),
        perfil: (token.perfil as Perfil) ?? "VISUALIZADOR",
      };
      return session;
    },
  },
});
