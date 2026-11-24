import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface SupportInquiryRecord {
  ticketId: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
  sourcePath: string;
  ipHash: string;
}

export interface SupportInquiryInput {
  name: unknown;
  email: unknown;
  subject: unknown;
  message: unknown;
}

export interface ValidatedSupportInquiry {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const SUPPORT_STORE_DIR = path.resolve(process.cwd(), ".data");
const SUPPORT_STORE_PATH = path.resolve(SUPPORT_STORE_DIR, "support_inquiries.json");
const MAX_STORED_INQUIRIES = 2000;

// Non-backtracking practical RFC-aligned email check
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function sanitizeText(raw: string, allowNewlines = false): string {
  const cleaned = allowNewlines
    ? raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    : raw.replace(/[\u0000-\u001F\u007F]+/g, " ");
  return cleaned.trim();
}

export function validateSupportInquiryInput(
  input: SupportInquiryInput
): { ok: true; data: ValidatedSupportInquiry } | { ok: false; error: string } {
  if (
    typeof input.name !== "string" ||
    typeof input.email !== "string" ||
    typeof input.subject !== "string" ||
    typeof input.message !== "string"
  ) {
    return { ok: false, error: "All fields (name, email, subject, and message) are required." };
  }

  const name = sanitizeText(input.name, false);
  const email = sanitizeText(input.email, false).toLowerCase();
  const subject = sanitizeText(input.subject, false);
  const message = sanitizeText(input.message, true);

  if (name.length < 2 || name.length > 100) {
    return { ok: false, error: "Please enter a valid name between 2 and 100 characters." };
  }

  if (email.length < 5 || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  if (subject.length < 3 || subject.length > 160) {
    return { ok: false, error: "Please enter a subject between 3 and 160 characters." };
  }

  if (message.length < 10 || message.length > 4000) {
    return { ok: false, error: "Please provide message details between 10 and 4,000 characters." };
  }

  return { ok: true, data: { name, email, subject, message } };
}

export function generateSupportTicketId(): string {
  const randomCode = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `#PDFSUN-${randomCode}`;
}

export function hashRequesterIp(ip: string): string {
  return crypto.createHash("sha256").update(`pdfsun-support:${ip || "unknown"}`).digest("hex").slice(0, 16);
}

function readInquiriesFromDisk(): SupportInquiryRecord[] {
  if (!fs.existsSync(SUPPORT_STORE_PATH)) {
    return [];
  }
  const raw = fs.readFileSync(SUPPORT_STORE_PATH, "utf-8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function writeInquiriesAtomically(records: SupportInquiryRecord[]): void {
  if (!fs.existsSync(SUPPORT_STORE_DIR)) {
    fs.mkdirSync(SUPPORT_STORE_DIR, { recursive: true, mode: 0o700 });
  }
  const tmpPath = path.resolve(
    SUPPORT_STORE_DIR,
    `support_inquiries.${process.pid}.${Date.now()}.tmp`
  );
  if (!tmpPath.startsWith(SUPPORT_STORE_DIR + path.sep)) {
    throw new Error("Invalid support store path.");
  }
  fs.writeFileSync(tmpPath, JSON.stringify(records, null, 2), { encoding: "utf-8", mode: 0o600 });
  fs.renameSync(tmpPath, SUPPORT_STORE_PATH);
}

export function persistSupportInquiry(
  validated: ValidatedSupportInquiry,
  options: { ip?: string; sourcePath?: string } = {}
): SupportInquiryRecord {
  const existing = readInquiriesFromDisk();
  const record: SupportInquiryRecord = {
    ticketId: generateSupportTicketId(),
    name: validated.name,
    email: validated.email,
    subject: validated.subject,
    message: validated.message,
    status: "open",
    createdAt: new Date().toISOString(),
    sourcePath: (options.sourcePath || "/contact-us").slice(0, 120),
    ipHash: hashRequesterIp(options.ip || "unknown"),
  };

  const nextRecords = [record, ...existing].slice(0, MAX_STORED_INQUIRIES);
  writeInquiriesAtomically(nextRecords);
  return record;
}

export function listSupportInquiries(limit = 100): SupportInquiryRecord[] {
  const safeLimit = Math.max(1, Math.min(500, Math.floor(limit)));
  return readInquiriesFromDisk().slice(0, safeLimit);
}
