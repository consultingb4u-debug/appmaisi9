import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { empresa } from "@/conteudo/empresa";

export const tamanhoOg = { width: 1200, height: 630 };

// Logotipo oficial (arquivo original), sobre placa branca: não há versão para fundo escuro.
const logo = empresa.logo.positivo;
const logoDataUri = logo
  ? `data:image/png;base64,${readFileSync(join(process.cwd(), "public", logo.src)).toString("base64")}`
  : null;

/** Imagem de compartilhamento (Open Graph) no padrão visual do site. */
export function imagemOg({ sobretitulo, titulo }: { sobretitulo: string; titulo: string }) {
  const alturaLogo = 72;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 80px",
          background: "#0a1a30",
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          color: "white",
        }}
      >
        {logo && logoDataUri ? (
          <div style={{ display: "flex", alignSelf: "flex-start", background: "white", borderRadius: 16, padding: "6px 18px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse só aceita <img> */}
            <img src={logoDataUri} alt={empresa.nome} width={Math.round((logo.largura / logo.altura) * alturaLogo)} height={alturaLogo} />
          </div>
        ) : (
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>{empresa.nome}</div>
        )}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 24, color: "#8dbbe6", textTransform: "uppercase", letterSpacing: 3 }}>
            <div style={{ width: 12, height: 12, background: "#f28c28", marginRight: 16, borderRadius: 2 }} />
            {sobretitulo}
          </div>
          <div style={{ marginTop: 24, fontSize: 60, fontWeight: 700, lineHeight: 1.12, letterSpacing: -1.5, maxWidth: 1000 }}>{titulo}</div>
        </div>
        <div style={{ display: "flex", height: 6, width: 160, background: "#f28c28", borderRadius: 3 }} />
      </div>
    ),
    tamanhoOg,
  );
}
