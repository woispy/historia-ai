import assert from "node:assert/strict";
import { assembleFullFaces, assertFullFaceAssembly } from "../historical-gis/province/FullFaceAssembly.js";

// Minimal closed planar subdivision. Face IDs are carried only by Arc sides;
// P5 must reconstruct the directed rings without synthetic topology.
const nodes = {
  a: { id: "a", kind: "triple-point", position: { lon: 0, lat: 0 }, incidentArcs: ["ab", "ac", "ad"], incidentFaces: ["f1", "f3", "f4"] },
  b: { id: "b", kind: "triple-point", position: { lon: 1, lat: 0 }, incidentArcs: ["ab", "bc", "bd"], incidentFaces: ["f1", "f2", "f4"] },
  c: { id: "c", kind: "triple-point", position: { lon: 0.5, lat: 1 }, incidentArcs: ["bc", "ac", "cd"], incidentFaces: ["f2", "f3", "f4"] },
  d: { id: "d", kind: "triple-point", position: { lon: 0.5, lat: 0.35 }, incidentArcs: ["ad", "bd", "cd"], incidentFaces: ["f1", "f2", "f3"] },
};

const arcs = {
  ab: { id: "ab", kind: "province", startNode: "a", endNode: "b", leftFace: "f1", rightFace: "f4", geometry: [{ lon: 0, lat: 0 }, { lon: 1, lat: 0 }] },
  bc: { id: "bc", kind: "province", startNode: "b", endNode: "c", leftFace: "f2", rightFace: "f4", geometry: [{ lon: 1, lat: 0 }, { lon: 0.5, lat: 1 }] },
  ac: { id: "ac", kind: "province", startNode: "c", endNode: "a", leftFace: "f3", rightFace: "f4", geometry: [{ lon: 0.5, lat: 1 }, { lon: 0, lat: 0 }] },
  ad: { id: "ad", kind: "province", startNode: "a", endNode: "d", leftFace: "f3", rightFace: "f1", geometry: [{ lon: 0, lat: 0 }, { lon: 0.5, lat: 0.35 }] },
  bd: { id: "bd", kind: "province", startNode: "d", endNode: "b", leftFace: "f2", rightFace: "f1", geometry: [{ lon: 0.5, lat: 0.35 }, { lon: 1, lat: 0 }] },
  cd: { id: "cd", kind: "province", startNode: "c", endNode: "d", leftFace: "f2", rightFace: "f3", geometry: [{ lon: 0.5, lat: 1 }, { lon: 0.5, lat: 0.35 }] },
};

const result = assembleFullFaces({ topology: { nodes, arcs } });
assertFullFaceAssembly(result, { expectedEuler: 2 });
assert.equal(result.validation.valid, true, result.validation.errors.join("; "));
assert.equal(result.eulerCharacteristic, 2);
assert.equal(Object.keys(result.topology.faces).length, 4);
assert.deepEqual(
  result.diagnostics.map(({ faceId, ringCount, holeCount }) => ({ faceId, ringCount, holeCount })),
  [
    { faceId: "f1", ringCount: 1, holeCount: 0 },
    { faceId: "f2", ringCount: 1, holeCount: 0 },
    { faceId: "f3", ringCount: 1, holeCount: 0 },
    { faceId: "f4", ringCount: 1, holeCount: 0 },
  ],
);

// An open Arc graph must fail rather than receiving a fabricated boundary.
const openArcs = { ...arcs };
delete openArcs.cd;
assert.throws(
  () => assembleFullFaces({ topology: { nodes, arcs: openArcs } }),
  /open boundary|ambiguous boundary continuation|f[34]/i,
);

console.log("P5 full face assembly and honest Euler contracts passed.");
