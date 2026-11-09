import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const DATE = "1326-04-07";
const SOURCE = "cliopatria-v0.2.0";
const arg = name => { const i = process.argv.indexOf(name); return i < 0 ? null : process.argv[i + 1] ?? null; };
const required = name => { const v = arg(name); if (!v) throw new Error(`${name} <path> is required.`); return path.resolve(process.cwd(), v); };
const read = async name => JSON.parse(await fs.readFile(required(name), "utf8"));
const sha = value => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const fail = message => { throw new Error(message); };

const candidateReport = await read("--candidates");
const screening = await read("--screening");
const reconciliation = await read("--reconciliation");
const review = await read("--review");

if (candidateReport.scenarioDate !== DATE || screening.scenarioDate !== DATE || reconciliation.scenarioDate !== DATE || review.scenarioDate !== DATE) fail("Scenario date lineage mismatch.");
if (candidateReport.source?.sourceId !== SOURCE || screening.source?.sourceId !== SOURCE || reconciliation.sourceId !== SOURCE || review.source?.sourceId !== SOURCE) fail("Source identity lineage mismatch.");

const packetSha = sha(candidateReport.candidates);
if (candidateReport.candidatePacketSha256 !== packetSha) fail("Candidate packet hash mismatch.");
if (screening.candidatePacketSha256 !== packetSha) fail("Screening packet hash drifted.");
if (reconciliation.candidatePacketSha256 !== packetSha) fail("Reconciliation packet hash drifted.");
if (review.candidatePacketSha256 !== packetSha) fail("Review packet hash drifted.");

const extractedSha = candidateReport.source?.extractedGeojsonSha256;
if (!/^[0-9a-f]{64}$/.test(extractedSha ?? "")) fail("Missing extracted GeoJSON SHA.");
if (screening.source?.extractedGeojsonSha256 !== extractedSha) fail("Screening extracted SHA drifted.");
if (reconciliation.sourceProvenance?.extractedGeojsonSha256 !== extractedSha) fail("Reconciliation extracted SHA drifted.");
if (review.sourceProvenance?.extractedGeojsonSha256 !== extractedSha) fail("Review extracted SHA drifted.");

const sourceByIndex = new Map(candidateReport.candidates.map(c => [c.sourceFeatureIndex, c]));
const screenByIndex = new Map(screening.candidates.map(c => [c.sourceFeatureIndex, c]));
const reviewByIndex = new Map(review.reviewQueue.map(c => [c.sourceFeatureIndex, c]));
if (sourceByIndex.size !== candidateReport.candidates.length || screenByIndex.size !== screening.candidates.length || reviewByIndex.size !== review.reviewQueue.length) fail("Duplicate sourceFeatureIndex detected in lineage.");

for (const [index, source] of sourceByIndex) {
  const screened = screenByIndex.get(index);
  if (!screened) continue;
  if (screened.sourceFeatureId !== source.sourceFeatureId) fail(`Screening sourceFeatureId drift: ${index}`);
  if (screened.sourceGeometrySha256 !== sha(source.geometry)) fail(`Screening geometry identity drift: ${index}`);
  const reviewItem = reviewByIndex.get(index);
  if (!reviewItem) fail(`Screened candidate missing from review queue: ${index}`);
  if (reviewItem.sourceFeatureId !== screened.sourceFeatureId) fail(`Review sourceFeatureId drift: ${index}`);
  if (reviewItem.sourceGeometry.sha256 !== sha(source.geometry)) fail(`Review geometry identity drift: ${index}`);
  if (reviewItem.sourceGeometry.screeningSourceGeometrySha256 !== reviewItem.sourceGeometry.sha256) fail(`Review screening geometry hash drift: ${index}`);
  const expectedRecordSha = sha(screened);
  if (reviewItem.sourceEvidence.candidateRecordSha256 !== expectedRecordSha) fail(`Candidate record hash drift: ${index}`);
  const expectedReviewId = `cliopatria-1326-feature-${index}-${expectedRecordSha.slice(0,16)}`;
  if (reviewItem.reviewId !== expectedReviewId) fail(`Review ID lineage drift: ${index}`);
}

for (const entity of reconciliation.results ?? []) {
  for (const candidate of entity.candidates ?? []) {
    const screened = screenByIndex.get(candidate.sourceFeatureIndex);
    if (!screened) fail(`Reconciliation references non-screened candidate: ${candidate.sourceFeatureIndex}`);
    if (candidate.sourceFeatureId !== screened.sourceFeatureId) fail(`Reconciliation identity drift: ${candidate.sourceFeatureIndex}`);
    if (!/^[0-9a-f]{64}$/.test(candidate.candidateRecordSha256 ?? "")) fail(`Reconciliation candidate record hash missing: ${candidate.sourceFeatureIndex}`);
    const sourceCandidate = sourceByIndex.get(candidate.sourceFeatureIndex);
    if (candidate.candidateRecordSha256 !== sha(sourceCandidate)) fail(`Reconciliation candidate record hash drift: ${candidate.sourceFeatureIndex}`);
  }
}

if (screening.promotion !== "BLOCKED" || reconciliation.promotion !== "BLOCKED" || review.promotion !== "BLOCKED") fail("Promotion guard drifted.");

console.log(JSON.stringify({
  scenarioDate: DATE,
  sourceId: SOURCE,
  sourceCandidates: candidateReport.candidates.length,
  screenedCandidates: screening.candidates.length,
  reviewQueueItems: review.reviewQueue.length,
  lineage: "candidate-packet -> screening -> reconciliation -> review",
  status: "PASS",
  promotion: "BLOCKED"
}, null, 2));
