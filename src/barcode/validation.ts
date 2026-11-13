/**
 * PDFSun Barcode Studio — Validation & Mathematical Check Digit Engine
 * Strictly conforms to GS1 General Specifications, ISO/IEC 15420, ISO/IEC 15417
 */

import { SymbologyType, ValidationResult, SYMBOLOGY_CATALOG } from "./types";

/**
 * Calculates GS1 standard Modulo-10 check digit.
 * Algorithm:
 * 1. Multiply digits from right to left alternately by 3 and 1 (first digit from right gets weight 3).
 * 2. Sum the products.
 * 3. The check digit is the smallest number which, when added to the sum, produces a multiple of 10.
 */
export function calculateGs1Mod10(digitsOnly: string): string {
  const digits = digitsOnly.replace(/\D/g, "");
  let sum = 0;
  let weight = 3;

  for (let i = digits.length - 1; i >= 0; i--) {
    const digit = parseInt(digits[i], 10);
    sum += digit * weight;
    weight = weight === 3 ? 1 : 3;
  }

  const remainder = sum % 10;
  return remainder === 0 ? "0" : (10 - remainder).toString();
}

/**
 * Verifies if the last digit of a GS1 number matches its computed Mod10 check digit.
 */
export function verifyGs1Mod10(fullCode: string): boolean {
  const digits = fullCode.replace(/\D/g, "");
  if (digits.length < 2) return false;
  const payload = digits.slice(0, -1);
  const providedCheck = digits.slice(-1);
  const expectedCheck = calculateGs1Mod10(payload);
  return providedCheck === expectedCheck;
}

/**
 * Calculates Code 39 Modulo-43 checksum character.
 */
export function calculateCode39Mod43(text: string): string {
  const CHAR_SET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%";
  let sum = 0;
  const upper = text.toUpperCase().replace(/\*/g, "");
  for (const char of upper) {
    const val = CHAR_SET.indexOf(char);
    if (val >= 0) {
      sum += val;
    }
  }
  const rem = sum % 43;
  return CHAR_SET[rem];
}

/**
 * Parses and validates GS1-128 Application Identifiers.
 */
export interface Gs1AiDef {
  ai: string;
  name: string;
  fixedLength?: number;
  minLength?: number;
  maxLength?: number;
  isNumericOnly: boolean;
}

export const GS1_KNOWN_AIS: Record<string, Gs1AiDef> = {
  "00": { ai: "00", name: "SSCC (Serial Shipping Container Code)", fixedLength: 18, isNumericOnly: true },
  "01": { ai: "01", name: "GTIN (Global Trade Item Number)", fixedLength: 14, isNumericOnly: true },
  "02": { ai: "02", name: "Content GTIN", fixedLength: 14, isNumericOnly: true },
  "10": { ai: "10", name: "Batch / Lot Number", minLength: 1, maxLength: 20, isNumericOnly: false },
  "11": { ai: "11", name: "Production Date (YYMMDD)", fixedLength: 6, isNumericOnly: true },
  "12": { ai: "12", name: "Due Date (YYMMDD)", fixedLength: 6, isNumericOnly: true },
  "13": { ai: "13", name: "Packaging Date (YYMMDD)", fixedLength: 6, isNumericOnly: true },
  "15": { ai: "15", name: "Best Before Date (YYMMDD)", fixedLength: 6, isNumericOnly: true },
  "17": { ai: "17", name: "Expiration Date (YYMMDD)", fixedLength: 6, isNumericOnly: true },
  "20": { ai: "20", name: "Internal Product Variant", fixedLength: 2, isNumericOnly: true },
  "21": { ai: "21", name: "Serial Number", minLength: 1, maxLength: 20, isNumericOnly: false },
  "30": { ai: "30", name: "Variable Count", minLength: 1, maxLength: 8, isNumericOnly: true },
  "37": { ai: "37", name: "Number of Units Contained", minLength: 1, maxLength: 8, isNumericOnly: true },
  "400": { ai: "400", name: "Customer Purchase Order Number", minLength: 1, maxLength: 30, isNumericOnly: false },
  "410": { ai: "410", name: "Ship-to GLN", fixedLength: 13, isNumericOnly: true },
  "420": { ai: "420", name: "Ship-to Postal Code", minLength: 1, maxLength: 20, isNumericOnly: false },
};

