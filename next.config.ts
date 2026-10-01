import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gera um servidor Node autocontido para a imagem Docker.
  output: "standalone",
  // Upload de planilhas na importação (padrão é 1 MB).
  experimental: { serverActions: { bodySizeLimit: "10mb" } },
};

export default nextConfig;
