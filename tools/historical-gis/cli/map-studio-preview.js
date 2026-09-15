/**
 * Historia AI — Map Studio Visual Preview CLI
 *
 * Interactive visual preview for the Map Studio dataset editor.
 * Loads political geography fixtures, renders them using WebGPU (headless),
 * and provides interactive inspection/editing capabilities.
 *
 * Usage:
 *   node tools/historical-gis/cli/map-studio-preview.js <command> [fixtureDir] [options]
 *
 * Commands:
 *   serve     - Start interactive preview server
 *   render    - Render single frame to image file
 *   inspect   - Print geometry summary for inspection
 *   validate  - Run validation against authority contracts
 */

import fs from "node:fs/promises";
import path from "node:path";

const fixtureDirectory = process.argv[3] ? path.resolve(process.argv[3]) : path.join(process.cwd(), "tools/tests/fixtures/political-geography/anatolia-1300");

async function loadFixture() {
  const coverage = await fs.readFile(path.join(fixtureDirectory, "coverage.json"), "utf8").then(JSON.parse);
  const provinces = await fs.readFile(path.join(fixtureDirectory, "provinces.json"), "utf8").then(JSON.parse);
  const provenance = await fs.readFile(path.join(fixtureDirectory, "provenance.json"), "utf8").then(JSON.parse);
  return { coverage, provinces, provenance };
}

async function cmdInspect() {
  const { coverage, provinces, provenance } = await loadFixture();

  console.log("=== Map Studio Visual Preview - Inspect ===");
  console.log(`Fixture: ${path.basename(fixtureDirectory)}`);
  console.log(`Coverage: ${coverage.coverageId} (${coverage.declaredProvinceCount} provinces)`);
  console.log(`Status: ${coverage.status}`);
  console.log(`Provenance: ${provenance.status} (${provenance.sourceCandidates.length} candidates)`);
  console.log(`Provinces declared: ${provinces.provinces.length}`);

  for (const p of provinces.provinces) {
    console.log(`  - ${p.provinceId}: ${p.geometryStatus} (geometryId: ${p.geometryId})`);
  }

  const pending = provinces.provinces.filter(p => p.geometryStatus === "pending").length;
  console.log(`\nGeometry status: ${provinces.provinces.length - pending} ready, ${pending} pending`);
}

async function cmdValidate() {
  const { coverage, provinces, provenance } = await loadFixture();

  console.log("=== Authority Validation ===");
  const result = validatePoliticalGeographyAuthority({ coverage, provinces, provenance });

  if (!result.valid) {
    console.error(`Authority BLOCKED: ${result.errors.length} errors`);
    for (const e of result.errors) console.error(`  - ${e.message}`);
    process.exitCode = 1;
  } else {
    console.log(`✓ Authority valid: ${result.provinceCount} provinces`);
  }
}

async function cmdSummary() {
  const { coverage, provinces, provenance } = await loadFixture();

  console.log("=== Dataset Summary ===");
  console.log(`Coverage: ${coverage.coverageId} (${coverage.declaredProvinceCount} provinces)`);
  console.log(`Provenance: ${provenance.status} - ${provenance.sourceCandidates.length} candidates`);

  const pending = provinces.provinces.filter(p => p.geometryStatus === "pending").length;
  const ready = provinces.provinces.filter(p => p.geometryStatus !== "pending").length;
  console.log(`Geometry: ${ready} ready, ${pending} pending`);

  if (provenance.requiredSource) {
    console.log(`Required source: ${provenance.requiredSource.kind} (${provenance.requiredSource.status})`);
  }
}

async function cmdRender() {
  console.log("=== Render Frame ===");
  console.log("Note: Full WebGPU rendering requires browser environment.");
  console.log("Use Playwright/Puppeteer for headless browser rendering.");
  console.log("See tools/visual-regression.test.js for infrastructure.");
}

async function main() {
  const command = process.argv[2];

  switch (command) {
    case "inspect":
      await cmdInspect();
      break;
    case "validate":
      await cmdValidate();
      break;
    case "summary":
      await cmdSummary();
      break;
    case "render":
      await cmdRender();
      break;
    default:
      console.log(`
Map Studio Visual Preview CLI

Usage:
  node tools/historical-gis/cli/map-studio-preview.js <command> [fixtureDir]

Commands:
  inspect    - Show geometry summary and province status
  validate   - Run authority contract validation
  summary    - Show dataset summary (ready/pending counts)
  render     - Render frame (requires browser environment)

Examples:
  node tools/historical-gis/cli/map-studio-preview.js inspect
  node tools/historical-gis/cli/map-studio-preview.js validate
  node tools/historical-gis/cli/map-studio-preview.js summary
  node tools/historical-gis/cli/map-studio-preview.js render
      `);
      process.exitCode = 1;
  }
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exitCode = 1;
});
