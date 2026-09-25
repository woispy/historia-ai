import fs from "node:fs/promises";
import path from "node:path";

const SCENARIO_DATE = "1326-04-07";
const EDGE_TYPES = new Set([
  "POLITICAL_ADJACENCY","FRONTIER","REGIONAL_PROXIMITY","ROAD_CORRIDOR",
  "RIVER_CORRIDOR","MOUNTAIN_BARRIER","LAKE_BARRIER","COASTAL_ACCESS",
  "STRATEGIC_PASS","STRATEGIC_CROSSING","UNKNOWN"
]);
const EDGE_STATUSES = new Set(["supported","partial","uncertain","unsupported","not-applicable"]);

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
const evidencePath = required("--evidence");
const bindingsPath = required("--bindings");
const outputPath = path.resolve(process.cwd(), arg("--output", "data/build/gis/1326/geometry-review-ledger-edge-bridged.json"));

const ledger = JSON.parse(await fs.readFile(ledgerPath, "utf8"));
const evidence = JSON.parse(await fs.readFile(evidencePath, "utf8"));
const bindings = JSON.parse(await fs.readFile(bindingsPath, "utf8"));

if (ledger?.kind !== "historical-1326-geometry-review-ledger") fail("Unexpected review ledger kind.");
if (ledger.schemaVersion !== 2) fail("Review ledger schemaVersion must be 2.");
if (ledger.scenarioDate !== SCENARIO_DATE) fail("Ledger scenario date mismatch.");
if (ledger.authorityStatus !== "review-ledger-only" || ledger.promotion !== "BLOCKED") {
  fail("Ledger must remain review-ledger-only and promotion-blocked.");
}
if (evidence?.schemaVersion !== 1 || evidence.scenarioDate !== SCENARIO_DATE) fail("Pilot evidence version/date mismatch.");
if (evidence.authorityStatus !== "evidence-reference-only" || evidence.promotion !== "BLOCKED") {
  fail("Pilot evidence must remain evidence-reference-only and promotion-blocked.");
}
if (evidence.policy?.geometryGeneration !== false ||
    evidence.policy?.controllerInference !== false ||
    evidence.policy?.canonicalPromotion !== false) {
  fail("Pilot evidence policy must forbid geometry generation, controller inference, and canonical promotion.");
}
if (bindings?.schemaVersion !== 1) fail("Edge evidence bridge schemaVersion must be 1.");
if (bindings.scenarioDate !== SCENARIO_DATE) fail("Binding scenario date mismatch.");
if (bindings.authorityStatus !== "bridge-reference-only") fail("Binding authority status must remain bridge-reference-only.");
if (bindings.promotion !== "BLOCKED") fail("Binding promotion must remain BLOCKED.");
if (bindings.policy?.automaticReviewMatching !== false ||
    bindings.policy?.geometryGeneration !== false ||
    bindings.policy?.controllerInference !== false ||
    bindings.policy?.canonicalPromotion !== false) {
  fail("Binding policy must forbid automatic matching, geometry generation, controller inference, and canonical promotion.");
}
if (!Array.isArray(bindings?.reviewBindings)) fail("reviewBindings[] is required.");

const edgeById = new Map();
for (const edge of evidence.edges ?? []) {
  if (!edge?.edgeId || edgeById.has(edge.edgeId)) fail(`Duplicate/missing evidence edgeId: ${edge?.edgeId}`);
  if (!EDGE_TYPES.has(edge.edgeType)) fail(`Unsupported evidence edge type: ${edge.edgeId}`);
  if (!EDGE_STATUSES.has(edge.status)) fail(`Unsupported evidence edge status: ${edge.edgeId}`);
  if (!Number.isFinite(edge.confidence) || edge.confidence < 0 || edge.confidence > 1) {
    fail(`Invalid evidence edge confidence: ${edge.edgeId}`);
  }
  if (!Array.isArray(edge.evidenceRefs)) fail(`Evidence refs missing: ${edge.edgeId}`);
  edgeById.set(edge.edgeId, edge);
}

const recordById = new Map(ledger.records.map(record => [record.reviewId, record]));
const boundReviewIds = new Set();
let packetHash = null;
for (const record of ledger.records ?? []) {
  const candidatePacketSha256 = record.provenance?.candidatePacketSha256;
  if (!/^[0-9a-f]{64}$/.test(candidatePacketSha256 ?? "")) fail(`Ledger candidatePacketSha256 missing or invalid: ${record.reviewId}`);
  if (packetHash === null) packetHash = candidatePacketSha256;
  if (candidatePacketSha256 !== packetHash) fail(`Candidate packet hash drift across ledger records: ${record.reviewId}`);
}

for (const binding of bindings.reviewBindings) {
  if (!binding?.reviewId || boundReviewIds.has(binding.reviewId)) fail(`Duplicate/missing review binding: ${binding?.reviewId}`);
  boundReviewIds.add(binding.reviewId);
  const record = recordById.get(binding.reviewId);
  if (!record) fail(`Binding references unknown reviewId: ${binding.reviewId}`);
  if (!/^[0-9a-f]{64}$/.test(record.provenance?.candidateRecordSha256 ?? "")) {
    fail(`Ledger candidateRecordSha256 missing or invalid: ${binding.reviewId}`);
  }
  const expectedReviewId = `cliopatria-1326-feature-${record.sourceFeatureIndex}-${record.provenance.candidateRecordSha256.slice(0, 16)}`;
  if (binding.reviewId !== expectedReviewId) fail(`Binding reviewId is not bound to candidate record identity: ${binding.reviewId}`);
  if (!Array.isArray(binding.edgeEvidenceIds) || binding.edgeEvidenceIds.length === 0) {
    fail(`edgeEvidenceIds[] must contain at least one edge: ${binding.reviewId}`);
  }
  const existingIds = new Set((record.edgeAssessments ?? []).map(edge => edge.edgeId));
  for (const edgeEvidenceId of binding.edgeEvidenceIds) {
    const edge = edgeById.get(edgeEvidenceId);
    if (!edge) fail(`Binding references unknown evidence edge: ${edgeEvidenceId}`);
    if (existingIds.has(edge.edgeId)) fail(`Edge already bound to review record: ${edge.edgeId}`);
    record.edgeAssessments.push({
      edgeId: edge.edgeId,
      edgeType: edge.edgeType,
      status: edge.status,
      confidence: edge.confidence,
      evidenceRefs: [...edge.evidenceRefs],
      ...(edge.notes ? { notes: edge.notes } : {})
    });
    existingIds.add(edge.edgeId);
  }
}

const report = {
  ...ledger,
  bridge: {
    kind: "1326-pilot-edge-evidence-reference-bridge",
    evidenceSource: evidencePath.replace(/\\/g, "/"),
    bindingsSource: bindingsPath.replace(/\\/g, "/"),
    boundReviewRecords: boundReviewIds.size,
    boundEdges: [...boundReviewIds].reduce((sum, id) => sum + (recordById.get(id)?.edgeAssessments?.length ?? 0), 0),
    mutationPolicy: "evidence-reference-copy-only",
    geometryGeneration: false,
    controllerInference: false,
    canonicalPromotion: false
  }
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify({
  scenarioDate: SCENARIO_DATE,
  boundReviewRecords: boundReviewIds.size,
  boundEdges: report.bridge.boundEdges,
  authorityStatus: report.authorityStatus,
  promotion: report.promotion,
  outputPath
}, null, 2));
