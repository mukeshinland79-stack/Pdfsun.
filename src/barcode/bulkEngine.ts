/**
 * PDFSun Barcode Studio — Bulk Automation Engine
 * Supports CSV/Excel ingestion, duplicate detection, sequential generator, and 1-click ZIP export
 */

import * as XLSX from "xlsx";
import JSZip from "jszip";
import { SymbologyType, LabelItemData } from "./types";
import { renderBarcode } from "./renderer";
import { validateBarcodeInput } from "./validation";

export interface BulkValidatedRow {
  index: number;
  id: string;
  barcodeValue: string;
  symbology: SymbologyType;
  title?: string;
  subtitle?: string;
  price?: string;
  quantity: number;
  isValid: boolean;
  isDuplicate: boolean;
  duplicateCount: number;
  errorMessage?: string;
  warningMessage?: string;
  normalizedValue?: string;
}

export interface SequentialOptions {
  prefix: string;
  startNumber: number;
  endNumber: number;
  step?: number;
  padLength: number; // e.g. 5 -> "00001"
  suffix: string;
  symbology: SymbologyType;
  titlePrefix?: string;
}

/**
 * Validates an entire batch of items, detects duplicates, and checks symbology constraints.
 */
export function validateBulkDataset(items: LabelItemData[]): BulkValidatedRow[] {
  // Count frequency of values
  const freqMap = new Map<string, number>();
  items.forEach((item) => {
    const key = (item.barcodeValue || "").trim();
    if (key) {
      freqMap.set(key, (freqMap.get(key) || 0) + 1);
    }
  });

  return items.map((item, idx) => {
    const rawVal = (item.barcodeValue || "").trim();
    const count = freqMap.get(rawVal) || 0;
    const isDup = count > 1;

    const val = validateBarcodeInput(item.symbology, rawVal);

    return {
      index: idx + 1,
      id: item.id || `item-${idx + 1}`,
      barcodeValue: rawVal,
      symbology: item.symbology,
      title: item.title,
      subtitle: item.subtitle,
      price: item.price,
      quantity: item.quantity || 1,
      isValid: val.isValid,
      isDuplicate: isDup,
      duplicateCount: count,
      errorMessage: val.errorMessage,
      warningMessage: val.warningMessage || (isDup ? `Duplicate value (appears ${count} times)` : undefined),
      normalizedValue: val.normalizedText,
    };
  });
}

/**
 * Parses a plain CSV or multi-line text string into LabelItemData records.
 */
export function parseCsvData(
  csvText: string,
  defaultSymbology: SymbologyType = "code128"
): LabelItemData[] {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const items: LabelItemData[] = [];
  const firstLine = lines[0].toLowerCase();
  const hasHeader =
    firstLine.includes("barcode") ||
    firstLine.includes("code") ||
    firstLine.includes("sku") ||
    firstLine.includes("data") ||
    firstLine.includes("value");

  const dataLines = hasHeader ? lines.slice(1) : lines;

  dataLines.forEach((line, idx) => {
    // CSV comma splitter handling quoted cells
    const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((p) =>
      p.replace(/^"|"$/g, "").trim()
    );

    const val = parts[0] || "";
    if (!val) return;

    items.push({
      id: `bulk-${idx + 1}`,
      barcodeValue: val,
      symbology: defaultSymbology,
      title: parts[1] || undefined,
      subtitle: parts[2] || undefined,
      price: parts[3] || undefined,
      quantity: parts[4] ? parseInt(parts[4], 10) || 1 : 1,
    });
  });

  return items;
}

/**
 * Parses an Excel (.xlsx / .xls) buffer into LabelItemData.
 */
