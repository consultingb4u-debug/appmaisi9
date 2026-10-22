import { imagemOg, tamanhoOg } from "@/lib/og";

export const alt = "MAIS i9 Consultoria Protheus";
export const size = tamanhoOg;
export const contentType = "image/png";

export default function Image() {
  return imagemOg({
    sobretitulo: "MAIS i9 Consultoria Protheus",
    titulo: "Especialistas em TOTVS Protheus para manter sua operação estável e em evolução.",
  });
}
