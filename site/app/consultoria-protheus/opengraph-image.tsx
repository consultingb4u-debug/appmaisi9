import { imagemOg, tamanhoOg } from "@/lib/og";

export const dynamic = "force-static";
export const alt = "MAIS i9 Consultoria Protheus";
export const size = tamanhoOg;
export const contentType = "image/png";

export default function Image() {
  return imagemOg({
    sobretitulo: "Especialista em ambientes TOTVS Protheus",
    titulo: "Continuidade operacional e evolução para ambientes TOTVS Protheus.",
  });
}
