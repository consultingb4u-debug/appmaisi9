import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { opcoesServico, servicosConsultoria } from "@/conteudo/consultoria";
import { ctaWhatsapp, empresa, mensagensWhatsapp } from "@/conteudo/empresa";
import { artigos, categorias, formatarData } from "@/conteudo/insights";
import { baseOperacional, modulosComplementares, telasReais } from "@/conteudo/wms";
import { paginasInstitucionais } from "@/lib/rotas";

const raiz = path.resolve(import.meta.dirname, "..");

describe("conteúdo do site", () => {
  it("cada artigo tem arquivo MDX, slug único e categoria válida", () => {
    const slugs = artigos.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const a of artigos) {
      expect(existsSync(path.join(raiz, "conteudo/artigos", `${a.slug}.mdx`)), a.slug).toBe(true);
      expect(a.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(categorias[a.categoria]).toBeDefined();
      expect(a.publicadoEm).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("toda página do sitemap existe no app", () => {
    for (const { caminho } of paginasInstitucionais) {
      expect(existsSync(path.join(raiz, "app", caminho, "page.tsx")), caminho).toBe(true);
    }
  });

  it("WMS tem os 7 componentes da base operacional e os 4 módulos complementares", () => {
    expect(baseOperacional).toHaveLength(7);
    expect(modulosComplementares).toHaveLength(4);
  });

  it("consultoria tem os 6 serviços, todos selecionáveis no formulário", () => {
    expect(servicosConsultoria).toHaveLength(6);
    for (const s of servicosConsultoria) expect(opcoesServico.some((o) => o.valor === s.id)).toBe(true);
  });

  it("chamadas de conversão abrem o WhatsApp da MAIS i9 com a mensagem do assunto", () => {
    const url = new URL(ctaWhatsapp("demonstracaoWms"));
    expect(url.origin + url.pathname).toBe(`https://wa.me/${empresa.whatsapp}`);
    expect(url.searchParams.get("text")).toBe(mensagensWhatsapp.demonstracaoWms);
  });

  it("telas reais do WMS existem em public/ com as dimensões informadas", () => {
    for (const tela of Object.values(telasReais)) {
      if (!tela) continue;
      const png = readFileSync(path.join(raiz, "public", tela.src));
      // Cabeçalho IHDR do PNG: largura e altura nos bytes 16–23.
      expect([png.readUInt32BE(16), png.readUInt32BE(20)], tela.src).toEqual([tela.largura, tela.altura]);
      expect(tela.descricao.length, tela.src).toBeGreaterThan(20);
    }
  });

  it("formata datas de publicação em português", () => {
    expect(formatarData("2026-10-22")).toBe("22 de outubro de 2026");
  });
});

describe("sem valores nem preços no site", () => {
  // Regra do cliente: propostas e apresentações trazem preços, mas o site não publica valores.
  const arquivos = (dir: string): string[] =>
    readdirSync(path.join(raiz, dir), { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? arquivos(path.join(dir, e.name)) : /\.(tsx?|mdx)$/.test(e.name) ? [path.join(dir, e.name)] : [],
    );

  it("nenhum arquivo de conteúdo, página ou componente cita valores em reais", () => {
    const comValor = ["conteudo", "app", "components"]
      .flatMap(arquivos)
      .filter((f) => /R\$|\d+,\d{2}\s*\/\s*(hora|m[eê]s)/i.test(readFileSync(path.join(raiz, f), "utf8")));
    expect(comValor).toEqual([]);
  });
});
