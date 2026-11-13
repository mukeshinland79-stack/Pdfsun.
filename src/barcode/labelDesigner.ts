/**
 * PDFSun Barcode Studio — Sheet Imposition & Label Designer
 * Generates millimeter-exact print-ready PDF sheets for Avery, Zebra, and Dymo stock
 */

import { jsPDF } from "jspdf";
import { LabelTemplate, LabelItemData } from "./types";
import { renderBarcode } from "./renderer";

export const STANDARD_LABEL_TEMPLATES: LabelTemplate[] = [
  {
    id: "avery-5160",
    name: "Avery® 5160 (Letter - 30/sheet)",
    category: "avery-letter",
    pageWidthMm: 215.9, // 8.5 in
    pageHeightMm: 279.4, // 11 in
    labelsPerRow: 3,
    labelsPerColumn: 10,
    labelWidthMm: 66.675, // 2.625 in
    labelHeightMm: 25.4, // 1.0 in
    marginLeftMm: 4.76,
    marginTopMm: 12.7,
    horizontalPitchMm: 69.85,
    verticalPitchMm: 25.4,
    cornerRoundingMm: 1.5,
    description: "Standard US Letter 30-up address and SKU labels.",
  },
  {
    id: "avery-5163",
    name: "Avery® 5163 (Letter - 10/sheet)",
    category: "avery-letter",
    pageWidthMm: 215.9,
    pageHeightMm: 279.4,
    labelsPerRow: 2,
    labelsPerColumn: 5,
    labelWidthMm: 101.6, // 4.0 in
    labelHeightMm: 50.8, // 2.0 in
    marginLeftMm: 4.2,
    marginTopMm: 12.7,
    horizontalPitchMm: 105.8,
    verticalPitchMm: 50.8,
    cornerRoundingMm: 2.0,
    description: "Large 10-up shipping, parcel, and product box labels.",
  },
  {
    id: "avery-l7160",
    name: "Avery® L7160 (A4 - 21/sheet)",
    category: "avery-a4",
    pageWidthMm: 210,
    pageHeightMm: 297,
    labelsPerRow: 3,
    labelsPerColumn: 7,
    labelWidthMm: 63.5,
    labelHeightMm: 38.1,
    marginLeftMm: 7.2,
    marginTopMm: 15.1,
    horizontalPitchMm: 65.5,
    verticalPitchMm: 38.1,
    cornerRoundingMm: 2.0,
    description: "European standard A4 21-up barcode and shipping labels.",
  },
  {
    id: "avery-l7163",
    name: "Avery® L7163 (A4 - 14/sheet)",
    category: "avery-a4",
    pageWidthMm: 210,
    pageHeightMm: 297,
    labelsPerRow: 2,
    labelsPerColumn: 7,
    labelWidthMm: 99.1,
    labelHeightMm: 38.1,
    marginLeftMm: 4.7,
    marginTopMm: 15.1,
    horizontalPitchMm: 101.6,
    verticalPitchMm: 38.1,
    cornerRoundingMm: 2.0,
    description: "Large 14-up parcel and shipping container labels.",
  },
  {
    id: "avery-l7159",
    name: "Avery® L7159 (A4 - 24/sheet)",
    category: "avery-a4",
    pageWidthMm: 210,
    pageHeightMm: 297,
    labelsPerRow: 3,
    labelsPerColumn: 8,
    labelWidthMm: 63.5,
    labelHeightMm: 33.9,
    marginLeftMm: 7.2,
    marginTopMm: 12.9,
    horizontalPitchMm: 65.5,
    verticalPitchMm: 33.9,
    cornerRoundingMm: 1.5,
    description: "High-density 24-up filing and retail barcode labels.",
  },
  {
    id: "avery-l7651",
    name: "Avery® L7651 (A4 - 65/sheet)",
    category: "avery-a4",
    pageWidthMm: 210,
    pageHeightMm: 297,
    labelsPerRow: 5,
    labelsPerColumn: 13,
    labelWidthMm: 38.1,
    labelHeightMm: 21.2,
    marginLeftMm: 10.7,
    marginTopMm: 10.7,
    horizontalPitchMm: 40.6,
    verticalPitchMm: 21.2,
    cornerRoundingMm: 1.0,
    description: "Miniature 65-up retail tags and inventory bins.",
  },
  {
    id: "zebra-4x6",
    name: 'Zebra Direct Thermal 4" × 6"',
    category: "thermal-roll",
    pageWidthMm: 101.6,
    pageHeightMm: 152.4,
    labelsPerRow: 1,
    labelsPerColumn: 1,
    labelWidthMm: 96.0,
    labelHeightMm: 146.0,
    marginLeftMm: 2.8,
    marginTopMm: 3.2,
    horizontalPitchMm: 101.6,
    verticalPitchMm: 152.4,
    cornerRoundingMm: 0,
    description: "Standard continuous roll logistics & courier label (FedEx, UPS, Amazon FBA).",
  },
  {
    id: "dymo-30252",
    name: 'Dymo® 30252 (1⅛" × 3½")',
    category: "thermal-roll",
    pageWidthMm: 89.0,
    pageHeightMm: 28.0,
    labelsPerRow: 1,
    labelsPerColumn: 1,
    labelWidthMm: 85.0,
    labelHeightMm: 25.0,
    marginLeftMm: 2.0,
    marginTopMm: 1.5,
    horizontalPitchMm: 89.0,
    verticalPitchMm: 28.0,
    cornerRoundingMm: 1.0,
    description: "Compact desktop thermal address & inventory label.",
  },
];

