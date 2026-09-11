/**
 * PDFSun Web Worker for Off-Main-Thread Execution
 * Ensures 0% main-thread freezing and 60fps smooth UI performance.
 */

import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import { mergePdfsCore } from "../lib/pdfMergeEngine";
import { splitPdfCore } from "../lib/pdfSplitEngine";

self.onmessage = async (e: MessageEvent) => {
  const { taskId, action, payload } = e.data;

  try {
    let resultBuffer: Uint8Array | null = null;

    if (action === "merge") {
      const {
        filesBuffers,
        fileNames = [],
        pagesToCopy = "all",
        addPageNumbers = false,
        autoGenerateToc = false,
      } = payload;

      const items = filesBuffers.map((buf: ArrayBuffer, idx: number) => ({
        name: fileNames[idx] || `Document_${idx + 1}.pdf`,
        bytes: new Uint8Array(buf),
      }));

      resultBuffer = await mergePdfsCore(items, {
        pagesToCopy,
        addPageNumbers,
        autoGenerateToc,
        onProgress: (percent) => {
          self.postMessage({ taskId, type: "progress", percent });
        },
      });
    } else if (action === "split") {
      const {
        fileBuffer,
        fileName = "document.pdf",
        mode = "range",
        rangeStr = "1, 2-3",
        interval = 2,
        extractMode = "separate",
        customPrefix = "",
      } = payload;

      const splitOutput = await splitPdfCore(new Uint8Array(fileBuffer), fileName, {
        mode,
        rangeStr,
        interval,
        extractMode,
        customPrefix,
        onProgress: (percent) => {
          self.postMessage({ taskId, type: "progress", percent });
        },
      });

      resultBuffer = splitOutput.bytes;
      const transferBuffer = resultBuffer.buffer;
      (self as any).postMessage(
        {
          taskId,
          type: "complete",
          resultBuffer: transferBuffer,
          mimeType: splitOutput.mimeType,
          fileName: splitOutput.fileName,
        },
        [transferBuffer]
      );
      return;
    } else if (action === "compress") {
      const { fileBuffer } = payload;
      const bytes = new Uint8Array(fileBuffer);
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      pdf.setTitle("");
      pdf.setAuthor("");
      pdf.setSubject("");
      pdf.setKeywords([]);
      self.postMessage({ taskId, type: "progress", percent: 70 });
      resultBuffer = await pdf.save({ useObjectStreams: true });
    } else if (action === "rotate") {
      const { fileBuffer, rotationAngle = 90 } = payload;
      const bytes = new Uint8Array(fileBuffer);
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = pdf.getPages();
      pages.forEach((page, i) => {
        const cur = page.getRotation().angle;
        page.setRotation(degrees((cur + rotationAngle) % 360));
        self.postMessage({ taskId, type: "progress", percent: Math.round(((i + 1) / pages.length) * 80) });
      });
      resultBuffer = await pdf.save();
    } else {
      // Default fallback
      const { fileBuffer } = payload;
      const bytes = new Uint8Array(fileBuffer);
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      resultBuffer = await pdf.save();
    }

    if (resultBuffer) {
      self.postMessage({ taskId, type: "progress", percent: 100 });
      // Use Transferable ArrayBuffer for zero-copy high performance
      const transferBuffer = resultBuffer.buffer;
      (self as any).postMessage({ taskId, type: "complete", resultBuffer: transferBuffer }, [transferBuffer]);
    }
  } catch (error: any) {
    self.postMessage({ taskId, type: "error", error: error?.message || "Worker execution failed" });
  }
};
