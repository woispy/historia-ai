import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";

const BBOX = [25.45, 35.72, 44.85, 42.35];
const EPSILON = 1e-8;
const DIAGNOSTIC_GRID_STEP = 0.12;
const COAST_GUARD_STEP = 0.34;
const MIN_CELL_AREA = 0.00008;
const HISTORICAL_BLEND = 0.24;
const RIVER_BLEND = 0.12;

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
    || ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => (
      Array.isArray(lake.rings)
        ? lake.rings.some((ring) => pointInPolygon(point, ring))
        : pointInPolygon(point, lake.coordinates)
    ));
}

function usableLandPoint(point) {
  return pointInLand(point) && !pointInWater(point);
}

function nearestLinePoint(point, lines, maxDistance = Number.POSITIVE_INFINITY) {
  let best = null;
  let bestDistance = maxDistance * maxDistance;
  for (const line of lines ?? []) {
    const coordinates = line?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) continue;
    for (let index = 0; index < coordinates.length - 1; index += 1) {
      const start = coordinates[index];
      const end = coordinates[index + 1];
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const lengthSquared = dx * dx + dy * dy;
      const t = lengthSquared === 0
        ? 0
        : Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / lengthSquared));
      const projected = [start[0] + dx * t, start[1] + dy * t];
      const distance = distanceSquared(point, projected);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = projected;
      }
    }
  }
  return best;
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
  if (point[0] < BBOX[0] || point[0] > BBOX[2] || point[1] < BBOX[1] || point[1] > BBOX[3]) return;
  const rounded = `${Number(point[0]).toFixed(4)}:${Number(point[1]).toFixed(4)}:${provinceId ?? "barrier"}:${kind}`;
  if (seen.has(rounded)) return;
  seen.add(rounded);
  const metadata = provinceId ? ANATOLIA_PROVINCE_METADATA.find((province) => province.id === provinceId) : null;
  sites.push({ point, provinceId, kind, weight: metadata?.cartographicWeight ?? 0 });
}

function addDiagnosticLandField(sites, seen) {
  for (let longitude = BBOX[0]; longitude <= BBOX[2] + EPSILON; longitude += DIAGNOSTIC_GRID_STEP) {
    for (let latitude = BBOX[1]; latitude <= BBOX[3] + EPSILON; latitude += DIAGNOSTIC_GRID_STEP) {
      addSite(sites, seen, [Number(longitude.toFixed(5)), Number(latitude.toFixed(5))], null, "diagnostic-cartographic-grid");
    }
  }
}

function addPhysicalBarrierField(sites, seen) {
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
        addSite(sites, seen, [start[0] + dx * t, start[1] + dy * t], null, "coastline-barrier");
      }
    }
  }
  for (const lake of ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes) {
    for (const ring of lake.rings ?? [lake.coordinates]) {
      if (!Array.isArray(ring) || ring.length < 2) continue;
      const stride = Math.max(1, Math.floor(ring.length / 12));
      for (let index = 0; index < ring.length; index += stride) addSite(sites, seen, ring[index], null, "lake-barrier");
    }
  }
}

function collectHistoricalAnchors(sourceRegions) {
  const anchors = new Map(ANATOLIA_PROVINCE_METADATA.map((province) => [province.id, []]));
  for (const region of sourceRegions ?? []) {
    const polygon = region?.polygons?.find((candidate) => Array.isArray(candidate) && candidate.length >= 3);
    if (!polygon) continue;
    const center = polygon.reduce((sum, [longitude, latitude]) => [sum[0] + longitude, sum[1] + latitude], [0, 0]);
    const point = [center[0] / polygon.length, center[1] / polygon.length];
    if (!usableLandPoint(point)) continue;
    anchors.get(nearestProvince(point).id)?.push(point);
  }
  return anchors;
}

function averagedPoint(points) {
  if (!points.length) return null;
  const sum = points.reduce((total, point) => [total[0] + point[0], total[1] + point[1]], [0, 0]);
  return [sum[0] / points.length, sum[1] / points.length];
}

function buildProvinceAnchor(metadata, historicalAnchors) {
  let point = [...metadata.centroid];
  const historical = averagedPoint(historicalAnchors.get(metadata.id) ?? []);
  if (historical && usableLandPoint(historical)) {
    point = [point[0] * (1 - HISTORICAL_BLEND) + historical[0] * HISTORICAL_BLEND, point[1] * (1 - HISTORICAL_BLEND) + historical[1] * HISTORICAL_BLEND];
  }
  if (metadata.terrain === "river-valley") {
    const riverPoint = nearestLinePoint(point, ANATOLIA_PHYSICAL_ATLAS_RUNTIME.rivers, 1.6);
    if (riverPoint && usableLandPoint(riverPoint)) {
      point = [point[0] * (1 - RIVER_BLEND) + riverPoint[0] * RIVER_BLEND, point[1] * (1 - RIVER_BLEND) + riverPoint[1] * RIVER_BLEND];
    }
  }
  return usableLandPoint(point) ? point : metadata.centroid;
}

function buildPoliticalSites(sites, seen, sourceRegions) {
  const historicalAnchors = collectHistoricalAnchors(sourceRegions);
  for (const metadata of ANATOLIA_PROVINCE_METADATA) {
    addSite(sites, seen, buildProvinceAnchor(metadata, historicalAnchors), metadata.id, "province-anchor-geographic-historical");
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
    if (currentInside && nextInside) output.push(next);
    if (currentInside !== nextInside) {
      const currentValue = a * current[0] + b * current[1] - c;
      const nextValue = a * next[0] + b * next[1] - c;
      const denominator = currentValue - nextValue;
      const t = Math.abs(denominator) < EPSILON ? 0 : currentValue / denominator;
      output.push([current[0] + (next[0] - current[0]) * t, current[1] + (next[1] - current[1]) * t]);
    }
    if (!currentInside && nextInside) output.push(next);
  }
  return output;
}

