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
const MAX_WEIGHT_ITERATIONS = 24;
const MAX_WEIGHT_STEP = 4;
const SHRINK_FACTOR = 0.9;
const MAX_SHRINK_ITERATIONS = 72;
const EDGE_FRACTIONS = [0, 0.25, 0.5, 0.75, 1];
const ANCHOR_PATCH_SCALE = 0.12;

const refinementFor = (item) => ANATOLIA_PROVINCE_REFINEMENTS[item.id] ?? null;
const rawAnchor = (item) => refinementFor(item)?.geometryAnchor ?? refinementFor(item)?.anchor ?? item.centroid;

function pointOnSegment(point, a, b) {
  const crossValue = Math.abs((b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]));
  if (crossValue > EPS) return false;
  return point[0] >= Math.min(a[0], b[0]) - EPS && point[0] <= Math.max(a[0], b[0]) + EPS
    && point[1] >= Math.min(a[1], b[1]) - EPS && point[1] <= Math.max(a[1], b[1]) + EPS;
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

function distanceToSegment(point, a, b) {
  const dx = b[0] - a[0]; const dy = b[1] - a[1]; const d = dx * dx + dy * dy;
  const t = d < EPS ? 0 : Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / d));
  return Math.hypot(point[0] - (a[0] + dx * t), point[1] - (a[1] + dy * t));
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
function polygonVertexMean(polygon) {
  const sum = polygon.reduce((total, point) => [total[0] + point[0], total[1] + point[1]], [0, 0]);
  return [sum[0] / polygon.length, sum[1] / polygon.length];
}
function polygonAreaCentroid(polygon) {
  const signed = signedArea(polygon);
  if (Math.abs(signed) < EPS) return polygonVertexMean(polygon);
  let x = 0; let y = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i]; const b = polygon[(i + 1) % polygon.length]; const factor = a[0] * b[1] - b[0] * a[1];
    x += (a[0] + b[0]) * factor; y += (a[1] + b[1]) * factor;
  }
  return [x / (6 * signed), y / (6 * signed)];
}

const exclusionPolygons = () => ANATOLIA_PHYSICAL_COAST_CORRECTIONS.flatMap((correction) => correction.exclusionCoordinates ?? [])
  .filter((polygon) => polygon?.length >= 3 && area(polygon) >= MIN_AREA);
const correctionLandPolygons = () => ANATOLIA_PHYSICAL_COAST_CORRECTIONS.map((correction) => correction.coordinates ?? [])
  .filter((polygon) => polygon.length >= 3 && area(polygon) >= MIN_AREA);
const correctionShorelineVertices = () => correctionLandPolygons().flatMap((polygon) => polygon);
const explicitLandControlPoints = () => ANATOLIA_PHYSICAL_COAST_CORRECTIONS.flatMap((correction) => [...(correction.landControlPoints ?? []), ...(correction.controlPoints ?? [])]);
const isExplicitLandControlPoint = (point) => explicitLandControlPoints().some((controlPoint) => distanceToSegment(point, controlPoint, controlPoint) <= EPS);
const isCorrectionShorelineVertex = (point) => correctionShorelineVertices().some((vertex) => distanceToSegment(point, vertex, vertex) <= EPS);
const isAtlasLandBoundaryPoint = (point) => ANATOLIA_PHYSICAL_ATLAS.landPolygons.some((polygon) => polygon.some((vertex, index) => pointOnSegment(point, vertex, polygon[(index + 1) % polygon.length])));
const isExplicitExcludedWater = (point) => exclusionPolygons().some((polygon) => pointInPolygon(point, polygon));
const inCorrectionLandPatch = (point) => correctionLandPolygons().some((polygon) => pointInPolygon(point, polygon));
const inLake = (point) => ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => pointInPolygon(point, lake.coordinates));

function isPhysicalLandPoint(point) {
  if (isExplicitLandControlPoint(point) || isCorrectionShorelineVertex(point) || isAtlasLandBoundaryPoint(point)) return true;
  if (isExplicitExcludedWater(point)) return false;
  if (inCorrectionLandPatch(point)) return !inLake(point);
  if (ANATOLIA_PHYSICAL_ATLAS.landPolygons.some((polygon) => pointInPolygon(point, polygon))) return !inLake(point);
  let distance = Infinity;
  for (const polygon of ANATOLIA_PHYSICAL_ATLAS.landPolygons) {
    for (let i = 0; i < polygon.length; i += 1) distance = Math.min(distance, distanceToSegment(point, polygon[i], polygon[(i + 1) % polygon.length]));
  }
  return distance <= COAST_TOLERANCE && !inLake(point);
}

