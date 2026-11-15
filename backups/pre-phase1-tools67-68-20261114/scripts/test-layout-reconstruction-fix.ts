/**
 * Test & Prototype Script for Advanced Invoice Layout Reconstruction
 */
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  Table as DocxTable,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  HeadingLevel,
  PageBreak,
} from "docx";

// Polyfills for Node.js
if (typeof (globalThis as any).DOMMatrix === "undefined") {
  (globalThis as any).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    transformPoint(p: any) { return p; }
  };
}
if (typeof (Promise as any).try !== "function") {
  (Promise as any).try = function (fn: any, ...args: any[]) {
    return new Promise((resolve) => resolve(fn(...args)));
  };
}
if (typeof (globalThis as any).createImageBitmap === "undefined") {
  (globalThis as any).createImageBitmap = async () => ({ width: 800, height: 600, close() {} });
}

interface SpatialTextToken {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  isBold: boolean;
  isItalic: boolean;
  page: number;
}

interface ReconstructedLine {
  y: number;
  xStart: number;
  xEnd: number;
  tokens: SpatialTextToken[];
  text: string;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  page: number;
}

async function runTest() {
  console.log("=== Testing Prototype Layout Reconstruction Engine ===");

  // 1. Create the realistic complex GST Invoice
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.addPage([595.28, 841.89]); // A4: 595 x 842 pt

  // Header
  page.drawText("TAX INVOICE", { x: 250, y: 810, size: 14, font: fontBold, color: rgb(0.1, 0.2, 0.5) });
  page.drawText("Original for Recipient", { x: 460, y: 810, size: 9, font });

  // Two-Column Party Info
  page.drawText("Sold By / Supplier Details:", { x: 40, y: 780, size: 10, font: fontBold });
  page.drawText("ACME CLOUD SOLUTIONS PVT LTD", { x: 40, y: 765, size: 10, font: fontBold });
  page.drawText("Plot 42, Cyber City, Phase 2, Gurugram, HR - 122002", { x: 40, y: 750, size: 9, font });
  page.drawText("GSTIN: 06AABCA1234F1Z5 | PAN: AABCA1234F", { x: 40, y: 735, size: 9, font });
  page.drawText("State: Haryana (Code: 06)", { x: 40, y: 720, size: 9, font });

  page.drawText("Invoice Details & Billed To:", { x: 320, y: 780, size: 10, font: fontBold });
  page.drawText("Invoice No: INV-2026-8841", { x: 320, y: 763, size: 9, font: fontBold });
  page.drawText("Invoice Date: 12-May-2026 | Due: 26-May-2026", { x: 320, y: 748, size: 9, font });
  page.drawText("Billed To: TECHCORP ENTERPRISES INDIA LTD", { x: 320, y: 733, size: 9, font: fontBold });
  page.drawText("GSTIN: 27AAGCT9876Q1Z9 | State: Maharashtra (27)", { x: 320, y: 718, size: 9, font });
  page.drawText("Place of Supply: Maharashtra | Reverse Charge: No", { x: 320, y: 703, size: 9, font });

  // Table Headers
  page.drawText("S.No", { x: 40, y: 670, size: 9, font: fontBold });
  page.drawText("Item Description", { x: 75, y: 670, size: 9, font: fontBold });
  page.drawText("HSN/SAC", { x: 260, y: 670, size: 9, font: fontBold });
  page.drawText("Qty", { x: 325, y: 670, size: 9, font: fontBold });
  page.drawText("Rate", { x: 360, y: 670, size: 9, font: fontBold });
  page.drawText("Taxable", { x: 430, y: 670, size: 9, font: fontBold });
  page.drawText("IGST (18%)", { x: 505, y: 670, size: 9, font: fontBold });

  // Item 1 with multi-line description
  page.drawText("1", { x: 40, y: 645, size: 9, font });
  page.drawText("Enterprise Cloud Migration & Architecture", { x: 75, y: 645, size: 9, font });
  page.drawText("998313", { x: 260, y: 645, size: 9, font });
  page.drawText("1.00", { x: 325, y: 645, size: 9, font });
  page.drawText("75,000.00", { x: 360, y: 645, size: 9, font });
  page.drawText("75,000.00", { x: 430, y: 645, size: 9, font });
  page.drawText("13,500.00", { x: 505, y: 645, size: 9, font });

  page.drawText("AWS & Azure Multi-Region Disaster Recovery Setup", { x: 75, y: 630, size: 8, font });
  page.drawText("Period: 01-May-2026 to 31-May-2026", { x: 75, y: 615, size: 8, font });

  // Item 2
  page.drawText("2", { x: 40, y: 590, size: 9, font });
  page.drawText("SOC-2 Compliance Security Hardening Audit", { x: 75, y: 590, size: 9, font });
  page.drawText("998315", { x: 260, y: 590, size: 9, font });
  page.drawText("2.00", { x: 325, y: 590, size: 9, font });
  page.drawText("20,000.00", { x: 360, y: 590, size: 9, font });
  page.drawText("40,000.00", { x: 430, y: 590, size: 9, font });
  page.drawText("7,200.00", { x: 505, y: 590, size: 9, font });

  // Totals & Bank details
  page.drawText("Bank Account Details:", { x: 40, y: 530, size: 9, font: fontBold });
  page.drawText("Bank Name: HDFC Bank Ltd | A/c No: 50200012345678", { x: 40, y: 515, size: 8, font });
  page.drawText("IFSC Code: HDFC0000240 | Branch: Cyber City Gurugram", { x: 40, y: 500, size: 8, font });
  page.drawText("Amount in Words: One Lakh Thirty-Five Thousand Seven Hundred Only", { x: 40, y: 480, size: 8, font: fontBold });

  page.drawText("Total Taxable Value:", { x: 360, y: 530, size: 9, font });
  page.drawText("1,15,000.00", { x: 485, y: 530, size: 9, font: fontBold });
  page.drawText("Integrated Tax (IGST 18%):", { x: 360, y: 512, size: 9, font });
  page.drawText("20,700.00", { x: 485, y: 512, size: 9, font });
  page.drawText("Invoice Total (INR):", { x: 360, y: 490, size: 10, font: fontBold });
  page.drawText("1,35,700.00", { x: 485, y: 490, size: 10, font: fontBold });

  const pdfBytes = await pdfDoc.save();

  // 2. Parse with pdfjsLib
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;
  const p1 = await pdf.getPage(1);
  const viewport = p1.getViewport({ scale: 1.0 });
  const textContent = await (p1.getTextContent as any)({ normalizeWhitespace: true });

  const tokens: SpatialTextToken[] = [];
  for (const item of textContent.items as any[]) {
    if (!item.str || !item.str.trim()) continue;
    const x = Math.round(item.transform[4]);
    const y = Math.round(viewport.height - item.transform[5]);
    const fontSize = Math.round(Math.hypot(item.transform[0], item.transform[1])) || 10;
    const width = Math.round(item.width || fontSize * item.str.length * 0.55);
    const height = Math.round(item.height || fontSize);
    const fontName = item.fontName || "";
    const isBold = /bold|700|800|900/i.test(fontName);
    const isItalic = /italic/i.test(fontName);
    tokens.push({
      text: item.str.trim(),
      x,
      y,
      width,
      height,
      fontSize,
      fontName,
      isBold,
      isItalic,
      page: 1,
    });
  }

  console.log(`Extracted ${tokens.length} text tokens`);

  // Detect if document is an invoice
  const fullText = tokens.map((t) => t.text).join(" ");
  const isInvoice = /invoice|bill to|gstin|taxable|hsn|sac/i.test(fullText);
  console.log(`Document classified as invoice: ${isInvoice}`);

  // Test our new Advanced Structural Layout Pipeline
  const elements = reconstructInvoiceLayoutToDocx(tokens, viewport.width, viewport.height);

  const docx = new DocxDocument({
    creator: "PDFSun Advanced Layout Engine",
    sections: [
      {
        properties: {
          page: {
            size: { width: Math.round(viewport.width * 20), height: Math.round(viewport.height * 20) },
            margin: { top: 720, right: 720, bottom: 720, left: 720 }, // 0.5 inch compact invoice margins
          },
        },
        children: elements,
      },
    ],
  });

  const blob = await Packer.toBlob(docx);
  const buffer = await blob.arrayBuffer();
  console.log(`Generated Prototype DOCX: ${buffer.byteLength} bytes`);

  const mammothHtml = await mammoth.convertToHtml({ buffer: Buffer.from(buffer) });
  console.log("\n--- Mammoth HTML of Reconstructed Layout ---");
  console.log(mammothHtml.value);
}

