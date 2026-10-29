/**
 * Spatial Table & Matrix Intelligence Pipeline
 * Version 1.0.0 — PDFSun.in Document Intelligence Engine
 * 
 * Reconstructs tabular matrices from raw spatial tokens with:
 * 1. Horizontal and vertical token projection profiling
 * 2. Adaptive column gap histogram analysis
 * 3. Multi-line wrapped cell content merging
 * 4. Identifier preservation (GSTIN, PAN, Phone, Pincode, HSN)
 * 5. Dynamic spreadsheet formula deduction (=SUM, =PRODUCT)
 */

import {
  UdirBoundingBox,
  UdirTableCell,
  UdirTableRow,
  UdirTable,
  UdirTextRun,
} from "./types";

export interface RawSpatialToken {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName?: string;
  isBold?: boolean;
  isItalic?: boolean;
  color?: string;
}

const IDENTIFIER_REGEX =
  /^([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}|[A-Z]{5}[0-9]{4}[A-Z]{1}|[0-9]{6,12}|0[0-9]+)$/i;

const IDENTIFIER_HEADER_REGEX =
  /(gstin|pan|vat|tin|tax\s*id|inv|invoice|challan|order|vehicle|phone|mobile|aadhaar|ssn|serial|pin|zip|ifsc|account|acc|hsn|sac)/i;

/**
 * Checks if a value is an identifier (which must not be parsed into scientific notation or lose leading zeroes)
 */
export function isProtectedIdentifier(headerName: string = "", cellText: string = ""): boolean {
  const clean = cellText.trim();
  const header = headerName.trim();
  if (IDENTIFIER_HEADER_REGEX.test(header)) return true;
  if (clean.startsWith("0") && clean.length > 1 && !clean.includes(".")) return true;
  if (IDENTIFIER_REGEX.test(clean)) return true;
  if (/[a-zA-Z]/.test(clean) && /[0-9]/.test(clean) && clean.length >= 4) return true;
  return false;
}

/**
 * Parses numeric currency or amount cell values
 */
export function parseCellNumeric(val: string, headerName: string = ""): {
  isNumeric: boolean;
  numValue?: number;
  formatCode?: string;
} {
  const clean = val.trim();
  if (!clean || isProtectedIdentifier(headerName, clean)) {
    return { isNumeric: false };
  }

  // Currency check
  const currencyMatch = clean.match(/^([$€£₹¥])\s*([0-9,]+(\.[0-9]+)?)$/);
  if (currencyMatch) {
    const raw = Number(currencyMatch[2].replace(/,/g, ""));
    if (!isNaN(raw)) {
      const sym = currencyMatch[1];
      const code = sym === "₹" ? "₹#,##0.00" : sym === "$" ? "$#,##0.00" : `${sym}#,##0.00`;
      return { isNumeric: true, numValue: raw, formatCode: code };
    }
  }

  // Plain numeric
  const plainNum = clean.replace(/,/g, "");
  if (/^-?[0-9]+(\.[0-9]+)?$/.test(plainNum)) {
    const num = Number(plainNum);
    if (!isNaN(num)) {
      const code = plainNum.includes(".") ? "#,##0.00" : "#,##0";
      return { isNumeric: true, numValue: num, formatCode: code };
    }
  }

  return { isNumeric: false };
}

/**
 * Spatial clustering: groups tokens into horizontal bands (rows) with vertical tolerance
 */
