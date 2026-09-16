import assert from "node:assert/strict";
import { validateMultiRingTopology } from "../historical-gis/MultiRingPolygonTopology.js";

const outer = [[0,0],[10,0],[10,10],[0,10]];
const holeA = [[2,2],[4,2],[4,4],[2,4]];
const holeB = [[6,2],[8,2],[8,4],[6,4]];
const island = [[2,6],[4,6],[4,8],[2,8]];
const outside = [[12,2],[14,2],[14,4],[12,4]];
const crossing = [[3,3],[7,3],[7,7],[3,7]];
const bowTie = [[1,1],[5,5],[1,5],[5,1]];

assert.equal(validateMultiRingTopology({ outerRing: outer, holes: [holeA, holeB] }).status, "valid");
assert.equal(validateMultiRingTopology({ outerRing: outer, islands: [island] }).status, "valid");
assert.match(validateMultiRingTopology({ outerRing: outer, holes: [outside] }).reason, /outside/);
assert.match(validateMultiRingTopology({ outerRing: outer, holes: [crossing] }).reason, /overlap|touches|crosses/);
assert.match(validateMultiRingTopology({ outerRing: outer, holes: [bowTie] }).reason, /self-intersection/);
assert.match(validateMultiRingTopology({ outerRing: outer, holes: [holeA, [[3,3],[5,3],[5,5],[3,5]]] }).reason, /overlap/);

console.log("Multi-ring topology validation passed: containment, crossings, overlaps, and self-intersections are guarded.");
