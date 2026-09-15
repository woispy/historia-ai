/**
 * Historia AI — Visual Regression Tests
 *
 * Tests that rendering output matches baseline images.
 * Run with UPDATE_BASELINES=1 to update baselines.
 *
 * NOTE: Actual visual regression tests require a browser environment (Playwright/Puppeteer).
 * This test validates the infrastructure is ready.
 */

import { VisualRegressionTester, createVisualRegressionTest, snapshotTest, VisualRegressionConfig, DiffResult, compareImages } from "../visual-regression.js";
import { generateBiomePalette } from "../../src/map/terrain/TerrainTileProvider.js";

let passed = 0;

async function runTests() {
  // Test 1: VisualRegressionConfig defaults
  if (VisualRegressionConfig.pixelThreshold !== 2) throw new Error("Default pixelThreshold should be 2");
  if (VisualRegressionConfig.maxDiffPercent !== 0.1) throw new Error("Default maxDiffPercent should be 0.1");
  if (VisualRegressionConfig.updateBaselines !== false) throw new Error("Default updateBaselines should be false");
  console.log("✓ VisualRegressionConfig defaults");

  const diffResult1 = new DiffResult(1000, 1, 1);
  console.log('DEBUG: differentPixels =', diffResult1.differentPixels);
  console.log('DEBUG: totalPixels =', diffResult1.totalPixels);
  console.log('DEBUG: maxDiff =', diffResult1.maxDiff);
  console.log('DEBUG: diffPercent =', diffResult1.diffPercent);
  console.log('DEBUG: passed =', diffResult1.passed);
  console.log('DEBUG: VisualRegressionConfig.maxDiffPercent =', VisualRegressionConfig.maxDiffPercent);
  console.log('DEBUG: VisualRegressionConfig.pixelThreshold =', VisualRegressionConfig.pixelThreshold);
  if (diffResult1.totalPixels !== 1000) throw new Error("totalPixels should be 1000");
  if (diffResult1.differentPixels !== 1) throw new Error("differentPixels should be 1, got " + diffResult1.differentPixels);
  if (diffResult1.maxDiff !== 1) throw new Error("maxDiff should be 1");
  if (diffResult1.diffPercent !== 0.1) throw new Error("diffPercent should be 0.1, got " + diffResult1.diffPercent);
  if (diffResult1.passed !== true) throw new Error("passed should be true for small diff, got " + diffResult1.passed);

  const diffResult2 = new DiffResult(1000, 15, 5);
  if (diffResult2.passed !== false) throw new Error("passed should be false for large diff");
  console.log("✓ DiffResult");

  // Test: compareImages
  const { compareImages } = await import("../visual-regression.js");
  const baseline = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]); // 2 pixels
  const current = new Uint8Array([255, 0, 0, 255, 0, 254, 0, 255]); // 1 pixel diff in green
  const compareResult = compareImages(baseline, current, 2, 1);
  if (compareResult.totalPixels !== 2) throw new Error("totalPixels should be 2");
  if (compareResult.differentPixels !== 1) throw new Error("differentPixels should be 1");
  if (compareResult.maxDiff !== 1) throw new Error("maxDiff should be 1");
  if (compareResult.diffPercent !== 50) throw new Error("diffPercent should be 50");
  console.log("✓ compareImages");

  // Test: generateBiomePalette
  const { generateBiomePalette } = await import("../../src/map/terrain/TerrainTileProvider.js");
  const palette = (await import("../../src/map/terrain/TerrainTileProvider.js")).generateBiomePalette();
  if (!palette || !(palette instanceof Uint32Array)) throw new Error("palette should be Uint32Array");
  if (palette.length !== 11) throw new Error("palette should have 11 biomes");
  if ((palette[0] & 0xFF) !== 20) throw new Error("ocean R should be 20");
  if ((palette[0] >> 8 & 0xFF) !== 40) throw new Error("ocean G should be 40");
  if ((palette[0] >> 16 & 0xFF) !== 80) throw new Error("ocean B should be 80");
  if ((palette[0] >> 24 & 0xFF) !== 255) throw new Error("ocean A should be 255");
  console.log("✓ generateBiomePalette");

  // Test: VisualRegressionTester instantiation
  const { VisualRegressionTester } = await import("../visual-regression.js");
  const tester = new (await import("../visual-regression.js")).VisualRegressionTester({ baselineDir: "/tmp/test-baselines" });
  if (!tester.baselineDir.includes("test-baselines")) throw new Error("baselineDir not set correctly");
  console.log("✓ VisualRegressionTester instantiation");

  // Test: snapshotTest
  const { snapshotTest } = await import("../visual-regression.js");
  const data = { version: 1, data: [1, 2, 3] };
  // Create directory for snapshots
  const fs = await import("node:fs/promises");
  await fs.mkdir("/tmp/test-snapshots", { recursive: true });
  const snapshotResult = (await import("../visual-regression.js")).snapshotTest("test-snapshot", data, { baselineDir: "/tmp/test-snapshots", updateSnapshots: true });
  if (!snapshotResult.passed) throw new Error("snapshotTest should pass with updateSnapshots=true");
  if (!snapshotResult.snapshotCreated) throw new Error("snapshotCreated should be true");
  console.log("✓ snapshotTest");

  console.log("\n✓ All visual regression infrastructure tests passed!");
  console.log("Note: Actual visual regression tests require browser environment (Playwright/Puppeteer)");
}

await (async () => {
  try {
    console.log("Running visual regression infrastructure tests...\n");
    await runTests();
  } catch (error) {
    console.error("Test failed:", error.message);
    process.exit(1);
  }
})();
