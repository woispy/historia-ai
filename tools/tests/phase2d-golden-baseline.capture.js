import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { buildAnatoliaPhase2DAssets } from "../historical-gis/AnatoliaPhase2DGeometryBuilder.js";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";

const OUTPUT = process.env.PHASE2D_GOLDEN_OUTPUT
  ?? "tools/tests/fixtures/phase2d/golden/phase2d-baseline.json";
const CANONICAL_BASE_REVISION = process.env.PHASE2D_CANONICAL_REVISION
  ?? "6b7424125eee4a1c72925b7a1780c68e695e9ba3";

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(canonicalize(value), null, 2) + "\n";
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function polygonArea(polygon) {
  let area = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    area += current[0] * next[1] - next[0] * current[1];
  }
  return Math.abs(area) / 2;
}

function bbox(polygon) {
  const xs = polygon.map(([x]) => x);
  const ys = polygon.map(([, y]) => y);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

function polygonMetrics(polygon) {
  return { vertexCount: polygon.length, area: polygonArea(polygon), bbox: bbox(polygon) };
}

function normalizeGeometry(geometry) {
  return {
    provinceId: geometry.identity.provinceId,
    polygonCount: geometry.polygons.length,
    polygons: geometry.polygons.map((polygon) => ({
      metrics: polygonMetrics(polygon),
      coordinates: polygon,
    })),
  };
}

function buildSnapshot(result) {
  const geometries = result.geometries
    .map(normalizeGeometry)
    .sort((left, right) => left.provinceId.localeCompare(right.provinceId));

  const physicalLandPoints = result.geometries.flatMap((geometry) =>
    geometry.polygons.flatMap((polygon) => polygon.map(([longitude, latitude]) => [longitude, latitude])),
  ).sort(([ax, ay], [bx, by]) => ax - bx || ay - by);

  const geometryPayload = stableJson(geometries);
  const physicalLandPayload = stableJson(physicalLandPoints);
  const semanticPayload = stableJson({
    historicalDate: result.historicalDate,
    provinceCount: result.provinceCount,
    polygonCount: result.polygonCount,
    siteCount: result.siteCount,
    politicalSiteCount: result.politicalSiteCount,
    barrierSiteCount: result.barrierSiteCount,
    fallbackProvinceCount: result.fallbackProvinceCount,
  });

  const waterLake = {
    seas: ANATOLIA_PHYSICAL_ATLAS.seas.map((sea) => ({
      id: sea.id ?? null,
      name: sea.name ?? null,
      coordinates: sea.coordinates,
    })),
    lakes: ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.map((lake) => ({
      id: lake.id ?? null,
      name: lake.name ?? null,
      coordinates: lake.coordinates,
    })),
  };
  const waterLakePayload = stableJson(waterLake);

  const topology = geometries.map(({ provinceId, polygonCount, polygons }) => ({
    provinceId,
    polygonCount,
    ringCount: polygonCount,
    vertexCount: polygons.reduce((sum, polygon) => sum + polygon.metrics.vertexCount, 0),
  }));
  const topologyPayload = stableJson(topology);

  return {
    schemaVersion: 1,
    fixtureType: "phase2d-canonical-golden-baseline",
    provenance: {
      builderModule: "tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js",
      invocation: "buildAnatoliaPhase2DAssets([])",
      canonicalBaseRevision: CANONICAL_BASE_REVISION,
      historicalDate: result.historicalDate,
      projection: result.projection,
      authorityMode: "current-canonical-observation-only",
    },
    semantic: {
      provinceCount: result.provinceCount,
      polygonCount: result.polygonCount,
      siteCount: result.siteCount,
      politicalSiteCount: result.politicalSiteCount,
      barrierSiteCount: result.barrierSiteCount,
      fallbackProvinceCount: result.fallbackProvinceCount,
      sha256: sha256(semanticPayload),
    },
    geometry: {
      provinceCount: geometries.length,
      provinces: geometries,
      sha256: sha256(geometryPayload),
    },
    physicalLand: {
      pointCount: physicalLandPoints.length,
      points: physicalLandPoints,
      sha256: sha256(physicalLandPayload),
    },
    waterLake: {
      seaCount: waterLake.seas.length,
      lakeCount: waterLake.lakes.length,
      seas: waterLake.seas,
      lakes: waterLake.lakes,
      sha256: sha256(waterLakePayload),
    },
    topology: {
      sha256: sha256(topologyPayload),
      provinces: topology,
    },
  };
}

const result = buildAnatoliaPhase2DAssets([]);
assert.equal(result.provinceCount, 38, "Golden capture requires the canonical 38-province dataset.");

const snapshot = buildSnapshot(result);
const serialized = stableJson(snapshot);

console.log(`Phase 2D golden baseline capture: ${snapshot.semantic.provinceCount} provinces`);
console.log(`Geometry SHA-256: ${snapshot.geometry.sha256}`);
console.log(`Physical-land SHA-256: ${snapshot.physicalLand.sha256}`);
console.log(`Water/lake SHA-256: ${snapshot.waterLake.sha256}`);
console.log(`Semantic SHA-256: ${snapshot.semantic.sha256}`);
console.log(`Topology SHA-256: ${snapshot.topology.sha256}`);
console.log(`Output: ${OUTPUT}`);

if (process.env.PHASE2D_WRITE_GOLDEN === "1") {
  const { mkdir, writeFile } = await import("node:fs/promises");
  const directory = OUTPUT.split("/").slice(0, -1).join("/");
  await mkdir(directory, { recursive: true });
  await writeFile(OUTPUT, serialized, "utf8");
  console.log("Golden baseline written because PHASE2D_WRITE_GOLDEN=1.");
} else {
  console.log("Read-only capture: no fixture written.");
}
