/**
 * PDFSun.in — PDF-to-Word Vector Geometry, CTM Image Extraction & PNG Encoding Engine
 *
 * Strictly scoped to PDF-to-Word reconstruction:
 * - Full 2D Affine CTM stack (save / restore / transform)
 * - Vector path extraction (horizontal rules, vertical rules, shaded rects / header banners)
 * - Exact image position & aspect ratio preservation (logos, QR codes, signatures, stamps)
 * - Pure TypeScript lossless PNG encoding via pako (works cleanly in Browser, Worker & Node)
 * - Adaptive column corridor & whitespace gutter solvers
 */

import * as pdfjsLib from "pdfjs-dist";
import * as pakoNs from "pako";
import { createSafeCanvas } from "./enterpriseImageOcrEngine";
import { ensurePdfJsWorkerConfigured } from "./pdfjsWorkerSetup";

ensurePdfJsWorkerConfigured(pdfjsLib);

export interface HorizontalRule {
  x1: number;
  x2: number;
  y: number;
  strokeHex: string;
  lineWidth: number;
}

export interface VerticalRule {
  x: number;
  y1: number;
  y2: number;
  strokeHex: string;
  lineWidth: number;
}

export interface VectorRect {
  x: number;
  y: number;
  width: number;
  height: number;
  fillHex?: string;
  strokeHex?: string;
  hasFill: boolean;
  hasStroke: boolean;
}

export type ExtractedImageRole =
  | "logo"
  | "qr_or_seal"
  | "signature_or_stamp"
  | "full_page_scan"
  | "inline_graphic";

export interface ExtractedPdfImage {
  data: Uint8Array;
  width: number;       // Display width in CSS/DOCX px (96 DPI equivalent)
  height: number;      // Display height in CSS/DOCX px
  widthPt: number;     // Original PDF width in points
  heightPt: number;    // Original PDF height in points
  pixelWidth: number;  // Intrinsic bitmap pixel width
  pixelHeight: number; // Intrinsic bitmap pixel height
  x: number;           // Top-down left coordinate (pt)
  y: number;           // Top-down top coordinate (pt)
  role: ExtractedImageRole;
  areaRatio: number;   // Fraction of page covered
}

export interface PageVectorAndMedia {
  horizontalLines: HorizontalRule[];
  verticalLines: VerticalRule[];
  rects: VectorRect[];
  images: ExtractedPdfImage[];
  totalImageAreaRatio: number;
}

// ---------------------------------------------------------------------------
// PURE PNG ENCODER (Lossless RGBA PNG with pako DEFLATE — Browser + Worker + Node)
// ---------------------------------------------------------------------------

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC32_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makePngChunk(type: string, data: Uint8Array): Uint8Array {
  const len = data.length;
  const out = new Uint8Array(12 + len);
  const view = new DataView(out.buffer);
  view.setUint32(0, len, false);
  for (let i = 0; i < 4; i++) {
    out[4 + i] = type.charCodeAt(i);
  }
  out.set(data, 8);
  const crcVal = crc32(out.subarray(4, 8 + len));
  view.setUint32(8 + len, crcVal, false);
  return out;
}

export function encodeRgbaToPng(
  rgba: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number
): Uint8Array {
  const rowStride = width * 4;
  const rawScanlines = new Uint8Array((rowStride + 1) * height);

  for (let y = 0; y < height; y++) {
    const destOffset = y * (rowStride + 1);
    rawScanlines[destOffset] = 0; // Filter type None
    const srcStart = y * rowStride;
    rawScanlines.set(rgba.subarray(srcStart, srcStart + rowStride), destOffset + 1);
  }

  const deflateFn = (pakoNs as any).deflate || (pakoNs as any).default?.deflate;
  const compressed = deflateFn(rawScanlines, { level: 6 });

  const ihdr = new Uint8Array(13);
  const ihdrView = new DataView(ihdr.buffer);
  ihdrView.setUint32(0, width, false);
  ihdrView.setUint32(4, height, false);
  ihdr[8] = 8;  // Bit depth 8
  ihdr[9] = 6;  // Color type RGBA
  ihdr[10] = 0; // Compression deflate
  ihdr[11] = 0; // Filter method
  ihdr[12] = 0; // Interlace none

  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = makePngChunk("IHDR", ihdr);
  const idatChunk = makePngChunk("IDAT", compressed);
  const iendChunk = makePngChunk("IEND", new Uint8Array(0));

  const png = new Uint8Array(
    sig.length + ihdrChunk.length + idatChunk.length + iendChunk.length
  );
  let offset = 0;
  png.set(sig, offset); offset += sig.length;
  png.set(ihdrChunk, offset); offset += ihdrChunk.length;
  png.set(idatChunk, offset); offset += idatChunk.length;
  png.set(iendChunk, offset);
  return png;
}

