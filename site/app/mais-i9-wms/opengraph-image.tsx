import { imagemOg, tamanhoOg } from "@/lib/og";

export const dynamic = "force-static";
export const alt = "MAIS i9 WMS: gestão de armazéns";
export const size = tamanhoOg;
export const contentType = "image/png";

export default function Image() {
  return imagemOg({
    sobretitulo: "MAIS i9 WMS · Gestão Inteligente de Armazéns",
    titulo: "Mais controle, rastreabilidade e produtividade para sua operação logística.",
  });
}
