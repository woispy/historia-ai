import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { extractCliopatriaCandidates } from "../CliopatriaCandidateExtractor.js";
import { auditHistoricalEntityEvidence } from "../HistoricalEntityEvidenceAudit.js";
import { reconcileHistoricalEntities } from "../HistoricalEntityReconciliation.js";

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

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

const year = requireYear();
const inputPath = path.resolve(process.cwd(), requireArg("--input"));
const rulesPath = path.resolve(
  process.cwd(),
  readArg("--rules", path.join(root, "data", "gis", String(year), "entity-reconciliation.json")),
);
const matrixPath = path.resolve(
  process.cwd(),
  readArg("--matrix", path.join(root, "data", "gis", String(year), "evidence-matrix.json")),
);
const outputPath = path.resolve(
  process.cwd(),
  readArg(
    "--output",
    path.join(root, "data", "gis", String(year), "entity-evidence-audit.json"),
  ),
);
const scenarioDate = readArg(
  "--date",
  `${String(year).padStart(4, "0")}-01-01`,
);

const [geojson, rulesDocument, matrixDocument] = await Promise.all([
  readJson(inputPath),
  readJson(rulesPath),
  readJson(matrixPath),
]);

const { candidates } = extractCliopatriaCandidates(geojson, year);
const reconciliation = reconcileHistoricalEntities(candidates, rulesDocument.records ?? []);
const report = auditHistoricalEntityEvidence({
  scenarioDate,
  targetYear: year,
  matrixRecords: matrixDocument.records ?? [],
  candidates,
  reconciliation,
});

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(`Audited ${report.entities.length} canonical entities for ${scenarioDate}.`);
console.log(`Source candidates: ${report.reconciliationSummary.candidateCount}.`);
console.log(`Reconciled: ${report.reconciliationSummary.reconciledCount}.`);
console.log(`Unresolved: ${report.reconciliationSummary.unresolvedCount}.`);
console.log(`Ambiguous: ${report.reconciliationSummary.ambiguousCount}.`);
console.log(`Evidence audit written to ${outputPath}.`);
console.log("Authority status: evidence-only; canonical promotion was not performed.");
