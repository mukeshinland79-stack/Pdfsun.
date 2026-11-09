/**
 * PDFSun Barcode Studio — Bulk Automation Engine
 * Supports CSV/Excel ingestion, sequential generator, and 1-click ZIP export
 */

import * as XLSX from "xlsx";
import JSZip from "jszip";
import { SymbologyType, LabelItemData } from "./types";
import { renderBarcode } from "./renderer";
import { validateBarcodeInput } from "./validation";

export interface BulkItemResult {
  rowNumber: number;
  data: string;
  symbology: SymbologyType;
  title?: string;
  subtitle?: string;
  price?: string;
  isValid: boolean;
  errorMessage?: string;
  svg?: string;
  dataUrl?: string;
}

export interface SequentialOptions {
  prefix: string;
  startNumber: number;
  endNumber: number;
  padLength: number; // e.g. 5 -> "00001"
  suffix: string;
  symbology: SymbologyType;
  titlePrefix?: string;
}

/**
 * Parses a plain CSV string into LabelItemData records.
 * Supports header detection (value/barcode/code/sku, title, subtitle, price, quantity).
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
    // Simple CSV comma splitter handling quoted values
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
 * Parses an Excel (.xlsx / .xls) buffer or ArrayBuffer into LabelItemData.
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

  // Determine column index map from header row
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
 * Generates sequential barcodes given options.
 */
export function generateSequentialItems(
  options: SequentialOptions
): LabelItemData[] {
  const { prefix, startNumber, endNumber, padLength, suffix, symbology, titlePrefix } = options;
  const count = Math.min(1000, Math.max(1, endNumber - startNumber + 1));
  const items: LabelItemData[] = [];

  for (let i = 0; i < count; i++) {
    const currentNum = startNumber + i;
    const numStr = String(currentNum).padStart(padLength, "0");
    const barcodeValue = `${prefix}${numStr}${suffix}`;

    items.push({
      id: `seq-${i + 1}`,
      barcodeValue,
      symbology,
      title: titlePrefix ? `${titlePrefix} #${currentNum}` : undefined,
      subtitle: `Seq: ${i + 1}/${count}`,
    });
  }

  return items;
}

/**
 * Renders bulk items and creates a downloadable ZIP containing SVG/PNG files and a manifest.
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

  for (let i = 0; i < total; i++) {
    const item = items[i];
    const validation = validateBarcodeInput(item.symbology, item.barcodeValue);
    const cleanFilename = `${String(i + 1).padStart(4, "0")}_${item.barcodeValue.replace(/[^a-zA-Z0-9_-]/g, "_")}.${format}`;

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
        // Base64 PNG
        const base64Data = rendered.dataUrl.split(",")[1];
        if (base64Data) {
          folder?.file(cleanFilename, base64Data, { base64: true });
        }
      }

      manifestRows.push(
        `${i + 1},${item.symbology},"${item.barcodeValue}","${item.title || ""}","${item.price || ""}","${cleanFilename}",OK`
      );
    } catch (err: any) {
      manifestRows.push(
        `${i + 1},${item.symbology},"${item.barcodeValue}","${item.title || ""}","${item.price || ""}","${cleanFilename}",ERROR: ${err?.message || "Failed"}`
      );
    }

    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  zip.file("manifest.csv", manifestRows.join("\n"));
  const zipContent = await zip.generateAsync({ type: "uint8array" });
  return zipContent;
}
