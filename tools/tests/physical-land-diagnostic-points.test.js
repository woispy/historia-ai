import assert from "node:assert/strict";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { pointInPolygon } from "../../src/map/rendering/physical/PhysicalGeometryValidation.js";

const points = [
  { name: "Nicomedia", point: [29.9169, 40.7654] },
  { name: "Constantinople", point: [28.9784, 41.0082] },
  { name: "Nicaea", point: [29.7183, 40.4286] },
  { name: "Prusa", point: [29.0611, 40.1917] },
];

const diagnostics = points.map(({ name, point }) => {
  const polygonHits = ANATOLIA_PHYSICAL_ATLAS.landPolygons.map((polygon, index) => ({
    index,
    hit: pointInPolygon(point, polygon),
    minLon: Math.min(...polygon.map(([lon]) => lon)),
    maxLon: Math.max(...polygon.map(([lon]) => lon)),
    minLat: Math.min(...polygon.map(([, lat]) => lat)),
    maxLat: Math.max(...polygon.map(([, lat]) => lat)),
  }));
  return { name, point, polygonHits };
});

console.log(JSON.stringify(diagnostics, null, 2));
for (const diagnostic of diagnostics) {
  assert.ok(
    diagnostic.polygonHits.some(({ hit }) => hit),
    `${diagnostic.name} must lie inside one authoritative physical land polygon`,
  );
}
