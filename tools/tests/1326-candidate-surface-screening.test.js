import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import crypto from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const fixture = path.join(root, "tools/tests/fixtures/1326-candidate-surface");
const script = path.join(root, "tools/historical-gis/cli/screen-1326-political-candidate-surface.js");
const temp = await fs.mkdtemp(path.join(os.tmpdir(), "historia-1326-t3b-"));
const output = path.join(temp, "screening.json");
const candidateReport = JSON.parse(await fs.readFile(path.join(fixture, "candidates.json"), "utf8"));
candidateReport.source.extractedGeojsonSha256 = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
candidateReport.source.inputSha256 = candidateReport.source.extractedGeojsonSha256;

const base = candidateReport.candidates[0];
const candidates = [
  { ...base, sourceFeatureIndex: 1, sourceFeatureId: "near-bursa", name: "Local polygon", fromYear: 1200, toYear: 1400 },
  {
    ...base,
    sourceFeatureIndex: 2,
    sourceFeatureId: "broad-bbox-hole",
    name: "Broad bbox but no local polygon overlap",
    fromYear: 1200,
    toYear: 1400,
    geometry: {
      type: "Polygon",
      coordinates: [
        [[26, 38], [32, 38], [32, 43], [26, 43], [26, 38]],
        [[27, 39], [31, 39], [31, 42], [27, 42], [27, 39]],
      ],
    },
  },
  { ...base, sourceFeatureIndex: 3, sourceFeatureId: "expired", name: "Expired candidate", fromYear: 1100, toYear: 1325 },
  {
    ...base,
    sourceFeatureIndex: 4,
    sourceFeatureId: "far-away",
    name: "Far away",
    fromYear: 1200,
    toYear: 1400,
    geometry: { type: "Polygon", coordinates: [[[40, 35], [41, 35], [41, 36], [40, 36], [40, 35]]] },
  },
  {
    ...base,
    sourceFeatureIndex: 5,
    sourceFeatureId: "multipolygon-local",
    name: "MultiPolygon with local component",
    fromYear: 1200,
    toYear: null,
    geometry: {
      type: "MultiPolygon",
      coordinates: [
        [[[40, 35], [41, 35], [41, 36], [40, 36], [40, 35]]],
        [[[29.0, 40.1], [29.2, 40.1], [29.2, 40.3], [29.0, 40.3], [29.0, 40.1]]],
      ],
    },
  },
].map(candidate => ({ ...candidate, reconciliationStatus: "pending" }));
candidateReport.candidates = candidates;
candidateReport.candidatePacketSha256 = crypto.createHash("sha256").update(JSON.stringify(candidates)).digest("hex");
const candidateInput = path.join(temp, "candidates.json");
await fs.writeFile(candidateInput, JSON.stringify(candidateReport));

await new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [
    script,
    "--input", candidateInput,
    "--anchors", path.join(fixture, "anchors.json"),
    "--output", output,
    "--radius-km", "120",
  ], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
  let stderr = "";
  child.stderr.on("data", chunk => { stderr += chunk; });
  child.on("error", reject);
  child.on("close", code => code === 0
    ? resolve()
    : reject(new Error(stderr || `screening exited ${code}`)));
});

const report = JSON.parse(await fs.readFile(output, "utf8"));
assert.equal(report.scenarioDate, "1326-04-07");
assert.equal(report.screening.notGeometryAuthority, true);
assert.equal(report.screening.noSyntheticGeometry, true);
assert.match(report.screening.method, /Polygon\/MultiPolygon intersects anchor influence rectangle/);
assert.equal(report.counts.inputCandidates, 5);
assert.equal(report.counts.screenedCandidates, 2);
assert.equal(report.counts.rejectedCandidates, 3);

const screenedIds = new Set(report.candidates.map(candidate => candidate.sourceFeatureId));
assert.equal(screenedIds.has("near-bursa"), true, "actual local polygon overlap should be screened");
assert.equal(screenedIds.has("multipolygon-local"), true, "a local MultiPolygon component should be screened");
assert.equal(screenedIds.has("broad-bbox-hole"), false, "bbox-only false positive inside a polygon hole must be rejected");
assert.equal(screenedIds.has("expired"), false, "candidate outside the scenario year range must be rejected");
assert.equal(screenedIds.has("far-away"), false, "candidate outside the anchor window must be rejected");

