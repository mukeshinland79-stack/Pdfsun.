/**
 * End-to-End Validation Script for Advanced Invoice Layout Reconstruction
 */
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import mammoth from "mammoth";
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
} from "docx";

// Polyfills
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

export interface SpatialTextToken {
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

export interface ReconstructedLine {
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

/**
 * Intelligent Zone-Based Invoice Layout Reconstructor
 */
export function reconstructInvoiceLayoutToDocxElements(
  tokens: SpatialTextToken[],
  pageWidth: number,
  pageHeight: number,
  pageNum: number = 1
): (Paragraph | DocxTable)[] {
  const elements: (Paragraph | DocxTable)[] = [];

  // Sort tokens by Y ascending, then X ascending
  const sortedTokens = [...tokens].sort((a, b) => a.y - b.y || a.x - b.x);

  // Group tokens into spatial vertical bands:
  // Band 1: Header Zone (Title, Original/Duplicate tag, Logo space)
  // Band 2: Party Info Zone (Supplier vs Buyer / Invoice Details)
  // Band 3: Line Items Grid Zone (Headers + Itemized rows with multi-line cells)
  // Band 4: Summary & Totals Zone (Bank info, Amount in words, Subtotal, Taxes, Grand Total)
  // Band 5: Footer / Declaration Zone (Signatory, Terms)

  // 1. Detect boundaries
  // Find line items header: look for lines containing "description", "item", "qty", "rate", "hsn", "amount"
  const lines = clusterTokensIntoLinesDirect(sortedTokens, pageNum);

  let gridHeaderLineIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const textLower = l.text.toLowerCase();
    const matchesColHeader =
      (textLower.includes("desc") || textLower.includes("item")) &&
      (textLower.includes("qty") || textLower.includes("rate") || textLower.includes("tax") || textLower.includes("hsn") || textLower.includes("amount") || textLower.includes("s.no"));
    if (matchesColHeader && l.tokens.length >= 3) {
      gridHeaderLineIdx = i;
      break;
    }
  }

  // Find summary start: after grid header, look for "total", "taxable", "bank", "amount in words"
  let summaryStartLineIdx = -1;
  if (gridHeaderLineIdx !== -1) {
    for (let i = gridHeaderLineIdx + 1; i < lines.length; i++) {
      const l = lines[i];
      const textLower = l.text.toLowerCase();
      if (
        (textLower.includes("bank") && textLower.includes("account")) ||
        textLower.includes("amount in words") ||
        textLower.includes("total taxable") ||
        textLower.includes("grand total") ||
        textLower.includes("invoice total") ||
        (textLower.includes("subtotal") && l.tokens.length <= 3)
      ) {
        summaryStartLineIdx = i;
        break;
      }
    }
  }

  // Fallback boundaries if not cleanly indexed
  const headerLines: ReconstructedLine[] = [];
  const partyLines: ReconstructedLine[] = [];
  const gridLines: ReconstructedLine[] = [];
  const summaryLines: ReconstructedLine[] = [];

  if (gridHeaderLineIdx !== -1) {
    // Before grid header:
    // Split into top Header (y < 60 or title keywords) and Party Info
    for (let i = 0; i < gridHeaderLineIdx; i++) {
      const l = lines[i];
      if (i <= 1 && (/tax invoice|bill of supply|invoice|commercial invoice|retail invoice/i.test(l.text) || l.fontSize >= 13)) {
        headerLines.push(l);
      } else {
        partyLines.push(l);
      }
    }

    const endGridIdx = summaryStartLineIdx !== -1 ? summaryStartLineIdx : lines.length;
    for (let i = gridHeaderLineIdx; i < endGridIdx; i++) {
      gridLines.push(lines[i]);
    }

    if (summaryStartLineIdx !== -1) {
      for (let i = summaryStartLineIdx; i < lines.length; i++) {
        summaryLines.push(lines[i]);
      }
    }
  } else {
    // Fallback: treat top 20% as header, 20-40% as party, 40-75% as grid, 75%+ as summary
    for (const l of lines) {
      const relY = l.y / pageHeight;
      if (relY < 0.12) headerLines.push(l);
      else if (relY < 0.32) partyLines.push(l);
      else if (relY < 0.68) gridLines.push(l);
      else summaryLines.push(l);
    }
  }

