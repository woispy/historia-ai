import fs from "node:fs/promises";
import path from "node:path";
import { extractCliopatriaCandidates } from "../CliopatriaCandidateExtractor.js";
import { reconcileHistoricalEntities } from "../HistoricalEntityReconciliation.js";
import { buildHistoricalGeometryEvidenceInventory } from "../HistoricalGeometryEvidenceInventory.js";

function readFlag(args, name, { required = false } = {}) {
  const index = args.indexOf(name);
  if (index === -1) {
    if (required) throw new Error(`${name} is required.`);
    return null;
  }
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value.`);
  }
  return value;
}

function usage() {
  console.log(`Usage: node tools/historical-gis/cli/inventory-historical-geometries.js \\
  --year 1326 \\
  --input <cliopatria.geojson> \\
  --rules <entity-reconciliation.json> \\
  --matrix <evidence-matrix.json> \\
  --output <inventory.json> \\
  [--date 1326-04-07] \\
  [--source-id cliopatria-v0.2.0] \\
  [--version v0.2.0]`);
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
  const inputPath = readFlag(args, "--input", { required: true });
  const rulesPath = readFlag(args, "--rules", { required: true });
  const matrixPath = readFlag(args, "--matrix", { required: true });
  const outputPath = readFlag(args, "--output", { required: true });
  const scenarioDate = readFlag(args, "--date") ?? `${String(year).padStart(4, "0")}-01-01`;
  const sourceId = readFlag(args, "--source-id") ?? "historical-source";
  const version = readFlag(args, "--version");

  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    throw new Error("--year must be an integer between 1 and 9999.");
  }

  const [geojson, rulesDocument, matrixDocument] = await Promise.all([
    readJson(inputPath),
    readJson(rulesPath),
    readJson(matrixPath),
  ]);

  const { candidates, excluded } = extractCliopatriaCandidates(geojson, year);
  const reconciliation = reconcileHistoricalEntities(candidates, rulesDocument.records ?? []);
  const inventory = buildHistoricalGeometryEvidenceInventory({
    sourceId,
    version,
    scenarioDate,
    targetYear: year,
    candidates,
    reconciliation,
  });

  inventory.input = {
    sourcePath: path.resolve(inputPath),
    rulesPath: path.resolve(rulesPath),
    matrixPath: path.resolve(matrixPath),
    excludedFeatureCount: excluded.length,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(inventory, null, 2)}\n`, "utf8");

  console.log(`Historical geometry evidence inventory written: ${outputPath}`);
  console.log(`Candidates: ${inventory.summary.candidateCount}`);
  console.log(`Polygon: ${inventory.summary.polygonCount}`);
  console.log(`MultiPolygon: ${inventory.summary.multiPolygonCount}`);
  console.log(`Missing geometry: ${inventory.summary.missingGeometryCount}`);
  console.log(`Matched: ${inventory.summary.matchedCount}`);
  console.log(`Ambiguous: ${inventory.summary.ambiguousCount}`);
  console.log(`Unresolved: ${inventory.summary.unresolvedCount}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
