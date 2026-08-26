import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PHYSICAL_COAST_CORRECTIONS } from "../../src/map/data/AnatoliaPhysicalCoastCorrections.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import {
  ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST,
  ANATOLIA_1300_PROVINCE_GEOMETRY_KEYS,
} from "../../src/map/data/Anatolia1300ProvinceGeometryManifest.js";
import { ANATOLIA_PROVINCE_REFINEMENTS } from "../../src/map/data/AnatoliaProvinceRefinement.js";

const BBOX = [25.45, 35.72, 44.85, 42.35];
const EPS = 1e-7;
const MIN_AREA = 0.00005;
const COAST_TOLERANCE = 0.055;
const MAINLAND_MIN_AREA = 5;
const MAX_AREA_RATIO = 4.2;
const MAX_WEIGHT_ITERATIONS = 24;
const MAX_WEIGHT_STEP = 4;

const refinementFor = (item) => ANATOLIA_PROVINCE_REFINEMENTS[item.id] ?? null;
const rawAnchor = (item) => refinementFor(item)?.geometryAnchor ?? refinementFor(item)?.anchor ?? item.centroid;

function pointInPolygon(point, polygon) {
  if (!polygon?.length) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    if ((a[1] > point[1]) !== (b[1] > point[1])
      && point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / ((b[1] - a[1]) || EPS) + a[0]) {
      inside = !inside;
    }
    j = i;
  }
  return inside;
}

function distanceToSegment(point, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const d = dx * dx + dy * dy;
  const t = d < EPS ? 0 : Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / d));
  return Math.hypot(point[0] - (a[0] + dx * t), point[1] - (a[1] + dy * t));
}

function signedArea(polygon) {
  let sum = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    sum += polygon[i][0] * polygon[(i + 1) % polygon.length][1]
      - polygon[(i + 1) % polygon.length][0] * polygon[i][1];
  }
  return sum / 2;
}

function area(polygon) {
  return Math.abs(signedArea(polygon));
}

function cross(a, b, point) {
  return (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]);
}

function landPolygons() {
  const atlasLand = ANATOLIA_PHYSICAL_ATLAS.landPolygons.filter((polygon) => area(polygon) >= MAINLAND_MIN_AREA);
  const correctionLand = ANATOLIA_PHYSICAL_COAST_CORRECTIONS
    .map((correction) => correction.coordinates)
    .filter((polygon) => polygon?.length >= 3 && area(polygon) >= MIN_AREA);
  return [...atlasLand, ...correctionLand];
}

function isCoastCorrectionLandPoint(point) {
  return ANATOLIA_PHYSICAL_COAST_CORRECTIONS.some((correction) => (
    pointInPolygon(point, correction.coordinates)
    || correction.controlPoints?.some((controlPoint) => distanceToSegment(point, controlPoint, controlPoint) <= EPS)
  ));
}

function inLake(point) {
  return ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => pointInPolygon(point, lake.coordinates));
}

function isStaticLandPoint(point) {
  if (isCoastCorrectionLandPoint(point)) return true;
  if (ANATOLIA_PHYSICAL_ATLAS.landPolygons.some((polygon) => pointInPolygon(point, polygon))) return true;
  let distance = Infinity;
  for (const polygon of ANATOLIA_PHYSICAL_ATLAS.landPolygons) {
    for (let i = 0; i < polygon.length; i += 1) {
      distance = Math.min(distance, distanceToSegment(point, polygon[i], polygon[(i + 1) % polygon.length]));
    }
  }
  return distance <= COAST_TOLERANCE;
}

function isPhysicalLandPoint(point) {
  if (isCoastCorrectionLandPoint(point)) return true;
  return isStaticLandPoint(point) && !inLake(point);
}

function halfPlane(polygon, a, b, c) {
  const output = [];
  const inside = (point) => a * point[0] + b * point[1] <= c + EPS;
  for (let i = 0; i < polygon.length; i += 1) {
    const current = polygon[i];
    const next = polygon[(i + 1) % polygon.length];
    const currentInside = inside(current);
    const nextInside = inside(next);
    if (currentInside && nextInside) output.push(next);
    else if (currentInside !== nextInside) {
      const cv = a * current[0] + b * current[1] - c;
      const nv = a * next[0] + b * next[1] - c;
      const t = Math.abs(cv - nv) < EPS ? 0 : cv / (cv - nv);
      output.push([current[0] + (next[0] - current[0]) * t, current[1] + (next[1] - current[1]) * t]);
      if (!currentInside && nextInside) output.push(next);
    }
  }
  return output;
}