  // -------------------------------------------------------------
  // ZONE 1: RECONSTRUCT HEADER
  // -------------------------------------------------------------
  for (const hl of headerLines) {
    const isTitle = hl.fontSize >= 13 || /tax invoice|invoice/i.test(hl.text);
    elements.push(
      new Paragraph({
        alignment: isTitle ? AlignmentType.CENTER : AlignmentType.RIGHT,
        spacing: { before: isTitle ? 40 : 0, after: 80 },
        children: [
          new TextRun({
            text: hl.text,
            bold: isTitle,
            size: isTitle ? 28 : 18,
            color: isTitle ? "1E3A8A" : "64748B",
            font: "Calibri",
          }),
        ],
      })
    );
  }

  // -------------------------------------------------------------
  // ZONE 2: RECONSTRUCT TWO-COLUMN PARTY TABLE (Seller vs Buyer)
  // -------------------------------------------------------------
  if (partyLines.length > 0) {
    const midpoint = pageWidth / 2;
    const sellerLines: ReconstructedLine[] = [];
    const buyerLines: ReconstructedLine[] = [];

    for (const pl of partyLines) {
      // Check if line is purely on left or right, or spans across
      const lineCenter = (pl.xStart + pl.xEnd) / 2;
      if (pl.xEnd <= midpoint || lineCenter < midpoint - 20) {
        sellerLines.push(pl);
      } else if (pl.xStart >= midpoint - 20 || lineCenter >= midpoint) {
        buyerLines.push(pl);
      } else {
        // Spanning line: split tokens by midpoint
        const leftTokens = pl.tokens.filter((t) => t.x < midpoint);
        const rightTokens = pl.tokens.filter((t) => t.x >= midpoint);
        if (leftTokens.length > 0) {
          sellerLines.push(buildLineFromTokensDirect(leftTokens, pl.y, pageNum));
        }
        if (rightTokens.length > 0) {
          buyerLines.push(buildLineFromTokensDirect(rightTokens, pl.y, pageNum));
        }
      }
    }

    if (sellerLines.length > 0 || buyerLines.length > 0) {
      const partyTable = new DocxTable({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              // Left: Supplier Details
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.CLEAR, fill: "F8FAFC" },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                  left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                  right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: sellerLines.map((sl, idx) => {
                  const isSectionHeader = idx === 0 || /sold by|supplier/i.test(sl.text);
                  const isCompanyName = idx === 1 || sl.isBold;
                  return new Paragraph({
                    spacing: { before: idx === 0 ? 0 : 20, after: 20 },
                    children: [
                      new TextRun({
                        text: sl.text,
                        bold: isSectionHeader || isCompanyName || /gstin|pan|state/i.test(sl.text),
                        size: isCompanyName ? 20 : 18,
                        color: isCompanyName ? "0F172A" : "334155",
                        font: "Calibri",
                      }),
                    ],
                  });
                }),
              }),
              // Right: Customer & Invoice Details
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.CLEAR, fill: "F8FAFC" },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                  left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                  right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: buyerLines.map((bl, idx) => {
                  const isSectionHeader = idx === 0 || /billed to|invoice details/i.test(bl.text);
                  const isKey = /invoice no|invoice date|billed to|gstin|place of supply/i.test(bl.text);
                  return new Paragraph({
                    spacing: { before: idx === 0 ? 0 : 20, after: 20 },
                    children: [
                      new TextRun({
                        text: bl.text,
                        bold: isSectionHeader || isKey || bl.isBold,
                        size: isSectionHeader || /billed to/i.test(bl.text) ? 20 : 18,
                        color: isSectionHeader ? "0F172A" : "334155",
                        font: "Calibri",
                      }),
                    ],
                  });
                }),
              }),
            ],
          }),
        ],
      });

      elements.push(partyTable);
    }
  }

  // -------------------------------------------------------------
  // ZONE 3: RECONSTRUCT LINE ITEMS GRID (With Multi-line Cells!)
  // -------------------------------------------------------------
  if (gridLines.length >= 2) {
    const gridTable = buildUnifiedGridTable(gridLines);
    if (gridTable) {
      elements.push(gridTable);
    }
  }

  // -------------------------------------------------------------
  // ZONE 4: RECONSTRUCT SUMMARY, BANK DETAILS & TOTALS
  // -------------------------------------------------------------
  if (summaryLines.length > 0) {
    const bankTokens: SpatialTextToken[] = [];
    const totalTokens: SpatialTextToken[] = [];

    const summaryMidpoint = pageWidth * 0.52;

    for (const sl of summaryLines) {
      for (const t of sl.tokens) {
        const isBankOrWords =
          /bank|ifsc|account|a\/c|branch|words|authorized|terms|conditions|notes/i.test(t.text) ||
          /bank|ifsc|account|a\/c|branch|words|terms/i.test(sl.text);
        if (isBankOrWords || t.x < summaryMidpoint) {
          bankTokens.push(t);
        } else {
          totalTokens.push(t);
        }
      }
    }

    const bankLines = clusterTokensIntoLinesDirect(bankTokens, pageNum);
    const totalLines = clusterTokensIntoLinesDirect(totalTokens, pageNum);

    if (bankLines.length > 0 || totalLines.length > 0) {
      const summaryTable = new DocxTable({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              // Left: Bank details, Amount in words, Terms
              new TableCell({
                width: { size: 55, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                },
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
                children: bankLines.map((bl, idx) => {
                  const isTitle = idx === 0 || /bank|amount in words/i.test(bl.text);
                  return new Paragraph({
                    spacing: { before: 20, after: 20 },
                    children: [
                      new TextRun({
                        text: bl.text,
                        bold: isTitle,
                        size: 17,
                        color: "1E293B",
                        font: "Calibri",
                      }),
                    ],
                  });
                }),
              }),
              // Right: Subtotals, Taxes, Total Amount
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
                children: totalLines.map((tl) => {
                  const isGrandTotal = /invoice total|grand total|total amount/i.test(tl.text);
                  return new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    spacing: { before: 20, after: 20 },
                    children: [
                      new TextRun({
                        text: tl.text,
                        bold: isGrandTotal || /total|taxable|igst|cgst|sgst/i.test(tl.text),
                        size: isGrandTotal ? 22 : 18,
                        color: isGrandTotal ? "0F172A" : "334155",
                        font: "Calibri",
                      }),
                    ],
                  });
                }),
              }),
            ],
          }),
        ],
      });

      elements.push(summaryTable);
    }
  }

  return elements;
}

