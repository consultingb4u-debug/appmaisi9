// Gera demo-editavel/dist/index.html (página única publicada como artefato no claude.ai).
// Uso: node demo-editavel/montar.mjs  (a partir da raiz do repositório)
import { build } from "esbuild";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, "..");
const js = await build({
  entryPoints: [resolve(aqui, "src/app.tsx")],
  bundle: true,
  format: "iife",
  target: "es2020",
  jsxFactory: "React.createElement",
  jsxFragment: "React.Fragment",
  alias: { "@": raiz },
  minify: true,
  write: false,
});
const css = await postcss([tailwind({ base: aqui, optimize: { minify: true } })]).process(readFileSync(resolve(aqui, "estilo.css"), "utf8"), { from: resolve(aqui, "estilo.css") });
const html = readFileSync(resolve(aqui, "cabecalho.html"), "utf8").replace("/*ESTILO*/", css.css) + `<script>${js.outputFiles[0].text}</script>\n`;
mkdirSync(resolve(aqui, "dist"), { recursive: true });
writeFileSync(resolve(aqui, "dist/index.html"), html);
console.log(`dist/index.html: ${Math.round(html.length / 1024)} KB`);
