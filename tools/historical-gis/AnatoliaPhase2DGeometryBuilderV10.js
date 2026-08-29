import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PHYSICAL_COAST_CORRECTIONS } from "../../src/map/data/AnatoliaPhysicalCoastCorrections.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST, ANATOLIA_1300_PROVINCE_GEOMETRY_KEYS } from "../../src/map/data/Anatolia1300ProvinceGeometryManifest.js";
import { ANATOLIA_PROVINCE_REFINEMENTS } from "../../src/map/data/AnatoliaProvinceRefinement.js";

const BBOX = [25.45, 35.72, 44.85, 42.35];
const EPS = 1e-7;
const MIN_AREA = 0.00005;
const COAST_TOLERANCE = 0.055;
const EDGE_FRACTIONS = [0, 0.25, 0.5, 0.75, 1];
const SAMPLE_STEP = 0.035;
const MAX_WEIGHT_ITERATIONS = 18;
const MAX_WEIGHT_STEP = 1.5;
const REPAIR_FACTOR = 0.94;
const MAX_REPAIR_ITERATIONS = 32;
const ANCHOR_SEARCH_STEP = 0.01;
const ANCHOR_SEARCH_RADIUS = 1.25;

const refinementFor = (item) => ANATOLIA_PROVINCE_REFINEMENTS[item.id] ?? null;
const rawAnchor = (item) => refinementFor(item)?.geometryAnchor ?? refinementFor(item)?.anchor ?? item.centroid;

function pointOnSegment(point, a, b) {
  const cross = Math.abs((b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]));
  if (cross > EPS) return false;
  return point[0] >= Math.min(a[0], b[0]) - EPS && point[0] <= Math.max(a[0], b[0]) + EPS && point[1] >= Math.min(a[1], b[1]) - EPS && point[1] <= Math.max(a[1], b[1]) + EPS;
}

function pointInPolygon(point, polygon) {
  if (!polygon?.length) return false;
  for (let i = 0; i < polygon.length; i += 1) if (pointOnSegment(point, polygon[i], polygon[(i + 1) % polygon.length])) return true;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; i += 1) {
    const a = polygon[i]; const b = polygon[j];
    if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / ((b[1] - a[1]) || EPS) + a[0]) inside = !inside;
    j = i;
  }
  return inside;
}

function pointInPolygonStrict(point, polygon) {
  if (!pointInPolygon(point, polygon)) return false;
  return !polygon.some((vertex, index) => pointOnSegment(point, vertex, polygon[(index + 1) % polygon.length]));
}

function signedArea(polygon) {
  let sum = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i]; const b = polygon[(i + 1) % polygon.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
}

function area(polygon) { return Math.abs(signedArea(polygon)); }

function polygonCentroid(polygon) {
  const signed = signedArea(polygon);
  if (Math.abs(signed) < EPS) {
    const sum = polygon.reduce((total, point) => [total[0] + point[0], total[1] + point[1]], [0, 0]);
    return [sum[0] / polygon.length, sum[1] / polygon.length];
  }
  let x = 0; let y = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i]; const b = polygon[(i + 1) % polygon.length];
    const f = a[0] * b[1] - b[0] * a[1];
    x += (a[0] + b[0]) * f; y += (a[1] + b[1]) * f;
  }
  return [x / (6 * signed), y / (6 * signed)];
}

function distanceToSegment(point, a, b) {
  const dx = b[0] - a[0]; const dy = b[1] - a[1]; const d = dx * dx + dy * dy;
  const t = d < EPS ? 0 : Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / d));
  return Math.hypot(point[0] - (a[0] + dx * t), point[1] - (a[1] + dy * t));
}

function correctionLandPolygons() {
  return ANATOLIA_PHYSICAL_COAST_CORRECTIONS.map((correction) => correction.coordinates ?? []).filter((polygon) => polygon?.length >= 3 && area(polygon) >= MIN_AREA);
}