function buildUnifiedGridTable(lines: ReconstructedLine[]): DocxTable | null {
  if (lines.length < 2) return null;

  const headerLine = lines[0];
  // Sort header tokens left to right to establish column corridors
  const headerTokens = [...headerLine.tokens].sort((a, b) => a.x - b.x);
  const colStarts = headerTokens.map((t) => t.x);
  const headerTitles = headerTokens.map((t) => t.text);

  // Column widths proportional to corridor gaps
  const colWidthsPct: number[] = [];
  for (let c = 0; c < colStarts.length; c++) {
    if (c < colStarts.length - 1) {
      colWidthsPct.push(colStarts[c + 1] - colStarts[c]);
    } else {
      colWidthsPct.push(headerTokens[c].width + 30);
    }
  }
  const totalRawWidth = colWidthsPct.reduce((a, b) => a + b, 0);
  const normalizedColPct = colWidthsPct.map((w) => Math.max(6, Math.round((w / totalRawWidth) * 100)));
  const sumPct = normalizedColPct.reduce((a, b) => a + b, 0);
  if (sumPct !== 100 && normalizedColPct.length > 0) {
    normalizedColPct[normalizedColPct.length - 1] += 100 - sumPct;
  }

  const tableRows: TableRow[] = [];

  // Header row
  tableRows.push(
    new TableRow({
      tableHeader: true,
      children: headerTitles.map((hTitle, cIdx) => {
        const isNum = /qty|rate|tax|total|amount/i.test(hTitle);
        return new TableCell({
          width: { size: normalizedColPct[cIdx] || 10, type: WidthType.PERCENTAGE },
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
              alignment: isNum ? AlignmentType.RIGHT : AlignmentType.LEFT,
              children: [
                new TextRun({
                  text: hTitle,
                  bold: true,
                  size: 18,
                  color: "FFFFFF",
                  font: "Calibri",
                }),
              ],
            }),
          ],
        });
      }),
    })
  );

  // Parse item rows with multi-line description continuation
  let currentItemCells: string[][] = [];
  let hasItem = false;

  function initEmptyRow(): string[][] {
    return Array.from({ length: colStarts.length }, () => []);
  }

  function flushCurrentItem() {
    if (!hasItem) return;
    tableRows.push(
      new TableRow({
        children: currentItemCells.map((cellLines, cIdx) => {
          const header = headerTitles[cIdx] || "";
          const isNum = /qty|rate|tax|total|amount/i.test(header);

          return new TableCell({
            width: { size: normalizedColPct[cIdx] || 10, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
            },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: cellLines.length > 0
              ? cellLines.map(
                  (lText, lIdx) =>
                    new Paragraph({
                      alignment: isNum ? AlignmentType.RIGHT : AlignmentType.LEFT,
                      spacing: { before: lIdx === 0 ? 0 : 20, after: 20 },
                      children: [
                        new TextRun({
                          text: lText,
                          size: lIdx === 0 ? 18 : 16,
                          color: lIdx === 0 ? "0F172A" : "64748B",
                          font: "Calibri",
                        }),
                      ],
                    })
                )
              : [new Paragraph({ children: [new TextRun({ text: " ", size: 18 })] })],
          });
        }),
      })
    );
  }

  for (let lIdx = 1; lIdx < lines.length; lIdx++) {
    const line = lines[lIdx];
    const firstToken = line.tokens[0];
    const isNewItemStart =
      firstToken &&
      /^[0-9]+$/.test(firstToken.text) &&
      Math.abs(firstToken.x - colStarts[0]) <= 25;

    if (isNewItemStart) {
      flushCurrentItem();
      currentItemCells = initEmptyRow();
      hasItem = true;
    } else if (!hasItem) {
      currentItemCells = initEmptyRow();
      hasItem = true;
    }

    // Assign each token on this line to closest column corridor
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

      // Add to corresponding column array
      if (currentItemCells[closestCol]) {
        // If already has text for this line, concatenate or push as new line
        const lastEntry = currentItemCells[closestCol][currentItemCells[closestCol].length - 1];
        if (lastEntry !== undefined && Math.abs(line.y - (line.y)) < 2) {
          currentItemCells[closestCol][currentItemCells[closestCol].length - 1] += " " + t.text;
        } else {
          currentItemCells[closestCol].push(t.text);
        }
      }
    }
  }

  flushCurrentItem();

  return new DocxTable({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });
}

