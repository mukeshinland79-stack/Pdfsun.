import ExcelJS from "exceljs";

export interface EnterpriseExcelOptions {
  sheetName?: string;
  headerFillColor?: string; // hex ARGB, e.g. "FF1E293B" (Navy)
  headerTextColor?: string; // hex ARGB, e.g. "FFFFFFFF" (White)
  fontFamily?: string;
  fontSize?: number;
  freezeHeader?: boolean;
  showGridLines?: boolean;
  additionalSheets?: Array<{
    sheetName: string;
    matrix: (string | number | null | undefined)[][];
  }>;
}

export interface VerificationReport {
  isValid: boolean;
  totalColumns: number;
  totalRows: number;
  cellAOverflowCount: number;
  warnings: string[];
}

/**
 * Normalizes a cell value, preserving identifiers with leading zeroes or alphanumeric codes (GSTIN, PAN, Phone),
 * and converting actual numeric values into pure floats/integers with appropriate Excel number formats.
 */
export function normalizeExcelCell(raw: string | number | null | undefined): {
  type: "number" | "string" | "boolean" | "date" | "empty";
  value: any;
  numFmt?: string;
  alignment: Partial<ExcelJS.Alignment>;
} {
  if (raw === null || raw === undefined || raw === "") {
    return {
      type: "empty",
      value: "",
      alignment: { vertical: "middle", horizontal: "left" },
    };
  }

  if (typeof raw === "number") {
    const isInt = Number.isInteger(raw);
    return {
      type: "number",
      value: raw,
      numFmt: isInt ? "#,##0" : "#,##0.00",
      alignment: { vertical: "middle", horizontal: "right" },
    };
  }

  const str = String(raw).trim();
  if (!str) {
    return {
      type: "empty",
      value: "",
      alignment: { vertical: "middle", horizontal: "left" },
    };
  }

  // 1. Preserve Leading Zeroes & Identifiers (Phone numbers, Postal codes, PAN, GSTIN, IDs)
  // GSTIN pattern (2 numbers + 5 letters + 4 numbers + 1 letter + 1 char + Z + 1 char)
  const isGstin = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(str);
  // PAN pattern (5 letters + 4 digits + 1 letter)
  const isPan = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(str);
  // Aadhaar (12 digits) or Phone (10-12 digits, often with leading zero)
  const isPhoneNumber = /^(?:\+91|0)?[6-9]\d{9}$/.test(str.replace(/[\s-]/g, ""));
  const hasLeadingZeroNum = /^0[0-9]{2,}$/.test(str);
  const isAlphaNumericCode = /^[A-Z0-9_\-\/]{4,20}$/i.test(str) && /[A-Z]/i.test(str) && /[0-9]/.test(str);

  if (isGstin || isPan || isPhoneNumber || hasLeadingZeroNum || isAlphaNumericCode) {
    return {
      type: "string",
      value: str,
      numFmt: "@", // Explicit text format to prevent Excel from stripping leading zeroes
      alignment: { vertical: "middle", horizontal: "center" },
    };
  }

  // 2. Dates detection (e.g. YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY)
  const isDate =
    /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(str) ||
    /^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(str) ||
    /^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}$/i.test(str);

  if (isDate) {
    return {
      type: "string",
      value: str,
      alignment: { vertical: "middle", horizontal: "center" },
    };
  }

  // 3. Serial Numbers or Short Indices (e.g., "1", "2", "3", "01")
  if (/^[0-9]{1,3}$/.test(str) && Number(str) < 1000) {
    const num = parseInt(str, 10);
    return {
      type: "number",
      value: num,
      numFmt: "#,##0",
      alignment: { vertical: "middle", horizontal: "center" },
    };
  }

  // 4. Currency / Percentage / Numeric Conversion
  // Clean currency symbols: ₹, $, €, £, ¥ and commas
  const cleanedNumStr = str.replace(/[₹$€£¥,\s]/g, "");
  const isPercentage = /^-?\d+(?:\.\d+)?%$/.test(str.trim());

  if (isPercentage) {
    const num = parseFloat(cleanedNumStr.replace("%", "")) / 100;
    return {
      type: "number",
      value: num,
      numFmt: "0.00%",
      alignment: { vertical: "middle", horizontal: "right" },
    };
  }

  if (/^-?\d+(?:\.\d+)?$/.test(cleanedNumStr)) {
    const num = Number(cleanedNumStr);
    if (!isNaN(num) && isFinite(num)) {
      const isInt = Number.isInteger(num);
      return {
        type: "number",
        value: num,
        numFmt: isInt ? "#,##0" : "#,##0.00",
        alignment: { vertical: "middle", horizontal: "right" },
      };
    }
  }

  // 5. General Text String
  return {
    type: "string",
    value: str,
    alignment: {
      vertical: "middle",
      horizontal: "left",
      wrapText: str.length > 25, // Auto-wrap longer text cells to avoid clipping
    },
  };
}

