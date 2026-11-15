import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export interface HtmlConversionResult {
  pdfBytes: Uint8Array;
  title: string;
  elementsProcessed: number;
  pageCount: number;
}

interface HtmlBlockItem {
  type: "heading" | "paragraph" | "list" | "blockquote" | "table";
  level?: number;
  text?: string;
  isBold?: boolean;
  isItalic?: boolean;
  listItems?: string[];
  tableRows?: string[][];
  href?: string;
}

/**
 * Enterprise Secure HTML to PDF Converter
 * 
 * Guarantees:
 * 1. Safe Non-Executing Parsing: scripts, iframes, and active content are stripped before parsing.
 * 2. Resource Restriction: forbids local file execution and external network fetches.
 * 3. Structured Document Rendering: preserves headings, paragraphs, lists, blockquotes, and tables.
 * 4. Automatic Multi-Page Pagination with margins, headers, and page numbering.
 */
export async function convertHtmlToPdfEnterprise(
  fileOrHtml: File | string,
  onProgress?: (percent: number, step?: string) => void
): Promise<HtmlConversionResult> {
  if (onProgress) onProgress(10, "Validating HTML document structure & sanitizing content...");

  let rawHtml = "";
  let docTitle = "HTML_Document";

  if (typeof fileOrHtml === "string") {
    rawHtml = fileOrHtml;
  } else {
    docTitle = fileOrHtml.name.replace(/\.[^/.]+$/, "");
    rawHtml = await fileOrHtml.text();
  }

  // Input Size Limit (20 MB)
  if (rawHtml.length > 20 * 1024 * 1024) {
    throw new Error("File Limit Exceeded: HTML documents larger than 20 MB are not supported.");
  }

  // 1. Strict Security Sanitization: Remove Active Code & Dangerous Tags
  const sanitizedHtml = rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^>]*>/gi, "")
    .replace(/\bon\w+\s*=\s*(?:["'][^"']*["']|[^\s>]+)/gi, ""); // strip event handlers

  // Extract Document Title if present in <title>
  const titleMatch = rawHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1].trim()) {
    docTitle = titleMatch[1].trim();
  }

  if (onProgress) onProgress(30, "Parsing HTML headings, lists, tables, and typography...");

  // 2. Extract Structured Elements
  const blocks: HtmlBlockItem[] = [];
  // Helper to sanitize & decode text entities
  function cleanHtmlText(txt: string): string {
    return (txt || "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&#(\d+);/g, (_, dec) => {
        const code = parseInt(dec, 10);
        return code >= 32 && code <= 65535 ? String.fromCharCode(code) : "";
      })
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
        const code = parseInt(hex, 16);
        return code >= 32 && code <= 65535 ? String.fromCharCode(code) : "";
      })
      .replace(/\s+/g, " ")
      .trim();
  }

  const isBrowser = typeof window !== "undefined" && typeof DOMParser !== "undefined";

  if (isBrowser) {
    const parser = new DOMParser();
    const dom = parser.parseFromString(sanitizedHtml, "text/html");

    const walker = dom.body || dom.documentElement;
    if (walker) {
      const elements = walker.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote, table");

      elements.forEach((el) => {
        const tag = el.tagName.toLowerCase();

        if (/^h[1-6]$/.test(tag)) {
          const level = parseInt(tag[1], 10);
          const text = cleanHtmlText(el.textContent || "");
          if (text) {
            blocks.push({ type: "heading", level, text, isBold: true });
          }
        } else if (tag === "p") {
          const text = cleanHtmlText(el.textContent || "");
          if (text) {
            blocks.push({ type: "paragraph", text });
          }
        } else if (tag === "ul" || tag === "ol") {
          const items: string[] = [];
          el.querySelectorAll("li").forEach((li, idx) => {
            const itemText = cleanHtmlText(li.textContent || "");
            if (itemText) {
              const prefix = tag === "ol" ? `${idx + 1}. ` : "• ";
              items.push(`${prefix} ${itemText}`);
            }
          });
          if (items.length > 0) {
            blocks.push({ type: "list", listItems: items });
          }
        } else if (tag === "blockquote") {
          const text = cleanHtmlText(el.textContent || "");
          if (text) {
            blocks.push({ type: "blockquote", text, isItalic: true });
          }
        } else if (tag === "table") {
          const rows: string[][] = [];
          el.querySelectorAll("tr").forEach((tr) => {
            const cells: string[] = [];
            tr.querySelectorAll("th, td").forEach((cell) => {
              cells.push(cleanHtmlText(cell.textContent || ""));
            });
            if (cells.length > 0) rows.push(cells);
          });
          if (rows.length > 0) {
            blocks.push({ type: "table", tableRows: rows });
          }
        }
      });
    }
  } else {
    // Bounded sequential fallback parser for headless Node test runners & non-DOM contexts
    const blockRegex = /<(h[1-6]|p|blockquote|ul|ol|table)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
    let match: RegExpExecArray | null;

    while ((match = blockRegex.exec(sanitizedHtml)) !== null) {
      const tagName = match[1].toLowerCase();
      const innerHtml = match[3];

      if (/^h[1-6]$/.test(tagName)) {
        const level = parseInt(tagName[1], 10);
        const text = cleanHtmlText(innerHtml.replace(/<[^>]+>/g, " "));
        if (text) blocks.push({ type: "heading", level, text, isBold: true });
      } else if (tagName === "p") {
        const text = cleanHtmlText(innerHtml.replace(/<[^>]+>/g, " "));
        if (text) blocks.push({ type: "paragraph", text });
      } else if (tagName === "blockquote") {
        const text = cleanHtmlText(innerHtml.replace(/<[^>]+>/g, " "));
        if (text) blocks.push({ type: "blockquote", text, isItalic: true });
      } else if (tagName === "ul" || tagName === "ol") {
        const items: string[] = [];
        const liMatches = innerHtml.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi);
        let idx = 1;
        for (const li of liMatches) {
          const itemText = cleanHtmlText(li[1].replace(/<[^>]+>/g, " "));
          if (itemText) {
            const prefix = tagName === "ol" ? `${idx++}. ` : "• ";
            items.push(`${prefix}${itemText}`);
          }
        }
        if (items.length > 0) {
          blocks.push({ type: "list", listItems: items });
        }
      } else if (tagName === "table") {
        const rows: string[][] = [];
        const trMatches = innerHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi);
        for (const tr of trMatches) {
          const cells: string[] = [];
          const cellMatches = tr[1].matchAll(/<(th|td)\b[^>]*>([\s\S]*?)<\/\1>/gi);
          for (const cell of cellMatches) {
            cells.push(cleanHtmlText(cell[2].replace(/<[^>]+>/g, " ")));
          }
          if (cells.length > 0) rows.push(cells);
        }
        if (rows.length > 0) {
          blocks.push({ type: "table", tableRows: rows });
        }
      }
    }
  }

  // Fallback for documents with non-standard body tags
  if (blocks.length === 0) {
    const rawClean = sanitizedHtml
      .replace(/<[^>]+>/g, "\n")
      .replace(/\n\s*\n/g, "\n\n")
      .trim();

    if (!rawClean) {
      throw new Error(`The HTML document contains no renderable text content.`);
    }

    rawClean.split("\n\n").forEach((part) => {
      const trimmedPart = part.trim();
      if (trimmedPart) blocks.push({ type: "paragraph", text: trimmedPart });
    });
  }

  if (onProgress) onProgress(60, "Generating styled multi-page PDF document...");

  // 3. Build Formatted PDF Document
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  pdfDoc.setTitle(docTitle);
  pdfDoc.setProducer("PDFSun Enterprise HTML Engine");

  const pageWidth = 595;
  const pageHeight = 842;
  const marginX = 54;
  const marginTop = 54;
  const marginBottom = 54;
  const contentWidth = pageWidth - marginX * 2;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let cursorY = pageHeight - marginTop;
  let pageNumber = 1;

  function ensurePageSpace(neededHeight: number) {
    if (cursorY - neededHeight < marginBottom) {
      // Add page footer
      currentPage.drawText(`Page ${pageNumber}`, {
        x: pageWidth / 2 - 20,
        y: 28,
        size: 9,
        font: fontRegular,
        color: rgb(0.5, 0.5, 0.5),
      });

      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      pageNumber++;
      cursorY = pageHeight - marginTop;

      // Add page header
      currentPage.drawText(docTitle.slice(0, 45), {
        x: marginX,
        y: pageHeight - 32,
        size: 8,
        font: fontOblique,
        color: rgb(0.6, 0.6, 0.6),
      });
    }
  }

  function wrapText(text: string, font: any, fontSize: number, maxW: number): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let currentLine = "";

    for (const w of words) {
      const testLine = currentLine ? `${currentLine} ${w}` : w;
      let testWidth = 0;
      try {
        testWidth = font.widthOfTextAtSize(testLine, fontSize);
      } catch {
        testWidth = testLine.length * (fontSize * 0.55);
      }

      if (testWidth > maxW && currentLine) {
        lines.push(currentLine);
        currentLine = w;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  // Draw Document Title
  currentPage.drawText(docTitle, {
    x: marginX,
    y: cursorY,
    size: 20,
    font: fontBold,
    color: rgb(0.12, 0.18, 0.35),
  });
  cursorY -= 28;

  // Render Elements
  for (let idx = 0; idx < blocks.length; idx++) {
    const block = blocks[idx];

    if (block.type === "heading") {
      const headingSizes: Record<number, number> = { 1: 16, 2: 14, 3: 12, 4: 11, 5: 10, 6: 9.5 };
      const fontSize = headingSizes[block.level || 2] || 13;
      const lineHeight = fontSize * 1.4;

      ensurePageSpace(lineHeight + 12);
      cursorY -= 6;

      const lines = wrapText(block.text || "", fontBold, fontSize, contentWidth);
      for (const line of lines) {
        ensurePageSpace(lineHeight);
        currentPage.drawText(line, {
          x: marginX,
          y: cursorY,
          size: fontSize,
          font: fontBold,
          color: rgb(0.15, 0.22, 0.4),
        });
        cursorY -= lineHeight;
      }
      cursorY -= 4;

    } else if (block.type === "paragraph") {
      const fontSize = 10;
      const lineHeight = fontSize * 1.45;
      const lines = wrapText(block.text || "", fontRegular, fontSize, contentWidth);

      for (const line of lines) {
        ensurePageSpace(lineHeight);
        currentPage.drawText(line, {
          x: marginX,
          y: cursorY,
          size: fontSize,
          font: fontRegular,
          color: rgb(0.15, 0.15, 0.15),
        });
        cursorY -= lineHeight;
      }
      cursorY -= 6; // Paragraph spacing

    } else if (block.type === "list" && block.listItems) {
      const fontSize = 9.5;
      const lineHeight = fontSize * 1.45;

      for (const item of block.listItems) {
        const lines = wrapText(item, fontRegular, fontSize, contentWidth - 12);
        for (let l = 0; l < lines.length; l++) {
          ensurePageSpace(lineHeight);
          currentPage.drawText(lines[l], {
            x: marginX + 10,
            y: cursorY,
            size: fontSize,
            font: fontRegular,
            color: rgb(0.15, 0.15, 0.15),
          });
          cursorY -= lineHeight;
        }
      }
      cursorY -= 6;

    } else if (block.type === "blockquote") {
      const fontSize = 9.5;
      const lineHeight = fontSize * 1.45;
      const lines = wrapText(block.text || "", fontOblique, fontSize, contentWidth - 20);

      const blockHeight = lines.length * lineHeight;
      ensurePageSpace(blockHeight);

      // Draw quote vertical bar
      currentPage.drawLine({
        start: { x: marginX + 4, y: cursorY + 2 },
        end: { x: marginX + 4, y: cursorY - blockHeight },
        thickness: 2,
        color: rgb(0.2, 0.5, 0.9),
      });

      for (const line of lines) {
        ensurePageSpace(lineHeight);
        currentPage.drawText(line, {
          x: marginX + 14,
          y: cursorY,
          size: fontSize,
          font: fontOblique,
          color: rgb(0.25, 0.3, 0.4),
        });
        cursorY -= lineHeight;
      }
      cursorY -= 6;

    } else if (block.type === "table" && block.tableRows) {
      const fontSize = 8.5;
      const rowHeight = 18;
      const colCount = Math.max(...block.tableRows.map((r) => r.length), 1);
      const colWidth = contentWidth / colCount;

      for (let rIdx = 0; rIdx < block.tableRows.length; rIdx++) {
        const row = block.tableRows[rIdx];
        ensurePageSpace(rowHeight);

        const isHeader = rIdx === 0;

        // Draw row background for header
        if (isHeader) {
          currentPage.drawRectangle({
            x: marginX,
            y: cursorY - 3,
            width: contentWidth,
            height: rowHeight,
            color: rgb(0.92, 0.95, 0.98),
          });
        }

        for (let cIdx = 0; cIdx < row.length; cIdx++) {
          const cellText = (row[cIdx] || "").slice(0, 24);
          currentPage.drawText(cellText, {
            x: marginX + cIdx * colWidth + 4,
            y: cursorY + 2,
            size: fontSize,
            font: isHeader ? fontBold : fontRegular,
            color: isHeader ? rgb(0.12, 0.2, 0.4) : rgb(0.2, 0.2, 0.2),
          });
        }

        // Draw horizontal row border
        currentPage.drawLine({
          start: { x: marginX, y: cursorY - 3 },
          end: { x: marginX + contentWidth, y: cursorY - 3 },
          thickness: 0.5,
          color: rgb(0.8, 0.85, 0.9),
        });

        cursorY -= rowHeight;
      }
      cursorY -= 8;
    }

    if (onProgress && idx % 15 === 0) {
      onProgress(
        60 + Math.round(((idx + 1) / blocks.length) * 35),
        `Rendered element ${idx + 1} of ${blocks.length}...`
      );
    }
  }

  // Final Page Footer
  currentPage.drawText(`Page ${pageNumber}`, {
    x: pageWidth / 2 - 20,
    y: 28,
    size: 9,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });

  if (onProgress) onProgress(98, "Finalizing HTML to PDF compilation...");
  const pdfBytes = await pdfDoc.save();
  if (onProgress) onProgress(100, "HTML document converted to PDF successfully!");

  return {
    pdfBytes,
    title: docTitle,
    elementsProcessed: blocks.length,
    pageCount: pdfDoc.getPageCount(),
  };
}
