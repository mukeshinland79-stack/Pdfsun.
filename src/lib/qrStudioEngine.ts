/**
 * Independent QR Code Studio Engine for PDFSun (Tool #68)
 *
 * Reuses existing `qrcode` and `jsqr` dependencies cleanly without modifying
 * src/lib/qrGenerator.ts, DownloadQrCodeGenerator.tsx, QrCodeDisplay.tsx, or SharePdfSunModal.tsx.
 *
 * Supported Content Types (11):
 * 1. url          - Website URL
 * 2. text         - Plain Text
 * 3. email        - Email (mailto:)
 * 4. phone        - Phone Call (tel:)
 * 5. sms          - SMS (SMSTO:)
 * 6. wifi         - Wi-Fi Credentials (WIFI:T:...;S:...;P:...;H:...;;)
 * 7. vcard        - Contact Card (vCard 3.0)
 * 8. whatsapp     - WhatsApp Click-to-Chat (https://wa.me/...)
 * 9. location     - Geographic Coordinates (geo:lat,lng)
 * 10. google-forms - Google Forms Link
 * 11. pdf-menu     - PDF / Digital Menu Link
 */

import QRCode from "qrcode";
import jsQR from "jsqr";
import { escapeXml, sanitizeHexColor } from "./barcodeEngine";

export type QrContentType =
  | "url"
  | "text"
  | "email"
  | "phone"
  | "sms"
  | "wifi"
  | "vcard"
  | "whatsapp"
  | "location"
  | "google-forms"
  | "pdf-menu";

export type QrEccLevel = "L" | "M" | "Q" | "H";

export interface QrUrlFields {
  url: string;
}
export interface QrTextFields {
  text: string;
}
export interface QrEmailFields {
  to: string;
  subject: string;
  body: string;
}
export interface QrPhoneFields {
  phone: string;
}
export interface QrSmsFields {
  phone: string;
  message: string;
}
export interface QrWifiFields {
  ssid: string;
  password: string;
  encryption: "WPA" | "WEP" | "nopass";
  hidden: boolean;
}
export interface QrVcardFields {
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  phone: string;
  email: string;
  website: string;
  address: string;
}
export interface QrWhatsappFields {
  phone: string;
  message: string;
}
export interface QrLocationFields {
  latitude: string;
  longitude: string;
}
export interface QrGoogleFormsFields {
  url: string;
}
export interface QrPdfMenuFields {
  url: string;
  menuTitle?: string;
}

export interface QrStudioPayloadInput {
  type: QrContentType;
  url?: QrUrlFields;
  text?: QrTextFields;
  email?: QrEmailFields;
  phone?: QrPhoneFields;
  sms?: QrSmsFields;
  wifi?: QrWifiFields;
  vcard?: QrVcardFields;
  whatsapp?: QrWhatsappFields;
  location?: QrLocationFields;
  googleForms?: QrGoogleFormsFields;
  pdfMenu?: QrPdfMenuFields;
}

export interface QrBuildResult {
  valid: boolean;
  payload: string;
  error?: string;
}

export interface QrStudioRenderOptions {
  size: number; // 160..1024
  margin: number; // 1..8
  ecc: QrEccLevel;
  foreground: string;
  background: string;
  transparentBackground: boolean;
  logoDataUrl?: string | null; // Strictly validated raster PNG/JPEG/WEBP Data URL
  logoScaleRatio?: number; // 0.12..0.24
  caption?: string;
}

export interface QrVerificationResult {
  verified: boolean;
  decodedText: string | null;
  exactMatch: boolean;
  error?: string;
}

export const MAX_QR_LOGO_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_RASTER_MIMES = new Set(["image/png", "image/jpeg", "image/webp"]);