export function parseGs1String(input: string): {
  isValid: boolean;
  parsedAIs: Array<{ ai: string; title: string; value: string }>;
  error?: string;
  normalizedText: string;
} {
  const trimmed = input.trim();
  const parsedAIs: Array<{ ai: string; title: string; value: string }> = [];

  // If input uses bracketed notation like (01)08901030999991(17)261231
  const bracketRegex = /\((\d{2,4})\)([^(]+)/g;
  let match;
  let matchesCount = 0;

  while ((match = bracketRegex.exec(trimmed)) !== null) {
    matchesCount++;
    const ai = match[1];
    const val = match[2].trim();
    const def = GS1_KNOWN_AIS[ai];
    const title = def ? def.name : `AI (${ai})`;

    if (def) {
      if (def.fixedLength && val.length !== def.fixedLength) {
        return {
          isValid: false,
          parsedAIs: [],
          error: `GS1 AI (${ai}) "${def.name}" must be exactly ${def.fixedLength} characters (got ${val.length}: "${val}").`,
          normalizedText: trimmed,
        };
      }
      if (def.isNumericOnly && !/^\d+$/.test(val)) {
        return {
          isValid: false,
          parsedAIs: [],
          error: `GS1 AI (${ai}) "${def.name}" must contain numeric digits only (got "${val}").`,
          normalizedText: trimmed,
        };
      }
      // Check date validity if YYMMDD
      if ((ai === "11" || ai === "17" || ai === "15" || ai === "12") && val.length === 6) {
        const month = parseInt(val.slice(2, 4), 10);
        const day = parseInt(val.slice(4, 6), 10);
        if (month < 1 || month > 12 || day < 0 || day > 31) {
          return {
            isValid: false,
            parsedAIs: [],
            error: `GS1 AI (${ai}) date "${val}" is invalid. Expected format YYMMDD (month 01-12).`,
            normalizedText: trimmed,
          };
        }
      }
      // Verify GTIN-14 check digit if AI 01
      if (ai === "01" && val.length === 14) {
        const payload = val.slice(0, 13);
        const expectedCheck = calculateGs1Mod10(payload);
        if (val[13] !== expectedCheck) {
          return {
            isValid: false,
            parsedAIs: [],
            error: `GS1 AI (01) GTIN check digit '${val[13]}' is invalid. Expected '${expectedCheck}'.`,
            normalizedText: trimmed,
          };
        }
      }
    }

    parsedAIs.push({ ai, title, value: val });
  }

  if (matchesCount > 0) {
    return {
      isValid: true,
      parsedAIs,
      normalizedText: trimmed,
    };
  }

  // If user entered raw digits e.g. 010890103099999117261231
  if (/^\d{16,}$/.test(trimmed) && trimmed.startsWith("01")) {
    const gtin = trimmed.slice(2, 16);
    const rest = trimmed.slice(16);
    return {
      isValid: true,
      parsedAIs: [
        { ai: "01", title: "GTIN", value: gtin },
        ...(rest ? [{ ai: "rest", title: "Additional Data", value: rest }] : []),
      ],
      normalizedText: `(01)${gtin}${rest ? `(10)${rest}` : ""}`,
    };
  }

  return {
    isValid: true,
    parsedAIs: [{ ai: "raw", title: "Payload", value: trimmed }],
    normalizedText: trimmed,
  };
}

/**
 * Validates and normalizes input for any symbology.
 */
export function validateBarcodeInput(
  symbology: SymbologyType,
  rawInput: string
): ValidationResult {
  const text = (rawInput || "").trim();
  const meta = SYMBOLOGY_CATALOG[symbology];

  if (!text) {
    return {
      isValid: false,
      normalizedText: "",
      errorMessage: `Please enter data to encode in ${meta.name}.`,
    };
  }

  switch (symbology) {
    case "ean13": {
      const digits = text.replace(/[\s-]/g, "");
      if (!/^\d+$/.test(digits)) {
        return {
          isValid: false,
          normalizedText: digits,
          errorMessage: "EAN-13 must contain numeric digits only (0-9).",
        };
      }
      if (digits.length === 12) {
        const check = calculateGs1Mod10(digits);
        return {
          isValid: true,
          normalizedText: digits + check,
          computedCheckDigit: check,
          warningMessage: `Automatically calculated GS1 check digit: ${check}`,
          autoFixAvailable: true,
          suggestedFix: digits + check,
        };
      }
      if (digits.length === 13) {
        const payload = digits.slice(0, 12);
        const expectedCheck = calculateGs1Mod10(payload);
        const actualCheck = digits[12];
        if (expectedCheck !== actualCheck) {
          return {
            isValid: false,
            normalizedText: digits,
            errorMessage: `Invalid EAN-13 check digit '${actualCheck}'. Expected '${expectedCheck}'.`,
            autoFixAvailable: true,
            suggestedFix: payload + expectedCheck,
          };
        }
        return {
          isValid: true,
          normalizedText: digits,
          computedCheckDigit: actualCheck,
        };
      }
      return {
        isValid: false,
        normalizedText: digits,
        errorMessage: `EAN-13 requires exactly 12 or 13 digits (provided ${digits.length}).`,
      };
    }

    case "ean8": {
      const digits = text.replace(/[\s-]/g, "");
      if (!/^\d+$/.test(digits)) {
        return {
          isValid: false,
          normalizedText: digits,
          errorMessage: "EAN-8 must contain numeric digits only (0-9).",
        };
      }
      if (digits.length === 7) {
        const check = calculateGs1Mod10(digits);
        return {
          isValid: true,
          normalizedText: digits + check,
          computedCheckDigit: check,
          warningMessage: `Calculated EAN-8 check digit: ${check}`,
          autoFixAvailable: true,
          suggestedFix: digits + check,
        };
      }
      if (digits.length === 8) {
        const payload = digits.slice(0, 7);
        const expectedCheck = calculateGs1Mod10(payload);
        const actualCheck = digits[7];
        if (expectedCheck !== actualCheck) {
          return {
            isValid: false,
            normalizedText: digits,
            errorMessage: `Invalid EAN-8 check digit '${actualCheck}'. Expected '${expectedCheck}'.`,
            autoFixAvailable: true,
            suggestedFix: payload + expectedCheck,
          };
        }
        return {
          isValid: true,
          normalizedText: digits,
          computedCheckDigit: actualCheck,
        };
      }
      return {
        isValid: false,
        normalizedText: digits,
        errorMessage: `EAN-8 requires exactly 7 or 8 digits (provided ${digits.length}).`,
      };
    }

    case "upca": {
      const digits = text.replace(/[\s-]/g, "");
      if (!/^\d+$/.test(digits)) {
        return {
          isValid: false,
          normalizedText: digits,
          errorMessage: "UPC-A must contain numbers only.",
        };
      }
      if (digits.length === 11) {
        const check = calculateGs1Mod10(digits);
        return {
          isValid: true,
          normalizedText: digits + check,
          computedCheckDigit: check,
          warningMessage: `Calculated UPC-A check digit: ${check}`,
          autoFixAvailable: true,
          suggestedFix: digits + check,
        };
      }
      if (digits.length === 12) {
        const payload = digits.slice(0, 11);
        const expectedCheck = calculateGs1Mod10(payload);
        const actualCheck = digits[11];
        if (expectedCheck !== actualCheck) {
          return {
            isValid: false,
            normalizedText: digits,
            errorMessage: `Invalid UPC-A check digit '${actualCheck}'. Expected '${expectedCheck}'.`,
            autoFixAvailable: true,
            suggestedFix: payload + expectedCheck,
          };
        }
        return {
          isValid: true,
          normalizedText: digits,
          computedCheckDigit: actualCheck,
        };
      }
      return {
        isValid: false,
        normalizedText: digits,
        errorMessage: `UPC-A requires exactly 11 or 12 digits (provided ${digits.length}).`,
      };
    }

    case "upce": {
      const digits = text.replace(/[\s-]/g, "");
      if (!/^\d+$/.test(digits)) {
        return {
          isValid: false,
          normalizedText: digits,
          errorMessage: "UPC-E must contain numbers only.",
        };
      }
      if (digits.length >= 6 && digits.length <= 8) {
        return {
          isValid: true,
          normalizedText: digits,
        };
      }
      return {
        isValid: false,
        normalizedText: digits,
        errorMessage: `UPC-E requires 6, 7 or 8 digits (provided ${digits.length}).`,
      };
    }

    case "itf14": {
      const digits = text.replace(/[\s-]/g, "");
      if (!/^\d+$/.test(digits)) {
        return {
          isValid: false,
          normalizedText: digits,
          errorMessage: "ITF-14 must contain numbers only.",
        };
      }
      if (digits.length === 13) {
        const check = calculateGs1Mod10(digits);
        return {
          isValid: true,
          normalizedText: digits + check,
          computedCheckDigit: check,
          autoFixAvailable: true,
          suggestedFix: digits + check,
        };
      }
      if (digits.length === 14) {
        const payload = digits.slice(0, 13);
        const expectedCheck = calculateGs1Mod10(payload);
        if (expectedCheck !== digits[13]) {
          return {
            isValid: false,
            normalizedText: digits,
            errorMessage: `Invalid ITF-14 check digit '${digits[13]}'. Expected '${expectedCheck}'.`,
            autoFixAvailable: true,
            suggestedFix: payload + expectedCheck,
          };
        }
        return {
          isValid: true,
          normalizedText: digits,
          computedCheckDigit: digits[13],
        };
      }
      return {
        isValid: false,
        normalizedText: digits,
        errorMessage: `ITF-14 requires 13 or 14 digits (provided ${digits.length}).`,
      };
    }

    case "interleaved2of5": {
      let digits = text.replace(/[\s-]/g, "");
      if (!/^\d+$/.test(digits)) {
        return {
          isValid: false,
          normalizedText: digits,
          errorMessage: "Interleaved 2 of 5 must contain numeric digits only.",
        };
      }
      if (digits.length % 2 !== 0) {
        return {
          isValid: true,
          normalizedText: "0" + digits,
          warningMessage: "ITF requires an even number of digits. Prepending '0'.",
          autoFixAvailable: true,
          suggestedFix: "0" + digits,
        };
      }
      return {
        isValid: true,
        normalizedText: digits,
      };
    }

    case "code39": {
      const upper = text.toUpperCase();
      const validChars = /^[0-9A-Z\-\.\ \$\/\+\%]+$/;
      const stripped = upper.replace(/\*/g, ""); // Strip start/stop asterisks if present
      if (!validChars.test(stripped)) {
        return {
          isValid: false,
          normalizedText: stripped,
          errorMessage: "Code 39 only supports 0-9, A-Z, space, and symbols: - . $ / + %",
        };
      }
      return {
        isValid: true,
        normalizedText: stripped,
      };
    }

    case "code93": {
      return {
        isValid: true,
        normalizedText: text,
      };
    }

    case "codabar": {
      const clean = text.toUpperCase().replace(/\s/g, "");
      const validChars = /^[ABCD][0-9\-\$\:\/\.\+]+[ABCD]$/;
      if (!validChars.test(clean)) {
        if (/^[0-9\-\$\:\/\.\+]+$/.test(clean)) {
          return {
            isValid: true,
            normalizedText: `A${clean}B`,
            warningMessage: "Added start/stop guards (A and B).",
            autoFixAvailable: true,
            suggestedFix: `A${clean}B`,
          };
        }
        return {
          isValid: false,
          normalizedText: clean,
          errorMessage: "Codabar must start and end with A, B, C, or D, containing digits and -$:/.+",
        };
      }
      return {
        isValid: true,
        normalizedText: clean,
      };
    }

    case "pharmacode": {
      const num = parseInt(text.replace(/\D/g, ""), 10);
      if (isNaN(num) || num < 3 || num > 131070) {
        return {
          isValid: false,
          normalizedText: text,
          errorMessage: "Pharmacode requires an integer value between 3 and 131,070.",
        };
      }
      return {
        isValid: true,
        normalizedText: num.toString(),
      };
    }

    case "gs1-128": {
      const gs1Result = parseGs1String(text);
      if (!gs1Result.isValid) {
        return {
          isValid: false,
          normalizedText: text,
          errorMessage: gs1Result.error || "Invalid GS1 Application Identifier structure.",
        };
      }
      return {
        isValid: true,
        normalizedText: gs1Result.normalizedText,
        parsedAIs: gs1Result.parsedAIs,
      };
    }

    case "isbn": {
      const digits = text.replace(/[\s-]/g, "");
      if (!/^\d+$/.test(digits)) {
        return {
          isValid: false,
          normalizedText: digits,
          errorMessage: "ISBN-13 must contain numeric digits only.",
        };
      }
      if (!digits.startsWith("978") && !digits.startsWith("979")) {
        return {
          isValid: false,
          normalizedText: digits,
          errorMessage: "ISBN-13 must begin with book prefix '978' or '979'.",
        };
      }
      if (digits.length === 12) {
        const check = calculateGs1Mod10(digits);
        return {
          isValid: true,
          normalizedText: digits + check,
          computedCheckDigit: check,
          suggestedFix: digits + check,
        };
      }
      if (digits.length === 13) {
        const payload = digits.slice(0, 12);
        const expected = calculateGs1Mod10(payload);
        if (digits[12] !== expected) {
          return {
            isValid: false,
            normalizedText: digits,
            errorMessage: `Invalid ISBN-13 check digit '${digits[12]}'. Expected '${expected}'.`,
            autoFixAvailable: true,
            suggestedFix: payload + expected,
          };
        }
        return {
          isValid: true,
          normalizedText: digits,
          computedCheckDigit: digits[12],
        };
      }
      return {
        isValid: false,
        normalizedText: digits,
        errorMessage: `ISBN requires 12 or 13 digits (provided ${digits.length}).`,
      };
    }

    case "amazon-fnsku": {
      const clean = text.trim().toUpperCase();
      if (!/^[A-Z0-9]{10}$/.test(clean)) {
        return {
          isValid: false,
          normalizedText: clean,
          errorMessage: "Amazon FNSKU must be a 10-character alphanumeric string (e.g., X001ABC456 or B001...).",
        };
      }
      return {
        isValid: true,
        normalizedText: clean,
      };
    }

    case "qrcode": {
      if (text.length > 2953) {
        return {
          isValid: false,
          normalizedText: text,
          errorMessage: "Text exceeds QR Code maximum byte capacity (2,953 bytes).",
        };
      }
      return {
        isValid: true,
        normalizedText: text,
      };
    }

    default:
      // Code 128, Data Matrix, PDF417, Aztec
      return {
        isValid: true,
        normalizedText: text,
      };
  }
}
