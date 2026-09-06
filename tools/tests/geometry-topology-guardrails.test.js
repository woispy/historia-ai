import assert from "node:assert/strict";
import { validateArcGeometry, validateRingGeometry } from "../historical-gis/province/GeometryValidation.js";
import { assembleDirectedRing } from "../historical-gis/province/FaceRingAssembler.js";

const square = {
  a: { id: "a", startNode: "n0", endNode: "n1", geometry: [{ lon: 0, lat: 0 }, { lon: 1, lat: 0 }] },
  b: { id: "b", startNode: "n1", endNode: "n2", geometry: [{ lon: 1, lat: 0 }, { lon: 1, lat: 1 }] },
  c: { id: "c", startNode: "n2", endNode: "n3", geometry: [{ lon: 1, lat: 1 }, { lon: 0, lat: 1 }] },
  d: { id: "d", startNode: "n3", endNode: "n0", geometry: [{ lon: 0, lat: 1 }, { lon: 0, lat: 0 }] },
};
const ring = [
  { arcId: "a", forward: true }, { arcId: "b", forward: true },
  { arcId: "c", forward: true }, { arcId: "d", forward: true },
];

const ccw = validateRingGeometry(square, ring, { expectedWinding: "ccw" });
assert.equal(ccw.valid, true, ccw.errors.join("; "));
assert.equal(ccw.winding, "ccw");
assert.ok(ccw.signedArea > 0);

const cw = validateRingGeometry(square, [...ring].reverse().map((entry) => ({ ...entry, forward: !entry.forward })), { expectedWinding: "cw" });
assert.equal(cw.valid, true, cw.errors.join("; "));
assert.equal(cw.winding, "cw");

assert.throws(
  () => assembleDirectedRing(square, ring, { expectedWinding: "cw" }),
  /expected cw/,
);

const bowtie = {
  x: { id: "x", startNode: "p0", endNode: "p1", geometry: [{ lon: 0, lat: 0 }, { lon: 2, lat: 2 }] },
  y: { id: "y", startNode: "p1", endNode: "p2", geometry: [{ lon: 2, lat: 2 }, { lon: 0, lat: 2 }] },
  z: { id: "z", startNode: "p2", endNode: "p3", geometry: [{ lon: 0, lat: 2 }, { lon: 2, lat: 0 }] },
  w: { id: "w", startNode: "p3", endNode: "p0", geometry: [{ lon: 2, lat: 0 }, { lon: 0, lat: 0 }] },
};
const bowtieResult = validateRingGeometry(bowtie, [
  { arcId: "x", forward: true }, { arcId: "y", forward: true },
  { arcId: "z", forward: true }, { arcId: "w", forward: true },
]);
assert.equal(bowtieResult.valid, false);
assert.ok(bowtieResult.errors.some((error) => error.includes("self-intersects")));

const loopingArc = {
  loop: {
    id: "loop", startNode: "s", endNode: "t",
    geometry: [{ lon: 0, lat: 0 }, { lon: 2, lat: 2 }, { lon: 0, lat: 2 }, { lon: 2, lat: 0 }],
  },
};
const arcResult = validateArcGeometry(loopingArc.loop);
assert.equal(arcResult.valid, false);
assert.ok(arcResult.errors.some((error) => error.includes("self-intersects")));

const antiMeridian = {
  a: { id: "a", startNode: "n0", endNode: "n1", geometry: [{ lon: 179, lat: 0 }, { lon: -179, lat: 0 }] },
  b: { id: "b", startNode: "n1", endNode: "n2", geometry: [{ lon: -179, lat: 0 }, { lon: -179, lat: 1 }] },
  c: { id: "c", startNode: "n2", endNode: "n3", geometry: [{ lon: -179, lat: 1 }, { lon: 179, lat: 1 }] },
  d: { id: "d", startNode: "n3", endNode: "n0", geometry: [{ lon: 179, lat: 1 }, { lon: 179, lat: 0 }] },
};
const seamResult = validateRingGeometry(antiMeridian, ring, { expectedWinding: "ccw" });
assert.equal(seamResult.valid, true, seamResult.errors.join("; "));
assert.equal(seamResult.winding, "ccw");

console.log("Geometric winding + self-intersection + antimeridian guardrails: PASS");
