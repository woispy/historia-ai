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

assert.deepEqual(
  selectHistoricalRuntimeRegionsByBounds(manifest, { minX: 44, minY: 34, maxX: 35, maxY: 28 }),
  ["anatolia", "levant"],
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
