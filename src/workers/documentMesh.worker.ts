/**
 * Document Worker Mesh — Background Web Worker
 * Version 1.0.0 — PDFSun.in Document Intelligence Engine
 * 
 * Executes heavy document parsing, spatial clustering, and compilation
 * in isolated background threads with zero main-thread UI blockage.
 * Supports zero-copy ArrayBuffer transferables for maximum throughput.
 */

import { buildUdirTableFromTokens, RawSpatialToken } from "../core/udir/spatialTableEngine";
import { compileUdirToDocx } from "../core/udir/docxCompiler";
import { compileUdirToXlsx } from "../core/udir/xlsxCompiler";
import { compileUdirToMarkdown } from "../core/udir/markdownCompiler";
import { UdirDocument } from "../core/udir/types";

// Worker message listener
self.onmessage = async (e: MessageEvent) => {
  const { taskId, action, payload } = e.data || {};

  try {
    switch (action) {
      case "SPATIAL_CLUSTER_TABLE": {
        const { tokens, tableId, title } = payload as {
          tokens: RawSpatialToken[];
          tableId?: string;
          title?: string;
        };
        (self as any).postMessage({ taskId, type: "progress", percent: 40, status: "Clustering table matrix..." });
        const table = buildUdirTableFromTokens(tokens, tableId, title);
        (self as any).postMessage({
          taskId,
          type: "success",
          result: table,
        });
        break;
      }

      case "COMPILE_UDIR_TO_DOCX": {
        const { udir, options } = payload as { udir: UdirDocument; options?: any };
        (self as any).postMessage({ taskId, type: "progress", percent: 30, status: "Compiling OpenXML structures..." });
        const docxBuffer = await compileUdirToDocx(udir, options);
        (self as any).postMessage({ taskId, type: "progress", percent: 90, status: "Packaging DOCX archive..." });
        // Zero-copy transfer
        (self as any).postMessage(
          {
            taskId,
            type: "success",
            result: docxBuffer,
            byteLength: docxBuffer.byteLength,
          },
          [docxBuffer.buffer]
        );
        break;
      }

      case "COMPILE_UDIR_TO_XLSX": {
        const { udir } = payload as { udir: UdirDocument };
        (self as any).postMessage({ taskId, type: "progress", percent: 35, status: "Generating Excel worksheets..." });
        const xlsxBuffer = await compileUdirToXlsx(udir);
        (self as any).postMessage({ taskId, type: "progress", percent: 95, status: "Finalizing spreadsheet..." });
        // Zero-copy transfer
        (self as any).postMessage(
          {
            taskId,
            type: "success",
            result: xlsxBuffer,
            byteLength: xlsxBuffer.byteLength,
          },
          [xlsxBuffer.buffer]
        );
        break;
      }

      case "COMPILE_UDIR_TO_MARKDOWN": {
        const { udir } = payload as { udir: UdirDocument };
        const md = compileUdirToMarkdown(udir);
        (self as any).postMessage({
          taskId,
          type: "success",
          result: md,
        });
        break;
      }

      default:
        throw new Error(`Unsupported Document Worker Mesh action: ${action}`);
    }
  } catch (err: any) {
    (self as any).postMessage({
      taskId,
      type: "error",
      error: {
        message: err?.message || "Worker execution failed",
        stack: err?.stack,
      },
    });
  }
};
