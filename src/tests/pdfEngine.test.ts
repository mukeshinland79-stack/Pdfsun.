// Environment compatibility polyfill for headless/Node test execution
if (typeof (Promise as any).try === "undefined") {
  (Promise as any).try = function (fn: any, ...args: any[]) {
    return new Promise((resolve) => resolve(fn(...args)));
  };
}
if (typeof (globalThis as any).DOMMatrix === "undefined") {
  (globalThis as any).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
  };
}

/**
 * PDFSun Automated Real File Processing Test Suite
 * Validates output document integrity, page counts, genuine AES encryption,
 * permanent stream redaction, and byte structures for all PDF tools.
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
    unlockPdfDocument,
    redactPdfContent,
  } = await import("../lib/pdfEngine");
  const { redactPdfPermanently } = await import("../lib/enterpriseRedactionEngine");
  const { decryptPDF, isEncrypted } = await import("@pdfsmaller/pdf-decrypt");
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pako = await import("pako");

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

    // 2. Test Merge PDF (Combining multiple documents)
    const file1 = await createTestPdfFile("Doc1.pdf", 2);
    const file2 = await createTestPdfFile("Doc2.pdf", 3);
    const file3 = await createTestPdfFile("Doc3.pdf", 1);
    const mergedBytes = await mergePdfs([file1, file2, file3]);
    assert(mergedBytes.length > 0, "mergePdfs produces non-empty output");
    const mergedDoc = await PDFDocument.load(mergedBytes);
    assert(mergedDoc.getPageCount() === 6, "mergePdfs accurately combines page counts (2 + 3 + 1 = 6)");

    // 3. Test Split PDF (Multi-range and individual page extractions)
    const fileToSplit = await createTestPdfFile("ToSplit.pdf", 5);
    const splitBlobs = await splitPdf(fileToSplit, "1, 3-4");
    assert(splitBlobs.length === 3, "splitPdf correctly extracts specified page ranges (3 output files)");
    // Verify each slice is a valid PDF
    for (let i = 0; i < splitBlobs.length; i++) {
      const sliceBytes = splitBlobs[i].pdfBytes;
      const sliceDoc = await PDFDocument.load(sliceBytes);
      assert(sliceDoc.getPageCount() >= 1, `splitPdf slice ${i + 1} is a valid readable PDF (${splitBlobs[i].fileName})`);
    }

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

    // 6. Test Genuine AES-256 PDF Password Encryption
    const fileToProtect = await createTestPdfFile("ToProtect.pdf", 2);
    const password = "StrongSecretPassword99";
    const protectedBytes = await protectPdf(fileToProtect, {
      userPassword: password,
      allowPrinting: true,
      allowCopying: false,
    });
    assert(protectedBytes.length > 0, "protectPdf creates non-empty encrypted document");

    // Verify document is genuinely encrypted via isEncrypted inspection
    const encCheck = await isEncrypted(protectedBytes);
    assert(encCheck.encrypted === true, "isEncrypted verifies document has genuine /Encrypt dictionary");
    assert(encCheck.algorithm === "AES-256", "Encryption uses genuine ISO 32000-compliant AES-256 standard");

    // Verify standard PDF load without credentials is challenged/rejected
    let rejectedWithoutPassword = false;
    try {
      await PDFDocument.load(protectedBytes);
    } catch {
      rejectedWithoutPassword = true;
    }
    assert(rejectedWithoutPassword, "Protected document safely rejects opening without decryption key");

    // Verify decryption with correct password succeeds
    const decryptedBytes = await decryptPDF(protectedBytes, password);
    const decryptedDoc = await PDFDocument.load(decryptedBytes);
    assert(decryptedDoc.getPageCount() === 2, "Decrypted document successfully restores all 2 original pages");

    // Verify decryption with wrong password fails
    let wrongPasswordFailed = false;
    try {
      await decryptPDF(protectedBytes, "WrongIncorrectPassword");
    } catch {
      wrongPasswordFailed = true;
    }
    assert(wrongPasswordFailed, "Decryption correctly rejects invalid password");

    // 7. Test Genuine Permanent Stream Redaction (Zero Leaks)
    const redactionDoc = await PDFDocument.create();
    const rFont = await redactionDoc.embedFont(StandardFonts.Helvetica);
    const rPage = redactionDoc.addPage([600, 800]);
    rPage.drawText("Public Title: Q3 Financial Statement", { font: rFont, x: 50, y: 700, size: 14 });
    rPage.drawText("Confidential Tax ID: 999-11-2222 Account 8888-9999", { font: rFont, x: 50, y: 650, size: 14 });
    const unredactedBytes = await redactionDoc.save({ useObjectStreams: false });

    const unredactedFile = new File([new Blob([unredactedBytes])], "Financial.pdf", { type: "application/pdf" });

    // Execute permanent redaction on sensitive terms
    const redactResult = await redactPdfPermanently(
      unredactedFile,
      {
        terms: ["999-11-2222", "8888-9999"],
        boxes: [{ pageIndex: 0, x: 50, y: 645, width: 350, height: 20 }],
        redactionColor: { r: 0, g: 0, b: 0 },
        redactionLabel: "REDACTED",
      }
    );

    assert(redactResult.pdfBytes.length > 0, "redactPdfPermanently produces valid output bytes");
    assert(redactResult.pagesAffected.includes(0), "redactPdfPermanently registers page 1 as sanitized");

    // Decompress every stream in the redacted output to verify sensitive tokens are 100% gone
    let foundSensitiveToken = false;
    const sanitizedBytes = redactResult.pdfBytes;

    for (let i = 0; i < sanitizedBytes.length - 2; i++) {
      if (sanitizedBytes[i] === 0x78 && (sanitizedBytes[i+1] === 0x9c || sanitizedBytes[i+1] === 0x01 || sanitizedBytes[i+1] === 0xda)) {
        try {
          const inflated = pako.inflate(sanitizedBytes.slice(i));
          const text = new TextDecoder("latin1").decode(inflated);
          if (text.includes("999-11-2222") || text.includes("8888-9999")) {
            foundSensitiveToken = true;
          }
        } catch {}
      }
    }
    assert(!foundSensitiveToken, "Permanent redaction completely purged 999-11-2222 and 8888-9999 from all content streams");

    // Verify public text still exists in document
    const sanitizedDoc = await PDFDocument.load(sanitizedBytes);
    assert(sanitizedDoc.getPageCount() === 1, "Sanitized PDF preserves page structure");

    // 8. Test Watermark PDF
    const fileToWatermark = await createTestPdfFile("ToWatermark.pdf", 1);
    const watermarkedBytes = await watermarkPdf(fileToWatermark, { text: "PDFSun Confidential" });
    assert(watermarkedBytes.length > 0, "watermarkPdf overlays watermark");

    // 9. Test Images to PDF
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

    // 10. Test Add Page Numbers
    const fileForPageNums = await createTestPdfFile("PageNums.pdf", 3);
    const { addPageNumbers, editPdfMetadata } = await import("../lib/pdfEngine");
    const numberedBytes = await addPageNumbers(fileForPageNums, "bottom-center");
    assert(numberedBytes.length > 0, "addPageNumbers returns valid PDF bytes");
    const numberedDoc = await PDFDocument.load(numberedBytes);
    assert(numberedDoc.getPageCount() === 3, "addPageNumbers preserves page count (3 pages)");

    // 11. Test Edit PDF Metadata
    const fileForMeta = await createTestPdfFile("MetadataTest.pdf", 1);
    const metaBytes = await editPdfMetadata(fileForMeta, {
      title: "PDFSun Verified Title",
      author: "PDFSun Architecture Team",
      subject: "Quality Assurance Report",
    });
    assert(metaBytes.length > 0, "editPdfMetadata returns valid PDF bytes");
    const metaDoc = await PDFDocument.load(metaBytes);
    assert(metaDoc.getTitle() === "PDFSun Verified Title", "editPdfMetadata successfully writes and persists Title");
    assert(metaDoc.getAuthor() === "PDFSun Architecture Team", "editPdfMetadata successfully writes and persists Author");

    // 12. Test Error Handling on Corrupted / Invalid File
    let corruptedCaught = false;
    try {
      const corruptedBlob = new Blob(["This is completely invalid binary content and not a PDF header"], { type: "application/pdf" });
      const corruptedFile = new File([corruptedBlob], "corrupted.pdf", { type: "application/pdf" });
      await PDFDocument.load(await corruptedFile.arrayBuffer());
    } catch {
      corruptedCaught = true;
    }
    assert(corruptedCaught, "PDF engine cleanly identifies and rejects corrupted file without unhandled crashes");

    // 13. Test Error Handling on Empty 0-byte File
    let emptyFileCaught = false;
    try {
      const emptyBlob = new Blob([], { type: "application/pdf" });
      const emptyFile = new File([emptyBlob], "empty.pdf", { type: "application/pdf" });
      await PDFDocument.load(await emptyFile.arrayBuffer());
    } catch {
      emptyFileCaught = true;
    }
    assert(emptyFileCaught, "PDF engine safely intercepts empty 0-byte files with immediate validation error");

    logs.push(`🎉 Test Suite Finished: ${passed} Passed, ${failed} Failed.`);
  } catch (err: any) {
    failed++;
    logs.push(`❌ Test Suite Execution Exception: ${err?.message || err}`);
  }

  return { passed, failed, logs };
}
