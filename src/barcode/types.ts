/**
 * PDFSun Barcode Studio — Type Definitions and Symbology Catalog
 * Conforms to ISO/IEC 15417, ISO/IEC 15420, ISO/IEC 15415, GS1 General Specifications
 */

export type SymbologyType =
  // 1D Linear Standard
  | "code128"
  | "code39"
  | "code93"
  | "ean13"
  | "ean8"
  | "upca"
  | "upce"
  | "itf14"
  | "interleaved2of5"
  | "codabar"
  | "msi"
  | "pharmacode"
  | "gs1-128"
  | "databar"
  // 2D Matrix Standard
  | "qrcode"
  | "datamatrix"
  | "pdf417"
  | "aztec"
  // Business Presets
  | "isbn"
  | "issn"
  | "amazon-fnsku";

export type SymbologyCategory = "linear" | "matrix" | "business";

export interface SymbologyMetadata {
  id: SymbologyType;
  name: string;
  category: SymbologyCategory;
  standard: string;
  description: string;
  sampleData: string;
  bwipBcId: string; // bwip-js barcode encoder ID
  is2D: boolean;
  supportsCheckDigitAuto: boolean;
  minChars?: number;
  maxChars?: number;
  allowedCharsRegex?: RegExp;
}

export interface BarcodeRenderOptions {
  symbology: SymbologyType;
  text: string;
  altText?: string;
  includeText?: boolean;
  scale?: number; // 1 to 5
  height?: number; // bar height in mm / points
  width?: number; // optional width override
  rotate?: "N" | "R" | "L" | "I"; // 0, 90, 270, 180 degrees
  foregroundColor?: string; // Hex color e.g. #000000
  backgroundColor?: string; // Hex color e.g. #ffffff or transparent
  quietZone?: number; // margin modules (e.g. 10 for EAN)
  textMargin?: number;
  fontSize?: number;
  // QR / 2D specific
  ecLevel?: "L" | "M" | "Q" | "H"; // Error correction level
  qrVersion?: number; // 1 to 40
}

export interface ValidationResult {
  isValid: boolean;
  normalizedText: string;
  computedCheckDigit?: string;
  errorMessage?: string;
  warningMessage?: string;
  autoFixAvailable?: boolean;
  suggestedFix?: string;
}

export interface LabelTemplate {
  id: string;
  name: string;
  category: "avery-letter" | "avery-a4" | "thermal-roll" | "custom";
  pageWidthMm: number;
  pageHeightMm: number;
  labelsPerRow: number;
  labelsPerColumn: number;
  labelWidthMm: number;
  labelHeightMm: number;
  marginTopMm: number;
  marginLeftMm: number;
  horizontalPitchMm: number;
  verticalPitchMm: number;
  cornerRoundingMm?: number;
  description: string;
}

export interface LabelItemData {
  id: string;
  barcodeValue: string;
  symbology: SymbologyType;
  title?: string;
  subtitle?: string;
  price?: string;
  sku?: string;
  extraField?: string;
  quantity?: number;
}

