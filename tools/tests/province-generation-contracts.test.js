import assert from "node:assert/strict";
import {
  serializeProvinceSeeds,
  validateProvinceSeed,
  validateProvinceSeedSet,
} from "../historical-gis/province/ProvinceSeedModel.js";
import {
  createTopologyArc,
  createTopologyFace,
  createTopologyNode,
  planarEulerCharacteristic,
  validatePlanarTopology,
} from "../historical-gis/province/PlanarTopology.js";

const seed = validateProvinceSeed({
  id: "1842",
  identity: { key: "nicaea", name: "Nicaea", type: "province" },
  position: { lon: 29.7199, lat: 40.4286 },
  historical: {
    validFrom: 1299,
    sourceIds: ["byzantine_atlas_1300"],
    confidence: { existence: 0.98, location: 0.97, extent: 0.72, boundary: 0.44, ownership: 0.91 },
  },
  hierarchy: { parentId: "17", ancestry: ["2", "17", "1842"] },
  constraints: { boundaryMode: "soft", physical: { ridgeAffinity: 8 } },
});

assert.equal(seed.position.lon, 29.7199);
assert.equal(seed.historical.confidence.overall, 0.82);
assert.deepEqual(seed.historical.sourceIds, ["byzantine_atlas_1300"]);

const wrapped = validateProvinceSeed({
  ...seed,
  id: "1843",
  identity: { ...seed.identity, key: "wrapped" },
  position: { lon: 181, lat: 40 },
});
assert.equal(wrapped.position.lon, -179);
assert.throws(() => validateProvinceSeed({ ...seed, position: { lon: 10, lat: 91 } }));
assert.throws(() => validateProvinceSeedSet([seed, seed]));
assert.equal(typeof serializeProvinceSeeds([seed]), "string");

const nodes = {
  a: createTopologyNode({ id: "a", kind: "corner", position: { lon: 0, lat: 0 }, incidentArcs: ["ab", "ca"], incidentFaces: ["f", "outside"] }),
  b: createTopologyNode({ id: "b", kind: "corner", position: { lon: 1, lat: 0 }, incidentArcs: ["bc", "ab"], incidentFaces: ["f", "outside"] }),
  c: createTopologyNode({ id: "c", kind: "corner", position: { lon: 0, lat: 1 }, incidentArcs: ["ca", "bc"], incidentFaces: ["f", "outside"] }),
};
const arcs = {
  ab: createTopologyArc({ id: "ab", startNode: "a", endNode: "b", leftFace: "f", rightFace: "outside", geometry: [{ lon: 0, lat: 0 }, { lon: 1, lat: 0 }] }),
  bc: createTopologyArc({ id: "bc", startNode: "b", endNode: "c", leftFace: "f", rightFace: "outside", geometry: [{ lon: 1, lat: 0 }, { lon: 0, lat: 1 }] }),
  ca: createTopologyArc({ id: "ca", startNode: "c", endNode: "a", leftFace: "f", rightFace: "outside", geometry: [{ lon: 0, lat: 1 }, { lon: 0, lat: 0 }] }),
};
const faces = {
  f: createTopologyFace({ id: "f", seedId: "1842", outerRing: ["ab", "bc", "ca"] }),
  outside: createTopologyFace({ id: "outside", outerRing: [
    { arcId: "ca", forward: false },
    { arcId: "bc", forward: false },
    { arcId: "ab", forward: false },
  ] }),
};
const topology = { nodes, arcs, faces };

const valid = validatePlanarTopology(topology);
assert.equal(valid.valid, true, valid.errors.join("; "));
assert.equal(valid.componentCount, 1);
assert.equal(planarEulerCharacteristic(topology), 2);

const brokenRing = {
  ...topology,
  faces: { ...faces, f: { ...faces.f, outerRing: ["ab", "ca", "bc"] } },
};
assert.equal(validatePlanarTopology(brokenRing).valid, false);

const wrongIncidence = {
  ...topology,
  nodes: { ...nodes, a: { ...nodes.a, incidentFaces: ["f"] } },
};
assert.equal(validatePlanarTopology(wrongIncidence).valid, false);

const wrongDirection = {
  ...topology,
  faces: { ...faces, outside: { ...faces.outside, outerRing: [
    { arcId: "ca", forward: true },
    { arcId: "bc", forward: false },
    { arcId: "ab", forward: false },
  ] } },
};
assert.equal(validatePlanarTopology(wrongDirection).valid, false);

const orphanNode = {
  ...topology,
  nodes: { ...nodes, orphan: createTopologyNode({ id: "orphan", kind: "corner", position: { lon: 5, lat: 5 } }) },
};
assert.equal(validatePlanarTopology(orphanNode).valid, false);

console.log("Province generation contracts: PASS");
