import assert from "node:assert/strict";
import { normalizeSpatialBounds, selectIntersectingSpatialRegions } from "../../src/map/spatial/SpatialRegionSelector.js";

const regions = [
  { id: "anatolia", bounds: { minX: 25, minY: 35, maxX: 45, maxY: 45 } },
  { id: "balkans", bounds: { minX: 15, minY: 35, maxX: 30, maxY: 50 } },
  { id: "north-africa", bounds: { minX: -15, minY: 15, maxX: 35, maxY: 38 } },
];

assert.deepEqual(normalizeSpatialBounds({ minX: 40, minY: 45, maxX: 25, maxY: 35 }), {
  minX: 25,
  minY: 35,
  maxX: 40,
  maxY: 45,
});
assert.deepEqual(selectIntersectingSpatialRegions(regions, { minX: 30, minY: 38, maxX: 40, maxY: 42 }), ["anatolia"]);
assert.deepEqual(selectIntersectingSpatialRegions(regions, { minX: 20, minY: 36, maxX: 32, maxY: 42 }), ["anatolia", "balkans", "north-africa"]);
assert.deepEqual(selectIntersectingSpatialRegions(regions, { minX: 40, minY: 45, maxX: 25, maxY: 35 }), ["anatolia", "balkans"]);
assert.deepEqual(selectIntersectingSpatialRegions(regions, { minX: 0, minY: 0, maxX: 60, maxY: 60 }, 2), ["anatolia", "balkans"]);
assert.deepEqual(selectIntersectingSpatialRegions(regions, { minX: 60, minY: 60, maxX: 70, maxY: 70 }), []);

assert.throws(() => selectIntersectingSpatialRegions(regions, { minX: 0, minY: 0, maxX: 1, maxY: 1 }, 0), /maxRegions/);
assert.throws(() => selectIntersectingSpatialRegions(regions, { minX: 0, minY: 0, maxX: 1, maxY: 1 }, 1.5), /maxRegions/);

console.log("shared spatial region selection: PASS");
