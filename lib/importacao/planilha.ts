import ExcelJS from "exceljs";
import { normalizarTexto } from "@/lib/domain/rotulos";
import { chaveDia, paraDia } from "@/lib/domain/datas";

export type Primitivo = string | number | boolean | null;

/** Valor "visível" de uma célula: resultado de fórmula, texto rico, hyperlink; datas como "AAAA-MM-DD". */
export function valorCelula(v: ExcelJS.CellValue): Primitivo {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return chaveDia(paraDia(v));
  if (typeof v === "string") return v.trim() === "" ? null : v.trim();
  if (typeof v === "number" || typeof v === "boolean") return v;
  if (typeof v === "object") {
    if ("result" in v) return valorCelula((v as ExcelJS.CellFormulaValue).result as ExcelJS.CellValue);
    if ("richText" in v) return valorCelula(v.richText.map((t) => t.text).join(""));
    if ("text" in v) return valorCelula((v as ExcelJS.CellHyperlinkValue).text);
    if ("error" in v) return null;
  }
  return String(v);
}

export type Cabecalho = { linha: number; colunas: Record<string, number> };

/**
 * Procura, nas primeiras linhas da aba, a linha que contém todos os títulos obrigatórios.
 * Os títulos são comparados sem acento/caixa; retorna o índice da coluna de cada título encontrado.
 */
export function acharCabecalho(ws: ExcelJS.Worksheet, obrigatorios: string[], opcionais: string[] = [], ate = 15): Cabecalho | null {
  for (let r = 1; r <= Math.min(ate, ws.rowCount); r++) {
    const row = ws.getRow(r);
    const mapa: Record<string, number> = {};
    row.eachCell((cell, col) => {
      const v = valorCelula(cell.value);
      if (typeof v === "string") mapa[normalizarTexto(v)] = col;
    });
    if (obrigatorios.every((t) => normalizarTexto(t) in mapa)) {
      const colunas: Record<string, number> = {};
      for (const t of [...obrigatorios, ...opcionais]) {
        const c = mapa[normalizarTexto(t)];
        if (c) colunas[t] = c;
      }
      return { linha: r, colunas };
    }
  }
  return null;
}

/** Lê as linhas de dados abaixo do cabeçalho como objetos {título: valor}, pulando linhas vazias. */
export function lerLinhas(ws: ExcelJS.Worksheet, cab: Cabecalho, chavesObrigatorias: string[]): { linha: number; valores: Record<string, Primitivo> }[] {
  const out: { linha: number; valores: Record<string, Primitivo> }[] = [];
  for (let r = cab.linha + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const valores: Record<string, Primitivo> = {};
    for (const [titulo, col] of Object.entries(cab.colunas)) valores[titulo] = valorCelula(row.getCell(col).value);
    if (chavesObrigatorias.every((k) => valores[k] === null)) continue;
    out.push({ linha: r, valores });
  }
  return out;
}

export async function abrirPlanilha(conteudo: ArrayBuffer | Buffer): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(conteudo as ArrayBuffer);
  return wb;
}

export function acharAba(wb: ExcelJS.Workbook, nome: string): ExcelJS.Worksheet | undefined {
  const alvo = normalizarTexto(nome);
  return wb.worksheets.find((w) => normalizarTexto(w.name) === alvo);
}
