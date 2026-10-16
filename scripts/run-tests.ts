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