function exclusionPolygons() {
  return ANATOLIA_PHYSICAL_COAST_CORRECTIONS.flatMap((correction) => correction.exclusionCoordinates ?? []).filter((polygon) => polygon?.length >= 3 && area(polygon) >= MIN_AREA);
}

function explicitLandControlPoints() {
  return ANATOLIA_PHYSICAL_COAST_CORRECTIONS.flatMap((correction) => [...(correction.landControlPoints ?? []), ...(correction.controlPoints ?? [])]);
}

function isPhysicalInteriorPoint(point) {
  if (!Array.isArray(point) || point.length !== 2) return false;
  if (exclusionPolygons().some((polygon) => pointInPolygonStrict(point, polygon))) return false;
  if (ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => pointInPolygonStrict(point, lake.coordinates))) return false;
  if (explicitLandControlPoints().some((control) => pointOnSegment(point, control, control))) return true;
  if (correctionLandPolygons().some((polygon) => pointInPolygonStrict(point, polygon))) return true;
  return ANATOLIA_PHYSICAL_ATLAS.landPolygons.some((polygon) => pointInPolygonStrict(point, polygon));
}

export function isPhysicalLandPoint(point) {
  if (!Array.isArray(point) || point.length !== 2) return false;
  if (exclusionPolygons().some((polygon) => pointInPolygonStrict(point, polygon))) return false;
  if (explicitLandControlPoints().some((control) => pointOnSegment(point, control, control))) return true;
  if (ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => pointInPolygonStrict(point, lake.coordinates))) return false;
  if (correctionLandPolygons().some((polygon) => pointInPolygon(point, polygon))) return true;
  if (ANATOLIA_PHYSICAL_ATLAS.landPolygons.some((polygon) => pointInPolygon(point, polygon))) return true;
  for (const polygon of ANATOLIA_PHYSICAL_ATLAS.landPolygons) for (let i = 0; i < polygon.length; i += 1) if (distanceToSegment(point, polygon[i], polygon[(i + 1) % polygon.length]) <= COAST_TOLERANCE) return true;
  return false;
}

function physicalSources() { return [...ANATOLIA_PHYSICAL_ATLAS.landPolygons, ...correctionLandPolygons()]; }

function resolvePhysicalAnchor(point) {
  if (isPhysicalInteriorPoint(point)) return point;
  let best = null; let bestDistance = Infinity;
  const maxSteps = Math.ceil(ANCHOR_SEARCH_RADIUS / ANCHOR_SEARCH_STEP);
  for (let dx = -maxSteps; dx <= maxSteps; dx += 1) {
    for (let dy = -maxSteps; dy <= maxSteps; dy += 1) {
      if (dx === 0 && dy === 0) continue;
      const distance = Math.hypot(dx, dy) * ANCHOR_SEARCH_STEP;
      if (distance > ANCHOR_SEARCH_RADIUS || distance >= bestDistance) continue;
      const candidate = [point[0] + dx * ANCHOR_SEARCH_STEP, point[1] + dy * ANCHOR_SEARCH_STEP];
      if (!isPhysicalInteriorPoint(candidate)) continue;
      best = candidate; bestDistance = distance;
    }
  }
  if (best) return best;
  for (const polygon of physicalSources()) {
    for (let i = 0; i < polygon.length; i += 1) {
      const a = polygon[i]; const b = polygon[(i + 1) % polygon.length];
      const dx = b[0] - a[0]; const dy = b[1] - a[1]; const d = dx * dx + dy * dy;
      const t = d < EPS ? 0 : Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / d));
      const edge = [a[0] + dx * t, a[1] + dy * t];
      const center = polygonCentroid(polygon);
      for (const fraction of [0.02, 0.05, 0.1, 0.2]) {
        const candidate = [edge[0] + (center[0] - edge[0]) * fraction, edge[1] + (center[1] - edge[1]) * fraction];
        if (isPhysicalInteriorPoint(candidate)) {
          const distance = Math.hypot(candidate[0] - point[0], candidate[1] - point[1]);
          if (distance < bestDistance) { best = candidate; bestDistance = distance; }
        }
      }
    }
  }
  if (!best) throw new Error(`No physical-land anchor can be resolved for historical province coordinate ${point.join(",")}`);
  return best;
}

