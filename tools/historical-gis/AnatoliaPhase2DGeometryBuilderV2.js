import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import {
  ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST,
  ANATOLIA_1300_PROVINCE_GEOMETRY_KEYS,
} from "../../src/map/data/Anatolia1300ProvinceGeometryManifest.js";
import {
  ANATOLIA_PROVINCE_REFINEMENTS,
  ANATOLIA_RIVER_CROSSINGS,
  ANATOLIA_STRATEGIC_PASSES,
} from "../../src/map/data/AnatoliaProvinceRefinement.js";

const BBOX = [25.45, 35.72, 44.85, 42.35];
const SITE_EPSILON = 1e-6;
const COAST_SAMPLE_STEP = 0.18;
const COASTAL_TOLERANCE = 0.06;
const NATURAL_FEATURE_OFFSET = 0.045;
const MIN_POLYGON_AREA = 0.00005;
const CONTROL_RADII = [0.12, 0.24, 0.38];
const CONTROL_DIRECTIONS = 12;

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

function pointInWaterEnvelope(point) {
  return ANATOLIA_PHYSICAL_ATLAS.seas.some((sea) => pointInPolygon(point, sea.coordinates))
    || ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => pointInPolygon(point, lake.coordinates));
}

function pointInAnatoliaLand(point) {
  return ANATOLIA_PHYSICAL_ATLAS.landPolygons.some((polygon) => pointInPolygon(point, polygon));
}

function pointToSegmentDistanceSquared(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  if (dx === 0 && dy === 0) return distanceSquared(point, start);
  const t = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy)));
  return distanceSquared(point, [start[0] + t * dx, start[1] + t * dy]);
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

function isPhysicalLandPoint(point) {
  return !pointInWaterEnvelope(point)
    && (pointInAnatoliaLand(point) || distanceToLandBoundary(point) <= COASTAL_TOLERANCE);
}

function isWithinAnatoliaEnvelope(point) {
  const [longitude, latitude] = point;
  if (longitude < 28.5) return latitude <= 40.78;
  if (longitude < 29.2) return latitude <= 40.88;
  return latitude <= 42.20;
}

function isPoliticalCartographicPoint(point) {
  return isWithinAnatoliaEnvelope(point) && isPhysicalLandPoint(point);
}

function deterministicJitter(index, seed = 1300) {
  const value = Math.sin((index * 92821 + seed * 68917) * 0.00017) * 43758.5453;
  return (value - Math.floor(value)) - 0.5;
}

function addSite(sites, seen, point, provinceId, kind) {
  if (!isPoliticalCartographicPoint(point)) return;
  const rounded = `${point[0].toFixed(4)}:${point[1].toFixed(4)}:${provinceId}:${kind}`;
  if (seen.has(rounded)) return;
  seen.add(rounded);
  sites.push({ point, provinceId, kind });
}

function getProvinceById(id) {
  return ANATOLIA_PROVINCE_METADATA.find((province) => province.id === id) ?? null;
}

function getRawCartographicAnchor(province) {
  return ANATOLIA_PROVINCE_REFINEMENTS[province.id]?.anchor ?? province.centroid;
}

function resolveLandAnchor(point) {
  if (isPhysicalLandPoint(point)) return point;
  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let longitudeOffset = -0.24; longitudeOffset <= 0.2401; longitudeOffset += 0.04) {
    for (let latitudeOffset = -0.24; latitudeOffset <= 0.2401; latitudeOffset += 0.04) {
      const candidate = [point[0] + longitudeOffset, point[1] + latitudeOffset];
      if (!isPhysicalLandPoint(candidate)) continue;
      const distance = distanceSquared(candidate, point);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = candidate;
      }
    }
  }
  return best ?? point;
}

function getCartographicAnchor(province) {
  return resolveLandAnchor(getRawCartographicAnchor(province));
}

function addAnchorSites(sites, seen) {
  for (const province of ANATOLIA_PROVINCE_METADATA) {
    addSite(sites, seen, getCartographicAnchor(province), province.id, "province-anchor");
  }
}

