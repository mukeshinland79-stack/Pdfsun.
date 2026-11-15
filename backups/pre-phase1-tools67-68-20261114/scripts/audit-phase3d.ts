// Headless Node environment polyfills for pdfjs-dist
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

async function main() {
  const { runPdfEngineTestSuite } = await import("../src/tests/pdfEngine.test");
  const { ALL_TOOLS } = await import("../src/data/toolsData");
  const { PDFDocument } = await import("pdf-lib");
  const { convertHtmlToPdfEnterprise } = await import("../src/lib/enterpriseHtmlEngine");
  const { convertEpubToPdfEnterprise } = await import("../src/lib/enterpriseEpubEngine");
  const { convertRtfToPdfEnterprise } = await import("../src/lib/enterpriseRtfEngine");
  const { convertXmlToPdfEnterprise } = await import("../src/lib/enterpriseXmlEngine");
  const { redactPdfPermanently } = await import("../src/lib/enterpriseRedactionEngine");
  const { compressPdfEnterprise } = await import("../src/lib/enterpriseCompressionEngine");
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const JSZipModule = await import("jszip");
  const JSZip = (JSZipModule.default || JSZipModule) as any;

  async function extractTextFromPdfBytes(pdfBytes: Uint8Array): Promise<string[]> {
    const loadingTask = pdfjsLib.getDocument({
      data: pdfBytes,
      useSystemFonts: true,
      disableFontFace: true,
    });
  const doc = await loadingTask.promise;
  const pageTexts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const str = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ");
    pageTexts.push(str);
  }
  return pageTexts;
}

  console.log("=== Phase 3D Independent Verification Audit ===");
  const auditResults: Record<string, any> = {};

  // 1. Tool Registry Verification
  console.log("\n[A] Tool Registry Audit...");
  const toolIds = ALL_TOOLS.map((t) => t.id);
  console.log(`Total tools in ALL_TOOLS: ${toolIds.length}`);
  auditResults.toolCount = toolIds.length;
  auditResults.uniqueToolCount = new Set(toolIds).size;
  const missingTools = ALL_TOOLS.filter((t) => !t.id || !t.name || !t.slug);
  console.log(`Tools with missing required fields: ${missingTools.length}`);

  // 2. Real Conversion - HTML to PDF
  console.log("\n[B1] HTML to PDF Audit...");
  const sampleHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Audit Quarterly Report - 2026</title>
        <script>alert("XSS payload attempt");</script>
      </head>
      <body>
        <h1>Executive Financial Summary</h1>
        <p>Global revenue reached <strong>€1,250,000</strong> with strong growth in Munich (München).</p>
        <h2>Key Objectives</h2>
        <ul>
          <li>Item Alpha: Cloud Modernization</li>
          <li>Item Beta: Security Compliance</li>
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
      </body>
    </html>
  `;
  const htmlFile = new File([new Blob([sampleHtml])], "quarterly_report.html", { type: "text/html" });
  const htmlResult = await convertHtmlToPdfEnterprise(htmlFile);
  const htmlPdf = await PDFDocument.load(htmlResult.pdfBytes);
  const htmlExtracted = await extractTextFromPdfBytes(htmlResult.pdfBytes);
  const htmlAllText = htmlExtracted.join(" ");

  const htmlHasHeading = htmlAllText.includes("Executive Financial Summary");
  const htmlHasUnicode = htmlAllText.includes("€1,250,000") || htmlAllText.includes("1,250,000");
  const htmlHasMunich = htmlAllText.includes("München");
  const htmlHasTableData = htmlAllText.includes("Engineering") && htmlAllText.includes("Approved");
  const htmlScriptStripped = !htmlAllText.includes("XSS payload attempt");

  console.log(`- HTML PDF Page count: ${htmlPdf.getPageCount()}`);
  console.log(`- HTML Heading parsed: ${htmlHasHeading}`);
  console.log(`- HTML Table parsed: ${htmlHasTableData}`);
  console.log(`- HTML Unicode handled: ${htmlHasUnicode && htmlHasMunich}`);
  console.log(`- Script tag excluded from render: ${htmlScriptStripped}`);

  // 3. Real Conversion - EPUB to PDF
  console.log("\n[B2] EPUB to PDF Audit...");
  const epubZip = new JSZip();
  epubZip.file("mimetype", "application/epub+zip");
  epubZip.file(
    "META-INF/container.xml",
    '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OPS/package.opf" media-type="application/oebps-package+xml"/></rootfiles></container>'
  );
  epubZip.file(
    "OPS/package.opf",
    '<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" version="2.0"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Principles of Security</dc:title><dc:creator>Dr. Ada Lovelace</dc:creator></metadata><manifest><item id="ch1" href="chapter1.xhtml" media-type="application/xhtml+xml"/><item id="ch2" href="chapter2.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="ch1"/><itemref idref="ch2"/></spine></package>'
  );
  epubZip.file(
    "OPS/chapter1.xhtml",
    '<?xml version="1.0"?><html><head><title>Chapter 1: Foundations</title></head><body><h1>Chapter 1: Foundations</h1><p>Every complex architecture requires verifiable isolation of privilege.</p></body></html>'
  );
  epubZip.file(
    "OPS/chapter2.xhtml",
    '<?xml version="1.0"?><html><head><title>Chapter 2: Cryptography</title></head><body><h1>Chapter 2: Cryptography</h1><p>Public-key algorithms form the backbone of authenticated communication.</p></body></html>'
  );
  const validEpubBytes = await epubZip.generateAsync({ type: "uint8array" });
  const epubFile = new File([new Blob([validEpubBytes])], "security_book.epub", { type: "application/epub+zip" });
  const epubResult = await convertEpubToPdfEnterprise(epubFile);
  const epubPdf = await PDFDocument.load(epubResult.pdfBytes);
  const epubExtracted = await extractTextFromPdfBytes(epubResult.pdfBytes);
  const epubAllText = epubExtracted.join(" ");

  const epubTitleVerified = epubResult.title === "Principles of Security";
  const epubAuthorVerified = epubResult.author === "Dr. Ada Lovelace";
  const epubCh1Present = epubAllText.includes("verifiable isolation of privilege");
  const epubCh2Present = epubAllText.includes("authenticated communication");

  console.log(`- EPUB Title: ${epubResult.title} (Verified: ${epubTitleVerified})`);
  console.log(`- EPUB Author: ${epubResult.author} (Verified: ${epubAuthorVerified})`);
  console.log(`- EPUB Page Count: ${epubPdf.getPageCount()}`);
  console.log(`- EPUB Chapter 1 text verified: ${epubCh1Present}`);
  console.log(`- EPUB Chapter 2 text verified: ${epubCh2Present}`);

  // Test EPUB Zip-Slip Traversal rejection
  let epubZipSlipBlocked = false;
  try {
    const maliciousZip = new JSZip();
    maliciousZip.file("mimetype", "application/epub+zip");
    maliciousZip.file("../../etc/passwd", "malicious traversal");
    const maliciousBytes = await maliciousZip.generateAsync({ type: "uint8array" });
    await convertEpubToPdfEnterprise(new File([new Blob([maliciousBytes])], "evil.epub", { type: "application/epub+zip" }));
  } catch (err: any) {
    if (err.message.includes("traversal") || err.message.includes("Security Violation")) {
      epubZipSlipBlocked = true;
    }
  }
  console.log(`- EPUB Zip-Slip Traversal Blocked: ${epubZipSlipBlocked}`);

  // 4. Real Conversion - RTF to PDF
  console.log("\n[B3] RTF to PDF Audit...");
  const sampleRtf = `{\\rtf1\\ansi\\ansicpg1252\\deff0{\\fonttbl{\\f0\\fnil\\fcharset0 Arial;}}{\\colortbl ;\\red0\\green0\\blue0;}{\\*\\generator PDFSun RTF Engine;}\\pard\\sb120\\sa120\\b Audit Findings\\b0\\par This document contains accented characters: caf\\'e9 and na\\'efve, plus Unicode \\u8364? for Euro.\\par \\pard\\li720 - Point A: Integrity\\par - Point B: Performance\\par}`;
  const rtfFile = new File([new Blob([sampleRtf])], "findings.rtf", { type: "application/rtf" });
  const rtfResult = await convertRtfToPdfEnterprise(rtfFile);
  const rtfPdf = await PDFDocument.load(rtfResult.pdfBytes);
  const rtfExtracted = await extractTextFromPdfBytes(rtfResult.pdfBytes);
  const rtfAllText = rtfExtracted.join(" ");

  const rtfHasHeading = rtfAllText.includes("Audit Findings");
  const rtfHasAccents = rtfAllText.includes("café") || rtfAllText.includes("naïve") || rtfAllText.includes("cafe");
  const rtfHasPoints = rtfAllText.includes("Point A: Integrity");

  console.log(`- RTF Page Count: ${rtfPdf.getPageCount()}`);
  console.log(`- RTF Heading parsed: ${rtfHasHeading}`);
  console.log(`- RTF Hex & Unicode escapes handled: ${rtfHasAccents}`);
  console.log(`- RTF Content preserved: ${rtfHasPoints}`);

  // 5. Real Conversion - XML to PDF
  console.log("\n[B4] XML to PDF Audit...");
  const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
    <invoice id="INV-2026-904" status="Paid" xmlns="https://pdfsun.in/schema/invoice">
      <customer id="CUST-881">
        <name>Acme Corporation</name>
        <email>billing@acme.example.com</email>
      </customer>
      <lineItems>
        <item code="PROD-01" quantity="3" unitPrice="150.00">Enterprise Core License</item>
        <item code="PROD-02" quantity="1" unitPrice="499.00">Support Subscription</item>
      </lineItems>
      <total currency="USD">949.00</total>
    </invoice>`;
  const xmlFile = new File([new Blob([sampleXml])], "invoice.xml", { type: "application/xml" });
  const xmlResult = await convertXmlToPdfEnterprise(xmlFile);
  const xmlPdf = await PDFDocument.load(xmlResult.pdfBytes);
  const xmlExtracted = await extractTextFromPdfBytes(xmlResult.pdfBytes);
  const xmlAllText = xmlExtracted.join(" ");

  const xmlHasRoot = xmlAllText.includes("<invoice") || xmlAllText.includes("invoice");
  const xmlHasCustomer = xmlAllText.includes("Acme Corporation");
  const xmlHasAttributes = xmlAllText.includes("INV-2026-904") && xmlAllText.includes("Paid");
  const xmlHasLineItem = xmlAllText.includes("Enterprise Core License");

  console.log(`- XML Page Count: ${xmlPdf.getPageCount()}`);
  console.log(`- XML Hierarchy parsed: ${xmlHasRoot && xmlHasCustomer}`);
  console.log(`- XML Attributes rendered: ${xmlHasAttributes}`);
  console.log(`- XML Content verified: ${xmlHasLineItem}`);

  // Test XML XXE Injection Blocking
  let xxeBlocked = false;
  try {
    const maliciousXml = `<?xml version="1.0" encoding="ISO-8859-1"?>
      <!DOCTYPE foo [  
        <!ELEMENT foo ANY >
        <!ENTITY xxe SYSTEM "file:///etc/passwd" >]>
      <foo>&xxe;</foo>`;
    await convertXmlToPdfEnterprise(new File([new Blob([maliciousXml])], "xxe.xml", { type: "application/xml" }));
  } catch (err: any) {
    if (err.message.includes("XXE") || err.message.includes("Entity Injection") || err.message.includes("Security Violation")) {
      xxeBlocked = true;
    }
  }
  console.log(`- XML XXE Injection Blocked: ${xxeBlocked}`);

  // 6. Redaction Security Audit
  console.log("\n[C] Redaction Security Audit...");
  // Create a document with secret text in text stream
  const docToRedact = await PDFDocument.create();
  const redactPage = docToRedact.addPage([500, 500]);
  redactPage.drawText("TOP SECRET AGENT: James Bond 007", { x: 50, y: 400, size: 14 });
  redactPage.drawText("Public Notice: For authorized eyes only", { x: 50, y: 350, size: 12 });
  const redactBytes = await docToRedact.save();

  const redactionRun = await redactPdfPermanently(
    new File([new Blob([redactBytes])], "confidential.pdf", { type: "application/pdf" }),
    {
      terms: ["James Bond 007"],
      strategy: "auto",
    }
  );
  const sanitizedPdf = await PDFDocument.load(redactionRun.pdfBytes);
  const sanitizedExtracted = await extractTextFromPdfBytes(redactionRun.pdfBytes);
  const sanitizedAllText = sanitizedExtracted.join(" ");

  const secretRemovedFromText = !sanitizedAllText.includes("James Bond 007");
  const publicNoticeRemains = sanitizedAllText.includes("Public Notice");
  // Inspect raw byte stream for absence of the term
  const rawDecoded = new TextDecoder("latin1").decode(redactionRun.pdfBytes);
  const secretRemovedFromStream = !rawDecoded.includes("James Bond 007");

  console.log(`- Redacted text removed from text extraction: ${secretRemovedFromText}`);
  console.log(`- Public text preserved: ${publicNoticeRemains}`);
  console.log(`- Redacted term absent from raw PDF bytes: ${secretRemovedFromStream}`);

  // 7. Compression Inflation Guard Audit
  console.log("\n[D] Compression Inflation Guard Audit...");
  const compressDoc = await PDFDocument.create();
  const cPage = compressDoc.addPage([400, 400]);
  cPage.drawText("Small text page for inflation guard check", { x: 50, y: 300, size: 12 });
  const smallOriginalBytes = await compressDoc.save();

  const compressionResult = await compressPdfEnterprise(
    new File([new Blob([smallOriginalBytes])], "small.pdf", { type: "application/pdf" }),
    { preset: "extreme" }
  );

  const compressionNoInflation = compressionResult.compressedSize <= compressionResult.originalSize;
  const compressionTrueBytes = compressionResult.originalSize === smallOriginalBytes.length;
  console.log(`- Original bytes: ${compressionResult.originalSize}, Output bytes: ${compressionResult.compressedSize}`);
  console.log(`- No inflation guaranteed (<= original): ${compressionNoInflation}`);
  console.log(`- Reported true byte sizes accurately: ${compressionTrueBytes}`);

  console.log("\n=== Independent Audit Complete ===");
}

main().catch((err) => {
  console.error("Audit failure:", err);
  process.exit(1);
});
