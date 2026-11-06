/**
 * PDFSun.in — Technical PDF Structure Intelligence Engine (Phase 19)
 * 
 * Independently analyzes the physical & technical structure of PDF documents:
 * - 6 Structural Classes: Digital, Scanned, Hybrid, Table-Heavy, Interactive Form, Multilingual
 * - Layout Metrics: Column counts, table density, font diversity, script detection
 * - Page Budget Estimator: Calculates vertical height budgets to prevent cascading soft page breaks
 */

export type PdfStructuralClass =
  | "digital"
  | "scanned"
  | "hybrid"
  | "table_heavy"
  | "interactive_form"
  | "multilingual";

export interface ScriptDetectionResult {
  hasLatin: boolean;
  hasDevanagari: boolean;
  hasArabic: boolean;
  hasCJK: boolean;
  hasCyrillic: boolean;
  isRightToLeft: boolean;
  dominantScript: "Latin" | "Devanagari" | "Arabic" | "CJK" | "Cyrillic" | "Mixed";
}

export interface PageBudgetEstimate {
  pageNumber: number;
  availableHeightPt: number;
  estimatedContentHeightPt: number;
  isBudgetExceeded: boolean;
  overflowRatio: number;
  recommendedScaling: number;
}

export interface TechnicalStructureAnalysis {
  structuralClass: PdfStructuralClass;
  confidence: number; // 0 to 100
  isScannedOcrRequired: boolean;
  isTableHeavy: boolean;
  isInteractiveForm: boolean;
  columnLayout: "single_column" | "two_column" | "three_column" | "tabular_grid";
  scripts: ScriptDetectionResult;
  fontDiversityCount: number;
  tableRegionsCount: number;
  pageBudgets: PageBudgetEstimate[];
  recommendedDocxPreset: "financial_fidelity" | "editable_word" | "visual_fidelity" | "scanned_ocr";
}

/**
 * Detects scripts and writing directions from text tokens
 */
export function detectScriptsAndDirection(text: string): ScriptDetectionResult {
  let latinChars = 0;
  let devanagariChars = 0;
  let arabicChars = 0;
  let cjkChars = 0;
  let cyrillicChars = 0;

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if ((code >= 0x0041 && code <= 0x005a) || (code >= 0x0061 && code <= 0x007a)) latinChars++;
    else if (code >= 0x0900 && code <= 0x097f) devanagariChars++;
    else if (code >= 0x0600 && code <= 0x06ff) arabicChars++;
    else if ((code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3040 && code <= 0x30ff)) cjkChars++;
    else if (code >= 0x0400 && code <= 0x04ff) cyrillicChars++;
  }

  const hasLatin = latinChars > 5;
  const hasDevanagari = devanagariChars > 3;
  const hasArabic = arabicChars > 3;
  const hasCJK = cjkChars > 3;
  const hasCyrillic = cyrillicChars > 3;
  const isRightToLeft = hasArabic;

  const counts = [
    { script: "Latin" as const, count: latinChars },
    { script: "Devanagari" as const, count: devanagariChars },
    { script: "Arabic" as const, count: arabicChars },
    { script: "CJK" as const, count: cjkChars },
    { script: "Cyrillic" as const, count: cyrillicChars },
  ];
  counts.sort((a, b) => b.count - a.count);

  const nonZero = counts.filter((c) => c.count > 0);
  let dominantScript: ScriptDetectionResult["dominantScript"] = "Latin";
  if (nonZero.length > 1 && nonZero[1].count > nonZero[0].count * 0.4) {
    dominantScript = "Mixed";
  } else if (nonZero.length > 0 && nonZero[0].count > 0) {
    dominantScript = nonZero[0].script;
  }

  return {
    hasLatin,
    hasDevanagari,
    hasArabic,
    hasCJK,
    hasCyrillic,
    isRightToLeft,
    dominantScript,
  };
}

/**
 * Analyzes the structural technical class of a document
 */