function addProvinceControlSites(sites, seen) {
  let sequence = 0;
  for (const province of ANATOLIA_PROVINCE_METADATA) {
    const anchor = getCartographicAnchor(province);
    for (const radius of CONTROL_RADII) {
      for (let direction = 0; direction < CONTROL_DIRECTIONS; direction += 1) {
        const angle = (direction / CONTROL_DIRECTIONS) * Math.PI * 2
          + deterministicJitter(sequence, anchor[0] * 100);
        const adjustedRadius = radius * (1 + deterministicJitter(sequence + 11, anchor[1] * 100) * 0.18);
        const point = [
          anchor[0] + Math.cos(angle) * adjustedRadius,
          anchor[1] + Math.sin(angle) * adjustedRadius,
        ];
        addSite(sites, seen, point, province.id, "province-control");
        sequence += 1;
      }
    }
  }
}

function addNaturalFeatureControlSites(sites, seen) {
  const features = [...ANATOLIA_STRATEGIC_PASSES, ...ANATOLIA_RIVER_CROSSINGS];
  for (const feature of features) {
    const provinces = feature.provinces.map(getProvinceById);
    if (provinces.some((province) => !province)) continue;
    for (const province of provinces) {
      const anchor = getCartographicAnchor(province);
      const dx = anchor[0] - feature.coordinate[0];
      const dy = anchor[1] - feature.coordinate[1];
      const length = Math.hypot(dx, dy);
      if (length < SITE_EPSILON) continue;
      const point = [
        feature.coordinate[0] + (dx / length) * NATURAL_FEATURE_OFFSET,
        feature.coordinate[1] + (dy / length) * NATURAL_FEATURE_OFFSET,
      ];
      addSite(sites, seen, point, province.id, `natural-feature:${feature.id}`);
    }
  }
}

function nearestProvinceId(point) {
  let winner = ANATOLIA_PROVINCE_METADATA[0];
  let best = Number.POSITIVE_INFINITY;
  for (const province of ANATOLIA_PROVINCE_METADATA) {
    const distance = distanceSquared(point, getCartographicAnchor(province));
    if (distance < best) {
      best = distance;
      winner = province;
    }
  }
  return winner.id;
}

function addCoastInteriorSites(sites, seen) {
  for (const polygon of ANATOLIA_PHYSICAL_ATLAS.landPolygons) {
    for (let index = 0; index < polygon.length - 1; index += 1) {
      const start = polygon[index];
      const end = polygon[index + 1];
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const edgeLength = Math.hypot(dx, dy) || 1;
      const steps = Math.max(1, Math.ceil(edgeLength / COAST_SAMPLE_STEP));
      const normal = [-dy / edgeLength, dx / edgeLength];
      for (let step = 0; step < steps; step += 1) {
        const t = (step + 0.5) / steps;
        const midpoint = [start[0] + dx * t, start[1] + dy * t];
        const candidates = [
          [midpoint[0] + normal[0] * 0.055, midpoint[1] + normal[1] * 0.055],
          [midpoint[0] - normal[0] * 0.055, midpoint[1] - normal[1] * 0.055],
        ];
        const inward = candidates.find((point) => isPoliticalCartographicPoint(point));
        if (inward) addSite(sites, seen, inward, nearestProvinceId(inward), "coastline-interior");
      }
    }
  }
}

function addSourceShapeSites(sites, seen, sourceRegions) {
  for (const region of sourceRegions ?? []) {
    const polygon = region?.polygons?.find((candidate) => Array.isArray(candidate) && candidate.length >= 3);
    if (!polygon) continue;
    const center = polygon.reduce((sum, [x, y]) => [sum[0] + x, sum[1] + y], [0, 0]);
    const point = [center[0] / polygon.length, center[1] / polygon.length];
    if (isPoliticalCartographicPoint(point)) addSite(sites, seen, point, nearestProvinceId(point), "historical-source-anchor");
  }
}

