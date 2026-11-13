/**
 * PDFSun Barcode Studio — Document & File Data Extraction Engine
 * Supports client-side extraction of barcode payloads, SKUs, and QR data from:
 * PDF, DOCX, XLSX, XLS, CSV, TXT, JSON, XML, and Images (QR/Barcode scanning)
 */

import * as XLSX from "xlsx";
import jsQR from "jsqr";
import mammoth from "mammoth";
import { SymbologyType, LabelItemData } from "./types";

export interface ExtractedBarcodeCandidate {
  id: string;
  value: string;
  title?: string;
  subtitle?: string;
  price?: string;
  quantity?: number;
  sourceContext: string;
  confidence: "high" | "medium" | "detected";
  symbologySuggestion: SymbologyType;
}

export interface DocumentExtractionResult {
  fileName: string;
  fileSize: number;
  fileType: string;
  candidates: ExtractedBarcodeCandidate[];
  rawTextPreview: string;
  error?: string;
}

/**
 * Suggests the best symbology based on token format
 */
export function suggestSymbology(value: string): SymbologyType {
  const clean = value.trim();

  // URL or vCard -> QR Code
  if (/^https?:\/\//i.test(clean) || /^BEGIN:VCARD/i.test(clean) || clean.includes("mailto:") || clean.includes("tel:")) {
    return "qrcode";
  }

  // Pure digits
  if (/^\d+$/.test(clean)) {
    if (clean.length === 12) return "upca";
    if (clean.length === 13) {
      if (clean.startsWith("978") || clean.startsWith("979")) return "isbn";
      return "ean13";
    }
    if (clean.length === 14) return "itf14";
    if (clean.length === 8) return "ean8";
  }

  // Alphanumeric with special barcode characters -> Code 128
  if (/^[A-Za-z0-9\-_./ ]+$/.test(clean)) {
    if (clean.length > 25) return "datamatrix";
    return "code128";
  }

  // Complex multiline text -> QR Code
  return "qrcode";
}

/**
 * Extracts candidate barcode values from raw text lines or blocks
 */