export interface SheetGenerationOptions {
  template: LabelTemplate;
  items: LabelItemData[];
  showCutMarks?: boolean;
  showBorder?: boolean;
  repeatItem?: boolean; // Repeat single item across all positions
  includePrice?: boolean;
  includeTitle?: boolean;
  includeSubtitle?: boolean;
}

/**
 * Generates a print-ready PDF document conforming to the selected label imposition.
 */
export async function generatePrintReadyLabelPdf(
  options: SheetGenerationOptions
): Promise<Uint8Array> {
  const { template, items, showCutMarks, showBorder } = options;
  const labelsPerPage = Math.max(1, template.labelsPerRow * template.labelsPerColumn);

  const doc = new jsPDF({
    orientation: template.pageWidthMm > template.pageHeightMm ? "landscape" : "portrait",
    unit: "mm",
    format: [template.pageWidthMm, template.pageHeightMm],
    compress: true,
  });

  // Prepare expanded item list based on quantities
  let expandedItems: LabelItemData[] = [];
  if (options.repeatItem && items.length > 0) {
    const single = items[0];
    const totalSlots = labelsPerPage;
    for (let i = 0; i < totalSlots; i++) {
      expandedItems.push(single);
    }
  } else {
    for (const item of items) {
      const qty = Math.max(1, item.quantity || 1);
      for (let q = 0; q < qty; q++) {
        expandedItems.push(item);
      }
    }
  }

  if (expandedItems.length === 0) {
    expandedItems = [
      {
        id: "sample-1",
        barcodeValue: "PDFSUN-SAMPLE-001",
        symbology: "code128",
        title: "Product Title",
        subtitle: "SKU-9900",
        price: "₹499",
      },
    ];
  }

  const totalPages = Math.ceil(expandedItems.length / labelsPerPage);
  const barcodeImageCache = new Map<string, string>();

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    if (pageIdx > 0) {
      doc.addPage([template.pageWidthMm, template.pageHeightMm]);
    }

    const startIndex = pageIdx * labelsPerPage;
    const pageItems = expandedItems.slice(startIndex, startIndex + labelsPerPage);

    for (let slotIdx = 0; slotIdx < pageItems.length; slotIdx++) {
      const item = pageItems[slotIdx];
      const col = slotIdx % template.labelsPerRow;
      const row = Math.floor(slotIdx / template.labelsPerRow);

      const x = template.marginLeftMm + col * template.horizontalPitchMm;
      const y = template.marginTopMm + row * template.verticalPitchMm;
      const w = template.labelWidthMm;
      const h = template.labelHeightMm;

      // Draw label border guide
      if (showBorder) {
        doc.setDrawColor(210, 215, 220);
        doc.setLineWidth(0.2);
        if (template.cornerRoundingMm && template.cornerRoundingMm > 0) {
          doc.roundedRect(x, y, w, h, template.cornerRoundingMm, template.cornerRoundingMm, "S");
        } else {
          doc.rect(x, y, w, h, "S");
        }
      }

      // Draw corner cut marks
      if (showCutMarks) {
        doc.setDrawColor(180, 185, 190);
        doc.setLineWidth(0.15);
        doc.line(x - 1, y, x - 3, y);
        doc.line(x, y - 1, x, y - 3);
      }

      // Render Barcode image
      const cacheKey = `${item.symbology}::${item.barcodeValue}`;
      let dataUrl = barcodeImageCache.get(cacheKey);
      if (!dataUrl) {
        try {
          const rendered = await renderBarcode({
            symbology: item.symbology,
            text: item.barcodeValue,
            scale: 3,
            includeText: !item.title,
          });
          dataUrl = rendered.dataUrl;
          barcodeImageCache.set(cacheKey, dataUrl);
        } catch {
          dataUrl = "";
        }
      }

      let currentY = y + 2.5;

      // 1. Header Title
      if (item.title && options.includeTitle !== false) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(Math.min(8, Math.max(6, Math.floor(w / 8))));
        doc.setTextColor(30, 41, 59);
        const truncatedTitle = doc.splitTextToSize(item.title, w - 4)[0] || item.title;
        doc.text(truncatedTitle, x + w / 2, currentY + 1.5, { align: "center" });
        currentY += 4.2;
      }

      // 2. Barcode Graphic
      const remainingHeight = (y + h) - currentY;
      const footerReserve = (item.subtitle || item.price) ? 7 : 4;
      const barcodeH = Math.max(8, remainingHeight - footerReserve);
      const barcodeW = Math.min(w - 6, barcodeH * 3.2);
      const barcodeX = x + (w - barcodeW) / 2;

      if (dataUrl && dataUrl.startsWith("data:image/")) {
        try {
          doc.addImage(dataUrl, "PNG", barcodeX, currentY, barcodeW, barcodeH);
        } catch {
          doc.setFontSize(7);
          doc.text(`[${item.barcodeValue}]`, x + w / 2, currentY + barcodeH / 2, { align: "center" });
        }
      } else {
        doc.setFontSize(7);
        doc.text(`[${item.barcodeValue}]`, x + w / 2, currentY + barcodeH / 2, { align: "center" });
      }

      currentY += barcodeH + 2;

      // 3. Footer Subtitle / Price
      if (currentY < y + h - 1) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(71, 85, 105);

        if (item.subtitle && item.price) {
          doc.text(item.subtitle, x + 3, currentY, { align: "left" });
          doc.setFont("helvetica", "bold");
          doc.setTextColor(15, 23, 42);
          doc.text(item.price, x + w - 3, currentY, { align: "right" });
        } else if (item.price) {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(15, 23, 42);
          doc.text(item.price, x + w / 2, currentY, { align: "center" });
        } else if (item.subtitle) {
          doc.text(item.subtitle, x + w / 2, currentY, { align: "center" });
        } else {
          doc.text(item.barcodeValue, x + w / 2, currentY, { align: "center" });
        }
      }
    }
  }

  const arrayBuffer = doc.output("arraybuffer");
  return new Uint8Array(arrayBuffer);
}
