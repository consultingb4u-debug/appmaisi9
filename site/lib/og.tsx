import { ImageResponse } from "next/og";

export const tamanhoOg = { width: 1200, height: 630 };

/**
 * Imagem de compartilhamento (Open Graph) no padrão visual do site. O nome da empresa
 * aparece em texto simples; o logotipo oficial pode substituí-lo quando for fornecido.
 */
export function imagemOg({ sobretitulo, titulo }: { sobretitulo: string; titulo: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#0a1a30",
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          color: "white",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>MAIS i9</div>
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
