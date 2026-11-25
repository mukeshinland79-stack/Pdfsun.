import type { Request, Response, NextFunction } from "express";

export interface PrivatePathEvaluationInput {
  method?: string;
  originalUrl?: string;
  path?: string;
  nodeEnv?: string;
}

export type PrivatePathDecision =
  | { action: "allow" }
  | { action: "block"; statusCode: 400 | 404; reason: string };

const MAX_PATH_LENGTH = 2048;
const MAX_DECODE_PASSES = 3;

const CONTROL_OR_NULL_RE = /[\u0000-\u001F\u007F]/;
const RESIDUAL_ENCODED_HAZARD_RE = /%(?:00|2e|2f|5c|3b|0a|0d)/i;
const VITE_OPTIMIZED_DEP_RE = /^\/node_modules\/\.vite\/deps\/[A-Za-z0-9._@+-]+\.(?:js|mjs|css|wasm)$/;
const VITE_IMPORT_QUERY_RE = /(?:^|&)import(?:=[^&]*)?(?:&|$)/;
const DEV_ALLOWED_CLIENT_SRC_RE =
  /^\/src\/(?!server(?:\/|$))[A-Za-z0-9._/@+-]+\.(?:ts|tsx|js|jsx|mjs|css|json|svg|png|webp|jpg|jpeg|woff2?)$/;

const SENSITIVE_BASENAMES = new Set([
  "server.ts",
  "server.js",
  "server.cjs",
  "server.cjs.map",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "tsconfig.server.json",
  "vite.config.ts",
  "vite.config.js",
  "vercel.json",
  "firebase-blueprint.json",
  "firebase-applet-config.json",
  "firestore.rules",
  "agents.md",
  "metadata.json",
  "users_store.json",
  "comments_store.json",
  "banned_ips.json",
  "rate_limits_store.json",
  "system_config.json",
  "payment_store.json",
  "verified_transactions.json",
  "user_subscriptions.json",
  "analytics_events.json",
  "support_inquiries.json",
  "dockerfile",
]);

const SENSITIVE_PREFIXES = [
  "/@fs/",
  "/@fs",
  "/src/server/",
  "/src/server",
  "/scripts/",
  "/scripts",
  "/middleware/",
  "/middleware",
  "/backups/",
  "/backups",
  "/data/",
  "/data",
  "/dist-server/",
  "/dist-server",
];

const SENSITIVE_EXTENSIONS = [
  ".cjs",
  ".pem",
  ".key",
  ".env",
  ".bak",
  ".sql",
  ".sqlite",
  ".db",
  ".tmp",
  ".log",
];

function stripQueryAndFragment(rawUrl: string): { pathname: string; query: string } {
  const hashIndex = rawUrl.indexOf("#");
  const withoutHash = hashIndex >= 0 ? rawUrl.slice(0, hashIndex) : rawUrl;
  const queryIndex = withoutHash.indexOf("?");
  if (queryIndex >= 0) {
    return {
      pathname: withoutHash.slice(0, queryIndex),
      query: withoutHash.slice(queryIndex + 1),
    };
  }
  return { pathname: withoutHash, query: "" };
}

function decodeBounded(candidate: string): { ok: true; decoded: string } | { ok: false; reason: string } {
  let current = candidate;

  for (let pass = 0; pass < MAX_DECODE_PASSES; pass++) {
    if (CONTROL_OR_NULL_RE.test(current) || current.includes("\\") || current.includes(";")) {
      return { ok: false, reason: "disallowed_character_or_param" };
    }
    if (!current.includes("%")) {
      return { ok: true, decoded: current };
    }
    let next: string;
    try {
      next = decodeURIComponent(current);
    } catch {
      return { ok: false, reason: "malformed_percent_encoding" };
    }
    if (next === current) {
      break;
    }
    current = next;
  }

  if (CONTROL_OR_NULL_RE.test(current) || current.includes("\\") || current.includes(";")) {
    return { ok: false, reason: "disallowed_character_after_decode" };
  }

  // Detect over-encoded strings (more than 3 passes still mutating) or residual hazardous encodings
  if (current.includes("%")) {
    if (RESIDUAL_ENCODED_HAZARD_RE.test(current)) {
      return { ok: false, reason: "residual_encoded_hazard" };
    }
    try {
      const extraPass = decodeURIComponent(current);
      if (extraPass !== current) {
        return { ok: false, reason: "excessive_percent_encoding" };
      }
    } catch {
      return { ok: false, reason: "malformed_percent_encoding" };
    }
  }

  return { ok: true, decoded: current };
}

