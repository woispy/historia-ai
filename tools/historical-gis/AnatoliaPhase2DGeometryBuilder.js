import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";

const BBOX = [25.45, 35.72, 44.85, 42.35];
const EPSILON = 1e-8;
const COAST_GUARD_STEP = 0.34;
const LAKE_GUARD_STEP = 0.28;
const MIN_CELL_AREA = 0.00008;

function distanceSquared(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

function pointInPolygon(point, polygon) {
  let inside = false;
  const [x, y] = point;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index += 1) {
    const [xi, yi] = polygon[index];
    const [xj, yj] = polygon[previous];
    const intersects = yi > y !== yj > y
      && x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInLand(point) {
  return ANATOLIA_PHYSICAL_ATLAS.landPolygons.some((polygon) => pointInPolygon(point, polygon));
}

function pointInWater(point) {
  return ANATOLIA_PHYSICAL_ATLAS.seas.some((sea) => pointInPolygon(point, sea.coordinates))
    || ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => pointInPolygon(point, lake.coordinates));
}

function usableLandPoint(point) {
  return pointInLand(point) && !pointInWater(point);
}

function deterministicUnit(key) {
  let hash = 2166136261;
  const text = String(key);
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function nearestProvince(point, candidates = ANATOLIA_PROVINCE_METADATA) {
  let winner = candidates[0];
  let best = Number.POSITIVE_INFINITY;
  for (const province of candidates) {
    const distance = distanceSquared(point, province.centroid);
    if (distance < best) {
      best = distance;
      winner = province;
    }
  }
  return winner;
}

function addSite(sites, seen, point, provinceId, kind) {
  if (!Array.isArray(point) || point.length < 2) return;
  const rounded = `${Number(point[0]).toFixed(4)}:${Number(point[1]).toFixed(4)}:${provinceId ?? "barrier"}`;
  if (seen.has(rounded)) return;
  seen.add(rounded);
  sites.push({ point, provinceId, kind });
}

function addProvinceAnchors(sites, seen) {
  for (const province of ANATOLIA_PROVINCE_METADATA) {
    addSite(sites, seen, province.centroid, province.id, "historical-province-anchor");
  }
}

function addProvinceShapeControls(sites, seen) {
  for (const province of ANATOLIA_PROVINCE_METADATA) {
    // A deliberately sparse control field prevents the old Voronoi implementation
    // from creating artificial micro-provinces. Shape controls are stronger in
    // broad inland regions and weaker in the densely historical Aegean coast.
    const denseCoast = province.coastal && ["aegean-west", "mentese-caria", "mysia"].includes(province.regionId);
    const radius = denseCoast ? 0.16 : province.strategic ? 0.24 : 0.20;
    const count = denseCoast ? 2 : 4;
    for (let index = 0; index < count; index += 1) {
      const angle = deterministicUnit(`${province.id}:angle:${index}`) * Math.PI * 2;
      const scale = 0.78 + deterministicUnit(`${province.id}:radius:${index}`) * 0.32;
      const point = [
        province.centroid[0] + Math.cos(angle) * radius * scale,
        province.centroid[1] + Math.sin(angle) * radius * scale,
      ];
      if (usableLandPoint(point)) addSite(sites, seen, point, province.id, "historical-province-shape-control");
    }
  }
}

function addHistoricalSourceAnchors(sites, seen, sourceRegions) {
  for (const region of sourceRegions ?? []) {
    const polygon = region?.polygons?.find((candidate) => Array.isArray(candidate) && candidate.length >= 3);
    if (!polygon) continue;
    const center = polygon.reduce(
      (sum, [longitude, latitude]) => [sum[0] + longitude, sum[1] + latitude],
      [0, 0],
    );
    const point = [center[0] / polygon.length, center[1] / polygon.length];
    if (!usableLandPoint(point)) continue;
    const province = nearestProvince(point);
    addSite(sites, seen, point, province.id, "world-1300-historical-anchor");
  }
}

function addSampledCoastGuards(sites, seen) {
  const coastalProvinces = ANATOLIA_PROVINCE_METADATA.filter((province) => province.coastal);
  for (const polygon of ANATOLIA_PHYSICAL_ATLAS.landPolygons) {
    if (!Array.isArray(polygon) || polygon.length < 2) continue;
    for (let index = 0; index < polygon.length; index += 1) {
      const start = polygon[index];
      const end = polygon[(index + 1) % polygon.length];
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const length = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.max(1, Math.ceil(length / COAST_GUARD_STEP));
      for (let step = 0; step <= steps; step += 1) {
        const t = step / steps;
        const point = [start[0] + dx * t, start[1] + dy * t];
        const inward = [
          point[0] + (dy / (length || 1)) * 0.012,
          point[1] - (dx / (length || 1)) * 0.012,
        ];
        if (!usableLandPoint(inward)) continue;
        const province = nearestProvince(inward, coastalProvinces);
        addSite(sites, seen, inward, province.id, "coastline-control");
      }
    }
  }
}

function addLakeGuards(sites, seen) {
  for (const lake of ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes) {
    const polygon = lake?.coordinates;
    if (!Array.isArray(polygon) || polygon.length < 3) continue;
    for (let index = 0; index < polygon.length; index += 1) {
      const start = polygon[index];
      const end = polygon[(index + 1) % polygon.length];
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const length = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.max(1, Math.ceil(length / LAKE_GUARD_STEP));
      for (let step = 0; step <= steps; step += 1) {
        const t = step / steps;
        addSite(sites, seen, [start[0] + dx * t, start[1] + dy * t], null, "lake-barrier");
      }
    }
  }
}

function clipHalfPlane(polygon, a, b, c) {
  if (!polygon.length) return [];
  const output = [];
  const inside = (point) => a * point[0] + b * point[1] <= c + EPSILON;
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    const currentInside = inside(current);
    const nextInside = inside(next);
    if (currentInside && nextInside) {
      output.push(next);
      continue;
    }
    if (currentInside !== nextInside) {
      const currentValue = a * current[0] + b * current[1] - c;
      const nextValue = a * next[0] + b * next[1] - c;
      const denominator = currentValue - nextValue;
      const t = Math.abs(denominator) < EPSILON ? 0 : currentValue / denominator;
      output.push([
        current[0] + (next[0] - current[0]) * t,
        current[1] + (next[1] - current[1]) * t,
      ]);
    }
    if (!currentInside && nextInside) output.push(next);
  }
  return output;
}

function buildVoronoiCell(siteIndex, sites) {
  const site = sites[siteIndex].point;
  let polygon = [
    [BBOX[0], BBOX[1]],
    [BBOX[2], BBOX[1]],
    [BBOX[2], BBOX[3]],
    [BBOX[0], BBOX[3]],
  ];
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
  let areaTwice = 0;
  let longitude = 0;
  let latitude = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    const cross = current[0] * next[1] - next[0] * current[1];
    areaTwice += cross;
    longitude += (current[0] + next[0]) * cross;
    latitude += (current[1] + next[1]) * cross;
  }
  if (Math.abs(areaTwice) < EPSILON) return polygon[0];
  return [longitude / (3 * areaTwice), latitude / (3 * areaTwice)];
}

