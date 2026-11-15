import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export interface XmlConversionResult {
  pdfBytes: Uint8Array;
  rootElement: string;
  elementCount: number;
  attributeCount: number;
  pageCount: number;
}

interface XmlNodeItem {
  depth: number;
  tagName: string;
  attributes: Array<{ name: string; value: string }>;
  textContent: string;
}

/**
 * Enterprise Secure XML to PDF Engine
 * 
 * Guarantees:
 * 1. Strict XXE & DTD Protection: rejects external entity declarations, SYSTEM and PUBLIC entity identifiers.
 * 2. Syntax Validation: detects parser errors with line/column pointers.
 * 3. Structured Tree Layout: renders XML hierarchy with tag highlighting, attribute key-values, and formatted text nodes.
 * 4. Safety Limits: max file size (25MB), max tree depth (40), max elements (5000).
 */
export async function convertXmlToPdfEnterprise(
  fileOrText: File | string,
  onProgress?: (percent: number, step?: string) => void
): Promise<XmlConversionResult> {
  if (onProgress) onProgress(10, "Validating XML syntax and entity security...");

  let xmlString = "";
  let docName = "XML_Report";

  if (typeof fileOrText === "string") {
    xmlString = fileOrText;
  } else {
    docName = fileOrText.name.replace(/\.[^/.]+$/, "");
    xmlString = await fileOrText.text();
  }

  // 1. Input Size Limit (25 MB)
  if (xmlString.length > 25 * 1024 * 1024) {
    throw new Error("File Limit Exceeded: XML files larger than 25 MB are not supported.");
  }

  // 2. Strict XXE / DTD Injection Defense
  if (
    /<!ENTITY\s+/i.test(xmlString) ||
    /<!DOCTYPE[^>]*\bSYSTEM\b/i.test(xmlString) ||
    /<!DOCTYPE[^>]*\bPUBLIC\b/i.test(xmlString)
  ) {
    throw new Error(
      "Security Violation (XXE Rejected): External XML entity declarations (SYSTEM/PUBLIC entities) are prohibited for document security."
    );
  }

  if (onProgress) onProgress(25, "Parsing XML hierarchical structure...");

  // 3. Safe Namespace-Aware Non-Executing DOM Parsing
  let parsedDoc: Document;
  const isBrowser = typeof window !== "undefined" && typeof DOMParser !== "undefined";

  if (isBrowser) {
    const parser = new DOMParser();
    parsedDoc = parser.parseFromString(xmlString, "application/xml");

    const parserError = parsedDoc.querySelector("parsererror");
    if (parserError) {
      const errText = parserError.textContent || "Syntax error in XML markup.";
      throw new Error(`Malformed XML: ${errText.slice(0, 160)}`);
    }
  } else {
    // Headless / Node test environment parsing simulation
    if (!xmlString.trim().startsWith("<") || !xmlString.includes(">")) {
      throw new Error("Malformed XML: Input does not contain valid XML tag delimiters.");
    }
  }

  if (onProgress) onProgress(45, "Traversing XML elements and attributes...");

  // 4. Flatten XML Hierarchy into Print-Ready Nodes
  const nodes: XmlNodeItem[] = [];
  let totalElements = 0;
  let totalAttributes = 0;
  let rootTagName = "root";

  if (isBrowser && parsedDoc!.documentElement) {
    rootTagName = parsedDoc!.documentElement.nodeName;

    function traverse(element: Element, depth: number) {
      if (depth > 40 || totalElements > 5000) return;
      totalElements++;

      const attrs: Array<{ name: string; value: string }> = [];
      if (element.attributes) {
        for (let a = 0; a < element.attributes.length; a++) {
          const attr = element.attributes[a];
          attrs.push({ name: attr.name, value: attr.value });
          totalAttributes++;
        }
      }

      // Collect immediate direct text content
      let directText = "";
      for (let c = 0; c < element.childNodes.length; c++) {
        const child = element.childNodes[c];
        if (child.nodeType === 3) {
          // Text node
          const t = child.textContent?.trim() || "";
          if (t) directText += (directText ? " " : "") + t;
        }
      }

      nodes.push({
        depth,
        tagName: element.nodeName,
        attributes: attrs,
        textContent: directText,
      });

      // Recurse children
      for (let ch = 0; ch < element.children.length; ch++) {
        traverse(element.children[ch], depth + 1);
      }
    }

    traverse(parsedDoc!.documentElement, 0);
  } else {
    // Bounded sequential stack-based XML tokenizer & parser for headless Node & non-DOM environments
    const cleanXml = xmlString
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<\?[\s\S]*?\?>/g, "")
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");

    const stack: XmlNodeItem[] = [];
    const tagRegex = /<(\/)?([a-zA-Z0-9_:-]+)((?:\s+[^=>\s]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|([^<]+)/g;
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(cleanXml)) !== null) {
      const isClose = !!match[1];
      const tagName = match[2];
      const attrString = match[3];
      const isSelfClose = !!match[4];
      const textData = match[5];

      if (textData) {
        const trimmed = textData.trim();
        if (trimmed && stack.length > 0) {
          const current = stack[stack.length - 1];
          current.textContent = (current.textContent ? current.textContent + " " : "") + trimmed;
        }
      } else if (isClose) {
        if (stack.length === 0) {
          throw new Error(`Malformed XML: unexpected closing tag </${tagName}> without opening tag.`);
        }
        const top = stack.pop()!;
        if (top.tagName.toLowerCase() !== tagName.toLowerCase()) {
          throw new Error(`Malformed XML: mismatched closing tag </${tagName}>, expected </${top.tagName}>.`);
        }
      } else if (tagName) {
        if (stack.length > 40) {
          throw new Error(`XML Hierarchy Limit Exceeded: Maximum nesting depth of 40 exceeded.`);
        }
        if (totalElements > 5000) {
          throw new Error(`XML Element Limit Exceeded: Document contains more than 5,000 elements.`);
        }

        totalElements++;
        if (totalElements === 1) {
          rootTagName = tagName;
        }

        const attrs: Array<{ name: string; value: string }> = [];
        if (attrString) {
          const attrRegex = /([a-zA-Z0-9_:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
          let am: RegExpExecArray | null;
          while ((am = attrRegex.exec(attrString)) !== null) {
            const aName = am[1];
            const aVal = am[2] !== undefined ? am[2] : (am[3] !== undefined ? am[3] : am[4]);
            attrs.push({ name: aName, value: aVal });
            totalAttributes++;
          }
        }

        const node: XmlNodeItem = {
          depth: stack.length,
          tagName,
          attributes: attrs,
          textContent: "",
        };
        nodes.push(node);

        if (!isSelfClose) {
          stack.push(node);
        }
      }
    }

    if (stack.length > 0) {
      throw new Error(`Malformed XML: unclosed tag <${stack[stack.length - 1].tagName}>.`);
    }
  }

  if (nodes.length === 0) {
    throw new Error("Empty XML Document: No elements found in XML body.");
  }

  if (onProgress) onProgress(65, "Rendering formatted XML report document...");

  // 5. Build PDF Output
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Courier);
  const fontBold = await pdfDoc.embedFont(StandardFonts.CourierBold);
  const fontSans = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSansBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  pdfDoc.setTitle(`${docName} XML Report`);
  pdfDoc.setProducer("PDFSun Enterprise XML Engine");

  const pageWidth = 595;
  const pageHeight = 842;
  const marginX = 45;
  const marginTop = 50;
  const marginBottom = 50;
  const contentWidth = pageWidth - marginX * 2;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let cursorY = pageHeight - marginTop;
  let pageNumber = 1;

  function ensurePageSpace(neededHeight: number) {
    if (cursorY - neededHeight < marginBottom) {
      currentPage.drawText(`Page ${pageNumber}`, {
        x: pageWidth / 2 - 20,
        y: 25,
        size: 9,
        font: fontSans,
        color: rgb(0.5, 0.5, 0.5),
      });

      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      pageNumber++;
      cursorY = pageHeight - marginTop;

      // Header on continuation pages
      currentPage.drawText(`XML Report: ${docName}`, {
        x: marginX,
        y: pageHeight - 30,
        size: 8,
        font: fontSans,
        color: rgb(0.5, 0.5, 0.5),
      });
    }
  }

  // Draw Document Banner Header
  currentPage.drawRectangle({
    x: marginX,
    y: cursorY - 32,
    width: contentWidth,
    height: 40,
    color: rgb(0.95, 0.97, 1.0),
    borderColor: rgb(0.8, 0.88, 1.0),
    borderWidth: 1,
  });

  currentPage.drawText(`XML Structured Data Report: ${docName}`, {
    x: marginX + 12,
    y: cursorY - 12,
    size: 13,
    font: fontSansBold,
    color: rgb(0.12, 0.25, 0.55),
  });

  currentPage.drawText(
    `Root: <${rootTagName}>  |  Elements: ${totalElements}  |  Attributes: ${totalAttributes}`,
    {
      x: marginX + 12,
      y: cursorY - 26,
      size: 9,
      font: fontSans,
      color: rgb(0.35, 0.45, 0.6),
    }
  );

  cursorY -= 55;

  // Render Formatted Element Tree
  for (let idx = 0; idx < nodes.length; idx++) {
    const node = nodes[idx];
    const indent = Math.min(node.depth * 14, 180);
    const lineX = marginX + indent;
    const availWidth = contentWidth - indent;

    ensurePageSpace(18);

    // Build tag line: <tag-name attr="val">
    let tagLine = `<${node.tagName}`;
    if (node.attributes.length > 0) {
      const attrParts = node.attributes.map((a) => `${a.name}="${a.value}"`).join(" ");
      tagLine += ` ${attrParts}`;
    }
    tagLine += `>`;

    // Fit tag line dynamically to available width
    const maxTagChars = Math.max(45, Math.floor(availWidth / 5.7));
    if (tagLine.length > maxTagChars) {
      tagLine = tagLine.slice(0, maxTagChars - 4) + "...>";
    }

    currentPage.drawText(tagLine, {
      x: lineX,
      y: cursorY,
      size: 9.5,
      font: fontBold,
      color: rgb(0.1, 0.35, 0.75), // Blue tag
    });
    cursorY -= 13;

    // Render text content if present
    if (node.textContent) {
      ensurePageSpace(14);
      let textLine = node.textContent;
      const maxTextChars = Math.max(45, Math.floor((availWidth - 12) / 5.5));
      if (textLine.length > maxTextChars) {
        textLine = textLine.slice(0, maxTextChars - 3) + "...";
      }

      currentPage.drawText(textLine, {
        x: lineX + 12,
        y: cursorY,
        size: 9,
        font: fontRegular,
        color: rgb(0.2, 0.2, 0.2), // Dark slate text
      });
      cursorY -= 12;
    }

    cursorY -= 4; // Node spacing

    if (onProgress && idx % 20 === 0) {
      onProgress(
        65 + Math.round(((idx + 1) / nodes.length) * 30),
        `Rendered element ${idx + 1} of ${nodes.length}...`
      );
    }
  }

  // Footer on final page
  currentPage.drawText(`Page ${pageNumber}`, {
    x: pageWidth / 2 - 20,
    y: 25,
    size: 9,
    font: fontSans,
    color: rgb(0.5, 0.5, 0.5),
  });

  if (onProgress) onProgress(98, "Finalizing XML to PDF compilation...");
  const pdfBytes = await pdfDoc.save();
  if (onProgress) onProgress(100, "XML document converted to PDF successfully!");

  return {
    pdfBytes,
    rootElement: rootTagName,
    elementCount: totalElements,
    attributeCount: totalAttributes,
    pageCount: pdfDoc.getPageCount(),
  };
}