function powerCell(index, sites, weights) {
  const site = sites[index].point;
  const weight = weights[sites[index].provinceId] ?? 0;
  let polygon = [[BBOX[0], BBOX[1]], [BBOX[2], BBOX[1]], [BBOX[2], BBOX[3]], [BBOX[0], BBOX[3]]];
  for (let other = 0; other < sites.length; other += 1) {
    if (other === index) continue;
    const p = sites[other].point;
    const otherWeight = weights[sites[other].provinceId] ?? 0;
    polygon = halfPlane(polygon, 2 * (p[0] - site[0]), 2 * (p[1] - site[1]),
      p[0] ** 2 + p[1] ** 2 - site[0] ** 2 - site[1] ** 2 + weight - otherWeight);
    if (polygon.length < 3) return [];
  }
  return polygon;
}

function clipLandByCell(land, cell) {
  let output = land.slice();
  const clip = signedArea(cell) < 0 ? [...cell].reverse() : cell;
  for (let edge = 0; edge < clip.length; edge += 1) {
    if (!output.length) return [];
    const a = clip[edge];
    const b = clip[(edge + 1) % clip.length];
    const input = output;
    output = [];
    const inside = (point) => cross(a, b, point) >= -EPS;
    for (let i = 0; i < input.length; i += 1) {
      const current = input[i];
      const next = input[(i + 1) % input.length];
      const currentInside = inside(current);
      const nextInside = inside(next);
      if (currentInside && nextInside) output.push(next);
      else if (currentInside !== nextInside) {
        const cv = cross(a, b, current);
        const nv = cross(a, b, next);
        const t = Math.abs(cv - nv) < EPS ? 0 : cv / (cv - nv);
        output.push([current[0] + (next[0] - current[0]) * t, current[1] + (next[1] - current[1]) * t]);
        if (!currentInside && nextInside) output.push(next);
      }
    }
  }
  return output;
}

function clipCellToMainland(cell) {
  return landPolygons().map((land) => clipLandByCell(land, cell))
    .filter((polygon) => polygon.length >= 3 && area(polygon) >= MIN_AREA);
}

function filterPhysicalPolygons(polygons, provinceId) {
  const safe = polygons.filter((polygon) => polygon.length >= 3 && area(polygon) >= MIN_AREA);
  if (!safe.length) throw new Error(`Phase 2D V8 produced no physical-land geometry for ${provinceId}`);
  return safe;
}

function buildControlSites() {
  return ANATOLIA_PROVINCE_METADATA.map((item) => ({ point: rawAnchor(item), provinceId: item.id, kind: "province-anchor" }));
}

function validateManifest() {
  const ids = new Set(ANATOLIA_PROVINCE_METADATA.map((item) => item.id));
  if (ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST.length !== ids.size) throw new Error("1300 Anatolia geometry manifest is not aligned with province metadata.");
  for (const entry of ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST) {
    if (!ids.has(entry.id) || !ANATOLIA_1300_PROVINCE_GEOMETRY_KEYS[entry.id] || entry.clipToPhysicalLand !== true) {
      throw new Error(`Invalid 1300 geometry manifest entry: ${entry.id}`);
    }
  }
}

function headers(item, type) {
  return { assetType: type, assetVersion: 9, generator: "Historia AI Phase 2D Geometry Builder", provider: "historia-ai-curated-cartography", dataset: "anatolia-province-geometry-1300", historicalDate: "1300-01-01", borderPrecision: item.borderConfidence === "high" ? 3 : 2, sourceFeatureId: item.id, sourceFeatureIndex: null };
}

function provinceAsset(item, polygons) {
  return {
    header: headers(item, "province"), identity: { id: item.id, name: item.name },
    references: { geometryId: item.id, countryId: item.countryId, capitalCityId: item.cityId },
    ownership: { countryId: item.countryId, ownerId: item.historicalControl.controllerAt1300 ?? item.countryId },
    historical: { sourceFeatureId: item.id, sourceFeatureIndex: null, sourceName: item.name, subject: item.countryId, partOf: item.regionId, borderPrecision: headers(item, "province").borderPrecision, classification: "phase2d-anatolia-province-geometry", precision: "single-anchor-weighted-land-partition", anchor: refinementFor(item)?.anchor ?? item.centroid, historicalControl: item.historicalControl },
    geometry: { coastal: item.coastal, port: item.port, terrain: item.terrain, strategic: item.strategic }, polygons,
  };
}

function geometryAsset(item, polygons) {
  return {
    header: headers(item, "geometry"), identity: { id: item.id, provinceId: item.id },
    metadata: { sourceFeatureId: item.id, sourceFeatureIndex: null, name: item.name, subject: item.countryId, partOf: item.regionId, borderPrecision: headers(item, "geometry").borderPrecision, classification: "phase2d-anatolia-province-geometry", precision: "single-anchor-weighted-land-partition", anchor: rawAnchor(item) },
    polygons,
  };
}