export function parseExcelData(
  buffer: ArrayBuffer | Uint8Array,
  defaultSymbology: SymbologyType = "code128"
): LabelItemData[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const worksheet = workbook.Sheets[firstSheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (rows.length === 0) return [];

  const header = (rows[0] || []).map((h: any) => String(h || "").toLowerCase());
  let valIdx = 0;
  let titleIdx = -1;
  let subIdx = -1;
  let priceIdx = -1;
  let qtyIdx = -1;

  let startRow = 0;
  const isHeaderPresent = header.some((h: string) =>
    h.includes("code") || h.includes("barcode") || h.includes("sku") || h.includes("data")
  );

  if (isHeaderPresent) {
    startRow = 1;
    header.forEach((h: string, idx: number) => {
      if (h.includes("barcode") || h.includes("code") || h.includes("sku") || h.includes("val")) {
        valIdx = idx;
      } else if (h.includes("title") || h.includes("name") || h.includes("desc")) {
        titleIdx = idx;
      } else if (h.includes("sub") || h.includes("category")) {
        subIdx = idx;
      } else if (h.includes("price") || h.includes("cost") || h.includes("mrp") || h.includes("rate")) {
        priceIdx = idx;
      } else if (h.includes("qty") || h.includes("quantity") || h.includes("count")) {
        qtyIdx = idx;
      }
    });
  }

  const items: LabelItemData[] = [];

  for (let r = startRow; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;
    const val = String(row[valIdx] || "").trim();
    if (!val) continue;

    items.push({
      id: `xlsx-${r}`,
      barcodeValue: val,
      symbology: defaultSymbology,
      title: titleIdx >= 0 && row[titleIdx] ? String(row[titleIdx]).trim() : undefined,
      subtitle: subIdx >= 0 && row[subIdx] ? String(row[subIdx]).trim() : undefined,
      price: priceIdx >= 0 && row[priceIdx] ? String(row[priceIdx]).trim() : undefined,
      quantity: qtyIdx >= 0 && row[qtyIdx] ? parseInt(String(row[qtyIdx]), 10) || 1 : 1,
    });
  }

  return items;
}

/**
 * Generates sequential barcodes with customizable prefix, padding, step, and suffix.
 */
export function generateSequentialItems(
  options: SequentialOptions
): LabelItemData[] {
  const { prefix, startNumber, endNumber, step = 1, padLength, suffix, symbology, titlePrefix } = options;
  const actualStep = Math.max(1, step);
  const items: LabelItemData[] = [];
  const maxLimit = 1000;

  let current = startNumber;
  let counter = 1;

  while (current <= endNumber && counter <= maxLimit) {
    const numStr = String(current).padStart(padLength, "0");
    const barcodeValue = `${prefix}${numStr}${suffix}`;

    items.push({
      id: `seq-${counter}`,
      barcodeValue,
      symbology,
      title: titlePrefix ? `${titlePrefix} #${current}` : undefined,
      subtitle: `Seq: ${counter}`,
    });

    current += actualStep;
    counter++;
  }

  return items;
}

/**
 * Exports validated rows as a clean, Excel-compatible CSV file.
 */
export function exportDatasetToCsv(rows: BulkValidatedRow[]): string {
  const headers = ["Index", "BarcodeValue", "Symbology", "Title", "Subtitle", "Price", "Quantity", "Valid", "Duplicate"];
  const lines = [headers.join(",")];

  rows.forEach((r) => {
    const esc = (s?: string) => `"${(s || "").replace(/"/g, '""')}"`;
    lines.push([
      r.index,
      esc(r.barcodeValue),
      r.symbology,
      esc(r.title),
      esc(r.subtitle),
      esc(r.price),
      r.quantity,
      r.isValid ? "TRUE" : "FALSE",
      r.isDuplicate ? "TRUE" : "FALSE",
    ].join(","));
  });

  return lines.join("\n");
}

/**
 * Renders bulk items in non-blocking async chunks and bundles them into a ZIP archive with manifest.
 */
export async function createBulkBarcodeZip(
  items: LabelItemData[],
  format: "svg" | "png" = "svg",
  onProgress?: (processed: number, total: number) => void
): Promise<Uint8Array> {
  const zip = new JSZip();
  const folder = zip.folder(`pdfsun-barcodes-${format}`);
  const total = items.length;
  const manifestRows: string[] = ["Index,Symbology,BarcodeValue,Title,Price,Filename,Status"];

  const chunkSize = 15;
  for (let i = 0; i < total; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);

    for (let c = 0; c < chunk.length; c++) {
      const idx = i + c;
      const item = chunk[c];
      const cleanFilename = `${String(idx + 1).padStart(4, "0")}_${item.barcodeValue.replace(/[^a-zA-Z0-9_-]/g, "_")}.${format}`;

      try {
        const rendered = await renderBarcode({
          symbology: item.symbology,
          text: item.barcodeValue,
          scale: 3,
          includeText: true,
        });

        if (format === "svg") {
          folder?.file(cleanFilename, rendered.svg);
        } else {
          const base64Data = rendered.dataUrl.split(",")[1];
          if (base64Data) {
            folder?.file(cleanFilename, base64Data, { base64: true });
          }
        }

        manifestRows.push(
          `${idx + 1},${item.symbology},"${item.barcodeValue}","${item.title || ""}","${item.price || ""}","${cleanFilename}",OK`
        );
      } catch (err: any) {
        manifestRows.push(
          `${idx + 1},${item.symbology},"${item.barcodeValue}","${item.title || ""}","${item.price || ""}","${cleanFilename}",ERROR: ${err?.message || "Failed"}`
        );
      }

      if (onProgress) {
        onProgress(idx + 1, total);
      }
    }

    // Yield control to browser event loop to prevent UI stutter
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  zip.file("manifest.csv", manifestRows.join("\n"));
  const zipContent = await zip.generateAsync({ type: "uint8array" });
  return zipContent;
}
