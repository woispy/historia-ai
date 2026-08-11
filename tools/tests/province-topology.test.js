import assert from "node:assert/strict";
import { buildProvinceTopology, validateProvinceTopology } from "../../src/map/rendering/province/ProvinceTopology.js";

const makeProvince = (id, owner, polygons) => ({
  province: { id, owner },
  geometry: { id: `${id}-geometry`, polygons },
});

const provinces = [
  makeProvince("west", "alpha", [[[0, 0], [1, 0], [1, 1], [0, 1]]]),
  makeProvince("east", "beta", [[[1, 0], [2, 0], [2, 1], [1, 1]]]),
  makeProvince("south", "alpha", [[[0, -1], [1, -1], [1, 0], [0, 0]]]),
];

const topology = buildProvinceTopology(provinces);
const validation = validateProvinceTopology(topology);

assert.equal(validation.valid, true, validation.errors.join("\n"));
assert.deepEqual(topology.nodes.west.neighbors.sort(), ["east", "south"]);
assert.deepEqual(topology.nodes.east.neighbors, ["west"]);
assert.deepEqual(topology.nodes.south.neighbors, ["west"]);

const countryBorders = topology.borderSegments.filter((border) => border.kind === "country");
const provinceBorders = topology.borderSegments.filter((border) => border.kind === "province");

assert.equal(countryBorders.length, 1, "Different owners must create a country border.");
assert.equal(provinceBorders.length, 1, "Same owners must create a province border.");

const invalid = {
  nodes: {
    a: { id: "a", neighbors: ["a"] },
  },
  borderSegments: [],
};
assert.equal(validateProvinceTopology(invalid).valid, false);

console.log("Phase 2 province topology tests passed.");