function buildPartition(sites, weights) {
  const polygonsByProvince = new Map(ANATOLIA_PROVINCE_METADATA.map((item) => [item.id, []]));
  for (let index = 0; index < sites.length; index += 1) {
    const site = sites[index];
    const cell = powerCell(index, sites, weights);
    if (!cell.length) throw new Error(`Phase 2D V8 empty power cell: ${site.provinceId}`);
    const safe = filterPhysicalPolygons(clipCellToMainland(cell), site.provinceId);
    polygonsByProvince.set(site.provinceId, safe.map((polygon) => polygon.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))])));
  }
  return polygonsByProvince;
}

function areaSummary(polygonsByProvince) {
  return [...polygonsByProvince.entries()].map(([id, polygons]) => ({ id, area: polygons.reduce((sum, polygon) => sum + area(polygon), 0) }));
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function solveWeights(sites) {
  const weights = Object.fromEntries(sites.map((site) => [site.provinceId, 0]));
  let partition = buildPartition(sites, weights);
  for (let iteration = 0; iteration < MAX_WEIGHT_ITERATIONS; iteration += 1) {
    const summary = areaSummary(partition);
    const medianArea = median(summary.map((item) => item.area));
    const oversized = summary.filter((item) => item.area > medianArea * MAX_AREA_RATIO);
    if (!oversized.length) return { weights, partition, iterations: iteration };
    for (const item of oversized) {
      const ratio = item.area / medianArea;
      const step = Math.min(MAX_WEIGHT_STEP, Math.max(0.25, (ratio - MAX_AREA_RATIO) * 1.5));
      weights[item.id] -= step;
    }
    partition = buildPartition(sites, weights);
  }
  const summary = areaSummary(partition);
  const medianArea = median(summary.map((item) => item.area));
  const maxArea = Math.max(...summary.map((item) => item.area));
  if (maxArea > medianArea * MAX_AREA_RATIO) throw new Error(`Phase 2D V8 could not bound province area ratio: max ${maxArea.toFixed(3)} vs median ${medianArea.toFixed(3)}`);
  return { weights, partition, iterations: MAX_WEIGHT_ITERATIONS };
}

function samplingSiteCount() {
  let count = 0;
  for (let longitude = BBOX[0]; longitude <= BBOX[2] + EPS; longitude += 0.06) {
    for (let latitude = BBOX[1]; latitude <= BBOX[3] + EPS; latitude += 0.06) if (isPhysicalLandPoint([longitude, latitude])) count += 1;
  }
  return count;
}

export function isAnatoliaGeometryPoint(point) {
  const [longitude, latitude] = point;
  return longitude >= BBOX[0] && longitude <= BBOX[2] && latitude >= BBOX[1] && latitude <= BBOX[3];
}

export function buildAnatoliaPhase2DAssets() {
  validateManifest();
  const sites = buildControlSites();
  for (const site of sites) {
    if (!isAnatoliaGeometryPoint(site.point) || !isPhysicalLandPoint(site.point)) throw new Error(`Invalid 1300 province anchor: ${site.provinceId} ${site.point.join(",")}`);
  }
  const solved = solveWeights(sites);
  const provinces = [];
  const geometries = [];
  let polygonCount = 0;
  let vertexCount = 0;
  for (const item of ANATOLIA_PROVINCE_METADATA) {
    const polygons = solved.partition.get(item.id) ?? [];
    if (!polygons.length) throw new Error(`Phase 2D V8 produced no geometry for ${item.id}`);
    polygonCount += polygons.length;
    vertexCount += polygons.reduce((sum, polygon) => sum + polygon.length, 0);
    provinces.push(provinceAsset(item, polygons));
    geometries.push(geometryAsset(item, polygons));
  }
  const physicalSamplingSiteCount = samplingSiteCount();
  const provinceCount = provinces.length;
  const politicalSiteCount = sites.length;
  return {
    schemaVersion: 1, geometryVersion: 11, generatedAt: "1300-01-01T00:00:00.000Z", historicalDate: "1300-01-01",
    provinceCount, fallbackProvinceCount: 0, siteCount: physicalSamplingSiteCount + politicalSiteCount,
    politicalSiteCount, barrierSiteCount: 0, polygonCount, vertexCount, physicalSamplingSiteCount,
    sites, provinces, geometries,
    diagnostics: { generator: "AnatoliaPhase2DGeometryBuilderV8", source: "historia-ai-curated-cartography", physicalLandAuthority: "atlas-land-polygons-plus-explicit-coast-corrections-minus-natural-earth-10m-lakes", iterations: solved.iterations },
  };
}

export { isPhysicalLandPoint };
