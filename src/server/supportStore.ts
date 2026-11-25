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

export interface PersistSupportInquiryOptions {
  ip?: string;
  sourcePath?: string;
  storeDir?: string;
  maxRecords?: number;
}

export class SupportStoreCapacityError extends Error {
  public readonly statusCode = 507;
  constructor(message: string) {
    super(message);
    this.name = "SupportStoreCapacityError";
  }
}

export class SupportStoreUnavailableError extends Error {
  public readonly statusCode = 503;
  constructor(message: string) {
    super(message);
    this.name = "SupportStoreUnavailableError";
  }
}

const DEFAULT_SUPPORT_STORE_DIR = path.resolve(process.cwd(), ".data");
const DEFAULT_MAX_STORED_INQUIRIES = 2000;

// In-process async write serialization per store directory.
// CRITICAL: An in-process mutex is preview/single-instance protection ONLY and is NOT
// durable serverless storage across Vercel instances, cold starts, or redeployments (Gate 2).
const writeQueues = new Map<string, Promise<void>>();
let loggedNonDurableWarning = false;

// Non-backtracking practical RFC-aligned email check
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function sanitizeText(raw: string, allowNewlines = false): string {
  const cleaned = allowNewlines
    ? raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    : raw.replace(/[\u0000-\u001F\u007F]+/g, " ");
  return cleaned.trim();
}

function resolveStoreDir(explicitDir?: string): string {
  const candidate = explicitDir || process.env.PDFSUN_SUPPORT_STORE_DIR || DEFAULT_SUPPORT_STORE_DIR;
  return path.resolve(candidate);
}

function ensureSafeStoreDir(dir: string): string {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }
    const realDir = fs.realpathSync(dir);
    const stat = fs.lstatSync(realDir);
    if (!stat.isDirectory()) {
      throw new SupportStoreUnavailableError("Support storage directory is invalid.");
    }
    return realDir;
  } catch (err: any) {
    if (err instanceof SupportStoreUnavailableError) {
      throw err;
    }
    if (err?.code === "EROFS" || err?.code === "EACCES" || err?.code === "EPERM") {
      throw new SupportStoreUnavailableError(
        "Support storage is read-only or unavailable in this environment. Durable database storage (Gate 2) is required."
      );
    }
    throw err;
  }
}

function resolveContainedFile(realDir: string, fileName: string): string {
  const target = path.resolve(realDir, fileName);
  if (!target.startsWith(realDir + path.sep)) {
    throw new SupportStoreUnavailableError("Invalid support store file path.");
  }
  return target;
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

function readInquiriesFromDisk(storeDir?: string): SupportInquiryRecord[] {
  const dir = resolveStoreDir(storeDir);
  if (!fs.existsSync(dir)) {
    return [];
  }
  const realDir = fs.realpathSync(dir);
  const storePath = resolveContainedFile(realDir, "support_inquiries.json");
  if (!fs.existsSync(storePath)) {
    return [];
  }
  const raw = fs.readFileSync(storePath, "utf-8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function writeInquiriesAtomically(records: SupportInquiryRecord[], storeDir?: string): void {
  const realDir = ensureSafeStoreDir(resolveStoreDir(storeDir));
  const storePath = resolveContainedFile(realDir, "support_inquiries.json");
  const nonce = crypto.randomBytes(6).toString("hex");
  const tmpPath = resolveContainedFile(
    realDir,
    `support_inquiries.${process.pid}.${Date.now()}.${nonce}.tmp`
  );

  let renamed = false;
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(records, null, 2), { encoding: "utf-8", mode: 0o600 });
    fs.renameSync(tmpPath, storePath);
    renamed = true;
  } catch (err: any) {
    if (err?.code === "EROFS" || err?.code === "EACCES" || err?.code === "EPERM") {
      throw new SupportStoreUnavailableError(
        "Support storage is read-only or unavailable in this environment. Durable database storage (Gate 2) is required."
      );
    }
    throw err;
  } finally {
    if (!renamed) {
      try {
        if (fs.existsSync(tmpPath)) {
          fs.unlinkSync(tmpPath);
        }
      } catch {
        // Best-effort cleanup of orphan temporary file
      }
    }
  }
}

function persistSupportInquirySyncInternal(
  validated: ValidatedSupportInquiry,
  options: PersistSupportInquiryOptions = {}
): SupportInquiryRecord {
  if (!loggedNonDurableWarning && (process.env.VERCEL === "1" || process.env.NODE_ENV === "production")) {
    loggedNonDurableWarning = true;
    console.warn(
      "[SupportStore] Local JSON store is preview/single-instance only and is NOT durable on Vercel serverless. Complete Gate 2 durable DB migration before production reliance."
    );
  }

  const maxRecords =
    typeof options.maxRecords === "number" && Number.isFinite(options.maxRecords) && options.maxRecords >= 1
      ? Math.floor(options.maxRecords)
      : DEFAULT_MAX_STORED_INQUIRIES;

  const existing = readInquiriesFromDisk(options.storeDir);
  if (existing.length >= maxRecords) {
    throw new SupportStoreCapacityError(
      `Support inquiry store reached its maximum safe capacity (${maxRecords} records). Existing inquiries were preserved and no records were truncated.`
    );
  }

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

  const nextRecords = [record, ...existing];
  writeInquiriesAtomically(nextRecords, options.storeDir);
  return record;
}

/**
 * Serialized async support inquiry writer (prevents in-process concurrent lost updates).
 */
export function persistSupportInquiryAsync(
  validated: ValidatedSupportInquiry,
  options: PersistSupportInquiryOptions = {}
): Promise<SupportInquiryRecord> {
  const queueKey = resolveStoreDir(options.storeDir);
  const previous = writeQueues.get(queueKey) || Promise.resolve();

  const runPromise = previous.then(() => persistSupportInquirySyncInternal(validated, options));
  const tailPromise = runPromise.then(
    () => undefined,
    () => undefined
  );
  writeQueues.set(queueKey, tailPromise);

  return runPromise;
}

export function persistSupportInquiry(
  validated: ValidatedSupportInquiry,
  options: PersistSupportInquiryOptions = {}
): SupportInquiryRecord {
  return persistSupportInquirySyncInternal(validated, options);
}

export function listSupportInquiries(limit = 100, storeDir?: string): SupportInquiryRecord[] {
  const safeLimit = Math.max(1, Math.min(500, Math.floor(limit)));
  return readInquiriesFromDisk(storeDir).slice(0, safeLimit);
}

