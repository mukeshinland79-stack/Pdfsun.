import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";

const ROOT_DIR = process.cwd();
const PUBLIC_DIST_DIR = path.join(ROOT_DIR, "dist");
const SERVER_DIST_DIR = path.join(ROOT_DIR, "dist-server");

const FORBIDDEN_DIST_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  { label: "CommonJS server bundle (*.cjs)", regex: /\.cjs$/i },
  { label: "CommonJS server sourcemap (*.cjs.map)", regex: /\.cjs\.map$/i },
  { label: "Backend server artifact (server.*)", regex: /^server\./i },
  { label: "Environment/secret file (.env*)", regex: /^\.env/i },
  { label: "Backend JSON runtime store (*_store.json)", regex: /_store\.json$/i },
  { label: "Backend system config (system_config.json)", regex: /^system_config\.json$/i },
  { label: "Package manifest (package*.json)", regex: /^package(-lock)?\.json$/i },
  { label: "Firestore security rules (firestore.rules)", regex: /^firestore\.rules$/i },
  { label: "Firebase blueprint (firebase-blueprint.json)", regex: /^firebase-blueprint\.json$/i },
  { label: "Vercel config (vercel.json)", regex: /^vercel\.json$/i },
  { label: "Container spec (Dockerfile*)", regex: /^Dockerfile/i },
  { label: "Raw TypeScript source (*.ts / *.tsx)", regex: /\.tsx?$/i },
  { label: "Private key or certificate (*.pem / *.key)", regex: /\.(pem|key)$/i },
  { label: "Public JavaScript sourcemap (*.map)", regex: /\.map$/i },
  { label: "Internal AI Studio paste artifact (assets/aistudio/Paste_*)", regex: /(^|\/)assets\/aistudio\/Paste_/i },
  { label: "Private runtime data directory (.data/*)", regex: /(^|\/)\.data(\/|$)/i },
  { label: "Private support inquiry store (support_inquiries*.json)", regex: /^support_inquiries.*\.json$/i },
];

const FORBIDDEN_DIST_CONTENT_RULES: Array<{ label: string; pattern: RegExp }> = [
  { label: "Personal Owner Gmail address (PII-01)", pattern: /mukeshinland79@gmail\.com/i },
  { label: "Personal Customer Gmail address (PII-01)", pattern: /mukeshkalonia241@gmail\.com/i },
  { label: "Server-only ownerIdentity module reference", pattern: /SERVER_OWNER_EMAILS/i },
  { label: "Unverified support mailto claim (MAILBOX-01)", pattern: /mailto:support@pdfsun\.in/i },
  { label: "Unverified support mailbox reference (MAILBOX-01)", pattern: /support@pdfsun\.in/i },
  { label: "Unsupported email-reply delivery claim (MAILBOX-01)", pattern: /get back to you via email shortly/i },
];

const TEXT_SCAN_EXTENSIONS = new Set([".html", ".js", ".mjs", ".css", ".json", ".txt", ".xml"]);

const REQUIRED_PUBLIC_FILES = ["index.html", "robots.txt", "sitemap.xml"];

function walkDir(dir: string, baseDir: string = dir): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath, baseDir));
    } else {
      files.push(path.relative(baseDir, fullPath).replace(/\\/g, "/"));
    }
  }
  return files;
}

export interface BuildOutputVerificationResult {
  passed: boolean;
  errors: string[];
  publicFileCount: number;
  serverBundleBytes: number;
}

