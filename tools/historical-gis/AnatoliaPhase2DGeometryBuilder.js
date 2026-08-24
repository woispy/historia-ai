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
const COAST_SAMPLE_STEP = 0.12;
const COASTAL_TOLERANCE = 0.06;
const NATURAL_FEATURE_OFFSET = 0.045;
const MIN_POLYGON_AREA = 0.00005;

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
      const distance = pointToSegmentDistanceSquared(point, polygon[index], polygon[(index + 1) % polygon.length]);
      if (distance < best) best = distance;
    }
  }
  return Math.sqrt(best);
}

function pointInAnatoliaLand(point) {
  return ANATOLIA_PHYSICAL_ATLAS.landPolygons.some((polygon) => pointInPolygon(point, polygon));
}

function isWithinAnatoliaEnvelope(point) {
  const [longitude, latitude] = point;
  if (longitude < 28.5) return latitude <= 40.78;
  if (longitude < 29.2) return latitude <= 40.88;
  return latitude <= 42.20;
}

function isPoliticalCartographicPoint(point) {
  return isWithinAnatoliaEnvelope(point) && !pointInWaterEnvelope(point);
}

function isPhysicalLandPoint(point) {
  return !pointInWaterEnvelope(point)
    && (pointInAnatoliaLand(point) || distanceToLandBoundary(point) <= COASTAL_TOLERANCE);
}

function deterministicJitter(index, seed = 1300) {
  const value = Math.sin((index * 92821 + seed * 68917) * 0.00017) * 43758.5453;
  return (value - Math.floor(value)) - 0.5;
}

function addSite(sites, seen, point, provinceId, kind) {
  const rounded = `${point[0].toFixed(4)}:${point[1].toFixed(4)}:${provinceId}`;
  if (seen.has(rounded)) return;
  seen.add(rounded);
  sites.push({ point, provinceId, kind });
}

function getCartographicAnchor(province) {
  return ANATOLIA_PROVINCE_REFINEMENTS[province.id]?.anchor ?? province.centroid;
}

function getProvinceById(id) {
  return ANATOLIA_PROVINCE_METADATA.find((province) => province.id === id) ?? null;
}

function addAnchorSites(sites, seen) {
  for (const province of ANATOLIA_PROVINCE_METADATA) {
    addSite(sites, seen, getCartographicAnchor(province), province.id, "province-anchor");
  }
}

function addProvinceMicroSites(sites, seen) {
  const radii = [0.04, 0.08, 0.12];
  const directions = 8;
  let sequence = 0;
  for (const province of ANATOLIA_PROVINCE_METADATA) {
    const anchor = getCartographicAnchor(province);
    for (const radius of radii) {
      for (let direction = 0; direction < directions; direction += 1) {
        const angle = (direction / directions) * Math.PI * 2 + deterministicJitter(sequence, anchor[0] * 100);
        const point = [anchor[0] + Math.cos(angle) * radius, anchor[1] + Math.sin(angle) * radius];
        if (isPoliticalCartographicPoint(point)) addSite(sites, seen, point, province.id, "province-micro-control");
        sequence += 1;
      }
    }
  }
}

function addProvinceShapeSites(sites, seen) {
  const radii = [0.12, 0.24, 0.38];
  const directions = 12;
  let sequence = 0;
  for (const province of ANATOLIA_PROVINCE_METADATA) {
    const anchor = getCartographicAnchor(province);
    for (const radiusBase of radii) {
      for (let direction = 0; direction < directions; direction += 1) {
        const angle = (direction / directions) * Math.PI * 2 + deterministicJitter(sequence, anchor[0] * 100);
        const radius = radiusBase * (1 + deterministicJitter(sequence + 11, anchor[1] * 100) * 0.18);
        const point = [anchor[0] + Math.cos(angle) * radius, anchor[1] + Math.sin(angle) * radius];
        if (isPoliticalCartographicPoint(point)) addSite(sites, seen, point, province.id, "province-shape-control");
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
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length < SITE_EPSILON) continue;
      const point = [
        feature.coordinate[0] + (dx / length) * NATURAL_FEATURE_OFFSET,
        feature.coordinate[1] + (dy / length) * NATURAL_FEATURE_OFFSET,
      ];
      if (isPoliticalCartographicPoint(point)) addSite(sites, seen, point, province.id, `natural-feature:${feature.id}`);
    }
  }
}