function roundPolygon(polygon) {
  return polygon.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]);
}

function createFallback(metadata) {
  const radius = 0.05;
  return roundPolygon(Array.from({ length: 8 }, (_, index) => {
    const angle = index / 8 * Math.PI * 2;
    return [
      metadata.centroid[0] + Math.cos(angle) * radius,
      metadata.centroid[1] + Math.sin(angle) * radius,
    ];
  }));
}

function createProvinceAsset(metadata, polygons) {
  return {
    header: {
      assetType: "province",
      assetVersion: 6,
      generator: "Historia AI Phase 2E Geographic-Historical Province Builder",
      provider: "historia-ai-curated-cartography",
      dataset: "anatolia-province-geometry-1300",
      historicalDate: "1300-01-01",
      borderPrecision: metadata.borderConfidence === "high" ? 3 : 2,
      sourceFeatureId: metadata.id,
      sourceFeatureIndex: null,
    },
    identity: { id: metadata.id, name: metadata.name },
    references: { geometryId: metadata.id, countryId: metadata.countryId, capitalCityId: metadata.cityId },
    ownership: {
      countryId: metadata.countryId,
      ownerId: metadata.historicalControl.controllerAt1300 ?? metadata.countryId,
    },
    historical: {
      sourceFeatureId: metadata.id,
      sourceFeatureIndex: null,
      sourceName: metadata.name,
      subject: metadata.countryId,
      partOf: metadata.regionId,
      borderPrecision: metadata.borderConfidence === "high" ? 3 : 2,
      classification: "phase2e-anatolia-geographic-historical-province",
      precision: "terrain-and-historical-anchor-weighted-cartography",
      anchor: metadata.centroid,
      historicalControl: metadata.historicalControl,
    },
    administration: { governorId: null },
    population: { total: 0 },
    economy: { development: 0, wealth: 0 },
    military: { supplyLimit: 0 },
    culture: { primaryCulture: null },
    religion: { primaryReligion: null },
    geometry: {
      coastal: metadata.coastal,
      port: metadata.port,
      terrain: metadata.terrain,
      strategic: metadata.strategic,
      historicalRegion: metadata.regionId,
    },
    polygons,
  };
}

