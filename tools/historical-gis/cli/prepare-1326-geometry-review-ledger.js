import fs from "node:fs/promises";
import path from "node:path";

const SCENARIO_DATE = "1326-04-07";
const SOURCE_ID = "cliopatria-v0.2.0";

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i < 0 ? fallback : process.argv[i + 1] ?? fallback;
}
function required(name) {
  const value = arg(name);
  if (!value) throw new Error(`${name} <path> is required.`);
  return path.resolve(process.cwd(), value);
}

const inputPath = required("--input");
const outputPath = path.resolve(process.cwd(), arg("--output", "data/build/gis/1326/geometry-review-ledger.json"));
const queue = JSON.parse(await fs.readFile(inputPath, "utf8"));

if (queue?.kind !== "historical-1326-political-geometry-reconciliation-queue") throw new Error("Unexpected reconciliation queue.");
if (queue.scenarioDate !== SCENARIO_DATE) throw new Error("Scenario date mismatch.");
if (queue.source?.sourceId !== SOURCE_ID) throw new Error("Source identity mismatch.");
if (queue.promotion !== "BLOCKED") throw new Error("Input queue must remain promotion-blocked.");
if (!/^[0-9a-f]{64}$/.test(queue.candidatePacketSha256 ?? "")) throw new Error("Input queue must carry a valid candidate packet SHA-256.");
for (const item of queue.reviewQueue ?? []) {
  if (!/^[0-9a-f]{64}$/.test(item.sourceEvidence?.candidateRecordSha256 ?? "")) throw new Error(`Review queue candidate record SHA-256 missing: ${item.reviewId}`);
  if (item.sourceEvidence.candidatePacketSha256 !== queue.candidatePacketSha256) throw new Error(`Review queue packet provenance drift: ${item.reviewId}`);
}

const records = (queue.reviewQueue ?? []).map(item => ({
  reviewId: item.reviewId,
  sourceFeatureIndex: item.sourceFeatureIndex,
  entityIdentity: {
    status: item.entityReconciliation.status === "single-match" ? "single-match" :
      item.entityReconciliation.status === "multiple-matches" ? "multiple-matches" : "unmatched",
    entityIds: item.entityReconciliation.matches.map(match => match.entityId)
  },
  temporalEvidence: {
    scenarioDate: SCENARIO_DATE,
    applicability: item.temporalApplicability.passes ? "supported" : "unsupported",
    sourceRefs: [`cliopatria:${item.sourceFeatureIndex}`]
  },
  boundaryEvidence: {
    status: "uncertain",
    sourceRefs: [`cliopatria:${item.sourceFeatureIndex}`],
    edgeNotes: "Candidate geometry is evidence only; historical boundary authority is still pending review."
  },
  edgeAssessments: [],
  physicalConstraints: {
    status: "uncertain",
    sourceRefs: [],
    notes: "Physical constraints must be explicitly reconciled before review completion."
  },
  topologyGate: {
    status: "not-run",
    checks: []
  },
  provenance: {
    sourceId: SOURCE_ID,
    candidatePacketSha256: queue.candidatePacketSha256 ?? "",
    candidateRecordSha256: item.sourceEvidence?.candidateRecordSha256 ?? "",
  },
  confidence: {
    existence: 0,
    controller: 0,
    frontier: 0,
    exactBoundary: 0,
    geometry: 0
  },
  decision: {
    status: "pending",
    reviewedGeometry: null,
    reason: "No research-backed geometry review has been recorded."
  }
}));

const report = {
  schemaVersion: 2,
  kind: "historical-1326-geometry-review-ledger",
  scenarioDate: SCENARIO_DATE,
  authorityStatus: "review-ledger-only",
  promotion: "BLOCKED",
  policy: {
    geometryGeneration: false,
    controllerImpliesGeometry: false,
    canonicalPromotion: false,
    confidenceRequired: true,
    topologyRequired: true,
    provenanceRequired: true
  },
  sourceQueue: inputPath.replace(/\\/g, "/"),
  counts: {
    records: records.length,
    pending: records.length
  },
  records
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify({ scenarioDate: SCENARIO_DATE, records: records.length, promotion: "BLOCKED", outputPath }, null, 2));
