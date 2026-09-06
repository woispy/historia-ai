import assert from "node:assert/strict";
import {
  AuthoritativeArcRegistry,
  registerSolverPath,
  authoritativeArcNodeId,
  canonicalArcLongitude,
} from "../historical-gis/province/AuthoritativeArcGenerator.js";

const registry = new AuthoritativeArcRegistry({ tolerance: 1e-6 });
const first = registerSolverPath(registry, {
  result: {
    path: [
      { lon: 179, lat: 35 },
      { lon: 179.5, lat: 35.5 },
      { lon: -179.5, lat: 36 },
    ],
    cost: 3,
  },
  leftFace: "province:A",
  rightFace: "province:B",
  confidence: 0.95,
});

assert.equal(first.reused, false);
assert.equal(first.forward, true);
assert.equal(registry.arcs.size, 1);
assert.equal(registry.nodes.size, 2);
assert.equal(first.arc.leftFace, "province:A");
assert.equal(first.arc.rightFace, "province:B");
assert.deepEqual(first.arc.geometry, [
  { lon: 179, lat: 35 },
  { lon: 179.5, lat: 35.5 },
  { lon: -179.5, lat: 36 },
]);
assert.equal(first.arc.confidence, 0.95);

const reverse = registerSolverPath(registry, {
  result: {
    path: [
      { lon: -179.5, lat: 36 },
      { lon: 179.5, lat: 35.5 },
      { lon: 179, lat: 35 },
    ],
  },
  leftFace: "province:B",
  rightFace: "province:A",
});
assert.equal(reverse.reused, true);
assert.equal(reverse.forward, false);
assert.equal(reverse.arc.id, first.arc.id);
assert.equal(registry.arcs.size, 1);

assert.equal(canonicalArcLongitude(180), -180);
assert.equal(canonicalArcLongitude(-540), -180);
assert.equal(authoritativeArcNodeId({ lon: 179, lat: 35 }, 1e-6), authoritativeArcNodeId({ lon: 539, lat: 35 }, 1e-6));

const topology = registry.toTopology();
assert.deepEqual(topology.arcs[first.arc.id].geometry, first.arc.geometry);
assert.deepEqual(topology.nodes[first.arc.startNode].incidentArcs, [first.arc.id]);
assert.deepEqual(topology.nodes[first.arc.startNode].incidentFaces, ["province:A", "province:B"]);

assert.throws(
  () => registerSolverPath(registry, {
    result: { path: first.arc.geometry },
    leftFace: "province:A",
    rightFace: "province:C",
  }),
  /already has two incident faces|more than one side/,
);

assert.throws(
  () => registerSolverPath(registry, {
    result: { path: [{ lon: 0, lat: 0 }] },
    leftFace: "A",
    rightFace: "B",
  }),
  /missing path/,
);

assert.throws(
  () => registerSolverPath(registry, {
    result: { path: [{ lon: 0, lat: 0 }, { lon: 0, lat: 0 }] },
    leftFace: "A",
    rightFace: "B",
  }),
  /at least two distinct points/,
);

console.log("P3.9 authoritative arc generation / shared directed arc contracts: PASS");
