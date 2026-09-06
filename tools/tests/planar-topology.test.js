import assert from "node:assert/strict";
import { createTopologyArc, createTopologyFace, createTopologyNode, validatePlanarTopology } from "../../src/map/province/PlanarTopology.js";

// K4 is a minimal planar triangulation with V=4, E=6, F=4 and degree=3.
const nodes = [
  createTopologyNode({ id: 1, lon: 0, lat: 0, incidentArcs: [1, 3, 4] }),
  createTopologyNode({ id: 2, lon: 1, lat: 0, incidentArcs: [1, 2, 5] }),
  createTopologyNode({ id: 3, lon: 0.5, lat: 1, incidentArcs: [2, 3, 6] }),
  createTopologyNode({ id: 4, lon: 0.5, lat: 0.35, incidentArcs: [4, 5, 6] }),
];
const arcs = [
  createTopologyArc({ id: 1, startNode: 1, endNode: 2, leftFace: 1, rightFace: 2, points: [[0, 0], [1, 0]] }),
  createTopologyArc({ id: 2, startNode: 2, endNode: 3, leftFace: 1, rightFace: 3, points: [[1, 0], [0.5, 1]] }),
  createTopologyArc({ id: 3, startNode: 3, endNode: 1, leftFace: 1, rightFace: 4, points: [[0.5, 1], [0, 0]] }),
  createTopologyArc({ id: 4, startNode: 1, endNode: 4, leftFace: 2, rightFace: 4, points: [[0, 0], [0.5, 0.35]] }),
  createTopologyArc({ id: 5, startNode: 4, endNode: 2, leftFace: 2, rightFace: 3, points: [[0.5, 0.35], [1, 0]] }),
  createTopologyArc({ id: 6, startNode: 3, endNode: 4, leftFace: 3, rightFace: 4, points: [[0.5, 1], [0.5, 0.35]] }),
];
const faces = [
  createTopologyFace({ id: 1, seedId: 101, outerArcIds: [1, 2, 3] }),
  createTopologyFace({ id: 2, seedId: 102, outerArcIds: [1, 5, 4] }),
  createTopologyFace({ id: 3, seedId: 103, outerArcIds: [2, 6, 5] }),
  createTopologyFace({ id: 4, seedId: 104, outerArcIds: [3, 4, 6] }),
];

const result = validatePlanarTopology({ nodes, arcs, faces }, { expectedComponents: 1 });
assert.equal(result.valid, true, result.errors.join("; "));
assert.deepEqual(result.metrics, { nodes: 4, arcs: 6, faces: 4, components: 1, eulerValue: 2, eulerExpected: 2 });

const malformed = validatePlanarTopology({
  nodes: [createTopologyNode({ id: 1, lon: 0, lat: 0, incidentArcs: [1] })],
  arcs: [createTopologyArc({ id: 1, startNode: 1, endNode: 99, leftFace: 1, rightFace: 1, points: [[0, 0], [1, 1]] })],
  faces: [],
});
assert.equal(malformed.valid, false);
assert.ok(malformed.errors.some((error) => error.includes("degree")));
assert.ok(malformed.errors.some((error) => error.includes("missing node")));

console.log("Planar topology invariant contracts passed.");
