/**
 * Zero-Dependency TypeScript 1D Barcode Engine for PDFSun (Tool #67)
 *
 * Supported Symbologies:
 * 1. CODE128   - Code 128 Auto (Code Set B + Code Set C optimization, Mod-103 checksum)
 * 2. CODE39    - Code 39 (0-9, A-Z, - . $ / + % space, optional Mod-43 checksum)
 * 3. EAN8      - EAN-8 (7 or 8 digits, Mod-10 checksum)
 * 4. EAN13     - EAN-13 (12 or 13 digits, L/G/R parity + Mod-10 checksum)
 * 5. UPCA      - UPC-A (11 or 12 digits, Mod-10 checksum)
 * 6. UPCE      - UPC-E (6, 7, or 8 digits zero-suppressed UPC-A, Mod-10 checksum)
 * 7. ITF14     - ITF-14 (13 or 14 digits Interleaved 2 of 5, Mod-10 checksum + bearer bars)
 * 8. CODABAR   - Codabar (0-9 - $ : / . +, selectable A/B/C/D start & stop guards)
 * 9. GS1_128   - GS1-128 (Mandatory FNC1 start + Application Identifier parsing & validation)
 */

export type BarcodeSymbology =
  | "CODE128"
  | "CODE39"
  | "EAN8"
  | "EAN13"
  | "UPCA"
  | "UPCE"
  | "ITF14"
  | "CODABAR"
  | "GS1_128";

export interface BarcodeGenerationOptions {
  symbology: BarcodeSymbology;
  barWidth?: number; // px per narrow module (default 2, range 1..6)
  height?: number; // bar height px (default 96, range 32..320)
  quietZoneModules?: number; // default 10
  foreground?: string; // hex color
  background?: string; // hex color
  showText?: boolean;
  customLabel?: string; // optional header/product label above barcode
  fontSize?: number;
  textMargin?: number;
  includeChecksum?: boolean; // Code 39 optional Mod-43
  codabarStart?: "A" | "B" | "C" | "D";
  codabarStop?: "A" | "B" | "C" | "D";
  itfBearerBars?: boolean;
}

export interface BarcodeResult {
  valid: boolean;
  symbology: BarcodeSymbology;
  inputValue: string;
  normalizedValue: string;
  displayText: string;
  checkDigit?: string;
  modules: string; // '1' = dark bar, '0' = light space
  totalModules: number;
  width: number;
  height: number;
  quietZonePx: number;
  svgMarkup: string;
  error?: string;
  metadata?: {
    aiSegments?: Array<{ ai: string; value: string; title: string }>;
    code128Values?: number[];
  };
}

export const SYMBOLOGY_INFO: Record<
  BarcodeSymbology,
  {
    label: string;
    shortLabel: string;
    description: string;
    example: string;
    rules: string;
  }
> = {
  CODE128: {
    label: "Code 128 (Auto B/C)",
    shortLabel: "Code 128",
    description: "High-density alphanumeric & numeric logistics barcode (ISO/IEC 15417).",
    example: "PDFSUN-2026-0048",
    rules: "Printable ASCII characters (spaces, letters, digits, symbols).",
  },
  CODE39: {
    label: "Code 39",
    shortLabel: "Code 39",
    description: "Industrial & inventory uppercase alphanumeric standard with optional Mod-43.",
    example: "INV-2026-A9",
    rules: "0–9, A–Z, and - . $ / + % space.",
  },
  EAN8: {
    label: "EAN-8",
    shortLabel: "EAN-8",
    description: "Compact 8-digit European retail packaging barcode.",
    example: "9638507",
    rules: "7 digits (auto check digit) or 8 valid Mod-10 digits.",
  },
  EAN13: {
    label: "EAN-13",
    shortLabel: "EAN-13",
    description: "Global retail GS1 GTIN-13 product barcode.",
    example: "890103089512",
    rules: "12 digits (auto check digit) or 13 valid Mod-10 digits.",
  },
  UPCA: {
    label: "UPC-A",
    shortLabel: "UPC-A",
    description: "North American 12-digit retail POS barcode.",
    example: "03600029145",
    rules: "11 digits (auto check digit) or 12 valid Mod-10 digits.",
  },
  UPCE: {
    label: "UPC-E",
    shortLabel: "UPC-E",
    description: "Zero-suppressed 8-digit UPC barcode for small packages.",
    example: "04210000526",
    rules: "6 compressed digits, 7 digits (NS 0/1 + 6), or 8 valid UPC-E digits.",
  },
  ITF14: {
    label: "ITF-14",
    shortLabel: "ITF-14",
    description: "Outer carton & pallet shipping barcode with optional bearer bars.",
    example: "1001234567890",
    rules: "13 digits (auto check digit) or 14 valid Mod-10 digits.",
  },
  CODABAR: {
    label: "Codabar",
    shortLabel: "Codabar",
    description: "Libraries, blood banks, courier airbills, and medical labs.",
    example: "123456-78",
    rules: "Digits 0–9 and - $ : / . + (A–D start/stop guards).",
  },
  GS1_128: {
    label: "GS1-128 (EAN-128)",
    shortLabel: "GS1-128",
    description: "Supply-chain barcode with FNC1 & Application Identifiers (GTIN, expiry, batch).",
    example: "(01)08901030895124(17)271231(10)B2026",
    rules: "Structured (AI)Value pairs such as (01)14-digit GTIN, (17)YYMMDD, (10)Batch.",
  },
};

