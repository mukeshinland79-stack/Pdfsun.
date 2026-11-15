/**
 * Universal Document Intermediate Representation (UDIR)
 * Version 1.0.0 — PDFSun.in Document Intelligence Engine
 * 
 * Formal canonical document schema for cross-format fidelity, spatial intelligence,
 * and high-accuracy conversion across PDF, DOCX, XLSX, PPTX, and Structured Markdown.
 */

export type UdirNodeType =
  | "document"
  | "page"
  | "section"
  | "paragraph"
  | "heading"
  | "table"
  | "table_row"
  | "table_cell"
  | "image"
  | "shape"
  | "divider"
  | "form_field"
  | "text_run";

export interface UdirBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UdirFontMetrics {
  name: string;
  size: number;
  weight?: "normal" | "bold" | number;
  style?: "normal" | "italic";
  color?: string; // Hex color code e.g. "#0F172A"
  isBold: boolean;
  isItalic: boolean;
  isUnderline?: boolean;
}

export interface UdirTextRun {
  type: "text_run";
  text: string;
  bbox: UdirBoundingBox;
  font: UdirFontMetrics;
  confidence?: number;
}

export interface UdirParagraph {
  type: "paragraph";
  id: string;
  runs: UdirTextRun[];
  text: string;
  bbox: UdirBoundingBox;
  alignment: "left" | "center" | "right" | "justify";
  lineSpacing?: number;
  isListItem?: boolean;
  listMarker?: string;
}

export interface UdirHeading {
  type: "heading";
  id: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  runs: UdirTextRun[];
  text: string;
  bbox: UdirBoundingBox;
  alignment: "left" | "center" | "right";
}

export interface UdirTableCell {
  type: "table_cell";
  id: string;
  row: number;
  col: number;
  rowSpan?: number;
  colSpan?: number;
  text: string;
  runs: UdirTextRun[];
  bbox: UdirBoundingBox;
  isHeader: boolean;
  isNumeric: boolean;
  numValue?: number;
  formatCode?: string; // e.g. "₹#,##0.00" or "$#,##0.00"
  formula?: string; // e.g. "=SUM(D2:D10)" or "=PRODUCT(B2,C2)"
  alignment: "left" | "center" | "right";
  backgroundColor?: string;
  borderColor?: string;
  isIdentifier?: boolean; // GSTIN, PAN, Phone, etc.
}

export interface UdirTableRow {
  type: "table_row";
  index: number;
  cells: UdirTableCell[];
  height?: number;
  isHeaderRow?: boolean;
}

export interface UdirTable {
  type: "table";
  id: string;
  title?: string;
  bbox: UdirBoundingBox;
  columnCount: number;
  rowCount: number;
  colWidths: number[];
  rows: UdirTableRow[];
  headers: UdirTableCell[];
  isBordered: boolean;
  hasZebraStriping?: boolean;
  detectedType?: "invoice_items" | "financial_statement" | "tax_summary" | "generic_grid";
}

export interface UdirImage {
  type: "image";
  id: string;
  bbox: UdirBoundingBox;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  dataUrl?: string;
  buffer?: Uint8Array;
  altText?: string;
  isQrCode?: boolean;
  qrPayload?: string;
}

export interface UdirFormField {
  type: "form_field";
  id: string;
  bbox: UdirBoundingBox;
  key: string;
  label: string;
  value: string;
  fieldType: "text" | "checkbox" | "radio" | "signature" | "dropdown";
  checked?: boolean;
}

export interface UdirDivider {
  type: "divider";
  bbox: UdirBoundingBox;
  orientation: "horizontal" | "vertical";
  color?: string;
  thickness?: number;
}

export type UdirBlock =
  | UdirParagraph
  | UdirHeading
  | UdirTable
  | UdirImage
  | UdirFormField
  | UdirDivider;

export interface UdirSection {
  type: "section";
  id: string;
  role: "header" | "body" | "footer" | "sidebar" | "notes";
  bbox: UdirBoundingBox;
  blocks: UdirBlock[];
}

export interface UdirPage {
  type: "page";
  pageNumber: number;
  width: number; // In points (1/72 inch)
  height: number;
  rotation: 0 | 90 | 180 | 270;
  dpi?: number;
  sections: UdirSection[];
  blocks: UdirBlock[];
}

export interface UdirMetadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
  pageCount: number;
  sourceFormat: "pdf" | "docx" | "xlsx" | "pptx" | "image" | "text" | "scanned_pdf";
  language?: string;
  readingOrder: "ltr" | "rtl";
  isEncrypted?: boolean;
  ocrApplied?: boolean;
  ocrConfidence?: number;
  processingDurationMs?: number;
  checksumSha256?: string;
}

export interface UdirDocument {
  type: "document";
  schemaVersion: "1.0.0";
  metadata: UdirMetadata;
  pages: UdirPage[];
  // Global cross-page references
  tables: UdirTable[];
  fields: Record<string, string>;
  stats: {
    totalWords: number;
    totalCharacters: number;
    totalTables: number;
    totalFormulas: number;
    totalImages: number;
    totalFormFields: number;
  };
}
