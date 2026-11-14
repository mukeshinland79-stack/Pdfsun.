/**
 * PDFSun.in — Web Worker for Asynchronous Enterprise PDF-to-Word Conversion
 * Offloads CPU-intensive PDF parsing, vector/CTM extraction, AST synthesis and OpenXML packing
 * to maintain smooth UI responsiveness across multi-page financial & mixed documents.
 */

import {
  convertPdfToWordEnterprise,
  PdfToWordOptions as EnterprisePdfToWordOptions,
  PdfToWordResult as EnterprisePdfToWordResult,
} from "../lib/enterprisePdfToWordEngine";

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
  result: EnterprisePdfToWordResult & {
    pageCount?: number;
    structure?: any;
    qualityReport?: any;
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
        ...result,
        pageCount: result.stats?.pagesCount || 1,
        structure: result.technicalStructure,
        qualityReport: result.docxQualityReport,
      },
    };

    (self as any).postMessage(successMsg, [result.bytes.buffer]);
  } catch (err: any) {
    const errorMsg: WorkerErrorMessage = {
      id,
      type: "ERROR",
      error: err?.message || String(err),
    };
    self.postMessage(errorMsg);
  }
};
