import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  acquireHistoricalSource,
  writeHistoricalSourceEvidence,
} from "../HistoricalSourceAcquisition.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function readArg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function requireArg(name) {
  const value = readArg(name);
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function requireYear() {
  const value = Number(requireArg("--year"));
  if (!Number.isInteger(value) || value < 1 || value > 9999) {
    throw new Error("--year must be an integer between 1 and 9999.");
  }
  return value;
}

const year = requireYear();
const input = readArg("--input");
const url = readArg("--url");
const sourceId = requireArg("--source-id");
const provider = requireArg("--provider");
const dataset = requireArg("--dataset");
const version = readArg("--version");
const license = readArg("--license");
const acquiredAt = readArg("--acquired-at");
const expectedInputSha256 = readArg("--expected-sha256");
const allowTimeless = process.argv.includes("--allow-timeless");

if ((input && url) || (!input && !url)) {
  throw new Error("Provide exactly one of --input or --url.");
}

const defaultOutput = path.join(
  root,
  "data",
  "gis",
  String(year),
  "evidence",
  `${sourceId}.geojson`,
);
const outputPath = path.resolve(process.cwd(), readArg("--output", defaultOutput));
const defaultManifest = outputPath.replace(/\.geojson$/i, ".manifest.json");
const manifestPath = path.resolve(
  process.cwd(),
  readArg("--manifest", defaultManifest),
);

const result = await acquireHistoricalSource({
  inputPath: input ? path.resolve(process.cwd(), input) : undefined,
  url: url ?? undefined,
  sourceId,
  provider,
  dataset,
  version,
  targetYear: year,
  scenarioDate: readArg("--date", `${String(year).padStart(4, "0")}-01-01`),
  projection: readArg("--projection", "EPSG:4326"),
  license,
  acquiredAt,
  allowTimeless,
  expectedInputSha256,
});

await writeHistoricalSourceEvidence({
  outputPath,
  manifestPath,
  evidenceGeoJson: result.evidenceGeoJson,
  report: result.report,
});

console.log(`Acquired ${result.report.counts.inputFeatures} source features for ${year}.`);
console.log(`Retained ${result.report.counts.retainedFeatures} temporal evidence features.`);
console.log(`Excluded ${result.report.counts.excludedFeatures} features.`);
console.log(`Evidence written to ${outputPath}.`);
console.log(`Acquisition manifest written to ${manifestPath}.`);
console.log("Authority status: evidence-only; canonical promotion was not performed.");