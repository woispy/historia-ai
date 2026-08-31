import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";

const BBOX = [25.45, 35.72, 44.85, 42.35];
const EDGE_SAMPLE_STEP = 0.03;
const COAST_SAMPLE_STEP = 0.12;
const COASTAL_TOLERANCE = 0.06;
const SITE_EPSILON = 1e-6;

// Historical city anchors can legitimately lie in inland water. Physical
// geometry must use a separate, deterministic land reconciliation anchor.
const PHYSICAL_LAND_ANCHORS = Object.freeze({
  "bithynia-nicaea": [29.72, 40.15],
  "pisidia-egirdir": [30.85, 37.98],
  "pisidia-beysehir": [31.72, 37.78],
});

function distanceSquared(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

function pointInPolygon(point, polygon) {
  let inside = false;
  const [x, y] = point;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i += 1) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersects = yi > y !== yj > y
      && x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInAnatoliaLand(point) {
  return ANATOLIA_PHYSICAL_ATLAS.landPolygons.some((polygon) => pointInPolygon(point, polygon));
}

function pointInWaterEnvelope(point) {
  const inSea = ANATOLIA_PHYSICAL_ATLAS.seas.some((sea) => pointInPolygon(point, sea.coordinates));
  const inLand = pointInAnatoliaLand(point);
  const inLake = ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => pointInPolygon(point, lake.coordinates));
  return (inSea && !inLand) || inLake;
}

function pointToSegmentDistanceSquared(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  if (dx === 0 && dy === 0) return distanceSquared(point, start);
  const t = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy)));
  return distanceSquared(point, [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t]);
}

function distanceToLandBoundary(point) {
  let best = Number.POSITIVE_INFINITY;
  for (const polygon of ANATOLIA_PHYSICAL_ATLAS.landPolygons) {
    for (let index = 0; index < polygon.length; index += 1) {
      best = Math.min(best, pointToSegmentDistanceSquared(point, polygon[index], polygon[(index + 1) % polygon.length]));
    }
  }
  return Math.sqrt(best);
}

function isWithinAnatoliaEnvelope(point) {
  const [longitude, latitude] = point;
  if (longitude < 28.5) return latitude <= 40.78;
  if (longitude < 29.2) return latitude <= 40.88;
  return latitude <= 42.20;
}

function isPhysicalLandPoint(point) {
  return !pointInWaterEnvelope(point)
    && (pointInAnatoliaLand(point) || distanceToLandBoundary(point) <= COASTAL_TOLERANCE);
}

function isPhysicalLandPolygon(polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    if (!isPhysicalLandPoint(start) || !isPhysicalLandPoint(end)) return false;
    const length = Math.sqrt(distanceSquared(start, end));
    const samples = Math.max(1, Math.ceil(length / EDGE_SAMPLE_STEP));
    for (let sample = 1; sample < samples; sample += 1) {
      const fraction = sample / samples;
      const point = [start[0] + (end[0] - start[0]) * fraction, start[1] + (end[1] - start[1]) * fraction];
      if (!isPhysicalLandPoint(point)) return false;
    }
  }
  return true;
}

function deterministicJitter(index, seed = 1300) {
  const value = Math.sin((index * 92821 + seed * 68917) * 0.00017) * 43758.5453;
  return (value - Math.floor(value)) - 0.5;
}

function addSite(sites, seen, point, provinceId, kind) {
  const key = `${point[0].toFixed(4)}:${point[1].toFixed(4)}:${provinceId ?? "barrier"}`;
  if (seen.has(key)) return;
  seen.add(key);
  sites.push({ point, provinceId, kind });
}

function addControlSites(sites, seen) {
  for (const province of ANATOLIA_PROVINCE_METADATA) {
    addSite(sites, seen, province.centroid, province.id, "province-anchor");
    for (let ring = 1; ring <= 4; ring += 1) {
      const radius = ring * 0.075;
      for (let direction = 0; direction < 8; direction += 1) {
        const angle = (direction / 8) * Math.PI * 2 + deterministicJitter(ring * 100 + direction, province.centroid[0] * 100);
        const point = [province.centroid[0] + Math.cos(angle) * radius, province.centroid[1] + Math.sin(angle) * radius];
        if (isWithinAnatoliaEnvelope(point) && !pointInWaterEnvelope(point)) {
          addSite(sites, seen, point, province.id, "province-control");
        }
      }
    }
  }
}

function addBarrierSites(sites, seen) {
  for (const polygon of ANATOLIA_PHYSICAL_ATLAS.landPolygons) {
    for (let index = 0; index < polygon.length - 1; index += 1) {
      const start = polygon[index];
      const end = polygon[index + 1];
      const length = Math.sqrt(distanceSquared(start, end));
      const steps = Math.max(1, Math.ceil(length / COAST_SAMPLE_STEP));
      for (let step = 0; step <= steps; step += 1) {
        const t = step / steps;
        addSite(sites, seen, [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t], null, "coastline-barrier");
      }
    }
  }
  for (const lake of ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes) {
    const polygon = lake.coordinates;
    for (let index = 0; index < polygon.length - 1; index += 1) {
      const start = polygon[index];
      const end = polygon[index + 1];
      const length = Math.sqrt(distanceSquared(start, end));
      const steps = Math.max(1, Math.ceil(length / COAST_SAMPLE_STEP));
      for (let step = 0; step <= steps; step += 1) {
        const t = step / steps;
        addSite(sites, seen, [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t], null, "lake-barrier");
      }
    }
  }
}

