/**
 * PDFSun Barcode Studio — Universal Vector SVG & High-Resolution Raster Rendering Engine
 * Built on bwip-js with QR Code fallback and Node/Browser cross-runtime support
 */

import bwipjs from "bwip-js";
import QRCode from "qrcode";
import { BarcodeRenderOptions, SYMBOLOGY_CATALOG } from "./types";
import { validateBarcodeInput } from "./validation";

export interface RenderOutput {
  svg: string;
  dataUrl: string;
  widthMm: number;
  heightMm: number;
  aspectRatio: number;
  symbologyName: string;
}

/**
 * Strips '#' from hex colors for bwip-js hex format.
 */
function cleanHexColor(hex?: string): string {
  if (!hex) return "000000";
  return hex.replace(/^#/, "");
}

/**
 * Checks whether code is currently running in a browser environment.
 */
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/**
 * Renders a barcode to vector SVG and raster data URL.
 */
export async function renderBarcode(
  options: BarcodeRenderOptions
): Promise<RenderOutput> {
  const meta = SYMBOLOGY_CATALOG[options.symbology] || SYMBOLOGY_CATALOG.code128;

  // Validate and normalize input
  const val = validateBarcodeInput(options.symbology, options.text);
  const textToEncode = val.normalizedText || options.text;

  // Special-case QR code if qrcode library is preferred for styling/customization
  if (options.symbology === "qrcode") {
    try {
      const qrSvg = await QRCode.toString(textToEncode, {
        type: "svg",
        errorCorrectionLevel: options.ecLevel || "M",
        margin: options.quietZone ?? 4,
        color: {
          dark: options.foregroundColor || "#000000",
          light: options.backgroundColor || "#ffffff",
        },
      });

      let qrDataUrl = "";
      if (isBrowser()) {
        qrDataUrl = await QRCode.toDataURL(textToEncode, {
          errorCorrectionLevel: options.ecLevel || "M",
          margin: options.quietZone ?? 4,
          scale: (options.scale || 3) * 3,
          color: {
            dark: options.foregroundColor || "#000000",
            light: options.backgroundColor || "#ffffff",
          },
        });
      } else {
        // In Node, create a base64 PNG data URL directly
        const buffer = await QRCode.toBuffer(textToEncode, {
          errorCorrectionLevel: options.ecLevel || "M",
          margin: options.quietZone ?? 4,
          scale: 8,
          color: {
            dark: options.foregroundColor || "#000000",
            light: options.backgroundColor || "#ffffff",
          },
        });
        qrDataUrl = `data:image/png;base64,${buffer.toString("base64")}`;
      }

      return {
        svg: qrSvg,
        dataUrl: qrDataUrl,
        widthMm: 35,
        heightMm: 35,
        aspectRatio: 1.0,
        symbologyName: meta.name,
      };
    } catch {
      // Fallback to bwip-js if qrcode library throws
    }
  }

  // Configure bwip-js options
  const bwipOpts: any = {
    bcid: meta.bwipBcId,
    text: textToEncode,
    scale: options.scale || 3,
    includetext: options.includeText !== false && !meta.is2D,
    textxalign: "center",
    rotate: options.rotate || "N",
    barcolor: cleanHexColor(options.foregroundColor),
  };

  if (options.altText) {
    bwipOpts.alttext = options.altText;
  }

  if (options.backgroundColor && options.backgroundColor.toLowerCase() !== "transparent") {
    bwipOpts.backgroundcolor = cleanHexColor(options.backgroundColor);
  }

  // Padding / quiet zones
  if (typeof options.quietZone === "number" && options.quietZone > 0) {
    bwipOpts.paddingwidth = options.quietZone;
    bwipOpts.paddingheight = Math.round(options.quietZone / 2);
  }

  // Height specification: only for linear barcodes or when explicitly provided
  if (!meta.is2D && options.height) {
    bwipOpts.height = options.height;
  } else if (!meta.is2D) {
    bwipOpts.height = 18; // Standard 18mm default linear bar height
  }

  // Explicit width override if defined
  if (options.width && options.width > 0) {
    bwipOpts.width = options.width;
  }

  // Clean up undefined properties to avoid bwip-js type errors
  Object.keys(bwipOpts).forEach((k) => {
    if (bwipOpts[k] === undefined) {
      delete bwipOpts[k];
    }
  });

  // Generate vector SVG
  let svgString = "";
  try {
    svgString = (bwipjs as any).toSVG(bwipOpts);
  } catch (err: any) {
    throw new Error(`Barcode generation failed for ${meta.name}: ${err?.message || err}`);
  }

  // Special handling for ISBN / ISSN in bwip-js: strip formatting dashes
  if (options.symbology === "isbn" || options.symbology === "issn") {
    bwipOpts.text = textToEncode.replace(/[\s-]/g, "");
  }

  // Generate raster Data URL
  let rasterDataUrl = "";
  if (isBrowser()) {
    try {
      const canvas = document.createElement("canvas");
      bwipjs.toCanvas(canvas, bwipOpts);
      rasterDataUrl = canvas.toDataURL("image/png");
    } catch {
      // In browser fallback to SVG data URI
      rasterDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
    }
  } else {
    // In Node.js environment
    try {
      const buffer = await (bwipjs as any).toBuffer(bwipOpts);
      rasterDataUrl = `data:image/png;base64,${buffer.toString("base64")}`;
    } catch {
      rasterDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
    }
  }

  // Extract dimensions from SVG attributes if present
  let widthMm = 50;
  let heightMm = 25;
  const wMatch = svgString.match(/width="([0-9.]+)(mm|pt|px)?"/);
  const hMatch = svgString.match(/height="([0-9.]+)(mm|pt|px)?"/);
  if (wMatch && wMatch[1]) {
    widthMm = parseFloat(wMatch[1]);
  }
  if (hMatch && hMatch[1]) {
    heightMm = parseFloat(hMatch[1]);
  }

  return {
    svg: svgString,
    dataUrl: rasterDataUrl,
    widthMm: Math.round(widthMm),
    heightMm: Math.round(heightMm),
    aspectRatio: widthMm / (heightMm || 1),
    symbologyName: meta.name,
  };
}