const physicalRepresentative = (polygon) => [polygonAreaCentroid(polygon), polygonVertexMean(polygon), ...polygon].find((point) => isPhysicalLandPoint(point)) ?? null;
const cross = (a, b, point) => (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]);

function halfPlane(polygon, a, b, c) {
  const output = []; const inside = (point) => a * point[0] + b * point[1] <= c + EPS;
  for (let i = 0; i < polygon.length; i += 1) {
    const current = polygon[i]; const next = polygon[(i + 1) % polygon.length]; const ci = inside(current); const ni = inside(next);
    if (ci && ni) output.push(next);
    else if (ci !== ni) {
      const cv = a * current[0] + b * current[1] - c; const nv = a * next[0] + b * next[1] - c; const t = Math.abs(cv - nv) < EPS ? 0 : cv / (cv - nv);
      output.push([current[0] + (next[0] - current[0]) * t, current[1] + (next[1] - current[1]) * t]);
      if (!ci && ni) output.push(next);
    }
  }
  return output;
}

function powerCell(index, sites, weights) {
  const site = sites[index].point; const weight = weights[sites[index].provinceId] ?? 0;
  let polygon = [[BBOX[0], BBOX[1]], [BBOX[2], BBOX[1]], [BBOX[2], BBOX[3]], [BBOX[0], BBOX[3]]];
  for (let other = 0; other < sites.length; other += 1) {
    if (other === index) continue;
    const point = sites[other].point; const otherWeight = weights[sites[other].provinceId] ?? 0;
    polygon = halfPlane(polygon, 2 * (point[0] - site[0]), 2 * (point[1] - site[1]), point[0] ** 2 + point[1] ** 2 - site[0] ** 2 - site[1] ** 2 + weight - otherWeight);
    if (polygon.length < 3) return [];
  }
  return polygon;
}

function clipPolygon(subject, clipPolygonValue) {
  let output = subject.slice(); const clip = signedArea(clipPolygonValue) < 0 ? [...clipPolygonValue].reverse() : clipPolygonValue;
  for (let edge = 0; edge < clip.length; edge += 1) {
    if (!output.length) return [];
    const a = clip[edge]; const b = clip[(edge + 1) % clip.length]; const input = output; output = []; const inside = (point) => cross(a, b, point) >= -EPS;
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

function edgeOnPhysicalLand(polygon, anchorPoint) {
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i]; const b = polygon[(i + 1) % polygon.length];
    for (const fraction of EDGE_FRACTIONS) {
      const point = [a[0] + (b[0] - a[0]) * fraction, a[1] + (b[1] - a[1]) * fraction];
      if (distanceToSegment(point, anchorPoint, anchorPoint) <= EPS) continue;
      if (!isPhysicalLandPoint(point)) return false;
    }
  }
  return true;
}

function shrinkToPhysicalLand(cell, anchorPoint) {
  let result = cell;
  for (let iteration = 0; iteration < MAX_SHRINK_ITERATIONS; iteration += 1) {
    const center = result.length >= 3 ? polygonAreaCentroid(result) : null;
    if (result.length >= 3 && area(result) >= MIN_AREA && pointInPolygon(anchorPoint, result) && center && isPhysicalLandPoint(center) && edgeOnPhysicalLand(result, anchorPoint)) return result;
    result = result.map((point) => [anchorPoint[0] + (point[0] - anchorPoint[0]) * SHRINK_FACTOR, anchorPoint[1] + (point[1] - anchorPoint[1]) * SHRINK_FACTOR]);
  }
  return [];
}

function correctionPatchForAnchor(anchorPoint) {
  return correctionLandPolygons().find((polygon) => pointInPolygon(anchorPoint, polygon)) ?? null;
}

function anchorSeedPolygon(anchorPoint) {
  const patch = correctionPatchForAnchor(anchorPoint);
  if (patch) return patch;
  const size = ANCHOR_PATCH_SCALE;
  return [[anchorPoint[0] - size, anchorPoint[1] - size], [anchorPoint[0] + size, anchorPoint[1] - size], [anchorPoint[0] + size, anchorPoint[1] + size], [anchorPoint[0] - size, anchorPoint[1] + size]];
}

