import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { cases } from "@/conteudo/cases";
import { opcoesServico, servicosConsultoria } from "@/conteudo/consultoria";
import { artigos, categorias, formatarData } from "@/conteudo/insights";
import { baseOperacional, modulosComplementares } from "@/conteudo/wms";
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

  it("cases publicados trazem desafio, solução e cliente", () => {
    for (const c of cases.filter((x) => x.publicado)) {
      expect(c.cliente && c.desafio && c.solucao).toBeTruthy();
    }
  });

  it("formata datas de publicação em português", () => {
    expect(formatarData("2026-10-22")).toBe("22 de outubro de 2026");
  });
});
