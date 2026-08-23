import assert from "node:assert/strict";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { pointInPolygon } from "../../src/map/rendering/physical/PhysicalGeometryValidation.js";

const point = [29.9169, 40.7654];
const polygonHits = ANATOLIA_PHYSICAL_ATLAS.landPolygons.map((polygon, index) => ({
  index,
  hit: pointInPolygon(point, polygon),
  minLon: Math.min(...polygon.map(([lon]) => lon)),
  maxLon: Math.max(...polygon.map(([lon]) => lon)),
  minLat: Math.min(...polygon.map(([, lat]) => lat)),
  maxLat: Math.max(...polygon.map(([, lat]) => lat)),
}));

console.log(JSON.stringify({ point, polygonHits }, null, 2));
assert.ok(polygonHits.some(({ hit }) => hit), "Nicomedia must lie inside one authoritative physical land polygon");