function buildVoronoiCell(siteIndex, sites) {
  const site = sites[siteIndex].point;
  const siteWeight = sites[siteIndex].weight ?? 0;
  let polygon = [[BBOX[0], BBOX[1]], [BBOX[2], BBOX[1]], [BBOX[2], BBOX[3]], [BBOX[0], BBOX[3]]];
  for (let otherIndex = 0; otherIndex < sites.length; otherIndex += 1) {
    if (siteIndex === otherIndex) continue;
    const other = sites[otherIndex].point;
    const otherWeight = sites[otherIndex].weight ?? 0;
    const a = 2 * (other[0] - site[0]);
    const b = 2 * (other[1] - site[1]);
    const c = other[0] ** 2 + other[1] ** 2 - site[0] ** 2 - site[1] ** 2 + siteWeight - otherWeight;
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
    return [metadata.centroid[0] + Math.cos(angle) * radius, metadata.centroid[1] + Math.sin(angle) * radius];
  }));
}

function createProvinceAsset(metadata, polygons) {
  return {
    header: { assetType: "province", assetVersion: 7, generator: "Historia AI Phase 2D Geographic-Historical Province Builder", provider: "historia-ai-curated-cartography", dataset: "anatolia-province-geometry-1300", historicalDate: "1300-01-01", borderPrecision: metadata.borderConfidence === "high" ? 3 : 2, sourceFeatureId: metadata.id, sourceFeatureIndex: null },
    identity: { id: metadata.id, name: metadata.name },
    references: { geometryId: metadata.id, countryId: metadata.countryId, capitalCityId: metadata.cityId },
    ownership: { countryId: metadata.countryId, ownerId: metadata.historicalControl.controllerAt1300 ?? metadata.countryId },
    historical: { sourceFeatureId: metadata.id, sourceFeatureIndex: null, sourceName: metadata.name, subject: metadata.countryId, partOf: metadata.regionId, borderPrecision: metadata.borderConfidence === "high" ? 3 : 2, classification: "phase2d-anatolia-province-geometry", precision: "geographic-and-historical-anchor-refinement", anchor: metadata.centroid, historicalControl: metadata.historicalControl },
    administration: { governorId: null }, population: { total: 0 }, economy: { development: 0, wealth: 0 }, military: { supplyLimit: 0 }, culture: { primaryCulture: null }, religion: { primaryReligion: null },
    geometry: { coastal: metadata.coastal, port: metadata.port, terrain: metadata.terrain, strategic: metadata.strategic, historicalRegion: metadata.regionId },
    polygons,
  };
}

function createGeometryAsset(metadata, polygons) {
  return {
    header: { assetType: "geometry", assetVersion: 7, generator: "Historia AI Phase 2D Geographic-Historical Province Builder", provider: "historia-ai-curated-cartography", dataset: "anatolia-province-geometry-1300", historicalDate: "1300-01-01", borderPrecision: metadata.borderConfidence === "high" ? 3 : 2, sourceFeatureId: metadata.id, sourceFeatureIndex: null },
    identity: { id: metadata.id, provinceId: metadata.id },
    metadata: { sourceFeatureId: metadata.id, sourceFeatureIndex: null, name: metadata.name, subject: metadata.countryId, partOf: metadata.regionId, borderPrecision: metadata.borderConfidence === "high" ? 3 : 2, classification: "phase2d-anatolia-province-geometry", precision: "geographic-and-historical-anchor-refinement" },
    polygons,
  };
}

export function buildAnatoliaPhase2DAssets(sourceRegions = []) {
  const sites = [];
  const seen = new Set();
  addDiagnosticLandField(sites, seen);
  addPhysicalBarrierField(sites, seen);
  buildPoliticalSites(sites, seen, sourceRegions);
  const geometrySites = sites.filter((site) => site.kind === "province-anchor-geographic-historical");
  const polygonsByProvince = Object.fromEntries(ANATOLIA_PROVINCE_METADATA.map((metadata) => [metadata.id, []]));
  for (let siteIndex = 0; siteIndex < geometrySites.length; siteIndex += 1) {
    const site = geometrySites[siteIndex];
    const cell = buildVoronoiCell(siteIndex, geometrySites);
    if (cell.length < 3 || polygonArea(cell) < MIN_CELL_AREA) continue;
    const centroid = polygonCentroid(cell);
    if (!usableLandPoint(centroid)) continue;
    polygonsByProvince[site.provinceId].push(roundPolygon(cell));
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
    geometryVersion: 4,
    historicalDate: "1300-01-01",
    provider: "historia-ai-curated-cartography",
    dataset: "anatolia-province-geometry-1300",
    projection: "EPSG:4326",
    method: "weighted geographic-historical power diagram + physical land/coast rendering authority",
    sourceBasis: { physical: "Natural Earth 10m land, lakes and rivers used by the physical atlas", historical: "aourednik/historical-basemaps world_1300 plus curated 1300 Anatolia province anchors", topographicIntent: "province seeds follow historical centres and major geographic corridors; small cartographic weights prevent dense coastal centres from becoming micro-cells" },
    siteCount: sites.length,
    politicalSiteCount: geometrySites.length,
    barrierSiteCount: sites.filter((site) => site.provinceId === null).length,
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
