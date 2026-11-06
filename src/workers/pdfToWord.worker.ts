/**
 * PDFSun.in — Phase 20 Web Worker for Asynchronous PDF-to-Word Conversion
 * Offloads CPU-intensive PDF parsing, AST table synthesis and OpenXML packing
 * to maintain 60fps UI responsiveness during 100+ page conversions.
 */

import { convertPdfToWordEnterprise, EnterprisePdfToWordOptions } from "../lib/enterprisePdfToWordEngine";

export interface WorkerRequestMessage {
  id: string;
  type: "CONVERT_PDF_TO_WORD";
  fileBuffer: ArrayBuffer;
  fileName: string;
  options: Omit<EnterprisePdfToWordOptions, "onProgress">;
}

export interface WorkerProgressMessage {
  id: string;
  type: "PROGRESS";
  progress: number;
  message?: string;
}

export interface WorkerSuccessMessage {
  id: string;
  type: "SUCCESS";
  result: {
    bytes: Uint8Array;
    fileName: string;
    pageCount: number;
    stats: any;
    classification?: any;
    structure?: any;
    qualityReport?: any;
    qualityAudit?: any;
  };
}

export interface WorkerErrorMessage {
  id: string;
  type: "ERROR";
  error: string;
}

self.onmessage = async (e: MessageEvent<WorkerRequestMessage>) => {
  const data = e.data;
  if (!data || data.type !== "CONVERT_PDF_TO_WORD") return;

  const { id, fileBuffer, fileName, options } = data;

  try {
    const file = new File([fileBuffer], fileName, { type: "application/pdf" });

    const result = await convertPdfToWordEnterprise(file, {
      ...options,
      onProgress: (progress, message) => {
        const progressMsg: WorkerProgressMessage = {
          id,
          type: "PROGRESS",
          progress,
          message,
        };
        self.postMessage(progressMsg);
      },
    });

    const successMsg: WorkerSuccessMessage = {
      id,
      type: "SUCCESS",
      result: {
        bytes: result.bytes,
        fileName: result.fileName,
        pageCount: result.pageCount,
        stats: result.stats,
        classification: result.classification,
        structure: result.structure,
        qualityReport: result.qualityReport,
        qualityAudit: result.qualityAudit,
      },
    };

    // Transfer bytes buffer for zero-copy performance
    self.postMessage(successMsg, [result.bytes.buffer]);
  } catch (err: any) {
    const errorMsg: WorkerErrorMessage = {
      id,
      type: "ERROR",
      error: err?.message || String(err),
    };
    self.postMessage(errorMsg);
  }
};