/**
 * Intelligent Invoice Layout Reconstruction Implementation
 */
function reconstructInvoiceLayoutToDocx(
  tokens: SpatialTextToken[],
  pageWidth: number,
  pageHeight: number
): (Paragraph | DocxTable)[] {
  const elements: (Paragraph | DocxTable)[] = [];

  // Sort tokens vertically
  tokens.sort((a, b) => a.y - b.y || a.x - b.x);

  // 1. Detect Header Zone (Y < 70)
  const headerTokens = tokens.filter((t) => t.y < 70);
  if (headerTokens.length > 0) {
    const titleToken = headerTokens.find((t) => /invoice|bill|statement/i.test(t.text)) || headerTokens[0];
    elements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 100 },
        children: [
          new TextRun({
            text: titleToken.text,
            bold: true,
            size: 28, // 14pt
            color: "1E3A8A",
            font: "Calibri",
          }),
        ],
      })
    );

    const subHeaders = headerTokens.filter((t) => t !== titleToken);
    if (subHeaders.length > 0) {
      elements.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 0, after: 120 },
          children: subHeaders.map((sh) => new TextRun({ text: sh.text + " ", size: 18, color: "64748B", font: "Calibri" })),
        })
      );
    }
  }

  // 2. Party Information Zone (Y between 70 and 200)
  // Left: Supplier Details (x < 300)
  // Right: Customer & Invoice Details (x >= 300)
  const partyTokens = tokens.filter((t) => t.y >= 70 && t.y < 200);
  const supplierTokens = partyTokens.filter((t) => t.x < 300);
  const customerTokens = partyTokens.filter((t) => t.x >= 300);

  // Cluster supplier tokens into lines
  const supplierLines = clusterTokensIntoSimpleLines(supplierTokens);
  const customerLines = clusterTokensIntoSimpleLines(customerTokens);

  if (supplierLines.length > 0 || customerLines.length > 0) {
    const partyTable = new DocxTable({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            // Left Cell: Supplier Card
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill: "F8FAFC" },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
              },
              margins: { top: 100, bottom: 100, left: 140, right: 140 },
              children: supplierLines.map(
                (l, idx) =>
                  new Paragraph({
                    spacing: { before: idx === 0 ? 0 : 20, after: 20 },
                    children: [
                      new TextRun({
                        text: l.text,
                        bold: idx <= 1 || /gstin|pan|state/i.test(l.text),
                        size: idx <= 1 ? 20 : 18,
                        color: idx === 0 ? "0F172A" : "334155",
                        font: "Calibri",
                      }),
                    ],
                  })
              ),
            }),
            // Right Cell: Customer & Invoice Details Card
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill: "F8FAFC" },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
              },
              margins: { top: 100, bottom: 100, left: 140, right: 140 },
              children: customerLines.map(
                (l, idx) =>
                  new Paragraph({
                    spacing: { before: idx === 0 ? 0 : 20, after: 20 },
                    children: [
                      new TextRun({
                        text: l.text,
                        bold: idx === 0 || /invoice no|billed to|gstin/i.test(l.text),
                        size: idx === 0 || /billed to/i.test(l.text) ? 20 : 18,
                        color: idx === 0 ? "0F172A" : "334155",
                        font: "Calibri",
                      }),
                    ],
                  })
              ),
            }),
          ],
        }),
      ],
    });

    elements.push(partyTable);
    elements.push(new Paragraph({ children: [], spacing: { after: 120 } }));
  }

  // 3. Line Items Grid Table Zone (Y between 200 and 400)
  const tableTokens = tokens.filter((t) => t.y >= 200 && t.y < 400);
  if (tableTokens.length > 0) {
    const tableElement = reconstructGridTable(tableTokens);
    if (tableElement) {
      elements.push(tableElement);
      elements.push(new Paragraph({ children: [], spacing: { after: 120 } }));
    }
  }

  // 4. Totals, Bank Details & Footer Zone (Y >= 400)
  const bottomTokens = tokens.filter((t) => t.y >= 400);
  const bankTokens = bottomTokens.filter((t) => t.x < 330 || /bank|ifsc|amount in words/i.test(t.text));
  const totalTokens = bottomTokens.filter((t) => t.x >= 330 && !/bank|ifsc|amount in words/i.test(t.text));

  const bankLines = clusterTokensIntoSimpleLines(bankTokens);
  const totalLines = clusterTokensIntoSimpleLines(totalTokens);

  if (bankLines.length > 0 || totalLines.length > 0) {
    const summaryTable = new DocxTable({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            // Left: Bank details & words
            new TableCell({
              width: { size: 55, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
              },
              margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: bankLines.map(
                (l, idx) =>
                  new Paragraph({
                    spacing: { before: 20, after: 20 },
                    children: [
                      new TextRun({
                        text: l.text,
                        bold: idx === 0 || /amount in words|ifsc/i.test(l.text),
                        size: 17,
                        color: "1E293B",
                        font: "Calibri",
                      }),
                    ],
                  })
              ),
            }),
            // Right: Totals summary
            new TableCell({
              width: { size: 45, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill: "F1F5F9" },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              },
              margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: totalLines.map(
                (l) =>
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    spacing: { before: 20, after: 20 },
                    children: [
                      new TextRun({
                        text: l.text,
                        bold: /total/i.test(l.text),
                        size: /invoice total/i.test(l.text) ? 22 : 18,
                        color: /invoice total/i.test(l.text) ? "0F172A" : "334155",
                        font: "Calibri",
                      }),
                    ],
                  })
              ),
            }),
          ],
        }),
      ],
    });

    elements.push(summaryTable);
  }

  return elements;
}

