import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  // Site 100% estático (HTML/CSS/JS em `out/`) para hospedagem comum, como a Hostinger.
  // O envio dos formulários fica com `public/contato.php`; os cabeçalhos de segurança, em `public/.htaccess`.
  output: "export",
  // /sobre vira /sobre/index.html: funciona em Apache/LiteSpeed sem regras de reescrita.
  trailingSlash: true,
  // Sem servidor Node, as imagens vão como estão (já otimizadas em `public/`).
  images: { unoptimized: true },
  // O site é um projeto independente dentro do repositório do sistema interno.
  turbopack: { root: import.meta.dirname },
  pageExtensions: ["ts", "tsx", "mdx"],
  poweredByHeader: false,
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
