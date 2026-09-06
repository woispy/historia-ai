import assert from "node:assert/strict";
import { AuthoritativeArcRegistry } from "../historical-gis/province/AuthoritativeArcGenerator.js";
import { assembleDirectedRing, assembleFaceRing } from "../historical-gis/province/FaceRingAssembler.js";
import { validatePlanarTopology, planarEulerCharacteristic } from "../historical-gis/province/PlanarTopology.js";

const registry = new AuthoritativeArcRegistry({ tolerance: 1e-6 });
const outside = "world";
const a = registry.register({ path: [{ lon: 0, lat: 0 }, { lon: 1, lat: 0 }], leftFace: "A", rightFace: outside });
const b = registry.register({ path: [{ lon: 1, lat: 0 }, { lon: 1, lat: 1 }], leftFace: "A", rightFace: outside });
const c = registry.register({ path: [{ lon: 1, lat: 1 }, { lon: 0, lat: 1 }], leftFace: "A", rightFace: outside });
const d = registry.register({ path: [{ lon: 0, lat: 1 }, { lon: 0, lat: 0 }], leftFace: "A", rightFace: outside });
const topology = registry.toTopology();
const face = assembleFaceRing(topology.arcs, { id: "A", outerRing: [a, b, c, d] });
assert.equal(face.outerRing.length, 4);
assert.equal(face.outerRing.every((entry) => entry.forward), true);

const wrong = [{ arcId: a.arc.id, forward: true }, { arcId: c.arc.id, forward: true }, { arcId: b.arc.id, forward: true }];
assert.throws(() => assembleDirectedRing(topology.arcs, wrong), /discontinuous/);

const reversed = registry.register({ path: [{ lon: 1, lat: 0 }, { lon: 0, lat: 0 }], leftFace: outside, rightFace: "A" });
assert.equal(reversed.arc.id, a.arc.id);
assert.equal(reversed.forward, false);

const full = { ...topology, faces: { A: face, world: { id: "world", outerRing: [
  { arcId: a.arc.id, forward: false }, { arcId: d.arc.id, forward: false },
  { arcId: c.arc.id, forward: false }, { arcId: b.arc.id, forward: false },
] } } };
const validation = validatePlanarTopology(full);
assert.equal(validation.valid, true, validation.errors.join("; "));
assert.equal(planarEulerCharacteristic(full), 2);
console.log("P3.9.1 authoritative directed face rings + PlanarTopology contracts: PASS");
