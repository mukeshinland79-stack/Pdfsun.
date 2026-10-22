// Headless Node environment polyfills for pdfjs-dist
if (typeof (Promise as any).try === "undefined") {
  (Promise as any).try = function (fn: any, ...args: any[]) {
    return new Promise((resolve) => resolve(fn(...args)));
  };
}
if (typeof (globalThis as any).DOMMatrix === "undefined") {
  (globalThis as any).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
  };
}

import { runPdfEngineTestSuite } from "../src/tests/pdfEngine.test";
import { runSecurityRemediationTestSuite } from "../src/tests/securityRemediation.test";

async function main() {
  console.log("Starting PDFSun automated QA test verification...");
  const pdfResults = await runPdfEngineTestSuite();
  for (const log of pdfResults.logs) {
    console.log(log);
  }

  console.log("\nStarting Security Remediation test verification...");
  const secResults = await runSecurityRemediationTestSuite();
  for (const log of secResults.logs) {
    console.log(log);
  }

  const totalFailed = pdfResults.failed + secResults.failed;
  const totalPassed = pdfResults.passed + secResults.passed;

  if (totalFailed > 0) {
    console.error(`QA Suite Failed with ${totalFailed} total failures.`);
    process.exit(1);
  } else {
    console.log(`\nAll ${totalPassed} tests passed successfully (${pdfResults.passed} engine + ${secResults.passed} security).`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Test runner encountered an error:", err);
  process.exit(1);
});
