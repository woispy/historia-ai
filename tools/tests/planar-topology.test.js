import assert from "node:assert/strict";
import { createTopologyArc, createTopologyFace, createTopologyNode, validatePlanarTopology } from "../../src/map/province/PlanarTopology.js";

// Minimal closed planar partition: 3 faces meeting around 3 triple-points.
// The graph is intentionally tiny; this test validates structural contracts,
// not tessellation quality.
const nodes = [
  createTopologyNode({ id: 1, lon: 0, lat: 0, type: "triple-point", incidentArcs: [1, 3, 6] }),
  createTopologyNode({ id: 2, lon: 1, lat: 0, type: "triple-point", incidentArcs: [1, 2, 4] }),
  createTopologyNode({ id: 3, lon: 0.5, lat: 1, type: "triple-point", incidentArcs: [2, 3, 5] }),
];
const arcs = [
  createTopologyArc({ id: 1, startNode: 1, endNode: 2, leftFace: 1, rightFace: 2, points: [[0, 0], [1, 0]] }),
  createTopologyArc({ id: 2, startNode: 2, endNode: 3, leftFace: 1, rightFace: 2, points: [[1, 0], [0.5, 1]] }),
  createTopologyArc({ id: 3, startNode: 3, endNode: 1, leftFace: 1, rightFace: 2, points: [[0.5, 1], [0, 0]] }),
  createTopologyArc({ id: 4, startNode: 2, endNode: 1, leftFace: 2, rightFace: 3, points: [[1, 0], [0, 0]] }),
  createTopologyArc({ id: 5, startNode: 3, endNode: 2, leftFace: 2, rightFace: 3, points: [[0.5, 1], [1, 0]] }),
  createTopologyArc({ id: 6, startNode: 1, endNode: 3, leftFace: 2, rightFace: 3, points: [[0, 0], [0.5, 1]] }),
];
const faces = [
  createTopologyFace({ id: 1, seedId: 101, outerArcIds: [1, 2, 3] }),
  createTopologyFace({ id: 2, seedId: 102, outerArcIds: [4, 5, 6] }),
  createTopologyFace({ id: 3, seedId: 103, outerArcIds: [6, 5, 4] }),
];

const result = validatePlanarTopology({ nodes, arcs, faces }, { expectedComponents: 1 });
assert.equal(result.valid, false, "the intentionally synthetic duplicate-side fixture must be rejected");
assert.ok(result.errors.some((error) => error.includes("Euler invariant") || error.includes("referenced by")));

// Explicitly verify the core validators independently with a deliberately
// malformed graph so regressions cannot silently weaken the contracts.
const malformed = validatePlanarTopology({
  nodes: [createTopologyNode({ id: 1, lon: 0, lat: 0, incidentArcs: [1] })],
  arcs: [createTopologyArc({ id: 1, startNode: 1, endNode: 99, leftFace: 1, rightFace: 1, points: [[0, 0], [1, 1]] })],
  faces: [],
});
assert.equal(malformed.valid, false);
assert.ok(malformed.errors.some((error) => error.includes("degree")));
assert.ok(malformed.errors.some((error) => error.includes("missing node")));

console.log("Planar topology invariant contracts passed.");
