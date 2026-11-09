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
        // Must have even number of digits; standard practice is prepending '0'
        return {
          isValid: true,
          normalizedText: "0" + digits,
          warningMessage: "ITF requires an even number of digits. Prepend 0 recommended.",
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
      // Code 93 supports standard ASCII
      return {
        isValid: true,
        normalizedText: text,
      };
    }

    case "codabar": {
      const clean = text.toUpperCase().replace(/\s/g, "");
      // Starts and ends with A, B, C, or D; interior is 0-9 and -$:/.+
      const validChars = /^[ABCD][0-9\-\$\:\/\.\+]+[ABCD]$/;
      if (!validChars.test(clean)) {
        // If user didn't supply start/stop, check if body is valid and suggest wrapping in A...B
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
      // Code 128, GS1-128, Data Matrix, PDF417, Aztec
      return {
        isValid: true,
        normalizedText: text,
      };
  }
}
