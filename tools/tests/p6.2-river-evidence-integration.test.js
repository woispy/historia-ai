import assert from "node:assert/strict";

import {
  assertP62AuthoritativeReady,
  createP62BoundaryEvidence,
  P62_STATUS,
} from "../historical-gis/P62BoundarySolver.js";
import {
  createP62RiverEvidenceAdapter,
  p62RiverEvidenceLines,
} from "../historical-gis/P62RiverEvidenceAdapter.js";

const adapter = createP62RiverEvidenceAdapter({
  rivers: [{
    id: "river-test-0",
    canonicalId: "test-river",
    name: "Test River",
    coordinates: [[0, 0], [1, 0]],
    geometrySource: "natural-earth-10m",
  }],
  toleranceKm: 15,
});

const result = createP62BoundaryEvidence({
  seeds: [
    { id: "a", point: [-0.5, 0] },
    { id: "b", point: [1.5, 0] },
  ],
  riverLines: p62RiverEvidenceLines(adapter),
  sampleStepKm: 10,
});

assert.equal(adapter.authoritative, false);
assert.equal(result.sourceAvailability.river, true);
assert.equal(result.status, P62_STATUS.LOCKED);
assert.equal(result.authoritative, false);
assert.equal(result.edges.length, 1);
assert.equal(result.edges[0].features.river, true);
assert.equal(result.edges[0].evidenceClass, "river");

assert.throws(
  () => assertP62AuthoritativeReady(result),
  /P6\.2 authoritative mode requires a DEM sampler/,
);

console.log("P6.2-B.1 River Evidence → Boundary Solver integration: PASS");
console.log(`riverEvidence=true; solverStatus=${result.status}; authoritative=${result.authoritative}`);
console.log("gate=assertP62AuthoritativeReady rejects because DEM/ridge authority is absent");