function stripControlChars(s: string): string {
  return String(s || "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

function escapeWifiField(val: string): string {
  return stripControlChars(val).replace(/([\\;,:""])/g, "\\$1");
}

function escapeVcardField(val: string): string {
  return stripControlChars(val)
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function validateSafeHttpUrl(rawUrl: string): URL {
  const trimmed = stripControlChars(rawUrl).trim();
  if (!trimmed) {
    throw new Error("Please enter a URL.");
  }
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
    throw new Error("Unsafe URL protocol blocked. Only http:// or https:// links are allowed.");
  }
  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error("Invalid URL format. Example: https://www.pdfsun.in");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http:// and https:// URLs are permitted.");
  }
  if (!parsed.hostname || !parsed.hostname.includes(".")) {
    throw new Error("Enter a valid domain name (e.g. https://www.pdfsun.in).");
  }
  return parsed;
}

function sanitizePhoneNumber(rawPhone: string): string {
  const cleaned = stripControlChars(rawPhone).trim().replace(/[^\d+]/g, "");
  const digitCount = cleaned.replace(/\D/g, "").length;
  if (digitCount < 5 || digitCount > 16) {
    throw new Error("Phone number must contain 5 to 16 digits (e.g. +919876543210).");
  }
  return cleaned;
}

/**
 * Structured payload builder and strict validator for all 11 QR content types.
 */
export function buildQrPayload(input: QrStudioPayloadInput): QrBuildResult {
  try {
    switch (input.type) {
      case "url": {
        const parsed = validateSafeHttpUrl(input.url?.url || "");
        return { valid: true, payload: parsed.toString() };
      }

      case "text": {
        const txt = stripControlChars(input.text?.text || "").trim();
        if (!txt) throw new Error("Plain text content cannot be empty.");
        if (txt.length > 2500) throw new Error("Text exceeds 2,500 characters for reliable mobile scanning.");
        return { valid: true, payload: txt };
      }

      case "email": {
        const to = stripControlChars(input.email?.to || "").trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) {
          throw new Error("Enter a valid recipient email address.");
        }
        const subject = stripControlChars(input.email?.subject || "").trim();
        const body = stripControlChars(input.email?.body || "").trim();
        const qp = new URLSearchParams();
        if (subject) qp.set("subject", subject);
        if (body) qp.set("body", body);
        const query = qp.toString();
        return { valid: true, payload: `mailto:${to}${query ? `?${query}` : ""}` };
      }

      case "phone": {
        const num = sanitizePhoneNumber(input.phone?.phone || "");
        return { valid: true, payload: `tel:${num}` };
      }

      case "sms": {
        const num = sanitizePhoneNumber(input.sms?.phone || "");
        const msg = stripControlChars(input.sms?.message || "").trim();
        return { valid: true, payload: `SMSTO:${num}:${msg}` };
      }

      case "wifi": {
        const ssid = (input.wifi?.ssid || "").trim();
        if (!ssid) throw new Error("Wi-Fi Network Name (SSID) is required.");
        const enc = input.wifi?.encryption || "WPA";
        const password = input.wifi?.password || "";
        if (enc !== "nopass" && !password) {
          throw new Error("Wi-Fi password is required unless encryption is set to None.");
        }
        const hidden = Boolean(input.wifi?.hidden);
        const passPart = enc === "nopass" ? "" : escapeWifiField(password);
        return {
          valid: true,
          payload: `WIFI:T:${enc};S:${escapeWifiField(ssid)};P:${passPart};H:${hidden ? "true" : "false"};;`,
        };
      }

      case "vcard": {
        const firstName = (input.vcard?.firstName || "").trim();
        const lastName = (input.vcard?.lastName || "").trim();
        if (!firstName && !lastName) {
          throw new Error("Enter at least a First Name or Last Name for the vCard.");
        }
        const fullName = [firstName, lastName].filter(Boolean).join(" ");
        const lines = [
          "BEGIN:VCARD",
          "VERSION:3.0",
          `N:${escapeVcardField(lastName)};${escapeVcardField(firstName)};;;`,
          `FN:${escapeVcardField(fullName)}`,
        ];
        if (input.vcard?.organization?.trim()) {
          lines.push(`ORG:${escapeVcardField(input.vcard.organization.trim())}`);
        }
        if (input.vcard?.title?.trim()) {
          lines.push(`TITLE:${escapeVcardField(input.vcard.title.trim())}`);
        }
        if (input.vcard?.phone?.trim()) {
          const phone = sanitizePhoneNumber(input.vcard.phone);
          lines.push(`TEL;TYPE=CELL:${phone}`);
        }
        if (input.vcard?.email?.trim()) {
          const em = stripControlChars(input.vcard.email.trim());
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) {
            throw new Error("vCard email address is invalid.");
          }
          lines.push(`EMAIL:${em}`);
        }
        if (input.vcard?.website?.trim()) {
          const site = validateSafeHttpUrl(input.vcard.website.trim());
          lines.push(`URL:${site.toString()}`);
        }
        if (input.vcard?.address?.trim()) {
          lines.push(`ADR;TYPE=WORK:;;${escapeVcardField(input.vcard.address.trim())};;;;`);
        }
        lines.push("END:VCARD");
        return { valid: true, payload: lines.join("\n") };
      }

      case "whatsapp": {
        const num = sanitizePhoneNumber(input.whatsapp?.phone || "").replace(/\D/g, "");
        if (num.length < 7) {
          throw new Error("WhatsApp requires country code + mobile number (digits only, e.g. 919876543210).");
        }
        const msg = stripControlChars(input.whatsapp?.message || "").trim();
        const qs = msg ? `?text=${encodeURIComponent(msg)}` : "";
        return { valid: true, payload: `https://wa.me/${num}${qs}` };
      }

      case "location": {
        const lat = Number((input.location?.latitude || "").trim());
        const lng = Number((input.location?.longitude || "").trim());
        if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
          throw new Error("Latitude must be a number between -90 and 90.");
        }
        if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
          throw new Error("Longitude must be a number between -180 and 180.");
        }
        return { valid: true, payload: `geo:${lat.toFixed(6)},${lng.toFixed(6)}` };
      }

      case "google-forms": {
        const parsed = validateSafeHttpUrl(input.googleForms?.url || "");
        const host = parsed.hostname.toLowerCase();
        const isGoogleForm =
          host === "forms.gle" ||
          (host === "docs.google.com" && parsed.pathname.toLowerCase().includes("/forms"));
        if (!isGoogleForm) {
          throw new Error("Enter a valid Google Forms URL (docs.google.com/forms/... or forms.gle/...).");
        }
        return { valid: true, payload: parsed.toString() };
      }

      case "pdf-menu": {
        const parsed = validateSafeHttpUrl(input.pdfMenu?.url || "");
        return { valid: true, payload: parsed.toString() };
      }

      default:
        throw new Error(`Unsupported QR content type: ${String(input.type)}`);
    }
  } catch (err: any) {
    return {
      valid: false,
      payload: "",
      error: err?.message || "Invalid QR payload.",
    };
  }
}