function cross(a, b, point) { return (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]); }

function halfPlane(polygon, a, b, c) {
  const output = []; const inside = (point) => a * point[0] + b * point[1] <= c + EPS;
  for (let i = 0; i < polygon.length; i += 1) {
    const current = polygon[i]; const next = polygon[(i + 1) % polygon.length]; const ci = inside(current); const ni = inside(next);
    if (ci && ni) output.push(next);
    else if (ci !== ni) {
      const cv = a * current[0] + b * current[1] - c; const nv = a * next[0] + b * next[1] - c;
      const t = Math.abs(cv - nv) < EPS ? 0 : cv / (cv - nv);
      output.push([current[0] + (next[0] - current[0]) * t, current[1] + (next[1] - current[1]) * t]);
      if (!ci && ni) output.push(next);
    }
  }
  return output;
}

function powerCell(index, sites, weights) {
  const site = sites[index].point; const ownWeight = weights[sites[index].provinceId] ?? 0;
  let polygon = [[BBOX[0], BBOX[1]], [BBOX[2], BBOX[1]], [BBOX[2], BBOX[3]], [BBOX[0], BBOX[3]]];
  for (let other = 0; other < sites.length; other += 1) {
    if (other === index) continue;
    const point = sites[other].point; const otherWeight = weights[sites[other].provinceId] ?? 0;
    const candidate = halfPlane(polygon, 2 * (point[0] - site[0]), 2 * (point[1] - site[1]), point[0] ** 2 + point[1] ** 2 - site[0] ** 2 - site[1] ** 2 + ownWeight - otherWeight);
    if (candidate.length >= 3 && pointInPolygon(site, candidate)) polygon = candidate;
  }
  return polygon;
}

function clipPolygon(subject, clip) {
  let output = subject.slice(); const boundary = signedArea(clip) < 0 ? [...clip].reverse() : clip;
  for (let edge = 0; edge < boundary.length; edge += 1) {
    if (!output.length) return [];
    const a = boundary[edge]; const b = boundary[(edge + 1) % boundary.length]; const input = output; output = [];
    const inside = (point) => cross(a, b, point) >= -EPS;
    for (let i = 0; i < input.length; i += 1) {
      const current = input[i]; const next = input[(i + 1) % input.length]; const ci = inside(current); const ni = inside(next);
      if (ci && ni) output.push(next);
      else if (ci !== ni) {
        const cv = cross(a, b, current); const nv = cross(a, b, next); const t = Math.abs(cv - nv) < EPS ? 0 : cv / (cv - nv);
        output.push([current[0] + (next[0] - current[0]) * t, current[1] + (next[1] - current[1]) * t]);
        if (!ci && ni) output.push(next);
      }
    }
  }
  return output;
}

function edgeOnPhysicalLand(polygon) {
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i]; const b = polygon[(i + 1) % polygon.length];
    for (const fraction of EDGE_FRACTIONS) if (!isPhysicalLandPoint([a[0] + (b[0] - a[0]) * fraction, a[1] + (b[1] - a[1]) * fraction])) return false;
  }
  return true;
}

function polygonIsSafe(polygon) {
  return polygon.length >= 3 && area(polygon) >= MIN_AREA && edgeOnPhysicalLand(polygon) && polygon.every((point) => isPhysicalLandPoint(point));
}

function repairPolygon(polygon, anchorPoint) {
  if (polygonIsSafe(polygon)) return polygon;
  const center = pointInPolygon(anchorPoint, polygon) && isPhysicalLandPoint(anchorPoint) ? anchorPoint : polygonCentroid(polygon);
  let result = polygon;
  for (let iteration = 0; iteration < MAX_REPAIR_ITERATIONS; iteration += 1) {
    result = result.map((point) => [center[0] + (point[0] - center[0]) * REPAIR_FACTOR, center[1] + (point[1] - center[1]) * REPAIR_FACTOR]);
    if (polygonIsSafe(result) && pointInPolygon(anchorPoint, result)) return result;
    if (area(result) < MIN_AREA) return [];
  }
  return [];
}