export function escapeXml(unsafe: string): string {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function sanitizeHexColor(input: string | undefined, fallback: string): string {
  if (!input || typeof input !== "string") return fallback;
  const trimmed = input.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : fallback;
}

/**
 * CWE-1236 CSV/Spreadsheet formula injection sanitizer.
 * Also preserves leading zeros when exporting CSV/XLSX text identifiers.
 */
export function sanitizeSpreadsheetCell(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (!str) return "";
  const trimmedStart = str.replace(/^[\u0000-\u0020]+/, "");
  if (
    trimmedStart.startsWith("=") ||
    trimmedStart.startsWith("+") ||
    trimmedStart.startsWith("-") ||
    trimmedStart.startsWith("@") ||
    str.startsWith("\t") ||
    str.startsWith("\r")
  ) {
    return `'${str}`;
  }
  return str;
}

export function escapeCsvField(value: unknown): string {
  const safe = sanitizeSpreadsheetCell(value);
  if (safe.includes('"') || safe.includes(",") || safe.includes("\n") || safe.includes("\r")) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

/**
 * Standard GS1 Mod-10 check digit calculation (right-to-left alternating weights 3, 1, 3, 1...).
 */
export function computeGs1Mod10CheckDigit(digitsWithoutCheck: string): string {
  if (!/^\d+$/.test(digitsWithoutCheck)) {
    throw new Error("Mod-10 checksum requires numeric digits only.");
  }
  let sum = 0;
  let weight = 3;
  for (let i = digitsWithoutCheck.length - 1; i >= 0; i--) {
    sum += Number(digitsWithoutCheck[i]) * weight;
    weight = weight === 3 ? 1 : 3;
  }
  return String((10 - (sum % 10)) % 10);
}

// ---------------------------------------------------------------------------
// CODE 128 & GS1-128 TABLES (ISO/IEC 15417)
// ---------------------------------------------------------------------------
const CODE128_PATTERNS: string[] = [
  "11011001100", "11001101100", "11001100110", "10010011000", "10010001100",
  "10001001100", "10011001000", "10011000100", "10001100100", "11001001000",
  "11001000100", "11000100100", "10110011100", "10011011100", "10011001110",
  "10111001100", "10011101100", "10011100110", "11001110010", "11001011100",
  "11001001110", "11011100100", "11001110100", "11101101110", "11101001100",
  "11100101100", "11100100110", "11101100100", "11100110100", "11100110010",
  "11011011000", "11011000110", "11000110110", "10100011000", "10001011000",
  "10001000110", "10110001000", "10001101000", "10001100010", "11010001000",
  "11000101000", "11000100010", "10110111000", "10110001110", "10001101110",
  "10111011000", "10111000110", "10001110110", "11101110110", "11010001110",
  "11000101110", "11011101000", "11011100010", "11011101110", "11101011000",
  "11101000110", "11100010110", "11101101000", "11101100010", "11100011010",
  "11101111010", "11001000010", "11110001010", "10100110000", "10100001100",
  "10010110000", "10010000110", "10000101100", "10000100110", "10110010000",
  "10110000100", "10011010000", "10011000010", "10000110100", "10000110010",
  "11000010010", "11001010000", "11110111010", "11000010100", "10001111010",
  "10100111100", "10010111100", "10010011110", "10111100100", "10011110100",
  "10011110010", "11110100100", "11110010100", "11110010010", "11011011110",
  "11011110110", "11110110110", "10101111000", "10100011110", "10001011110",
  "10111101000", "10111100010", "11110101000", "11110100010", "10111011110",
  "10111101110", "11101011110", "11110101110", "11010000100", "11010010000",
  "11010011100",
];
const CODE128_STOP = "1100011101011";
const C128_CODE_C = 99;
const C128_CODE_B = 100;
const C128_FNC1 = 102;
const C128_START_B = 104;
const C128_START_C = 105;

function encodeCode128AutoValues(tokens: Array<{ type: "fnc1" } | { type: "text"; value: string }>): number[] {
  const rawChunks: Array<{ type: "fnc1" } | { type: "char"; code: number }> = [];
  for (const tok of tokens) {
    if (tok.type === "fnc1") {
      rawChunks.push({ type: "fnc1" });
    } else {
      for (let i = 0; i < tok.value.length; i++) {
        const ch = tok.value.charCodeAt(i);
        if (ch < 32 || ch > 126) {
          throw new Error(`Unsupported character "${tok.value[i]}" (ASCII ${ch}). Use printable ASCII characters (32–126).`);
        }
        rawChunks.push({ type: "char", code: ch });
      }
    }
  }

  // Count consecutive digits starting at idx (ignoring fnc1 which stays valid inside Code C!)
  const countDigitsAt = (idx: number): number => {
    let digits = 0;
    for (let i = idx; i < rawChunks.length; i++) {
      const c = rawChunks[i];
      if (c.type === "char" && c.code >= 48 && c.code <= 57) {
        digits++;
      } else {
        break;
      }
    }
    return digits;
  };

  const values: number[] = [];
  // Determine initial set: use Code C if starting with >= 4 digits (or >= 2 digits and entire body is even digits), or FNC1 followed by >= 4 digits
  let i = 0;
  let initialDigits = countDigitsAt(0);
  if (rawChunks[0]?.type === "fnc1") {
    initialDigits = countDigitsAt(1);
  }
  const allDigitsOnly = rawChunks.every((c) => c.type === "fnc1" || (c.type === "char" && c.code >= 48 && c.code <= 57));
  let mode: "B" | "C" = initialDigits >= 4 || (allDigitsOnly && initialDigits >= 2 && initialDigits % 2 === 0) ? "C" : "B";
  values.push(mode === "C" ? C128_START_C : C128_START_B);

  while (i < rawChunks.length) {
    const chunk = rawChunks[i];
    if (chunk.type === "fnc1") {
      values.push(C128_FNC1);
      i++;
      continue;
    }

    if (mode === "C") {
      const digits = countDigitsAt(i);
      if (digits >= 2) {
        const pairStr = String.fromCharCode(
          (rawChunks[i] as { type: "char"; code: number }).code,
          (rawChunks[i + 1] as { type: "char"; code: number }).code
        );
        values.push(Number(pairStr));
        i += 2;
      } else {
        values.push(C128_CODE_B);
        mode = "B";
      }
    } else {
      const digits = countDigitsAt(i);
      if (digits >= 4) {
        // If odd number of digits, emit one Code B digit first so remaining pairs align cleanly
        if (digits % 2 === 1) {
          values.push(chunk.code - 32);
          i++;
        }
        values.push(C128_CODE_C);
        mode = "C";
      } else {
        values.push(chunk.code - 32);
        i++;
      }
    }
  }

  // Mod-103 checksum
  let sum = values[0];
  for (let idx = 1; idx < values.length; idx++) {
    sum += values[idx] * idx;
  }
  values.push(sum % 103);
  return values;
}

function buildCode128ModulesFromValues(values: number[]): string {
  return values.map((v) => CODE128_PATTERNS[v]).join("") + CODE128_STOP;
}

function verifyCode128Modules(modules: string, expectedValues: number[]): boolean {
  if (!modules.endsWith(CODE128_STOP)) return false;
  const body = modules.slice(0, modules.length - CODE128_STOP.length);
  if (body.length !== expectedValues.length * 11) return false;

  const decodedValues: number[] = [];
  for (let i = 0; i < body.length; i += 11) {
    const slice = body.slice(i, i + 11);
    const val = CODE128_PATTERNS.indexOf(slice);
    if (val === -1) return false;
    decodedValues.push(val);
  }
  if (decodedValues.length < 3) return false;
  const checkIndex = decodedValues.length - 1;
  let sum = decodedValues[0];
  for (let idx = 1; idx < checkIndex; idx++) {
    sum += decodedValues[idx] * idx;
  }
  return sum % 103 === decodedValues[checkIndex];
}

// ---------------------------------------------------------------------------
// GS1-128 APPLICATION IDENTIFIER PARSER
// ---------------------------------------------------------------------------
interface Gs1AiSpec {
  title: string;
  fixedLength?: number;
  minLength?: number;
  maxLength?: number;
  numericOnly?: boolean;
  validateMod10?: boolean;
  validateDateYYMMDD?: boolean;
}

const KNOWN_GS1_AIS: Record<string, Gs1AiSpec> = {
  "00": { title: "SSCC", fixedLength: 18, numericOnly: true, validateMod10: true },
  "01": { title: "GTIN", fixedLength: 14, numericOnly: true, validateMod10: true },
  "02": { title: "CONTENT GTIN", fixedLength: 14, numericOnly: true, validateMod10: true },
  "10": { title: "BATCH/LOT", minLength: 1, maxLength: 20 },
  "11": { title: "PROD DATE", fixedLength: 6, numericOnly: true, validateDateYYMMDD: true },
  "13": { title: "PACK DATE", fixedLength: 6, numericOnly: true, validateDateYYMMDD: true },
  "15": { title: "BEST BEFORE", fixedLength: 6, numericOnly: true, validateDateYYMMDD: true },
  "17": { title: "EXPIRY DATE", fixedLength: 6, numericOnly: true, validateDateYYMMDD: true },
  "20": { title: "VARIANT", fixedLength: 2, numericOnly: true },
  "21": { title: "SERIAL", minLength: 1, maxLength: 20 },
  "30": { title: "VAR COUNT", minLength: 1, maxLength: 8, numericOnly: true },
  "37": { title: "COUNT", minLength: 1, maxLength: 8, numericOnly: true },
  "310": { title: "NET WEIGHT KG", fixedLength: 7, numericOnly: true }, // 310n + 6 digits
  "400": { title: "ORDER NUMBER", minLength: 1, maxLength: 30 },
  "410": { title: "SHIP TO LOC", fixedLength: 13, numericOnly: true, validateMod10: true },
  "420": { title: "SHIP TO POST", minLength: 1, maxLength: 20 },
  "8008": { title: "PROD TIME", minLength: 8, maxLength: 12, numericOnly: true },
};

function isFixedLengthGs1Ai(ai: string): boolean {
  if (ai.length === 2 && ["00", "01", "02", "03", "04", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"].includes(ai)) {
    return true;
  }
  if (ai.length === 4 && /^3[1-6]\d\d$/.test(ai)) return true;
  if (ai.length === 3 && ["410", "411", "412", "413", "414", "415", "416", "417"].includes(ai)) return true;
  return false;
}

export function parseGs1_128Input(rawInput: string): {
  segments: Array<{ ai: string; value: string; title: string; fixedLength: boolean }>;
  displayText: string;
  tokens: Array<{ type: "fnc1" } | { type: "text"; value: string }>;
} {
  const input = rawInput.trim();
  if (!input) {
    throw new Error("GS1-128 requires at least one Application Identifier, e.g. (01)08901030895124(17)271231(10)B01.");
  }
  if (!input.startsWith("(")) {
    throw new Error("Format GS1-128 with parenthesized Application Identifiers, e.g. (01)08901030895124(10)LOT42.");
  }

  const aiRegex = /\((\d{2,4})\)([^()]+)/g;
  const segments: Array<{ ai: string; value: string; title: string; fixedLength: boolean }> = [];
  let consumedLength = 0;
  let match: RegExpExecArray | null;

  while ((match = aiRegex.exec(input)) !== null) {
    if (match.index !== consumedLength) {
      throw new Error("Invalid GS1-128 syntax. Every segment must follow (AI)Value format with no loose text.");
    }
    consumedLength += match[0].length;
    const ai = match[1];
    const value = match[2];

    const spec = KNOWN_GS1_AIS[ai] || (ai.startsWith("310") && ai.length === 4 ? { title: "NET WEIGHT KG", fixedLength: 6, numericOnly: true } : undefined);
    if (spec) {
      if (spec.fixedLength !== undefined && value.length !== spec.fixedLength) {
        throw new Error(`GS1 AI (${ai}) ${spec.title} must be exactly ${spec.fixedLength} characters (got ${value.length}).`);
      }
      if (spec.minLength !== undefined && value.length < spec.minLength) {
        throw new Error(`GS1 AI (${ai}) ${spec.title} requires at least ${spec.minLength} characters.`);
      }
      if (spec.maxLength !== undefined && value.length > spec.maxLength) {
        throw new Error(`GS1 AI (${ai}) ${spec.title} supports at most ${spec.maxLength} characters.`);
      }
      if (spec.numericOnly && !/^\d+$/.test(value)) {
        throw new Error(`GS1 AI (${ai}) ${spec.title} must contain numeric digits only.`);
      }
      if (spec.validateMod10) {
        const expected = computeGs1Mod10CheckDigit(value.slice(0, -1));
        if (value[value.length - 1] !== expected) {
          throw new Error(`GS1 AI (${ai}) ${spec.title} failed Mod-10 check digit validation (expected trailing digit ${expected}).`);
        }
      }
      if (spec.validateDateYYMMDD) {
        const mm = Number(value.slice(2, 4));
        const dd = Number(value.slice(4, 6));
        if (mm < 1 || mm > 12 || dd < 0 || dd > 31) {
          throw new Error(`GS1 AI (${ai}) ${spec.title} has invalid YYMMDD date "${value}".`);
        }
      }
    }

    segments.push({
      ai,
      value,
      title: spec?.title || `AI ${ai}`,
      fixedLength: isFixedLengthGs1Ai(ai),
    });
  }

  if (consumedLength !== input.length || segments.length === 0) {
    throw new Error("Incomplete GS1-128 Application Identifier sequence. Example: (01)08901030895124(10)BATCH01");
  }

  // GS1-128 mandates leading FNC1, plus FNC1 separator after variable-length fields before another AI
  const tokens: Array<{ type: "fnc1" } | { type: "text"; value: string }> = [{ type: "fnc1" }];
  segments.forEach((seg, index) => {
    tokens.push({ type: "text", value: `${seg.ai}${seg.value}` });
    if (!seg.fixedLength && index < segments.length - 1) {
      tokens.push({ type: "fnc1" });
    }
  });

  const displayText = segments.map((s) => `(${s.ai})${s.value}`).join("");
  return { segments, displayText, tokens };
}

// ---------------------------------------------------------------------------
// CODE 39 TABLE (3 wide of 9 elements, wide = '111' / narrow = '1' -> wait 2.5x/3x -> standard 3:1 integer modules)
// Standard 12-module Code 39 character pattern (width 1 for narrow, 3 for wide) + 1 narrow intercharacter gap ('0')
// ---------------------------------------------------------------------------
const CODE39_WEIGHTS: Record<string, string> = {
  "0": "nnnwwnwnn", "1": "wnnwnnnnw", "2": "nnwwnnnnw", "3": "wnwwnnnnn",
  "4": "nnnwwnnnw", "5": "wnnwwnnnn", "6": "nnwwwnnnn", "7": "nnnwnnwnw",
  "8": "wnnwnnwnn", "9": "nnwwnnwnn", "A": "wnnnnwnnw", "B": "nnwnnwnnw",
  "C": "wnwnnwnnn", "D": "nnnnwwnnw", "E": "wnnnwwnnn", "F": "nnwnwwnnn",
  "G": "nnnnnwwnw", "H": "wnnnnwwnn", "I": "nnwnnwwnn", "J": "nnnnwwwnn",
  "K": "wnnnnnnww", "L": "nnwnnnnww", "M": "wnwnnnnwn", "N": "nnnnwnnww",
  "O": "wnnnwnnwn", "P": "nnwnwnnwn", "Q": "nnnnnnwww", "R": "wnnnnnwwn",
  "S": "nnwnnnwwn", "T": "nnnnwnwwn", "U": "wwnnnnnnw", "V": "nwwnnnnnw",
  "W": "wwwnnnnnn", "X": "nwnnwnnnw", "Y": "wwnnwnnnn", "Z": "nwwnwnnnn",
  "-": "nwnnnnwnw", ".": "wwnnnnwnn", " ": "nwwnnnwnn", "$": "nwnwnwnnn",
  "/": "nwnwnnnwn", "+": "nwnnnwnwn", "%": "nnnwnwnwn", "*": "nwnnwnwnn",
};
const CODE39_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%";

function patternCode39ToModules(pattern9: string): string {
  let out = "";
  for (let i = 0; i < pattern9.length; i++) {
    const bit = i % 2 === 0 ? "1" : "0";
    out += pattern9[i] === "w" ? bit.repeat(3) : bit;
  }
  return out;
}

function encodeCode39(raw: string, includeChecksum: boolean): { modules: string; normalized: string; displayText: string; checkDigit?: string } {
  const upper = raw.toUpperCase();
  if (!upper.length) throw new Error("Code 39 input cannot be empty.");
  // Strip user-provided surrounding asterisks so we normalize consistently
  const core = upper.startsWith("*") && upper.endsWith("*") && upper.length >= 2 ? upper.slice(1, -1) : upper;
  if (!core.length) throw new Error("Code 39 payload cannot be empty.");

  for (const ch of core) {
    if (!CODE39_ALPHABET.includes(ch)) {
      throw new Error(`Invalid Code 39 character "${ch}". Allowed: 0-9, A-Z, -, ., space, $, /, +, %.`);
    }
  }

  let checkDigit: string | undefined;
  let fullCore = core;
  if (includeChecksum) {
    let sum = 0;
    for (const ch of core) {
      sum += CODE39_ALPHABET.indexOf(ch);
    }
    checkDigit = CODE39_ALPHABET[sum % 43];
    fullCore = core + checkDigit;
  }

  const withGuards = `*${fullCore}*`;
  const modules = Array.from(withGuards)
    .map((ch) => patternCode39ToModules(CODE39_WEIGHTS[ch]))
    .join("0");

  return {
    modules,
    normalized: fullCore,
    displayText: `*${fullCore}*`,
    checkDigit,
  };
}

// ---------------------------------------------------------------------------
// EAN-13, EAN-8, UPC-A, UPC-E TABLES (ISO/IEC 15420)
// ---------------------------------------------------------------------------
const EAN_L = [
  "0001101", "0011001", "0010011", "0111101", "0100011",
  "0110001", "0101111", "0111011", "0110111", "0001011",
];
const EAN_G = [
  "0100111", "0110011", "0011011", "0100001", "0011101",
  "0111001", "0000101", "0010001", "0001001", "0010111",
];
const EAN_R = [
  "1110010", "1100110", "1101100", "1000010", "1011100",
  "1001110", "1010000", "1000100", "1001000", "1110100",
];
const EAN13_PARITY = [
  "LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG",
  "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL",
];
const UPCE_PARITY_NS0 = [
  "GGGLLL", "GGLGLL", "GGLLGL", "GGLLLG", "GLGGLL",
  "GLLGGL", "GLLLGG", "GLGLGL", "GLGLLG", "GLLGLG",
];
const UPCE_PARITY_NS1 = [
  "LLLGGG", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG",
  "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL",
];

function encodeEan13(raw: string): { modules: string; normalized: string; checkDigit: string } {
  const digits = raw.trim();
  if (!/^\d{12,13}$/.test(digits)) {
    throw new Error("EAN-13 requires 12 digits (auto check digit) or 13 numeric digits.");
  }
  const base12 = digits.slice(0, 12);
  const checkDigit = computeGs1Mod10CheckDigit(base12);
  if (digits.length === 13 && digits[12] !== checkDigit) {
    throw new Error(`Invalid EAN-13 check digit: got ${digits[12]}, expected ${checkDigit}.`);
  }
  const full13 = base12 + checkDigit;
  const parity = EAN13_PARITY[Number(full13[0])];

  let left = "";
  for (let i = 0; i < 6; i++) {
    const d = Number(full13[i + 1]);
    left += parity[i] === "L" ? EAN_L[d] : EAN_G[d];
  }
  let right = "";
  for (let i = 7; i < 13; i++) {
    right += EAN_R[Number(full13[i])];
  }
  return {
    modules: `101${left}01010${right}101`,
    normalized: full13,
    checkDigit,
  };
}

function encodeEan8(raw: string): { modules: string; normalized: string; checkDigit: string } {
  const digits = raw.trim();
  if (!/^\d{7,8}$/.test(digits)) {
    throw new Error("EAN-8 requires 7 digits (auto check digit) or 8 numeric digits.");
  }
  const base7 = digits.slice(0, 7);
  const checkDigit = computeGs1Mod10CheckDigit(base7);
  if (digits.length === 8 && digits[7] !== checkDigit) {
    throw new Error(`Invalid EAN-8 check digit: got ${digits[7]}, expected ${checkDigit}.`);
  }
  const full8 = base7 + checkDigit;
  let left = "";
  for (let i = 0; i < 4; i++) left += EAN_L[Number(full8[i])];
  let right = "";
  for (let i = 4; i < 8; i++) right += EAN_R[Number(full8[i])];
  return {
    modules: `101${left}01010${right}101`,
    normalized: full8,
    checkDigit,
  };
}

function encodeUpca(raw: string): { modules: string; normalized: string; checkDigit: string } {
  const digits = raw.trim();
  if (!/^\d{11,12}$/.test(digits)) {
    throw new Error("UPC-A requires 11 digits (auto check digit) or 12 numeric digits.");
  }
  const base11 = digits.slice(0, 11);
  const checkDigit = computeGs1Mod10CheckDigit(base11);
  if (digits.length === 12 && digits[11] !== checkDigit) {
    throw new Error(`Invalid UPC-A check digit: got ${digits[11]}, expected ${checkDigit}.`);
  }
  const full12 = base11 + checkDigit;
  let left = "";
  for (let i = 0; i < 6; i++) left += EAN_L[Number(full12[i])];
  let right = "";
  for (let i = 6; i < 12; i++) right += EAN_R[Number(full12[i])];
  return {
    modules: `101${left}01010${right}101`,
    normalized: full12,
    checkDigit,
  };
}

export function expandUpceToUpcaBase(nsAndSix: string): string {
  const ns = nsAndSix[0];
  const d1 = nsAndSix[1];
  const d2 = nsAndSix[2];
  const d3 = nsAndSix[3];
  const d4 = nsAndSix[4];
  const d5 = nsAndSix[5];
  const d6 = nsAndSix[6];

  if (d6 === "0" || d6 === "1" || d6 === "2") {
    return `${ns}${d1}${d2}${d6}0000${d3}${d4}${d5}`;
  }
  if (d6 === "3") {
    return `${ns}${d1}${d2}${d3}00000${d4}${d5}`;
  }
  if (d6 === "4") {
    return `${ns}${d1}${d2}${d3}${d4}00000${d5}`;
  }
  return `${ns}${d1}${d2}${d3}${d4}${d5}0000${d6}`;
}

function encodeUpce(raw: string): { modules: string; normalized: string; checkDigit: string } {
  const digits = raw.trim();
  if (!/^\d{6,8}$/.test(digits)) {
    throw new Error("UPC-E requires 6 digits (data), 7 digits (number system 0/1 + 6 digits), or 8 full UPC-E digits.");
  }

  let nsAndSix: string;
  let providedCheck: string | null = null;

  if (digits.length === 6) {
    nsAndSix = `0${digits}`;
  } else if (digits.length === 7) {
    if (digits[0] !== "0" && digits[0] !== "1") {
      throw new Error("UPC-E number system (first digit) must be 0 or 1.");
    }
    nsAndSix = digits;
  } else {
    if (digits[0] !== "0" && digits[0] !== "1") {
      throw new Error("UPC-E number system (first digit) must be 0 or 1.");
    }
    nsAndSix = digits.slice(0, 7);
    providedCheck = digits[7];
  }

  const expanded11 = expandUpceToUpcaBase(nsAndSix);
  const checkDigit = computeGs1Mod10CheckDigit(expanded11);
  if (providedCheck !== null && providedCheck !== checkDigit) {
    throw new Error(`Invalid UPC-E check digit: got ${providedCheck}, expected ${checkDigit}.`);
  }

  const full8 = `${nsAndSix}${checkDigit}`;
  const parityPattern = nsAndSix[0] === "0" ? UPCE_PARITY_NS0[Number(checkDigit)] : UPCE_PARITY_NS1[Number(checkDigit)];

  let middle = "";
  for (let i = 0; i < 6; i++) {
    const d = Number(nsAndSix[i + 1]);
    middle += parityPattern[i] === "L" ? EAN_L[d] : EAN_G[d];
  }

  return {
    modules: `101${middle}010101`,
    normalized: full8,
    checkDigit,
  };
}

// ---------------------------------------------------------------------------
// ITF-14 (Interleaved 2 of 5)
// ---------------------------------------------------------------------------
const ITF_PATTERNS: string[] = [
  "nnwwn", // 0
  "wnnnw", // 1
  "nwnnw", // 2
  "wwnnn", // 3
  "nnwnw", // 4
  "wnwnn", // 5
  "nwwnn", // 6
  "nnnww", // 7
  "wnnwn", // 8
  "nwnwn", // 9
];

function encodeItf14(raw: string): { modules: string; normalized: string; checkDigit: string } {
  const digits = raw.trim();
  if (!/^\d{13,14}$/.test(digits)) {
    throw new Error("ITF-14 requires 13 digits (auto check digit) or 14 numeric digits.");
  }
  const base13 = digits.slice(0, 13);
  const checkDigit = computeGs1Mod10CheckDigit(base13);
  if (digits.length === 14 && digits[13] !== checkDigit) {
    throw new Error(`Invalid ITF-14 check digit: got ${digits[13]}, expected ${checkDigit}.`);
  }
  const full14 = base13 + checkDigit;
  // Start pattern: 1010, Stop pattern: 11101 (wide bar = 3)
  let modules = "1010";
  for (let i = 0; i < 14; i += 2) {
    const barPat = ITF_PATTERNS[Number(full14[i])];
    const spacePat = ITF_PATTERNS[Number(full14[i + 1])];
    for (let k = 0; k < 5; k++) {
      modules += barPat[k] === "w" ? "111" : "1";
      modules += spacePat[k] === "w" ? "000" : "0";
    }
  }
  modules += "11101";
  return { modules, normalized: full14, checkDigit };
}

// ---------------------------------------------------------------------------
// CODABAR
// ---------------------------------------------------------------------------
const CODABAR_PATTERNS: Record<string, string> = {
  "0": "101010011", "1": "101011001", "2": "101001011", "3": "110010101",
  "4": "101101001", "5": "110101001", "6": "100101011", "7": "100101101",
  "8": "100110101", "9": "110100101", "-": "101001101", "$": "101100101",
  ":": "1101011011", "/": "1101101011", ".": "1101101101", "+": "1011011011",
  A: "1011001001", B: "1001001011", C: "1010010011", D: "1010011001",
};

function encodeCodabar(
  raw: string,
  defaultStart: "A" | "B" | "C" | "D",
  defaultStop: "A" | "B" | "C" | "D"
): { modules: string; normalized: string; displayText: string } {
  let clean = raw.trim().toUpperCase();
  if (!clean) throw new Error("Codabar input cannot be empty.");

  let start = defaultStart;
  let stop = defaultStop;
  if (/^[ABCD].*[ABCD]$/.test(clean) && clean.length >= 3) {
    start = clean[0] as "A" | "B" | "C" | "D";
    stop = clean[clean.length - 1] as "A" | "B" | "C" | "D";
    clean = clean.slice(1, -1);
  } else if (/^[ABCD]/.test(clean) || /[ABCD]$/.test(clean)) {
    throw new Error("If specifying Codabar start/stop guards (A–D), provide both start and stop guards (e.g. A12345B).");
  }

  if (!/^[0-9\-$:\/.+]+$/.test(clean)) {
    throw new Error("Codabar payload allows digits 0–9 and symbols - $ : / . +");
  }

  const full = `${start}${clean}${stop}`;
  const modules = Array.from(full).map((ch) => CODABAR_PATTERNS[ch]).join("0");
  return { modules, normalized: full, displayText: clean };
}

// ---------------------------------------------------------------------------
// SELF-VERIFICATION GUARD (ensures no invalid barcode returns valid: true)
// ---------------------------------------------------------------------------
function verifyBarcodeIntegrity(result: Omit<BarcodeResult, "valid" | "svgMarkup">): boolean {
  if (!result.modules || !/^[01]+$/.test(result.modules)) return false;
  if (result.totalModules !== result.modules.length) return false;

  switch (result.symbology) {
    case "CODE128":
    case "GS1_128":
      return Boolean(result.metadata?.code128Values && verifyCode128Modules(result.modules, result.metadata.code128Values));
    case "CODE39": {
      const star = patternCode39ToModules(CODE39_WEIGHTS["*"]);
      return result.modules.startsWith(star + "0") && result.modules.endsWith("0" + star);
    }
    case "EAN13":
      return result.modules.length === 95 && result.modules.startsWith("101") && result.modules.slice(45, 50) === "01010" && result.modules.endsWith("101") && result.normalizedValue.length === 13;
    case "EAN8":
      return result.modules.length === 67 && result.modules.startsWith("101") && result.modules.slice(31, 36) === "01010" && result.modules.endsWith("101") && result.normalizedValue.length === 8;
    case "UPCA":
      return result.modules.length === 95 && result.modules.startsWith("101") && result.modules.slice(45, 50) === "01010" && result.modules.endsWith("101") && result.normalizedValue.length === 12;
    case "UPCE":
      return result.modules.length === 51 && result.modules.startsWith("101") && result.modules.endsWith("010101") && result.normalizedValue.length === 8;
    case "ITF14":
      return result.modules.startsWith("1010") && result.modules.endsWith("11101") && result.normalizedValue.length === 14;
    case "CODABAR":
      return result.modules.length >= 29;
    default:
      return false;
  }
}

function modulesToBarRuns(modules: string): Array<{ x: number; w: number }> {
  const runs: Array<{ x: number; w: number }> = [];
  let i = 0;
  while (i < modules.length) {
    if (modules[i] === "1") {
      const start = i;
      while (i < modules.length && modules[i] === "1") i++;
      runs.push({ x: start, w: i - start });
    } else {
      i++;
    }
  }
  return runs;
}

function buildBarcodeSvg(params: {
  modules: string;
  symbology: BarcodeSymbology;
  displayText: string;
  customLabel?: string;
  barWidth: number;
  height: number;
  quietZoneModules: number;
  foreground: string;
  background: string;
  showText: boolean;
  fontSize: number;
  textMargin: number;
  itfBearerBars: boolean;
}): { svgMarkup: string; width: number; totalHeight: number; quietZonePx: number } {
  const {
    modules,
    symbology,
    displayText,
    customLabel,
    barWidth,
    height,
    quietZoneModules,
    foreground,
    background,
    showText,
    fontSize,
    textMargin,
    itfBearerBars,
  } = params;

  const quietZonePx = quietZoneModules * barWidth;
  const barcodeWidthPx = modules.length * barWidth;
  const width = barcodeWidthPx + quietZonePx * 2;
  const hasLabel = Boolean(customLabel && customLabel.trim());
  const topLabelSpace = hasLabel ? Math.round(fontSize * 1.45) + 6 : 0;
  const bearerPad = symbology === "ITF14" && itfBearerBars ? Math.max(4, barWidth * 2) : 0;
  const bottomTextSpace = showText ? fontSize + textMargin + 8 : 0;
  const totalHeight = topLabelSpace + bearerPad * 2 + height + bottomTextSpace;
  const barTopY = topLabelSpace + bearerPad;

  const isGuardUpcEan = symbology === "EAN13" || symbology === "EAN8" || symbology === "UPCA" || symbology === "UPCE";
  const runs = modulesToBarRuns(modules);

  const rects = runs
    .map((run) => {
      let extraH = 0;
      if (isGuardUpcEan && showText) {
        const modIdx = run.x;
        const len = modules.length;
        const isLeftGuard = modIdx < 3;
        const isRightGuard = modIdx >= len - (symbology === "UPCE" ? 6 : 3);
        const centerStart = Math.floor(len / 2) - 2;
        const isCenterGuard = symbology !== "UPCE" && modIdx >= centerStart && modIdx < centerStart + 5;
        if (isLeftGuard || isRightGuard || isCenterGuard) {
          extraH = Math.min(8, Math.round(fontSize * 0.45));
        }
      }
      const rx = quietZonePx + run.x * barWidth;
      const rw = run.w * barWidth;
      return `<rect x="${rx}" y="${barTopY}" width="${rw}" height="${height + extraH}" fill="${foreground}"/>`;
    })
    .join("");

  const bearerRects =
    symbology === "ITF14" && itfBearerBars
      ? `<rect x="${Math.max(0, quietZonePx - bearerPad * 2)}" y="${topLabelSpace}" width="${barcodeWidthPx + bearerPad * 4}" height="${bearerPad}" fill="${foreground}"/>` +
        `<rect x="${Math.max(0, quietZonePx - bearerPad * 2)}" y="${barTopY + height}" width="${barcodeWidthPx + bearerPad * 4}" height="${bearerPad}" fill="${foreground}"/>`
      : "";

  const labelEl = hasLabel
    ? `<text x="${width / 2}" y="${Math.round(fontSize * 1.05)}" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="700" fill="${foreground}">${escapeXml(customLabel!.trim())}</text>`
    : "";

  const textEl = showText
    ? `<text x="${width / 2}" y="${barTopY + height + textMargin + fontSize}" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="${fontSize}" font-weight="600" letter-spacing="1" fill="${foreground}">${escapeXml(displayText)}</text>`
    : "";

  const svgMarkup =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}" role="img" aria-label="${escapeXml(symbology)} barcode ${escapeXml(displayText)}">` +
    `<rect x="0" y="0" width="${width}" height="${totalHeight}" fill="${background}"/>` +
    labelEl +
    bearerRects +
    rects +
    textEl +
    `</svg>`;

  return { svgMarkup, width, totalHeight, quietZonePx };
}

/**
 * Generates and strictly self-verifies a 1D barcode for any supported symbology.
 */
export function generateBarcode(inputValue: string, options: BarcodeGenerationOptions): BarcodeResult {
  const symbology = options.symbology;
  const barWidth = Math.min(6, Math.max(1, Math.round(options.barWidth ?? 2)));
  const height = Math.min(320, Math.max(32, Math.round(options.height ?? 96)));
  const quietZoneModules = Math.min(24, Math.max(10, Math.round(options.quietZoneModules ?? 10)));
  const foreground = sanitizeHexColor(options.foreground, "#0f172a");
  const background = sanitizeHexColor(options.background, "#ffffff");
  const showText = options.showText ?? true;
  const fontSize = Math.min(28, Math.max(10, Math.round(options.fontSize ?? 14)));
  const textMargin = Math.min(20, Math.max(2, Math.round(options.textMargin ?? 6)));
  const itfBearerBars = options.itfBearerBars ?? true;

  try {
    let modules = "";
    let normalizedValue = inputValue.trim();
    let displayText = normalizedValue;
    let checkDigit: string | undefined;
    let metadata: BarcodeResult["metadata"];

    switch (symbology) {
      case "CODE128": {
        if (!inputValue || !inputValue.trim()) {
          throw new Error("Code 128 input cannot be empty.");
        }
        const raw = inputValue;
        const values = encodeCode128AutoValues([{ type: "text", value: raw }]);
        modules = buildCode128ModulesFromValues(values);
        normalizedValue = raw;
        displayText = raw;
        metadata = { code128Values: values };
        break;
      }
      case "GS1_128": {
        const parsed = parseGs1_128Input(inputValue);
        const values = encodeCode128AutoValues(parsed.tokens);
        modules = buildCode128ModulesFromValues(values);
        normalizedValue = parsed.displayText;
        displayText = parsed.displayText;
        metadata = {
          aiSegments: parsed.segments.map((s) => ({ ai: s.ai, value: s.value, title: s.title })),
          code128Values: values,
        };
        break;
      }
      case "CODE39": {
        const res = encodeCode39(inputValue, Boolean(options.includeChecksum));
        modules = res.modules;
        normalizedValue = res.normalized;
        displayText = res.displayText;
        checkDigit = res.checkDigit;
        break;
      }
      case "EAN13": {
        const res = encodeEan13(inputValue);
        modules = res.modules;
        normalizedValue = res.normalized;
        displayText = res.normalized;
        checkDigit = res.checkDigit;
        break;
      }
      case "EAN8": {
        const res = encodeEan8(inputValue);
        modules = res.modules;
        normalizedValue = res.normalized;
        displayText = res.normalized;
        checkDigit = res.checkDigit;
        break;
      }
      case "UPCA": {
        const res = encodeUpca(inputValue);
        modules = res.modules;
        normalizedValue = res.normalized;
        displayText = res.normalized;
        checkDigit = res.checkDigit;
        break;
      }
      case "UPCE": {
        const res = encodeUpce(inputValue);
        modules = res.modules;
        normalizedValue = res.normalized;
        displayText = res.normalized;
        checkDigit = res.checkDigit;
        break;
      }
      case "ITF14": {
        const res = encodeItf14(inputValue);
        modules = res.modules;
        normalizedValue = res.normalized;
        displayText = res.normalized;
        checkDigit = res.checkDigit;
        break;
      }
      case "CODABAR": {
        const res = encodeCodabar(
          inputValue,
          options.codabarStart || "A",
          options.codabarStop || "B"
        );
        modules = res.modules;
        normalizedValue = res.normalized;
        displayText = res.displayText;
        break;
      }
      default:
        throw new Error(`Unsupported symbology: ${String(symbology)}`);
    }

    const svgRes = buildBarcodeSvg({
      modules,
      symbology,
      displayText,
      customLabel: options.customLabel,
      barWidth,
      height,
      quietZoneModules,
      foreground,
      background,
      showText,
      fontSize,
      textMargin,
      itfBearerBars,
    });

    const candidate = {
      symbology,
      inputValue,
      normalizedValue,
      displayText,
      checkDigit,
      modules,
      totalModules: modules.length,
      width: svgRes.width,
      height: svgRes.totalHeight,
      quietZonePx: svgRes.quietZonePx,
      metadata,
    };

    const isVerified = verifyBarcodeIntegrity(candidate);
    if (!isVerified) {
      return {
        ...candidate,
        valid: false,
        svgMarkup: "",
        error: "Internal barcode integrity verification failed.",
      };
    }

    return {
      ...candidate,
      valid: true,
      svgMarkup: svgRes.svgMarkup,
    };
  } catch (err: any) {
    return {
      valid: false,
      symbology,
      inputValue,
      normalizedValue: "",
      displayText: "",
      modules: "",
      totalModules: 0,
      width: 0,
      height: 0,
      quietZonePx: 0,
      svgMarkup: "",
      error: err?.message || "Invalid barcode input.",
    };
  }
}

/**
 * Renders a verified BarcodeResult onto a high-DPI HTML Canvas (browser context).
 */
export function drawBarcodeToCanvas(
  canvas: HTMLCanvasElement,
  result: BarcodeResult,
  options: BarcodeGenerationOptions,
  scale = 2
): void {
  if (!result.valid || !result.modules) {
    throw new Error("Cannot render invalid barcode to canvas.");
  }

  const barWidth = Math.min(6, Math.max(1, Math.round(options.barWidth ?? 2)));
  const height = Math.min(320, Math.max(32, Math.round(options.height ?? 96)));
  const quietZoneModules = Math.min(24, Math.max(10, Math.round(options.quietZoneModules ?? 10)));
  const foreground = sanitizeHexColor(options.foreground, "#0f172a");
  const background = sanitizeHexColor(options.background, "#ffffff");
  const showText = options.showText ?? true;
  const fontSize = Math.min(28, Math.max(10, Math.round(options.fontSize ?? 14)));
  const textMargin = Math.min(20, Math.max(2, Math.round(options.textMargin ?? 6)));
  const itfBearerBars = options.itfBearerBars ?? true;

  const hasLabel = Boolean(options.customLabel && options.customLabel.trim());
  const topLabelSpace = hasLabel ? Math.round(fontSize * 1.45) + 6 : 0;
  const bearerPad = result.symbology === "ITF14" && itfBearerBars ? Math.max(4, barWidth * 2) : 0;
  const barTopY = topLabelSpace + bearerPad;

  canvas.width = result.width * scale;
  canvas.height = result.height * scale;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable.");

  ctx.save();
  ctx.scale(scale, scale);

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, result.width, result.height);

  ctx.fillStyle = foreground;
  if (hasLabel) {
    ctx.font = `700 ${fontSize}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(options.customLabel!.trim(), result.width / 2, Math.round(fontSize * 1.05));
  }

  const barcodeWidthPx = result.modules.length * barWidth;
  if (result.symbology === "ITF14" && itfBearerBars) {
    const bx = Math.max(0, result.quietZonePx - bearerPad * 2);
    const bw = barcodeWidthPx + bearerPad * 4;
    ctx.fillRect(bx, topLabelSpace, bw, bearerPad);
    ctx.fillRect(bx, barTopY + height, bw, bearerPad);
  }

  const isGuardUpcEan =
    result.symbology === "EAN13" ||
    result.symbology === "EAN8" ||
    result.symbology === "UPCA" ||
    result.symbology === "UPCE";

  for (const run of modulesToBarRuns(result.modules)) {
    let extraH = 0;
    if (isGuardUpcEan && showText) {
      const modIdx = run.x;
      const len = result.modules.length;
      const isLeftGuard = modIdx < 3;
      const isRightGuard = modIdx >= len - (result.symbology === "UPCE" ? 6 : 3);
      const centerStart = Math.floor(len / 2) - 2;
      const isCenterGuard = result.symbology !== "UPCE" && modIdx >= centerStart && modIdx < centerStart + 5;
      if (isLeftGuard || isRightGuard || isCenterGuard) {
        extraH = Math.min(8, Math.round(fontSize * 0.45));
      }
    }
    ctx.fillRect(result.quietZonePx + run.x * barWidth, barTopY, run.w * barWidth, height + extraH);
  }

  if (showText) {
    ctx.font = `600 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(result.displayText, result.width / 2, barTopY + height + textMargin + fontSize);
  }

  ctx.restore();
}
