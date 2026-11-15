/**
 * Markdown & JSON Compiler for UDIR (Universal Document Intermediate Representation)
 * Version 1.0.0 — PDFSun.in Document Intelligence Engine
 * 
 * Compiles a canonical UdirDocument into GitHub-Flavored Markdown (GFM)
 * and structured JSON for zero-loss serialization, worker IPC, and AI extraction.
 */

import { UdirDocument, UdirTable, UdirHeading, UdirParagraph } from "./types";

export function compileUdirToMarkdown(udir: UdirDocument): string {
  const lines: string[] = [];

  for (let pIdx = 0; pIdx < udir.pages.length; pIdx++) {
    const page = udir.pages[pIdx];

    if (pIdx > 0) {
      lines.push("\n---\n"); // Page break
    }

    for (const block of page.blocks) {
      if (block.type === "heading") {
        const heading = block as UdirHeading;
        const prefix = "#".repeat(heading.level);
        lines.push(`${prefix} ${heading.text}\n`);
      } else if (block.type === "paragraph") {
        const p = block as UdirParagraph;
        lines.push(`${p.text}\n`);
      } else if (block.type === "table") {
        const table = block as UdirTable;
        if (table.title) {
          lines.push(`### ${table.title}\n`);
        }

        if (table.rows.length > 0) {
          // Render header row
          const headerRow = table.rows[0];
          const headerCols = headerRow.cells.map((c) => c.text.replace(/\|/g, "\\|").trim() || " ");
          lines.push(`| ${headerCols.join(" | ")} |`);

          // Render divider row
          const dividers = headerRow.cells.map((c) => {
            if (c.alignment === "right") return "---:";
            if (c.alignment === "center") return ":---:";
            return "---";
          });
          lines.push(`| ${dividers.join(" | ")} |`);

          // Render body rows
          for (let r = 1; r < table.rows.length; r++) {
            const row = table.rows[r];
            const cols = row.cells.map((c) => (c.formula || c.text).replace(/\|/g, "\\|").trim() || " ");
            lines.push(`| ${cols.join(" | ")} |`);
          }
          lines.push(""); // Spacing
        }
      }
    }
  }

  return lines.join("\n");
}

export function compileUdirToJson(udir: UdirDocument): string {
  return JSON.stringify(udir, null, 2);
}

export function parseJsonToUdir(jsonStr: string): UdirDocument {
  const parsed = JSON.parse(jsonStr);
  if (!parsed || parsed.schemaVersion !== "1.0.0" || parsed.type !== "document") {
    throw new Error("Invalid UDIR JSON format or unsupported schema version");
  }
  return parsed as UdirDocument;
}
