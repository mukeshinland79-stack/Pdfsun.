/**
 * Enterprise File Validation and Chunked Processing Service for PDFSun
 * 
 * Provides:
 * 1. File size validation & batch size limits
 * 2. File type & MIME integrity checks
 * 3. Binary header magic-number corruption detection
 * 4. Chunked file reader with progress tracking for large file memory safety
 */

export { validateFile as validateFileCore, type FileValidationStatus } from "./fileValidation";


export interface FileValidationResult {
  file: File;
  id: string;
  isValid: boolean;
  sizeFormatted: string;
  mimeType: string;
  detectedType: string;
  status: "valid" | "warning" | "invalid";
  error?: string;
  warning?: string;
  fileHeaderMagic?: string;
}

export interface ChunkedReadOptions {
  chunkSize?: number; // default 5MB chunks (5 * 1024 * 1024)
  signal?: AbortSignal;
  onProgress?: (bytesLoaded: number, totalBytes: number, percent: number) => void;
  onChunk?: (chunk: Uint8Array, offset: number) => Promise<void> | void;
}

// Configurable constants
export const MAX_SINGLE_FILE_SIZE_MB = 100; // 100 MB max per file
export const MAX_BATCH_SIZE_MB = 500; // 500 MB max per batch operation
export const DEFAULT_CHUNK_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB chunk size

/**
 * Helper to format bytes into readable KB/MB string
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Detect file signature / magic numbers from header bytes
 */
export async function detectFileHeaderMagic(file: File): Promise<{ extension: string; mime: string; magicHex: string }> {
  try {
    const slice = file.slice(0, 16);
    const buffer = await slice.arrayBuffer();
    const uint8 = new Uint8Array(buffer);
    
    // Convert first 8 bytes to hex string
    const hex = Array.from(uint8.subarray(0, 8))
      .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
      .join(" ");

    // PDF Check: %PDF- (0x25 0x50 0x44 0x46)
    if (uint8[0] === 0x25 && uint8[1] === 0x50 && uint8[2] === 0x44 && uint8[3] === 0x46) {
      return { extension: "pdf", mime: "application/pdf", magicHex: hex };
    }

    // PNG Check: 0x89 0x50 0x4E 0x47
    if (uint8[0] === 0x89 && uint8[1] === 0x50 && uint8[2] === 0x4e && uint8[3] === 0x47) {
      return { extension: "png", mime: "image/png", magicHex: hex };
    }

    // JPEG Check: 0xFF 0xD8 0xFF
    if (uint8[0] === 0xff && uint8[1] === 0xd8 && uint8[2] === 0xff) {
      return { extension: "jpg", mime: "image/jpeg", magicHex: hex };
    }

    // ZIP / Office Open XML Check (docx, xlsx, pptx): PK\x03\x04 (0x50 0x4B 0x03 0x04)
    if (uint8[0] === 0x50 && uint8[1] === 0x4b && uint8[2] === 0x03 && uint8[3] === 0x04) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "zip";
      return { extension: ext, mime: "application/zip", magicHex: hex };
    }

    // WebP Check: RIFF....WEBP
    if (uint8[0] === 0x52 && uint8[1] === 0x49 && uint8[2] === 0x46 && uint8[3] === 0x46) {
      return { extension: "webp", mime: "image/webp", magicHex: hex };
    }

    // Plain text / ASCII check ( printable ASCII range or UTF-8 BOM )
    let isAscii = true;
    for (let i = 0; i < Math.min(uint8.length, 16); i++) {
      if (uint8[i] > 127 && uint8[0] !== 0xef && uint8[1] !== 0xbb && uint8[2] !== 0xbf) {
        isAscii = false;
        break;
      }
    }
    if (isAscii) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "txt";
      return { extension: ext, mime: "text/plain", magicHex: hex };
    }

    return { extension: file.name.split(".").pop()?.toLowerCase() || "unknown", mime: file.type || "application/octet-stream", magicHex: hex };
  } catch (e) {
    return { extension: file.name.split(".").pop()?.toLowerCase() || "unknown", mime: "application/octet-stream", magicHex: "Error reading header" };
  }
}

/**
 * Validate a single file against tool constraints and header corruption rules
 */