export function verifyBuildOutput(rootDir: string = ROOT_DIR): BuildOutputVerificationResult {
  const publicDistDir = path.join(rootDir, "dist");
  const serverDistDir = path.join(rootDir, "dist-server");
  const serverBundlePath = path.join(serverDistDir, "server.cjs");
  const errors: string[] = [];

  if (!fs.existsSync(publicDistDir)) {
    errors.push(`Public build directory missing: ${publicDistDir}`);
    return { passed: false, errors, publicFileCount: 0, serverBundleBytes: 0 };
  }

  const publicFiles = walkDir(publicDistDir);

  for (const reqFile of REQUIRED_PUBLIC_FILES) {
    if (!publicFiles.includes(reqFile)) {
      errors.push(`Required public artifact missing from dist/: ${reqFile}`);
    }
  }

  for (const relFile of publicFiles) {
    const baseName = path.basename(relFile);
    for (const rule of FORBIDDEN_DIST_PATTERNS) {
      if (rule.regex.test(baseName) || rule.regex.test(relFile)) {
        errors.push(`SECURITY VIOLATION: Forbidden file inside public dist/: "${relFile}" (matched ${rule.label})`);
      }
    }

    const ext = path.extname(relFile).toLowerCase();
    if (TEXT_SCAN_EXTENSIONS.has(ext)) {
      try {
        const content = fs.readFileSync(path.join(publicDistDir, relFile), "utf8");
        for (const contentRule of FORBIDDEN_DIST_CONTENT_RULES) {
          if (contentRule.pattern.test(content)) {
            errors.push(
              `PRIVACY VIOLATION: Forbidden string inside public dist/${relFile} (matched ${contentRule.label})`
            );
          }
        }
      } catch {
        // Ignore unreadable binary edge files
      }
    }
  }

  let serverBundleBytes = 0;
  if (!fs.existsSync(serverBundlePath)) {
    errors.push(`Compiled backend bundle missing: ${path.relative(rootDir, serverBundlePath)}`);
  } else {
    serverBundleBytes = fs.statSync(serverBundlePath).size;
    if (serverBundleBytes < 1024) {
      errors.push(`Compiled backend bundle appears truncated (${serverBundleBytes} bytes).`);
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    publicFileCount: publicFiles.length,
    serverBundleBytes,
  };
}

const PLATFORM_IMPLICIT_ENV_VARS = new Set([
  "NODE_ENV",
  "VERCEL",
  "VERCEL_ENV",
  "VERCEL_URL",
  "PORT",
  "VITEST",
  "JEST_WORKER_ID",
]);

function collectEnvReferences(rootDir: string): string[] {
  const targets = [
    path.join(rootDir, "server.ts"),
    path.join(rootDir, "vite.config.ts"),
    path.join(rootDir, "api"),
    path.join(rootDir, "src", "server"),
  ];
  const found = new Set<string>();
  const envRe = /process\.env\.([A-Z][A-Z0-9_]*)/g;

  const scanFile = (filePath: string) => {
    if (!fs.existsSync(filePath)) return;
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(filePath, { withFileTypes: true })) {
        scanFile(path.join(filePath, entry.name));
      }
      return;
    }
    if (!/\.(ts|tsx|js|cjs|mjs)$/.test(filePath)) return;
    const content = fs.readFileSync(filePath, "utf8");
    let m: RegExpExecArray | null;
    while ((m = envRe.exec(content)) !== null) {
      found.add(m[1]);
    }
  };

  for (const t of targets) scanFile(t);
  return Array.from(found).sort();
}

export interface DeploymentReleaseGateResult {
  passed: boolean;
  errors: string[];
  checksExecuted: string[];
}

