import assert from "node:assert/strict";
import {
  buildWorldPath,
  collectWorldLandPolygons,
  isPhysicalLandGeometry,
  normalizeGeometryModule,
} from "../../src/map/physical/WorldLandMask.js";

const mockModules = {
  turkey: {
    default: {
      id: "geometry_country_tur",
      name: "Turkey",
      polygons: [[[26, 36], [27, 36], [27, 37], [26, 36]]],
    },
  },
  greece: {
    default: {
      id: "geometry_country_grc",
      name: "Greece",
      polygons: [[[20, 35], [21, 35], [21, 36], [20, 35]]],
    },
  },
  antarctica: {
    default: {
      id: "geometry_country_ata",
      name: "Antarctica",
      polygons: [[[0, -90], [1, -90], [1, -89], [0, -90]]],
    },
  },
  invalid: { default: { id: "not-geometry" } },
};

assert.equal(normalizeGeometryModule(mockModules.turkey).name, "Turkey");
assert.equal(isPhysicalLandGeometry(mockModules.turkey.default), true);
assert.equal(isPhysicalLandGeometry(mockModules.antarctica.default), false);
assert.equal(isPhysicalLandGeometry(mockModules.invalid.default), false);

const polygons = collectWorldLandPolygons(mockModules);
assert.equal(polygons.length, 2, "Only physical non-Antarctic land polygons should be collected.");
assert.deepEqual(polygons[0][0], [26, 36]);
assert.deepEqual(polygons[1][0], [20, 35]);

const path = buildWorldPath(polygons);
assert.ok(path.startsWith("M 26 36"));
assert.ok(path.includes("M 20 35"));
assert.equal((path.match(/Z/g) ?? []).length, 2, "Each land polygon must close in the SVG path.");

const malformed = collectWorldLandPolygons({
  malformed: { id: "geometry_country_x", polygons: [[[0, 0], [1, 1]]] },
});
assert.equal(malformed.length, 0, "Malformed polygons must never become physical land.");

console.log("World physical land-mask tests passed.");
