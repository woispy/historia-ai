/**
 * Historia AI — Province Source Intake contract test.
 *
 * The province fixtures below are SYNTHETIC TEST-ONLY data used to prove the
 * reviewed-source -> shared-edge Arc pipeline. They are never golden dataset
 * geometry and must never be promoted into anatolia-1300.
 */

import assert from "node:assert/strict";
import { importReviewedProvinceSource } from "../historical-gis/province/ProvinceSourceImporter.js";
import { AuthoritativeArcRegistry } from "../historical-gis/province/AuthoritativeArcGenerator.js";
import { assembleFullFaces, assertFullFaceAssembly } from "../historical-gis/province/FullFaceAssembly.js";

const SYNTHETIC_PROOF_GRID = {
  sourceId: "synthetic-proof-grid",
  sourceRef: "test-only fixture; not a historical authority",
  reviewStatus: "reviewed",
  provinces: [
    { provinceId: "proof-a", sourceRef: "test-only", confidence: 0.9, ring: [[0, 0], [1, 0], [1, 1], [0, 1]] },
    { provinceId: "proof-b", sourceRef: "test-only", confidence: 0.8, ring: [[1, 0], [2, 0], [2, 1], [1, 1]] },
    { provinceId: "proof-c", sourceRef: "test-only", confidence: 0.7, ring: [[2, 0], [3, 0], [3, 1], [2, 1]] },
  ],
};

function withReversedWinding() {
  return {
    ...SYNTHETIC_PROOF_GRID,
    provinces: SYNTHETIC_PROOF_GRID.provinces.map((province) => (
      province.provinceId === "proof-b"
        ? { ...province, ring: [...province.ring].reverse() }
        : province
    )),
  };
}

function withNonManifoldSegment() {
  return {
    ...SYNTHETIC_PROOF_GRID,
    provinces: [
      ...SYNTHETIC_PROOF_GRID.provinces,
      { provinceId: "proof-d", sourceRef: "test-only", confidence: 0.9, ring: [[1, 0], [0, 0], [0.5, -1]] },
      { provinceId: "proof-e", sourceRef: "test-only", confidence: 0.9, ring: [[0, 0], [1, 0], [0.5, -2]] },
    ],
  };
}

let passed = 0;

assert.throws(
  () => importReviewedProvinceSource({ ...SYNTHETIC_PROOF_GRID, reviewStatus: "draft" }, { createRegistry: (options) => new AuthoritativeArcRegistry(options) }),
  /unreviewed sources are rejected by contract/,
  "unreviewed source must be rejected",
);
passed += 1;

const { registry, report } = importReviewedProvinceSource(SYNTHETIC_PROOF_GRID, { createRegistry: (options) => new AuthoritativeArcRegistry(options) });
assert.equal(report.provinceCount, 3);
assert.equal(report.sharedEdgeCount, 2, "three provinces in a row share exactly two segments");
assert.equal(report.worldEdgeCount, 8);
assert.equal(report.arcCount, 10);
assert.equal(report.nodeCount, 8);
assert.equal(report.worldFaceId, "world");
passed += 1;

const arcs = Object.values(registry.toTopology().arcs);
const sharedArcs = arcs.filter((arc) => arc.kind === "province");
assert.equal(sharedArcs.length, 2);
for (const arc of sharedArcs) {
  assert.notEqual(arc.leftFace, arc.rightFace);
  assert.notEqual(arc.leftFace, "world");
  assert.notEqual(arc.rightFace, "world");
}
const abArc = sharedArcs.find((arc) => (arc.leftFace === "proof-a" && arc.rightFace === "proof-b") || (arc.leftFace === "proof-b" && arc.rightFace === "proof-a"));
const bcArc = sharedArcs.find((arc) => (arc.leftFace === "proof-b" && arc.rightFace === "proof-c") || (arc.leftFace === "proof-c" && arc.rightFace === "proof-b"));
assert.ok(abArc && bcArc, "both shared edges must exist");
assert.equal(abArc.confidence, 0.8, "shared arc confidence must be the conservative minimum of its two provinces");
assert.equal(bcArc.confidence, 0.7);
assert.ok(sharedArcs.filter((arc) => arc === abArc).length === 1 && sharedArcs.filter((arc) => arc === bcArc).length === 1, "each shared edge must be registered exactly once");
for (const arc of arcs.filter((entry) => entry.kind === "boundary")) {
  assert.equal(arc.rightFace, "world");
}
passed += 1;

const assembly = assertFullFaceAssembly(assembleFullFaces({ topology: registry.toTopology() }), { expectedEuler: 2 });
const faceIds = Object.keys(assembly.topology.faces).sort();
assert.deepEqual(faceIds, ["proof-a", "proof-b", "proof-c", "world"], "full assembly must yield the three provinces plus the world face");
passed += 1;

assert.throws(
  () => importReviewedProvinceSource(withReversedWinding(), { createRegistry: (options) => new AuthoritativeArcRegistry(options) }),
  /inconsistent winding \/ overlapping geometry/,
  "same-direction shared traversal must be rejected as overlapping geometry",
);
passed += 1;

assert.throws(
  () => importReviewedProvinceSource(withNonManifoldSegment(), { createRegistry: (options) => new AuthoritativeArcRegistry(options) }),
  /Non-manifold boundary segment/,
  "segment incident to three provinces must be rejected",
);
passed += 1;

console.log(`Province source intake contract passed: ${passed} checks, synthetic proof grid -> ${report.arcCount} arcs, ${report.nodeCount} nodes, 4 faces, Euler=2 (test-only geometry, never golden dataset).`);
