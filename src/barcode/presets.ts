/**
 * PDFSun Barcode Studio — Industry Presets & Business Workflows
 */

import { SymbologyType, BarcodeRenderOptions } from "./types";

export interface BusinessPreset {
  id: string;
  title: string;
  category: "retail" | "ecommerce" | "logistics" | "healthcare" | "publishing" | "events";
  symbology: SymbologyType;
  description: string;
  badge: string;
  defaultOptions: Partial<BarcodeRenderOptions>;
  samplePayload: string;
  fieldNotes: string;
}

export const BUSINESS_PRESETS: BusinessPreset[] = [
  {
    id: "amazon-fnsku",
    title: "Amazon FBA Product Label (FNSKU)",
    category: "ecommerce",
    symbology: "amazon-fnsku",
    description: "Fulfillment Network Stock Keeping Unit required for every unit sent to Amazon FBA.",
    badge: "Amazon FBA",
    samplePayload: "X001ABCD99",
    fieldNotes: "Must be a 10-character alphanumeric code starting with X00 or B00.",
    defaultOptions: {
      scale: 3,
      height: 18,
      includeText: true,
      foregroundColor: "#000000",
      backgroundColor: "#ffffff",
    },
  },
  {
    id: "gs1-retail-ean13",
    title: "Global Supermarket & Retail (EAN-13)",
    category: "retail",
    symbology: "ean13",
    description: "Universal GTIN-13 barcode used for point-of-sale checkout in 160+ countries.",
    badge: "GS1 Retail",
    samplePayload: "890103099999",
    fieldNotes: "Enter 12 digits; the 13th check digit will be calculated automatically.",
    defaultOptions: {
      scale: 3,
      height: 22,
      includeText: true,
      quietZone: 10,
    },
  },
  {
    id: "us-retail-upca",
    title: "North America Retail (UPC-A)",
    category: "retail",
    symbology: "upca",
    description: "Standard 12-digit barcode for products sold in the United States and Canada.",
    badge: "US / Canada POS",
    samplePayload: "01234567890",
    fieldNotes: "Enter 11 digits to auto-calculate the 12th Modulo-10 checksum.",
    defaultOptions: {
      scale: 3,
      height: 22,
      includeText: true,
    },
  },
  {
    id: "master-carton-itf14",
    title: "Master Shipping Carton (ITF-14)",
    category: "logistics",
    symbology: "itf14",
    description: "Corrugated cardboard shipping carton barcode with sturdy bearer bars.",
    badge: "Logistics & Carton",
    samplePayload: "1890103099999",
    fieldNotes: "14 digits total. Protects against distortion during pallet transit.",
    defaultOptions: {
      scale: 3,
      height: 30,
      includeText: true,
    },
  },
  {
    id: "healthcare-udi-dm",
    title: "FDA UDI & Medical Device (Data Matrix)",
    category: "healthcare",
    symbology: "datamatrix",
    description: "Direct Part Marking (DPM) and tiny surgical instrument labeling with ECC 200.",
    badge: "Healthcare / FDA UDI",
    samplePayload: "(01)08901030999991(17)280630(10)LOT492",
    fieldNotes: "High data density with reed-solomon error recovery.",
    defaultOptions: {
      scale: 4,
      foregroundColor: "#000000",
      backgroundColor: "#ffffff",
    },
  },
  {
    id: "book-isbn13",
    title: "Book Publishing Standard (ISBN-13)",
    category: "publishing",
    symbology: "isbn",
    description: "International Standard Book Number for paperback, hardcover, and ebook trade.",
    badge: "Publishing",
    samplePayload: "978-0-13-468599-1",
    fieldNotes: "Prefix 978 or 979, followed by country and publisher identifiers.",
    defaultOptions: {
      scale: 3,
      height: 22,
      includeText: true,
    },
  },
  {
    id: "transit-boarding-aztec",
    title: "Transit & Boarding Pass (Aztec Code)",
    category: "events",
    symbology: "aztec",
    description: "High-speed optical scanning for airline, railway, and concert e-tickets.",
    badge: "Transit / Tickets",
    samplePayload: "TICKET-EXP-2026-SUN-774920",
    fieldNotes: "Requires no quiet zone margin, ideal for narrow thermal ticket receipts.",
    defaultOptions: {
      scale: 4,
      foregroundColor: "#000000",
    },
  },
];