function clusterTokensIntoLinesDirect(tokens: SpatialTextToken[], pageNum: number): ReconstructedLine[] {
  if (tokens.length === 0) return [];
  const sorted = [...tokens].sort((a, b) => a.y - b.y || a.x - b.x);

  const lines: ReconstructedLine[] = [];
  let curTokens: SpatialTextToken[] = [];
  let curY = -1;

  for (const t of sorted) {
    if (curY === -1 || Math.abs(t.y - curY) <= 5) {
      curTokens.push(t);
      if (curY === -1) curY = t.y;
    } else {
      lines.push(buildLineFromTokensDirect(curTokens, curY, pageNum));
      curTokens = [t];
      curY = t.y;
    }
  }

  if (curTokens.length > 0) {
    lines.push(buildLineFromTokensDirect(curTokens, curY, pageNum));
  }

  return lines;
}

function buildLineFromTokensDirect(tokens: SpatialTextToken[], y: number, page: number): ReconstructedLine {
  tokens.sort((a, b) => a.x - b.x);
  const text = tokens.map((t) => t.text).join(" ");
  return {
    y,
    xStart: tokens[0].x,
    xEnd: tokens[tokens.length - 1].x + tokens[tokens.length - 1].width,
    tokens,
    text,
    fontSize: tokens[0].fontSize,
    isBold: tokens.some((t) => t.isBold),
    isItalic: tokens.some((t) => t.isItalic),
    page,
  };
}

