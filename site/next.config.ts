import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  // Servidor Node autocontido para a imagem Docker.
  output: "standalone",
  // O site é um projeto independente dentro do repositório do sistema interno.
  turbopack: { root: import.meta.dirname },
  outputFileTracingRoot: import.meta.dirname,
  pageExtensions: ["ts", "tsx", "mdx"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