function clusterTokensIntoSimpleLines(tokens: SpatialTextToken[]): ReconstructedLine[] {
  if (tokens.length === 0) return [];
  tokens.sort((a, b) => a.y - b.y || a.x - b.x);

  const lines: ReconstructedLine[] = [];
  let curTokens: SpatialTextToken[] = [];
  let curY = -1;

  for (const t of tokens) {
    if (curY === -1 || Math.abs(t.y - curY) <= 5) {
      curTokens.push(t);
      if (curY === -1) curY = t.y;
    } else {
      curTokens.sort((a, b) => a.x - b.x);
      lines.push({
        y: curY,
        xStart: curTokens[0].x,
        xEnd: curTokens[curTokens.length - 1].x + curTokens[curTokens.length - 1].width,
        tokens: curTokens,
        text: curTokens.map((ct) => ct.text).join(" "),
        fontSize: curTokens[0].fontSize,
        isBold: curTokens.some((ct) => ct.isBold),
        isItalic: false,
        page: 1,
      });
      curTokens = [t];
      curY = t.y;
    }
  }

  if (curTokens.length > 0) {
    curTokens.sort((a, b) => a.x - b.x);
    lines.push({
      y: curY,
      xStart: curTokens[0].x,
      xEnd: curTokens[curTokens.length - 1].x + curTokens[curTokens.length - 1].width,
      tokens: curTokens,
      text: curTokens.map((ct) => ct.text).join(" "),
      fontSize: curTokens[0].fontSize,
      isBold: curTokens.some((ct) => ct.isBold),
      isItalic: false,
      page: 1,
    });
  }

  return lines;
}

