import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const SCENARIO_DATE = "1326-04-07";
const SOURCE_ID = "cliopatria-v0.2.0";

function arg(name) {
  const i = process.argv.indexOf(name);
  return i < 0 ? null : process.argv[i + 1] ?? null;
}
const input = arg("--input");
if (!input) throw new Error("--input <candidate-report> is required.");

const reportPath = path.resolve(process.cwd(), input);
const report = JSON.parse(await fs.readFile(reportPath, "utf8"));
const fail = message => { throw new Error(message); };
const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");

if (report.schemaVersion !== 1) fail("Candidate report schemaVersion must be 1.");
if (report.scenarioDate !== SCENARIO_DATE) fail("Candidate report scenario date mismatch.");
if (report.source?.sourceId !== SOURCE_ID) fail("Candidate report source identity mismatch.");
if (report.source?.sourceTag !== "v0.2.0") fail("Candidate source tag mismatch.");
if (report.source?.immutableReference?.type !== "git-commit") fail("Candidate immutable reference type mismatch.");
if (report.source?.immutableReference?.sha !== "ad28a69") fail("Candidate immutable commit mismatch.");
if (report.source?.immutableReference?.sourceBlobSha !== "cefab0f4b622e2e7fb3daf68d4f461f83991204c") fail("Candidate source blob mismatch.");
if (!/^[0-9a-f]{64}$/.test(report.source?.extractedGeojsonSha256 ?? "")) fail("Candidate report requires extracted GeoJSON SHA-256.");
if (!/^[0-9a-f]{64}$/.test(report.source?.inputSha256 ?? "")) fail("Candidate report requires input SHA-256.");
if (report.temporalRule !== "FromYear <= 1326 <= ToYear") fail("Candidate temporal rule drifted.");
if (!Array.isArray(report.candidates)) fail("Candidate report must contain candidates[].");
if (!report.counts || report.counts.inputFeatures !== undefined && !Number.isInteger(report.counts.inputFeatures)) fail("Candidate counts are invalid.");

const excluded = report.counts.excluded ?? {};
for (const key of ["outsideTemporalRange", "nonPolity", "missingGeometry"]) {
  if (!Number.isInteger(excluded[key]) || excluded[key] < 0) fail(`Invalid exclusion count: ${key}`);
}

const seenIndexes = new Set();
const seenIds = new Set();
for (const candidate of report.candidates) {
  if (seenIndexes.has(candidate.sourceFeatureIndex)) fail(`Duplicate sourceFeatureIndex: ${candidate.sourceFeatureIndex}`);
  seenIndexes.add(candidate.sourceFeatureIndex);
  if (candidate.sourceFeatureId !== null) {
    if (seenIds.has(candidate.sourceFeatureId)) fail(`Duplicate sourceFeatureId: ${candidate.sourceFeatureId}`);
    seenIds.add(candidate.sourceFeatureId);
  }
  if (!Number.isInteger(candidate.sourceFeatureIndex) || candidate.sourceFeatureIndex < 0) fail("Candidate sourceFeatureIndex must be a non-negative integer.");
  if (candidate.fromYear > 1326 || candidate.toYear < 1326) fail(`Candidate ${candidate.sourceFeatureIndex} violates temporal applicability.`);
  if (candidate.type !== "POLITY") fail(`Candidate ${candidate.sourceFeatureIndex} is not POLITY.`);
  if (!["Polygon", "MultiPolygon"].includes(candidate.geometry?.type)) fail(`Candidate ${candidate.sourceFeatureIndex} has unsupported geometry type.`);
  if (candidate.reconciliationStatus !== "pending") fail(`Candidate ${candidate.sourceFeatureIndex} reconciliation state drifted.`);
  if (candidate.geometryAuthorityStatus !== "candidate-evidence-only") fail(`Candidate ${candidate.sourceFeatureIndex} geometry authority drifted.`);
  const candidateJson = JSON.stringify(candidate);
  if (candidateJson.length === 0) fail("Candidate serialization is empty.");
}

const expectedPacketHash = sha256(JSON.stringify(report.candidates));
if (report.candidatePacketSha256 !== expectedPacketHash) fail("Candidate packet SHA-256 mismatch.");

const counted = report.candidates.length;
if (report.counts.candidates !== counted) fail("Candidate count does not match candidates[].length.");
if (report.counts.inputFeatures < counted) fail("Input feature count cannot be below candidate count.");

const excludedTotal = excluded.outsideTemporalRange + excluded.nonPolity + excluded.missingGeometry;
if (report.counts.inputFeatures !== counted + excludedTotal) {
  fail("Candidate accounting is incomplete: inputFeatures must equal candidates + all exclusion buckets.");
}

console.log(JSON.stringify({
  scenarioDate: SCENARIO_DATE,
  candidateCount: counted,
  candidatePacketSha256: expectedPacketHash,
  extractedGeojsonSha256: report.source.extractedGeojsonSha256,
  status: "PASS",
  promotion: "BLOCKED"
}, null, 2));