export function extractCandidatesFromText(
  text: string,
  sourceLabel: string
): ExtractedBarcodeCandidate[] {
  const candidates: ExtractedBarcodeCandidate[] = [];
  const seen = new Set<string>();

  // Tokenize lines
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Common barcode/SKU regexes
  const skuRegex = /\b(?:SKU|ITEM|CODE|PROD|INV|REF|PART|SN)[-_:]?\s*([A-Za-z0-9\-_]{4,30})\b/gi;
  const gtinRegex = /\b(\d{12,14})\b/g;
  const urlRegex = /\b(https?:\/\/[^\s"'<>]+)\b/gi;

  let idCounter = 1;

  for (const line of lines) {
    // 1. Explicit SKU / code keywords
    let skuMatch: RegExpExecArray | null;
    while ((skuMatch = skuRegex.exec(line)) !== null) {
      const val = skuMatch[1];
      if (val && !seen.has(val) && val.length >= 4) {
        seen.add(val);
        candidates.push({
          id: `cand-${idCounter++}`,
          value: val,
          sourceContext: `${sourceLabel} (Keyword Match)`,
          confidence: "high",
          symbologySuggestion: suggestSymbology(val),
        });
      }
    }

    // 2. GTIN / EAN / UPC numeric runs
    let gtinMatch: RegExpExecArray | null;
    while ((gtinMatch = gtinRegex.exec(line)) !== null) {
      const val = gtinMatch[1];
      if (val && !seen.has(val)) {
        seen.add(val);
        candidates.push({
          id: `cand-${idCounter++}`,
          value: val,
          sourceContext: `${sourceLabel} (GTIN / UPC Sequence)`,
          confidence: "high",
          symbologySuggestion: suggestSymbology(val),
        });
      }
    }

    // 2b. Amazon FNSKU (starts with X0 followed by 8 alphanumeric chars)
    const fnskuRegex = /\b(X0[A-Za-z0-9]{8})\b/gi;
    let fnskuMatch: RegExpExecArray | null;
    while ((fnskuMatch = fnskuRegex.exec(line)) !== null) {
      const val = fnskuMatch[1].toUpperCase();
      if (val && !seen.has(val)) {
        seen.add(val);
        candidates.push({
          id: `cand-${idCounter++}`,
          value: val,
          sourceContext: `${sourceLabel} (Amazon FNSKU)`,
          confidence: "high",
          symbologySuggestion: "amazon-fnsku",
        });
      }
    }

    // 3. URLs for QR codes
    let urlMatch: RegExpExecArray | null;
    while ((urlMatch = urlRegex.exec(line)) !== null) {
      const val = urlMatch[1];
      if (val && !seen.has(val)) {
        seen.add(val);
        candidates.push({
          id: `cand-${idCounter++}`,
          value: val,
          sourceContext: `${sourceLabel} (URL Link)`,
          confidence: "high",
          symbologySuggestion: "qrcode",
        });
      }
    }

    // 4. Standalone token per line if short and code-like
    if (line.length >= 3 && line.length <= 40 && !seen.has(line) && !line.includes("  ")) {
      if (/^[A-Za-z0-9\-_./]+$/.test(line)) {
        seen.add(line);
        candidates.push({
          id: `cand-${idCounter++}`,
          value: line,
          sourceContext: `${sourceLabel} (Line Value)`,
          confidence: "medium",
          symbologySuggestion: suggestSymbology(line),
        });
      }
    }

    if (candidates.length >= 100) break; // Reasonable cap
  }

  return candidates;
}

/**
 * Scan an uploaded image file for QR codes using client-side jsQR
 */
async function extractFromImage(file: File): Promise<{ candidates: ExtractedBarcodeCandidate[]; text: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve({ candidates: [], text: `Image loaded: ${img.width}x${img.height}px` });
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

          if (qrCode && qrCode.data) {
            resolve({
              candidates: [
                {
                  id: "cand-img-qr-1",
                  value: qrCode.data,
                  sourceContext: "Decoded QR Code from Image",
                  confidence: "high",
                  symbologySuggestion: "qrcode",
                },
              ],
              text: `Decoded QR Code: ${qrCode.data}`,
            });
          } else {
            // Fallback: file name as reference code
            const nameBase = file.name.replace(/\.[^/.]+$/, "");
            resolve({
              candidates: [
                {
                  id: "cand-img-name",
                  value: nameBase,
                  sourceContext: "Image Filename Reference",
                  confidence: "medium",
                  symbologySuggestion: suggestSymbology(nameBase),
                },
              ],
              text: `Image parsed: ${file.name} (${img.width}x${img.height}px). No raw 2D QR found. Extracted filename slug.`,
            });
          }
        } catch (err: any) {
          resolve({ candidates: [], text: `Image scan failed: ${err?.message || err}` });
        }
      };
      img.onerror = () => resolve({ candidates: [], text: "Failed to load image." });
      img.src = (e.target?.result as string) || "";
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Parses XLSX / XLS files into structured candidate items
 */
async function extractFromExcel(file: File): Promise<{ candidates: ExtractedBarcodeCandidate[]; text: string }> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const candidates: ExtractedBarcodeCandidate[] = [];
  const textLines: string[] = [];
  const seen = new Set<string>();
  let idCounter = 1;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (rows.length === 0) continue;

    const header = (rows[0] || []).map((h: any) => String(h || "").toLowerCase());
    let valCol = -1;
    let titleCol = -1;
    let priceCol = -1;
    let subCol = -1;

    header.forEach((h: string, idx: number) => {
      if (valCol === -1 && (h.includes("barcode") || h.includes("code") || h.includes("sku") || h.includes("gtin") || h.includes("ean") || h.includes("upc"))) {
        valCol = idx;
      }
      if (titleCol === -1 && (h.includes("title") || h.includes("name") || h.includes("product") || h.includes("item"))) {
        titleCol = idx;
      }
      if (priceCol === -1 && (h.includes("price") || h.includes("cost") || h.includes("mrp") || h.includes("amount"))) {
        priceCol = idx;
      }
      if (subCol === -1 && (h.includes("subtitle") || h.includes("desc") || h.includes("category"))) {
        subCol = idx;
      }
    });

    if (valCol === -1) valCol = 0; // Default to first column

    rows.slice(1).forEach((row, rIdx) => {
      const rawVal = row[valCol];
      if (rawVal !== undefined && rawVal !== null) {
        const strVal = String(rawVal).trim();
        if (strVal && !seen.has(strVal)) {
          seen.add(strVal);
          const title = titleCol !== -1 && row[titleCol] ? String(row[titleCol]).trim() : undefined;
          const price = priceCol !== -1 && row[priceCol] ? String(row[priceCol]).trim() : undefined;
          const subtitle = subCol !== -1 && row[subCol] ? String(row[subCol]).trim() : undefined;

          candidates.push({
            id: `cand-xl-${idCounter++}`,
            value: strVal,
            title,
            price,
            subtitle,
            sourceContext: `Sheet: ${sheetName}, Row ${rIdx + 2}`,
            confidence: "high",
            symbologySuggestion: suggestSymbology(strVal),
          });

          textLines.push(`${strVal}${title ? ` | ${title}` : ""}${price ? ` | ${price}` : ""}`);
        }
      }
    });
  }

  return { candidates, text: textLines.slice(0, 50).join("\n") };
}

/**
 * Universal Document Extractor
 */