export function verifyDeploymentReleaseGate(
  rootDir: string = ROOT_DIR
): DeploymentReleaseGateResult {
  const errors: string[] = [];
  const checksExecuted: string[] = [];

  // 1. Serverless entrypoint & no ESM collision
  checksExecuted.push("serverless_entrypoint");
  const cjsEntry = path.join(rootDir, "api", "index.cjs");
  const tsEntry = path.join(rootDir, "api", "index.ts");
  if (!fs.existsSync(cjsEntry)) {
    errors.push("Missing CommonJS Vercel serverless entrypoint: api/index.cjs");
  } else {
    const cjsContent = fs.readFileSync(cjsEntry, "utf8");
    if (!cjsContent.includes("dist-server/server.cjs") || !cjsContent.includes("module.exports")) {
      errors.push("api/index.cjs must load ../dist-server/server.cjs and export handler via module.exports");
    }
  }
  if (fs.existsSync(tsEntry)) {
    errors.push("Conflicting ESM entrypoint api/index.ts still exists alongside api/index.cjs");
  }

  // 2. package.json Node.js 22.x engine pin
  checksExecuted.push("node_engine_pin");
  const pkgPath = path.join(rootDir, "package.json");
  if (!fs.existsSync(pkgPath)) {
    errors.push("package.json missing");
  } else {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      if (!pkg?.engines?.node || !String(pkg.engines.node).includes("22")) {
        errors.push(`package.json must pin engines.node to 22.x (found: ${JSON.stringify(pkg?.engines)})`);
      }
    } catch {
      errors.push("package.json is not valid JSON");
    }
  }

  // 3. vercel.json serverless & Service Worker Cache-Control contract
  checksExecuted.push("vercel_config_and_sw_headers");
  const vercelPath = path.join(rootDir, "vercel.json");
  if (!fs.existsSync(vercelPath)) {
    errors.push("vercel.json missing");
  } else {
    try {
      const vj = JSON.parse(fs.readFileSync(vercelPath, "utf8"));
      if (vj?.functions?.["api/index.ts"]) {
        errors.push("vercel.json functions still references removed api/index.ts");
      }
      const fnCfg = vj?.functions?.["api/index.cjs"];
      if (!fnCfg) {
        errors.push("vercel.json functions must configure api/index.cjs");
      } else if (!String(fnCfg.includeFiles || "").includes("dist-server/server.cjs")) {
        errors.push("vercel.json functions['api/index.cjs'].includeFiles must include dist-server/server.cjs");
      }

      const headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }> =
        Array.isArray(vj?.headers) ? vj.headers : [];
      const swIdx = headers.findIndex((h) => h.source === "/sw.js");
      if (swIdx < 0) {
        errors.push("vercel.json must define an explicit /sw.js header rule with no-cache policy");
      } else {
        const swCc = headers[swIdx].headers.find((h) => h.key.toLowerCase() === "cache-control")?.value || "";
        if (!/no-cache/i.test(swCc) || !/must-revalidate/i.test(swCc) || /immutable/i.test(swCc)) {
          errors.push(`vercel.json /sw.js Cache-Control must enforce no-cache + must-revalidate without immutable (got: "${swCc}")`);
        }
        // Ensure no subsequent header rule sets immutable Cache-Control on /sw.js
        for (let i = swIdx + 1; i < headers.length; i++) {
          const rule = headers[i];
          const cc = rule.headers?.find((h) => h.key.toLowerCase() === "cache-control")?.value || "";
          if (/immutable/i.test(cc) && rule.source.includes("js")) {
            errors.push(`vercel.json rule "${rule.source}" after /sw.js risks overriding /sw.js with immutable caching`);
          }
        }
      }
    } catch {
      errors.push("vercel.json is not valid JSON");
    }
  }

  // 4. public/sw.js explicit /api/ bypass & PDFSun-scoped cache retirement
  checksExecuted.push("service_worker_api_bypass");
  const swPath = path.join(rootDir, "public", "sw.js");
  if (!fs.existsSync(swPath)) {
    errors.push("public/sw.js missing");
  } else {
    const swSrc = fs.readFileSync(swPath, "utf8");
    if (!swSrc.includes("url.pathname.startsWith('/api/')") && !swSrc.includes('url.pathname.startsWith("/api/")')) {
      errors.push("public/sw.js must explicitly bypass /api/ requests before caching strategies");
    }
    if (!swSrc.includes("startsWith('pdfsun-')") && !swSrc.includes('startsWith("pdfsun-")')) {
      errors.push("public/sw.js activate cleanup must scope deletions to pdfsun-* caches only");
    }
  }

  // 5. Environment variable NAME parity (.env.example — names only, zero values inspected)
  checksExecuted.push("env_example_name_parity");
  const envExamplePath = path.join(rootDir, ".env.example");
  if (!fs.existsSync(envExamplePath)) {
    errors.push(".env.example missing");
  } else {
    const declared = new Set(
      fs
        .readFileSync(envExamplePath, "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => /^[A-Z][A-Z0-9_]*=/.test(line))
        .map((line) => line.split("=")[0])
    );
    const referenced = collectEnvReferences(rootDir);
    const missing = referenced.filter(
      (name) => !PLATFORM_IMPLICIT_ENV_VARS.has(name) && !declared.has(name)
    );
    if (missing.length > 0) {
      errors.push(`Undocumented process.env variable name(s) missing from .env.example: ${missing.join(", ")}`);
    }
  }

  // 6. Serverless CJS cold-start verification in a read-only (chmod 555) directory under VERCEL=1 NODE_ENV=production
  checksExecuted.push("serverless_readonly_cold_start");
  if (fs.existsSync(cjsEntry) && fs.existsSync(path.join(rootDir, "dist-server", "server.cjs"))) {
    const roDir = fs.mkdtempSync(path.join(os.tmpdir(), "pdfsun-ro-coldstart-"));
    try {
      fs.chmodSync(roDir, 0o555);
      const probe = spawnSync(
        process.execPath,
        [
          "-e",
          `const h = require(${JSON.stringify(cjsEntry)}); if (typeof h !== "function") { console.error("NOT_A_FUNCTION"); process.exit(2); } console.log("COLD_START_OK"); process.exit(0);`,
        ],
        {
          cwd: roDir,
          env: {
            ...process.env,
            NODE_ENV: "production",
            VERCEL: "1",
            PDFSUN_DISABLE_AUTO_LISTEN: "1",
          },
          encoding: "utf8",
          timeout: 15000,
        }
      );
      if (probe.status !== 0 || !(probe.stdout || "").includes("COLD_START_OK")) {
        errors.push(
          `Serverless CJS read-only cold start failed (exit=${probe.status}): ${(probe.stderr || probe.stdout || "").trim().slice(0, 400)}`
        );
      }
    } finally {
      try {
        fs.chmodSync(roDir, 0o755);
        fs.rmSync(roDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors on temp dir
      }
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    checksExecuted,
  };
}

// Execute directly when invoked via CLI (`tsx scripts/verify-build-output.ts`)
const isDirectRun =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv.some((arg) => arg.endsWith("verify-build-output.ts") || arg.endsWith("verify-build-output.js"));

if (isDirectRun) {
  const result = verifyBuildOutput();
  const gateResult = verifyDeploymentReleaseGate();
  if (!result.passed || !gateResult.passed) {
    console.error("\n[BUILD & RELEASE GATE ASSERTION FAILED]");
    for (const err of [...result.errors, ...gateResult.errors]) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }
  console.log(
    `[BUILD SECURITY ASSERTION PASSED] dist/ contains ${result.publicFileCount} public files (0 server bundles, 0 sourcemaps, 0 paste artifacts, 0 PII/mailbox leaks, 0 secret/config files). Backend bundle isolated at dist-server/server.cjs (${(result.serverBundleBytes / 1024).toFixed(1)} KB).`
  );
  console.log(
    `[DEPLOYMENT RELEASE GATE PASSED] Verified ${gateResult.checksExecuted.length} controls: ${gateResult.checksExecuted.join(", ")}.`
  );
}