function normalizeColorToHex(colorArg: any): string {
  if (typeof colorArg === "string") {
    const hex = colorArg.replace("#", "").trim().toUpperCase();
    if (/^[0-9A-F]{6}$/.test(hex)) return hex;
    if (/^[0-9A-F]{3}$/.test(hex)) {
      return hex.split("").map((c) => c + c).join("");
    }
  }
  if (Array.isArray(colorArg) && colorArg.length >= 3) {
    const toByte = (v: number) => Math.max(0, Math.min(255, Math.round(v <= 1 ? v * 255 : v)));
    return [toByte(colorArg[0]), toByte(colorArg[1]), toByte(colorArg[2])]
      .map((n) => n.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  }
  return "CBD5E1";
}

function multiplyCtm(m1: number[], m2: number[]): number[] {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

function applyCtmPoint(ctm: number[], x: number, y: number): [number, number] {
  return [ctm[0] * x + ctm[2] * y + ctm[4], ctm[1] * x + ctm[3] * y + ctm[5]];
}

/**
 * Resolves a pdf.js XObject (image) even if decoding completes asynchronously after getOperatorList()
 */
async function resolvePdfJsObject(store: any, name: string, timeoutMs: number = 1200): Promise<any> {
  if (!store || !name) return null;
  try {
    if (store.has?.(name)) {
      return store.get(name);
    }
    if (typeof store.get !== "function") return null;
    return await new Promise<any>((resolve) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          try {
            resolve(store.has?.(name) ? store.get(name) : null);
          } catch {
            resolve(null);
          }
        }
      }, timeoutMs);
      try {
        store.get(name, (obj: any) => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve(obj || null);
          }
        });
      } catch {
        clearTimeout(timer);
        if (!settled) {
          settled = true;
          resolve(null);
        }
      }
    });
  } catch {
    return null;
  }
}

/**
 * Converts a pdf.js image object (RGBA, RGB, Grayscale, 1bpp Mask, or ImageBitmap) to PNG bytes
 */