/**
 * Validates raster logo uploads (strict 5 MB limit, rejects SVG & malformed magic bytes).
 */
export function validateQrLogoFile(params: {
  name: string;
  type: string;
  size: number;
  headerBytes?: Uint8Array;
}): { valid: boolean; error?: string } {
  const mime = (params.type || "").toLowerCase();
  const ext = (params.name || "").toLowerCase().split(".").pop() || "";

  if (mime.includes("svg") || ext === "svg" || ext === "svgz") {
    return {
      valid: false,
      error: "SVG logo uploads are blocked for security (XSS protection). Upload PNG, JPG, or WEBP.",
    };
  }

  if (params.size <= 0) {
    return { valid: false, error: "Logo file is empty." };
  }

  if (params.size > MAX_QR_LOGO_BYTES) {
    return {
      valid: false,
      error: "Logo image exceeds the 5 MB maximum upload limit.",
    };
  }

  if (!ALLOWED_RASTER_MIMES.has(mime)) {
    return {
      valid: false,
      error: "Unsupported logo format. Allowed formats: PNG, JPG, JPEG, WEBP.",
    };
  }

  if (params.headerBytes && params.headerBytes.length >= 12) {
    const b = params.headerBytes;
    const isPng = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
    const isJpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    const isWebp =
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
    if (!isPng && !isJpeg && !isWebp) {
      return {
        valid: false,
        error: "File header does not match a valid PNG, JPEG, or WEBP image.",
      };
    }
  }

  return { valid: true };
}

/**
 * Computes effective ECC level (elevates to H when a center logo is active).
 */
export function resolveEffectiveEcc(requested: QrEccLevel, hasLogo: boolean): QrEccLevel {
  return hasLogo ? "H" : requested;
}

/**
 * Renders RGBA pixel buffer for a QR code directly (works in both browser & Node unit tests)
 * and runs real `jsQR` round-trip verification against `expectedPayload`.
 */
