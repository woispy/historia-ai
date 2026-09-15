import fs from "node:fs/promises";
import path from "node:path";
import { extractCliopatriaCandidates } from "../CliopatriaCandidateExtractor.js";
import { reconcileHistoricalEntities } from "../HistoricalEntityReconciliation.js";

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
  console.log(`Usage: node tools/historical-gis/cli/extract-cliopatria-candidates.js \\
  --year 1326 \\
  --date 1326-04-07 \\
  --input <cliopatria.geojson> \\
  --rules <entity-reconciliation.json> \\
  --manifest <source.manifest.json> \\
  --output <candidates.json>`);
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function assertScenarioDate(scenarioDate, year) {
  const date = new Date(`${scenarioDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || !/^\d{4}-\d{2}-\d{2}$/.test(scenarioDate)) {
    throw new Error("--date must be an ISO date in YYYY-MM-DD format.");
  }
  if (date.getUTCFullYear() !== year) {
    throw new Error("--date year must match --year.");
  }
}

function buildArtifact({ year, scenarioDate, inputPath, rulesPath, manifestPath, manifest, extracted, reconciliation }) {
  const source = {
    sourceId: manifest.sourceId,
    provider: manifest.provider,
    dataset: manifest.dataset,
    version: manifest.version ?? null,
    releaseDate: manifest.releaseDate ?? null,
    archive: manifest.archive ?? null,
    license: manifest.license ?? null,
    authorityStatus: "evidence-only",
  };

  return {
    schemaVersion: 1,
    id: `historical_gis_${year}_cliopatria_candidates`,
    scenarioDate,
    targetYear: year,
    authorityStatus: "evidence-only",
    source,
    input: {
      geojsonPath: path.resolve(inputPath),
      reconciliationRulesPath: path.resolve(rulesPath),
      sourceManifestPath: path.resolve(manifestPath),
    },
    extraction: {
      polityOnly: true,
      temporalRule: "FromYear <= targetYear <= ToYear",
    },
    summary: {
      sourceFeatureCount: extracted.candidates.length + extracted.excluded.length,
      candidateCount: extracted.candidates.length,
      excludedCount: extracted.excluded.length,
      reconciledCount: reconciliation.reconciled.length,
      unresolvedCount: reconciliation.unresolved.length,
      ambiguousCount: reconciliation.ambiguous.length,
    },
    candidates: extracted.candidates,
    excluded: extracted.excluded,
    entityReconciliation: reconciliation,
    promotion: {
      status: "not-promoted",
      reason: "Cliopatria records are evidence candidates only; canonical political geometry and historical control require independent review and validation.",
    },
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    usage();
    return;
  }

  const year = Number(readFlag(args, "--year", { required: true }));
  const scenarioDate = readFlag(args, "--date", { required: true });
  const inputPath = readFlag(args, "--input", { required: true });
  const rulesPath = readFlag(args, "--rules", { required: true });
  const manifestPath = readFlag(args, "--manifest", { required: true });
  const outputPath = readFlag(args, "--output", { required: true });

  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    throw new Error("--year must be an integer between 1 and 9999.");
  }
  assertScenarioDate(scenarioDate, year);

  const [geojson, rulesDocument, manifest] = await Promise.all([
    readJson(inputPath),
    readJson(rulesPath),
    readJson(manifestPath),
  ]);

  if (manifest.sourceId !== "cliopatria-v0.2.0") {
    throw new Error("The source manifest must identify cliopatria-v0.2.0.");
  }
  if (manifest.scenarioDate !== scenarioDate) {
    throw new Error("Source manifest scenarioDate must match --date.");
  }
  if (rulesDocument.scenarioDate !== scenarioDate) {
    throw new Error("Entity reconciliation scenarioDate must match --date.");
  }
  if (!Array.isArray(rulesDocument.records)) {
    throw new Error("Entity reconciliation document must contain a records array.");
  }

  const extracted = extractCliopatriaCandidates(geojson, year, { polityOnly: true });
  const reconciliation = reconcileHistoricalEntities(extracted.candidates, rulesDocument.records);
  const artifact = buildArtifact({
    year,
    scenarioDate,
    inputPath,
    rulesPath,
    manifestPath,
    manifest,
    extracted,
    reconciliation,
  });

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");

  console.log(`Cliopatria candidate artifact written: ${outputPath}`);
  console.log(`Candidates: ${artifact.summary.candidateCount}`);
  console.log(`Reconciled: ${artifact.summary.reconciledCount}`);
  console.log(`Unresolved: ${artifact.summary.unresolvedCount}`);
  console.log(`Ambiguous: ${artifact.summary.ambiguousCount}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