export async function extractBarcodesFromDocument(file: File): Promise<DocumentExtractionResult> {
  const result: DocumentExtractionResult = {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || "application/octet-stream",
    candidates: [],
    rawTextPreview: "",
  };

  const nameLower = file.name.toLowerCase();

  try {
    // 1. Spreadsheet (.xlsx, .xls)
    if (nameLower.endsWith(".xlsx") || nameLower.endsWith(".xls") || file.type.includes("spreadsheet")) {
      const { candidates, text } = await extractFromExcel(file);
      result.candidates = candidates;
      result.rawTextPreview = text;
      return result;
    }

    // 2. CSV / TXT / JSON / XML
    if (nameLower.endsWith(".csv") || nameLower.endsWith(".txt") || nameLower.endsWith(".json") || nameLower.endsWith(".xml")) {
      const text = await file.text();
      result.rawTextPreview = text.slice(0, 1000);

      if (nameLower.endsWith(".json")) {
        try {
          const parsed = JSON.parse(text);
          const flatStrings: string[] = [];
          const traverse = (obj: any) => {
            if (typeof obj === "string" || typeof obj === "number") {
              flatStrings.push(String(obj));
            } else if (Array.isArray(obj)) {
              obj.forEach(traverse);
            } else if (obj && typeof obj === "object") {
              Object.entries(obj).forEach(([k, v]) => {
                if (k.toLowerCase().includes("barcode") || k.toLowerCase().includes("sku") || k.toLowerCase().includes("code")) {
                  flatStrings.unshift(String(v));
                } else {
                  traverse(v);
                }
              });
            }
          };
          traverse(parsed);
          result.candidates = extractCandidatesFromText(flatStrings.join("\n"), "JSON File");
          return result;
        } catch {
          // Fall back to plain text extraction
        }
      }

      result.candidates = extractCandidatesFromText(text, file.name);
      return result;
    }

    // 3. Word Document (.docx)
    if (nameLower.endsWith(".docx")) {
      const buffer = await file.arrayBuffer();
      const mammothResult = await mammoth.extractRawText({ arrayBuffer: buffer });
      const text = mammothResult.value || "";
      result.rawTextPreview = text.slice(0, 1000);
      result.candidates = extractCandidatesFromText(text, "DOCX Document");
      return result;
    }

    // 4. PDF Document (.pdf)
    if (nameLower.endsWith(".pdf") || file.type === "application/pdf") {
      const buffer = await file.arrayBuffer();
      // Fast client-side string scan for printable tokens
      const uint8 = new Uint8Array(buffer);
      let binaryStr = "";
      const sampleLimit = Math.min(uint8.length, 500000);
      for (let i = 0; i < sampleLimit; i++) {
        const c = uint8[i];
        if ((c >= 32 && c <= 126) || c === 10 || c === 13) {
          binaryStr += String.fromCharCode(c);
        } else if (c === 0) {
          binaryStr += " ";
        }
      }
      result.rawTextPreview = binaryStr.slice(0, 1000);
      result.candidates = extractCandidatesFromText(binaryStr, "PDF Document");
      return result;
    }

    // 5. Image Files (PNG, JPG, WEBP, etc.)
    if (file.type.startsWith("image/") || /\.(png|jpe?g|webp|bmp|gif|svg)$/i.test(nameLower)) {
      const { candidates, text } = await extractFromImage(file);
      result.candidates = candidates;
      result.rawTextPreview = text;
      return result;
    }

    // 6. Generic Fallback
    const fallbackText = await file.text();
    result.rawTextPreview = fallbackText.slice(0, 1000);
    result.candidates = extractCandidatesFromText(fallbackText, file.name);
    return result;
  } catch (err: any) {
    result.error = err?.message || "Failed to parse document.";
    return result;
  }
}

export function isSupportedExtractorFile(fileName: string): boolean {
  const ext = fileName.toLowerCase().split(".").pop();
  if (!ext) return false;
  const supported = ["pdf", "docx", "xlsx", "xls", "csv", "txt", "json", "xml", "png", "jpg", "jpeg", "webp", "bmp", "gif"];
  return supported.includes(ext);
}

export async function extractDataFromDocument(file: File) {
  const extResult = await extractBarcodesFromDocument(file);
  const nameLower = file.name.toLowerCase();

  let sourceType: "spreadsheet" | "document" | "image" | "code" | "text" = "document";
  let tableData: { headers: string[]; rows: any[][] } | undefined;

  if (nameLower.endsWith(".csv") || nameLower.endsWith(".xlsx") || nameLower.endsWith(".xls")) {
    sourceType = "spreadsheet";
  } else if (nameLower.endsWith(".json")) {
    sourceType = "code";
  } else if (nameLower.endsWith(".txt")) {
    sourceType = "text";
  } else if (file.type.startsWith("image/") || /\.(png|jpe?g|webp|bmp|gif)$/i.test(nameLower)) {
    sourceType = "image";
  }

  if (nameLower.endsWith(".csv")) {
    const text = await file.text();
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const rows = lines.slice(1).map((l) => l.split(",").map((p) => p.trim()));
      tableData = { headers, rows };
    }
  } else if (nameLower.endsWith(".json")) {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const headers = Object.keys(parsed[0]);
        const rows = parsed.map((obj) => headers.map((h) => obj[h]));
        tableData = { headers, rows };
      }
    } catch {}
  }

  const detectedCodes = extResult.candidates.map((c) => c.value);

  return {
    sourceType,
    fileName: file.name,
    tableData,
    detectedCodes,
    candidates: extResult.candidates,
    rawTextPreview: extResult.rawTextPreview,
  };
}
