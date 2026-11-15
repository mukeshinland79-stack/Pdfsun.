/**
 * DOCX Compiler for UDIR (Universal Document Intermediate Representation)
 * Version 1.0.0 — PDFSun.in Document Intelligence Engine
 * 
 * Compiles a canonical UdirDocument into a native OpenXML (.docx) document
 * with native Word tables, headers, headings, zebra striping, and cell alignments.
 */

import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  Table as DocxTable,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  HeadingLevel,
  PageBreak,
} from "docx";
import { UdirDocument, UdirTable, UdirHeading, UdirParagraph } from "./types";

export interface DocxCompilerOptions {
  includePageBreaks?: boolean;
}

export async function compileUdirToDocx(
  udir: UdirDocument,
  options: DocxCompilerOptions = {}
): Promise<Uint8Array> {
  const children: (Paragraph | DocxTable)[] = [];

  for (let pIdx = 0; pIdx < udir.pages.length; pIdx++) {
    const page = udir.pages[pIdx];

    if (pIdx > 0 && options.includePageBreaks !== false) {
      children.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );
    }

    for (const block of page.blocks) {
      if (block.type === "heading") {
        const headingBlock = block as UdirHeading;
        const level =
          headingBlock.level === 1
            ? HeadingLevel.HEADING_1
            : headingBlock.level === 2
            ? HeadingLevel.HEADING_2
            : HeadingLevel.HEADING_3;

        children.push(
          new Paragraph({
            heading: level,
            spacing: { before: 240, after: 120 },
            children: headingBlock.runs.map(
              (r) =>
                new TextRun({
                  text: r.text,
                  bold: r.font.isBold,
                  italics: r.font.isItalic,
                  size: Math.round(r.font.size * 2), // Word uses half-points
                  color: r.font.color?.replace("#", "") || "0F172A",
                })
            ),
          })
        );
      } else if (block.type === "paragraph") {
        const pBlock = block as UdirParagraph;
        const align =
          pBlock.alignment === "center"
            ? AlignmentType.CENTER
            : pBlock.alignment === "right"
            ? AlignmentType.RIGHT
            : pBlock.alignment === "justify"
            ? AlignmentType.JUSTIFIED
            : AlignmentType.LEFT;

        children.push(
          new Paragraph({
            alignment: align,
            spacing: { after: 100, line: 260 },
            children: pBlock.runs.map(
              (r) =>
                new TextRun({
                  text: r.text,
                  bold: r.font.isBold,
                  italics: r.font.isItalic,
                  size: Math.round(r.font.size * 2),
                })
            ),
          })
        );
      } else if (block.type === "table") {
        const tableBlock = block as UdirTable;
        const tableRows: TableRow[] = [];

        for (let rIdx = 0; rIdx < tableBlock.rows.length; rIdx++) {
          const rowData = tableBlock.rows[rIdx];
          const isHeader = rowData.isHeaderRow || rIdx === 0;

          const cells: TableCell[] = rowData.cells.map((c) => {
            const align =
              c.alignment === "right"
                ? AlignmentType.RIGHT
                : c.alignment === "center"
                ? AlignmentType.CENTER
                : AlignmentType.LEFT;

            const bgHex = isHeader
              ? "0F172A"
              : rIdx % 2 === 1 && tableBlock.hasZebraStriping
              ? "F8FAFC"
              : "FFFFFF";

            const textColorHex = isHeader ? "FFFFFF" : "1E293B";

            return new TableCell({
              width: {
                size: Math.max(1000, Math.floor(9000 / Math.max(1, tableBlock.columnCount))),
                type: WidthType.DXA,
              },
              shading: {
                fill: bgHex,
                type: ShadingType.CLEAR,
              },
              margins: {
                top: 120,
                bottom: 120,
                left: 140,
                right: 140,
              },
              children: [
                new Paragraph({
                  alignment: align,
                  children: [
                    new TextRun({
                      text: c.formula || c.text,
                      bold: isHeader || c.runs.some((r) => r.font.isBold),
                      color: textColorHex,
                      size: isHeader ? 19 : 17,
                    }),
                  ],
                }),
              ],
            });
          });

          tableRows.push(
            new TableRow({
              children: cells,
              tableHeader: isHeader,
            })
          );
        }

        const docxTable = new DocxTable({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          rows: tableRows,
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
            left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "E2E8F0" },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          },
        });

        children.push(docxTable);
        children.push(new Paragraph({ spacing: { after: 180 } }));
      }
    }
  }

  const doc = new DocxDocument({
    creator: "PDFSun.in Document Engine",
    title: udir.metadata.title || "PDFSun Reconstructed Document",
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blobOrBuffer = await Packer.toBuffer(doc);
  return new Uint8Array(blobOrBuffer);
}
