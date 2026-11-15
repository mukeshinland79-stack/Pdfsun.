export interface QuickTipItem {
  toolId: string;
  tip: string;
  category?: string;
  badge?: string;
}

export const TOOL_QUICK_TIPS: Record<string, QuickTipItem> = {
  "merge-pdf": {
    toolId: "merge-pdf",
    tip: "Tip: Compress heavy images before merging for faster processing and smaller output size.",
    badge: "Optimization",
  },
  "compress-pdf": {
    toolId: "compress-pdf",
    tip: "Tip: Moderate Compression offers the optimal balance between visual clarity and file size reduction.",
    badge: "Best Practice",
  },
  "split-pdf": {
    toolId: "split-pdf",
    tip: "Tip: Enter comma-separated ranges (e.g. 1-3, 5, 8-10) to extract specific chapters instantly.",
    badge: "Efficiency",
  },
  "pdf-to-word": {
    toolId: "pdf-to-word",
    tip: "Tip: For scanned physical papers, run the OCR PDF tool first to preserve editable paragraphs.",
    badge: "Fidelity",
  },
  "word-to-pdf": {
    toolId: "word-to-pdf",
    tip: "Tip: Embed custom fonts into your doc before converting to preserve exact typographic layout.",
    badge: "Formatting",
  },
  "ai-chat-pdf": {
    toolId: "ai-chat-pdf",
    tip: "Tip: Ask direct questions like 'Summarize contract obligations on page 4' for accurate answers.",
    badge: "AI Workflow",
  },
  "annotate-pdf": {
    toolId: "annotate-pdf",
    tip: "Tip: Hold Shift while drawing shapes to constrain perfect circles and horizontal lines.",
    badge: "Shortcut",
  },
  "edit-pdf": {
    toolId: "edit-pdf",
    tip: "Tip: Use the black highlight rectangle tool to permanently redact sensitive personal information.",
    badge: "Privacy",
  },
  "ocr-pdf": {
    toolId: "ocr-pdf",
    tip: "Tip: High-contrast desk scans with 300+ DPI yield the highest character recognition accuracy.",
    badge: "Accuracy",
  },
  "protect-pdf": {
    toolId: "protect-pdf",
    tip: "Tip: Combine uppercase, numbers, and special symbols in your password for enterprise encryption.",
    badge: "Security",
  },
  "unlock-pdf": {
    toolId: "unlock-pdf",
    tip: "Tip: Ensure you have legal authorization or ownership before removing document security locks.",
    badge: "Compliance",
  },
  "organize-pdf": {
    toolId: "organize-pdf",
    tip: "Tip: Hover over page thumbnails to rotate upside-down pages or delete unwanted blanks instantly.",
    badge: "Quick Action",
  },
  "watermark-pdf": {
    toolId: "watermark-pdf",
    tip: "Tip: Set text opacity to 25% - 35% for clean background branding that keeps text readable.",
    badge: "Branding",
  },
  "ai-summarize-pdf": {
    toolId: "ai-summarize-pdf",
    tip: "Tip: Choose 'Executive Summary' to extract key metrics, deadlines, and decision points.",
    badge: "AI Insights",
  },
  "pdf-to-jpg": {
    toolId: "pdf-to-jpg",
    tip: "Tip: Select 300 DPI high-res mode if you intend to print or publish page graphics.",
    badge: "Resolution",
  },
  "excel-to-pdf": {
    toolId: "excel-to-pdf",
    tip: "Tip: Set 'Fit sheet to 1 page wide' in spreadsheet view before exporting for perfectly aligned tables.",
    badge: "Layout",
  },
};

export const DEFAULT_QUICK_TIP: QuickTipItem = {
  toolId: "default",
  tip: "Tip: Drag & drop files directly or paste documents from your clipboard for rapid processing.",
  badge: "Quick Tip",
};

export function getQuickTipForTool(toolId: string): QuickTipItem {
  return TOOL_QUICK_TIPS[toolId] || DEFAULT_QUICK_TIP;
}
