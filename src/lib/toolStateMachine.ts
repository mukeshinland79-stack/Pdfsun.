/**
 * Unified Async Tool State Machine for PDFSun.in
 * 
 * Formal state machine managing the lifecycle of in-browser PDF tools:
 * 'idle' -> 'validating' -> 'pre_flight_check' -> 'processing' -> 'download_ready' -> 'downloaded'
 * Transitions to 'failed' or 'cancelled' on errors / user abort.
 */

export type ToolLifecycleState =
  | "idle"
  | "validating"
  | "pre_flight_check"
  | "processing"
  | "download_ready"
  | "downloaded"
  | "failed"
  | "cancelled";

export interface ToolError {
  code:
    | "OUT_OF_MEMORY"
    | "WORKER_CRASH"
    | "TIMEOUT"
    | "INVALID_PDF"
    | "PASSWORD_REQUIRED"
    | "NETWORK_ERROR"
    | "ABORTED"
    | "UNKNOWN";
  message: string;
  recoveryHint: string;
  originalError?: any;
}

export interface ToolExecutionSnapshot {
  state: ToolLifecycleState;
  progressPercent: number;
  statusMessage: string;
  error: ToolError | null;
  outputBlobUrl: string | null;
  outputFileName: string | null;
  outputSizeBytes: number | null;
  startTime: number | null;
  endTime: number | null;
}

/**
 * Normalizes any caught runtime exception into an actionable, user-friendly ToolError.
 */
export function normalizeToolError(err: any): ToolError {
  const message = err?.message || String(err || "Unknown processing error");
  const lowerMsg = message.toLowerCase();

  // Out of Memory / ArrayBuffer allocations
  if (
    lowerMsg.includes("out of memory") ||
    lowerMsg.includes("memory") ||
    lowerMsg.includes("arraybuffer allocation failed") ||
    lowerMsg.includes("heap")
  ) {
    return {
      code: "OUT_OF_MEMORY",
      message: "Browser memory limit reached during processing.",
      recoveryHint: "Try compressing your PDF first, splitting into smaller page ranges, or closing other browser tabs.",
      originalError: err,
    };
  }

  // Worker crash / termination
  if (lowerMsg.includes("worker") || lowerMsg.includes("terminated") || lowerMsg.includes("messageerror")) {
    return {
      code: "WORKER_CRASH",
      message: "Background processing engine stopped unexpectedly.",
      recoveryHint: "We have refreshed the engine. Please click retry to process with safer memory buffers.",
      originalError: err,
    };
  }

  // Execution Timeout
  if (lowerMsg.includes("timeout") || lowerMsg.includes("timed out") || lowerMsg.includes("exceeded")) {
    return {
      code: "TIMEOUT",
      message: "Operation took longer than 45 seconds.",
      recoveryHint: "The document is complex or high-resolution. Try processing fewer pages or lowering DPI.",
      originalError: err,
    };
  }

  // Password protected / Encrypted
  if (lowerMsg.includes("password") || lowerMsg.includes("encrypt") || lowerMsg.includes("secured")) {
    return {
      code: "PASSWORD_REQUIRED",
      message: "This PDF document is encrypted or password-protected.",
      recoveryHint: "Use the 'Unlock PDF' tool to remove the password before converting.",
      originalError: err,
    };
  }

  // Corrupt / Invalid PDF
  if (lowerMsg.includes("invalid pdf") || lowerMsg.includes("corrupt") || lowerMsg.includes("eof") || lowerMsg.includes("magic number")) {
    return {
      code: "INVALID_PDF",
      message: "The uploaded file is corrupt or not a standard PDF.",
      recoveryHint: "Try re-saving the document in your PDF reader or use the 'Repair PDF' tool.",
      originalError: err,
    };
  }

  // User Aborted
  if (lowerMsg.includes("abort") || lowerMsg.includes("cancel")) {
    return {
      code: "ABORTED",
      message: "Operation was cancelled by user.",
      recoveryHint: "You can restart processing anytime.",
      originalError: err,
    };
  }

  // Fallback
  return {
    code: "UNKNOWN",
    message,
    recoveryHint: "An unexpected error occurred. Please try again or test with another file.",
    originalError: err,
  };
}

/**
 * Validates whether state transition is permissible in the tool state machine.
 */
export function canTransition(current: ToolLifecycleState, next: ToolLifecycleState): boolean {
  if (current === next) return true;

  switch (current) {
    case "idle":
      return next === "validating" || next === "pre_flight_check" || next === "processing";
    case "validating":
      return next === "pre_flight_check" || next === "processing" || next === "failed" || next === "cancelled" || next === "idle";
    case "pre_flight_check":
      return next === "processing" || next === "failed" || next === "cancelled" || next === "idle";
    case "processing":
      return next === "download_ready" || next === "failed" || next === "cancelled" || next === "idle";
    case "download_ready":
      return next === "downloaded" || next === "idle" || next === "processing";
    case "downloaded":
      return next === "idle" || next === "processing" || next === "download_ready";
    case "failed":
    case "cancelled":
      return next === "idle" || next === "validating" || next === "pre_flight_check" || next === "processing";
    default:
      return true;
  }
}
