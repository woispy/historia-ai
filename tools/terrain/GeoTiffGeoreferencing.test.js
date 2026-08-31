import assert from "node:assert/strict";
import { resolveGeoTiffGeoreferencing, rasterPixelToWorld, rasterBoundsToWorld } from "./GeoTiffGeoreferencing.js";

const georeferencing = resolveGeoTiffGeoreferencing({
  pixelScale: [0.01, 0.01, 0],
  tiepoint: [0, 0, 0, 30, 40, 0],
  geoKeys: [1, 1, 0, 1, 1024, 0, 1, 2, 2048, 0, 1, 4326],
});
assert.equal(georeferencing.crs, "EPSG:4326");
assert.deepEqual(rasterPixelToWorld({ georeferencing, pixelX: 0, pixelY: 0 }), { x: 30, y: 40 });
assert.deepEqual(rasterPixelToWorld({ georeferencing, pixelX: 100, pixelY: 100 }), { x: 31, y: 39 });
assert.deepEqual(rasterBoundsToWorld({ georeferencing, width: 101, height: 101 }), { minX: 30, minY: 39, maxX: 31, maxY: 40 });
assert.throws(() => resolveGeoTiffGeoreferencing({ pixelScale: [0, 0], tiepoint: [0, 0, 0, 30, 40, 0], geoKeys: [1, 1, 0, 1, 1024, 0, 1, 2, 2048, 0, 1, 4326] }), /positive/);
assert.throws(() => resolveGeoTiffGeoreferencing({ pixelScale: [0.01, 0.01], tiepoint: [0, 0, 0, 30, 40, 0], geoKeys: [1, 1, 0, 1] }), /GeoKeyDirectory/);
assert.throws(() => resolveGeoTiffGeoreferencing({ pixelScale: [0.01, 0.01], tiepoint: [0, 0, 0, 30, 40, 0], geoKeys: [1, 1, 0, 1, 2048, 0, 1, 3857] }), /model type/);
console.log("Phase E GeoTIFF georeferencing: PASS");
