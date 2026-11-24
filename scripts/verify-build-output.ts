import fs from "fs";
import path from "path";

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
];

const FORBIDDEN_DIST_CONTENT_RULES: Array<{ label: string; pattern: RegExp }> = [
  { label: "Personal Owner Gmail address (PII-01)", pattern: /mukeshinland79@gmail\.com/i },
  { label: "Personal Customer Gmail address (PII-01)", pattern: /mukeshkalonia241@gmail\.com/i },
  { label: "Server-only ownerIdentity module reference", pattern: /SERVER_OWNER_EMAILS/i },
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

// Execute directly when invoked via CLI (`tsx scripts/verify-build-output.ts`)
const isDirectRun =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv.some((arg) => arg.endsWith("verify-build-output.ts") || arg.endsWith("verify-build-output.js"));

if (isDirectRun) {
  const result = verifyBuildOutput();
  if (!result.passed) {
    console.error("\n[BUILD SECURITY ASSERTION FAILED]");
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }
  console.log(
    `[BUILD SECURITY ASSERTION PASSED] dist/ contains ${result.publicFileCount} public files (0 server bundles, 0 sourcemaps, 0 paste artifacts, 0 PII/mailbox leaks, 0 secret/config files). Backend bundle isolated at dist-server/server.cjs (${(result.serverBundleBytes / 1024).toFixed(1)} KB).`
  );
}