export function verifyQrPayloadViaMatrixPixels(
  payload: string,
  ecc: QrEccLevel,
  options?: { moduleSize?: number; marginModules?: number; simulateCenterLogoRatio?: number }
): QrVerificationResult {
  try {
    const qr = QRCode.create(payload, { errorCorrectionLevel: ecc });
    const count = qr.modules.size;
    const moduleSize = options?.moduleSize ?? 6;
    const margin = options?.marginModules ?? 4;
    const dim = (count + margin * 2) * moduleSize;
    const rgba = new Uint8ClampedArray(dim * dim * 4);

    // Fill white background
    rgba.fill(255);

    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.modules.get(r, c) === 1) {
          const y0 = (r + margin) * moduleSize;
          const x0 = (c + margin) * moduleSize;
          for (let dy = 0; dy < moduleSize; dy++) {
            for (let dx = 0; dx < moduleSize; dx++) {
              const p = ((y0 + dy) * dim + (x0 + dx)) * 4;
              rgba[p] = 15;
              rgba[p + 1] = 23;
              rgba[p + 2] = 42;
              rgba[p + 3] = 255;
            }
          }
        }
      }
    }

    // Optional center logo occlusion simulation to verify ECC-H resilience
    if (options?.simulateCenterLogoRatio && options.simulateCenterLogoRatio > 0) {
      const box = Math.floor(count * moduleSize * options.simulateCenterLogoRatio);
      const start = Math.floor((dim - box) / 2);
      for (let y = start; y < start + box; y++) {
        for (let x = start; x < start + box; x++) {
          const p = (y * dim + x) * 4;
          rgba[p] = 255;
          rgba[p + 1] = 255;
          rgba[p + 2] = 255;
          rgba[p + 3] = 255;
        }
      }
    }

    const decoded = jsQR(rgba, dim, dim, { inversionAttempts: "attemptBoth" });
    if (!decoded) {
      return {
        verified: false,
        decodedText: null,
        exactMatch: false,
        error: "jsQR failed to decode the generated QR matrix.",
      };
    }

    const exactMatch = decoded.data === payload;
    return {
      verified: exactMatch,
      decodedText: decoded.data,
      exactMatch,
      error: exactMatch ? undefined : "Decoded QR content did not exactly match input payload.",
    };
  } catch (err: any) {
    return {
      verified: false,
      decodedText: null,
      exactMatch: false,
      error: err?.message || "QR verification error.",
    };
  }
}

/**
 * Verifies an actual rendered HTMLCanvasElement ImageData with `jsQR`.
 * When `transparentBackground` is true, composites onto a white backing buffer
 * (simulating standard phone-screen scan backdrop) while preserving the transparent export canvas.
 */
export function verifyCanvasQrWithJsQr(
  canvas: HTMLCanvasElement,
  expectedPayload: string,
  transparentBackground = false
): QrVerificationResult {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { verified: false, decodedText: null, exactMatch: false, error: "Canvas context unavailable." };
  }
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = new Uint8ClampedArray(imgData.data);

  if (transparentBackground) {
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3] / 255;
      if (alpha < 1) {
        data[i] = Math.round(data[i] * alpha + 255 * (1 - alpha));
        data[i + 1] = Math.round(data[i + 1] * alpha + 255 * (1 - alpha));
        data[i + 2] = Math.round(data[i + 2] * alpha + 255 * (1 - alpha));
        data[i + 3] = 255;
      }
    }
  }

  const decoded = jsQR(data, canvas.width, canvas.height, { inversionAttempts: "attemptBoth" });
  if (!decoded) {
    return {
      verified: false,
      decodedText: null,
      exactMatch: false,
      error: "Scanner could not decode QR image (check foreground/background contrast or logo size).",
    };
  }
  const exactMatch = decoded.data === expectedPayload;
  return {
    verified: exactMatch,
    decodedText: decoded.data,
    exactMatch,
    error: exactMatch ? undefined : "Decoded QR payload mismatch.",
  };
}

/**
 * Generates an XSS-safe SVG string for QR Studio (supports custom colors, transparent bg, safe raster logo, and caption).
 */
