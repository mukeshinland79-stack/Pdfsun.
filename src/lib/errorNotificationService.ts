/**
 * Human-Friendly Error Notification & Classification Service for PDFSun
 * Translates low-level engine/parser errors into clear, actionable UI overlays.
 */

export interface DetailedErrorInfo {
  type: "password" | "corrupted" | "size" | "empty" | "unsupported" | "generic";
  title: string;
  badge: string;
  message: string;
  suggestion: string;
  fileName?: string;
  rawDetails?: string;
}

/**
 * Classifies an error into human-friendly explanations and actionable recovery suggestions.
 */
export function parseHumanFriendlyError(err: any, fileName?: string): DetailedErrorInfo {
  const rawMsg = typeof err === "string" ? err : err?.message || String(err || "Unknown error");
  const lowerMsg = (rawMsg || "").toLowerCase();

  // 1. Password Protected / Encrypted PDF
  if (
    lowerMsg.includes("encrypted") ||
    lowerMsg.includes("password") ||
    lowerMsg.includes("code 2") ||
    lowerMsg.includes("encrypt") ||
    lowerMsg.includes("protected") ||
    lowerMsg.includes("security") ||
    lowerMsg.includes("owner password")
  ) {
    return {
      type: "password",
      title: "Password-Protected PDF Detected",
      badge: "Encrypted Document",
      message: fileName
        ? `The file "${fileName}" is locked or encrypted with security permissions.`
        : "The uploaded PDF document is encrypted or password-protected.",
      suggestion:
        "Please provide the correct password in the Protect/Unlock settings or upload an unencrypted version of the file before processing.",
      fileName,
      rawDetails: rawMsg,
    };
  }

  // 2. Corrupted or Unreadable Document
  if (
    lowerMsg.includes("corrupt") ||
    lowerMsg.includes("invalid pdf") ||
    lowerMsg.includes("header") ||
    lowerMsg.includes("xref") ||
    lowerMsg.includes("trailer") ||
    lowerMsg.includes("stream end") ||
    lowerMsg.includes("unexpected token") ||
    lowerMsg.includes("failed to parse") ||
    lowerMsg.includes("malformed") ||
    lowerMsg.includes("eof")
  ) {
    return {
      type: "corrupted",
      title: "Corrupted or Damaged Document",
      badge: "Structure Integrity Error",
      message: fileName
        ? `"${fileName}" appears to have missing bytes, corrupted stream tables, or invalid PDF structure.`
        : "The document structure is corrupted or unreadable by the PDF engine.",
      suggestion:
        "Try re-saving or re-exporting the document from your source viewer (e.g. Chrome, Acrobat, Word), or run it through our auto-repair filter.",
      fileName,
      rawDetails: rawMsg,
    };
  }

  // 3. File Size / Memory Allocation Limits
  if (
    lowerMsg.includes("size") ||
    lowerMsg.includes("memory") ||
    lowerMsg.includes("out of memory") ||
    lowerMsg.includes("rangeerror") ||
    lowerMsg.includes("exceeds") ||
    lowerMsg.includes("allocation") ||
    lowerMsg.includes("buffer")
  ) {
    return {
      type: "size",
      title: "Memory / File Size Limit Reached",
      badge: "Resource Limit",
      message: fileName
        ? `"${fileName}" requires more browser memory than currently available.`
        : "Processing this document exceeds browser memory buffer limits.",
      suggestion:
        "Try splitting the PDF into smaller page intervals or compressing embedded images before executing high-memory transformations.",
      fileName,
      rawDetails: rawMsg,
    };
  }

  // 4. Empty / Zero-Byte File
  if (
    lowerMsg.includes("empty") ||
    lowerMsg.includes("0 bytes") ||
    lowerMsg.includes("blank file") ||
    lowerMsg.includes("no content")
  ) {
    return {
      type: "empty",
      title: "Empty File Uploaded",
      badge: "Zero Bytes",
      message: fileName
        ? `The file "${fileName}" contains zero bytes of data.`
        : "The selected file is completely empty.",
      suggestion: "Please select a valid, non-empty document with content to process.",
      fileName,
      rawDetails: rawMsg,
    };
  }

  // 5. Incompatible / Unsupported Format
  if (
    lowerMsg.includes("unsupported") ||
    lowerMsg.includes("expected") ||
    lowerMsg.includes("incompatible") ||
    lowerMsg.includes("format")
  ) {
    return {
      type: "unsupported",
      title: "Incompatible File Format",
      badge: "Format Mismatch",
      message: rawMsg,
      suggestion: "Ensure you upload files matching the supported input types for this specific tool.",
      fileName,
      rawDetails: rawMsg,
    };
  }

  // 6. Generic Fallback
  return {
    type: "generic",
    title: "Document Processing Interrupted",
    badge: "Engine Failure",
    message: rawMsg || "An unexpected error occurred while executing the PDF engine transformations.",
    suggestion: "Verify your file integrity, check your tool parameters, and try running the operation again.",
    fileName,
    rawDetails: rawMsg,
  };
}
