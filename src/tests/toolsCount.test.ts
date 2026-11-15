import { ALL_TOOLS } from "../data/toolsData";

console.log("==========================================================================");
console.log("PDFSun.in — 68-TOOL INVARIANT AUDIT SUITE");
console.log("==========================================================================");

const count = ALL_TOOLS.length;
console.log(`Tool count: ${count}`);

if (count !== 68) {
  console.error(`❌ FAILED: Expected exactly 68 tools, got ${count}`);
  process.exit(1);
}

const uniqueIds = new Set(ALL_TOOLS.map((t) => t.id));
if (uniqueIds.size !== 68) {
  console.error(`❌ FAILED: Duplicate tool IDs detected! Unique count: ${uniqueIds.size}`);
  process.exit(1);
}

console.log("✅ PASS: All 68 registered tools preserved intact with unique IDs.");
