import ExcelJS from "exceljs";

export type TipoColuna = "texto" | "data" | "horas" | "numero" | "percentual";
export type Coluna = { titulo: string; tipo?: TipoColuna; largura?: number };
export type Celula = string | number | Date | null | undefined;
export type Aba = { nome: string; colunas: Coluna[]; linhas: Celula[][]; titulo?: string };

const FORMATO: Record<TipoColuna, string | undefined> = {
  texto: undefined,
  data: "dd/mm/yyyy",
  horas: '0.0"h"',
  numero: "0",
  percentual: "0%",
};

/**
 * Gera um .xlsx com cabeçalho no padrão visual da MAIS i9 (azul-marinho), filtro automático
 * e primeira linha congelada. Datas devem vir como Date (meia-noite UTC); percentuais como fração (0–1).
 */
export async function gerarXlsx(abas: Aba[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "MAIS i9 · Gestão de Projetos";
  wb.created = new Date();
  for (const a of abas) {
    const ws = wb.addWorksheet(a.nome.slice(0, 31).replace(/[\\/?*[\]:]/g, " "));
    let inicio = 1;
    if (a.titulo) {
      ws.getCell(1, 1).value = a.titulo;
      ws.getCell(1, 1).font = { bold: true, size: 13, color: { argb: "FF0F1F3A" } };
      inicio = 3;
    }
    const cab = ws.getRow(inicio);
    a.colunas.forEach((c, i) => {
      const cell = cab.getCell(i + 1);
      cell.value = c.titulo;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F1F3A" } };
      cell.alignment = { vertical: "middle", wrapText: true };
      const col = ws.getColumn(i + 1);
      col.width = c.largura ?? (c.tipo && c.tipo !== "texto" ? 12 : 24);
      const fmt = FORMATO[c.tipo ?? "texto"];
      if (fmt) col.numFmt = fmt;
    });
    cab.height = 22;
    a.linhas.forEach((l, r) => {
      const row = ws.getRow(inicio + 1 + r);
      l.forEach((v, i) => {
        // Datas de calendário já são meia-noite UTC: o ExcelJS converte pelo UTC, sem deslocar o dia.
        row.getCell(i + 1).value = v ?? null;
      });
    });
    ws.views = [{ state: "frozen", ySplit: inicio }];
    if (a.linhas.length) ws.autoFilter = { from: { row: inicio, column: 1 }, to: { row: inicio + a.linhas.length, column: a.colunas.length } };
  }
  return Buffer.from(await wb.xlsx.writeBuffer());
}

/** Resposta HTTP de download do .xlsx. */
export function respostaXlsx(conteudo: Buffer, nome: string): Response {
  return new Response(new Uint8Array(conteudo), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(nome)}`,
      "Cache-Control": "no-store",
    },
  });
}