export function analyzePdfTechnicalStructure(
  tokens: { text: string; x: number; y: number; width?: number; height?: number; fontSize?: number; page?: number }[],
  pageCount: number,
  pageDimensions: { width: number; height: number }[],
  embeddedImagesCount: number = 0,
  hasAcroForms: boolean = false
): TechnicalStructureAnalysis {
  const fullText = tokens.map((t) => t.text).join(" ");
  const textLength = fullText.trim().length;
  const avgCharsPerPage = pageCount > 0 ? textLength / pageCount : 0;

  // 1. Script & RTL detection
  const scripts = detectScriptsAndDirection(fullText);

  // 2. Interactive Form detection
  const formMarkers = ["____", "[ ]", "( )", "signature of applicant", "tick appropriate", "fill in block letters", "date:____", "affix passport"];
  let formMarkerHits = 0;
  const textLower = fullText.toLowerCase();
  for (const fm of formMarkers) {
    if (textLower.includes(fm)) formMarkerHits++;
  }
  const isInteractiveForm = hasAcroForms || formMarkerHits >= 2;

  // 3. Tabular & Grid density detection
  const tableKeywords = ["qty", "rate", "amount", "total", "hsn", "sac", "taxable", "sr.no", "description", "balance", "credit", "debit"];
  let tableKwHits = 0;
  for (const kw of tableKeywords) {
    if (textLower.includes(kw)) tableKwHits++;
  }

  // Count lines with multiple aligned tokens
  const page1Tokens = tokens.filter((t) => (t.page || 1) === 1);
  const yMap = new Map<number, number>();
  for (const t of page1Tokens) {
    const bucketY = Math.round(t.y / 5) * 5;
    yMap.set(bucketY, (yMap.get(bucketY) || 0) + 1);
  }
  let multiTokenLines = 0;
  for (const count of yMap.values()) {
    if (count >= 3) multiTokenLines++;
  }
  const isTableHeavy = tableKwHits >= 2 || (tableKwHits >= 1 && multiTokenLines >= 3);

  // 4. Scanned vs Digital vs Hybrid detection
  const isLowText = avgCharsPerPage < 35;
  let structuralClass: PdfStructuralClass = "digital";

  if (isLowText && embeddedImagesCount >= pageCount) {
    structuralClass = "scanned";
  } else if (embeddedImagesCount > 0 && isLowText) {
    structuralClass = "scanned";
  } else if (embeddedImagesCount > 0 && avgCharsPerPage >= 50 && embeddedImagesCount >= 2) {
    structuralClass = "hybrid";
  } else if (isInteractiveForm) {
    structuralClass = "interactive_form";
  } else if (isTableHeavy) {
    structuralClass = "table_heavy";
  } else if (scripts.dominantScript === "Mixed" || scripts.hasArabic || scripts.hasDevanagari || scripts.hasCJK) {
    structuralClass = "multilingual";
  } else {
    structuralClass = "digital";
  }

  // 5. Column Layout Detection
  let columnLayout: TechnicalStructureAnalysis["columnLayout"] = "single_column";
  if (isTableHeavy) {
    columnLayout = "tabular_grid";
  } else {
    // Check if tokens separate into 2 clear vertical clusters
    const p1Width = pageDimensions[0]?.width || 595;
    const midX = p1Width / 2;
    const leftColTokens = page1Tokens.filter((t) => t.x < midX - 30);
    const rightColTokens = page1Tokens.filter((t) => t.x > midX + 30);
    if (leftColTokens.length > 15 && rightColTokens.length > 15 && Math.abs(leftColTokens.length - rightColTokens.length) < leftColTokens.length * 0.6) {
      columnLayout = "two_column";
    }
  }

  // 6. Page Budget Estimation (Prevent 3 -> 5 page cascading explosion)
  const pageBudgets: PageBudgetEstimate[] = [];
  for (let p = 1; p <= pageCount; p++) {
    const dim = pageDimensions[p - 1] || { width: 595.28, height: 841.89 };
    const pTokens = tokens.filter((t) => (t.page || 1) === p);
    const availableHeightPt = dim.height - 72; // 0.5 in top + bottom margins = 72 pt

    // Estimate content height based on distinct line buckets and tables
    const lineBuckets = new Set(pTokens.map((t) => Math.round(t.y / 8)));
    const estimatedHeight = Math.max(100, lineBuckets.size * 18);
    const overflowRatio = estimatedHeight / availableHeightPt;

    pageBudgets.push({
      pageNumber: p,
      availableHeightPt,
      estimatedContentHeightPt: estimatedHeight,
      isBudgetExceeded: overflowRatio > 1.05,
      overflowRatio,
      recommendedScaling: overflowRatio > 1.0 ? Math.max(0.8, 1 / overflowRatio) : 1.0,
    });
  }

  // Recommend optimal DOCX conversion preset
  let recommendedDocxPreset: TechnicalStructureAnalysis["recommendedDocxPreset"] = "editable_word";
  if (structuralClass === "scanned") {
    recommendedDocxPreset = "scanned_ocr";
  } else if (structuralClass === "table_heavy") {
    recommendedDocxPreset = "financial_fidelity";
  } else if (structuralClass === "interactive_form" || structuralClass === "hybrid") {
    recommendedDocxPreset = "visual_fidelity";
  }

  return {
    structuralClass,
    confidence: structuralClass === "scanned" ? 92 : 88,
    isScannedOcrRequired: structuralClass === "scanned",
    isTableHeavy,
    isInteractiveForm,
    columnLayout,
    scripts,
    fontDiversityCount: new Set(tokens.map((t) => Math.round(t.fontSize || 10))).size,
    tableRegionsCount: isTableHeavy ? (multiTokenLines > 10 ? 2 : 1) : 0,
    pageBudgets,
    recommendedDocxPreset,
  };
}