function reconstructGridTable(tokens: SpatialTextToken[]): DocxTable | null {
  const lines = clusterTokensIntoSimpleLines(tokens);
  if (lines.length < 2) return null;

  // Header line is first line
  const headerLine = lines[0];
  const colStarts = headerLine.tokens.map((t) => t.x).sort((a, b) => a - b);
  const headerTexts = headerLine.tokens.map((t) => t.text);

  const tableRows: TableRow[] = [];

  // Header row
  tableRows.push(
    new TableRow({
      tableHeader: true,
      children: headerTexts.map(
        (h) =>
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: "1E3A8A" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "1E3A8A" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "1E3A8A" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "3B82F6" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "3B82F6" },
            },
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: [
              new Paragraph({
                alignment: /qty|rate|tax|total|amount/i.test(h) ? AlignmentType.RIGHT : AlignmentType.LEFT,
                children: [new TextRun({ text: h, bold: true, size: 18, color: "FFFFFF", font: "Calibri" })],
              }),
            ],
          })
      ),
    })
  );

  // Group subsequent lines into line items
  // An item starts if a line has a number or token in column 0 (S.No)
  let currentItemCells: string[] = new Array(colStarts.length).fill("");
  let hasActiveItem = false;

  for (let lIdx = 1; lIdx < lines.length; lIdx++) {
    const line = lines[lIdx];
    const isNewItem = /^[0-9]+$/.test(line.tokens[0]?.text) && line.tokens[0]?.x < 60;

    if (isNewItem) {
      if (hasActiveItem) {
        tableRows.push(buildTableRowFromCells(currentItemCells, headerTexts));
      }
      currentItemCells = new Array(colStarts.length).fill("");
      hasActiveItem = true;
    }

    // Map each token on this line to closest column corridor
    for (const t of line.tokens) {
      let closestCol = 0;
      let minDiff = 999999;
      for (let c = 0; c < colStarts.length; c++) {
        const diff = Math.abs(t.x - colStarts[c]);
        if (diff < minDiff) {
          minDiff = diff;
          closestCol = c;
        }
      }

      if (currentItemCells[closestCol]) {
        currentItemCells[closestCol] += "\n" + t.text;
      } else {
        currentItemCells[closestCol] = t.text;
      }
    }
  }

  if (hasActiveItem) {
    tableRows.push(buildTableRowFromCells(currentItemCells, headerTexts));
  }

  return new DocxTable({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });
}

function buildTableRowFromCells(cells: string[], headers: string[]): TableRow {
  return new TableRow({
    children: cells.map((cText, idx) => {
      const header = headers[idx] || "";
      const isNum = /qty|rate|tax|total|amount/i.test(header) || /^[0-9,.]+$/.test(cText.trim());
      const lines = (cText || "").split("\n");

      return new TableCell({
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
        },
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: lines.map(
          (lineText, lineIdx) =>
            new Paragraph({
              alignment: isNum ? AlignmentType.RIGHT : AlignmentType.LEFT,
              spacing: { before: lineIdx === 0 ? 0 : 20, after: 20 },
              children: [
                new TextRun({
                  text: lineText,
                  size: lineIdx === 0 ? 18 : 16,
                  color: lineIdx === 0 ? "0F172A" : "64748B",
                  font: "Calibri",
                }),
              ],
            })
        ),
      });
    }),
  });
}

runTest().catch(console.error);