async function convertPdfJsImageObjectToPng(imgObj: any): Promise<{ png: Uint8Array; width: number; height: number } | null> {
  if (!imgObj) return null;
  const w = Number(imgObj.width || imgObj.bitmap?.width || 0);
  const h = Number(imgObj.height || imgObj.bitmap?.height || 0);
  if (w < 2 || h < 2) return null;

  // Skip gigantic single-color blank/spacer masks
  const data = imgObj.data as Uint8Array | Uint8ClampedArray | undefined;
  const pixelCount = w * h;

  if (data && data.length > 0) {
    const rgba = new Uint8Array(pixelCount * 4);

    if (data.length === pixelCount * 4) {
      rgba.set(data);
    } else if (data.length === pixelCount * 3) {
      for (let s = 0, d = 0; s < data.length && d < rgba.length; s += 3, d += 4) {
        rgba[d] = data[s];
        rgba[d + 1] = data[s + 1];
        rgba[d + 2] = data[s + 2];
        rgba[d + 3] = 255;
      }
    } else if (data.length === pixelCount) {
      // 8-bit grayscale (common for QR codes / monochrome stamps)
      for (let i = 0, d = 0; i < pixelCount; i++, d += 4) {
        const v = data[i];
        rgba[d] = v;
        rgba[d + 1] = v;
        rgba[d + 2] = v;
        rgba[d + 3] = 255;
      }
    } else if (data.length >= Math.ceil(w / 8) * h) {
      // 1bpp packed monochrome image/mask (standard black/white QR or fax scan)
      const bytesPerRow = Math.ceil(w / 8);
      for (let row = 0; row < h; row++) {
        for (let col = 0; col < w; col++) {
          const byte = data[row * bytesPerRow + (col >> 3)];
          const bit = (byte >> (7 - (col & 7))) & 1;
          const v = bit ? 255 : 0;
          const d = (row * w + col) * 4;
          rgba[d] = v;
          rgba[d + 1] = v;
          rgba[d + 2] = v;
          rgba[d + 3] = 255;
        }
      }
    } else {
      return null;
    }

    // Check if image is completely uniform blank white (noise/spacer rect)
    let isAllSame = true;
    const r0 = rgba[0], g0 = rgba[1], b0 = rgba[2], a0 = rgba[3];
    const step = Math.max(1, Math.floor(pixelCount / 64));
    for (let i = 0; i < pixelCount; i += step) {
      const idx = i * 4;
      if (rgba[idx] !== r0 || rgba[idx + 1] !== g0 || rgba[idx + 2] !== b0 || rgba[idx + 3] !== a0) {
        isAllSame = false;
        break;
      }
    }
    if (isAllSame && (a0 === 0 || (r0 > 250 && g0 > 250 && b0 > 250))) {
      return null;
    }

    return { png: encodeRgbaToPng(rgba, w, h), width: w, height: h };
  }

  // Handle ImageBitmap rendered in browser / modern Web Worker
  if (imgObj.bitmap && typeof document !== "undefined") {
    try {
      const canvas = createSafeCanvas(w, h);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(imgObj.bitmap, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        return { png: encodeRgbaToPng(imgData.data, w, h), width: w, height: h };
      }
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Extracts vector grid lines, table borders, header shading boxes, AND all positioned images
 * from a single pdf.js page using full 2D Affine CTM stack traversal.
 */
export async function extractPageVectorAndMedia(
  page: any,
  viewport: any,
  preserveImages: boolean = true
): Promise<PageVectorAndMedia> {
  const horizontalLines: HorizontalRule[] = [];
  const verticalLines: VerticalRule[] = [];
  const rects: VectorRect[] = [];
  const images: ExtractedPdfImage[] = [];

  const pageWidth = viewport.width || 595.28;
  const pageHeight = viewport.height || 841.89;
  const pageArea = Math.max(1, pageWidth * pageHeight);

  const OPS = (pdfjsLib as any).OPS || {};
  const OP_SAVE = OPS.save ?? 10;
  const OP_RESTORE = OPS.restore ?? 11;
  const OP_TRANSFORM = OPS.transform ?? 12;
  const OP_CONSTRUCT_PATH = OPS.constructPath ?? 91;
  const OP_STROKE_RGB = OPS.setStrokeRGBColor ?? 58;
  const OP_FILL_RGB = OPS.setFillRGBColor ?? 59;
  const OP_STROKE_GRAY = OPS.setStrokeGray ?? 56;
  const OP_FILL_GRAY = OPS.setFillGray ?? 57;
  const OP_PAINT_IMAGE = OPS.paintImageXObject ?? 85;
  const OP_PAINT_INLINE = OPS.paintInlineImageXObject ?? 86;
  const OP_PAINT_MASK = OPS.paintImageMaskXObject ?? 83;

  try {
    const ops = await page.getOperatorList();
    if (!ops || !ops.fnArray) {
      return { horizontalLines, verticalLines, rects, images, totalImageAreaRatio: 0 };
    }

    interface GraphicsState {
      ctm: number[];
      strokeHex: string;
      fillHex: string;
    }

    const stack: GraphicsState[] = [];
    let state: GraphicsState = {
      ctm: [1, 0, 0, 1, 0, 0],
      strokeHex: "CBD5E1",
      fillHex: "FFFFFF",
    };

    const seenImgCoords = new Set<string>();

    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i];
      const args = ops.argsArray[i];

      if (fn === OP_SAVE) {
        stack.push({
          ctm: [...state.ctm],
          strokeHex: state.strokeHex,
          fillHex: state.fillHex,
        });
      } else if (fn === OP_RESTORE) {
        const prev = stack.pop();
        if (prev) state = prev;
      } else if (fn === OP_TRANSFORM && Array.isArray(args) && args.length >= 6) {
        state.ctm = multiplyCtm(state.ctm, args);
      } else if (fn === OP_STROKE_RGB && args && args.length > 0) {
        state.strokeHex = normalizeColorToHex(args[0]);
      } else if (fn === OP_FILL_RGB && args && args.length > 0) {
        state.fillHex = normalizeColorToHex(args[0]);
      } else if (fn === OP_STROKE_GRAY && args && typeof args[0] === "number") {
        const v = Math.max(0, Math.min(255, Math.round(args[0] * 255))).toString(16).padStart(2, "0");
        state.strokeHex = `${v}${v}${v}`.toUpperCase();
      } else if (fn === OP_FILL_GRAY && args && typeof args[0] === "number") {
        const v = Math.max(0, Math.min(255, Math.round(args[0] * 255))).toString(16).padStart(2, "0");
        state.fillHex = `${v}${v}${v}`.toUpperCase();
      } else if (fn === OP_CONSTRUCT_PATH && Array.isArray(args) && args.length >= 2) {
        const drawOp = Number(args[0] || 0);
        const pathData = Array.isArray(args[1]) ? args[1][0] || args[1] : null;
        const bbox = Array.isArray(args[2]) ? args[2] : null;
        const hasFill = drawOp === 22 || drawOp === 23 || drawOp === 24 || drawOp === 25;
        const hasStroke = drawOp === 20 || drawOp === 21 || drawOp === 24 || drawOp === 25;

        // Parse path segments to extract horizontal/vertical rules
        if (pathData && (Array.isArray(pathData) || ArrayBuffer.isView(pathData))) {
          const arr = Array.from(pathData as ArrayLike<number>);
          let curX = 0;
          let curY = 0;
          let idx = 0;
          const pts: [number, number][] = [];

          while (idx < arr.length) {
            const subOp = arr[idx++];
            if (subOp === 0 && idx + 1 < arr.length) {
              // moveTo
              const [tx, ty] = applyCtmPoint(state.ctm, arr[idx++], arr[idx++]);
              curX = tx;
              curY = pageHeight - ty;
              pts.push([curX, curY]);
            } else if (subOp === 1 && idx + 1 < arr.length) {
              // lineTo
              const [tx, ty] = applyCtmPoint(state.ctm, arr[idx++], arr[idx++]);
              const nx = tx;
              const ny = pageHeight - ty;
              pts.push([nx, ny]);

              if (hasStroke) {
                const dx = Math.abs(nx - curX);
                const dy = Math.abs(ny - curY);
                if (dy <= 1.8 && dx >= 15) {
                  horizontalLines.push({
                    x1: Math.min(curX, nx),
                    x2: Math.max(curX, nx),
                    y: (curY + ny) / 2,
                    strokeHex: state.strokeHex,
                    lineWidth: 1,
                  });
                } else if (dx <= 1.8 && dy >= 10) {
                  verticalLines.push({
                    x: (curX + nx) / 2,
                    y1: Math.min(curY, ny),
                    y2: Math.max(curY, ny),
                    strokeHex: state.strokeHex,
                    lineWidth: 1,
                  });
                }
              }
              curX = nx;
              curY = ny;
            } else if (subOp === 2 && idx + 5 < arr.length) {
              idx += 6;
            } else if (subOp === 4) {
              // closePath
              if (pts.length >= 2 && hasStroke) {
                const first = pts[0];
                const dx = Math.abs(first[0] - curX);
                const dy = Math.abs(first[1] - curY);
                if (dy <= 1.8 && dx >= 15) {
                  horizontalLines.push({
                    x1: Math.min(curX, first[0]),
                    x2: Math.max(curX, first[0]),
                    y: (curY + first[1]) / 2,
                    strokeHex: state.strokeHex,
                    lineWidth: 1,
                  });
                } else if (dx <= 1.8 && dy >= 10) {
                  verticalLines.push({
                    x: (curX + first[0]) / 2,
                    y1: Math.min(curY, first[1]),
                    y2: Math.max(curY, first[1]),
                    strokeHex: state.strokeHex,
                    lineWidth: 1,
                  });
                }
              }
            } else {
              break;
            }
          }
        }

        // Capture filled or stroked rectangles (table banners, card boxes)
        if (bbox && bbox.length >= 4) {
          const [xA, yA] = applyCtmPoint(state.ctm, bbox[0], bbox[1]);
          const [xB, yB] = applyCtmPoint(state.ctm, bbox[2], bbox[3]);
          const rx = Math.min(xA, xB);
          const rw = Math.abs(xB - xA);
          const topPdfY = Math.max(yA, yB);
          const botPdfY = Math.min(yA, yB);
          const ry = pageHeight - topPdfY;
          const rh = topPdfY - botPdfY;

          if (rw >= 12 && rh >= 8 && rw * rh < pageArea * 0.92) {
            rects.push({
              x: rx,
              y: ry,
              width: rw,
              height: rh,
              fillHex: hasFill ? state.fillHex : undefined,
              strokeHex: hasStroke ? state.strokeHex : undefined,
              hasFill,
              hasStroke,
            });
          }
        }
      } else if (
        preserveImages &&
        (fn === OP_PAINT_IMAGE || fn === OP_PAINT_INLINE || fn === OP_PAINT_MASK)
      ) {
        // Compute CTM projected bounding box of image unit square [0,0]->[1,1]
        const corners = [
          applyCtmPoint(state.ctm, 0, 0),
          applyCtmPoint(state.ctm, 1, 0),
          applyCtmPoint(state.ctm, 0, 1),
          applyCtmPoint(state.ctm, 1, 1),
        ];
        const xs = corners.map((c) => c[0]);
        const ys = corners.map((c) => pageHeight - c[1]);
        const x = Math.max(0, Math.min(...xs));
        const y = Math.max(0, Math.min(...ys));
        const widthPt = Math.max(4, Math.min(pageWidth, Math.max(...xs) - x));
        const heightPt = Math.max(4, Math.min(pageHeight, Math.max(...ys) - y));
        const areaRatio = (widthPt * heightPt) / pageArea;

        const coordKey = `${Math.round(x)}:${Math.round(y)}:${Math.round(widthPt)}:${Math.round(heightPt)}`;
        if (seenImgCoords.has(coordKey)) continue;
        seenImgCoords.add(coordKey);

        let imgObj: any = null;
        if (fn === OP_PAINT_IMAGE) {
          const imgName = args ? args[0] : null;
          if (typeof imgName === "string") {
            imgObj = await resolvePdfJsObject(page.objs, imgName, 1200);
            if (!imgObj && page.commonObjs?.has?.(imgName)) {
              imgObj = page.commonObjs.get(imgName);
            }
          }
        } else if (args && args[0] && args[0].data) {
          imgObj = args[0];
        }

        const converted = await convertPdfJsImageObjectToPng(imgObj);
        if (!converted) continue;

        // Classify role preserving true aspect ratio
        const aspect = widthPt / Math.max(1, heightPt);
        let role: ExtractedImageRole = "inline_graphic";
        if (areaRatio > 0.55) {
          role = "full_page_scan";
        } else if (aspect >= 0.82 && aspect <= 1.22 && widthPt >= 28 && widthPt <= 170) {
          role = "qr_or_seal";
        } else if (y < pageHeight * 0.25 && heightPt <= 130) {
          role = "logo";
        } else if (y > pageHeight * 0.62 && heightPt <= 130) {
          role = "signature_or_stamp";
        }

        // Convert PDF pt (72 DPI) -> OOXML transformation px (96 DPI), keeping true aspect ratio
        const ptToPx = 96 / 72;
        const maxDisplayW = role === "full_page_scan" ? 560 : role === "qr_or_seal" ? 115 : role === "logo" ? 185 : 220;
        const maxDisplayH = role === "full_page_scan" ? 760 : role === "qr_or_seal" ? 115 : role === "logo" ? 95 : 150;

        let dispW = Math.round(widthPt * ptToPx);
        let dispH = Math.round(heightPt * ptToPx);
        const scaleDown = Math.min(1, maxDisplayW / Math.max(1, dispW), maxDisplayH / Math.max(1, dispH));
        dispW = Math.max(18, Math.round(dispW * scaleDown));
        dispH = Math.max(18, Math.round(dispH * scaleDown));

        images.push({
          data: converted.png,
          width: dispW,
          height: dispH,
          widthPt,
          heightPt,
          pixelWidth: converted.width,
          pixelHeight: converted.height,
          x,
          y,
          role,
          areaRatio,
        });
      }
    }
  } catch {
    // Return any geometry extracted cleanly before error
  }

  // Merge/deduplicate nearly identical horizontal & vertical lines
  const dedupH = deduplicateRules(horizontalLines, (a, b) => Math.abs(a.y - b.y) <= 1.5 && Math.abs(a.x1 - b.x1) <= 3);
  const dedupV = deduplicateRules(verticalLines, (a, b) => Math.abs(a.x - b.x) <= 1.5 && Math.abs(a.y1 - b.y1) <= 3);

  const totalImageAreaRatio = Math.min(
    1,
    images.reduce((sum, img) => sum + img.areaRatio, 0)
  );

  return {
    horizontalLines: dedupH,
    verticalLines: dedupV,
    rects,
    images,
    totalImageAreaRatio,
  };
}

function deduplicateRules<T>(items: T[], same: (a: T, b: T) => boolean): T[] {
  const out: T[] = [];
  for (const item of items) {
    if (!out.some((existing) => same(existing, item))) {
      out.push(item);
    }
  }
  return out;
}

/**
 * Finds the cleanest whitespace gutter (X split coordinate) separating two horizontal panels
 * (e.g. Seller Left / Buyer Right, or Bank Left / Totals Right), instead of naive midpoint slicing.
 */
export function findOptimalVerticalGutter(
  tokens: { x: number; width: number; text: string }[],
  pageWidth: number,
  minFraction: number = 0.34,
  maxFraction: number = 0.68
): number {
  const defaultMid = pageWidth * 0.5;
  if (tokens.length < 2) return defaultMid;

  const minX = Math.round(pageWidth * minFraction);
  const maxX = Math.round(pageWidth * maxFraction);
  const bucketWidth = 4;
  const bucketCount = Math.ceil(pageWidth / bucketWidth) + 1;
  const occupancy = new Uint16Array(bucketCount);

  for (const t of tokens) {
    const startB = Math.max(0, Math.floor(t.x / bucketWidth));
    const endB = Math.min(bucketCount - 1, Math.floor((t.x + Math.max(4, t.width)) / bucketWidth));
    for (let b = startB; b <= endB; b++) {
      occupancy[b]++;
    }
  }

  let bestRunStart = -1;
  let bestRunLen = 0;
  let curStart = -1;
  let curLen = 0;

  const bMin = Math.floor(minX / bucketWidth);
  const bMax = Math.ceil(maxX / bucketWidth);

  for (let b = bMin; b <= bMax; b++) {
    if (occupancy[b] === 0) {
      if (curStart === -1) curStart = b;
      curLen++;
      if (curLen > bestRunLen) {
        bestRunLen = curLen;
        bestRunStart = curStart;
      }
    } else {
      curStart = -1;
      curLen = 0;
    }
  }

  if (bestRunStart !== -1 && bestRunLen >= 2) {
    return (bestRunStart + bestRunLen / 2) * bucketWidth;
  }

  return defaultMid;
}
