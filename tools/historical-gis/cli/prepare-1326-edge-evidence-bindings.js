import fs from "node:fs/promises";
import path from "node:path";

const SCENARIO_DATE = "1326-04-07";

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i < 0 ? fallback : process.argv[i + 1] ?? fallback;
}
function required(name) {
  const value = arg(name);
  if (!value) throw new Error(`${name} <path> is required.`);
  return path.resolve(process.cwd(), value);
}
function fail(message) { throw new Error(message); }

const ledgerPath = required("--ledger");
const mappingPath = required("--mapping");
const evidencePath = required("--evidence");
const outputPath = path.resolve(process.cwd(), arg("--output", "data/build/gis/1326/edge-evidence-bindings.json"));

const ledger = JSON.parse(await fs.readFile(ledgerPath, "utf8"));
const mapping = JSON.parse(await fs.readFile(mappingPath, "utf8"));
const evidence = JSON.parse(await fs.readFile(evidencePath, "utf8"));

if (ledger?.kind !== "historical-1326-geometry-review-ledger") fail("Unexpected review ledger kind.");
if (ledger.schemaVersion !== 2) fail("Review ledger schemaVersion must be 2.");
if (ledger.scenarioDate !== SCENARIO_DATE) fail("Ledger scenario date mismatch.");
if (ledger.authorityStatus !== "review-ledger-only" || ledger.promotion !== "BLOCKED") fail("Ledger must remain review-ledger-only and promotion-blocked.");

if (mapping?.schemaVersion !== 1) fail("Binding mapping schemaVersion must be 1.");
if (mapping.scenarioDate !== SCENARIO_DATE) fail("Binding mapping scenario date mismatch.");
if (mapping.authorityStatus !== "explicit-binding-input") fail("Binding mapping must remain explicit-binding-input.");
if (mapping.promotion !== "BLOCKED") fail("Binding mapping promotion must remain BLOCKED.");
if (mapping.policy?.automaticReviewMatching !== false ||
    mapping.policy?.geometryGeneration !== false ||
    mapping.policy?.controllerInference !== false ||
    mapping.policy?.canonicalPromotion !== false) {
  fail("Binding mapping policy must forbid automatic matching, geometry generation, controller inference, and canonical promotion.");
}
if (!Array.isArray(mapping.reviewBindings)) fail("reviewBindings[] is required.");
if (evidence?.schemaVersion !== 1 || evidence.scenarioDate !== SCENARIO_DATE) fail("Evidence registry schema/date mismatch.");
if (evidence.authorityStatus !== "evidence-reference-only" || evidence.promotion !== "BLOCKED") fail("Evidence registry must remain evidence-reference-only and promotion-blocked.");
if (evidence.policy?.geometryGeneration !== false ||
    evidence.policy?.controllerInference !== false ||
    evidence.policy?.canonicalPromotion !== false) fail("Evidence registry policy must forbid geometry generation, controller inference, and canonical promotion.");
const evidenceIds = new Set();
for (const edge of evidence.edges ?? []) {
  if (!edge?.edgeId || evidenceIds.has(edge.edgeId)) fail(`Duplicate/missing evidence edgeId: ${edge?.edgeId}`);
  evidenceIds.add(edge.edgeId);
}

const records = new Map((ledger.records ?? []).map(record => [record.reviewId, record]));
const seenReviews = new Set();

for (const binding of mapping.reviewBindings) {
  if (!binding?.reviewId || seenReviews.has(binding.reviewId)) fail(`Duplicate/missing reviewId: ${binding?.reviewId}`);
  seenReviews.add(binding.reviewId);
  const record = records.get(binding.reviewId);
  if (!record) fail(`Unknown reviewId: ${binding.reviewId}`);
  const recordSha = record.provenance?.candidateRecordSha256;
  if (!/^[0-9a-f]{64}$/.test(recordSha ?? "")) fail(`Ledger candidateRecordSha256 missing or invalid: ${binding.reviewId}`);
  const expected = `cliopatria-1326-feature-${record.sourceFeatureIndex}-${recordSha.slice(0, 16)}`;
  if (binding.reviewId !== expected) {
    fail(`Review ID is not candidate-bound or explicit test ID: ${binding.reviewId}`);
  }
  if (!Array.isArray(binding.edgeEvidenceIds) || binding.edgeEvidenceIds.length === 0) fail(`edgeEvidenceIds[] is empty: ${binding.reviewId}`);
  if (new Set(binding.edgeEvidenceIds).size !== binding.edgeEvidenceIds.length) fail(`Duplicate edge evidence ID in binding: ${binding.reviewId}`);
  for (const edgeId of binding.edgeEvidenceIds) {
    if (!evidenceIds.has(edgeId)) fail(`Unknown evidence edge ID: ${edgeId}`);
  }
}

const report = {
  schemaVersion: 1,
  scenarioDate: SCENARIO_DATE,
  authorityStatus: "bridge-reference-only",
  promotion: "BLOCKED",
  policy: {
    automaticReviewMatching: false,
    geometryGeneration: false,
    controllerInference: false,
    canonicalPromotion: false
  },
  reviewBindings: mapping.reviewBindings.map(binding => ({
    reviewId: binding.reviewId,
    edgeEvidenceIds: [...binding.edgeEvidenceIds]
  })),
  provenance: {
    ledgerSource: ledgerPath.replace(/\\/g, "/"),
    explicitMappingSource: mappingPath.replace(/\\/g, "/"),
    evidenceSource: evidencePath.replace(/\\/g, "/"),
    generationMode: "explicit-review-id-and-edge-id-only"
  }
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify({ scenarioDate: SCENARIO_DATE, bindings: report.reviewBindings.length, outputPath, promotion: "BLOCKED" }, null, 2));
