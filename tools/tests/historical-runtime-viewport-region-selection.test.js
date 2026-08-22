import assert from "node:assert/strict";
import { selectHistoricalRuntimeRegionsByBounds } from "../../src/world/map/loader/HistoricalRuntimeRegionSelector.js";

const manifest = {
  assetType: "historical-runtime-manifest",
  historicalDate: "1300-01-01",
  regions: [
    { id: "anatolia", file: "regions/anatolia.json", bounds: { minX: 25, minY: 35, maxX: 45, maxY: 45 } },
    { id: "balkans", file: "regions/balkans.json", bounds: { minX: 10, minY: 35, maxX: 30, maxY: 50 } },
    { id: "levant", file: "regions/levant.json", bounds: { minX: 30, minY: 25, maxX: 45, maxY: 35 } },
  ],
};

assert.deepEqual(
  selectHistoricalRuntimeRegionsByBounds({ ...manifest }, { minX: 31, minY: 38, maxX: 40, maxY: 42 }),
  ["anatolia"],
);

assert.deepEqual(
  selectHistoricalRuntimeRegionsByBounds(manifest, { minX: 20, minY: 36, maxX: 32, maxY: 42 }),
  ["anatolia", "balkans"],
);

// This viewport straddles the shared Y=35 boundary and therefore intersects
// all three fixture regions: Balkans, Levant, and Anatolia.
assert.deepEqual(
  selectHistoricalRuntimeRegionsByBounds(manifest, { minX: 30, minY: 34, maxX: 40, maxY: 36 }),
  ["anatolia", "balkans", "levant"],
);

// Reversed X/Y bounds are normalized by the shared spatial selector. The
// normalized viewport remains entirely below Anatolia's minY=35 boundary.
assert.deepEqual(
  selectHistoricalRuntimeRegionsByBounds(manifest, { minX: 44, minY: 34, maxX: 35, maxY: 28 }),
  ["levant"],
);

assert.deepEqual(
  selectHistoricalRuntimeRegionsByBounds(manifest, { minX: 0, minY: 0, maxX: 60, maxY: 60 }, 2),
  ["anatolia", "balkans"],
);

assert.deepEqual(
  selectHistoricalRuntimeRegionsByBounds(manifest, { minX: 60, minY: 60, maxX: 70, maxY: 70 }),
  [],
);

assert.throws(
  () => selectHistoricalRuntimeRegionsByBounds({ regions: [] }, { minX: 0, minY: 0, maxX: 1, maxY: 1 }, 0),
  /maxRegions/,
);

console.log("historical runtime viewport region selection: PASS");