const rejectedById = new Map(report.rejected.map(item => [item.sourceFeatureIndex, item.reason]));
assert.equal(rejectedById.get(2), "bbox-only-false-positive-no-polygon-intersection");
assert.equal(rejectedById.get(3), "outside-scenario-year-range");
assert.equal(rejectedById.get(4), "outside-anchor-screening-window");

const local = report.candidates.find(candidate => candidate.sourceFeatureId === "near-bursa");
assert.equal(local.anchorHits[0].anchorId, "bursa-core");
assert.equal(local.anchorHits[0].geometryRelation, "polygon-intersects-anchor-influence-rectangle");
assert.equal(local.promotion, "BLOCKED");
assert.deepEqual(local.geometry, candidates[0].geometry);
assert.match(local.sourceGeometrySha256, /^[0-9a-f]{64}$/);
assert.equal(
  local.sourceGeometrySha256,
  crypto.createHash("sha256").update(JSON.stringify(local.geometry)).digest("hex")
);


const scopedCandidate = {
  ...base,
  sourceFeatureIndex: 6,
  sourceFeatureId: "nicaea-only",
  name: "Candidate intersecting Nicaea only",
  fromYear: 1200,
  toYear: 1400,
  geometry: {
    type: "Polygon",
    coordinates: [[[29.65, 40.4], [29.8, 40.4], [29.8, 40.5], [29.65, 40.5], [29.65, 40.4]]],
  },
  reconciliationStatus: "pending",
};
candidateReport.candidates.push(scopedCandidate);
candidateReport.candidatePacketSha256 = crypto.createHash("sha256").update(JSON.stringify(candidateReport.candidates)).digest("hex");
await fs.writeFile(candidateInput, JSON.stringify(candidateReport));

const approvedScope = path.join(temp, "approved-scope.json");
await fs.writeFile(approvedScope, JSON.stringify({
  schemaVersion: 1,
  scenarioDate: "1326-04-07",
  pilot: "test-bithynia-subset",
  status: "APPROVED",
  edgeIds: ["bursa-nicaea-frontier-1326"],
  allowedAnchorIds: ["bursa-core"],
  source: "test-only fixture scope",
}));
const scopedOutput = path.join(temp, "scoped-screening.json");
await new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [
    script,
    "--input", candidateInput,
    "--anchors", path.join(fixture, "anchors.json"),
    "--scope", approvedScope,
    "--output", scopedOutput,
    "--radius-km", "30",
  ], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
  let stderr = "";
  child.stderr.on("data", chunk => { stderr += chunk; });
  child.on("error", reject);
  child.on("close", code => code === 0
    ? resolve()
    : reject(new Error(stderr || `scoped screening exited ${code}`)));
});
const scopedReport = JSON.parse(await fs.readFile(scopedOutput, "utf8"));
assert.equal(scopedReport.pilotScope.status, "APPROVED");
assert.deepEqual(scopedReport.pilotScope.allowedAnchorIds, ["bursa-core"]);
const scopedIds = new Set(scopedReport.candidates.map(candidate => candidate.sourceFeatureId));
assert.equal(scopedIds.has("near-bursa"), true, "in-scope Bursa geometry should remain screened");
assert.equal(scopedIds.has("nicaea-only"), false, "Nicaea-only geometry must not enter a Bursa-only scoped shortlist");
const scopedRejected = new Map(scopedReport.rejected.map(item => [item.sourceFeatureIndex, item.reason]));
assert.equal(scopedRejected.get(6), "outside-explicit-pilot-scope", "out-of-scope anchor hits need an explicit rejection reason");

const blockedScope = path.join(temp, "blocked-scope.json");
await fs.writeFile(blockedScope, JSON.stringify({
  schemaVersion: 1,
  scenarioDate: "1326-04-07",
  pilot: "bithynia-core-01",
  status: "BLOCKED_SCOPE_DEFINITION",
  edgeIds: ["bursa-nicaea-frontier-1326"],
  allowedAnchorIds: [],
}));
await new Promise(resolve => {
  const child = spawn(process.execPath, [
    script,
    "--input", candidateInput,
    "--anchors", path.join(fixture, "anchors.json"),
    "--scope", blockedScope,
    "--output", path.join(temp, "blocked-screening.json"),
    "--radius-km", "30",
  ], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
  child.on("error", resolve);
  child.on("close", code => {
    assert.notEqual(code, 0, "blocked pilot scope must fail closed");
    resolve();
  });
});

console.log("1326 candidate surface screening contract passed (polygon intersection, holes, MultiPolygon, temporal gate, explicit scope gate).");
