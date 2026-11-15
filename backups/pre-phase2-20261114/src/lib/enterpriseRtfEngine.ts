import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export interface RtfConversionResult {
  pdfBytes: Uint8Array;
  plainText: string;
  paragraphCount: number;
  pageCount: number;
}

interface RtfParagraph {
  text: string;
  isBold?: boolean;
  isItalic?: boolean;
  align?: "left" | "center" | "right";
  fontSize?: number;
}

/**
 * Enterprise Stateful RTF Lexical Parser & PDF Converter
 * 
 * Solves the catastrophic 100% text erasure bug by implementing a stateful group stack
 * and control word tokenizer rather than global regex stripping.
 */
export async function convertRtfToPdfEnterprise(
  fileOrText: File | string,
  onProgress?: (percent: number, step?: string) => void
): Promise<RtfConversionResult> {
  if (onProgress) onProgress(10, "Validating Rich Text Format (.rtf) syntax...");

  let rtfContent = "";
  let docName = "Document";

  if (typeof fileOrText === "string") {
    rtfContent = fileOrText;
  } else {
    docName = fileOrText.name.replace(/\.[^/.]+$/, "");
    rtfContent = await fileOrText.text();
  }

  // 1. Validation: RTF Signature Check
  const trimmed = rtfContent.trim();
  if (!trimmed.startsWith("{\\rtf")) {
    throw new Error("Invalid RTF Format: File does not begin with standard '{\\rtf' header.");
  }

  if (onProgress) onProgress(25, "Tokenizing RTF control words and Unicode glyphs...");

  // 2. Stateful Group Parser
  const IGNORED_DESTINATIONS = new Set([
    "fonttbl", "colortbl", "stylesheet", "info", "pict", "header", "footer",
    "generator", "operator", "title", "subject", "author", "creatim", "revtim",
    "nonshppict", "xmlopen"
  ]);

  interface GroupState {
    isDestination: boolean;
    uc: number; // Unicode fallback count (default 1)
    isBold: boolean;
    isItalic: boolean;
    align: "left" | "center" | "right";
    fontSize: number;
  }

  const groupStack: GroupState[] = [];
  let currentState: GroupState = {
    isDestination: false,
    uc: 1,
    isBold: false,
    isItalic: false,
    align: "left",
    fontSize: 11,
  };

  const paragraphs: RtfParagraph[] = [];
  let currentParaText = "";

  function flushParagraph() {
    const text = currentParaText.trim();
    if (text.length > 0) {
      paragraphs.push({
        text,
        isBold: currentState.isBold,
        isItalic: currentState.isItalic,
        align: currentState.align,
        fontSize: currentState.fontSize,
      });
    }
    currentParaText = "";
  }

  let i = 0;
  const len = rtfContent.length;
  const MAX_GROUP_DEPTH = 64;

  while (i < len) {
    const ch = rtfContent[i];

    if (ch === "{") {
      if (groupStack.length > MAX_GROUP_DEPTH) {
        throw new Error("Malformed RTF: Group nesting depth exceeds safety limit.");
      }
      groupStack.push({ ...currentState });
      i++;
    } else if (ch === "}") {
      if (groupStack.length > 0) {
        currentState = groupStack.pop()!;
      }
      i++;
    } else if (ch === "\\") {
      i++;
      if (i >= len) break;
      const nextChar = rtfContent[i];

      if (nextChar === "{" || nextChar === "}" || nextChar === "\\") {
        if (!currentState.isDestination) {
          currentParaText += nextChar;
        }
        i++;
      } else if (nextChar === "*") {
        // Ignored optional destination
        currentState.isDestination = true;
        i++;
      } else if (nextChar === "'") {
        // Hexadecimal character escape \'hh
        i++;
        const hex = rtfContent.slice(i, i + 2);
        i += 2;
        if (!currentState.isDestination) {
          const code = parseInt(hex, 16);
          if (!isNaN(code)) {
            // Windows-1252 / ISO-8859-1 code mapping
            currentParaText += String.fromCharCode(code);
          }
        }
      } else {
        // Read control word: letters followed by optional signed integer
        const match = rtfContent.slice(i).match(/^([a-zA-Z]+)(-?[0-9]+)? ?/);
        if (match) {
          const word = match[1];
          const param = match[2] !== undefined ? parseInt(match[2], 10) : null;
          i += match[0].length;

          if (IGNORED_DESTINATIONS.has(word)) {
            currentState.isDestination = true;
          } else if (word === "uc" && param !== null) {
            currentState.uc = Math.max(0, param);
          } else if (word === "u" && param !== null) {
            // Unicode Character \uN
            if (!currentState.isDestination) {
              const uCode = param < 0 ? param + 65536 : param;
              currentParaText += String.fromCharCode(uCode);

              // Skip uc fallback characters
              for (let k = 0; k < currentState.uc && i < len; k++) {
                if (rtfContent[i] === "{" || rtfContent[i] === "}") break;
                if (rtfContent[i] === "\\") {
                  if (rtfContent[i + 1] === "'") i += 4;
                  else break;
                } else {
                  i++;
                }
              }
            }
          } else if (word === "par") {
            if (!currentState.isDestination) {
              flushParagraph();
            }
          } else if (word === "line") {
            if (!currentState.isDestination) {
              currentParaText += "\n";
            }
          } else if (word === "tab") {
            if (!currentState.isDestination) {
              currentParaText += "    ";
            }
          } else if (word === "b") {
            currentState.isBold = param === null || param === 1;
          } else if (word === "i") {
            currentState.isItalic = param === null || param === 1;
          } else if (word === "qc") {
            currentState.align = "center";
          } else if (word === "qr") {
            currentState.align = "right";
          } else if (word === "ql") {
            currentState.align = "left";
          } else if (word === "fs" && param !== null) {
            // Half-points to points (e.g. \fs24 = 12pt)
            currentState.fontSize = Math.max(8, Math.round(param / 2));
          }
        } else {
          i++;
        }
      }
    } else {
      if (!currentState.isDestination && ch !== "\r" && ch !== "\n") {
        currentParaText += ch;
      }
      i++;
    }
  }

  flushParagraph();

  if (paragraphs.length === 0) {
    throw new Error(`The RTF document "${docName}" contains no readable text content.`);
  }

  if (onProgress) onProgress(60, "Generating styled multi-page PDF document...");

  // 3. Build Formatted PDF Document
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const fontBoldOblique = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

  pdfDoc.setTitle(docName);
  pdfDoc.setProducer("PDFSun Enterprise RTF Engine");

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

  // Draw Document Header
  currentPage.drawText(docName, {
    x: marginX,
    y: cursorY,
    size: 16,
    font: fontBold,
    color: rgb(0.12, 0.18, 0.35),
  });
  cursorY -= 26;

  // Render Paragraphs
  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const p = paragraphs[pIdx];
    const fontSize = p.fontSize || 11;
    const lineHeight = fontSize * 1.45;

    let font = fontRegular;
    if (p.isBold && p.isItalic) font = fontBoldOblique;
    else if (p.isBold) font = fontBold;
    else if (p.isItalic) font = fontOblique;

    const lines = wrapText(p.text, font, fontSize, contentWidth);
    for (const line of lines) {
      ensurePageSpace(lineHeight);

      let lineX = marginX;
      if (p.align === "center") {
        try {
          const lw = font.widthOfTextAtSize(line, fontSize);
          lineX = marginX + Math.max(0, (contentWidth - lw) / 2);
        } catch {}
      } else if (p.align === "right") {
        try {
          const lw = font.widthOfTextAtSize(line, fontSize);
          lineX = marginX + Math.max(0, contentWidth - lw);
        } catch {}
      }

      // Safe character fallback
      try {
        currentPage.drawText(line, {
          x: lineX,
          y: cursorY,
          size: fontSize,
          font,
          color: rgb(0.15, 0.15, 0.15),
        });
      } catch {
        // Fallback for non-Latin-1 characters in standard Helvetica
        const sanitizedLine = line.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
        currentPage.drawText(sanitizedLine, {
          x: lineX,
          y: cursorY,
          size: fontSize,
          font,
          color: rgb(0.15, 0.15, 0.15),
        });
      }

      cursorY -= lineHeight;
    }
    cursorY -= 8; // Paragraph spacing

    if (onProgress && pIdx % 10 === 0) {
      onProgress(
        60 + Math.round(((pIdx + 1) / paragraphs.length) * 35),
        `Rendered paragraph ${pIdx + 1} of ${paragraphs.length}...`
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

  if (onProgress) onProgress(98, "Finalizing RTF to PDF compilation...");
  const pdfBytes = await pdfDoc.save();
  if (onProgress) onProgress(100, "Rich Text Format converted to PDF successfully!");

  return {
    pdfBytes,
    plainText: paragraphs.map((p) => p.text).join("\n\n"),
    paragraphCount: paragraphs.length,
    pageCount: pdfDoc.getPageCount(),
  };
}
