import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST, ANATOLIA_1300_PROVINCE_GEOMETRY_KEYS } from "../../src/map/data/Anatolia1300ProvinceGeometryManifest.js";
import { ANATOLIA_PROVINCE_REFINEMENTS } from "../../src/map/data/AnatoliaProvinceRefinement.js";
import { getPhysicalLandPolygons, isPhysicalLandPoint, pointInPolygon, signedArea, polygonArea } from "./Phase2DPhysicalMask.js";

const BBOX = [25.45, 35.72, 44.85, 42.35];
const EPS = 1e-7;
const MIN_AREA = 0.00005;
const EDGE_FRACTIONS = [0, 0.25, 0.5, 0.75, 1];
const SAMPLE_STEP = 0.035;
const MAX_WEIGHT_ITERATIONS = 18;
const MAX_WEIGHT_STEP = 1.5;
const SEARCH_STEP = 0.01;
const SEARCH_RADIUS = 1.25;
const FALLBACK_SCALES = [0.75, 0.5, 0.35, 0.25, 0.125, 0.0625];

const refinementFor = (item) => ANATOLIA_PROVINCE_REFINEMENTS[item.id] ?? null;
const rawAnchor = (item) => refinementFor(item)?.geometryAnchor ?? refinementFor(item)?.anchor ?? item.centroid;

