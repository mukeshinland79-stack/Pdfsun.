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

async function main() {
  console.log("Starting PDFSun automated QA test verification...");
  const results = await runPdfEngineTestSuite();
  for (const log of results.logs) {
    console.log(log);
  }
  if (results.failed > 0) {
    console.error(`QA Suite Failed with ${results.failed} failures.`);
    process.exit(1);
  } else {
    console.log(`All ${results.passed} tests passed successfully.`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Test runner encountered an error:", err);
  process.exit(1);
});