function clipCellToPhysicalLand(cell, anchorPoint) {
  const candidates = physicalSources().map((land) => clipPolygon(land, cell)).filter((polygon) => polygon.length >= 3 && area(polygon) >= MIN_AREA && pointInPolygon(anchorPoint, polygon));
  return candidates.map((polygon) => repairPolygon(polygon, anchorPoint)).filter((polygon) => polygon.length >= 3 && polygonIsSafe(polygon) && pointInPolygon(anchorPoint, polygon));
}

function buildControlSites() {
  return ANATOLIA_PROVINCE_METADATA.map((item) => {
    const sourcePoint = rawAnchor(item);
    const point = resolvePhysicalAnchor(sourcePoint);
    return { point, sourcePoint, provinceId: item.id, kind: "province-anchor" };
  });
}

function validateManifest() {
  const ids = new Set(ANATOLIA_PROVINCE_METADATA.map((item) => item.id));
  if (ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST.length !== ids.size) throw new Error("1300 Anatolia geometry manifest is not aligned with province metadata.");
  for (const entry of ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST) if (!ids.has(entry.id) || !ANATOLIA_1300_PROVINCE_GEOMETRY_KEYS[entry.id] || entry.clipToPhysicalLand !== true) throw new Error(`Invalid 1300 geometry manifest entry: ${entry.id}`);
}

function headers(item, type) { return { assetType: type, assetVersion: 13, generator: "Historia AI Phase 2D Geometry Builder V10", provider: "historia-ai-curated-cartography", dataset: "anatolia-province-geometry-1300", historicalDate: "1300-01-01", borderPrecision: item.borderConfidence === "high" ? 3 : 2, sourceFeatureId: item.id, sourceFeatureIndex: null }; }

function provinceAsset(item, polygons) { return { header: headers(item, "province"), identity: { id: item.id, name: item.name }, references: { geometryId: item.id, countryId: item.countryId, capitalCityId: item.cityId }, ownership: { countryId: item.countryId, ownerId: item.historicalControl.controllerAt1300 ?? item.countryId }, historical: { sourceFeatureId: item.id, sourceFeatureIndex: null, sourceName: item.name, subject: item.countryId, partOf: item.regionId, borderPrecision: headers(item, "province").borderPrecision, classification: "phase2d-anatolia-province-geometry", precision: "anchor-safe-physical-partition", anchor: rawAnchor(item), historicalControl: item.historicalControl }, geometry: { coastal: item.coastal, port: item.port, terrain: item.terrain, strategic: item.strategic }, polygons }; }

function geometryAsset(item, polygons) { return { header: headers(item, "geometry"), identity: { provinceId: item.id, name: item.name }, references: { provinceId: item.id, countryId: item.countryId }, ownership: { countryId: item.countryId, ownerId: item.historicalControl.controllerAt1300 ?? item.countryId }, geometry: { type: "MultiPolygon", coordinates: polygons.map((polygon) => [polygon]), polygons }, polygons, historical: { sourceFeatureId: item.id, sourceFeatureIndex: null, historicalDate: "1300-01-01", borderPrecision: headers(item, "geometry").borderPrecision } }; }

function areaSummary(partition) { return ANATOLIA_PROVINCE_METADATA.map((item) => ({ provinceId: item.id, area: (partition.get(item.id) ?? []).reduce((sum, polygon) => sum + area(polygon), 0) })); }
function median(values) { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.floor(sorted.length / 2)] ?? 0; }

