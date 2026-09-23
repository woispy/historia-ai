/**
 * Historia AI — Province Proof Group contract test.
 *
 * Verifies the P3 editorial proof-group pipeline:
 *  - A fully consistent synthetic group (3 adjacent provinces) is VALID with
 *    planar topology and Euler characteristic 2.
 *  - Per-province error attribution: a province with bad provenance is
 *    flagged while ready provinces stay ready.
 *  - Winding mismatch on a shared edge is attributed to BOTH provinces.
 *  - A self-intersecting ring is attributed to its province.
 *  - Proof groups are never production authority (notProductionAuthority).
 */

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { validateProofGroup } from "../historical-gis/province/ProvinceProofGroup.js";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..", "..");
const fixtureDirectory = path.join(root, "tools/tests/fixtures/political-geography/proof-grid");
const coverage = JSON.parse(await readFile(path.join(fixtureDirectory, "coverage.json"), "utf8"));
const provincesManifest = JSON.parse(await readFile(path.join(fixtureDirectory, "provinces.json"), "utf8"));

let passed = 0;

const RINGS = {
  "proof-a": [[0, 0], [1, 0], [1, 1], [0, 1]],
  "proof-b": [[1, 0], [2, 0], [2, 1], [1, 1]],
  "proof-c": [[2, 0], [3, 0], [3, 1], [2, 1]],
};

function buildDocument({ reviewStatus = "reviewed", overrides = {}, include = ["proof-a", "proof-b", "proof-c"], ringOverrides = {} } = {}) {
  return {
    sourceId: "synthetic-proof-group-editorial",
    sourceRef: "test-only fixture; not a historical authority",
    reviewStatus,
    provinces: include.map((provinceId) => ({
      provinceId,
      sourceRef: "test-only reviewed boundary",
      confidence: 0.9,
      reviewStatus,
      ring: ringOverrides[provinceId] ?? RINGS[provinceId],
      ...overrides,
    })),
  };
}

// 1. Fully consistent group is VALID with Euler 2
const valid = validateProofGroup({ sourceDocument: buildDocument(), coverage, provincesManifest });
assert.equal(valid.status, "valid");
assert.equal(valid.readyCount, 3);
assert.equal(valid.pendingCount, 0);
assert.equal(valid.eulerCharacteristic, 2);
assert.ok(valid.topology);
assert.ok(valid.arcCount > 0);
assert.equal(valid.notProductionAuthority, true);
passed += 1;

// 2. Per-province attribution: bad provenance on one province only
const partialDoc = buildDocument();
partialDoc.provinces = partialDoc.provinces.map((entry) => (
  entry.provinceId === "proof-b" ? { ...entry, confidence: null, sourceRef: "" } : entry
));
const partial = validateProofGroup({ sourceDocument: partialDoc, coverage, provincesManifest });
assert.equal(partial.status, "invalid");
const proofB = partial.provinces.find((province) => province.provinceId === "proof-b");
const proofA = partial.provinces.find((province) => province.provinceId === "proof-a");
const proofC = partial.provinces.find((province) => province.provinceId === "proof-c");
assert.equal(proofB.ready, false);
assert.ok(proofB.errors.some((message) => message.includes("confidence")));
assert.equal(proofA.ready, true, "ready provinces must stay ready");
assert.equal(proofC.ready, true);
assert.equal(partial.readyCount, 2);
assert.equal(partial.pendingCount, 1);
passed += 1;

