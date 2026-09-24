import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

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
  source: { sourceId: "cliopatria-v0.2.0", sourceTag: "v0.2.0" },
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
  promotion: "BLOCKED",
  results: [{
    entityId: "ottoman-beylik",
    status: "single-candidate",
    candidates: [{ sourceFeatureIndex: near.sourceFeatureIndex, sourceFeatureId: near.sourceFeatureId, name: near.name, wikidataId: null, seshatId: null, fromYear: 1200, toYear: 1400, geometryAuthorityStatus: "candidate-evidence-only" }]
  }]
};
await fs.writeFile(screening, JSON.stringify(screen));
await fs.writeFile(reconciliation, JSON.stringify(reconciliation));

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["tools/historical-gis/cli/prepare-1326-geometry-reconciliation.js", ...args], { cwd: root, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", code => code === 0 ? resolve() : reject(new Error(`exit ${code}`)));
  });
}
await run(["--screening", screening, "--reconciliation", reconciliation, "--output", output]);

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
assert.equal(report.reviewQueue[0].reviewedGeometry, null);
assert.equal(report.reviewQueue[0].sourceGeometry.immutable, true);
assert.match(report.reviewQueue[0].sourceGeometry.sha256, /^[0-9a-f]{64}$/);
assert.deepEqual(report.reviewQueue[0].spatialScreening.geometryBbox, b);
console.log("1326 geometry reconciliation contract passed: source geometry is immutable, review-only, provenance-bound, and promotion-blocked.");
