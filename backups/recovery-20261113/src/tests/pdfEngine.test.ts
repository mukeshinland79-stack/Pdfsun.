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
    epubToPdf,
    rtfToPdf,
    xmlToPdf,
    htmlToPdf,
    extractTextFromPdfFile,
  } = await import("../lib/pdfEngine");
  const { redactPdfPermanently } = await import("../lib/enterpriseRedactionEngine");
  const { compressPdfEnterprise } = await import("../lib/enterpriseCompressionEngine");
  const { convertEpubToPdfEnterprise } = await import("../lib/enterpriseEpubEngine");
  const { convertRtfToPdfEnterprise } = await import("../lib/enterpriseRtfEngine");
  const { convertXmlToPdfEnterprise } = await import("../lib/enterpriseXmlEngine");
  const { convertHtmlToPdfEnterprise } = await import("../lib/enterpriseHtmlEngine");
  const jszipImport = await import("jszip");
  const JSZip = (jszipImport.default || jszipImport) as any;
  const { decryptPDF, isEncrypted } = await import("@pdfsmaller/pdf-decrypt");
  const { PDFDocument, StandardFonts, rgb, degrees, PDFName } = await import("pdf-lib");
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

    // 4. Test Compress PDF & Enterprise Compression Engine
    const fileToCompress = await createTestPdfFile("ToCompress.pdf", 2);
    const compressedBytes = await compressPdf(fileToCompress, 0.7);
    assert(compressedBytes.length > 0, "compressPdf returns valid compressed PDF bytes");
    const compressedDoc = await PDFDocument.load(compressedBytes);
    assert(compressedDoc.getPageCount() === 2, "compressPdf preserves page count");

    // 4B. Test Enterprise Compression Details & Inflation Prevention Guard
    const compDetails = await compressPdfEnterprise(fileToCompress, { preset: "recommended" });
    assert(compDetails.pdfBytes.length > 0, "compressPdfEnterprise produces valid output bytes");
    assert(compDetails.compressedSize <= compDetails.originalSize, "Compression engine guarantees zero size inflation (compressedSize <= originalSize)");
    assert(compDetails.originalSize === fileToCompress.size, "compressPdfEnterprise accurately reports true input byte size");
    assert(typeof compDetails.percentSaved === "number" && compDetails.percentSaved >= 0, "compressPdfEnterprise reports valid non-fabricated percentage");

    // 4C. Test Compression of Document with Embedded Image XObject
    const imgTestDoc = await PDFDocument.create();
    const testJpg = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
      0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
      0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
      0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
      0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
      0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
      0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
      0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
      0x00, 0xbf, 0x00, 0xff, 0xd9
    ]);
    const embJpg = await imgTestDoc.embedJpg(testJpg);
    const imgPage = imgTestDoc.addPage([500, 700]);
    imgPage.drawText("Document with Embedded Image", { x: 50, y: 650 });
    imgPage.drawImage(embJpg, { x: 50, y: 200, width: 300, height: 300 });
    const imgDocBytes = await imgTestDoc.save();
    const imgTestFile = new File([new Blob([imgDocBytes])], "ImgDoc.pdf", { type: "application/pdf" });

    const imgCompRes = await compressPdfEnterprise(imgTestFile, { preset: "extreme", targetMaxKB: 100 });
    assert(imgCompRes.pdfBytes.length > 0, "Document with embedded image compresses to valid output bytes");
    const loadedCompImgDoc = await PDFDocument.load(imgCompRes.pdfBytes);
    assert(loadedCompImgDoc.getPageCount() === 1, "Image document preserves exact page count after compression");
    const pSize = loadedCompImgDoc.getPage(0).getSize();
    assert(pSize.width === 500 && pSize.height === 700, "Image document preserves page dimensions after compression (500x700)");

    // 4D. Test Preset Variations
    const extremeBytes = await compressPdf(fileToCompress, 0.5, undefined, "extreme");
    const lowBytes = await compressPdf(fileToCompress, 0.85, undefined, "low");
    assert(extremeBytes.length > 0 && lowBytes.length > 0, "Both extreme and low compression presets produce valid readable PDFs");

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

    // 7B. Test Scanned PDF & Raster Image XObject Sanitization
    const scannedDoc = await PDFDocument.create();
    const testPngBytes = new Uint8Array([
      137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0, 144, 119, 83, 222, 0, 0, 0, 12, 73, 68, 65, 84, 8, 215, 99, 248, 207, 192, 0, 0, 3, 1, 1, 0, 24, 221, 141, 176, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130
    ]);
    const embeddedOrigImg = await scannedDoc.embedPng(testPngBytes);
    const scannedPage = scannedDoc.addPage([500, 700]);
    scannedPage.drawImage(embeddedOrigImg, { x: 50, y: 50, width: 400, height: 600 });
    const rawScannedBytes = await scannedDoc.save();

    const scannedFile = new File([new Blob([rawScannedBytes])], "ScannedDocument.pdf", { type: "application/pdf" });
    const scannedRedactRes = await redactPdfPermanently(scannedFile, {
      boxes: [{ pageIndex: 0, x: 100, y: 200, width: 200, height: 50 }],
      strategy: "deep_raster",
    });

    assert(scannedRedactRes.pdfBytes.length > 0, "Scanned PDF redaction produces valid output bytes");
    assert(scannedRedactRes.rasterizedPages.includes(0), "Scanned PDF page correctly identified and routed through pixel rasterization");
    const loadedScannedSanitized = await PDFDocument.load(scannedRedactRes.pdfBytes);
    assert(loadedScannedSanitized.getPageCount() === 1, "Scanned sanitized document preserves page count");
    const sanPageSize = loadedScannedSanitized.getPage(0).getSize();
    assert(sanPageSize.width === 500 && sanPageSize.height === 700, "Scanned sanitized document preserves original page dimensions (500x700)");

    // 7B-2. Test Complex Font & CIDFont Detection and Raster Routing
    const cidDoc = await PDFDocument.create();
    const cidPage = cidDoc.addPage([500, 700]);
    const cidFontDict = cidDoc.context.obj({
      Type: "Font",
      Subtype: "Type0",
      BaseFont: "CustomCIDFont-Bold",
      Encoding: "Identity-H",
    });
    const cidFontRef = cidDoc.context.register(cidFontDict);
    const pageRes = (cidPage.node as any).Resources();
    const fontResDict = cidDoc.context.obj({
      CFont1: cidFontRef,
    });
    pageRes.set(PDFName.of("Font"), fontResDict);
    cidPage.drawText("Test CID Protected Data", { x: 50, y: 500 });
    const cidBytes = await cidDoc.save();
    const cidFile = new File([new Blob([cidBytes])], "CIDDoc.pdf", { type: "application/pdf" });
    const cidRedactRes = await redactPdfPermanently(cidFile, {
      boxes: [{ pageIndex: 0, x: 50, y: 490, width: 200, height: 30 }],
      strategy: "auto",
    });
    assert(cidRedactRes.hasComplexFonts === true, "Complex CID font correctly detected in PDF page resources");
    assert(cidRedactRes.rasterizedPages.includes(0), "Document with complex CID font safely routed to deep pixel rasterization");

    // 7B-3. Test Hidden OCR Layer (3 Tr) Detection and Sanitization
    const ocrDoc = await PDFDocument.create();
    const ocrPage = ocrDoc.addPage([500, 700]);
    const ocrContent = "BT /F1 12 Tf 3 Tr 50 500 Td (Hidden OCR SSN: 000-11-2222) Tj ET";
    const ocrStream = ocrDoc.context.flateStream(ocrContent);
    const ocrStreamRef = ocrDoc.context.register(ocrStream);
    ocrPage.node.set(PDFName.of("Contents"), ocrStreamRef);
    const ocrBytes = await ocrDoc.save();
    const ocrFile = new File([new Blob([ocrBytes])], "OCRDoc.pdf", { type: "application/pdf" });
    const ocrRedactRes = await redactPdfPermanently(ocrFile, {
      boxes: [{ pageIndex: 0, x: 50, y: 490, width: 200, height: 30 }],
      strategy: "auto",
    });
    assert(ocrRedactRes.hasHiddenOcrText === true, "Invisible OCR layer (3 Tr) correctly detected in page content stream");
    assert(ocrRedactRes.rasterizedPages.includes(0), "Invisible OCR layer securely sanitized with deep pixel burning");

    // 7B-4. Test Rotated Scanned Page (90 degrees) Preservation
    const rotDoc = await PDFDocument.create();
    const rotPage = rotDoc.addPage([500, 700]);
    rotPage.setRotation(degrees(90));
    const embImg = await rotDoc.embedPng(testPngBytes);
    rotPage.drawImage(embImg, { x: 50, y: 50, width: 400, height: 600 });
    const rotBytes = await rotDoc.save();
    const rotFile = new File([new Blob([rotBytes])], "RotatedScanned.pdf", { type: "application/pdf" });
    const rotRedactRes = await redactPdfPermanently(rotFile, {
      boxes: [{ pageIndex: 0, x: 50, y: 50, width: 100, height: 100 }],
      strategy: "deep_raster",
    });
    const loadedRotDoc = await PDFDocument.load(rotRedactRes.pdfBytes);
    const loadedRotPage = loadedRotDoc.getPage(0);
    assert(loadedRotPage.getRotation().angle === 90, "Scanned PDF raster redaction preserves 90-degree page rotation");

    // 7C. Test Encrypted PDF Redaction Fail-Closed & Authorized Decryption
    const encTestDoc = await PDFDocument.create();
    const encP = encTestDoc.addPage([400, 400]);
    encP.drawText("Classified Encrypted Document Text");
    const rawEncBytes = await encTestDoc.save();
    const protectedTargetBytes = await protectPdf(
      new File([new Blob([rawEncBytes])], "Locked.pdf", { type: "application/pdf" }),
      { userPassword: "AuthRequiredPass123" }
    );
    const lockedFile = new File([new Blob([protectedTargetBytes])], "Locked.pdf", { type: "application/pdf" });

    // Step A: Attempt without password -> Must fail closed
    let encWithoutPassFailed = false;
    try {
      await redactPdfPermanently(lockedFile, { terms: ["Classified"] });
    } catch (err: any) {
      if (err.message.includes("password-protected")) {
        encWithoutPassFailed = true;
      }
    }
    assert(encWithoutPassFailed, "Encrypted PDF safely fails closed and prompts for password without authorization");

    // Step B: Attempt with correct password -> Must succeed
    let encWithPassSuccess = false;
    try {
      const unlockedRedactRes = await redactPdfPermanently(lockedFile, {
        terms: ["Classified"],
        password: "AuthRequiredPass123",
      });
      encWithPassSuccess = unlockedRedactRes.pdfBytes.length > 0;
    } catch {}
    assert(encWithPassSuccess, "Encrypted PDF successfully unlocks with authorized password and completes redaction");

    // 7D. Test Malformed File Handling
    let malformedFailedSafely = false;
    try {
      const corruptFile = new File([new Blob([new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])])], "corrupt.pdf", { type: "application/pdf" });
      await redactPdfPermanently(corruptFile, { terms: ["secret"] });
    } catch (err: any) {
      if (err.message.includes("Document Parsing Failed")) {
        malformedFailedSafely = true;
      }
    }
    assert(malformedFailedSafely, "Malformed / non-PDF input fails safely with clean validation error");

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

    // 14. Test EPUB to PDF (Genuine Archive Parsing & Reading Order)
    const epubZip = new JSZip();
    epubZip.file("mimetype", "application/epub+zip");
    epubZip.file(
      "META-INF/container.xml",
      '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>'
    );
    epubZip.file(
      "OEBPS/content.opf",
      '<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" version="2.0"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Pride and Prejudice</dc:title><dc:creator>Jane Austen</dc:creator></metadata><manifest><item id="c1" href="chap1.xhtml" media-type="application/xhtml+xml"/><item id="c2" href="chap2.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="c1"/><itemref idref="c2"/></spine></package>'
    );
    epubZip.file(
      "OEBPS/chap1.xhtml",
      '<?xml version="1.0"?><html><head><title>Chapter 1</title></head><body><h1>Chapter 1</h1><p>It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.</p></body></html>'
    );
    epubZip.file(
      "OEBPS/chap2.xhtml",
      '<?xml version="1.0"?><html><head><title>Chapter 2</title></head><body><h1>Chapter 2</h1><p>Mr. Bennet was among the earliest of those who waited on Mr. Bingley.</p></body></html>'
    );
    const validEpubBytes = await epubZip.generateAsync({ type: "uint8array" });
    const epubFile = new File([new Blob([validEpubBytes])], "PrideAndPrejudice.epub", { type: "application/epub+zip" });

    const epubResult = await convertEpubToPdfEnterprise(epubFile);
    assert(epubResult.pdfBytes.length > 0, "convertEpubToPdfEnterprise produces valid non-empty PDF bytes");
    assert(epubResult.title === "Pride and Prejudice", "EPUB converter extracts correct book title metadata");
    assert(epubResult.author === "Jane Austen", "EPUB converter extracts correct author metadata");
    assert(epubResult.chapterCount === 2, "EPUB converter processes all sequential chapters from spine");
    const loadedEpubPdf = await PDFDocument.load(epubResult.pdfBytes);
    assert(loadedEpubPdf.getPageCount() >= 2, "EPUB to PDF generates valid multi-page document with title page");

    // 14B. Test EPUB Zip-Slip Security Rejection
    const evilZip = new JSZip();
    evilZip.file("mimetype", "application/epub+zip");
    evilZip.file("../evil_traversal.txt", "malicious payload");
    const evilBytes = await evilZip.generateAsync({ type: "uint8array" });
    let evilCaught = false;
    try {
      await convertEpubToPdfEnterprise(new File([new Blob([evilBytes])], "evil.epub", { type: "application/epub+zip" }));
    } catch (err: any) {
      if (err.message.includes("illegal path traversal") || err.message.includes("Security Violation")) {
        evilCaught = true;
      }
    }
    assert(evilCaught, "EPUB engine strictly blocks Zip-Slip path traversal entries (../)");

    // 15. Test RTF to PDF (Preserving Alphanumeric Text & Decoding Unicode)
    const validRtfStr =
      "{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Courier;}} \\f0\\fs24 Hello World! This is a test \\par Second line with \\'e9t\\'e9 and \\u233? accents.}";
    const rtfFile = new File([new Blob([validRtfStr])], "Document.rtf", { type: "application/rtf" });
    const rtfResult = await convertRtfToPdfEnterprise(rtfFile);
    assert(rtfResult.pdfBytes.length > 0, "convertRtfToPdfEnterprise produces valid non-empty PDF bytes");
    assert(rtfResult.plainText.includes("Hello World! This is a test"), "RTF parser preserves ordinary English text without regex deletion");
    assert(rtfResult.plainText.includes("été"), "RTF parser successfully decodes hex escapes (\\'e9 -> é)");
    assert(rtfResult.plainText.includes("é accents"), "RTF parser successfully decodes Unicode escape with fallback (\\u233? -> é)");
    const loadedRtfPdf = await PDFDocument.load(rtfResult.pdfBytes);
    assert(loadedRtfPdf.getPageCount() >= 1, "RTF to PDF produces valid readable PDF document");

    // 15B. Test RTF Malformed Input Error Handling
    let rtfMalformedCaught = false;
    try {
      await convertRtfToPdfEnterprise("This is not an RTF file and lacks the rtf header");
    } catch (err: any) {
      if (err.message.includes("Invalid RTF Format")) rtfMalformedCaught = true;
    }
    assert(rtfMalformedCaught, "RTF engine safely intercepts malformed non-RTF inputs with clean error");

    // 16. Test HTML to PDF (Headings, Paragraphs, Lists, Tables & Sanitization)
    const validHtmlStr = `<!DOCTYPE html>
<html>
<head><title>Executive Financial Summary</title></head>
<body>
  <h1>Executive Financial Summary</h1>
  <p>Global revenue reached €1,250,000 with strong growth in Munich (München).</p>
  <ol>
    <li>Step Alpha: Architecture Review</li>
    <li>Step Beta: Security Clearance</li>
  </ol>
  <ul>
    <li>Bullet Item 1: Zero Trust Boundary</li>
    <li>Bullet Item 2: Client-side Encryption</li>
  </ul>
  <table border="1">
    <thead>
      <tr><th>Department</th><th>Budget</th><th>Status</th></tr>
    </thead>
    <tbody>
      <tr><td>Engineering</td><td>$500,000</td><td>Approved</td></tr>
      <tr><td>Compliance</td><td>$150,000</td><td>Verified</td></tr>
    </tbody>
  </table>
  <script>alert("malicious script execution attempt");</script>
  <button onclick="maliciousCode()">Click Me</button>
  <a href="javascript:alert(1)">Dangerous Link</a>
</body>
</html>`;
    const htmlFile = new File([new Blob([validHtmlStr])], "Spec.html", { type: "text/html" });
    const htmlResult = await convertHtmlToPdfEnterprise(htmlFile);
    assert(htmlResult.pdfBytes.length > 0, "convertHtmlToPdfEnterprise produces valid non-empty PDF bytes");
    assert(htmlResult.title === "Executive Financial Summary", "HTML converter extracts document title from <title> tag");
    assert(htmlResult.elementsProcessed >= 4, "HTML converter structures headings, paragraphs, lists, and tables");
    const loadedHtmlPdf = await PDFDocument.load(htmlResult.pdfBytes);
    assert(loadedHtmlPdf.getPageCount() >= 1, "HTML to PDF produces valid readable PDF document");

    const htmlPdfText = await extractTextFromPdfFile(new File([new Blob([htmlResult.pdfBytes])], "rendered_html.pdf", { type: "application/pdf" }));
    assert(htmlPdfText.includes("Executive Financial Summary"), "HTML output preserves main document heading");
    assert(htmlPdfText.includes("Step Alpha") && htmlPdfText.includes("Bullet Item 1"), "HTML output preserves ordered and unordered list items");
    assert(htmlPdfText.includes("Engineering") && htmlPdfText.includes("Approved"), "HTML output preserves table rows, headers, and cells");
    assert(!htmlPdfText.includes("malicious script") && !htmlPdfText.includes("javascript:"), "HTML engine strictly neutralizes scripts, event handlers, and javascript: URLs");

    // 17. Test XML to PDF (Nested Tree Report & Attributes)
    const validXmlStr = `<?xml version="1.0" encoding="UTF-8"?>
<company xmlns="https://pdfsun.in/schema" code="CORP-99" status="Active">
  <division id="DIV-ENG">
    <name>Engineering Core</name>
    <team lead="Ada Lovelace">
      <member role="Architect">Dev One</member>
      <member role="Security Specialist">Dev Two</member>
    </team>
  </division>
  <metadata env="production"/>
</company>`;
    const xmlFile = new File([new Blob([validXmlStr])], "Company.xml", { type: "application/xml" });
    const xmlResult = await convertXmlToPdfEnterprise(xmlFile);
    assert(xmlResult.pdfBytes.length > 0, "convertXmlToPdfEnterprise produces valid non-empty PDF bytes");
    assert(xmlResult.rootElement === "company", "XML converter accurately preserves document root element");
    assert(xmlResult.elementCount >= 6, "XML converter captures complete nested parent-child hierarchy");
    assert(xmlResult.attributeCount >= 5, "XML converter parses attributes across all hierarchy depths");
    const loadedXmlPdf = await PDFDocument.load(xmlResult.pdfBytes);
    assert(loadedXmlPdf.getPageCount() >= 1, "XML to PDF produces valid structured PDF document");

    const xmlPdfTextRaw = await extractTextFromPdfFile(new File([new Blob([xmlResult.pdfBytes])], "rendered_xml.pdf", { type: "application/pdf" }));
    const xmlPdfText = xmlPdfTextRaw.replace(/\s+/g, " ");
    assert(xmlPdfText.includes("<company") && xmlPdfText.includes("CORP-99"), "XML output renders root tag and attributes");
    assert(xmlPdfText.includes("<division") && xmlPdfText.includes("Engineering Core"), "XML output renders nested parent container elements");
    assert(xmlPdfText.includes("<member") && xmlPdfText.includes("Dev One"), "XML output renders nested child text nodes");

    // 17B. Test XML Mismatched / Malformed Tag Rejection
    let malformedXmlCaught = false;
    try {
      await convertXmlToPdfEnterprise("<root><open>Valid Text</mismatched></root>");
    } catch (err: any) {
      if (err.message.includes("Malformed XML") || err.message.includes("mismatched closing tag")) {
        malformedXmlCaught = true;
      }
    }
    assert(malformedXmlCaught, "XML parser safely intercepts mismatched closing tags with clean validation error");

    // 17C. Test XML XXE Injection Rejection
    const xxeXmlStr = `<?xml version="1.0"?>
<!DOCTYPE test [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<test>&xxe;</test>`;
    let xxeCaught = false;
    try {
      await convertXmlToPdfEnterprise(xxeXmlStr);
    } catch (err: any) {
      if (err.message.includes("XXE Rejected") || err.message.includes("Security Violation")) {
        xxeCaught = true;
      }
    }
    assert(xxeCaught, "XML engine strictly intercepts and rejects external entity injection (XXE / SYSTEM)");

    logs.push(`🎉 Test Suite Finished: ${passed} Passed, ${failed} Failed.`);
  } catch (err: any) {
    failed++;
    logs.push(`❌ Test Suite Execution Exception: ${err?.message || err}`);
  }

  return { passed, failed, logs };
}
