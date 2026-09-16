import assert from "node:assert/strict";
import { classifyPolygonRings, buildMultiRingMesh } from "../historical-gis/MultiRingPolygonMeshBuilder.js";

const outer = [[0,0],[10,0],[10,10],[0,10],[0,0]];
const hole = [[2,2],[4,2],[4,4],[2,4],[2,2]];
const island = [[6,6],[8,6],[8,8],[6,8],[6,6]];
const outside = [[20,20],[21,20],[21,21],[20,21]];

assert.equal(classifyPolygonRings({ outerRing: outer }).status, "simple");
assert.equal(classifyPolygonRings({ outerRing: outer, holes: [hole] }).status, "requires-multiring-triangulation");
assert.equal(classifyPolygonRings({ outerRing: outer, islands: [island] }).status, "requires-multiring-triangulation");
assert.equal(classifyPolygonRings({ outerRing: outer, holes: [outside] }).reason, "hole-outside-outer-ring");
assert.equal(classifyPolygonRings({ outerRing: outer, islands: [outside] }).reason, "island-outside-outer-ring");

const mesh = buildMultiRingMesh({ provinceId: "p1", geometryId: "g1", outerRing: outer });
assert.equal(mesh.ringCount, 1);
assert.equal(mesh.holeCount, 0);
assert.equal(mesh.islandCount, 0);
assert.throws(() => buildMultiRingMesh({ provinceId: "p1", geometryId: "g1", outerRing: outer, holes: [hole] }), /hole-aware triangulation/);

console.log("Multi-ring topology gate passed: holes/islands are classified and unsafe silent filling is refused.");
