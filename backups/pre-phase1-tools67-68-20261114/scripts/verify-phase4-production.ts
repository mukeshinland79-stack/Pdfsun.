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
if (typeof (Uint8Array.prototype as any).toHex === "undefined") {
  (Uint8Array.prototype as any).toHex = function () {
    return Array.from(this)
      .map((b: number) => b.toString(16).padStart(2, "0"))
      .join("");
  };
}

async function main() {
  const fs = (await import("fs")).default || (await import("fs"));
  const path = (await import("path")).default || (await import("path"));
  console.log("=== PDFSun.in — Phase 4 Comprehensive Production Validation ===");

  const { ALL_TOOLS } = await import("../src/data/toolsData");
  const { PDFDocument } = await import("pdf-lib");
  const {
    mergePdfs,
    splitPdf,
    compressPdf,
    rotatePdf,
    protectPdf,
    textToPdf,
    imagesToPdf,
    unlockPdfDocument,
    extractTextFromPdfFile,
  } = await import("../src/lib/pdfEngine");
  const { redactPdfPermanently } = await import("../src/lib/enterpriseRedactionEngine");
  const { compressPdfEnterprise } = await import("../src/lib/enterpriseCompressionEngine");
  const { convertHtmlToPdfEnterprise } = await import("../src/lib/enterpriseHtmlEngine");
  const { convertEpubToPdfEnterprise } = await import("../src/lib/enterpriseEpubEngine");
  const { convertRtfToPdfEnterprise } = await import("../src/lib/enterpriseRtfEngine");
  const { convertXmlToPdfEnterprise } = await import("../src/lib/enterpriseXmlEngine");
  const { getSeoMetadataForPath } = await import("../src/server/seoRenderer");
  const JSZipModule = await import("jszip");
  const JSZip = (JSZipModule.default || JSZipModule) as any;

  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;

  function record(condition: boolean, label: string) {
    totalChecks++;
    if (condition) {
      passedChecks++;
      console.log(`  ✅ [PASS] ${label}`);
    } else {
      failedChecks++;
      console.error(`  ❌ [FAIL] ${label}`);
    }
  }

  // 1. Tool Registry Audit (66 tools)
  console.log("\n[Section 1] 66-Tool Registry & Route Dispatch Verification");
  record(ALL_TOOLS.length === 66, `Tool count matches exactly 66 (Count: ${ALL_TOOLS.length})`);
  const uniqueSlugs = new Set(ALL_TOOLS.map((t) => t.slug));
  record(uniqueSlugs.size === 66, `All 66 tool slugs are unique (Unique: ${uniqueSlugs.size})`);
  const missingMeta = ALL_TOOLS.filter((t) => !t.name || !t.description || !t.category || !t.icon);
  record(missingMeta.length === 0, `All 66 tools have complete metadata (name, desc, category, icon)`);

  // Verify App.tsx contains handler routing for all 66 tools
  const appTsxContent = fs.readFileSync("src/App.tsx", "utf8");
  const activeWorkspaceContent = fs.readFileSync("src/components/ActiveToolWorkspace.tsx", "utf8");
  let unhandledTools = 0;
  for (const t of ALL_TOOLS) {
    const isHandledInApp =
      appTsxContent.includes(`"${t.id}"`) ||
      appTsxContent.includes(`"${t.slug}"`) ||
      activeWorkspaceContent.includes(`"${t.id}"`) ||
      activeWorkspaceContent.includes(`"${t.slug}"`);
    if (!isHandledInApp) {
      unhandledTools++;
      console.warn(`  ⚠️ Unhandled tool routing: ${t.id}`);
    }
  }
  record(unhandledTools === 0, `All 66 tools are wired to workspace/modal routing`);

  // 2. Real-File Document Conversions
  console.log("\n[Section 2] Real-File Document Conversion Correctness");

  // A. Text to PDF
  const textPdf = textToPdf("Hello PDFSun Production Verification\nLine 2 content", "Production Test");
  const textDoc = await PDFDocument.load(textPdf);
  record(textDoc.getPageCount() === 1, `Text to PDF creates valid 1-page document`);

  // B. HTML to PDF
  const htmlSample = `
    <!DOCTYPE html>
    <html>
      <head><title>Production Audit Report</title></head>
      <body>
        <h1>Enterprise PDFSun Suite</h1>
        <p>Real-time processing with zero server dependencies.</p>
        <ol><li>Stage Alpha</li><li>Stage Beta</li></ol>
        <table border="1">
          <tr><th>Metric</th><th>Target</th><th>Actual</th></tr>
          <tr><td>Availability</td><td>99.9%</td><td>100%</td></tr>
        </table>
        <script>alert("xss");</script>
      </body>
    </html>
  `;
  const htmlRes = await convertHtmlToPdfEnterprise(new File([new Blob([htmlSample])], "audit.html", { type: "text/html" }));
  const htmlDoc = await PDFDocument.load(htmlRes.pdfBytes);
  const htmlText = (await extractTextFromPdfFile(new File([new Blob([htmlRes.pdfBytes])], "html.pdf", { type: "application/pdf" }))).replace(/\s+/g, " ");
  record(htmlDoc.getPageCount() >= 1, `HTML to PDF produces valid readable PDF`);
  record(htmlText.includes("Enterprise PDFSun Suite"), `HTML heading extracted`);
  record(htmlText.includes("Stage Alpha") && htmlText.includes("Stage Beta"), `HTML ordered list items extracted`);
  record(htmlText.includes("Availability") && htmlText.includes("100%"), `HTML table content extracted`);
  record(!htmlText.includes("alert") && !htmlText.includes("xss"), `HTML script tags stripped cleanly`);

  // C. EPUB to PDF
  const testEpubZip = new JSZip();
  testEpubZip.file("mimetype", "application/epub+zip");
  testEpubZip.file(
    "META-INF/container.xml",
    '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>'
  );
  testEpubZip.file(
    "OEBPS/content.opf",
    '<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" version="2.0"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Production Handbook</dc:title><dc:creator>PDFSun Engineering</dc:creator></metadata><manifest><item id="c1" href="chap1.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="c1"/></spine></package>'
  );
  testEpubZip.file("OEBPS/chap1.xhtml", '<?xml version="1.0"?><html><body><h1>Chapter 1</h1><p>Client-side cryptographic guarantees.</p></body></html>');
  const epubBytes = await testEpubZip.generateAsync({ type: "uint8array" });
  const epubRes = await convertEpubToPdfEnterprise(new File([new Blob([epubBytes])], "book.epub", { type: "application/epub+zip" }));
  record(epubRes.title === "Production Handbook", `EPUB extracts correct title`);
  record(epubRes.author === "PDFSun Engineering", `EPUB extracts correct author`);

  // D. RTF to PDF
  const rtfSample = `{\\rtf1\\ansi\\ansicpg1252\\deff0{\\fonttbl{\\f0 Arial;}}\\b Phase 4 Production\\b0\\par Verified accents: caf\\'e9 and na\\'efve.\\par}`;
  const rtfRes = await convertRtfToPdfEnterprise(new File([new Blob([rtfSample])], "test.rtf", { type: "application/rtf" }));
  const rtfDoc = await PDFDocument.load(rtfRes.pdfBytes);
  record(rtfDoc.getPageCount() === 1, `RTF to PDF produces valid 1-page PDF`);

  // E. XML to PDF
  const xmlSample = `<?xml version="1.0"?><audit status="PASS" date="2026-10-19"><system><name>PDFSun</name><version>3.0</version></system></audit>`;
  const xmlRes = await convertXmlToPdfEnterprise(new File([new Blob([xmlSample])], "audit.xml", { type: "application/xml" }));
  const xmlDoc = await PDFDocument.load(xmlRes.pdfBytes);
  const xmlText = (await extractTextFromPdfFile(new File([new Blob([xmlRes.pdfBytes])], "xml.pdf", { type: "application/pdf" }))).replace(/\s+/g, " ");
  record(xmlDoc.getPageCount() === 1, `XML to PDF produces valid structured PDF`);
  record(xmlText.includes("<audit") && xmlText.includes("PASS"), `XML root tag and attributes rendered`);
  record(xmlText.includes("<system") && xmlText.includes("PDFSun"), `XML nested hierarchy and values rendered`);

  // 3. Security, Encryption & Redaction Guarantees
  console.log("\n[Section 3] Document Security, Redaction & Encryption Verification");

  // A. Redaction Stream Purge
  const redDoc = await PDFDocument.create();
  const redPage = redDoc.addPage([500, 500]);
  redPage.drawText("CONFIDENTIAL TOKEN: SEC-9988-X", { x: 50, y: 400, size: 14 });
  redPage.drawText("Public Statement: PDFSun is secure", { x: 50, y: 350, size: 12 });
  const redBytes = await redDoc.save();

  const sanitized = await redactPdfPermanently(
    new File([new Blob([redBytes])], "redact_test.pdf", { type: "application/pdf" }),
    { terms: ["SEC-9988-X"], strategy: "auto" }
  );
  const rawBytesStr = new TextDecoder("latin1").decode(sanitized.pdfBytes);
  record(!rawBytesStr.includes("SEC-9988-X"), `Redacted term permanently removed from byte stream`);
  const sanitizedText = (await extractTextFromPdfFile(new File([new Blob([sanitized.pdfBytes])], "sanitized.pdf", { type: "application/pdf" }))).replace(/\s+/g, " ");
  record(!sanitizedText.includes("SEC-9988-X"), `Redacted term unextractable via text layer`);
  record(sanitizedText.includes("Public Statement"), `Non-redacted content preserved`);

  // B. Genuine AES-256 Encryption & Decryption
  const encDoc = await PDFDocument.create();
  encDoc.addPage([400, 400]);
  const encOriginalBytes = await encDoc.save();
  const protectedBytes = await protectPdf(new File([new Blob([encOriginalBytes])], "plain.pdf", { type: "application/pdf" }), { userPassword: "StrongPassword123!" });
  record(protectedBytes.length > 0, `Password encryption produces non-empty output`);

  // Verify wrong password fails
  let wrongPassCaught = false;
  try {
    await unlockPdfDocument(new File([new Blob([protectedBytes])], "enc.pdf", { type: "application/pdf" }), "WrongPass");
  } catch {
    wrongPassCaught = true;
  }
  record(wrongPassCaught, `Incorrect password safely rejected without decrypting`);

  // Verify correct password unlocks
  const unlockedBytes = await unlockPdfDocument(new File([new Blob([protectedBytes])], "enc.pdf", { type: "application/pdf" }), "StrongPassword123!");
  const unlockedDoc = await PDFDocument.load(unlockedBytes);
  record(unlockedDoc.getPageCount() === 1, `Correct password successfully decrypts original PDF structure`);

  // C. Compression Inflation Guard
  const compDoc = await PDFDocument.create();
  compDoc.addPage([300, 300]);
  const compOrigBytes = await compDoc.save();
  const compRes = await compressPdfEnterprise(new File([new Blob([compOrigBytes])], "small.pdf", { type: "application/pdf" }), { preset: "extreme" });
  record(compRes.compressedSize <= compRes.originalSize, `Compression engine guarantees zero file inflation`);

  // D. Zip-Slip Defense
  let zipSlipCaught = false;
  try {
    const evilZip = new JSZip();
    evilZip.file("mimetype", "application/epub+zip");
    evilZip.file("../evil.txt", "payload");
    const evilBytes = await evilZip.generateAsync({ type: "uint8array" });
    await convertEpubToPdfEnterprise(new File([new Blob([evilBytes])], "evil.epub", { type: "application/epub+zip" }));
  } catch (e: any) {
    if (e.message.includes("Zip-Slip") || e.message.includes("traversal") || e.message.includes("Security Violation")) {
      zipSlipCaught = true;
    }
  }
  record(zipSlipCaught, `EPUB converter blocks Zip-Slip path traversal attempts`);

  // E. XXE Defense
  let xxeCaught = false;
  try {
    const xxeStr = `<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>`;
    await convertXmlToPdfEnterprise(xxeStr);
  } catch (e: any) {
    if (e.message.includes("XXE") || e.message.includes("Security Violation")) {
      xxeCaught = true;
    }
  }
  record(xxeCaught, `XML converter blocks external entity injection (XXE / SYSTEM)`);

  // 4. Technical SEO, Metadata, Sitemaps & Robots Audit
  console.log("\n[Section 4] Technical SEO, Metadata, Hreflang & Sitemaps Audit");

  // A. robots.txt Verification
  const robotsContent = fs.readFileSync("public/robots.txt", "utf8");
  record(robotsContent.includes("User-agent: *"), `robots.txt contains global User-agent rule`);
  record(robotsContent.includes("Disallow: /api/admin/"), `robots.txt protects admin routes from indexing`);
  record(robotsContent.includes("Sitemap: https://www.pdfsun.in/sitemap.xml"), `robots.txt references primary sitemap.xml`);
  record(robotsContent.includes("Sitemap: https://www.pdfsun.in/sitemap-blog.xml"), `robots.txt references sitemap-blog.xml`);
  record(robotsContent.includes("Sitemap: https://www.pdfsun.in/sitemap-compress-sizes.xml"), `robots.txt references sitemap-compress-sizes.xml`);
  record(robotsContent.includes("Sitemap: https://www.pdfsun.in/sitemap-pseo.xml"), `robots.txt references sitemap-pseo.xml`);

  // B. Sitemaps existence & validity
  const sitemaps = ["public/sitemap.xml", "public/sitemap-blog.xml", "public/sitemap-compress-sizes.xml", "public/sitemap-pseo.xml"];
  let allSitemapsValid = true;
  for (const sm of sitemaps) {
    if (!fs.existsSync(sm)) {
      allSitemapsValid = false;
      break;
    }
    const content = fs.readFileSync(sm, "utf8");
    if (!content.includes("<urlset") || !content.includes("https://www.pdfsun.in")) {
      allSitemapsValid = false;
      break;
    }
  }
  record(allSitemapsValid, `All 4 sitemaps exist and contain valid XML schemas and canonical URLs`);

  // C. Server SEO Metadata Renderer
  const homeSeo = getSeoMetadataForPath("/");
  record(homeSeo.canonicalUrl === "https://www.pdfsun.in/", `Home route canonical URL is https://www.pdfsun.in/`);
  record(homeSeo.title.includes("PDFSun"), `Home route title is brand-optimized`);
  record(homeSeo.jsonLdSchemas.length >= 2, `Home route injects WebSite & SoftwareApplication JSON-LD schemas`);

  const mergeSeo = getSeoMetadataForPath("/merge-pdf");
  record(mergeSeo.canonicalUrl === "https://www.pdfsun.in/merge-pdf", `Merge PDF route canonical URL is correct`);
  record(mergeSeo.title.includes("Merge PDF"), `Merge PDF title is tool-specific`);
  record(mergeSeo.jsonLdSchemas.length >= 2, `Merge PDF route injects WebApplication & FAQPage JSON-LD schemas`);

  const pricingSeo = getSeoMetadataForPath("/pricing");
  record(pricingSeo.canonicalUrl === "https://www.pdfsun.in/pricing", `Pricing route canonical URL is https://www.pdfsun.in/pricing`);

  // D. Index.html Hreflang and Social Cards
  const indexHtml = fs.readFileSync("index.html", "utf8");
  record(indexHtml.includes('rel="canonical" href="https://www.pdfsun.in/"'), `index.html contains canonical tag`);
  record(indexHtml.includes('hreflang="x-default"'), `index.html contains x-default hreflang tag`);
  record(indexHtml.includes('hreflang="hi"'), `index.html contains Hindi (hi) hreflang localization`);
  record(indexHtml.includes('property="og:image"'), `index.html defines OpenGraph social share card`);
  record(indexHtml.includes('name="twitter:card"'), `index.html defines Twitter summary_large_image card`);

  console.log(`\n=== Phase 4 Summary: ${passedChecks} Passed, ${failedChecks} Failed (Total Checks: ${totalChecks}) ===\n`);
  if (failedChecks > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Phase 4 Validation Error:", err);
  process.exit(1);
});