// 3. Winding mismatch on shared edges is attributed to EVERY province involved.
//    Reversing proof-b breaks BOTH of its shared edges: x=1 with proof-a and
//    x=2 with proof-c — two mismatch errors, three provinces flagged.
const windingDoc = buildDocument({
  ringOverrides: { "proof-b": [[1, 0], [1, 1], [2, 1], [2, 0]] },
});
const winding = validateProofGroup({ sourceDocument: windingDoc, coverage, provincesManifest });
assert.equal(winding.status, "invalid");
const windingErrors = winding.groupErrors.filter((item) => item.code === "winding-mismatch");
assert.equal(windingErrors.length, 2);
const involvedPairs = windingErrors.map((item) => [...item.provinceIds].sort().join("+")).sort();
assert.deepEqual(involvedPairs, ["proof-a+proof-b", "proof-b+proof-c"]);
assert.equal(winding.provinces.find((province) => province.provinceId === "proof-a").ready, false);
assert.equal(winding.provinces.find((province) => province.provinceId === "proof-b").ready, false);
assert.equal(winding.provinces.find((province) => province.provinceId === "proof-c").ready, false);
passed += 1;

// 4. Self-intersecting ring is attributed to its province
const selfIntersectingDoc = buildDocument({
  ringOverrides: { "proof-c": [[2, 0], [3, 0], [2, 1], [3, 1]] },
});
const selfIntersecting = validateProofGroup({ sourceDocument: selfIntersectingDoc, coverage, provincesManifest });
assert.equal(selfIntersecting.status, "invalid");
const selfIntersectingRecord = selfIntersecting.provinces.find((province) => province.provinceId === "proof-c");
assert.equal(selfIntersectingRecord.ready, false);
assert.ok(selfIntersectingRecord.errors.some((message) => message.includes("self-intersects")));
assert.equal(selfIntersecting.provinces.find((province) => province.provinceId === "proof-a").ready, true);
passed += 1;

// 5. Empty ring (pending geometry) is attributed to its province
const pendingDoc = buildDocument();
pendingDoc.provinces = pendingDoc.provinces.map((entry) => (
  entry.provinceId === "proof-c" ? { ...entry, ring: [] } : entry
));
const pending = validateProofGroup({ sourceDocument: pendingDoc, coverage, provincesManifest });
assert.equal(pending.status, "invalid");
assert.equal(pending.pendingCount, 1);
assert.ok(pending.provinces.find((province) => province.provinceId === "proof-c").errors.some((message) => message.includes("ring is empty")));
passed += 1;

// 6. Undeclared province (not in coverage) is flagged
const undeclaredDoc = buildDocument({ include: ["proof-a", "proof-b", "proof-c", "proof-z"] });
undeclaredDoc.provinces.push({
  provinceId: "proof-z",
  sourceRef: "test-only",
  confidence: 0.9,
  reviewStatus: "reviewed",
  ring: [[10, 0], [11, 0], [11, 1], [10, 1]],
});
const undeclared = validateProofGroup({ sourceDocument: undeclaredDoc, coverage, provincesManifest });
assert.equal(undeclared.status, "invalid");
const undeclaredRecord = undeclared.provinces.find((province) => province.provinceId === "proof-z");
assert.ok(undeclaredRecord.errors.some((message) => message.includes("not declared in the coverage manifest")));
passed += 1;

// 7. Partial subset (only 2 of 3 provinces entered) is a valid standalone group
const subsetDoc = buildDocument({ include: ["proof-a", "proof-b"] });
const subset = validateProofGroup({ sourceDocument: subsetDoc, coverage, provincesManifest });
assert.equal(subset.status, "valid");
assert.equal(subset.provinceCount, 2);
assert.equal(subset.eulerCharacteristic, 2);
passed += 1;

// 8. Draft (unreviewed) source status is attributed per-province
const draftDoc = buildDocument({ reviewStatus: "draft" });
const draft = validateProofGroup({ sourceDocument: draftDoc, coverage, provincesManifest });
assert.equal(draft.status, "invalid");
assert.equal(draft.readyCount, 0);
assert.ok(draft.provinces.every((province) => province.errors.some((message) => message.includes("reviewStatus"))));
passed += 1;

console.log(`Province proof group contract passed: ${passed} checks — per-province attribution, shared-edge consistency, self-intersection detection, Euler=2, never production authority.`);
