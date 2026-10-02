import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { gerarXlsx } from "@/lib/exportacao/xlsx";
import { dia } from "@/lib/domain/datas";

describe("gerarXlsx", () => {
  it("gera cabeçalho, título, datas sem deslocar o dia e filtro", async () => {
    const buf = await gerarXlsx([
      {
        nome: "Cronograma",
        titulo: "Kover · Implantação WMS",
        colunas: [{ titulo: "ID" }, { titulo: "Fim", tipo: "data" }, { titulo: "Horas", tipo: "horas" }, { titulo: "%", tipo: "percentual" }],
        linhas: [
          ["CRON-001", dia(2026, 10, 5), 4, 0.5],
          ["CRON-002", null, undefined, 1],
        ],
      },
    ]);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const ws = wb.getWorksheet("Cronograma")!;
    expect(ws.getCell("A1").value).toBe("Kover · Implantação WMS");
    expect(ws.getRow(3).values).toEqual([undefined, "ID", "Fim", "Horas", "%"]);
    expect((ws.getCell("B4").value as Date).toISOString().slice(0, 10)).toBe("2026-10-05");
    expect(ws.getCell("C4").numFmt).toBe('0.0"h"');
    expect(ws.getCell("B5").value).toBeNull();
    expect(ws.autoFilter).toBeTruthy();
  });
});
