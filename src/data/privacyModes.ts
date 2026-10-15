/**
 * Privacy & Compliance Classification Matrix for PDFSun.in
 * 
 * Strict privacy guarantee:
 * - Local WASM Tools (60+ tools): 100% In-Browser execution using WebAssembly, Web Workers, and Canvas.
 *   Zero server uploads. Your file never leaves your device.
 * - AI Cloud Tools: Only extracted text (never raw PDF binary files) is transmitted over TLS to our secured
 *   server-side Gemini proxy (/api/ai/*). Zero retention: text is processed ephemerally in RAM and never stored.
 */

export type ToolPrivacyMode = "local_wasm" | "ai_cloud";

export interface PrivacyPolicyDetails {
  mode: ToolPrivacyMode;
  badgeLabel: string;
  badgeColor: "emerald" | "amber" | "sky";
  shortDescription: string;
  fullStatement: string;
  dataTransmission: "none" | "ephemeral_text_only";
  storagePolicy: "zero_storage" | "client_memory_only";
  certifications: string[];
}

// Set of tool IDs that interact with the AI Layer
const AI_TOOL_IDS = new Set<string>([
  "ai-chat-pdf",
  "ai-summarize-pdf",
  "ai-translate-pdf",
  "ai-explain-pdf",
  "ai-quiz-generator",
  "ai-resume-scanner",
  "ai-invoice-analyzer",
  "ai-contract-reviewer",
  "ai-study-guide",
]);

export function getToolPrivacyMode(toolId: string): ToolPrivacyMode {
  if (AI_TOOL_IDS.has(toolId) || toolId.startsWith("ai-")) {
    return "ai_cloud";
  }
  return "local_wasm";
}

export function getToolPrivacyDetails(toolId: string): PrivacyPolicyDetails {
  const mode = getToolPrivacyMode(toolId);

  if (mode === "ai_cloud") {
    return {
      mode: "ai_cloud",
      badgeLabel: "AI Cloud Processing — Zero Storage",
      badgeColor: "amber",
      shortDescription:
        "Extracted text is sent to a secured AI proxy for document intelligence. Your original file is never stored.",
      fullStatement:
        "PDFSun AI tools parse text client-side before sending an encrypted text payload to our isolated AI proxy endpoint. Original PDF binaries never leave your device. No data is stored, cached, or used for model training.",
      dataTransmission: "ephemeral_text_only",
      storagePolicy: "zero_storage",
      certifications: ["TLS 1.3 In-Flight Encryption", "Zero Persistent Logging", "GDPR & CCPA Compliant"],
    };
  }

  return {
    mode: "local_wasm",
    badgeLabel: "100% In-Browser — Zero Server Upload",
    badgeColor: "emerald",
    shortDescription:
      "Processed locally on your device via WebAssembly. Your files never touch any external server.",
    fullStatement:
      "This tool executes entirely in your web browser using WebAssembly (WASM) and Web Workers. No bytes, metadata, or telemetry leave your machine. It functions even if your internet connection disconnects mid-process.",
    dataTransmission: "none",
    storagePolicy: "client_memory_only",
    certifications: ["100% Air-Gapped Capable", "Client-Side Cryptography", "Zero Server Footprint"],
  };
}
