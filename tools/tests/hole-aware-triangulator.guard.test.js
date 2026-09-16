import assert from "node:assert/strict";
import { triangulateMultiRingPolygon } from "../historical-gis/HoleAwareTriangulator.js";

const outer = [[0,0],[10,0],[10,10],[0,10]];
const hole = [[2,2],[4,2],[4,4],[2,4]];
const overlap = [[3,3],[6,3],[6,6],[3,6]];

const result = triangulateMultiRingPolygon({ outerRing: outer, holes: [hole] });
assert.ok(result.indices.length > 0);
assert.equal(result.indices.length % 3, 0);

// The experimental bridge must never be allowed to silently accept an
// overlapping hole. This test is deliberately a hard safety gate.
assert.throws(
  () => triangulateMultiRingPolygon({ outerRing: outer, holes: [hole, overlap] }),
  /Multi-ring triangulation failed|bridge|overlap|topology/i,
);

console.log("Hole-aware triangulator safety guard passed.");
