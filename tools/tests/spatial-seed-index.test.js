import assert from "node:assert/strict";
import { SpatialHashSeedIndex, canonicalSeedLongitude } from "../historical-gis/province/SpatialSeedIndex.js";

const index = new SpatialHashSeedIndex({ cellSize: 5 });
const seeds = [
  { id: "west", position: { lon: -179.5, lat: 40 } },
  { id: "east", position: { lon: 179.5, lat: 40 } },
  { id: "center", position: { lon: 0, lat: 0 } },
];
for (const seed of seeds) index.insert(seed);

assert.equal(index.size, 3);
assert.equal(canonicalSeedLongitude(181), -179);
assert.equal(canonicalSeedLongitude(-181), 179);

// The canonical coordinate is identical at ±180, but an exact seam query
// preserves its requested side as the deterministic tie-break direction.
assert.deepEqual(index.queryRadius(180, 40, 1).map((seed) => seed.id), ["east", "west"]);
assert.deepEqual(index.queryRadius(-180, 40, 1).map((seed) => seed.id), ["west", "east"]);
assert.equal(index.nearest(180, 40)?.id, "east");
assert.equal(index.nearest(-180, 40)?.id, "west");

assert.deepEqual(index.queryBounds({ minLon: 179, maxLon: -179, minLat: 39, maxLat: 41 }).map((seed) => seed.id), ["east", "west"]);
assert.equal(index.nearest(179.8, 40)?.id, "east");
assert.equal(index.nearest(-179.8, 40)?.id, "west");
assert.equal(index.remove("center"), true);
assert.equal(index.remove("missing"), false);
assert.equal(index.size, 2);

const many = new SpatialHashSeedIndex({ cellSize: 2 });
for (let i = 0; i < 15000; i += 1) {
  const lon = -180 + ((i * 37) % 36000) / 100;
  const lat = -90 + ((i * 19) % 18000) / 100;
  many.insert({ id: String(i).padStart(5, "0"), position: { lon, lat } });
}
assert.equal(many.size, 15000);
assert.ok(many.queryRadius(179.9, 0, 1).every((seed) => Math.abs(seed.position.lon) >= 178.9 || seed.position.lon === 179));
console.log("Spatial seed index contracts: PASS");
