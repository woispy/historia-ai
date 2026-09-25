import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import crypto from "node:crypto";

const root = process.cwd();
const fixture = path.join(root, "tools/tests/fixtures/1326-candidate-surface");
const screening = path.join(root, "data/build/gis/1326/test-candidate-surface-screening.json");
const reconciliation = path.join(root, "data/build/gis/1326/test-entity-reconciliation.json");
const output = path.join(root, "data/build/gis/1326/test-geometry-reconciliation.json");

await fs.mkdir(path.dirname(output), { recursive: true });
const candidates = JSON.parse(await fs.readFile(path.join(fixture, "candidates.json"), "utf8"));
const anchors = JSON.parse(await fs.readFile(path.join(fixture, "anchors.json"), "utf8"));

function bbox(geometry) {
  const values = [];
  const walk = value => {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && Number.isFinite(value[0]) && Number.isFinite(value[1])) {
      values.push(value[0], value[1]);
      return;
    }
    value.forEach(walk);
  };
  walk(geometry.coordinates);
  return [Math.min(...values.filter((_, i) => i % 2 === 0)), Math.min(...values.filter((_, i) => i % 2 === 1)), Math.max(...values.filter((_, i) => i % 2 === 0)), Math.max(...values.filter((_, i) => i % 2 === 1))];
}
const near = candidates.candidates[0];
const b = bbox(near.geometry);
const anchor = anchors.anchors[0];
const screen = {
  schemaVersion: 1,
  scenarioDate: "1326-04-07",
  source: { sourceId: "cliopatria-v0.2.0", sourceTag: "v0.2.0", extractedGeojsonSha256: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef", inputSha256: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef" },
  screening: { notGeometryAuthority: true, noSyntheticGeometry: true },
  promotion: "BLOCKED",
  candidates: [{
    ...near,
    geometryBbox: b,
    geometryBboxCenter: [(b[0]+b[2])/2,(b[1]+b[3])/2],
    anchorHits: [{ anchorId: anchor.id, role: anchor.role, bboxDistanceKm: 0 }],
    screeningOnly: true,
    promotion: "BLOCKED"
  }]
};
const reconciliation = {
  schemaVersion: 1,
  scenarioDate: "1326-04-07",
  sourceId: "cliopatria-v0.2.0",
  sourceProvenance: { extractedGeojsonSha256: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef" },
  promotion: "BLOCKED",
  results: [{
    entityId: "ottoman-beylik",
    status: "single-candidate",
    candidates: [{ sourceFeatureIndex: near.sourceFeatureIndex, sourceFeatureId: near.sourceFeatureId, name: near.name, wikidataId: null, seshatId: null, fromYear: 1200, toYear: 1400, geometryAuthorityStatus: "candidate-evidence-only" }]
  }]
};
await fs.writeFile(screening, JSON.stringify(screen));
await fs.writeFile(reconciliation, JSON.stringify(reconciliation));

function run(script, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], { cwd: root, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", code => code === 0 ? resolve() : reject(new Error(`exit ${code}`)));
  });
}
await run("tools/historical-gis/cli/prepare-1326-geometry-reconciliation.js", ["--screening", screening, "--reconciliation", reconciliation, "--output", output]);
await run("tools/historical-gis/cli/validate-1326-geometry-reconciliation.js", ["--input", output]);
await run("tools/historical-gis/cli/validate-1326-reviewed-geometry.js", ["--input", output]);

const report = JSON.parse(await fs.readFile(output, "utf8"));
assert.equal(report.scenarioDate, "1326-04-07");
assert.equal(report.authorityStatus, "candidate-review-only");
assert.equal(report.policy.sourceGeometryIsAuthoritative, false);
assert.equal(report.policy.geometryMutationAllowed, false);
assert.equal(report.policy.syntheticGeometryAllowed, false);
assert.equal(report.policy.controlImpliesGeometry, false);
assert.equal(report.promotion, "BLOCKED");
assert.equal(report.counts.screenedCandidates, 1);
assert.equal(report.counts.entityLinkedCandidates, 1);
assert.equal(report.reviewQueue[0].reviewStatus, "pending");
assert.equal(
  report.reviewQueue[0].reviewId,
  `cliopatria-1326-feature-${near.sourceFeatureIndex}-${report.reviewQueue[0].sourceEvidence.candidatePacketSha256.slice(0, 16)}`
);
assert.equal(
  report.reviewQueue[0].sourceEvidence.reviewIdDerivation,
  "cliopatria-1326-feature-${sourceFeatureIndex}-${candidatePacketSha256.slice(0,16)}"
);
assert.equal(report.reviewQueue[0].reviewedGeometry, null);
assert.equal(report.reviewQueue[0].sourceGeometry.immutable, true);
assert.equal(report.reviewQueue[0].sourceGeometry.mutationPolicy, "immutable-source-evidence");
assert.deepEqual(report.reviewQueue[0].sourceGeometry.geometry, near.geometry);
assert.match(report.reviewQueue[0].sourceGeometry.sha256, /^[0-9a-f]{64}$/);
assert.equal(report.reviewQueue[0].sourceGeometry.sha256, crypto.createHash("sha256").update(JSON.stringify(near.geometry)).digest("hex"));
assert.equal(report.reviewQueue[0].sourceEvidence.sourceFeatureIndex, near.sourceFeatureIndex);
assert.deepEqual(report.reviewQueue[0].spatialScreening.geometryBbox, b);
console.log("1326 geometry reconciliation contract passed: source geometry is immutable, review-only, provenance-bound, and promotion-blocked.");
