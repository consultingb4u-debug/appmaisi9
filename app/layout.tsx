import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "MAIS i9 | Gestão de Projetos", template: "%s | MAIS i9" },
  description: "Portfólio, projetos e recursos da MAIS i9",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