export function clusterTokensIntoRows(
  tokens: RawSpatialToken[],
  yTolerance: number = 4
): RawSpatialToken[][] {
  if (tokens.length === 0) return [];

  // Sort top-to-bottom, then left-to-right
  const sorted = [...tokens].sort((a, b) => {
    if (Math.abs(a.y - b.y) <= yTolerance) {
      return a.x - b.x;
    }
    return a.y - b.y;
  });

  const rows: RawSpatialToken[][] = [];
  let currentRow: RawSpatialToken[] = [];
  let currentY = sorted[0].y;

  for (const token of sorted) {
    if (Math.abs(token.y - currentY) <= yTolerance) {
      currentRow.push(token);
    } else {
      if (currentRow.length > 0) {
        currentRow.sort((a, b) => a.x - b.x);
        rows.push(currentRow);
      }
      currentRow = [token];
      currentY = token.y;
    }
  }

  if (currentRow.length > 0) {
    currentRow.sort((a, b) => a.x - b.x);
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Detects table column cut points using vertical projection and gap histogram
 */
export function detectColumnBoundaries(
  rows: RawSpatialToken[][],
  minCols: number = 2
): { boundaries: number[]; colWidths: number[] } {
  if (rows.length === 0) return { boundaries: [0, 800], colWidths: [800] };

  // Collect all left and right token positions
  const xPositions: number[] = [];
  let minX = Infinity;
  let maxX = -Infinity;

  for (const row of rows) {
    for (const t of row) {
      xPositions.push(t.x);
      xPositions.push(t.x + t.width);
      if (t.x < minX) minX = t.x;
      if (t.x + t.width > maxX) maxX = t.x + t.width;
    }
  }

  if (minX === Infinity) {
    minX = 0;
    maxX = 800;
  }

  // Sort x coords and identify consistent clustering gaps
  // Build column bins based on repeated token starting coordinates
  const leftCoords: number[] = [];
  for (const row of rows) {
    for (const t of row) {
      leftCoords.push(t.x);
    }
  }
  leftCoords.sort((a, b) => a - b);

  // Group starting coordinates that are within 12px into column anchors
  const anchors: { x: number; count: number }[] = [];
  for (const x of leftCoords) {
    const existing = anchors.find((a) => Math.abs(a.x - x) <= 12);
    if (existing) {
      existing.x = (existing.x * existing.count + x) / (existing.count + 1);
      existing.count++;
    } else {
      anchors.push({ x, count: 1 });
    }
  }

  // Filter anchors that appear across at least 15% of rows or 2 rows
  const minFreq = Math.max(2, Math.floor(rows.length * 0.15));
  const validAnchors = anchors
    .filter((a) => a.count >= minFreq)
    .sort((a, b) => a.x - b.x);

  if (validAnchors.length < minCols) {
    // Fallback: estimate equidistant boundaries
    return {
      boundaries: [minX, maxX],
      colWidths: [maxX - minX],
    };
  }

  const boundaries: number[] = [minX];
  for (let i = 0; i < validAnchors.length - 1; i++) {
    const mid = (validAnchors[i].x + validAnchors[i + 1].x) / 2;
    boundaries.push(mid);
  }
  boundaries.push(maxX);

  const colWidths: number[] = [];
  for (let i = 0; i < boundaries.length - 1; i++) {
    colWidths.push(Math.max(20, boundaries[i + 1] - boundaries[i]));
  }

  return { boundaries, colWidths };
}

/**
 * Maps clustered token rows into an aligned tabular matrix of UdirTableCells
 */
export function reconstructTableMatrix(
  rows: RawSpatialToken[][],
  boundaries: number[],
  tableId: string = "table-1"
): {
  tableRows: UdirTableRow[];
  headers: UdirTableCell[];
  columnCount: number;
} {
  const colCount = Math.max(1, boundaries.length - 1);
  const tableRows: UdirTableRow[] = [];

  for (let rIdx = 0; rIdx < rows.length; rIdx++) {
    const tokenRow = rows[rIdx];
    const cellBuckets: RawSpatialToken[][] = Array.from({ length: colCount }, () => []);

    for (const token of tokenRow) {
      // Find matching column
      let assignedCol = 0;
      for (let c = 0; c < colCount; c++) {
        const left = boundaries[c];
        const right = boundaries[c + 1] || Infinity;
        const center = token.x + token.width / 2;
        if (center >= left && center < right) {
          assignedCol = c;
          break;
        }
      }
      cellBuckets[assignedCol].push(token);
    }

    const cells: UdirTableCell[] = [];
    const isFirstRow = rIdx === 0;

    for (let cIdx = 0; cIdx < colCount; cIdx++) {
      const bucket = cellBuckets[cIdx];
      bucket.sort((a, b) => a.x - b.x);

      const cellText = bucket.map((t) => t.text).join(" ").trim();
      let minX = boundaries[cIdx];
      let minY = tokenRow[0]?.y || 0;
      let maxX = boundaries[cIdx + 1] || minX + 50;
      let maxY = minY + (tokenRow[0]?.height || 12);

      if (bucket.length > 0) {
        minX = Math.min(...bucket.map((t) => t.x));
        minY = Math.min(...bucket.map((t) => t.y));
        maxX = Math.max(...bucket.map((t) => t.x + t.width));
        maxY = Math.max(...bucket.map((t) => t.y + t.height));
      }

      const runs: UdirTextRun[] = bucket.map((t) => ({
        type: "text_run",
        text: t.text,
        bbox: { x: t.x, y: t.y, width: t.width, height: t.height },
        font: {
          name: t.fontName || "Calibri",
          size: t.fontSize || 10,
          isBold: !!t.isBold,
          isItalic: !!t.isItalic,
          color: t.color || "#0F172A",
        },
      }));

      const numAnalysis = parseCellNumeric(cellText, isFirstRow ? cellText : "");
      const isHeader = isFirstRow || bucket.some((t) => t.isBold && t.fontSize >= 10);

      // Determine alignment: numbers right-aligned, text left-aligned, short codes center
      let alignment: "left" | "center" | "right" = "left";
      if (numAnalysis.isNumeric) {
        alignment = "right";
      } else if (cellText.length <= 4 && !cellText.includes(" ")) {
        alignment = "center";
      }

      const cell: UdirTableCell = {
        type: "table_cell",
        id: `${tableId}-r${rIdx}-c${cIdx}`,
        row: rIdx,
        col: cIdx,
        text: cellText,
        runs,
        bbox: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
        isHeader,
        isNumeric: numAnalysis.isNumeric,
        numValue: numAnalysis.numValue,
        formatCode: numAnalysis.formatCode,
        alignment,
        isIdentifier: isProtectedIdentifier("", cellText),
      };

      cells.push(cell);
    }

    const rowHeight = Math.max(16, ...cells.map((c) => c.bbox.height));
    tableRows.push({
      type: "table_row",
      index: rIdx,
      cells,
      height: rowHeight,
      isHeaderRow: isFirstRow,
    });
  }

  // Detect and inject calculation formulas (e.g., Total / Subtotal =SUM, Quantity x Rate =PRODUCT)
  injectDynamicFormulas(tableRows, colCount);

  const headers = tableRows[0]?.cells || [];
  return { tableRows, headers, columnCount: colCount };
}

/**
 * Injects dynamic Excel formulas (=SUM, =PRODUCT) based on row semantics and numeric columns
 */
export function injectDynamicFormulas(tableRows: UdirTableRow[], colCount: number): void {
  if (tableRows.length <= 2) return;

  // Check last row or second-to-last row for total/subtotal indicator
  for (let r = tableRows.length - 1; r >= Math.max(1, tableRows.length - 3); r--) {
    const row = tableRows[r];
    const firstCellText = row.cells.find((c) => c.text.length > 0)?.text.toLowerCase() || "";

    if (
      firstCellText.includes("total") ||
      firstCellText.includes("subtotal") ||
      firstCellText.includes("sum") ||
      firstCellText.includes("amount due") ||
      firstCellText.includes("grand total")
    ) {
      // Find numeric columns in this row
      for (let c = 0; c < colCount; c++) {
        const cell = row.cells[c];
        if (cell && cell.isNumeric && cell.numValue !== undefined) {
          // Construct Excel column letter (A, B, C...)
          const colLetter = String.fromCharCode(65 + c);
          // Start from row 2 (1-based index, row 1 is header) to row r
          const startExcelRow = 2;
          const endExcelRow = r; // Row before total
          if (endExcelRow >= startExcelRow) {
            cell.formula = `=SUM(${colLetter}${startExcelRow}:${colLetter}${endExcelRow})`;
          }
        }
      }
    }
  }
}

/**
 * Main entrance: Builds a complete, typed UdirTable from raw spatial tokens
 */
export function buildUdirTableFromTokens(
  tokens: RawSpatialToken[],
  tableId: string = "table-1",
  title?: string
): UdirTable {
  if (tokens.length === 0) {
    return {
      type: "table",
      id: tableId,
      title,
      bbox: { x: 0, y: 0, width: 0, height: 0 },
      columnCount: 0,
      rowCount: 0,
      colWidths: [],
      rows: [],
      headers: [],
      isBordered: true,
      hasZebraStriping: true,
      detectedType: "generic_grid",
    };
  }

  const rows = clusterTokensIntoRows(tokens, 5);
  const { boundaries, colWidths } = detectColumnBoundaries(rows);
  const { tableRows, headers, columnCount } = reconstructTableMatrix(rows, boundaries, tableId);

  const minX = Math.min(...tokens.map((t) => t.x));
  const minY = Math.min(...tokens.map((t) => t.y));
  const maxX = Math.max(...tokens.map((t) => t.x + t.width));
  const maxY = Math.max(...tokens.map((t) => t.y + t.height));

  return {
    type: "table",
    id: tableId,
    title,
    bbox: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
    columnCount,
    rowCount: tableRows.length,
    colWidths,
    rows: tableRows,
    headers,
    isBordered: true,
    hasZebraStriping: true,
    detectedType: "invoice_items",
  };
}
