/** Historia AI — P3 Multi-Arc Graph Assembly + P4.2 stress contracts. */

import assert from "node:assert/strict";
import { CompositeCostGraph } from "../historical-gis/province/CompositeCostGraph.js";
import { LeastCostPathSolver } from "../historical-gis/province/LeastCostPathSolver.js";
import { AuthoritativeArcRegistry } from "../historical-gis/province/AuthoritativeArcGenerator.js";
import { assembleFaceRing } from "../historical-gis/province/FaceRingAssembler.js";
import { validatePlanarTopology, planarEulerCharacteristic } from "../historical-gis/province/PlanarTopology.js";

const BOUNDS = { minLon: 0, maxLon: 5, minLat: 0, maxLat: 3 };

function solveCorridor(nodeIds) {
  const allowed = new Set(nodeIds);
  const graph = new CompositeCostGraph({
    width: 5,
    height: 3,
    bounds: BOUNDS,
    sampleCell: () => ({ total: 1 }),
    blocked: (node) => !allowed.has(node.id),
  });
  const solver = new LeastCostPathSolver({ graph, minimumCost: 1 });
  return solver.solve({
    start: graph.nodeFromId(nodeIds[0]),
    end: graph.nodeFromId(nodeIds.at(-1)),
  });
}

function pathFor(nodeIds) {
  const result = solveCorridor(nodeIds);
  assert.ok(Array.isArray(result.path), `solver failed: ${result.reason ?? "unknown"}`);
  return result;
}

const registry = new AuthoritativeArcRegistry({ tolerance: 1e-9 });
const world = "world";

// Two adjacent faces, seven authoritative boundary arcs and two degree-3 junctions.
const bottomA = pathFor(["0,0", "1,0", "2,0"]);
const rightA = pathFor(["2,0", "2,1", "2,2"]);
const topA = pathFor(["2,2", "1,2", "0,2"]);
const leftA = pathFor(["0,2", "0,1", "0,0"]);
const bottomB = pathFor(["2,0", "3,0", "4,0"]);
const rightB = pathFor(["4,0", "4,1", "4,2"]);
const topB = pathFor(["4,2", "3,2", "2,2"]);

const aBottom = registry.register({ path: bottomA.path, leftFace: "A", rightFace: world, nodeKind: "corner" });
const aRight = registry.register({ path: rightA.path, leftFace: "A", rightFace: "B", nodeKind: "triple-point" });
const aTop = registry.register({ path: topA.path, leftFace: "A", rightFace: world, nodeKind: "corner" });
const aLeft = registry.register({ path: leftA.path, leftFace: "A", rightFace: world, nodeKind: "corner" });
const bBottom = registry.register({ path: bottomB.path, leftFace: "B", rightFace: world, nodeKind: "corner" });
const bRight = registry.register({ path: rightB.path, leftFace: "B", rightFace: world, nodeKind: "corner" });
const bSharedReverse = registry.register({
  path: [...rightA.path].reverse(),
  leftFace: "B",
  rightFace: "A",
  nodeKind: "triple-point",
});
const bTop = registry.register({ path: topB.path, leftFace: "B", rightFace: world, nodeKind: "corner" });

assert.equal(aRight.arc.id, bSharedReverse.arc.id, "shared boundary must reuse one authoritative Arc");
assert.equal(aRight.forward, true);
assert.equal(bSharedReverse.forward, false);
assert.equal(aRight.arc.leftFace, "A");
assert.equal(aRight.arc.rightFace, "B");

const topology = registry.toTopology();
const faceA = assembleFaceRing(topology.arcs, {
  id: "A",
  outerRing: [aBottom, aRight, aTop, aLeft],
});
const faceB = assembleFaceRing(topology.arcs, {
  id: "B",
  outerRing: [bBottom, bRight, bSharedReverse, bTop],
});

const full = {
  ...topology,
  faces: {
    A: faceA,
    B: faceB,
    world: {
      id: world,
      outerRing: [
        { arcId: aBottom.arc.id, forward: false },
        { arcId: aLeft.arc.id, forward: false },
        { arcId: aTop.arc.id, forward: false },
        { arcId: bTop.arc.id, forward: false },
        { arcId: bRight.arc.id, forward: false },
        { arcId: bBottom.arc.id, forward: false },
      ],
    },
  },
};

const junctions = Object.values(full.nodes).filter((node) => node.kind === "triple-point");
assert.equal(junctions.length, 2, "the shared boundary must create two canonical junction nodes");
assert.ok(junctions.every((node) => node.incidentArcs.length >= 3));
assert.ok(junctions.every((node) => node.incidentFaces.includes("A") && node.incidentFaces.includes("B")));

const validation = validatePlanarTopology(full);
assert.equal(validation.valid, true, validation.errors.join("; "));
assert.equal(validation.componentCount, 1);
assert.equal(planarEulerCharacteristic(full), 2);

// Mutation guard: a reverse path with unchanged face sides must be rejected.
assert.throws(() => registry.register({
  path: [...bottomA.path].reverse(),
  leftFace: "A",
  rightFace: world,
  nodeKind: "corner",
}), /unchanged face sides/);

console.log("P3 multi-solver Arc assembly + junction/shared-boundary + P4.2 invariants: PASS");