function validateGeometryManifest() {
  if (ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST.length !== ANATOLIA_PROVINCE_METADATA.length) {
    throw new Error(`Anatolia 1300 geometry manifest mismatch: ${ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST.length} manifest entries for ${ANATOLIA_PROVINCE_METADATA.length} province metadata entries.`);
  }
  const metadataIds = new Set(ANATOLIA_PROVINCE_METADATA.map(({ id }) => id));
  for (const entry of ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST) {
    if (!metadataIds.has(entry.id)) throw new Error(`Anatolia 1300 geometry manifest references unknown province: ${entry.id}`);
    if (!ANATOLIA_1300_PROVINCE_GEOMETRY_KEYS[entry.id]) throw new Error(`Anatolia 1300 geometry manifest has no stable source key: ${entry.id}`);
    if (entry.clipToPhysicalLand !== true) throw new Error(`Anatolia 1300 geometry must be clipped to physical land: ${entry.id}`);
  }
}

function clipHalfPlane(polygon, a, b, c) {
  if (!polygon.length) return [];
  const output = [];
  const inside = (point) => a * point[0] + b * point[1] <= c + SITE_EPSILON;
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    const currentInside = inside(current);
    const nextInside = inside(next);
    if (currentInside && nextInside) output.push(next);
    else if (currentInside !== nextInside) {
      const currentValue = a * current[0] + b * current[1] - c;
      const nextValue = a * next[0] + b * next[1] - c;
      const denominator = currentValue - nextValue;
      const t = Math.abs(denominator) < SITE_EPSILON ? 0 : currentValue / denominator;
      output.push([current[0] + (next[0] - current[0]) * t, current[1] + (next[1] - current[1]) * t]);
      if (!currentInside && nextInside) output.push(next);
    }
  }
  return output;
}

function buildVoronoiCell(siteIndex, sites) {
  const site = sites[siteIndex].point;
  let polygon = [[BBOX[0], BBOX[1]], [BBOX[2], BBOX[1]], [BBOX[2], BBOX[3]], [BBOX[0], BBOX[3]]];
  for (let otherIndex = 0; otherIndex < sites.length; otherIndex += 1) {
    if (siteIndex === otherIndex) continue;
    const other = sites[otherIndex].point;
    const a = 2 * (other[0] - site[0]);
    const b = 2 * (other[1] - site[1]);
    const c = other[0] ** 2 + other[1] ** 2 - site[0] ** 2 - site[1] ** 2;
    polygon = clipHalfPlane(polygon, a, b, c);
    if (polygon.length < 3) return [];
  }
  return polygon;
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

function polygonCentroid(polygon) {
  const sum = polygon.reduce((total, [longitude, latitude]) => [total[0] + longitude, total[1] + latitude], [0, 0]);
  return [sum[0] / polygon.length, sum[1] / polygon.length];
}

function projectPointToLand(point, anchor) {
  if (isPhysicalLandPoint(point)) return point;
  let candidate = point;
  for (let iteration = 0; iteration < 24; iteration += 1) {
    candidate = [candidate[0] * 0.62 + anchor[0] * 0.38, candidate[1] * 0.62 + anchor[1] * 0.38];
    if (isPhysicalLandPoint(candidate)) return candidate;
  }
  return null;
}

function clipCellToPhysicalLand(cell, anchor) {
  if (cell.length < 3 || !isPhysicalLandPoint(anchor)) return [];
  const projected = cell.map((point) => projectPointToLand(point, anchor));
  if (projected.some((point) => !point)) return [];
  if (!projected.some((point) => distanceSquared(point, anchor) < 0.0004)) projected.push(anchor);
  let result = projected;
  for (let iteration = 0; iteration < 12 && !isPhysicalLandPoint(polygonCentroid(result)); iteration += 1) {
    result = result.map((point) => [point[0] * 0.72 + anchor[0] * 0.28, point[1] * 0.72 + anchor[1] * 0.28]);
  }
  return isPhysicalLandPoint(polygonCentroid(result)) ? result : [];
}

function roundPolygon(polygon) {
  return polygon.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]);
}