function buildPartition(sites, weights) {
  const map = new Map();
  for (let index = 0; index < sites.length; index += 1) {
    const site = sites[index];
    const cell = powerCell(index, sites, weights);
    const polygons = clipCellToPhysicalLand(cell, site.point);
    if (!polygons.length) throw new Error(`Phase 2D V10 produced no physical-land geometry for ${site.provinceId}`);
    map.set(site.provinceId, polygons.map((polygon) => polygon.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))])));
  }
  return map;
}

function solveWeights(sites) {
  const weights = Object.fromEntries(sites.map((site) => [site.provinceId, 0]));
  let partition = buildPartition(sites, weights);
  for (let iteration = 0; iteration < MAX_WEIGHT_ITERATIONS; iteration += 1) {
    const summary = areaSummary(partition); const medianArea = median(summary.map((item) => item.area));
    if (!medianArea) return { weights, partition, iterations: iteration };
    for (const item of summary) weights[item.provinceId] += Math.max(-MAX_WEIGHT_STEP, Math.min(MAX_WEIGHT_STEP, (medianArea - item.area) / Math.max(medianArea, EPS)));
    const next = buildPartition(sites, weights);
    const converged = summary.every((item) => Math.abs((next.get(item.provinceId) ?? []).reduce((sum, polygon) => sum + area(polygon), 0) - item.area) < medianArea * 0.005);
    partition = next;
    if (converged) return { weights, partition, iterations: iteration + 1 };
  }
  return { weights, partition, iterations: MAX_WEIGHT_ITERATIONS };
}

function samplingSiteCount() {
  let count = 0;
  for (let longitude = BBOX[0]; longitude <= BBOX[2] + EPS; longitude += SAMPLE_STEP) for (let latitude = BBOX[1]; latitude <= BBOX[3] + EPS; latitude += SAMPLE_STEP) if (isPhysicalLandPoint([longitude, latitude])) count += 1;
  return count;
}

export function isAnatoliaGeometryPoint(point) {
  if (!Array.isArray(point) || point.length !== 2) return false;
  const [longitude, latitude] = point;
  if (longitude < 25 || longitude > 46 || latitude < 35 || latitude > 43) return false;
  if (longitude > 26.4 && longitude < 28.9 && latitude > 40.4 && latitude < 41.9) return false;
  return true;
}

export function buildAnatoliaPhase2DAssets() {
  validateManifest();
  const sites = buildControlSites();
  for (const site of sites) if (!isAnatoliaGeometryPoint(site.sourcePoint) || !isPhysicalInteriorPoint(site.point)) throw new Error(`Invalid 1300 province anchor: ${site.provinceId} ${site.point.join(",")}`);
  const solved = solveWeights(sites); const provinces = []; const geometries = [];
  for (const item of ANATOLIA_PROVINCE_METADATA) {
    const polygons = solved.partition.get(item.id) ?? [];
    if (!polygons.length) throw new Error(`Phase 2D produced no polygons for ${item.id}`);
    provinces.push(provinceAsset(item, polygons)); geometries.push(geometryAsset(item, polygons));
  }
  const physicalSamplingSiteCount = samplingSiteCount();
  const polygonCount = geometries.reduce((sum, item) => sum + item.polygons.length, 0);
  return { schemaVersion: 1, geometryVersion: 13, historicalDate: "1300-01-01", provider: "historia-ai-curated-cartography", dataset: "anatolia-province-geometry-1300", projection: "EPSG:4326", method: "one historical province anchor per political cell, deterministic interior physical-anchor resolution, weighted physical-land intersection, anchor-preserving repair, explicit water exclusions, lake-safe validation, dense physical sampling", siteCount: physicalSamplingSiteCount + sites.length, politicalSiteCount: sites.length, physicalSamplingSiteCount, naturalFeatureSiteCount: physicalSamplingSiteCount, barrierSiteCount: 0, supportSiteCount: 0, fallbackProvinceCount: 0, provinceCount: provinces.length, polygonCount, weightIterations: solved.iterations, provinces, geometries, sites };
}

export function isPhysicalLandPointLegacy(point) { return isPhysicalLandPoint(point); }