export async function generateQrStudioSvg(
  payload: string,
  options: QrStudioRenderOptions
): Promise<string> {
  const size = Math.min(1024, Math.max(160, Math.round(options.size || 320)));
  const margin = Math.min(8, Math.max(1, Math.round(options.margin ?? 2)));
  const fg = sanitizeHexColor(options.foreground, "#0f172a");
  const bg = options.transparentBackground ? "#00000000" : sanitizeHexColor(options.background, "#ffffff");
  const hasLogo = Boolean(options.logoDataUrl && /^data:image\/(png|jpeg|webp);base64,/i.test(options.logoDataUrl));
  const ecc = resolveEffectiveEcc(options.ecc, hasLogo);

  const rawSvg = await QRCode.toString(payload, {
    type: "svg",
    width: size,
    margin,
    errorCorrectionLevel: ecc,
    color: { dark: fg, light: bg },
  });

  const caption = options.caption?.trim() || "";
  const captionExtra = caption ? 34 : 0;

  if (!hasLogo && !caption) {
    return rawSvg;
  }

  const qrData = QRCode.create(payload, { errorCorrectionLevel: ecc });
  const moduleCount = qrData.modules.size;
  const totalWithMargin = moduleCount + margin * 2;
  const innerSize = size * (moduleCount / totalWithMargin);
  const logoRatio = Math.min(0.22, Math.max(0.12, options.logoScaleRatio ?? 0.2));
  const logoSize = Math.round(innerSize * logoRatio);
  const logoPos = Math.round((size - logoSize) / 2);
  const pad = Math.max(4, Math.round(logoSize * 0.12));

  // Extract viewBox paths safely from qrcode library SVG output
  const innerContentMatch = rawSvg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  const innerPaths = innerContentMatch ? innerContentMatch[1] : "";
  const viewBoxMatch = rawSvg.match(/viewBox="([^"]+)"/i);
  const vb = viewBoxMatch ? viewBoxMatch[1] : `0 0 ${totalWithMargin} ${totalWithMargin}`;

  const logoOverlay = hasLogo
    ? `<rect x="${logoPos - pad}" y="${logoPos - pad}" width="${logoSize + pad * 2}" height="${logoSize + pad * 2}" rx="8" fill="${
        options.transparentBackground ? "#ffffff" : sanitizeHexColor(options.background, "#ffffff")
      }"/>` +
      `<image href="${options.logoDataUrl}" x="${logoPos}" y="${logoPos}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid slice"/>`
    : "";

  const captionEl = caption
    ? `<text x="${size / 2}" y="${size + 22}" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="${fg}">${escapeXml(caption)}</text>`
    : "";

  const bgFill = options.transparentBackground
    ? ""
    : `<rect x="0" y="0" width="${size}" height="${size + captionExtra}" fill="${sanitizeHexColor(options.background, "#ffffff")}"/>`;

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + captionExtra}" viewBox="0 0 ${size} ${size + captionExtra}">` +
    bgFill +
    `<svg x="0" y="0" width="${size}" height="${size}" viewBox="${escapeXml(vb)}">${innerPaths}</svg>` +
    logoOverlay +
    captionEl +
    `</svg>`
  );
}

/**
 * Renders the QR Code (with optional logo & caption) onto an HTMLCanvasElement and verifies it via `jsQR`.
 */
export async function renderAndVerifyQrCanvas(
  canvas: HTMLCanvasElement,
  payload: string,
  options: QrStudioRenderOptions
): Promise<QrVerificationResult> {
  const size = Math.min(1024, Math.max(160, Math.round(options.size || 320)));
  const margin = Math.min(8, Math.max(1, Math.round(options.margin ?? 2)));
  const fg = sanitizeHexColor(options.foreground, "#0f172a");
  const bg = options.transparentBackground ? "#00000000" : sanitizeHexColor(options.background, "#ffffff");
  const hasLogo = Boolean(options.logoDataUrl && /^data:image\/(png|jpeg|webp);base64,/i.test(options.logoDataUrl));
  const ecc = resolveEffectiveEcc(options.ecc, hasLogo);
  const caption = options.caption?.trim() || "";
  const captionExtra = caption ? 38 : 0;

  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, payload, {
    width: size,
    margin,
    errorCorrectionLevel: ecc,
    color: { dark: fg, light: bg },
  });

  canvas.width = size;
  canvas.height = size + captionExtra;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { verified: false, decodedText: null, exactMatch: false, error: "Canvas context unavailable." };
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!options.transparentBackground) {
    ctx.fillStyle = sanitizeHexColor(options.background, "#ffffff");
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(qrCanvas, 0, 0);

  if (hasLogo && options.logoDataUrl) {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Failed to decode center logo image."));
      el.src = options.logoDataUrl!;
    });
    const qrData = QRCode.create(payload, { errorCorrectionLevel: ecc });
    const moduleCount = qrData.modules.size;
    const totalWithMargin = moduleCount + margin * 2;
    const innerSize = size * (moduleCount / totalWithMargin);
    const logoRatio = Math.min(0.22, Math.max(0.12, options.logoScaleRatio ?? 0.2));
    const logoSize = Math.round(innerSize * logoRatio);
    const logoPos = Math.round((size - logoSize) / 2);
    const pad = Math.max(4, Math.round(logoSize * 0.12));

    ctx.fillStyle = options.transparentBackground ? "#ffffff" : sanitizeHexColor(options.background, "#ffffff");
    ctx.fillRect(logoPos - pad, logoPos - pad, logoSize + pad * 2, logoSize + pad * 2);
    ctx.drawImage(img, logoPos, logoPos, logoSize, logoSize);
  }

  if (caption) {
    ctx.fillStyle = fg;
    ctx.font = "700 14px ui-sans-serif, system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(caption, size / 2, size + 24);
  }

  return verifyCanvasQrWithJsQr(canvas, payload, options.transparentBackground);
}
