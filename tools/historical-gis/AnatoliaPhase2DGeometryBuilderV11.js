import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PHYSICAL_COAST_CORRECTIONS } from "../../src/map/data/AnatoliaPhysicalCoastCorrections.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST, ANATOLIA_1300_PROVINCE_GEOMETRY_KEYS } from "../../src/map/data/Anatolia1300ProvinceGeometryManifest.js";
import { ANATOLIA_PROVINCE_REFINEMENTS } from "../../src/map/data/AnatoliaProvinceRefinement.js";

const BBOX = [25.45, 35.72, 44.85, 42.35];
const EPS = 1e-7;
const MIN_AREA = 0.00005;
const EDGE_FRACTIONS = [0, 0.25, 0.5, 0.75, 1];
const SAMPLE_STEP = 0.035;
const MAX_WEIGHT_ITERATIONS = 18;
const MAX_WEIGHT_STEP = 1.5;
const ANCHOR_SEARCH_STEP = 0.01;
const ANCHOR_SEARCH_RADIUS = 1.25;
const FALLBACK_SCALES = [0.5, 0.25, 0.125, 0.0625, 0.03125, 0.015625];

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
function pointInPolygonStrict(point, polygon) { return pointInPolygon(point, polygon) && !polygon.some((vertex, index) => pointOnSegment(point, vertex, polygon[(index + 1) % polygon.length])); }
function signedArea(polygon) {
  let sum = 0;
  for (let i = 0; i < polygon.length; i += 1) { const a = polygon[i]; const b = polygon[(i + 1) % polygon.length]; sum += a[0] * b[1] - b[0] * a[1]; }
  return sum / 2;
}
function area(polygon) { return Math.abs(signedArea(polygon)); }
function polygonCentroid(polygon) {
  const signed = signedArea(polygon);
  if (Math.abs(signed) < EPS) { const sum = polygon.reduce((total, point) => [total[0] + point[0], total[1] + point[1]], [0, 0]); return [sum[0] / polygon.length, sum[1] / polygon.length]; }
  let x = 0; let y = 0;
  for (let i = 0; i < polygon.length; i += 1) { const a = polygon[i]; const b = polygon[(i + 1) % polygon.length]; const f = a[0] * b[1] - b[0] * a[1]; x += (a[0] + b[0]) * f; y += (a[1] + b[1]) * f; }
  return [x / (6 * signed), y / (6 * signed)];
}
function distanceToSegment(point, a, b) {
  const dx = b[0] - a[0]; const dy = b[1] - a[1]; const d = dx * dx + dy * dy;
  const t = d < EPS ? 0 : Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / d));
  return Math.hypot(point[0] - (a[0] + dx * t), point[1] - (a[1] + dy * t));
}
function correctionLandPolygons() { return ANATOLIA_PHYSICAL_COAST_CORRECTIONS.map((c) => c.coordinates ?? []).filter((p) => p.length >= 3 && area(p) >= MIN_AREA); }
function exclusionPolygons() { return ANATOLIA_PHYSICAL_COAST_CORRECTIONS.flatMap((c) => c.exclusionCoordinates ?? []).filter((p) => p.length >= 3 && area(p) >= MIN_AREA); }
function explicitLandControlPoints() { return ANATOLIA_PHYSICAL_COAST_CORRECTIONS.flatMap((c) => [...(c.landControlPoints ?? []), ...(c.controlPoints ?? [])]); }
function isPhysicalInteriorPoint(point) {
  if (!Array.isArray(point) || point.length !== 2) return false;
  if (exclusionPolygons().some((p) => pointInPolygonStrict(point, p))) return false;
  if (ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => pointInPolygonStrict(point, lake.coordinates))) return false;
  if (explicitLandControlPoints().some((control) => point[0] === control[0] && point[1] === control[1])) return true;
  return correctionLandPolygons().some((p) => pointInPolygonStrict(point, p)) || ANATOLIA_PHYSICAL_ATLAS.landPolygons.some((p) => pointInPolygonStrict(point, p));
}
export function isPhysicalLandPoint(point) {
  if (!Array.isArray(point) || point.length !== 2) return false;
  if (exclusionPolygons().some((p) => pointInPolygonStrict(point, p))) return false;
  if (explicitLandControlPoints().some((control) => point[0] === control[0] && point[1] === control[1])) return true;
  if (ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => pointInPolygon(point, lake.coordinates))) return false;
  if (correctionLandPolygons().some((p) => pointInPolygon(point, p)) || ANATOLIA_PHYSICAL_ATLAS.landPolygons.some((p) => pointInPolygon(point, p))) return true;
  return ANATOLIA_PHYSICAL_ATLAS.landPolygons.some((p) => p.some((a, i) => distanceToSegment(point, a, p[(i + 1) % p.length]) <= 0.055));
}
function physicalSources() { return [...ANATOLIA_PHYSICAL_ATLAS.landPolygons, ...correctionLandPolygons()]; }
function resolvePhysicalAnchor(point) {
  if (isPhysicalInteriorPoint(point)) return point;
  let best = null; let bestDistance = Infinity;
  const max = Math.ceil(ANCHOR_SEARCH_RADIUS / ANCHOR_SEARCH_STEP);
  for (let dx = -max; dx <= max; dx += 1) for (let dy = -max; dy <= max; dy += 1) {
    const d = Math.hypot(dx, dy) * ANCHOR_SEARCH_STEP; if (!d || d > ANCHOR_SEARCH_RADIUS || d >= bestDistance) continue;
    const candidate = [point[0] + dx * ANCHOR_SEARCH_STEP, point[1] + dy * ANCHOR_SEARCH_STEP];
    if (isPhysicalInteriorPoint(candidate)) { best = candidate; bestDistance = d; }
  }
  if (best) return best;
  for (const polygon of physicalSources()) {
    const center = polygonCentroid(polygon);
    for (const vertex of polygon) for (const fraction of [0.02, 0.05, 0.1, 0.2]) {
      const candidate = [vertex[0] + (center[0] - vertex[0]) * fraction, vertex[1] + (center[1] - vertex[1]) * fraction];
      if (isPhysicalInteriorPoint(candidate)) { const d = Math.hypot(candidate[0] - point[0], candidate[1] - point[1]); if (d < bestDistance) { best = candidate; bestDistance = d; } }
    }
  }
  if (!best) throw new Error(`No physical-land anchor can be resolved for ${point.join(",")}`);
  return best;
}
function cross(a, b, p) { return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]); }
function halfPlane(polygon, a, b, c) {
  const out = []; const inside = (p) => a * p[0] + b * p[1] <= c + EPS;
  for (let i = 0; i < polygon.length; i += 1) { const cur = polygon[i]; const next = polygon[(i + 1) % polygon.length]; const ci = inside(cur); const ni = inside(next); if (ci && ni) out.push(next); else if (ci !== ni) { const cv = a * cur[0] + b * cur[1] - c; const nv = a * next[0] + b * next[1] - c; const t = Math.abs(cv - nv) < EPS ? 0 : cv / (cv - nv); out.push([cur[0] + (next[0] - cur[0]) * t, cur[1] + (next[1] - cur[1]) * t]); if (!ci && ni) out.push(next); } }
  return out;
}
function powerCell(index, sites, weights) {
  const site = sites[index].point; const own = weights[sites[index].provinceId] ?? 0;
  let polygon = [[BBOX[0], BBOX[1]], [BBOX[2], BBOX[1]], [BBOX[2], BBOX[3]], [BBOX[0], BBOX[3]]];
  for (let other = 0; other < sites.length; other += 1) { if (other === index) continue; const p = sites[other].point; const ow = weights[sites[other].provinceId] ?? 0; const next = halfPlane(polygon, 2 * (p[0] - site[0]), 2 * (p[1] - site[1]), p[0] ** 2 + p[1] ** 2 - site[0] ** 2 - site[1] ** 2 + own - ow); if (next.length >= 3 && pointInPolygon(site, next)) polygon = next; }
  return polygon;
}
function clipPolygon(subject, clip) {
  if (!subject.length || !clip.length) return [];
  let output = subject.slice(); const boundary = signedArea(clip) < 0 ? [...clip].reverse() : clip;
  for (let edge = 0; edge < boundary.length; edge += 1) { if (!output.length) return []; const a = boundary[edge]; const b = boundary[(edge + 1) % boundary.length]; const input = output; output = []; const inside = (p) => cross(a, b, p) >= -EPS; for (let i = 0; i < input.length; i += 1) { const cur = input[i]; const next = input[(i + 1) % input.length]; const ci = inside(cur); const ni = inside(next); if (ci && ni) output.push(next); else if (ci !== ni) { const cv = cross(a, b, cur); const nv = cross(a, b, next); const t = Math.abs(cv - nv) < EPS ? 0 : cv / (cv - nv); output.push([cur[0] + (next[0] - cur[0]) * t, cur[1] + (next[1] - cur[1]) * t]); if (!ci && ni) output.push(next); } } }
  return output;
}
function edgeOnPhysicalLand(polygon) { for (let i = 0; i < polygon.length; i += 1) { const a = polygon[i]; const b = polygon[(i + 1) % polygon.length]; for (const f of EDGE_FRACTIONS) if (!isPhysicalLandPoint([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f])) return false; } return true; }
function polygonIsSafe(polygon, anchor) { return polygon.length >= 3 && area(polygon) >= MIN_AREA && pointInPolygon(anchor, polygon) && polygon.every((p) => isPhysicalLandPoint(p)) && edgeOnPhysicalLand(polygon); }
function anchorFallback(cell, anchor) {
  if (!isPhysicalInteriorPoint(anchor) || !pointInPolygon(anchor, cell)) return [];
  for (const scale of FALLBACK_SCALES) {
    const candidate = cell.map((p) => [anchor[0] + (p[0] - anchor[0]) * scale, anchor[1] + (p[1] - anchor[1]) * scale]);
    if (polygonIsSafe(candidate, anchor)) return [candidate];
  }
  return [];
}
function clipCellToPhysicalLand(cell, anchor) {
  const candidates = physicalSources().map((land) => clipPolygon(land, cell)).filter((p) => p.length >= 3 && area(p) >= MIN_AREA && pointInPolygon(anchor, p));
  const safe = candidates.filter((p) => polygonIsSafe(p, anchor));
  if (safe.length) return [safe.sort((a, b) => area(b) - area(a))[0]];
  return anchorFallback(cell, anchor);
}
function buildControlSites() { return ANATOLIA_PROVINCE_METADATA.map((item) => { const sourcePoint = rawAnchor(item); return { point: resolvePhysicalAnchor(sourcePoint), sourcePoint, provinceId: item.id, kind: "province-anchor" }; }); }
function validateManifest() { const ids = new Set(ANATOLIA_PROVINCE_METADATA.map((item) => item.id)); if (ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST.length !== ids.size) throw new Error("1300 Anatolia geometry manifest is not aligned with province metadata."); for (const entry of ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST) if (!ids.has(entry.id) || !ANATOLIA_1300_PROVINCE_GEOMETRY_KEYS[entry.id] || entry.clipToPhysicalLand !== true) throw new Error(`Invalid 1300 geometry manifest entry: ${entry.id}`); }
function headers(item, type) { return { assetType: type, assetVersion: 13, generator: "Historia AI Phase 2D Geometry Builder V11", provider: "historia-ai-curated-cartography", dataset: "anatolia-province-geometry-1300", historicalDate: "1300-01-01", borderPrecision: item.borderConfidence === "high" ? 3 : 2, sourceFeatureId: item.id, sourceFeatureIndex: null }; }
function provinceAsset(item, polygons) { return { header: headers(item, "province"), identity: { id: item.id, name: item.name }, references: { geometryId: item.id, countryId: item.countryId, capitalCityId: item.cityId }, ownership: { countryId: item.countryId, ownerId: item.historicalControl.controllerAt1300 ?? item.countryId }, historical: { sourceFeatureId: item.id, sourceFeatureIndex: null, sourceName: item.name, subject: item.countryId, partOf: item.regionId, borderPrecision: headers(item, "province").borderPrecision, classification: "phase2d-anatolia-province-geometry", precision: "anchor-safe-physical-partition", anchor: rawAnchor(item), historicalControl: item.historicalControl }, geometry: { coastal: item.coastal, port: item.port, terrain: item.terrain, strategic: item.strategic }, polygons }; }
function geometryAsset(item, polygons) { return { header: headers(item, "geometry"), identity: { provinceId: item.id, name: item.name }, references: { provinceId: item.id, countryId: item.countryId }, ownership: { countryId: item.countryId, ownerId: item.historicalControl.controllerAt1300 ?? item.countryId }, geometry: { type: "MultiPolygon", coordinates: polygons.map((p) => [p]), polygons }, polygons, historical: { sourceFeatureId: item.id, sourceFeatureIndex: null, historicalDate: "1300-01-01", borderPrecision: headers(item, "geometry").borderPrecision } }; }
function areaSummary(partition) { return ANATOLIA_PROVINCE_METADATA.map((item) => ({ provinceId: item.id, area: (partition.get(item.id) ?? []).reduce((s, p) => s + area(p), 0) })); }
function median(values) { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.floor(sorted.length / 2)] ?? 0; }
function buildPartition(sites, weights) { const map = new Map(); for (let index = 0; index < sites.length; index += 1) { const site = sites[index]; const cell = powerCell(index, sites, weights); const polygons = clipCellToPhysicalLand(cell, site.point); if (!polygons.length) throw new Error(`Phase 2D V11 could not construct physical geometry for ${site.provinceId}`); map.set(site.provinceId, polygons.map((p) => p.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]))); } return map; }
function solveWeights(sites) { const weights = Object.fromEntries(sites.map((s) => [s.provinceId, 0])); let partition = buildPartition(sites, weights); for (let iteration = 0; iteration < MAX_WEIGHT_ITERATIONS; iteration += 1) { const summary = areaSummary(partition); const medianArea = median(summary.map((i) => i.area)); if (!medianArea) return { weights, partition, iterations: iteration }; for (const item of summary) weights[item.provinceId] += Math.max(-MAX_WEIGHT_STEP, Math.min(MAX_WEIGHT_STEP, (medianArea - item.area) / Math.max(medianArea, EPS))); const next = buildPartition(sites, weights); const converged = summary.every((item) => Math.abs((next.get(item.provinceId) ?? []).reduce((s, p) => s + area(p), 0) - item.area) < medianArea * 0.005); partition = next; if (converged) return { weights, partition, iterations: iteration + 1 }; } return { weights, partition, iterations: MAX_WEIGHT_ITERATIONS }; }
function samplingSiteCount() { let count = 0; for (let longitude = BBOX[0]; longitude <= BBOX[2] + EPS; longitude += SAMPLE_STEP) for (let latitude = BBOX[1]; latitude <= BBOX[3] + EPS; latitude += SAMPLE_STEP) if (isPhysicalLandPoint([longitude, latitude])) count += 1; return count; }
export function isAnatoliaGeometryPoint(point) { if (!Array.isArray(point) || point.length !== 2) return false; const [longitude, latitude] = point; if (longitude < 25 || longitude > 46 || latitude < 35 || latitude > 43) return false; if (longitude > 26.4 && longitude < 28.9 && latitude > 40.4 && latitude < 41.9) return false; return true; }
export function buildAnatoliaPhase2DAssets() { validateManifest(); const sites = buildControlSites(); for (const site of sites) if (!isAnatoliaGeometryPoint(site.sourcePoint) || !isPhysicalInteriorPoint(site.point)) throw new Error(`Invalid 1300 province anchor: ${site.provinceId} ${site.point.join(",")}`); const solved = solveWeights(sites); const provinces = []; const geometries = []; for (const item of ANATOLIA_PROVINCE_METADATA) { const polygons = solved.partition.get(item.id) ?? []; if (!polygons.length) throw new Error(`Phase 2D produced no polygons for ${item.id}`); provinces.push(provinceAsset(item, polygons)); geometries.push(geometryAsset(item, polygons)); } const physicalSamplingSiteCount = samplingSiteCount(); const polygonCount = geometries.reduce((s, item) => s + item.geometry.polygons.length, 0); return { schemaVersion: 1, geometryVersion: 14, historicalDate: "1300-01-01", provider: "historia-ai-curated-cartography", dataset: "anatolia-province-geometry-1300", projection: "EPSG:4326", method: "one historical province anchor per political cell, deterministic interior physical-anchor resolution, weighted physical-land intersection, anchor-preserving physical fallback, explicit water exclusions, lake-safe validation, dense physical sampling", siteCount: physicalSamplingSiteCount + sites.length, politicalSiteCount: sites.length, physicalSamplingSiteCount, naturalFeatureSiteCount: physicalSamplingSiteCount, barrierSiteCount: 0, supportSiteCount: 0, fallbackProvinceCount: 0, provinceCount: provinces.length, polygonCount, weightIterations: solved.iterations, provinces, geometries, sites }; }
export function isPhysicalLandPointLegacy(point) { return isPhysicalLandPoint(point); }
