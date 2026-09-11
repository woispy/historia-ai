import assert from "node:assert/strict";
import { ANATOLIA_PROVINCE_METADATA } from "../historical-gis/../src/map/data/AnatoliaProvinceMetadata.js";
import { ANATOLIA_PHYSICAL_ATLAS } from "../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { buildAnatoliaPhase2DAssets, isPhysicalLandPoint } from "../historical-gis/AnatoliaPhase2DGeometryBuilder.js";

const TARGET = "pontus-amisos";
const metadata = ANATOLIA_PROVINCE_METADATA.find((entry) => entry.id === TARGET);
assert.ok(metadata, `Missing ${TARGET} metadata`);

function area(polygon) {
  let sum = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
}
function absArea(polygon) { return Math.abs(area(polygon)); }
function edges(polygon) {
  return polygon.map((a, i) => {
    const b = polygon[(i + 1) % polygon.length];
    return Math.hypot(b[0] - a[0], b[1] - a[1]);
  });
}
function rounded(polygon) { return polygon.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]); }
function centroid(polygon) {
  return polygon.reduce((s, [x, y]) => [s[0] + x, s[1] + y], [0, 0]).map((v) => v / polygon.length);
}
function describe(label, polygon) {
  const e = edges(polygon);
  return {
    label,
    vertexCount: polygon.length,
    signedArea: area(polygon),
    area: absArea(polygon),
    minEdge: Math.min(...e),
    maxEdge: Math.max(...e),
    duplicateVertices: polygon.length - new Set(polygon.map(([x, y]) => `${x}:${y}`)).size,
    centroid: centroid(polygon),
    vertices: polygon,
  };
}

// Rebuild through the canonical public builder, then inspect the exact exported
// Amisos polygon. The builder intentionally exposes no internal raw cell, so
// this establishes the canonical exported representation while keeping the
// forensic branch production-neutral.
const result = buildAnatoliaPhase2DAssets([]);
const geometry = result.geometries.find((entry) => entry.identity?.provinceId === TARGET);
assert.ok(geometry, `Missing exported geometry for ${TARGET}`);
assert.ok(geometry.polygons.length > 0, `${TARGET} has no exported polygon`);

const stages = geometry.polygons.map((polygon, index) => ({
  index,
  exported: describe("exported", polygon),
  roundedAgain: describe("rounded-again", rounded(polygon)),
}));

const allPhysical = geometry.polygons.every((polygon) => polygon.every(isPhysicalLandPoint));

console.log(JSON.stringify({
  phase: "A2 — canonical Amisos stage trace",
  target: TARGET,
  metadataCentroid: metadata.centroid,
  atlasLandPolygonCount: ANATOLIA_PHYSICAL_ATLAS.landPolygons.length,
  runtimeLakeCount: ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.length,
  builder: {
    siteCount: result.siteCount,
    politicalSiteCount: result.politicalSiteCount,
    polygonCount: result.polygonCount,
    fallbackProvinceCount: result.fallbackProvinceCount,
  },
  polygonCount: geometry.polygons.length,
  allPhysical,
  stages,
}, null, 2));