export const SYMBOLOGY_CATALOG: Record<SymbologyType, SymbologyMetadata> = {
  code128: {
    id: "code128",
    name: "Code 128 (Auto)",
    category: "linear",
    standard: "ISO/IEC 15417",
    description: "High-density alphanumeric barcode. Supports full 128 ASCII table.",
    sampleData: "PDFSUN-2026-X99",
    bwipBcId: "code128",
    is2D: false,
    supportsCheckDigitAuto: true,
  },
  code39: {
    id: "code39",
    name: "Code 39 (3 of 9)",
    category: "linear",
    standard: "ISO/IEC 16388 / ANSI MH10.8M",
    description: "Widely used in defense, automotive and inventory. Digits, uppercase letters, punctuation.",
    sampleData: "SUN-PRO-4096",
    bwipBcId: "code39",
    is2D: false,
    supportsCheckDigitAuto: true,
  },
  code93: {
    id: "code93",
    name: "Code 93",
    category: "linear",
    standard: "ANSI/AIM BC5",
    description: "Higher density compact variant of Code 39 with dual modulo-47 checksums.",
    sampleData: "CODE93-ADVANCED",
    bwipBcId: "code93",
    is2D: false,
    supportsCheckDigitAuto: true,
  },
  ean13: {
    id: "ean13",
    name: "EAN-13 (GTIN-13)",
    category: "linear",
    standard: "ISO/IEC 15420 / GS1",
    description: "Global retail product identification standard. 12 or 13 digits with Modulo-10 checksum.",
    sampleData: "890103099999",
    bwipBcId: "ean13",
    is2D: false,
    supportsCheckDigitAuto: true,
    minChars: 12,
    maxChars: 13,
  },
  ean8: {
    id: "ean8",
    name: "EAN-8 (GTIN-8)",
    category: "linear",
    standard: "ISO/IEC 15420 / GS1",
    description: "Compact 8-digit retail barcode for small packages.",
    sampleData: "8901234",
    bwipBcId: "ean8",
    is2D: false,
    supportsCheckDigitAuto: true,
    minChars: 7,
    maxChars: 8,
  },
  upca: {
    id: "upca",
    name: "UPC-A (GTIN-12)",
    category: "linear",
    standard: "GS1 / ANSI UCC",
    description: "North American retail standard. 11 or 12 numeric digits.",
    sampleData: "01234567890",
    bwipBcId: "upca",
    is2D: false,
    supportsCheckDigitAuto: true,
    minChars: 11,
    maxChars: 12,
  },
  upce: {
    id: "upce",
    name: "UPC-E (Zero-Suppressed)",
    category: "linear",
    standard: "GS1 / ANSI UCC",
    description: "6 to 8 digit compressed UPC-A for tiny packages.",
    sampleData: "0123456",
    bwipBcId: "upce",
    is2D: false,
    supportsCheckDigitAuto: true,
    minChars: 6,
    maxChars: 8,
  },
  itf14: {
    id: "itf14",
    name: "ITF-14 (Carton / Master)",
    category: "linear",
    standard: "GS1 / ISO/IEC 16390",
    description: "14-digit master shipping carton barcode with bearer bars.",
    sampleData: "1890103099999",
    bwipBcId: "itf14",
    is2D: false,
    supportsCheckDigitAuto: true,
    minChars: 13,
    maxChars: 14,
  },
  interleaved2of5: {
    id: "interleaved2of5",
    name: "Interleaved 2 of 5 (ITF)",
    category: "linear",
    standard: "ISO/IEC 16390",
    description: "High-density numeric only barcode. Even number of digits.",
    sampleData: "9876543210",
    bwipBcId: "interleaved2of5",
    is2D: false,
    supportsCheckDigitAuto: false,
  },
  codabar: {
    id: "codabar",
    name: "Codabar (NW-7)",
    category: "linear",
    standard: "ANSI/AIM BC3-1995",
    description: "Used in blood banks, libraries, and FedEx airbills. A-D start/stop guards.",
    sampleData: "A123456789B",
    bwipBcId: "rationalizedCodabar",
    is2D: false,
    supportsCheckDigitAuto: false,
  },
  msi: {
    id: "msi",
    name: "MSI Plessey",
    category: "linear",
    standard: "Plessey / MSI",
    description: "Used for warehouse storage, supermarket shelf tags, and inventory.",
    sampleData: "12345678",
    bwipBcId: "msi",
    is2D: false,
    supportsCheckDigitAuto: true,
  },
  pharmacode: {
    id: "pharmacode",
    name: "Pharmacode (One-Track)",
    category: "linear",
    standard: "Laetus Pharmacode",
    description: "Binary pharmaceutical packaging inspection code (values 3 to 131070).",
    sampleData: "4289",
    bwipBcId: "pharmacode",
    is2D: false,
    supportsCheckDigitAuto: false,
  },
  "gs1-128": {
    id: "gs1-128",
    name: "GS1-128 (UCC/EAN-128)",
    category: "linear",
    standard: "GS1 General Specs / ISO/IEC 15417",
    description: "Global supply chain tracking with Application Identifiers: (01) GTIN, (10) Batch, (17) Expiry.",
    sampleData: "(01)08901030999991(17)261231(10)LOT42",
    bwipBcId: "gs1-128",
    is2D: false,
    supportsCheckDigitAuto: true,
  },
  databar: {
    id: "databar",
    name: "GS1 DataBar Omnidirectional",
    category: "linear",
    standard: "ISO/IEC 24724",
    description: "High-density retail barcode for fresh produce (coupons, loose items).",
    sampleData: "08901030999991",
    bwipBcId: "databaromni",
    is2D: false,
    supportsCheckDigitAuto: true,
  },
  qrcode: {
    id: "qrcode",
    name: "QR Code (Model 2)",
    category: "matrix",
    standard: "ISO/IEC 18004",
    description: "2D matrix code supporting URLs, text, vCard, WiFi, up to 7,089 numeric characters.",
    sampleData: "https://pdfsun.in/barcode",
    bwipBcId: "qrcode",
    is2D: true,
    supportsCheckDigitAuto: false,
  },
  datamatrix: {
    id: "datamatrix",
    name: "Data Matrix (ECC 200)",
    category: "matrix",
    standard: "ISO/IEC 16022",
    description: "Ultra-compact 2D matrix standard for healthcare, aerospace, and electronics direct part marking.",
    sampleData: "PDFSUN-DM-LOT2026",
    bwipBcId: "datamatrix",
    is2D: true,
    supportsCheckDigitAuto: false,
  },
  pdf417: {
    id: "pdf417",
    name: "PDF417 (Stacked 2D)",
    category: "matrix",
    standard: "ISO/IEC 15438",
    description: "High-capacity stacked 2D barcode for airline boarding passes, shipping labels, and ID cards.",
    sampleData: "PDFSUN-BOARDING-PASS-P417-GATE09",
    bwipBcId: "pdf417",
    is2D: true,
    supportsCheckDigitAuto: false,
  },
  aztec: {
    id: "aztec",
    name: "Aztec Code",
    category: "matrix",
    standard: "ISO/IEC 24778",
    description: "Square 2D code with central bulls-eye finder. Used for train tickets and transit boarding.",
    sampleData: "TICKET-AZTEC-SUN-8842",
    bwipBcId: "azteccode",
    is2D: true,
    supportsCheckDigitAuto: false,
  },
  isbn: {
    id: "isbn",
    name: "ISBN-13 (Book Standard)",
    category: "business",
    standard: "ISO 2108 / GS1",
    description: "International Standard Book Number with 978 or 979 prefix and GS1 check digit.",
    sampleData: "9780134685991",
    bwipBcId: "ean13",
    is2D: false,
    supportsCheckDigitAuto: true,
    minChars: 10,
    maxChars: 17,
  },
  issn: {
    id: "issn",
    name: "ISSN (Periodicals / Magazines)",
    category: "business",
    standard: "ISO 3297 / GS1",
    description: "International Standard Serial Number encoded as EAN-13 with 977 prefix.",
    sampleData: "977-1234-567-00-3",
    bwipBcId: "issn",
    is2D: false,
    supportsCheckDigitAuto: true,
  },
  "amazon-fnsku": {
    id: "amazon-fnsku",
    name: "Amazon FNSKU (FBA Label)",
    category: "business",
    standard: "Amazon FBA Fulfillment Spec",
    description: "Amazon Fulfillment Network SKU format (X00... or B00...) in Code 128 format.",
    sampleData: "X001ABC456",
    bwipBcId: "code128",
    is2D: false,
    supportsCheckDigitAuto: false,
  },
};
