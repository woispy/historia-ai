import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const arg = name => { const i = process.argv.indexOf(name); return i < 0 ? null : process.argv[i + 1] ?? null; };
const input = arg("--input");
if (!input) throw new Error("--input <reconciliation-report> is required.");
const candidatePath = arg("--candidates");
if (!candidatePath) throw new Error("--candidates <candidate-report> is required.");
const read = async p => JSON.parse(await fs.readFile(path.resolve(process.cwd(), p), "utf8"));
const candidates = await read(candidatePath);
const report = await read(input);
const sha = value => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const fail = message => { throw new Error(message); };

if (report.schemaVersion !== 1) fail("Reconciliation schemaVersion must be 1.");
if (report.scenarioDate !== "1326-04-07" || candidates.scenarioDate !== "1326-04-07") fail("Scenario date mismatch.");
if (report.sourceId !== "cliopatria-v0.2.0" || candidates.source?.sourceId !== "cliopatria-v0.2.0") fail("Source identity mismatch.");
if (report.candidatePacketSha256 !== candidates.candidatePacketSha256) fail("Reconciliation candidate packet SHA drifted.");
if (report.sourceProvenance?.extractedGeojsonSha256 !== candidates.source?.extractedGeojsonSha256) fail("Reconciliation extracted GeoJSON SHA drifted.");
if (report.sourceProvenance?.inputSha256 !== candidates.source?.inputSha256) fail("Reconciliation input SHA drifted.");
if (report.promotion !== "BLOCKED") fail("Reconciliation promotion must remain BLOCKED.");
if (!report.reconciliationPolicy || report.reconciliationPolicy.geometryAuthority !== "never-derived-from-name-match-alone") fail("Reconciliation geometry authority policy drifted.");
if (!Array.isArray(report.results)) fail("Reconciliation results[] is required.");

const sourceByIndex = new Map();
for (const candidate of candidates.candidates ?? []) sourceByIndex.set(candidate.sourceFeatureIndex, candidate);
const seenEntities = new Set();

for (const result of report.results) {
  if (seenEntities.has(result.entityId)) fail("Duplicate reconciliation entityId.");
  seenEntities.add(result.entityId);
  if (!Array.isArray(result.candidates)) fail("Reconciliation candidates[] is required.");
  if (result.candidateCount !== result.candidates.length) fail("Reconciliation candidate count drifted.");
  for (const item of result.candidates) {
    const source = sourceByIndex.get(item.sourceFeatureIndex);
    if (!source) fail("Reconciliation references an unknown sourceFeatureIndex.");
    if (item.sourceFeatureId !== source.sourceFeatureId) fail("Reconciliation sourceFeatureId drifted.");
    if (item.name !== source.name) fail("Reconciliation source name drifted.");
    if (item.fromYear !== source.fromYear || item.toYear !== source.toYear) fail("Reconciliation temporal identity drifted.");
    if (item.geometryAuthorityStatus !== source.geometryAuthorityStatus) fail("Reconciliation geometry authority drifted.");
    if (!/^[0-9a-f]{64}$/.test(item.candidateRecordSha256 ?? "")) fail("Missing candidate record SHA.");
    if (item.candidateRecordSha256 !== sha(source)) fail("Candidate record SHA mismatch.");
    if (item.autoPromotion !== false) fail("Reconciliation auto-promotion must remain false.");
  }
}

if (report.counts?.requiredEntities !== report.results.length) fail("Reconciliation requiredEntities count drifted.");
if (report.counts.matched !== report.results.filter(x => x.candidateCount > 0).length) fail("Reconciliation matched count drifted.");
if (report.counts.unmatched !== report.results.filter(x => x.status === "unmatched").length) fail("Reconciliation unmatched count drifted.");
if (report.counts.ambiguous !== report.results.filter(x => x.status === "ambiguous").length) fail("Reconciliation ambiguous count drifted.");

console.log(JSON.stringify({ scenarioDate: report.scenarioDate, entityResults: report.results.length, matched: report.counts.matched, candidatePacketSha256: report.candidatePacketSha256, status: "PASS", promotion: "BLOCKED" }, null, 2));
