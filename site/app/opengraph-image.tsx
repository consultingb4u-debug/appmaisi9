import { imagemOg, tamanhoOg } from "@/lib/og";

export const alt = "MAIS i9 — Consultoria TOTVS Protheus e MAIS i9 WMS";
export const size = tamanhoOg;
export const contentType = "image/png";

export default function Image() {
  return imagemOg({
    sobretitulo: "Consultoria Protheus · MAIS i9 WMS",
    titulo: "Tecnologia e expertise para transformar a gestão do seu negócio.",
  });
}