/**
 * Structural Sanity Check to prevent corrupted or merged single-column tables
 */
export function verifyTableStructure(matrix: (string | number | null | undefined)[][]): VerificationReport {
  if (!matrix || matrix.length === 0) {
    return {
      isValid: false,
      totalColumns: 0,
      totalRows: 0,
      cellAOverflowCount: 0,
      warnings: ["Spreadsheet matrix is empty."],
    };
  }

  const totalRows = matrix.length;
  const colCounts = matrix.map((row) => (row || []).length);
  const totalColumns = Math.max(...colCounts, 1);
  const warnings: string[] = [];
  let cellAOverflowCount = 0;

  for (let r = 0; r < totalRows; r++) {
    const row = matrix[r] || [];
    const cellA = String(row[0] || "").trim();
    const rowFullText = row.map((c) => String(c || "").trim()).join(" ");

    // Check if cell A contains >80% of entire row's text while total text is large
    if (rowFullText.length > 40 && cellA.length > 0) {
      const ratio = cellA.length / rowFullText.length;
      if (ratio > 0.8 && row.length > 2) {
        cellAOverflowCount++;
      }
    }
  }

  if (cellAOverflowCount > Math.max(2, totalRows * 0.4)) {
    warnings.push(
      `Potential column merge detected: ${cellAOverflowCount} rows contain over 80% of text in Cell A.`
    );
  }

  return {
    isValid: true,
    totalColumns,
    totalRows,
    cellAOverflowCount,
    warnings,
  };
}

/**
 * Ensures a 2D matrix is rectangular (all rows padded to maxCols) and clean strings.
 */
export function ensurePaddedMatrix(matrix: (string | number | null | undefined)[][]): string[][] {
  if (!matrix || matrix.length === 0) return [[""]];
  const maxCols = Math.max(...matrix.map((r) => (r ? r.length : 0)), 1);
  return matrix.map((row) => {
    const r = (row || []).map((c) => (c === null || c === undefined ? "" : String(c)));
    while (r.length < maxCols) {
      r.push("");
    }
    return r;
  });
}

/**
 * Builds an enterprise-grade formatted OpenXML Excel (.xlsx) file using ExcelJS.
 * Features:
 * - Dynamic column auto-width calculation with safety padding: max(max_len + 4, 12)
 * - Dark Navy Accent (#1E293B) Header with Bold White 11pt typography
 * - Explicit Gridlines enabled
 * - Strict Number/String alignment (numbers right, IDs/dates center, text left with wrapText)
 * - Identifiers with leading zeroes (PAN, GSTIN, Phone) preserved with text format '@'
 */
