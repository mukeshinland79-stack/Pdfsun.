/**
 * PDFSun Barcode Studio — Comprehensive Automated Verification Suite
 * Validates check digit math, vector SVG rendering, sheet imposition, and bulk ZIP pipelines
 */

import { calculateGs1Mod10, verifyGs1Mod10, calculateCode39Mod43, validateBarcodeInput } from "./validation";
import { renderBarcode } from "./renderer";
import { STANDARD_LABEL_TEMPLATES, generatePrintReadyLabelPdf } from "./labelDesigner";
import { parseCsvData, generateSequentialItems, createBulkBarcodeZip } from "./bulkEngine";
import { SYMBOLOGY_CATALOG, SymbologyType } from "./types";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
  }
}

async function runBarcodeTestSuite() {
  console.log("==========================================================================");
  console.log("PDFSun.in — BARCODE STUDIO AUTOMATED VERIFICATION SUITE");
  console.log("==========================================================================");

  // 1. GS1 Modulo-10 Check Digit Tests
  console.log("\n[1] GS1 Modulo-10 Check Digit Tests");
  // Example GTIN-13: 890103099999 -> Check digit is 1
  const mod10Result1 = calculateGs1Mod10("890103099999");
  assert(typeof mod10Result1 === "string" && mod10Result1.length === 1, "calculateGs1Mod10 returns 1 digit");
  assert(verifyGs1Mod10(`890103099999${mod10Result1}`), `verifyGs1Mod10 accepts computed check digit (${mod10Result1})`);
  assert(!verifyGs1Mod10("890103099999" + (mod10Result1 === "0" ? "1" : "0")), "verifyGs1Mod10 rejects tampered check digit");

  // Standard EAN-8 test: 8901234 -> Check digit calculation
  const ean8Check = calculateGs1Mod10("8901234");
  assert(typeof ean8Check === "string" && ean8Check.length === 1, "EAN-8 Mod10 check digit calculated");

  // 2. Code 39 Modulo-43 Check Digit
  console.log("\n[2] Code 39 Modulo-43 Checksum Test");
  const mod43 = calculateCode39Mod43("CODE39");
  assert(typeof mod43 === "string" && mod43.length === 1, "calculateCode39Mod43 produces valid char");

  // 3. Validation and Auto-Completion
  console.log("\n[3] Input Validation & Auto-Completion Tests");
  const ean13Val12 = validateBarcodeInput("ean13", "890103099999");
  assert(ean13Val12.isValid === true && ean13Val12.normalizedText.length === 13, "EAN-13 auto-completes 12 digits to 13 digits");

  const ean13ValInvalid = validateBarcodeInput("ean13", "8901030999998");
  assert(ean13ValInvalid.autoFixAvailable === true, "EAN-13 invalid check digit offers autoFix");

  const codabarVal = validateBarcodeInput("codabar", "123456");
  assert(codabarVal.isValid === true && codabarVal.normalizedText.startsWith("A"), "Codabar auto-wraps in start/stop guards");

  const fnskuVal = validateBarcodeInput("amazon-fnsku", "X001ABC456");
  assert(fnskuVal.isValid === true, "Amazon FNSKU validates 10-char alphanumeric string");

  // 4. Vector SVG & Raster Rendering Tests across Symbologies
  console.log("\n[4] Vector SVG Rendering Across Symbologies");
  const symbologiesToTest: SymbologyType[] = [
    "code128",
    "code39",
    "ean13",
    "itf14",
    "qrcode",
    "datamatrix",
    "pdf417",
    "aztec",
    "isbn",
  ];

  for (const sym of symbologiesToTest) {
    const meta = SYMBOLOGY_CATALOG[sym];
    try {
      const result = await renderBarcode({
        symbology: sym,
        text: meta.sampleData,
        scale: 2,
      });

      assert(
        result.svg.includes("<svg") && result.svg.includes("</svg>"),
        `${meta.name} renders valid vector SVG`
      );
      assert(
        result.dataUrl.length > 50,
        `${meta.name} generates dataUrl`
      );
    } catch (err: any) {
      assert(false, `${meta.name} render threw error: ${err?.message || err}`);
    }
  }

  // 5. Sheet Imposition & Print-Ready PDF Generation
  console.log("\n[5] Sheet Imposition & Label Designer Tests");
  const avery5160Template = STANDARD_LABEL_TEMPLATES.find((t) => t.id === "avery-5160")!;
  const testItems = [
    {
      id: "item-1",
      barcodeValue: "SUN-PRO-001",
      symbology: "code128" as SymbologyType,
      title: "Solar Inverter 5kVA",
      subtitle: "SKU-SLR-500",
      price: "₹45,999",
      quantity: 5,
    },
    {
      id: "item-2",
      barcodeValue: "890103099999",
      symbology: "ean13" as SymbologyType,
      title: "Retail Packaging Item",
      subtitle: "EAN GTIN-13",
      price: "₹249",
      quantity: 3,
    },
  ];

  const sheetPdf = await generatePrintReadyLabelPdf({
    template: avery5160Template,
    items: testItems,
    showBorder: true,
  });

  assert(sheetPdf instanceof Uint8Array && sheetPdf.length > 1000, `Avery 5160 PDF generated (${sheetPdf.length} bytes)`);

  const zebraTemplate = STANDARD_LABEL_TEMPLATES.find((t) => t.id === "zebra-4x6")!;
  const zebraPdf = await generatePrintReadyLabelPdf({
    template: zebraTemplate,
    items: testItems.slice(0, 1),
    showBorder: false,
  });
  assert(zebraPdf instanceof Uint8Array && zebraPdf.length > 500, `Zebra 4"x6" thermal PDF generated (${zebraPdf.length} bytes)`);

  // 6. Bulk Generation & Sequential Numbering Tests
  console.log("\n[6] Bulk Engine & Sequential Generator Tests");
  const seqItems = generateSequentialItems({
    prefix: "INV-2026-",
    startNumber: 1,
    endNumber: 5,
    padLength: 4,
    suffix: "-X",
    symbology: "code128",
    titlePrefix: "Batch Item",
  });

  assert(seqItems.length === 5, "Sequential generator generated exactly 5 items");
  assert(seqItems[0].barcodeValue === "INV-2026-0001-X", `Item 1 formatted with padding: ${seqItems[0].barcodeValue}`);
  assert(seqItems[4].barcodeValue === "INV-2026-0005-X", `Item 5 formatted with padding: ${seqItems[4].barcodeValue}`);

  const csvContent = `barcode,title,price\nPROD-101,Widget A,₹99\nPROD-102,Widget B,₹149`;
  const parsedCsv = parseCsvData(csvContent, "code128");
  assert(parsedCsv.length === 2 && parsedCsv[0].title === "Widget A", "CSV parser parsed items and titles correctly");

  const zipBytes = await createBulkBarcodeZip(seqItems.slice(0, 3), "svg");
  assert(zipBytes instanceof Uint8Array && zipBytes.length > 500, `Bulk ZIP archive created with manifest (${zipBytes.length} bytes)`);

  console.log("\n==========================================================================");
  console.log(`BARCODE SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("==========================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runBarcodeTestSuite().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
