import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const SCENARIO_DATE = "1326-04-07";
const SOURCE_ID = "cliopatria-v0.2.0";

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i < 0 ? fallback : process.argv[i + 1] ?? fallback;
}

const input = arg("--input");
if (!input) throw new Error("--input <geometry-reconciliation-queue.json> is required.");
const inputPath = path.resolve(process.cwd(), input);
const report = JSON.parse(await fs.readFile(inputPath, "utf8"));

if (report?.kind !== "historical-1326-political-geometry-reconciliation-queue") {
  throw new Error("Unexpected geometry reconciliation queue kind.");
}
if (report?.scenarioDate !== SCENARIO_DATE) throw new Error("Scenario date mismatch.");
if (report?.source?.sourceId !== SOURCE_ID) throw new Error("Source identity mismatch.");
if (report?.authorityStatus !== "candidate-review-only") throw new Error("Queue must remain candidate-review-only.");
if (report?.promotion !== "BLOCKED") throw new Error("Queue promotion must remain blocked.");

const policy = report.policy ?? {};
for (const [key, expected] of [
  ["sourceGeometryIsAuthoritative", false],
  ["geometryMutationAllowed", false],
  ["syntheticGeometryAllowed", false],
  ["controlImpliesGeometry", false],
  ["reviewedGeometryRequiredBeforeCanonical", true],
]) {
  if (policy[key] !== expected) throw new Error(`Policy ${key} must be ${expected}.`);
}

const queue = report.reviewQueue;
if (!Array.isArray(queue)) throw new Error("reviewQueue[] is required.");

for (const item of queue) {
  if (!item.sourceGeometry?.immutable) throw new Error(`Source geometry is not immutable: ${item.reviewId}`);
  if (item.sourceGeometry.mutationPolicy !== "immutable-source-evidence") {
    throw new Error(`Invalid source geometry mutation policy: ${item.reviewId}`);
  }
  if (!item.sourceGeometry?.geometry) throw new Error(`Source geometry missing: ${item.reviewId}`);
  const geometrySha = crypto.createHash("sha256")
    .update(JSON.stringify(item.sourceGeometry.geometry))
    .digest("hex");
  if (item.sourceGeometry.sha256 !== geometrySha) {
    throw new Error(`Source geometry SHA-256 mismatch: ${item.reviewId}`);
  }
  if (!/^[0-9a-f]{64}$/.test(item.sourceEvidence?.candidatePacketSha256 ?? "")) {
    throw new Error(`Candidate packet SHA-256 missing or invalid: ${item.reviewId}`);
  }
  const expectedReviewId = `cliopatria-1326-feature-${item.sourceFeatureIndex}-${item.sourceEvidence.candidatePacketSha256.slice(0, 16)}`;
  if (item.reviewId !== expectedReviewId) {
    throw new Error(`Review ID is not bound to candidate packet identity: ${item.reviewId}`);
  }
  if (item.sourceEvidence.reviewIdDerivation !== "cliopatria-1326-feature-${sourceFeatureIndex}-${candidatePacketSha256.slice(0,16)}") {
    throw new Error(`Review ID derivation contract missing: ${item.reviewId}`);
  }
  if (item.reviewedGeometry !== null) throw new Error(`Reviewed geometry must remain null: ${item.reviewId}`);
  if (item.reviewStatus !== "pending") throw new Error(`Review status must remain pending: ${item.reviewId}`);
  if (item.promotion !== "BLOCKED") throw new Error(`Item promotion must remain blocked: ${item.reviewId}`);
}

const summary = {
  scenarioDate: report.scenarioDate,
  sourceId: report.source.sourceId,
  queueItems: queue.length,
  immutableGeometryItems: queue.filter(item => item.sourceGeometry.immutable).length,
  pendingReviewItems: queue.filter(item => item.reviewStatus === "pending").length,
  promotion: report.promotion,
  status: "PASS",
};

console.log(JSON.stringify(summary, null, 2));