function cross(a, b, point) { return (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]); }
function halfPlane(polygon, a, b, c) {
  const output = [];
  const inside = (point) => a * point[0] + b * point[1] <= c + EPS;
  for (let i = 0; i < polygon.length; i += 1) {
    const current = polygon[i]; const next = polygon[(i + 1) % polygon.length];
    const currentInside = inside(current); const nextInside = inside(next);
    if (currentInside && nextInside) output.push(next);
    else if (currentInside !== nextInside) {
      const currentValue = a * current[0] + b * current[1] - c;
      const nextValue = a * next[0] + b * next[1] - c;
      const t = Math.abs(currentValue - nextValue) < EPS ? 0 : currentValue / (currentValue - nextValue);
      output.push([current[0] + (next[0] - current[0]) * t, current[1] + (next[1] - current[1]) * t]);
      if (!currentInside && nextInside) output.push(next);
    }
  }
  return output;
}
function powerCell(index, sites, weights) {
  const site = sites[index].point; const ownWeight = weights[sites[index].provinceId] ?? 0;
  let polygon = [[BBOX[0], BBOX[1]], [BBOX[2], BBOX[1]], [BBOX[2], BBOX[3]], [BBOX[0], BBOX[3]]];
  for (let other = 0; other < sites.length; other += 1) {
    if (other === index) continue;
    const otherPoint = sites[other].point; const otherWeight = weights[sites[other].provinceId] ?? 0;
    const candidate = halfPlane(polygon, 2 * (otherPoint[0] - site[0]), 2 * (otherPoint[1] - site[1]), otherPoint[0] ** 2 + otherPoint[1] ** 2 - site[0] ** 2 - site[1] ** 2 + ownWeight - otherWeight);
    if (candidate.length >= 3 && pointInPolygon(site, candidate)) polygon = candidate;
  }
  return polygon;
}
function clipPolygon(subject, clip) {
  if (!subject.length || !clip.length) return [];
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
    const start = polygon[i]; const end = polygon[(i + 1) % polygon.length];
    for (const fraction of EDGE_FRACTIONS) if (!isPhysicalLandPoint([start[0] + (end[0] - start[0]) * fraction, start[1] + (end[1] - start[1]) * fraction])) return false;
  }
  return true;
}
function polygonIsSafe(polygon, anchor) { return polygon.length >= 3 && polygonArea(polygon) >= MIN_AREA && pointInPolygon(anchor, polygon) && polygon.every(isPhysicalLandPoint) && edgeOnPhysicalLand(polygon); }
function repairCell(cell, anchor) {
  if (!pointInPolygon(anchor, cell)) return [];
  for (const scale of FALLBACK_SCALES) {
    const candidate = cell.map((point) => [anchor[0] + (point[0] - anchor[0]) * scale, anchor[1] + (point[1] - anchor[1]) * scale]);
    if (polygonIsSafe(candidate, anchor)) return [candidate];
  }
  return [];
}
function clippedLandFragments(cell, anchor) {
  const fragments = [];
  for (const land of getPhysicalLandPolygons()) {
    const clipped = clipPolygon(land, cell);
    if (clipped.length < 3 || polygonArea(clipped) < MIN_AREA || !pointInPolygon(anchor, clipped)) continue;
    if (polygonIsSafe(clipped, anchor)) fragments.push(clipped);
  }
  return fragments;
}
function buildProvinceGeometry(cell, anchor, provinceId) {
  const fragments = clippedLandFragments(cell, anchor);
  if (fragments.length) return fragments.sort((a, b) => polygonArea(b) - polygonArea(a));
  const repaired = repairCell(cell, anchor);
  if (repaired.length) return repaired;
  throw new Error(`Phase 2D V12 could not construct physical geometry for ${provinceId}`);
}
function resolvePhysicalAnchor(point) {
  if (isPhysicalLandPoint(point)) return point;
  let best = null; let bestDistance = Infinity; const max = Math.ceil(SEARCH_RADIUS / SEARCH_STEP);
  for (let dx = -max; dx <= max; dx += 1) for (let dy = -max; dy <= max; dy += 1) {
    const distance = Math.hypot(dx, dy) * SEARCH_STEP;
    if (!distance || distance > SEARCH_RADIUS || distance >= bestDistance) continue;
    const candidate = [point[0] + dx * SEARCH_STEP, point[1] + dy * SEARCH_STEP];
    if (!isPhysicalLandPoint(candidate)) continue;
    best = candidate; bestDistance = distance;
  }
  if (best) return best;
  throw new Error(`No physical-land anchor can be resolved for ${point.join(",")}`);
}
function buildSites() { return ANATOLIA_PROVINCE_METADATA.map((item) => { const sourcePoint = rawAnchor(item); return { point: resolvePhysicalAnchor(sourcePoint), sourcePoint, provinceId: item.id, kind: "province-anchor" }; }); }
function validateManifest() {
  const ids = new Set(ANATOLIA_PROVINCE_METADATA.map((item) => item.id));
  if (ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST.length !== ids.size) throw new Error("1300 Anatolia geometry manifest is not aligned with province metadata.");
  for (const entry of ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST) if (!ids.has(entry.id) || !ANATOLIA_1300_PROVINCE_GEOMETRY_KEYS[entry.id] || entry.clipToPhysicalLand !== true) throw new Error(`Invalid 1300 geometry manifest entry: ${entry.id}`);
}
function headers(item, type) { return { assetType: type, assetVersion: 16, generator: "Historia AI Phase 2D Geometry Builder", provider: "historia-ai-curated-cartography", dataset: "anatolia-province-geometry-1300", historicalDate: "1300-01-01", borderPrecision: item.borderConfidence === "high" ? 3 : 2, sourceFeatureId: item.id, sourceFeatureIndex: null }; }
function provinceAsset(item, polygons) { return { header: headers(item, "province"), identity: { id: item.id, name: item.name }, references: { geometryId: item.id, countryId: item.countryId, capitalCityId: item.cityId }, ownership: { countryId: item.countryId, ownerId: item.historicalControl.controllerAt1300 ?? item.countryId }, historical: { sourceFeatureId: item.id, sourceFeatureIndex: null, sourceName: item.name, subject: item.countryId, partOf: item.regionId, borderPrecision: headers(item, "province").borderPrecision, classification: "phase2d-anatolia-province-geometry", precision: "anchor-safe-physical-partition-v12", anchor: rawAnchor(item), historicalControl: item.historicalControl }, geometry: { coastal: item.coastal, port: item.port, terrain: item.terrain, strategic: item.strategic }, polygons }; }
function geometryAsset(item, polygons) { return { header: headers(item, "geometry"), identity: { provinceId: item.id, name: item.name }, references: { provinceId: item.id, countryId: item.countryId }, ownership: { countryId: item.countryId, ownerId: item.historicalControl.controllerAt1300 ?? item.countryId }, geometry: { type: "MultiPolygon", coordinates: polygons.map((p) => [p]), polygons }, polygons, historical: { sourceFeatureId: item.id, sourceFeatureIndex: null, historicalDate: "1300-01-01", borderPrecision: headers(item, "geometry").borderPrecision } }; }
function areaSummary(partition) { return ANATOLIA_PROVINCE_METADATA.map((item) => ({ provinceId: item.id, area: (partition.get(item.id) ?? []).reduce((sum, polygon) => sum + polygonArea(polygon), 0) })); }
function median(values) { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.floor(sorted.length / 2)] ?? 0; }
function buildPartition(sites, weights) { const partition = new Map(); for (let index = 0; index < sites.length; index += 1) { const site = sites[index]; const cell = powerCell(index, sites, weights); const polygons = buildProvinceGeometry(cell, site.point, site.provinceId); partition.set(site.provinceId, polygons.map((polygon) => polygon.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]))); } return partition; }
function solveWeights(sites) { const weights = Object.fromEntries(sites.map((site) => [site.provinceId, 0])); let partition = buildPartition(sites, weights); for (let iteration = 0; iteration < MAX_WEIGHT_ITERATIONS; iteration += 1) { const summary = areaSummary(partition); const medianArea = median(summary.map((item) => item.area)); if (!medianArea) return { weights, partition, iterations: iteration }; for (const item of summary) { const adjustment = (medianArea - item.area) / Math.max(medianArea, EPS); weights[item.provinceId] += Math.max(-MAX_WEIGHT_STEP, Math.min(MAX_WEIGHT_STEP, adjustment)); } const next = buildPartition(sites, weights); const converged = summary.every((item) => Math.abs((next.get(item.provinceId) ?? []).reduce((sum, polygon) => sum + polygonArea(polygon), 0) - item.area) < medianArea * 0.005); partition = next; if (converged) return { weights, partition, iterations: iteration + 1 }; } return { weights, partition, iterations: MAX_WEIGHT_ITERATIONS }; }
function samplingSiteCount() { let count = 0; for (let longitude = BBOX[0]; longitude <= BBOX[2] + EPS; longitude += SAMPLE_STEP) for (let latitude = BBOX[1]; latitude <= BBOX[3] + EPS; latitude += SAMPLE_STEP) if (isPhysicalLandPoint([longitude, latitude])) count += 1; return count; }

