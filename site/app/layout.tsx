import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import { CapturaOrigem } from "@/components/formularios/origem";
import { Cabecalho } from "@/components/layout/cabecalho";
import { Rodape } from "@/components/layout/rodape";
import { JsonLd } from "@/components/ui";
import { empresa } from "@/conteudo/empresa";
import { organizacao, siteWeb } from "@/lib/jsonld";
import { descricaoPadrao, siteIndexavel, tituloPadrao, urlSite } from "@/lib/site";
import "./globals.css";

const fonteTexto = Inter({ subsets: ["latin"], variable: "--fonte-texto", display: "swap" });
const fonteTitulo = Manrope({ subsets: ["latin"], variable: "--fonte-titulo", display: "swap" });

export const metadata: Metadata = {
  metadataBase: urlSite,
  title: { default: tituloPadrao, template: `%s | ${empresa.nome}` },
  description: descricaoPadrao,
  applicationName: empresa.nome,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: empresa.nome,
    title: tituloPadrao,
    description: descricaoPadrao,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: tituloPadrao, description: descricaoPadrao },
  robots: siteIndexavel ? { index: true, follow: true } : { index: false, follow: false },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#0a1a30",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" className={`${fonteTexto.variable} ${fonteTitulo.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#conteudo"
          className="sr-only z-[60] rounded-md bg-navy-950 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Pular para o conteúdo
        </a>
        <JsonLd dados={[organizacao(), siteWeb()]} />
        <Cabecalho />
        <main id="conteudo" className="flex-1">
          {children}
        </main>
        <Rodape />
        <CapturaOrigem />
      </body>
    </html>
  );
}
