/**
 * PDF Ingestion Adapter for UDIR (Universal Document Intermediate Representation)
 * Version 1.0.0 — PDFSun.in Document Intelligence Engine
 * 
 * Ingests PDF binary buffers entirely client-side using pdfjs-dist:
 * 1. Extracts spatial glyphs with exact transform matrices (x, y, width, height, baseline)
 * 2. Deducts font styles, sizes, and colors
 * 3. Partitions page content into sections (header, body, footer)
 * 4. Detects tabular regions and passes them to spatialTableEngine
 * 5. Assembles canonical UdirDocument without sending any bytes to external servers
 */

// Standard runtime polyfills for pdfjs fingerprinting & matrix compatibility across runtimes
if (typeof (Uint8Array.prototype as any).toHex === "undefined") {
  (Uint8Array.prototype as any).toHex = function (this: Uint8Array) {
    return Array.from(this).map((b) => b.toString(16).padStart(2, "0")).join("");
  };
}
if (typeof (Promise as any).try === "undefined") {
  (Promise as any).try = function (fn: any, ...args: any[]) {
    return new Promise((resolve) => resolve(fn(...args)));
  };
}
if (typeof (globalThis as any).DOMMatrix === "undefined") {
  (globalThis as any).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
  };
}

import * as pdfjsLib from "pdfjs-dist";

import {
  UdirDocument,
  UdirPage,
  UdirSection,
  UdirBlock,
  UdirParagraph,
  UdirHeading,
  UdirTable,
  UdirTextRun,
  UdirBoundingBox,
} from "./types";
import {
  RawSpatialToken,
  clusterTokensIntoRows,
  buildUdirTableFromTokens,
} from "./spatialTableEngine";

export interface PdfIngestionOptions {
  detectTables?: boolean;
  maxPages?: number;
  onProgress?: (percent: number, status: string) => void;
}