function clipCellToPhysicalLand(cell, anchorPoint) {
  const landSources = [...ANATOLIA_PHYSICAL_ATLAS.landPolygons, ...correctionLandPolygons(), anchorSeedPolygon(anchorPoint)];
  const candidates = landSources.map((land) => clipPolygon(land, cell)).filter((polygon) => polygon.length >= 3 && area(polygon) >= MIN_AREA);
  const anchored = candidates.filter((polygon) => pointInPolygon(anchorPoint, polygon));
  return anchored.map((polygon) => shrinkToPhysicalLand(polygon, anchorPoint)).filter((polygon) => polygon.length >= 3 && area(polygon) >= MIN_AREA).filter((polygon) => physicalRepresentative(polygon));
}

function filterPhysicalPolygons(polygons, provinceId) {
  const safe = polygons.filter((polygon) => polygon.length >= 3 && area(polygon) >= MIN_AREA);
  if (!safe.length) throw new Error(`Phase 2D V8 produced no physical-land geometry for ${provinceId}`);
  for (const polygon of safe) {
    if (!physicalRepresentative(polygon)) throw new Error(`Phase 2D V8 produced geometry without a physical-land representative for ${provinceId}`);
    for (const point of polygon) if (!isPhysicalLandPoint(point)) throw new Error(`Phase 2D V8 produced a non-physical vertex for ${provinceId}: ${point.join(",")}`);
  }
  return safe;
}

