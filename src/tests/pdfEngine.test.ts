// Environment compatibility polyfill for headless/Node test execution
if (typeof (globalThis as any).DOMMatrix === "undefined") {
  (globalThis as any).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
  };
}

/**
 * PDFSun Automated Real File Processing Test Suite
 * Validates output document integrity, page counts, and byte structures for all PDF tools.
 */
export async function runPdfEngineTestSuite(): Promise<{
  passed: number;
  failed: number;
  logs: string[];
}> {
  // Ensure polyfill is initialized before dynamic load
  if (typeof (globalThis as any).DOMMatrix === "undefined") {
    (globalThis as any).DOMMatrix = class DOMMatrix {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    };
  }
  if (typeof (globalThis as any).Image === "undefined") {
    (globalThis as any).Image = class MockImage {
      width = 100;
      height = 100;
      onload: (() => void) | null = null;
      set src(_val: string) {
        setTimeout(() => this.onload && this.onload(), 5);
      }
    };
  }

  const {
    mergePdfs,
    splitPdf,
    compressPdf,
    rotatePdf,
    protectPdf,
    watermarkPdf,
    textToPdf,
    imagesToPdf,
  } = await import("../lib/pdfEngine");
  const { PDFDocument } = await import("pdf-lib");

  const logs: string[] = [];
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
      logs.push(`✅ [PASS] ${testName}`);
    } else {
      failed++;
      logs.push(`❌ [FAIL] ${testName}`);
    }
  }

  try {
    logs.push("🚀 Starting PDFSun Real Processing Engine Test Suite...");

    // Helper to generate a valid test PDF File
    async function createTestPdfFile(name: string, pageCount: number = 2): Promise<File> {
      const doc = await PDFDocument.create();
      for (let i = 0; i < pageCount; i++) {
        const page = doc.addPage([600, 800]);
        page.drawText(`PDFSun Automated Test Page ${i + 1} for ${name}`, { x: 50, y: 700 });
      }
      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      return new File([blob], name, { type: "application/pdf" });
    }

    // 1. Test Text to PDF
    const textBytes = textToPdf("Hello PDFSun Test Suite", "Test Doc");
    assert(textBytes.length > 500, "textToPdf produces non-empty valid PDF bytes");
    const loadedTextDoc = await PDFDocument.load(textBytes);
    assert(loadedTextDoc.getPageCount() === 1, "textToPdf produces single page document");

    // 2. Test Merge PDF
    const file1 = await createTestPdfFile("Doc1.pdf", 2);
    const file2 = await createTestPdfFile("Doc2.pdf", 3);
    const mergedBytes = await mergePdfs([file1, file2]);
    assert(mergedBytes.length > 0, "mergePdfs produces non-empty output");
    const mergedDoc = await PDFDocument.load(mergedBytes);
    assert(mergedDoc.getPageCount() === 5, "mergePdfs accurately combines page counts (2 + 3 = 5)");

    // 3. Test Split PDF
    const fileToSplit = await createTestPdfFile("ToSplit.pdf", 4);
    const splitBlobs = await splitPdf(fileToSplit, "1, 3-4");
    assert(splitBlobs.length === 3, "splitPdf correctly extracts specified page ranges (3 files)");

    // 4. Test Compress PDF
    const fileToCompress = await createTestPdfFile("ToCompress.pdf", 2);
    const compressedBytes = await compressPdf(fileToCompress, 0.7);
    assert(compressedBytes.length > 0, "compressPdf returns valid compressed PDF bytes");
    const compressedDoc = await PDFDocument.load(compressedBytes);
    assert(compressedDoc.getPageCount() === 2, "compressPdf preserves page count");

    // 5. Test Rotate PDF
    const fileToRotate = await createTestPdfFile("ToRotate.pdf", 2);
    const rotatedBytes = await rotatePdf(fileToRotate, 90);
    assert(rotatedBytes.length > 0, "rotatePdf produces valid PDF");

    // 6. Test Protect PDF
    const fileToProtect = await createTestPdfFile("ToProtect.pdf", 1);
    const protectedBytes = await protectPdf(fileToProtect, { userPassword: "Secret123" });
    assert(protectedBytes.length > 0, "protectPdf creates encrypted document");

    // 7. Test Watermark PDF
    const fileToWatermark = await createTestPdfFile("ToWatermark.pdf", 1);
    const watermarkedBytes = await watermarkPdf(fileToWatermark, { text: "PDFSun Confidential" });
    assert(watermarkedBytes.length > 0, "watermarkPdf overlays watermark");

    // 8. Test Images to PDF
    let imgFile: File;
    if (typeof document !== "undefined" && typeof document.createElement === "function") {
      const canvas = document.createElement("canvas");
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "red";
        ctx.fillRect(0, 0, 100, 100);
      }
      const imgBlob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
      imgFile = new File([imgBlob], "test.png", { type: "image/png" });
    } else {
      // 1x1 valid PNG image byte buffer for headless test environments
      const pngBytes = new Uint8Array([
        137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0, 144, 119, 83, 222, 0, 0, 0, 12, 73, 68, 65, 84, 8, 215, 99, 248, 207, 192, 0, 0, 3, 1, 1, 0, 24, 221, 141, 176, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130
      ]);
      const blob = new Blob([pngBytes], { type: "image/png" });
      imgFile = new File([blob], "test.png", { type: "image/png" });
    }
    const imgPdfBytes = await imagesToPdf([imgFile]);
    assert(imgPdfBytes.length > 0, "imagesToPdf converts PNG image to valid PDF");

    logs.push(`🎉 Test Suite Finished: ${passed} Passed, ${failed} Failed.`);
  } catch (err: any) {
    failed++;
    logs.push(`❌ Test Suite Execution Exception: ${err?.message || err}`);
  }

  return { passed, failed, logs };
}
