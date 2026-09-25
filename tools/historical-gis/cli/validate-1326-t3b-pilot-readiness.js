import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const DATE = "1326-04-07";
const SOURCE = "cliopatria-v0.2.0";
const arg = name => { const i = process.argv.indexOf(name); return i < 0 ? null : process.argv[i + 1] ?? null; };
const required = name => { const v = arg(name); if (!v) throw new Error(`${name} <path> is required.`); return path.resolve(process.cwd(), v); };
const read = async name => JSON.parse(await fs.readFile(required(name), "utf8"));
const fail = message => { throw new Error(message); };
const sha = value => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");

const candidates = await read("--candidates");
const screening = await read("--screening");
const reconciliation = await read("--reconciliation");
const review = await read("--review");
const ledger = await read("--ledger");
const bindings = await read("--bindings");
const evidence = await read("--evidence");

for (const [name, report] of Object.entries({ candidates, screening, reconciliation, review })) {
  if (report.scenarioDate !== DATE) fail(`${name}: scenario date mismatch.`);
  if (report.promotion !== "BLOCKED") fail(`${name}: promotion must remain BLOCKED.`);
}
if (candidates.source?.sourceId !== SOURCE || screening.source?.sourceId !== SOURCE ||
    reconciliation.sourceId !== SOURCE || review.source?.sourceId !== SOURCE) fail("Source identity mismatch.");
if (ledger.schemaVersion !== 2 || ledger.authorityStatus !== "review-ledger-only" || ledger.promotion !== "BLOCKED") fail("Review ledger is not safely review-only.");
if (evidence.schemaVersion !== 1 || evidence.authorityStatus !== "evidence-reference-only" || evidence.promotion !== "BLOCKED") fail("Pilot evidence is not safely evidence-only.");
if (bindings.schemaVersion !== 1 || bindings.authorityStatus !== "bridge-reference-only" || bindings.promotion !== "BLOCKED") fail("Bindings are not safely bridge-reference-only.");

for (const key of ["automaticReviewMatching","geometryGeneration","controllerInference","canonicalPromotion"]) {
  if (bindings.policy?.[key] !== false) fail(`Binding policy ${key} must remain false: ${key}`);
}
if (evidence.policy?.geometryGeneration !== false || evidence.policy?.controllerInference !== false || evidence.policy?.canonicalPromotion !== false) fail("Evidence policy guard drifted.");

const packetSha = candidates.candidatePacketSha256;
if (!/^[0-9a-f]{64}$/.test(packetSha ?? "")) fail("Candidate packet SHA is missing/invalid.");
if (sha(candidates.candidates) !== packetSha) fail("Candidate packet SHA does not match the candidate array.");
if (screening.candidatePacketSha256 !== packetSha || reconciliation.candidatePacketSha256 !== packetSha || review.candidatePacketSha256 !== packetSha) fail("Candidate packet SHA continuity failed.");

const candidateByIndex = new Map(candidates.candidates.map(x => [x.sourceFeatureIndex, x]));
const screenedByIndex = new Map(screening.candidates.map(x => [x.sourceFeatureIndex, x]));
const reviewByIndex = new Map((review.reviewQueue ?? []).map(x => [x.sourceFeatureIndex, x]));
if (candidateByIndex.size !== candidates.candidates.length) fail("Duplicate candidate sourceFeatureIndex.");
if (ledger.records.length !== review.reviewQueue.length) fail("Ledger/review record count mismatch.");
if (screenedByIndex.size !== screening.candidates.length) fail("Duplicate screened sourceFeatureIndex.");
if (reviewByIndex.size !== review.reviewQueue.length) fail("Duplicate review sourceFeatureIndex.");

for (const [index, screened] of screenedByIndex) {
  const source = candidateByIndex.get(index);
  const item = reviewByIndex.get(index);
  if (!source || !item) fail(`Broken candidate -> review identity at ${index}.`);
  if (screened.sourceFeatureId !== source.sourceFeatureId || item.sourceFeatureId !== screened.sourceFeatureId) fail(`Source identity drift at ${index}.`);
  if (screened.sourceGeometrySha256 !== sha(source.geometry)) fail(`Screening geometry provenance drift at ${index}.`);
  if (item.reviewedGeometry !== null || item.reviewStatus !== "pending" || item.promotion !== "BLOCKED") fail(`Review item is not pending/blocked at ${index}.`);
  const recordSha = item.sourceEvidence?.candidateRecordSha256;
  if (!/^[0-9a-f]{64}$/.test(recordSha ?? "")) fail(`Candidate record SHA invalid at ${index}.`);
  const expectedId = `cliopatria-1326-feature-${index}-${recordSha.slice(0,16)}`;
  if (item.reviewId !== expectedId) fail(`Review ID derivation drift at ${index}.`);
}

for (const record of ledger.records ?? []) {
  const reviewItem = reviewByIndex.get(record.sourceFeatureIndex);
  if (!reviewItem || record.reviewId !== reviewItem.reviewId) fail(`Ledger/review identity mismatch at ${record.sourceFeatureIndex}.`);
  if (record.provenance?.candidatePacketSha256 !== packetSha) fail(`Ledger packet provenance mismatch: ${record.reviewId}`);
  if (record.provenance?.candidateRecordSha256 !== reviewItem.sourceEvidence?.candidateRecordSha256) fail(`Ledger record provenance mismatch: ${record.reviewId}`);
  if (record.decision?.status !== "pending") fail(`Ledger decision is not pending: ${record.reviewId}`);
}
const bindingIds = new Set((bindings.reviewBindings ?? []).map(x => x.reviewId));
for (const binding of bindings.reviewBindings ?? []) {
  if (!reviewByIndex.has(Number(binding.reviewId.split("-")[3]))) fail(`Binding references an unavailable review: ${binding.reviewId}`);
  if (!/^cliopatria-1326-feature-[0-9]+-[0-9a-f]{16}$/.test(binding.reviewId)) fail(`Binding reviewId is not candidate-bound: ${binding.reviewId}`);
  if (!Array.isArray(binding.edgeEvidenceIds) || binding.edgeEvidenceIds.length === 0) fail(`Empty edge binding: ${binding.reviewId}`);
}
if (bindingIds.size !== (bindings.reviewBindings ?? []).length) fail("Duplicate binding review IDs.");
if ((bindings.reviewBindings ?? []).length > 0) {
  for (const id of bindingIds) if (!reviewByIndex.has(Number(id.split("-")[3]))) fail(`Binding review is absent from review queue: ${id}`);
}

console.log(JSON.stringify({
  scenarioDate: DATE,
  sourceId: SOURCE,
  candidateCount: candidates.candidates.length,
  screenedCount: screening.candidates.length,
  reviewCount: review.reviewQueue.length,
  ledgerCount: ledger.records.length,
  pilotEvidenceEdges: (evidence.edges ?? []).length,
  boundReviewCount: (bindings.reviewBindings ?? []).length,
  status: (bindings.reviewBindings ?? []).length === 0 ? "WAITING_FOR_EXPLICIT_REVIEW_BINDINGS" : "READY_FOR_BOUND_REVIEW",
  promotion: "BLOCKED"
}, null, 2));