function validateStructure(rawPathname: string, decodedPathname: string): { ok: true; normalized: string } | { ok: false; reason: string } {
  if (!rawPathname.startsWith("/") || !decodedPathname.startsWith("/")) {
    return { ok: false, reason: "non_rooted_path" };
  }

  for (const pathVariant of [rawPathname, decodedPathname]) {
    if (CONTROL_OR_NULL_RE.test(pathVariant) || pathVariant.includes("\\") || pathVariant.includes(";")) {
      return { ok: false, reason: "disallowed_character_or_param" };
    }

    const segments = pathVariant.split("/");
    for (let i = 1; i < segments.length; i++) {
      const seg = segments[i];
      if (seg === "." || seg === "..") {
        return { ok: false, reason: "path_traversal_segment" };
      }
      // Windows canonicalization defense: reject trailing dots or spaces on any segment
      if (seg.length > 0 && /[. ]$/.test(seg)) {
        return { ok: false, reason: "trailing_dot_or_space_segment" };
      }
    }
  }

  // Collapse repeated slashes into canonical POSIX form
  const collapsed = decodedPathname.replace(/\/{2,}/g, "/");
  return { ok: true, normalized: collapsed };
}

function isExactAllowedException(
  rawPathname: string,
  reqPath: string,
  rawQuery: string,
  method: string,
  isDev: boolean
): boolean {
  // 1. Exact /.well-known/ard.json (no alternate encodings, no trailing dots, no semicolon params)
  if (rawPathname === "/.well-known/ard.json" && reqPath === "/.well-known/ard.json") {
    return true;
  }

  if (!isDev) {
    return false;
  }

  // 2. Dev-only Vite optimized dependency chunks (.js/.mjs/.css/.wasm only — never .json or .map)
  if (VITE_OPTIMIZED_DEP_RE.test(rawPathname) && VITE_OPTIMIZED_DEP_RE.test(reqPath)) {
    return true;
  }

  // 3. Dev-only PDF.js worker and Vite client env runtime module
  if (
    method === "GET" &&
    ((rawPathname === "/node_modules/pdfjs-dist/build/pdf.worker.min.mjs" &&
      reqPath === "/node_modules/pdfjs-dist/build/pdf.worker.min.mjs") ||
      (rawPathname === "/node_modules/vite/dist/client/env.mjs" &&
        reqPath === "/node_modules/vite/dist/client/env.mjs"))
  ) {
    return true;
  }

  // 4. Dev-only Vite module import for browser-side root middleware/adminAuth.ts (re-exported by src/middleware/adminAuth.ts)
  if (
    method === "GET" &&
    rawPathname === "/middleware/adminAuth.ts" &&
    reqPath === "/middleware/adminAuth.ts"
  ) {
    return true;
  }

  // 5. Dev-only Vite module import for firebase-applet-config.json?import (blocks raw fetch without ?import)
  if (
    method === "GET" &&
    rawPathname === "/firebase-applet-config.json" &&
    reqPath === "/firebase-applet-config.json" &&
    VITE_IMPORT_QUERY_RE.test(rawQuery)
  ) {
    return true;
  }

  return false;
}

function checkSensitivePath(normalized: string, isDev: boolean): string | null {
  const lower = normalized.toLowerCase();
  const segments = lower.split("/").filter(Boolean);
  const basename = segments.length > 0 ? segments[segments.length - 1] : "";

  // Block any hidden dotfile or dot-directory segment (/.data, /.git, /.env, /.well-known/* other than exact ard.json)
  for (const seg of segments) {
    if (seg.startsWith(".")) {
      return "hidden_dot_segment";
    }
  }

  // Guard Vite /@id/ virtual module prefix against wrapping private filesystem or server modules
  if (lower.startsWith("/@id/")) {
    if (
      lower.includes("/@fs") ||
      lower.includes("src/server") ||
      lower.includes(".data") ||
      lower.includes(".env") ||
      lower.includes("server.ts") ||
      lower.includes("firestore.rules")
    ) {
      return "vite_id_private_target";
    }
    return isDev ? null : "vite_id_in_production";
  }

  // Block sensitive directory prefixes
  for (const prefix of SENSITIVE_PREFIXES) {
    if (lower === prefix || lower.startsWith(prefix)) {
      return `sensitive_prefix:${prefix}`;
    }
  }

  // Block /node_modules/ outside explicitly allowed dev exceptions
  if (lower === "/node_modules" || lower.startsWith("/node_modules/")) {
    return "node_modules_restricted";
  }

  // Block known private/config/runtime store basenames anywhere in path
  if (
    SENSITIVE_BASENAMES.has(basename) ||
    basename.startsWith("server.cjs") ||
    basename.startsWith("dockerfile") ||
    basename.startsWith("support_inquiries") ||
    basename.endsWith("_store.json") ||
    lower.includes("server.cjs")
  ) {
    return `sensitive_basename:${basename}`;
  }

  // Block sensitive extensions everywhere
  for (const ext of SENSITIVE_EXTENSIONS) {
    if (basename.endsWith(ext)) {
      return `sensitive_extension:${ext}`;
    }
  }

  // Block sourcemaps everywhere
  if (basename.endsWith(".map")) {
    return "sourcemap_restricted";
  }

  // Block raw TypeScript files in production, and outside client /src/ in dev
  if (basename.endsWith(".ts") || basename.endsWith(".tsx")) {
    if (!isDev) {
      return "typescript_source_in_production";
    }
    if (!DEV_ALLOWED_CLIENT_SRC_RE.test(normalized)) {
      return "non_client_typescript_source";
    }
  }

  return null;
}

