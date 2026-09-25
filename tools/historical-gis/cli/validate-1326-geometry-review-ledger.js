import fs from "node:fs/promises";
import path from "node:path";

const SCENARIO_DATE = "1326-04-07";
const SOURCE_ID = "cliopatria-v0.2.0";
const EDGE_TYPES = new Set([
  "POLITICAL_ADJACENCY","FRONTIER","REGIONAL_PROXIMITY","ROAD_CORRIDOR",
  "RIVER_CORRIDOR","MOUNTAIN_BARRIER","LAKE_BARRIER","COASTAL_ACCESS",
  "STRATEGIC_PASS","STRATEGIC_CROSSING","UNKNOWN"
]);
const EDGE_STATUSES = new Set(["supported","partial","uncertain","unsupported","not-applicable"]);

function arg(name) {
  const i = process.argv.indexOf(name);
  return i < 0 ? null : process.argv[i + 1] ?? null;
}
const input = arg("--input");
if (!input) throw new Error("--input <geometry-review-ledger.json> is required.");
const queueInput = arg("--queue");
const inputPath = path.resolve(process.cwd(), input);
const report = JSON.parse(await fs.readFile(inputPath, "utf8"));
const queue = queueInput ? JSON.parse(await fs.readFile(path.resolve(process.cwd(), queueInput), "utf8")) : null;
if (queue) {
  if (queue.kind !== "historical-1326-political-geometry-reconciliation-queue") throw new Error("Unexpected reconciliation queue kind.");
  if (queue.scenarioDate !== SCENARIO_DATE || queue.source?.sourceId !== SOURCE_ID) throw new Error("Ledger/queue identity mismatch.");
  if (queue.promotion !== "BLOCKED") throw new Error("Reconciliation queue must remain promotion-blocked.");
  if (queue.candidatePacketSha256 !== report.records?.[0]?.provenance?.candidatePacketSha256 && report.records?.length) throw new Error("Ledger/queue candidate packet mismatch.");
}

if (report?.kind !== "historical-1326-geometry-review-ledger") throw new Error("Unexpected review ledger kind.");
if (report.schemaVersion !== 2) throw new Error("Review ledger schemaVersion must be 2.");
if (report.scenarioDate !== SCENARIO_DATE) throw new Error("Scenario date mismatch.");
if (report.authorityStatus !== "review-ledger-only") throw new Error("Ledger authority status must remain review-ledger-only.");
if (report.promotion !== "BLOCKED") throw new Error("Ledger promotion must remain BLOCKED.");
if (!Array.isArray(report.records)) throw new Error("records[] is required.");

let edgeCount = 0;
let packetHash = null;
const seenReviewIds = new Set();
const queueByReviewId = new Map((queue?.reviewQueue ?? []).map(item => [item.reviewId, item]));
for (const record of report.records) {
  if (!record.reviewId) throw new Error("reviewId is required.");
  if (seenReviewIds.has(record.reviewId)) throw new Error(`Duplicate reviewId: ${record.reviewId}`);
  seenReviewIds.add(record.reviewId);
  if (queue) {
    const queueItem = queueByReviewId.get(record.reviewId);
    if (!queueItem) throw new Error(`Ledger record is not present in reconciliation queue: ${record.reviewId}`);
    if (record.sourceFeatureIndex !== queueItem.sourceFeatureIndex || record.provenance.candidateRecordSha256 !== queueItem.sourceEvidence?.candidateRecordSha256) {
      throw new Error(`Ledger candidate identity drift: ${record.reviewId}`);
    }
  }
  if (record.provenance?.sourceId !== SOURCE_ID) throw new Error(`Source identity mismatch: ${record.reviewId}`);
  if (!/^[0-9a-f]{64}$/.test(record.provenance?.candidatePacketSha256 ?? "")) throw new Error(`Candidate packet hash missing or invalid: ${record.reviewId}`);
  if (!/^[0-9a-f]{64}$/.test(record.provenance?.candidateRecordSha256 ?? "")) throw new Error(`Candidate record hash missing or invalid: ${record.reviewId}`);
  if (packetHash === null) packetHash = record.provenance.candidatePacketSha256;
  if (record.provenance.candidatePacketSha256 !== packetHash) throw new Error(`Candidate packet hash drift across ledger records: ${record.reviewId}`);
  const expectedReviewId = `cliopatria-1326-feature-${record.sourceFeatureIndex}-${record.provenance.candidateRecordSha256.slice(0, 16)}`;
  if (record.reviewId !== expectedReviewId) throw new Error(`Review ID is not bound to candidate record identity: ${record.reviewId}`);
  const edges = record.edgeAssessments;
  if (!Array.isArray(edges)) throw new Error(`edgeAssessments[] is required: ${record.reviewId}`);
  const ids = new Set();
  for (const edge of edges) {
    if (!edge.edgeId || ids.has(edge.edgeId)) throw new Error(`Duplicate/missing edgeId: ${record.reviewId}`);
    ids.add(edge.edgeId);
    if (!EDGE_TYPES.has(edge.edgeType)) throw new Error(`Unsupported edge type: ${edge.edgeId}`);
    if (!EDGE_STATUSES.has(edge.status)) throw new Error(`Unsupported edge status: ${edge.edgeId}`);
    if (!Number.isFinite(edge.confidence) || edge.confidence < 0 || edge.confidence > 1) {
      throw new Error(`Invalid edge confidence: ${edge.edgeId}`);
    }
    if (!Array.isArray(edge.evidenceRefs)) throw new Error(`evidenceRefs[] is required: ${edge.edgeId}`);
    edgeCount++;
  }
}

if (queue && report.records.length !== queue.reviewQueue.length) throw new Error("Ledger/queue record count mismatch.");

console.log(JSON.stringify({
  schemaVersion: report.schemaVersion,
  scenarioDate: report.scenarioDate,
  records: report.records.length,
  edgeAssessments: edgeCount,
  status: "PASS",
  authorityStatus: report.authorityStatus,
  promotion: report.promotion
}, null, 2));
