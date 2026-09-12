import assert from "node:assert/strict";
import {
  assertP62AuthoritativeReady,
  createP62BoundaryEvidence,
  P62_EVIDENCE_CLASSES,
  P62_STATUS,
} from "../historical-gis/P62BoundarySolver.js";

const seeds = [
  { id: "a", point: [30, 40] },
  { id: "b", point: [30.5, 40] },
  { id: "c", point: [31, 40] },
];

const diagnostic = createP62BoundaryEvidence({
  seeds,
  ridgeLines: [[[30.2, 39.98], [30.8, 39.98]]],
  riverLines: [[[30.45, 39.5], [30.45, 40.5]]],
  hierarchy: { a: ["b"] },
  historicalAdjacency: { b: ["c"] },
  elevationSampler: ([longitude]) => longitude * 10,
});

assert.equal(diagnostic.phase, "P6.2");
assert.equal(diagnostic.authoritative, false);
assert.equal(diagnostic.status, P62_STATUS.DIAGNOSTIC);
assert.deepEqual(diagnostic.sourceAvailability, {
  dem: true,
  ridge: true,
  river: true,
  hierarchy: true,
  historical: true,
});
assert.equal(diagnostic.edges.length, 3);
assert.equal(diagnostic.edges.some((edge) => edge.evidenceClass === P62_EVIDENCE_CLASSES.MIXED), true);
assert.equal(diagnostic.edges.every((edge) => edge.features.elevationRange?.relief >= 0), true);
assert.throws(
  () => assertP62AuthoritativeReady(diagnostic),
  /requires an explicitly READY authoritative result/,
);

const locked = createP62BoundaryEvidence({
  seeds,
  ridgeLines: [[[30.2, 39.98], [30.8, 39.98]]],
});
assert.equal(locked.status, P62_STATUS.LOCKED);
assert.equal(locked.sourceAvailability.dem, false);
assert.equal(locked.sourceAvailability.river, false);
assert.throws(() => assertP62AuthoritativeReady(locked), /requires a DEM sampler/);

const empty = createP62BoundaryEvidence({ seeds });
assert.equal(empty.status, P62_STATUS.LOCKED);
assert.equal(empty.edges.length, 3);
assert.equal(empty.edges.every((edge) => edge.evidenceClass === P62_EVIDENCE_CLASSES.NONE), true);

console.log("P6.2 boundary solver foundation tests passed: fail-closed authority gate, DEM/ridge/river evidence, hierarchy/history provenance and deterministic edge scoring.");
