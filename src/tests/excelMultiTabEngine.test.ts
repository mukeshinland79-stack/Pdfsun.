/**
 * Unit & Integration Test Suite for PDF-to-Excel Multi-Tab Engine
 */

import { parseInvoiceStructureFromGrid } from "../lib/invoiceLayoutSplitter";
import { generateEnterpriseMultiTabWorkbook } from "../lib/enterpriseMultiTabExcelGenerator";
import ExcelJS from "exceljs";

export async function runExcelMultiTabTestSuite() {
  console.log("🚀 Starting PDF-to-Excel Multi-Tab Engine Test Suite...");
  const results: { test: string; passed: boolean; message?: string }[] = [];

  try {
    // 1. Test Invoice Parsing from simulated table grid
    const sampleGrid: string[][] = [
      ["TAX INVOICE", "", "", "", "", ""],
      ["Invoice No: INV-2026-909", "", "Invoice Date: 15/10/2026", "", "", ""],
      ["Supplier: Tech Corp India", "GSTIN: 27ABCDE1234F1Z5", "", "", "", ""],
      ["S.No", "Description", "HSN/SAC", "Qty", "Rate", "Amount"],
      ["1", "High-Speed Cloud Processing License", "998311", "2", "12500", "25000"],
      ["2", "Document API Integration Support", "998313", "1", "15000", "15000"],
      ["Total", "", "", "3", "", "40000"],
    ];

    const sampleText = `
      TAX INVOICE
      Invoice No: INV-2026-909
      Invoice Date: 15/10/2026
      Vehicle No: MH 12 PQ 5544
      E-Way Bill No: 123456789012
      Supplier: Tech Corp India
      GSTIN: 27ABCDE1234F1Z5
      Buyer: Global Client Ltd
      GSTIN: 27XYZAB9999Z1Z8
      A/C No: 50200099887766
      IFSC: HDFC0001234
    `;

    const invoiceData = parseInvoiceStructureFromGrid(sampleGrid, sampleText);
    results.push({
      test: "parseInvoiceStructureFromGrid correctly extracts invoice details",
      passed: invoiceData.invoiceNumber === "INV-2026-909" && invoiceData.lineItems.length >= 2,
      message: `Parsed invoice #: ${invoiceData.invoiceNumber}, Line items: ${invoiceData.lineItems.length}`,
    });

    // 2. Test Multi-Tab Excel Workbook Generation
    const xlsxBytes = await generateEnterpriseMultiTabWorkbook(invoiceData, {
      workbookTitle: "INV-2026-909 - Multi-Tab Excel",
      rawGridMatrix: sampleGrid,
    });

    results.push({
      test: "generateEnterpriseMultiTabWorkbook generates non-empty OpenXML binary",
      passed: xlsxBytes.byteLength > 2000,
      message: `Generated size: ${xlsxBytes.byteLength} bytes`,
    });

    // 3. Inspect Generated Workbook structure with ExcelJS reader
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(xlsxBytes.buffer as ArrayBuffer);

    const sheetNames = workbook.worksheets.map(w => w.name);
    const hasRequiredSheets =
      sheetNames.includes("Summary & Tax") &&
      sheetNames.includes("Line Items") &&
      sheetNames.includes("Customer & Vehicle") &&
      sheetNames.includes("Terms & Notes");

    results.push({
      test: "Workbook contains all 4 required contextual sheets",
      passed: hasRequiredSheets,
      message: `Sheets found: [${sheetNames.join(", ")}]`,
    });

    // 4. Verify Formulas on Line Items Sheet
    const wsItems = workbook.getWorksheet("Line Items");
    let hasFormulas = false;
    if (wsItems) {
      wsItems.eachRow((row) => {
        row.eachCell((cell) => {
          if (cell.formula) {
            hasFormulas = true;
          }
        });
      });
    }

    results.push({
      test: "Line Items worksheet contains dynamic Excel calculation formulas (=SUM/product)",
      passed: hasFormulas,
      message: hasFormulas ? "Dynamic formulas verified" : "No formulas found",
    });

    console.log("🎉 Test Suite Finished:", results);
    return {
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      results,
    };
  } catch (err: any) {
    console.error("Test Suite Error:", err);
    return {
      passed: results.filter(r => r.passed).length,
      failed: results.length + 1,
      error: err.message,
      results,
    };
  }
}