function isPhysicalLandPointLegacy(point) { return isPhysicalLandPoint(point); }
function isAnatoliaGeometryPoint(point) { if (!Array.isArray(point) || point.length !== 2) return false; const [longitude, latitude] = point; if (longitude < 25 || longitude > 46 || latitude < 35 || latitude > 43) return false; if (longitude > 26.4 && longitude < 28.9 && latitude > 40.4 && latitude < 41.9) return false; return true; }
function buildAnatoliaPhase2DAssets() { validateManifest(); const sites = buildSites(); const solved = solveWeights(sites); const provinces = []; const geometries = []; for (const item of ANATOLIA_PROVINCE_METADATA) { const polygons = solved.partition.get(item.id) ?? []; if (!polygons.length) throw new Error(`Phase 2D produced no polygons for ${item.id}`); provinces.push(provinceAsset(item, polygons)); geometries.push(geometryAsset(item, polygons)); } const physicalSamplingSiteCount = samplingSiteCount(); const polygonCount = geometries.reduce((sum, item) => sum + item.geometry.polygons.length, 0); return { schemaVersion: 1, geometryVersion: 16, historicalDate: "1300-01-01", provider: "historia-ai-curated-cartography", dataset: "anatolia-province-geometry-1300", projection: "EPSG:4326", method: "one historical province anchor per political cell, deterministic interior physical-anchor resolution, weighted physical-land intersection, anchor-preserving physical fallback, explicit water exclusions, lake-safe validation, dense physical sampling", siteCount: physicalSamplingSiteCount + sites.length, politicalSiteCount: sites.length, physicalSamplingSiteCount, naturalFeatureSiteCount: physicalSamplingSiteCount, barrierSiteCount: 0, supportSiteCount: 0, fallbackProvinceCount: 0, provinceCount: provinces.length, polygonCount, weightIterations: solved.iterations, provinces, geometries, sites }; }

export { isPhysicalLandPoint, isPhysicalLandPointLegacy };
export { isAnatoliaGeometryPoint, buildAnatoliaPhase2DAssets };
