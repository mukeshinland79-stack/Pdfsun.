/**
 * PDFSun Barcode Studio — Export & File Download Center
 * Facilitates high-res PNG, SVG, JPG, single PDF, and batch ZIP delivery
 */

import { jsPDF } from "jspdf";
import { RenderOutput } from "./renderer";

/**
 * Triggers a browser file download using a Blob or DataURL.
 */
export function triggerDownload(content: Blob | string, filename: string): void {
  if (typeof window === "undefined" || !document) return;

  const url = typeof content === "string" ? content : URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  if (typeof content !== "string") {
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
}

/**
 * Exports vector SVG markup as a `.svg` file.
 */
export function exportSvgFile(rendered: RenderOutput, barcodeText: string): void {
  const blob = new Blob([rendered.svg], { type: "image/svg+xml;charset=utf-8" });
  const filename = `barcode_${sanitizeFilename(barcodeText)}.svg`;
  triggerDownload(blob, filename);
}

/**
 * Exports high-resolution PNG image.
 */
export function exportPngFile(rendered: RenderOutput, barcodeText: string): void {
  const filename = `barcode_${sanitizeFilename(barcodeText)}.png`;
  triggerDownload(rendered.dataUrl, filename);
}

/**
 * Exports high-resolution JPEG with white background.
 */
export async function exportJpgFile(
  rendered: RenderOutput,
  barcodeText: string
): Promise<void> {
  if (typeof window === "undefined") return;

  const img = new Image();
  img.src = rendered.dataUrl;

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || 800;
  canvas.height = img.naturalHeight || 400;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Fill solid white background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  const jpgUrl = canvas.toDataURL("image/jpeg", 0.95);
  const filename = `barcode_${sanitizeFilename(barcodeText)}.jpg`;
  triggerDownload(jpgUrl, filename);
}

/**
 * Exports a standalone, high-fidelity single barcode vector PDF.
 */
export function exportSingleBarcodePdf(
  rendered: RenderOutput,
  barcodeText: string
): void {
  const pageW = Math.max(60, rendered.widthMm + 20);
  const pageH = Math.max(40, rendered.heightMm + 25);

  const doc = new jsPDF({
    orientation: pageW > pageH ? "landscape" : "portrait",
    unit: "mm",
    format: [pageW, pageH],
  });

  const x = (pageW - rendered.widthMm) / 2;
  const y = (pageH - rendered.heightMm) / 2;

  if (rendered.dataUrl && rendered.dataUrl.startsWith("data:image/")) {
    try {
      doc.addImage(rendered.dataUrl, "PNG", x, y, rendered.widthMm, rendered.heightMm);
    } catch {
      doc.text(barcodeText, pageW / 2, pageH / 2, { align: "center" });
    }
  } else {
    doc.text(barcodeText, pageW / 2, pageH / 2, { align: "center" });
  }

  doc.save(`barcode_${sanitizeFilename(barcodeText)}.pdf`);
}

function sanitizeFilename(text: string): string {
  return (text || "unnamed")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 40);
}
