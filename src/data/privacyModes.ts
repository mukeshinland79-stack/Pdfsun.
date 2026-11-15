/**
 * Privacy & Processing Transparency Matrix for PDFSun.in
 *
 * Truthful processing classification across all 68 registered tools:
 * - local_wasm: Executed in-browser using WebAssembly, Web Workers, pdf-lib, pdfjs-dist, and Canvas.
 *   Files stay on the user's device unless the user explicitly exports to a connected service.
 * - ai_cloud: Extracted text, image captures, or queries are transmitted over HTTPS to PDFSun's
 *   server-side AI proxy (/api/ai/* or /api/translate) backed by Google Gemini API.
 *   Do not claim "100% Local Processing" or "Zero Storage" where external model providers apply.
 * - hybrid_cloud: Runs client-side by default via in-browser OCR/parsing engines, with optional
 *   server-side AI vision/table reconstruction when the user triggers AI-assisted OCR or fallback.
 */

export type ToolPrivacyMode = "local_wasm" | "ai_cloud" | "hybrid_cloud";

export interface PrivacyPolicyDetails {
  mode: ToolPrivacyMode;
  badgeLabel: string;
  compactLabel: string;
  badgeColor: "emerald" | "amber" | "sky";
  shortDescription: string;
  fullStatement: string;
  dataTransmission: "none" | "ephemeral_text_only" | "conditional_ai_fallback";
  storagePolicy: "client_memory_only" | "ephemeral_proxy_in_flight";
  certifications: string[];
}

// All tools that directly invoke server-side AI / translation proxies (/api/ai/*, /api/translate)
const AI_CLOUD_TOOL_IDS = new Set<string>([
  "ai-chat-pdf",
  "ai-pdf-chat",
  "ai-pdf-summary",
  "ai-summarize-pdf",
  "ai-translate-pdf",
  "translate-pdf",
  "ai-resume-builder",
  "ai-resume-scanner",
  "ai-flashcards",
  "ai-notes-generator",
  "ai-grammar",
  "ai-explain-pdf",
  "ai-quiz-generator",
  "ai-invoice-analyzer",
  "ai-contract-reviewer",
  "ai-study-guide",
]);

// Tools that perform primary local/browser processing but can send pages/crops/text to server AI OCR/Vision
const HYBRID_CLOUD_TOOL_IDS = new Set<string>([
  "ai-ocr",
  "ocr-pdf",
  "ocr-image-to-text",
  "image-to-excel",
  "pdf-to-excel",
  "pdf-to-word",
]);

export function getToolPrivacyMode(toolId: string): ToolPrivacyMode {
  const normalized = (toolId || "").trim().toLowerCase();
  if (HYBRID_CLOUD_TOOL_IDS.has(normalized)) {
    return "hybrid_cloud";
  }
  if (AI_CLOUD_TOOL_IDS.has(normalized) || (normalized.startsWith("ai-") && normalized !== "ai-voice-reader")) {
    return "ai_cloud";
  }
  return "local_wasm";
}

export function getToolPrivacyDetails(toolId: string): PrivacyPolicyDetails {
  const mode = getToolPrivacyMode(toolId);

  if (mode === "ai_cloud") {
    return {
      mode: "ai_cloud",
      badgeLabel: "Cloud AI Proxy Processing",
      compactLabel: "Cloud AI Proxy",
      badgeColor: "amber",
      shortDescription:
        "Extracted document text or queries are transmitted over HTTPS to PDFSun's server-side Google Gemini API proxy to generate results.",
      fullStatement:
        "This AI tool transmits extracted document text or user prompts over HTTPS to PDFSun's server-side AI proxy (/api/ai/*) backed by Google Gemini API. Browser localStorage caching of your AI document text and chat history is disabled.",
      dataTransmission: "ephemeral_text_only",
      storagePolicy: "ephemeral_proxy_in_flight",
      certifications: [
        "TLS / HTTPS In-Flight Encryption",
        "No Browser localStorage Document Caching",
        "Google Gemini API Proxy",
      ],
    };
  }

  if (mode === "hybrid_cloud") {
    return {
      mode: "hybrid_cloud",
      badgeLabel: "Hybrid Local + Cloud AI Fallback",
      compactLabel: "Hybrid Local / Cloud AI",
      badgeColor: "sky",
      shortDescription:
        "Runs locally in your browser by default; scanned pages or complex table layouts may be sent over HTTPS to the Gemini Vision OCR proxy when AI fallback is used.",
      fullStatement:
        "PDFSun processes standard digital documents locally in your browser using client-side parsers. When OCR or AI table/layout reconstruction is triggered for scanned images or complex tables, page captures are sent over HTTPS to our Google Gemini API proxy.",
      dataTransmission: "conditional_ai_fallback",
      storagePolicy: "ephemeral_proxy_in_flight",
      certifications: [
        "Client-Side First Execution",
        "TLS / HTTPS When Cloud OCR Used",
        "No Persistent Document Archive on PDFSun",
      ],
    };
  }

  return {
    mode: "local_wasm",
    badgeLabel: "In-Browser Local Processing",
    compactLabel: "100% In-Browser",
    badgeColor: "emerald",
    shortDescription:
      "Processed locally in your browser via WebAssembly and Web Workers. Your document bytes stay on your device.",
    fullStatement:
      "This utility executes locally inside your browser using WebAssembly (WASM), JavaScript, and Web Workers. Document binaries are processed in browser memory and are not uploaded to PDFSun servers.",
    dataTransmission: "none",
    storagePolicy: "client_memory_only",
    certifications: [
      "Client-Side Browser Execution",
      "Offline Capable Tooling",
      "No Document Upload Required",
    ],
  };
}