function createGeometryAsset(metadata, polygons) {
  return {
    header: {
      assetType: "geometry",
      assetVersion: 6,
      generator: "Historia AI Phase 2E Geographic-Historical Province Builder",
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
      classification: "phase2e-anatolia-geographic-historical-province",
      precision: "terrain-and-historical-anchor-weighted-cartography",
    },
    polygons,
  };
}

export function buildAnatoliaPhase2DAssets(sourceRegions = []) {
  const sites = [];
  const seen = new Set();
  addProvinceAnchors(sites, seen);
  addProvinceShapeControls(sites, seen);
  addHistoricalSourceAnchors(sites, seen, sourceRegions);
  addSampledCoastGuards(sites, seen);
  addLakeGuards(sites, seen);

  const polygonsByProvince = Object.fromEntries(
    ANATOLIA_PROVINCE_METADATA.map((metadata) => [metadata.id, []]),
  );

  for (let siteIndex = 0; siteIndex < sites.length; siteIndex += 1) {
    const site = sites[siteIndex];
    if (!site.provinceId) continue;
    const cell = buildVoronoiCell(siteIndex, sites);
    if (cell.length < 3 || polygonArea(cell) < MIN_CELL_AREA) continue;
    const centroid = polygonCentroid(cell);
    if (!usableLandPoint(centroid)) continue;
    // Coast guards and historical anchors may touch the physical coastline, but
    // a province cell must never be allowed to become a sea polygon.
    const usableVertices = cell.filter((point) => usableLandPoint(point));
    if (usableVertices.length < 3) continue;
    polygonsByProvince[site.provinceId].push(roundPolygon(usableVertices.length === cell.length ? cell : usableVertices));
  }

  let fallbackCount = 0;
  const provinces = [];
  const geometries = [];
  for (const metadata of ANATOLIA_PROVINCE_METADATA) {
    let polygons = polygonsByProvince[metadata.id];
    if (!polygons.length) {
      polygons = [createFallback(metadata)];
      fallbackCount += 1;
    }
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
    method: "sparse historical anchors + geographic coast guards + internal-water barriers + deterministic Voronoi cartography",
    sourceBasis: {
      physical: "Natural Earth 10m coastline/lakes/rivers atlas used by the physical map pipeline",
      historical: "aourednik/historical-basemaps world_1300 plus curated 1300 province anchors",
      topographicIntent: "province controls follow coast, river-valley and highland/plateau anchors rather than modern administrative borders",
    },
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
  const [longitude, latitude] = point;
  if (longitude < 28.5) return latitude <= 40.78;
  if (longitude < 29.2) return latitude <= 40.88;
  return latitude <= 42.20;
}

export { usableLandPoint as isPhysicalLandPoint };