export async function generateEnterpriseExcel(
  matrix: (string | number | null | undefined)[][],
  options?: EnterpriseExcelOptions
): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PDFSun.in Enterprise Document Engine";
  workbook.lastModifiedBy = "PDFSun.in";
  workbook.created = new Date();
  workbook.modified = new Date();

  const primarySheetName = (options?.sheetName || "Table_Data").slice(0, 31);
  const fontFamily = options?.fontFamily || "Calibri";
  const fontSize = options?.fontSize || 11;
  const headerFill = options?.headerFillColor || "FF1E293B"; // Dark Navy Slate-900
  const headerTextColor = options?.headerTextColor || "FFFFFFFF"; // White
  const showGridLines = options?.showGridLines !== false;
  const freezeHeader = options?.freezeHeader !== false;

  // Render primary sheet
  renderSheetFromMatrix(workbook, primarySheetName, matrix, {
    fontFamily,
    fontSize,
    headerFill,
    headerTextColor,
    showGridLines,
    freezeHeader,
  });

  // Render additional sheets if provided
  if (options?.additionalSheets && options.additionalSheets.length > 0) {
    for (const addSheet of options.additionalSheets) {
      const name = addSheet.sheetName.slice(0, 31);
      renderSheetFromMatrix(workbook, name, addSheet.matrix, {
        fontFamily,
        fontSize,
        headerFill: "FF2563EB", // Royal Blue accent for secondary summary sheets
        headerTextColor,
        showGridLines,
        freezeHeader,
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}

function renderSheetFromMatrix(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  matrix: (string | number | null | undefined)[][],
  styling: {
    fontFamily: string;
    fontSize: number;
    headerFill: string;
    headerTextColor: string;
    showGridLines: boolean;
    freezeHeader: boolean;
  }
) {
  const safeMatrix = (!matrix || matrix.length === 0) ? [["Document Content"], ["No structured data available."]] : matrix;
  const worksheet = workbook.addWorksheet(sheetName, {
    views: [
      {
        showGridLines: styling.showGridLines,
        state: styling.freezeHeader ? "frozen" : "normal",
        ySplit: styling.freezeHeader ? 1 : 0,
        topLeftCell: styling.freezeHeader ? "A2" : "A1",
        activeCell: styling.freezeHeader ? "A2" : "A1",
      },
    ],
  });

  const numCols = Math.max(...safeMatrix.map((r) => r.length), 1);
  const colMaxLengths: number[] = new Array(numCols).fill(12);

  // Border style for data cells
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FFE2E8F0" } },
    left: { style: "thin", color: { argb: "FFE2E8F0" } },
    bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
    right: { style: "thin", color: { argb: "FFE2E8F0" } },
  };

  const headerBorder: Partial<ExcelJS.Borders> = {
    top: { style: "medium", color: { argb: "FF0F172A" } },
    left: { style: "thin", color: { argb: "FF334155" } },
    bottom: { style: "medium", color: { argb: "FF0F172A" } },
    right: { style: "thin", color: { argb: "FF334155" } },
  };

  safeMatrix.forEach((rowValues, rowIndex) => {
    const isHeaderRow = rowIndex === 0;
    const excelRow = worksheet.getRow(rowIndex + 1);
    excelRow.height = isHeaderRow ? 28 : 22; // Comfortable row height

    for (let colIndex = 0; colIndex < numCols; colIndex++) {
      const rawVal = rowValues[colIndex];
      const cell = excelRow.getCell(colIndex + 1);

      if (isHeaderRow) {
        // --- HEADER STYLING ---
        const headerText = (rawVal !== null && rawVal !== undefined ? String(rawVal).trim() : "") || `Column ${colIndex + 1}`;
        cell.value = headerText;
        cell.font = {
          name: styling.fontFamily,
          size: styling.fontSize,
          bold: true,
          color: { argb: styling.headerTextColor },
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: styling.headerFill },
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };
        cell.border = headerBorder;

        if (headerText.length > colMaxLengths[colIndex]) {
          colMaxLengths[colIndex] = headerText.length;
        }
      } else {
        // --- DATA ROW STYLING ---
        const norm = normalizeExcelCell(rawVal);
        cell.value = norm.value;
        cell.font = {
          name: styling.fontFamily,
          size: styling.fontSize,
          color: { argb: "FF1E293B" },
        };
        if (norm.numFmt) {
          cell.numFmt = norm.numFmt;
        }
        cell.alignment = norm.alignment;
        cell.border = thinBorder;

        // Subtle alternating zebra banding for high readability
        if (rowIndex % 2 === 0) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF8FAFC" }, // ultra light slate-50
          };
        }

        // Track max string length for auto-width
        const strLen = String(norm.value || "").length;
        if (strLen > colMaxLengths[colIndex]) {
          colMaxLengths[colIndex] = Math.min(strLen, 65);
        }
      }
    }
  });

  // Dynamic Column Auto-Fit: width = max(max_len + 4, 12) capped at 65
  for (let c = 0; c < numCols; c++) {
    const col = worksheet.getColumn(c + 1);
    const maxLen = colMaxLengths[c] || 12;
    col.width = Math.min(Math.max(maxLen + 4, 12), 65);
  }
}
