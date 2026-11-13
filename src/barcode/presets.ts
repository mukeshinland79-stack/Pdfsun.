/**
 * PDFSun Barcode Studio — Industry Presets & Business Workflows
 */

import { SymbologyType, BarcodeRenderOptions, encodeWifiQr, encodeVCardQr } from "./types";

export interface BusinessPreset {
  id: string;
  title: string;
  category: "retail" | "ecommerce" | "logistics" | "healthcare" | "publishing" | "qr-presets";
  symbology: SymbologyType;
  description: string;
  badge: string;
  defaultOptions: Partial<BarcodeRenderOptions>;
  samplePayload: string;
  fieldNotes: string;
}

export const BUSINESS_PRESETS: BusinessPreset[] = [
  {
    id: "gs1-retail-ean13",
    title: "Global Supermarket & Retail (EAN-13)",
    category: "retail",
    symbology: "ean13",
    description: "Universal GTIN-13 barcode used for point-of-sale checkout in 160+ countries.",
    badge: "GS1 Retail",
    samplePayload: "890103099999",
    fieldNotes: "Enter 12 digits; the 13th check digit will be calculated automatically via Modulo-10.",
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
    description: "Standard 12-digit barcode for consumer goods sold in the United States and Canada.",
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
    id: "amazon-fnsku",
    title: "Amazon FBA Product Label (FNSKU)",
    category: "ecommerce",
    symbology: "amazon-fnsku",
    description: "Fulfillment Network Stock Keeping Unit required on every individual unit sent to Amazon FBA.",
    badge: "Amazon FBA",
    samplePayload: "X001ABCD99",
    fieldNotes: "10-character alphanumeric code starting with X00 or B00 in Code 128 format.",
    defaultOptions: {
      scale: 3,
      height: 18,
      includeText: true,
      foregroundColor: "#000000",
      backgroundColor: "#ffffff",
    },
  },
  {
    id: "book-isbn13",
    title: "Book Publishing Standard (ISBN-13)",
    category: "publishing",
    symbology: "isbn",
    description: "International Standard Book Number for paperback, hardcover, and textbook trade.",
    badge: "Publishing",
    samplePayload: "9780134685991",
    fieldNotes: "Must start with 978 or 979 prefix, followed by country and publisher identifiers.",
    defaultOptions: {
      scale: 3,
      height: 22,
      includeText: true,
    },
  },
  {
    id: "warehouse-sku",
    title: "Warehouse Inventory & SKU Tag (Code 128)",
    category: "logistics",
    symbology: "code128",
    description: "Internal warehouse bin, pallet, and SKU identifier with high-density ASCII support.",
    badge: "Warehouse SKU",
    samplePayload: "WH-A12-BIN49-SKU88",
    fieldNotes: "Encodes alphanumeric IDs with automatic subset A/B/C compression.",
    defaultOptions: {
      scale: 3,
      height: 18,
      includeText: true,
    },
  },
  {
    id: "gs1-128-logistics",
    title: "GS1-128 Shipping Carton (with Application Identifiers)",
    category: "logistics",
    symbology: "gs1-128",
    description: "Global supply chain tracking with GTIN (01), Expiry (17), and Lot (10).",
    badge: "GS1 Logistics",
    samplePayload: "(01)08901030999994(17)261231(10)LOT42",
    fieldNotes: "Uses parenthesized Application Identifiers for automated warehouse scanning.",
    defaultOptions: {
      scale: 3,
      height: 28,
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
    fieldNotes: "14 digits total. Sturdy outer frame protects against ink spread and scanning distortion.",
    defaultOptions: {
      scale: 3,
      height: 30,
      includeText: true,
    },
  },
  {
    id: "qr-url",
    title: "Website URL & Landing Page (QR Code)",
    category: "qr-presets",
    symbology: "qrcode",
    description: "Instant web address redirection for marketing campaigns and product manuals.",
    badge: "Web QR",
    samplePayload: "https://pdfsun.in/barcode",
    fieldNotes: "Scannable with any iOS or Android camera app without special software.",
    defaultOptions: {
      scale: 4,
      ecLevel: "M",
    },
  },
  {
    id: "qr-wifi",
    title: "Wi-Fi Quick Connect (QR Code)",
    category: "qr-presets",
    symbology: "qrcode",
    description: "Automated Wi-Fi connection barcode: guests point their camera and connect instantly.",
    badge: "Wi-Fi Connect",
    samplePayload: encodeWifiQr({ ssid: "PDFSun_Guest_WiFi", password: "SolarPower2026!", security: "WPA" }),
    fieldNotes: "Contains encrypted SSID, authentication protocol (WPA/WEP), and pre-shared key.",
    defaultOptions: {
      scale: 4,
      ecLevel: "M",
    },
  },
  {
    id: "qr-vcard",
    title: "Digital Business Card / vCard (QR Code)",
    category: "qr-presets",
    symbology: "qrcode",
    description: "Contact card that saves name, phone, email, and company into phone contacts with one tap.",
    badge: "vCard Contact",
    samplePayload: encodeVCardQr({
      firstName: "Mukesh",
      lastName: "Inland",
      organization: "PDFSun Enterprise",
      jobTitle: "Founder & Architect",
      email: "contact@pdfsun.in",
      phone: "+91 98765 43210",
      url: "https://pdfsun.in",
    }),
    fieldNotes: "Conforms to vCard 3.0 standard recognized by Apple Contacts and Google Contacts.",
    defaultOptions: {
      scale: 4,
      ecLevel: "Q",
    },
  },
  {
    id: "healthcare-udi-dm",
    title: "FDA UDI & Medical Device (Data Matrix)",
    category: "healthcare",
    symbology: "datamatrix",
    description: "Direct Part Marking (DPM) and tiny surgical instrument labeling with ECC 200.",
    badge: "Healthcare / FDA UDI",
    samplePayload: "(01)08901030999994(17)280630(10)LOT492",
    fieldNotes: "High data density with Reed-Solomon error correction for laser etched parts.",
    defaultOptions: {
      scale: 4,
      foregroundColor: "#000000",
      backgroundColor: "#ffffff",
    },
  },
  {
    id: "transit-boarding-aztec",
    title: "Transit & Boarding Pass (Aztec Code)",
    category: "logistics",
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