/**
 * Evaluates BOTH req.originalUrl and req.path before making any allow decision.
 * No allowlist exception can short-circuit validation of another candidate.
 */
export function evaluatePrivatePath(input: PrivatePathEvaluationInput): PrivatePathDecision {
  const method = (input.method || "GET").toUpperCase();
  const isDev = (input.nodeEnv ?? process.env.NODE_ENV) !== "production";

  const rawOriginal = typeof input.originalUrl === "string" && input.originalUrl.length > 0
    ? input.originalUrl
    : typeof input.path === "string"
      ? input.path
      : "/";

  const rawReqPath = typeof input.path === "string" && input.path.length > 0
    ? input.path
    : stripQueryAndFragment(rawOriginal).pathname;

  if (rawOriginal.length > MAX_PATH_LENGTH || rawReqPath.length > MAX_PATH_LENGTH) {
    return { action: "block", statusCode: 400, reason: "path_too_long" };
  }

  const { pathname: originalPathname, query: rawQuery } = stripQueryAndFragment(rawOriginal);
  const { pathname: reqPathOnly } = stripQueryAndFragment(rawReqPath);

  if (CONTROL_OR_NULL_RE.test(rawOriginal) || rawOriginal.includes("\0") || rawQuery.includes("\0")) {
    return { action: "block", statusCode: 400, reason: "null_or_control_in_url" };
  }

  // Validate BOTH candidates completely BEFORE checking any allowlist exception
  const candidates = [originalPathname, reqPathOnly];
  const normalizedCandidates: string[] = [];

  for (const candidate of candidates) {
    const decodedResult = decodeBounded(candidate);
    if ("reason" in decodedResult) {
      return { action: "block", statusCode: 400, reason: decodedResult.reason };
    }
    const structuralResult = validateStructure(candidate, decodedResult.decoded);
    if ("reason" in structuralResult) {
      return { action: "block", statusCode: 400, reason: structuralResult.reason };
    }
    normalizedCandidates.push(structuralResult.normalized);
  }

  // Only AFTER every candidate passed decoding & structural checks, test exact allow exceptions
  if (
    isExactAllowedException(
      originalPathname,
      reqPathOnly,
      rawQuery,
      method,
      isDev
    ) &&
    normalizedCandidates.every((c) => c === originalPathname)
  ) {
    return { action: "allow" };
  }

  // Evaluate sensitive-path denylist across EVERY normalized candidate
  for (const normalized of normalizedCandidates) {
    const violation = checkSensitivePath(normalized, isDev);
    if (violation) {
      return { action: "block", statusCode: 404, reason: violation };
    }
  }

  return { action: "allow" };
}

/**
 * Express middleware enforcing SEC-01 private-path isolation ahead of Vite and static file serving.
 */
export function createPrivatePathGuardMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const decision = evaluatePrivatePath({
      method: req.method,
      originalUrl: req.originalUrl,
      path: req.path,
      nodeEnv: process.env.NODE_ENV,
    });

    if (decision.action === "block") {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "no-store");
      return res.status(decision.statusCode).json({
        success: false,
        error: decision.statusCode === 400 ? "Bad Request." : "Resource not found.",
        statusCode: decision.statusCode,
      });
    }

    return next();
  };
}