function addCoastInteriorSites(sites, seen) {
  for (const polygon of ANATOLIA_PHYSICAL_ATLAS.landPolygons) {
    for (let index = 0; index < polygon.length - 1; index += 1) {
      const start = polygon[index];
      const end = polygon[index + 1];
      const length = Math.sqrt(distanceSquared(start, end));
      const steps = Math.max(1, Math.ceil(length / COAST_SAMPLE_STEP));
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const edgeLength = Math.sqrt(dx * dx + dy * dy) || 1;
      const left = [-dy / edgeLength, dx / edgeLength];
      for (let step = 0; step < steps; step += 1) {
        const t = (step + 0.5) / steps;
        const midpoint = [start[0] + dx * t, start[1] + dy * t];
        const candidates = [
          [midpoint[0] + left[0] * 0.045, midpoint[1] + left[1] * 0.045],
          [midpoint[0] - left[0] * 0.045, midpoint[1] - left[1] * 0.045],
        ];
        const inward = candidates.find((point) => pointInAnatoliaLand(point));
        if (inward && isPoliticalCartographicPoint(inward)) {
          addSite(sites, seen, inward, nearestProvinceId(inward), "coastline-interior");
        }
      }
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
    if (currentInside && nextInside) {
      output.push(next);
    } else if (currentInside !== nextInside) {
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

function roundPolygon(polygon) {
  return polygon.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]);
}

function projectPointToLand(point, centroid) {
  if (isPhysicalLandPoint(point)) return point;
  let candidate = point;
  for (let iteration = 0; iteration < 12 && !isPhysicalLandPoint(candidate); iteration += 1) {
    candidate = [candidate[0] * 0.65 + centroid[0] * 0.35, candidate[1] * 0.65 + centroid[1] * 0.35];
  }
  return isPhysicalLandPoint(candidate) ? candidate : null;
}

function clipCellToPhysicalLand(cell) {
  if (cell.length < 3) return [];
  const centroid = polygonCentroid(cell);
  if (!isPhysicalLandPoint(centroid)) return [];
  const projected = cell.map((point) => projectPointToLand(point, centroid));
  if (projected.some((point) => !point)) return [];
  return projected;
}

function createProvinceAsset(metadata, polygons) {
  return {
    header: { assetType: "province", assetVersion: 5, generator: "Historia AI Phase 2D Geometry Builder", provider: "historia-ai-curated-cartography", dataset: "anatolia-province-geometry-1300", historicalDate: "1300-01-01", borderPrecision: metadata.borderConfidence === "high" ? 3 : 2, sourceFeatureId: metadata.id, sourceFeatureIndex: null },
    identity: { id: metadata.id, name: metadata.name },
    references: { geometryId: metadata.id, countryId: metadata.countryId, capitalCityId: metadata.cityId },
    ownership: { countryId: metadata.countryId, ownerId: metadata.historicalControl.controllerAt1300 ?? metadata.countryId },
    historical: { sourceFeatureId: metadata.id, sourceFeatureIndex: null, sourceName: metadata.name, subject: metadata.countryId, partOf: metadata.regionId, borderPrecision: metadata.borderConfidence === "high" ? 3 : 2, classification: "phase2d-anatolia-province-geometry", precision: "cartographic-refinement", anchor: getCartographicAnchor(metadata), historicalControl: metadata.historicalControl },
    administration: { governorId: null }, population: { total: 0 }, economy: { development: 0, wealth: 0 }, military: { supplyLimit: 0 }, culture: { primaryCulture: null }, religion: { primaryReligion: null },
    geometry: { coastal: metadata.coastal, port: metadata.port, terrain: metadata.terrain, strategic: metadata.strategic },
    polygons,
  };
}

function createGeometryAsset(metadata, polygons) {
  return {
    header: { assetType: "geometry", assetVersion: 5, generator: "Historia AI Phase 2D Geometry Builder", provider: "historia-ai-curated-cartography", dataset: "anatolia-province-geometry-1300", historicalDate: "1300-01-01", borderPrecision: metadata.borderConfidence === "high" ? 3 : 2, sourceFeatureId: metadata.id, sourceFeatureIndex: null },
    identity: { id: metadata.id, provinceId: metadata.id },
    metadata: { sourceFeatureId: metadata.id, sourceFeatureIndex: null, name: metadata.name, subject: metadata.countryId, partOf: metadata.regionId, borderPrecision: metadata.borderConfidence === "high" ? 3 : 2, classification: "phase2d-anatolia-province-geometry", precision: "cartographic-refinement", anchor: getCartographicAnchor(metadata) },
    polygons,
  };
}

export function buildAnatoliaPhase2DAssets() {
  validateGeometryManifest();
  const sites = [];
  const seen = new Set();
  addAnchorSites(sites, seen);
  addProvinceMicroSites(sites, seen);
  addProvinceShapeSites(sites, seen);
  addNaturalFeatureControlSites(sites, seen);
  addCoastInteriorSites(sites, seen);

  const polygonsByProvince = Object.fromEntries(ANATOLIA_PROVINCE_METADATA.map((metadata) => [metadata.id, []]));
  for (let siteIndex = 0; siteIndex < sites.length; siteIndex += 1) {
    const site = sites[siteIndex];
    const cell = buildVoronoiCell(siteIndex, sites);
    if (!site.provinceId || cell.length < 3 || polygonArea(cell) < MIN_POLYGON_AREA) continue;
    const clipped = clipCellToPhysicalLand(cell);
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
    geometryVersion: 3,
    historicalDate: "1300-01-01",
    provider: "historia-ai-curated-cartography",
    dataset: "anatolia-province-geometry-1300",
    projection: "EPSG:4326",
    method: "deterministic multi-site Voronoi cartography with historical anchors and natural-feature controls, followed by physical-land clipping and water exclusion",
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