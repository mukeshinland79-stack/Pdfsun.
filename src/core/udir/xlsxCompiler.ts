/**
 * XLSX Compiler for UDIR (Universal Document Intermediate Representation)
 * Version 1.0.0 — PDFSun.in Document Intelligence Engine
 * 
 * Compiles a canonical UdirDocument into a native OpenXML (.xlsx) multi-tab workbook:
 * 1. Sheet 1: "Document Overview" (metadata, processing statistics, headings, totals)
 * 2. Sheet 2: "Structured Tables" (detected tables with Navy headers, auto-width, borders, dynamic formulas)
 * 3. Sheet 3: "Raw Flow Content" (sequential paragraphs and blocks)
 */

import ExcelJS from "exceljs";
import { UdirDocument } from "./types";

export async function compileUdirToXlsx(udir: UdirDocument): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PDFSun.in Document Intelligence Engine";
  workbook.created = new Date();

  // -------------------------------------------------------------
  // Sheet 1: Document Overview
  // -------------------------------------------------------------
  const summarySheet = workbook.addWorksheet("Document Overview", {
    views: [{ showGridLines: true }],
  });

  summarySheet.columns = [
    { header: "Metric / Property", key: "property", width: 32 },
    { header: "Value", key: "value", width: 45 },
  ];

  // Header styling
  const summaryHeaderRow = summarySheet.getRow(1);
  summaryHeaderRow.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  summaryHeaderRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F172A" },
  };
  summaryHeaderRow.height = 26;

  summarySheet.addRow({ property: "Source Format", value: udir.metadata.sourceFormat.toUpperCase() });
  summarySheet.addRow({ property: "Total Pages", value: udir.metadata.pageCount });
  summarySheet.addRow({ property: "Detected Tables", value: udir.stats.totalTables });
  summarySheet.addRow({ property: "Total Words", value: udir.stats.totalWords });
  summarySheet.addRow({ property: "Total Characters", value: udir.stats.totalCharacters });
  summarySheet.addRow({ property: "Dynamic Formulas Injected", value: udir.stats.totalFormulas });
  summarySheet.addRow({ property: "Engine Processing Duration", value: `${udir.metadata.processingDurationMs || 0} ms` });
  summarySheet.addRow({ property: "Security & Privacy Protocol", value: "Zero-Server Ephemeral Client-Side Processing" });

  summarySheet.eachRow((row, rowNum) => {
    if (rowNum > 1) {
      row.getCell(1).font = { bold: true, color: { argb: "FF334155" } };
      row.getCell(2).font = { color: { argb: "FF0F172A" } };
      row.getCell(1).border = {
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
      row.getCell(2).border = {
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    }
  });

  // -------------------------------------------------------------
  // Sheet 2: Structured Tables (with Dynamic Formulas & Formatting)
  // -------------------------------------------------------------
  const tablesSheet = workbook.addWorksheet("Structured Tables", {
    views: [{ showGridLines: true }],
  });

  let currentRowIdx = 1;

  for (let tIdx = 0; tIdx < udir.tables.length; tIdx++) {
    const table = udir.tables[tIdx];

    // Optional Table Title
    if (table.title) {
      const titleRow = tablesSheet.getRow(currentRowIdx);
      titleRow.getCell(1).value = table.title;
      titleRow.getCell(1).font = { name: "Calibri", size: 14, bold: true, color: { argb: "FF0F172A" } };
      currentRowIdx += 2;
    }

    const startTableExcelRow = currentRowIdx;

    for (let rIdx = 0; rIdx < table.rows.length; rIdx++) {
      const rowData = table.rows[rIdx];
      const excelRow = tablesSheet.getRow(currentRowIdx);
      const isHeader = rowData.isHeaderRow || rIdx === 0;

      if (isHeader) {
        excelRow.height = 24;
      }

      for (let cIdx = 0; cIdx < rowData.cells.length; cIdx++) {
        const cellData = rowData.cells[cIdx];
        const excelCell = excelRow.getCell(cIdx + 1);

        if (isHeader) {
          excelCell.value = cellData.text;
          excelCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
          excelCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF0F172A" },
          };
          excelCell.alignment = { horizontal: "center", vertical: "middle" };
        } else {
          if (cellData.formula) {
            // Write real dynamic Excel formula
            excelCell.value = {
              formula: cellData.formula.replace(/^=/, ""),
              result: cellData.numValue || 0,
            };
          } else if (cellData.isNumeric && cellData.numValue !== undefined) {
            excelCell.value = cellData.numValue;
            if (cellData.formatCode) {
              excelCell.numFmt = cellData.formatCode;
            }
          } else {
            excelCell.value = cellData.text;
          }

          excelCell.font = {
            name: "Calibri",
            size: 10,
            bold: cellData.isHeader || !!cellData.runs.some((r) => r.font.isBold),
            color: { argb: "FF1E293B" },
          };

          if (rIdx % 2 === 1 && table.hasZebraStriping) {
            excelCell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF8FAFC" },
            };
          }

          excelCell.alignment = {
            horizontal: cellData.alignment === "right" ? "right" : cellData.alignment === "center" ? "center" : "left",
            vertical: "middle",
          };
        }

        excelCell.border = {
          top: { style: "thin", color: { argb: "FFCBD5E1" } },
          bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
      }

      currentRowIdx++;
    }

    currentRowIdx += 2; // Gap between tables
  }

  // Auto-fit column widths on tablesSheet
  for (let c = 1; c <= 15; c++) {
    const col = tablesSheet.getColumn(c);
    let maxLen = 12;
    col.eachCell({ includeEmpty: false }, (cell) => {
      const valStr = cell.value ? String(cell.value) : "";
      if (valStr.length > maxLen) {
        maxLen = Math.min(50, valStr.length + 3);
      }
    });
    col.width = maxLen;
  }

  // -------------------------------------------------------------
  // Sheet 3: Raw Flow Content
  // -------------------------------------------------------------
  const flowSheet = workbook.addWorksheet("Raw Content Flow", {
    views: [{ showGridLines: true }],
  });

  flowSheet.columns = [
    { header: "Page", key: "page", width: 10 },
    { header: "Type", key: "type", width: 15 },
    { header: "Extracted Text Content", key: "content", width: 80 },
  ];

  const flowHeader = flowSheet.getRow(1);
  flowHeader.font = { bold: true, color: { argb: "FFFFFFFF" } };
  flowHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };

  for (const page of udir.pages) {
    for (const block of page.blocks) {
      if (block.type === "paragraph" || block.type === "heading") {
        flowSheet.addRow({
          page: page.pageNumber,
          type: block.type,
          content: block.text,
        });
      }
    }
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(arrayBuffer);
}
