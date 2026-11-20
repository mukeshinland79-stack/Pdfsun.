import React from "react";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { ALL_TOOLS } from "../data/toolsData";
import { ToolCard } from "../components/ToolCard";
import { QuickTipTooltip } from "../components/QuickTipTooltip";
import { LanguageProvider } from "../lib/i18n";

const noop = () => {};

console.log("\n=== PDFSun.in — Global Quick Tip Removal & 68-Tool Card Audit ===");

let passed = 0;
let failed = 0;

function runTest(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err: unknown) {
    failed++;
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ ${name}\n    ${msg}`);
  }
}

runTest("All 68 registered tools exist and render via ToolCard cleanly", () => {
  assert.equal(ALL_TOOLS.length, 68, `Expected 68 tools, got ${ALL_TOOLS.length}`);

  for (const tool of ALL_TOOLS) {
    const html = renderToStaticMarkup(
      <LanguageProvider>
        <ToolCard
          tool={tool}
          isFavorite={false}
          onToggleFavorite={noop}
          onSelectTool={noop}
          isMostPopular={tool.id === "merge-pdf"}
          ratingState={{ avgRating: 4.9, totalRatings: 120 }}
          onRateTool={noop}
        />
      </LanguageProvider>
    );

    // Zero floating black Quick Tip popup or trigger markup
    assert.ok(!html.includes("Show quick tip"), `Tool ${tool.id} still has Show quick tip button`);
    assert.ok(!html.includes("Hover for quick tip"), `Tool ${tool.id} still has Hover for quick tip trigger`);
    assert.ok(!html.includes("Quick Tip"), `Tool ${tool.id} still renders Quick Tip text`);
    assert.ok(!html.includes("group-hover:block"), `Tool ${tool.id} still has group-hover:block floating popup`);
    assert.ok(!html.includes("bg-slate-900 text-white"), `Tool ${tool.id} still renders black floating popup`);

    // Essential tool card controls preserved
    assert.ok(html.includes(`id="tool-card-${tool.id}"`), `Tool ${tool.id} missing card ID`);
    assert.ok(html.includes(`href="/${tool.slug}"`), `Tool ${tool.id} missing tool link`);
    assert.ok(html.includes("Open Tool"), `Tool ${tool.id} missing Open Tool label`);
    const escapedName = tool.name.replace(/&/g, "&amp;");
    assert.ok(html.includes(`Rate ${escapedName}`), `Tool ${tool.id} missing rating control`);
    if (tool.isPro) {
      assert.ok(html.includes("PRO"), `Pro tool ${tool.id} missing PRO badge`);
    }
  }
});

runTest("QuickTipTooltip no longer contains any detached black floating hover popover", () => {
  const html = renderToStaticMarkup(<QuickTipTooltip toolId="merge-pdf" variant="inline" />);

  assert.ok(!html.includes("group-hover:block"), "QuickTipTooltip must not render group-hover:block");
  assert.ok(!html.includes("Hover for quick tip"), "QuickTipTooltip must not render hover trigger");
  assert.ok(!html.includes("bg-slate-900 text-white"), "QuickTipTooltip must not render detached black popup");
  assert.ok(!html.includes("bottom-full mb-2"), "QuickTipTooltip must not render floating positioned overlay");
  assert.ok(
    html.includes("Tip: Compress heavy images before merging"),
    "Inline workspace instruction tip should remain intact"
  );
});

console.log(`\nQuick Tip Removal Audit Summary: ${passed}/${passed + failed} passed\n`);
if (failed > 0) {
  process.exit(1);
}