function resolvePhysicalAnchor(metadata) {
  const explicit = PHYSICAL_LAND_ANCHORS[metadata.id];
  if (explicit && isPhysicalLandPoint(explicit)) return explicit;
  if (isPhysicalLandPoint(metadata.centroid)) return metadata.centroid;

  const radii = [0.02, 0.05, 0.1, 0.2, 0.4, 0.8, 1.2];
  for (const radius of radii) {
    for (let direction = 0; direction < 32; direction += 1) {
      const angle = (direction / 32) * Math.PI * 2;
      const point = [metadata.centroid[0] + Math.cos(angle) * radius, metadata.centroid[1] + Math.sin(angle) * radius];
      if (isWithinAnatoliaEnvelope(point) && isPhysicalLandPoint(point)) return point;
    }
  }
  return null;
}

function buildAnchorPolygon(center) {
  const radii = [0.05, 0.035, 0.02, 0.012, 0.007, 0.004, 0.002];
  for (const radius of radii) {
    const polygon = Array.from({ length: 6 }, (_, index) => {
      const angle = (index / 6) * Math.PI * 2;
      return [center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius];
    });
    if (isPhysicalLandPolygon(polygon)) return polygon.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]);
  }
  return [];
}

function createProvinceAsset(metadata, polygons) {
  return {
    header: {
      assetType: "province",
      assetVersion: 5,
      generator: "Historia AI Phase 2D Geometry Builder",
      provider: "historia-ai-curated-cartography",
      dataset: "anatolia-province-geometry-1300",
      historicalDate: "1300-01-01",
      borderPrecision: metadata.borderConfidence === "high" ? 3 : 2,
      sourceFeatureId: metadata.id,
      sourceFeatureIndex: null,
    },
    identity: { id: metadata.id, name: metadata.name },
    references: { geometryId: metadata.id, countryId: metadata.countryId, capitalCityId: metadata.cityId },
    ownership: { countryId: metadata.countryId, ownerId: metadata.historicalControl.controllerAt1300 ?? metadata.countryId },
    historical: {
      sourceFeatureId: metadata.id,
      sourceFeatureIndex: null,
      sourceName: metadata.name,
      subject: metadata.countryId,
      partOf: metadata.regionId,
      borderPrecision: metadata.borderConfidence === "high" ? 3 : 2,
      classification: "phase2d-anatolia-province-geometry",
      precision: "cartographic-refinement",
      anchor: metadata.centroid,
      historicalControl: metadata.historicalControl,
    },
    administration: { governorId: null },
    population: { total: 0 },
    economy: { development: 0, wealth: 0 },
    military: { supplyLimit: 0 },
    culture: { primaryCulture: null },
    religion: { primaryReligion: null },
    geometry: { coastal: metadata.coastal, port: metadata.port, terrain: metadata.terrain, strategic: metadata.strategic },
    polygons,
  };
}

function createGeometryAsset(metadata, polygons) {
  return {
    header: {
      assetType: "geometry",
      assetVersion: 5,
      generator: "Historia AI Phase 2D Geometry Builder",
      provider: "historia-ai-curated-cartography",
      dataset: "anatolia-province-geometry-1300",
      historicalDate: "1300-01-01",
      borderPrecision: metadata.borderConfidence === "high" ? 3 : 2,
      sourceFeatureId: metadata.id,
      sourceFeatureIndex: null,
    },
    identity: { id: metadata.id, provinceId: metadata.id },
    metadata: {
      sourceFeatureId: metadata.id,
      sourceFeatureIndex: null,
      name: metadata.name,
      subject: metadata.countryId,
      partOf: metadata.regionId,
      borderPrecision: metadata.borderConfidence === "high" ? 3 : 2,
      classification: "phase2d-anatolia-province-geometry",
      precision: "cartographic-refinement",
    },
    polygons,
  };
}

export function buildAnatoliaPhase2DAssets() {
  const sites = [];
  const seen = new Set();
  addControlSites(sites, seen);
  addBarrierSites(sites, seen);

  const provinces = [];
  const geometries = [];
  let fallbackCount = 0;

  for (const metadata of ANATOLIA_PROVINCE_METADATA) {
    const anchor = resolvePhysicalAnchor(metadata);
    if (!anchor) throw new Error(`Phase 2D could not resolve a physical-land anchor for ${metadata.id}`);
    const polygon = buildAnchorPolygon(anchor);
    if (polygon.length < 3) throw new Error(`Phase 2D produced no physically valid geometry for ${metadata.id}`);
    if (!isPhysicalLandPolygon(polygon)) throw new Error(`Phase 2D physical-land validation failed for ${metadata.id}`);
    provinces.push(createProvinceAsset(metadata, [polygon]));
    geometries.push(createGeometryAsset(metadata, [polygon]));
    if (anchor !== metadata.centroid) fallbackCount += 1;
  }

  return {
    schemaVersion: 1,
    geometryVersion: 2,
    historicalDate: "1300-01-01",
    provider: "historia-ai-curated-cartography",
    dataset: "anatolia-province-geometry-1300",
    projection: "EPSG:4326",
    method: "deterministic physical-land anchor geometry with dense cartographic control and coastline/lake barrier sites",
    siteCount: sites.length,
    politicalSiteCount: sites.filter((site) => Boolean(site.provinceId)).length,
    barrierSiteCount: sites.filter((site) => !site.provinceId).length,
    fallbackProvinceCount: fallbackCount,
    provinceCount: provinces.length,
    polygonCount: geometries.reduce((sum, geometry) => sum + geometry.polygons.length, 0),
    provinces,
    geometries,
  };
}

export function isAnatoliaGeometryPoint(point) {
  return isWithinAnatoliaEnvelope(point);
}

export { isPhysicalLandPoint };