export async function validateFile(
  file: File,
  expectedCategory?: string,
  toolId?: string
): Promise<FileValidationResult> {
  const id = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const sizeFormatted = formatBytes(file.size);
  const maxBytes = MAX_SINGLE_FILE_SIZE_MB * 1024 * 1024;

  // 1. Size Check
  if (file.size === 0) {
    return {
      file,
      id,
      isValid: false,
      sizeFormatted,
      mimeType: file.type || "unknown",
      detectedType: "Empty File",
      status: "invalid",
      error: "File is empty (0 bytes). Please upload a valid document.",
    };
  }

  if (file.size > maxBytes) {
    return {
      file,
      id,
      isValid: false,
      sizeFormatted,
      mimeType: file.type || "unknown",
      detectedType: "Over Size Limit",
      status: "invalid",
      error: `File size (${sizeFormatted}) exceeds the max limit of ${MAX_SINGLE_FILE_SIZE_MB}MB.`,
    };
  }

  // 2. Header Magic Number & Corruption Check
  const headerInfo = await detectFileHeaderMagic(file);
  const ext = file.name.split(".").pop()?.toLowerCase() || "";

  // PDF-specific tools check
  const requiresPdf = toolId ? ["merge-pdf", "split-pdf", "compress-pdf", "rotate-pdf", "pdf-to-word", "pdf-to-jpg", "watermark-pdf", "page-numbers", "ai-chat-pdf", "ai-pdf-summary"].includes(toolId) : false;

  if (requiresPdf && headerInfo.extension !== "pdf") {
    // If extension is .pdf but header magic didn't match %PDF-, it's either corrupted or misleading extension
    if (ext === "pdf") {
      return {
        file,
        id,
        isValid: true, // Allow processing with fallback repair text-to-pdf engine
        sizeFormatted,
        mimeType: file.type || "application/pdf",
        detectedType: "PDF (Non-Standard Header)",
        status: "warning",
        warning: "PDF header appears non-standard or missing. Auto-repair filter will be applied during processing.",
        fileHeaderMagic: headerInfo.magicHex,
      };
    } else {
      return {
        file,
        id,
        isValid: false,
        sizeFormatted,
        mimeType: file.type || "unknown",
        detectedType: headerInfo.extension.toUpperCase(),
        status: "invalid",
        error: `Expected a PDF file, but received a .${ext} file (${headerInfo.extension.toUpperCase()}).`,
        fileHeaderMagic: headerInfo.magicHex,
      };
    }
  }

  return {
    file,
    id,
    isValid: true,
    sizeFormatted,
    mimeType: file.type || headerInfo.mime,
    detectedType: headerInfo.extension.toUpperCase(),
    status: "valid",
    fileHeaderMagic: headerInfo.magicHex,
  };
}

/**
 * Validate an array of files in batch, enforcing total batch size limit
 */
export async function validateBatchFiles(
  files: File[],
  expectedCategory?: string,
  toolId?: string
): Promise<{ results: FileValidationResult[]; totalBatchSizeFormatted: string; batchError?: string }> {
  const results: FileValidationResult[] = [];
  let totalBytes = 0;

  for (const f of files) {
    totalBytes += f.size;
    const res = await validateFile(f, expectedCategory, toolId);
    results.push(res);
  }

  const maxBatchBytes = MAX_BATCH_SIZE_MB * 1024 * 1024;
  const totalBatchSizeFormatted = formatBytes(totalBytes);

  let batchError: string | undefined = undefined;
  if (totalBytes > maxBatchBytes) {
    batchError = `Total batch size (${totalBatchSizeFormatted}) exceeds maximum limit of ${MAX_BATCH_SIZE_MB}MB.`;
  }

  return {
    results,
    totalBatchSizeFormatted,
    batchError,
  };
}

/**
 * Read large files in chunks safely to prevent memory allocation crashes
 */
export async function readLargeFileChunked(
  file: File,
  options: ChunkedReadOptions = {}
): Promise<Uint8Array> {
  const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE_BYTES;
  const totalBytes = file.size;

  if (options.signal?.aborted) {
    throw new DOMException("Operation aborted by user", "AbortError");
  }

  // Use file.stream() if available for streaming large files without memory spikes
  if (totalBytes > 0 && typeof file.stream === "function") {
    const reader = file.stream().getReader();
    let bytesRead = 0;
    const chunks: Uint8Array[] = [];

    try {
      while (true) {
        if (options.signal?.aborted) {
          await reader.cancel();
          throw new DOMException("Operation aborted by user", "AbortError");
        }

        const { done, value } = await reader.read();
        if (done) break;

        if (value) {
          bytesRead += value.length;

          if (options.onChunk) {
            await options.onChunk(value, bytesRead - value.length);
          } else {
            chunks.push(value);
          }

          const percent = totalBytes > 0 ? Math.min(100, Math.round((bytesRead / totalBytes) * 100)) : 100;
          if (options.onProgress) {
            options.onProgress(bytesRead, totalBytes, percent);
          }
        }
      }
    } catch (err) {
      reader.cancel().catch(() => {});
      throw err;
    }

    if (options.onChunk) {
      return new Uint8Array(0);
    }

    const result = new Uint8Array(totalBytes || bytesRead);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }

  // Fallback slice-based chunk reader
  const result = options.onChunk ? new Uint8Array(0) : new Uint8Array(totalBytes);
  let offset = 0;

  while (offset < totalBytes) {
    if (options.signal?.aborted) {
      throw new DOMException("Operation aborted by user", "AbortError");
    }

    const end = Math.min(offset + chunkSize, totalBytes);
    const blobSlice = file.slice(offset, end);
    const arrayBuffer = await blobSlice.arrayBuffer();
    const chunkUint8 = new Uint8Array(arrayBuffer);

    if (options.onChunk) {
      await options.onChunk(chunkUint8, offset);
    } else {
      result.set(chunkUint8, offset);
    }

    offset = end;

    const percent = Math.min(100, Math.round((offset / totalBytes) * 100));
    if (options.onProgress) {
      options.onProgress(offset, totalBytes, percent);
    }

    if (totalBytes > 20 * 1024 * 1024) {
      await new Promise((r) => setTimeout(r, 10));
    }
  }

  return result;
}