function createProvinceAsset(metadata, polygons) {
  return {
    header: { assetType: "province", assetVersion: 5, generator: "Historia AI Phase 2D Geometry Builder", provider: "historia-ai-curated-cartography", dataset: "anatolia-province-geometry-1300", historicalDate: "1300-01-01", borderPrecision: metadata.borderConfidence === "high" ? 3 : 2, sourceFeatureId: metadata.id, sourceFeatureIndex: null },
    identity: { id: metadata.id, name: metadata.name },
    references: { geometryId: metadata.id, countryId: metadata.countryId, capitalCityId: metadata.cityId },
    ownership: { countryId: metadata.countryId, ownerId: metadata.historicalControl.controllerAt1300 ?? metadata.countryId },
    historical: { sourceFeatureId: metadata.id, sourceFeatureIndex: null, sourceName: metadata.name, subject: metadata.countryId, partOf: metadata.regionId, borderPrecision: metadata.borderConfidence === "high" ? 3 : 2, classification: "phase2d-anatolia-province-geometry", precision: "cartographic-refinement", anchor: getRawCartographicAnchor(metadata), historicalControl: metadata.historicalControl },
    administration: { governorId: null }, population: { total: 0 }, economy: { development: 0, wealth: 0 }, military: { supplyLimit: 0 }, culture: { primaryCulture: null }, religion: { primaryReligion: null },
    geometry: { coastal: metadata.coastal, port: metadata.port, terrain: metadata.terrain, strategic: metadata.strategic },
    polygons,
  };
}

function createGeometryAsset(metadata, polygons) {
  return {
    header: { assetType: "geometry", assetVersion: 5, generator: "Historia AI Phase 2D Geometry Builder", provider: "historia-ai-curated-cartography", dataset: "anatolia-province-geometry-1300", historicalDate: "1300-01-01", borderPrecision: metadata.borderConfidence === "high" ? 3 : 2, sourceFeatureId: metadata.id, sourceFeatureIndex: null },
    identity: { id: metadata.id, provinceId: metadata.id },
    metadata: { sourceFeatureId: metadata.id, sourceFeatureIndex: null, name: metadata.name, subject: metadata.countryId, partOf: metadata.regionId, borderPrecision: metadata.borderConfidence === "high" ? 3 : 2, classification: "phase2d-anatolia-province-geometry", precision: "cartographic-refinement", anchor: getRawCartographicAnchor(metadata) },
    polygons,
  };
}

export function buildAnatoliaPhase2DAssets(sourceRegions = []) {
  validateGeometryManifest();
  const sites = [];
  const seen = new Set();
  addAnchorSites(sites, seen);
  addProvinceControlSites(sites, seen);
  addNaturalFeatureControlSites(sites, seen);
  addCoastInteriorSites(sites, seen);
  addSourceShapeSites(sites, seen, sourceRegions);

  const polygonsByProvince = Object.fromEntries(ANATOLIA_PROVINCE_METADATA.map((metadata) => [metadata.id, []]));
  for (let siteIndex = 0; siteIndex < sites.length; siteIndex += 1) {
    const site = sites[siteIndex];
    const cell = buildVoronoiCell(siteIndex, sites);
    if (cell.length < 3 || polygonArea(cell) < MIN_POLYGON_AREA) continue;
    const metadata = getProvinceById(site.provinceId);
    const clipped = clipCellToPhysicalLand(cell, getCartographicAnchor(metadata));
    if (clipped.length >= 3 && polygonArea(clipped) >= MIN_POLYGON_AREA) polygonsByProvince[site.provinceId].push(roundPolygon(clipped));
  }

  const provinces = [];
  const geometries = [];
  for (const metadata of ANATOLIA_PROVINCE_METADATA) {
    const polygons = polygonsByProvince[metadata.id];
    if (!polygons.length) throw new Error(`Phase 2D produced no physical-land geometry for ${metadata.id}`);
    provinces.push(createProvinceAsset(metadata, polygons));
    geometries.push(createGeometryAsset(metadata, polygons));
  }

  return {
    schemaVersion: 1,
    geometryVersion: 4,
    historicalDate: "1300-01-01",
    provider: "historia-ai-curated-cartography",
    dataset: "anatolia-province-geometry-1300",
    projection: "EPSG:4326",
    method: "deterministic multi-site Voronoi cartography using historical anchors, dense land controls, natural-feature controls and coastline-interior controls, followed by physical-land clipping and water exclusion",
    siteCount: sites.length,
    politicalSiteCount: sites.length,
    barrierSiteCount: 0,
    naturalFeatureSiteCount: sites.filter((site) => site.kind.startsWith("natural-feature:")).length,
    fallbackProvinceCount: 0,
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