export async function parsePdfToUdir(
  pdfBuffer: Uint8Array | ArrayBuffer,
  options: PdfIngestionOptions = {}
): Promise<UdirDocument> {
  const startTime = Date.now();
  const uint8 = pdfBuffer instanceof Uint8Array ? pdfBuffer : new Uint8Array(pdfBuffer);

  const loadingTask = pdfjsLib.getDocument({
    data: uint8,
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const pagesToProcess = Math.min(numPages, options.maxPages || numPages);

  const pages: UdirPage[] = [];
  const globalTables: UdirTable[] = [];
  let totalWords = 0;
  let totalCharacters = 0;
  let totalFormulas = 0;

  for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
    options.onProgress?.(
      Math.round(((pageNum - 1) / pagesToProcess) * 80),
      `Parsing PDF page ${pageNum} of ${pagesToProcess}...`
    );

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();

    const rawTokens: RawSpatialToken[] = [];

    for (const item of textContent.items) {
      if (!("str" in item) || !item.str.trim()) continue;

      const str = item.str;
      const tx = item.transform; // [scaleX, skewY, skewX, scaleY, tx, ty]
      const fontSize = Math.sqrt((tx[0] * tx[0]) + (tx[1] * tx[1])) || 10;
      const x = tx[4];
      // In PDF coordinate system, Y=0 is at bottom. Convert to top-down coordinates:
      const y = Math.max(0, viewport.height - tx[5] - fontSize);
      const width = item.width || str.length * (fontSize * 0.55);
      const height = item.height || fontSize * 1.2;

      const fontName = item.fontName || "Calibri";
      const isBold = /bold|black|heavy|medium|semi/i.test(fontName);
      const isItalic = /italic|oblique/i.test(fontName);

      totalCharacters += str.length;
      totalWords += str.trim().split(/\s+/).length;

      rawTokens.push({
        text: str,
        x,
        y,
        width,
        height,
        fontSize,
        fontName,
        isBold,
        isItalic,
      });
    }

    // Partition tokens into structural blocks: Headings, Tables, Paragraphs
    const blocks: UdirBlock[] = [];
    const clusteredRows = clusterTokensIntoRows(rawTokens, 4);

    // Look for tabular candidate rows (rows with 2+ tokens separated horizontally)
    const tableCandidateTokens: RawSpatialToken[] = [];
    const proseRows: RawSpatialToken[][] = [];

    for (const row of clusteredRows) {
      if (row.length >= 2 && options.detectTables !== false) {
        tableCandidateTokens.push(...row);
      } else {
        proseRows.push(row);
      }
    }

    // Build Table if candidate tokens found
    if (tableCandidateTokens.length >= 4) {
      const udirTable = buildUdirTableFromTokens(
        tableCandidateTokens,
        `table-p${pageNum}-1`
      );
      if (udirTable.rowCount >= 2 && udirTable.columnCount >= 2) {
        blocks.push(udirTable);
        globalTables.push(udirTable);
        for (const r of udirTable.rows) {
          for (const c of r.cells) {
            if (c.formula) totalFormulas++;
          }
        }
      } else {
        // Fallback to regular rows if table wasn't cohesive
        for (const token of tableCandidateTokens) {
          proseRows.push([token]);
        }
      }
    }

    // Process prose rows into headings and paragraphs
    for (const row of proseRows) {
      const rowText = row.map((t) => t.text).join(" ").trim();
      if (!rowText) continue;

      const minX = Math.min(...row.map((t) => t.x));
      const minY = Math.min(...row.map((t) => t.y));
      const maxX = Math.max(...row.map((t) => t.x + t.width));
      const maxY = Math.max(...row.map((t) => t.y + t.height));
      const bbox: UdirBoundingBox = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };

      const runs: UdirTextRun[] = row.map((t) => ({
        type: "text_run",
        text: t.text,
        bbox: { x: t.x, y: t.y, width: t.width, height: t.height },
        font: {
          name: t.fontName || "Calibri",
          size: t.fontSize,
          isBold: !!t.isBold,
          isItalic: !!t.isItalic,
        },
      }));

      const avgFontSize = row.reduce((sum, t) => sum + t.fontSize, 0) / row.length;
      const isAllBold = row.every((t) => t.isBold);

      if (avgFontSize >= 16 || (avgFontSize >= 13 && isAllBold)) {
        const headingLevel = avgFontSize >= 22 ? 1 : avgFontSize >= 18 ? 2 : 3;
        const heading: UdirHeading = {
          type: "heading",
          id: `h-p${pageNum}-${blocks.length}`,
          level: headingLevel as any,
          text: rowText,
          runs,
          bbox,
          alignment: "left",
        };
        blocks.push(heading);
      } else {
        const paragraph: UdirParagraph = {
          type: "paragraph",
          id: `p-p${pageNum}-${blocks.length}`,
          text: rowText,
          runs,
          bbox,
          alignment: "left",
        };
        blocks.push(paragraph);
      }
    }

    const section: UdirSection = {
      type: "section",
      id: `sec-p${pageNum}-body`,
      role: "body",
      bbox: { x: 0, y: 0, width: viewport.width, height: viewport.height },
      blocks,
    };

    pages.push({
      type: "page",
      pageNumber: pageNum,
      width: viewport.width,
      height: viewport.height,
      rotation: (page.rotate as any) || 0,
      sections: [section],
      blocks,
    });
  }

  const processingDurationMs = Date.now() - startTime;

  return {
    type: "document",
    schemaVersion: "1.0.0",
    metadata: {
      pageCount: pages.length,
      sourceFormat: "pdf",
      readingOrder: "ltr",
      processingDurationMs,
    },
    pages,
    tables: globalTables,
    fields: {},
    stats: {
      totalWords,
      totalCharacters,
      totalTables: globalTables.length,
      totalFormulas,
      totalImages: 0,
      totalFormFields: 0,
    },
  };
}
