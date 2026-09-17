import fs from "node:fs/promises";
import path from "node:path";
import { reconcileHistoricalGeometryEvidence } from "../HistoricalGeometryReconciliation.js";

function readFlag(args, name, { required = false } = {}) {
  const index = args.indexOf(name);
  if (index === -1) {
    if (required) throw new Error(`${name} is required.`);
    return null;
  }
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value.`);
  return value;
}

function usage() {
  console.log(`Usage: node tools/historical-gis/cli/reconcile-historical-geometries.js \
  --year 1326 \
  --date 1326-04-07 \
  --inventory <inventory.json> [--inventory <inventory.json> ...] \
  --output <reconciliation.json> \
  [--area-threshold 0.35]`);
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    usage();
    return;
  }

  const year = Number(readFlag(args, "--year", { required: true }));
  const scenarioDate = readFlag(args, "--date", { required: true });
  const outputPath = readFlag(args, "--output", { required: true });
  const thresholdValue = readFlag(args, "--area-threshold");
  const areaDifferenceThreshold = thresholdValue === null ? 0.35 : Number(thresholdValue);
  const inventoryPaths = [];

  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--inventory") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) throw new Error("--inventory requires a value.");
      inventoryPaths.push(value);
      index += 1;
    }
  }

  if (inventoryPaths.length === 0) throw new Error("At least one --inventory is required.");
  if (!Number.isInteger(year) || year < 1 || year > 9999) throw new Error("--year must be an integer between 1 and 9999.");

  const inventories = await Promise.all(inventoryPaths.map(readJson));
  const reconciliation = reconcileHistoricalGeometryEvidence({
    scenarioDate,
    targetYear: year,
    inventories,
    areaDifferenceThreshold,
  });

  reconciliation.input = {
    inventoryPaths: inventoryPaths.map((filePath) => path.resolve(filePath)),
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(reconciliation, null, 2)}\n`, "utf8");

  console.log(`Historical geometry reconciliation written: ${outputPath}`);
  console.log(`Entities: ${reconciliation.summary.entityCount}`);
  console.log(`Corroborated: ${reconciliation.summary.corroboratedCount}`);
  console.log(`Needs review: ${reconciliation.summary.needsReviewCount}`);
  console.log(`Geometry candidates: ${reconciliation.summary.geometryCandidateCount}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
