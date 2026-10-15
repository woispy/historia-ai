import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { extractCliopatriaCandidates } from "../CliopatriaCandidateExtractor.js";
import { auditHistoricalEntityEvidence } from "../HistoricalEntityEvidenceAudit.js";
import { reconcileHistoricalEntities } from "../HistoricalEntityReconciliation.js";
import { buildHistoricalGeometryEvidenceInventory } from "../HistoricalGeometryEvidenceInventory.js";

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
const scenarioDate = readArg("--date", `${String(year).padStart(4, "0")}-01-01`);
const inputPath = path.resolve(process.cwd(), requireArg("--input"));
const rulesPath = path.resolve(
  process.cwd(),
  readArg("--rules", path.join(root, "data", "gis", String(year), "entity-reconciliation.json")),
);
const matrixPath = path.resolve(
  process.cwd(),
  readArg("--matrix", path.join(root, "data", "gis", String(year), "evidence-matrix.json")),
);
const sourceManifestPath = readArg(
  "--source-manifest",
  path.join(root, "data", "gis", String(year), "acquisition-manifest.json"),
);
const outputPath = path.resolve(
  process.cwd(),
  readArg(
    "--output",
    path.join(root, "data", "gis", String(year), "candidate-evidence.json"),
  ),
);

const [geojson, rulesDocument, matrixDocument, sourceManifest] = await Promise.all([
  readJson(inputPath),
  readJson(rulesPath),
  readJson(matrixPath),
  readJson(path.resolve(process.cwd(), sourceManifestPath)),
]);

const { candidates } = extractCliopatriaCandidates(geojson, year);
const reconciliation = reconcileHistoricalEntities(candidates, rulesDocument.records ?? []);
const entityAudit = auditHistoricalEntityEvidence({
  scenarioDate,
  targetYear: year,
  matrixRecords: matrixDocument.records ?? [],
  candidates,
  reconciliation,
});
const geometryInventory = buildHistoricalGeometryEvidenceInventory({
  sourceId: sourceManifest.id ?? sourceManifest.source?.id ?? "unknown-source",
  scenarioDate,
  targetYear: year,
  candidates,
  reconciliation,
});

const output = {
  schemaVersion: 1,
  assetType: "historical-candidate-evidence",
  scenarioDate,
  targetYear: year,
  authorityStatus: "evidence-only",
  source: {
    sourceId: sourceManifest.id ?? sourceManifest.source?.id ?? null,
    provider: sourceManifest.provider ?? sourceManifest.source?.provider ?? null,
    dataset: sourceManifest.dataset ?? sourceManifest.source?.dataset ?? null,
    version: sourceManifest.version ?? sourceManifest.source?.version ?? null,
    archive: sourceManifest.archive ?? null,
    licenseStatus: sourceManifest.licenseStatus ?? sourceManifest.source?.licenseStatus ?? null,
    inputSha256: sourceManifest.inputSha256 ?? sourceManifest.source?.inputSha256 ?? null,
  },
  temporalFilter: {
    rule: "FromYear <= targetYear <= ToYear",
    targetYear: year,
    polityOnly: true,
  },
  candidateSummary: {
    extracted: candidates.length,
    reconciled: reconciliation.reconciled.length,
    unresolved: reconciliation.unresolved.length,
    ambiguous: reconciliation.ambiguous.length,
  },
  entityAudit,
  geometryInventory,
  promotion: {
    status: "not-promoted",
    reason:
      "This artifact records temporal, entity, and geometry evidence only. It does not establish canonical historical political boundaries, ownership, or runtime province geometry.",
  },
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

console.log(`Built ${candidates.length} ${year} source candidates.`);
console.log(`Reconciled: ${reconciliation.reconciled.length}.`);
console.log(`Unresolved: ${reconciliation.unresolved.length}.`);
console.log(`Ambiguous: ${reconciliation.ambiguous.length}.`);
console.log(`Candidate evidence written to ${outputPath}.`);
console.log("Authority status: evidence-only; canonical promotion was not performed.");