function buildControlSites() { return ANATOLIA_PROVINCE_METADATA.map((item) => ({ point: rawAnchor(item), provinceId: item.id, kind: "province-anchor" })); }
function validateCorrectionTopology() {
  for (const correction of ANATOLIA_PHYSICAL_COAST_CORRECTIONS) {
    const exclusions = correction.exclusionCoordinates ?? []; const controls = [...(correction.landControlPoints ?? []), ...(correction.controlPoints ?? [])];
    for (const controlPoint of controls) if (exclusions.some((polygon) => pointInPolygon(controlPoint, polygon))) throw new Error(`Physical correction ${correction.id} marks a land control point inside an exclusion polygon: ${controlPoint.join(",")}`);
  }
}
function validateManifest() {
  const ids = new Set(ANATOLIA_PROVINCE_METADATA.map((item) => item.id));
  if (ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST.length !== ids.size) throw new Error("1300 Anatolia geometry manifest is not aligned with province metadata.");
  for (const entry of ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST) if (!ids.has(entry.id) || !ANATOLIA_1300_PROVINCE_GEOMETRY_KEYS[entry.id] || entry.clipToPhysicalLand !== true) throw new Error(`Invalid 1300 geometry manifest entry: ${entry.id}`);
}
function headers(item, type) { return { assetType: type, assetVersion: 9, generator: "Historia AI Phase 2D Geometry Builder V8", provider: "historia-ai-curated-cartography", dataset: "anatolia-province-geometry-1300", historicalDate: "1300-01-01", borderPrecision: item.borderConfidence === "high" ? 3 : 2, sourceFeatureId: item.id, sourceFeatureIndex: null }; }
function provinceAsset(item, polygons) { return { header: headers(item, "province"), identity: { id: item.id, name: item.name }, references: { geometryId: item.id, countryId: item.countryId, capitalCityId: item.cityId }, ownership: { countryId: item.countryId, ownerId: item.historicalControl.controllerAt1300 ?? item.countryId }, historical: { sourceFeatureId: item.id, sourceFeatureIndex: null, sourceName: item.name, subject: item.countryId, partOf: item.regionId, borderPrecision: headers(item, "province").borderPrecision, classification: "phase2d-anatolia-province-geometry", precision: "anchor-safe-power-cell-physical-land-intersection", anchor: refinementFor(item)?.anchor ?? item.centroid, historicalControl: item.historicalControl }, geometry: { coastal: item.coastal, port: item.port, terrain: item.terrain, strategic: item.strategic }, polygons }; }
function geometryAsset(item, polygons) { return { header: headers(item, "geometry"), identity: { provinceId: item.id, name: item.name }, references: { provinceId: item.id, countryId: item.countryId }, ownership: { countryId: item.countryId, ownerId: item.historicalControl.controllerAt1300 ?? item.countryId }, geometry: { type: "MultiPolygon", coordinates: polygons.map((polygon) => [polygon]), polygons }, historical: { sourceFeatureId: item.id, sourceFeatureIndex: null, historicalDate: "1300-01-01", borderPrecision: headers(item, "geometry").borderPrecision } }; }
function areaSummary(partition) { return ANATOLIA_PROVINCE_METADATA.map((item) => ({ provinceId: item.id, area: (partition.get(item.id) ?? []).reduce((sum, polygon) => sum + area(polygon), 0) })).filter((item) => item.area > 0); }
function buildPartition(sites, weights) {
  const polygonsByProvince = new Map(ANATOLIA_PROVINCE_METADATA.map((item) => [item.id, []]));
  for (let index = 0; index < sites.length; index += 1) {
    const site = sites[index]; const cell = powerCell(index, sites, weights); if (!cell.length) throw new Error(`Phase 2D V8 empty power cell: ${site.provinceId}`);
    const polygons = filterPhysicalPolygons(clipCellToPhysicalLand(cell, site.point), site.provinceId).map((polygon) => polygon.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]));
    polygonsByProvince.set(site.provinceId, polygons);
  }
  return polygonsByProvince;
}
function median(values) { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.floor(sorted.length / 2)] ?? 0; }
function solveWeights(sites) {
  const weights = Object.fromEntries(sites.map((site) => [site.provinceId, 0])); let partition = buildPartition(sites, weights);
  for (let iteration = 0; iteration < MAX_WEIGHT_ITERATIONS; iteration += 1) {
    const summary = areaSummary(partition); const medianArea = median(summary.map((item) => item.area)); if (!medianArea) return { weights, partition, iterations: iteration };
    for (const item of summary) weights[item.provinceId] += Math.max(-MAX_WEIGHT_STEP, Math.min(MAX_WEIGHT_STEP, (medianArea - item.area) / Math.max(medianArea, EPS)));
    const next = buildPartition(sites, weights); const converged = summary.every((item) => Math.abs((next.get(item.provinceId) ?? []).reduce((sum, polygon) => sum + area(polygon), 0) - item.area) < medianArea * 0.005); partition = next; if (converged) return { weights, partition, iterations: iteration + 1 };
  }
  return { weights, partition, iterations: MAX_WEIGHT_ITERATIONS };
}
function isAnatoliaGeometryPoint(point) { if (!Array.isArray(point) || point.length !== 2) return false; const [longitude, latitude] = point; if (longitude < 25 || longitude > 46 || latitude < 35 || latitude > 43) return false; if (longitude > 26.4 && longitude < 28.9 && latitude > 40.4 && latitude < 41.9) return false; return true; }
export function buildAnatoliaPhase2DAssets() {
  validateManifest(); validateCorrectionTopology(); const sites = buildControlSites();
  for (const site of sites) if (!isAnatoliaGeometryPoint(site.point) || !isPhysicalLandPoint(site.point)) throw new Error(`Invalid 1300 province anchor: ${site.provinceId} ${site.point.join(",")}`);
  const solved = solveWeights(sites); const provinces = []; const geometries = [];
  for (const item of ANATOLIA_PROVINCE_METADATA) { const polygons = solved.partition.get(item.id) ?? []; provinces.push(provinceAsset(item, polygons)); geometries.push(geometryAsset(item, polygons)); }
  const polygonCount = geometries.reduce((sum, geometry) => sum + geometry.polygons.length, 0); const fallbackProvinceCount = geometries.filter((geometry) => geometry.polygons.some((polygon) => area(polygon) < MIN_AREA)).length;
  return { historicalDate: "1300-01-01", provinceCount: provinces.length, provinces, geometries, polygonCount, siteCount: sites.length + ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.length + ANATOLIA_PHYSICAL_ATLAS_RUNTIME.rivers.length, politicalSiteCount: sites.length, barrierSiteCount: 0, fallbackProvinceCount, iterations: solved.iterations, sites, diagnostics: { generator: "AnatoliaPhase2DGeometryBuilderV8", source: "historia-ai-curated-cartography", physicalLandAuthority: "anchor-seeded-correction-aware-land-intersection", iterations: solved.iterations } };
}
export { pointInPolygon, isAnatoliaGeometryPoint, isPhysicalLandPoint };