async function runTest() {
  console.log("=== Testing Full Complete Invoice Layout Reconstruction ===");

  // Create real test invoice
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.addPage([595.28, 841.89]);

  page.drawText("TAX INVOICE", { x: 250, y: 810, size: 14, font: fontBold, color: rgb(0.1, 0.2, 0.5) });
  page.drawText("Original for Recipient", { x: 460, y: 810, size: 9, font });

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

  page.drawText("S.No", { x: 40, y: 670, size: 9, font: fontBold });
  page.drawText("Item Description", { x: 75, y: 670, size: 9, font: fontBold });
  page.drawText("HSN/SAC", { x: 260, y: 670, size: 9, font: fontBold });
  page.drawText("Qty", { x: 325, y: 670, size: 9, font: fontBold });
  page.drawText("Rate", { x: 360, y: 670, size: 9, font: fontBold });
  page.drawText("Taxable", { x: 430, y: 670, size: 9, font: fontBold });
  page.drawText("IGST (18%)", { x: 505, y: 670, size: 9, font: fontBold });

  page.drawText("1", { x: 40, y: 645, size: 9, font });
  page.drawText("Enterprise Cloud Migration & Architecture", { x: 75, y: 645, size: 9, font });
  page.drawText("998313", { x: 260, y: 645, size: 9, font });
  page.drawText("1.00", { x: 325, y: 645, size: 9, font });
  page.drawText("75,000.00", { x: 360, y: 645, size: 9, font });
  page.drawText("75,000.00", { x: 430, y: 645, size: 9, font });
  page.drawText("13,500.00", { x: 505, y: 645, size: 9, font });

  page.drawText("AWS & Azure Multi-Region Disaster Recovery Setup", { x: 75, y: 630, size: 8, font });
  page.drawText("Period: 01-May-2026 to 31-May-2026", { x: 75, y: 615, size: 8, font });

  page.drawText("2", { x: 40, y: 590, size: 9, font });
  page.drawText("SOC-2 Compliance Security Hardening Audit", { x: 75, y: 590, size: 9, font });
  page.drawText("998315", { x: 260, y: 590, size: 9, font });
  page.drawText("2.00", { x: 325, y: 590, size: 9, font });
  page.drawText("20,000.00", { x: 360, y: 590, size: 9, font });
  page.drawText("40,000.00", { x: 430, y: 590, size: 9, font });
  page.drawText("7,200.00", { x: 505, y: 590, size: 9, font });

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

  // Add tokens manually or from coordinates
  const tokens: SpatialTextToken[] = [
    // Header
    { text: "TAX INVOICE", x: 250, y: 842 - 810, width: 90, height: 14, fontSize: 14, fontName: "Helvetica-Bold", isBold: true, isItalic: false, page: 1 },
    { text: "Original for Recipient", x: 460, y: 842 - 810, width: 80, height: 9, fontSize: 9, fontName: "Helvetica", isBold: false, isItalic: false, page: 1 },

    // Party Left
    { text: "Sold By / Supplier Details:", x: 40, y: 842 - 780, width: 140, height: 10, fontSize: 10, fontName: "Helvetica-Bold", isBold: true, isItalic: false, page: 1 },
    { text: "ACME CLOUD SOLUTIONS PVT LTD", x: 40, y: 842 - 765, width: 180, height: 10, fontSize: 10, fontName: "Helvetica-Bold", isBold: true, isItalic: false, page: 1 },
    { text: "Plot 42, Cyber City, Phase 2, Gurugram, HR - 122002", x: 40, y: 842 - 750, width: 220, height: 9, fontSize: 9, fontName: "Helvetica", isBold: false, isItalic: false, page: 1 },
    { text: "GSTIN: 06AABCA1234F1Z5 | PAN: AABCA1234F", x: 40, y: 842 - 735, width: 200, height: 9, fontSize: 9, fontName: "Helvetica", isBold: false, isItalic: false, page: 1 },
    { text: "State: Haryana (Code: 06)", x: 40, y: 842 - 720, width: 120, height: 9, fontSize: 9, fontName: "Helvetica", isBold: false, isItalic: false, page: 1 },

    // Party Right
    { text: "Invoice Details & Billed To:", x: 320, y: 842 - 780, width: 140, height: 10, fontSize: 10, fontName: "Helvetica-Bold", isBold: true, isItalic: false, page: 1 },
    { text: "Invoice No: INV-2026-8841", x: 320, y: 842 - 763, width: 130, height: 9, fontSize: 9, fontName: "Helvetica-Bold", isBold: true, isItalic: false, page: 1 },
    { text: "Invoice Date: 12-May-2026 | Due: 26-May-2026", x: 320, y: 842 - 748, width: 190, height: 9, fontSize: 9, fontName: "Helvetica", isBold: false, isItalic: false, page: 1 },
    { text: "Billed To: TECHCORP ENTERPRISES INDIA LTD", x: 320, y: 842 - 733, width: 200, height: 9, fontSize: 9, fontName: "Helvetica-Bold", isBold: true, isItalic: false, page: 1 },
    { text: "GSTIN: 27AAGCT9876Q1Z9 | State: Maharashtra (27)", x: 320, y: 842 - 718, width: 210, height: 9, fontSize: 9, fontName: "Helvetica", isBold: false, isItalic: false, page: 1 },
    { text: "Place of Supply: Maharashtra | Reverse Charge: No", x: 320, y: 842 - 703, width: 210, height: 9, fontSize: 9, fontName: "Helvetica", isBold: false, isItalic: false, page: 1 },

    // Table Headers
    { text: "S.No", x: 40, y: 842 - 670, width: 20, height: 9, fontSize: 9, fontName: "Helvetica-Bold", isBold: true, isItalic: false, page: 1 },
    { text: "Item Description", x: 75, y: 842 - 670, width: 80, height: 9, fontSize: 9, fontName: "Helvetica-Bold", isBold: true, isItalic: false, page: 1 },
    { text: "HSN/SAC", x: 260, y: 842 - 670, width: 45, height: 9, fontSize: 9, fontName: "Helvetica-Bold", isBold: true, isItalic: false, page: 1 },
    { text: "Qty", x: 325, y: 842 - 670, width: 20, height: 9, fontSize: 9, fontName: "Helvetica-Bold", isBold: true, isItalic: false, page: 1 },
    { text: "Rate", x: 360, y: 842 - 670, width: 25, height: 9, fontSize: 9, fontName: "Helvetica-Bold", isBold: true, isItalic: false, page: 1 },
    { text: "Taxable", x: 430, y: 842 - 670, width: 40, height: 9, fontSize: 9, fontName: "Helvetica-Bold", isBold: true, isItalic: false, page: 1 },
    { text: "IGST (18%)", x: 505, y: 842 - 670, width: 50, height: 9, fontSize: 9, fontName: "Helvetica-Bold", isBold: true, isItalic: false, page: 1 },

    // Row 1
    { text: "1", x: 40, y: 842 - 645, width: 10, height: 9, fontSize: 9, fontName: "Helvetica", isBold: false, isItalic: false, page: 1 },
    { text: "Enterprise Cloud Migration & Architecture", x: 75, y: 842 - 645, width: 175, height: 9, fontSize: 9, fontName: "Helvetica", isBold: false, isItalic: false, page: 1 },
    { text: "998313", x: 260, y: 842 - 645, width: 35, height: 9, fontSize: 9, fontName: "Helvetica", isBold: false, isItalic: false, page: 1 },
    { text: "1.00", x: 325, y: 842 - 645, width: 20, height: 9, fontSize: 9, fontName: "Helvetica", isBold: false, isItalic: false, page: 1 },
    { text: "75,000.00", x: 360, y: 842 - 645, width: 45, height: 9, fontSize: 9, fontName: "Helvetica", isBold: false, isItalic: false, page: 1 },
    { text: "75,000.00", x: 430, y: 842 - 645, width: 45, height: 9, fontSize: 9, fontName: "Helvetica", isBold: false, isItalic: false, page: 1 },
    { text: "13,500.00", x: 505, y: 842 - 645, width: 45, height: 9, fontSize: 9, fontName: "Helvetica", isBold: false, isItalic: false, page: 1 },

    // Sub-descriptions for Row 1
    { text: "AWS & Azure Multi-Region Disaster Recovery Setup", x: 75, y: 842 - 630, width: 180, height: 8, fontSize: 8, fontName: "Helvetica", isBold: false, isItalic: false, page: 1 },
    { text: "Period: 01-May-2026 to 31-May-2026", x: 75, y: 842 - 615, width: 140, height: 8, fontSize: 8, fontName: "Helvetica", isBold: false, isItalic: false, page: 1 },

    // Row 2
    { text: "2", x: 40, y: 842 - 590, width: 10, height: 9, fontSize: 9, fontName: "Helvetica", isBold: false, isItalic: false, page: 1 },
    { text: "SOC-2 Compliance Security Hardening Audit", x: 75, y: 842 - 590, width: 175, height: 9, fontSize: 9, fontName: "Helvetica", isBold: false, isItalic: false, page: 1 },
    { text: "998315", x: 260, y: 842 - 590, width: 35, height: 9, fontSize: 9, fontName: "Helvetica", isBold: false, isItalic: false, page: 1 },
    { text: "2.00", x: 325, y: 842 - 590, width: 20, height: 9, fontSize: 9, fontName: "Helvetica", isBold: false, isItalic: false, page: 1 },
    { text: "20,000.00", x: 360, y: 842 - 590, width: 45, height: 9, fontSize: 9, fontName: "Helvetica", isBold: false, isItalic: false, page: 1 },
    { text: "40,000.00", x: 430, y: 842 - 590, width: 45, height: 9, fontSize: 9, fontName: "Helvetica", isBold: false, isItalic: false, page: 1 },
    { text: "7,200.00", x: 505, y: 842 - 590, width: 45, height: 9, fontSize: 9, fontName: "Helvetica", isBold: false, isItalic: false, page: 1 },

    // Summary Left
    { text: "Bank Account Details:", x: 40, y: 842 - 530, width: 120, height: 9, fontSize: 9, fontName: "Helvetica-Bold", isBold: true, isItalic: false, page: 1 },
    { text: "Bank Name: HDFC Bank Ltd | A/c No: 50200012345678", x: 40, y: 842 - 515, width: 240, height: 8, fontSize: 8, fontName: "Helvetica", isBold: false, isItalic: false, page: 1 },
    { text: "IFSC Code: HDFC0000240 | Branch: Cyber City Gurugram", x: 40, y: 842 - 500, width: 240, height: 8, fontSize: 8, fontName: "Helvetica", isBold: false, isItalic: false, page: 1 },
    { text: "Amount in Words: One Lakh Thirty-Five Thousand Seven Hundred Only", x: 40, y: 842 - 480, width: 280, height: 8, fontSize: 8, fontName: "Helvetica-Bold", isBold: true, isItalic: false, page: 1 },

    // Summary Right
    { text: "Total Taxable Value:", x: 360, y: 842 - 530, width: 100, height: 9, fontSize: 9, fontName: "Helvetica", isBold: false, isItalic: false, page: 1 },
    { text: "1,15,000.00", x: 485, y: 842 - 530, width: 60, height: 9, fontSize: 9, fontName: "Helvetica-Bold", isBold: true, isItalic: false, page: 1 },
    { text: "Integrated Tax (IGST 18%):", x: 360, y: 842 - 512, width: 120, height: 9, fontSize: 9, fontName: "Helvetica", isBold: false, isItalic: false, page: 1 },
    { text: "20,700.00", x: 485, y: 842 - 512, width: 60, height: 9, fontSize: 9, fontName: "Helvetica", isBold: false, isItalic: false, page: 1 },
    { text: "Invoice Total (INR):", x: 360, y: 842 - 490, width: 110, height: 10, fontSize: 10, fontName: "Helvetica-Bold", isBold: true, isItalic: false, page: 1 },
    { text: "1,35,700.00", x: 485, y: 842 - 490, width: 65, height: 10, fontSize: 10, fontName: "Helvetica-Bold", isBold: true, isItalic: false, page: 1 },
  ];

  const elements = reconstructInvoiceLayoutToDocxElements(tokens, 595.28, 841.89, 1);

  const docx = new DocxDocument({
    creator: "PDFSun Phase 11F Engine",
    sections: [
      {
        properties: {
          page: {
            size: { width: Math.round(595.28 * 20), height: Math.round(841.89 * 20) },
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children: elements,
      },
    ],
  });

  const blob = await Packer.toBlob(docx);
  const buffer = await blob.arrayBuffer();
  console.log(`Successfully packed DOCX: ${buffer.byteLength} bytes`);

  const htmlRes = await mammoth.convertToHtml({ buffer: Buffer.from(buffer) });
  console.log("\n================ MAMMOTH CONVERTED HTML ================");
  console.log(htmlRes.value);
  console.log("========================================================\n");

  // Run Assertions on Reconstructed HTML
  const html = htmlRes.value;

  const hasTitle = html.includes("TAX INVOICE");
  console.log(`[Check 1] Header Title preserved: ${hasTitle ? "PASS" : "FAIL"}`);

  const hasSupplierAndBuyerTable = html.includes("ACME CLOUD SOLUTIONS PVT LTD") && html.includes("TECHCORP ENTERPRISES INDIA LTD");
  console.log(`[Check 2] Supplier & Buyer side-by-side: ${hasSupplierAndBuyerTable ? "PASS" : "FAIL"}`);

  // Check that the grid table has all 7 columns in one single table!
  const has7ColGrid = html.includes("<th><p><strong>S.No</strong></p></th>") &&
    html.includes("<th><p><strong>Item Description</strong></p></th>") &&
    html.includes("<th><p><strong>HSN/SAC</strong></p></th>") &&
    html.includes("<th><p><strong>Qty</strong></p></th>") &&
    html.includes("<th><p><strong>Rate</strong></p></th>") &&
    html.includes("<th><p><strong>Taxable</strong></p></th>") &&
    html.includes("<th><p><strong>IGST (18%)</strong></p></th>");
  console.log(`[Check 3] Complete 7-Column Grid Table: ${has7ColGrid ? "PASS" : "FAIL"}`);

  // Check multi-line description continuation inside description cell
  const hasMultiLineDescInCell = html.includes("Enterprise Cloud Migration &amp; Architecture") &&
    html.includes("AWS &amp; Azure Multi-Region Disaster Recovery Setup") &&
    html.includes("Period: 01-May-2026 to 31-May-2026");
  console.log(`[Check 4] Multi-line Item Description in Cell: ${hasMultiLineDescInCell ? "PASS" : "FAIL"}`);

  // Check Item 2 and HSN codes inside table
  const hasItem2AndHsn = html.includes("SOC-2 Compliance Security Hardening Audit") && html.includes("998315");
  console.log(`[Check 5] Item 2 and HSN code inside table: ${hasItem2AndHsn ? "PASS" : "FAIL"}`);

  // Check Totals & Bank details
  const hasTotalsAndBank = html.includes("HDFC0000240") && html.includes("1,35,700.00") && html.includes("One Lakh Thirty-Five Thousand");
  console.log(`[Check 6] Bank Details and Totals: ${hasTotalsAndBank ? "PASS" : "FAIL"}`);

  // Count tables
  const tableCount = (html.match(/<table/g) || []).length;
  console.log(`[Check 7] Table Count: ${tableCount} (Expected: 3 - Party, Grid, Summary): ${tableCount === 3 ? "PASS" : "FAIL"}`);

  if (hasTitle && hasSupplierAndBuyerTable && has7ColGrid && hasMultiLineDescInCell && hasItem2AndHsn && hasTotalsAndBank && tableCount === 3) {
    console.log("\n🎉 ALL PHASE 11F INVOICE RECONSTRUCTION ACCEPTANCE CHECKS PASSED!");
  } else {
    console.error("\n❌ SOME CHECKS FAILED!");
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
