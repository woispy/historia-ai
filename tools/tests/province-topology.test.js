import assert from "node:assert/strict";
import { buildProvinceTopology, validateProvinceTopology } from "../../src/map/rendering/province/ProvinceTopology.js";

const makeProvince = (id, owner, polygons, historicalPolitical = null) => ({
  province: { id, owner },
  geometry: { id: `${id}-geometry`, polygons },
  historicalPolitical,
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

const historicalTopology = buildProvinceTopology([
  makeProvince("byzantine", "modern-a", [[[3, 0], [4, 0], [4, 1], [3, 1]]], { id: "byzantium" }),
  makeProvince("ottoman", "modern-b", [[[4, 0], [5, 0], [5, 1], [4, 1]]], { id: "ottomans" }),
  makeProvince("legacy-owner", "modern-b", [[[5, 0], [6, 0], [6, 1], [5, 1]]], { id: "ottomans" }),
]);

const historicalCountryBorders = historicalTopology.borderSegments.filter((border) => border.kind === "country");
const historicalProvinceBorders = historicalTopology.borderSegments.filter((border) => border.kind === "province");

assert.equal(historicalCountryBorders.length, 1, "Historical polity identities must drive political country borders.");
assert.equal(historicalProvinceBorders.length, 1, "Matching historical polity identities must remain province borders even when modern owners differ.");
assert.equal(historicalTopology.nodes.byzantine.ownerId, "byzantium");
assert.equal(historicalTopology.nodes.ottoman.ownerId, "ottomans");

const invalid = {
  nodes: {
    a: { id: "a", neighbors: ["a"] },
  },
  borderSegments: [],
};
assert.equal(validateProvinceTopology(invalid).valid, false);

console.log("Phase 2 province topology tests passed with historical political border classification.");
