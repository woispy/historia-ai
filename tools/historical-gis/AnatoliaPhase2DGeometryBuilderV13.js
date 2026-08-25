import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PHYSICAL_COAST_CORRECTIONS } from "../../src/map/data/AnatoliaPhysicalCoastCorrections.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST, ANATOLIA_1300_PROVINCE_GEOMETRY_KEYS } from "../../src/map/data/Anatolia1300ProvinceGeometryManifest.js";
import { ANATOLIA_PROVINCE_REFINEMENTS, ANATOLIA_STRATEGIC_PASSES, ANATOLIA_RIVER_CROSSINGS } from "../../src/map/data/AnatoliaProvinceRefinement.js";

const BBOX = [25.45, 35.72, 44.85, 42.35];
const EPS = 1e-7;
const MIN_AREA = 0.00005;
const SAMPLE_STEP = 0.06;
const EDGE_FRACTIONS = [0, 0.25, 0.5, 0.75, 1];
const MAX_AREA_RATIO = 4.2;
const MAX_WEIGHT_ITERATIONS = 24;
const MAX_WEIGHT_STEP = 4;
const MAX_ANCHOR_SNAP_DISTANCE = 1.2;
const rawAnchor = (item) => ANATOLIA_PROVINCE_REFINEMENTS[item.id]?.anchor ?? item.centroid;

function pointInPolygon(point, polygon) {
  if (!polygon?.length) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i += 1) {
    const a = polygon[i]; const b = polygon[j];
    if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / ((b[1] - a[1]) || EPS) + a[0]) inside = !inside;
  }
  return inside;
}
function signedArea(polygon) {
  let sum = 0;
  for (let i = 0; i < polygon.length; i += 1) sum += polygon[i][0] * polygon[(i + 1) % polygon.length][1] - polygon[(i + 1) % polygon.length][0] * polygon[i][1];
  return sum / 2;
}
function area(polygon) { return Math.abs(signedArea(polygon)); }
function cross(a, b, point) { return (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]); }
function coreLandPolygons() {
  return [...ANATOLIA_PHYSICAL_ATLAS.landPolygons, ...ANATOLIA_PHYSICAL_COAST_CORRECTIONS.map((item) => item.coordinates)].filter((polygon) => polygon.length >= 3 && area(polygon) >= MIN_AREA);
}
const LAND_POLYGONS = coreLandPolygons();
function inLake(point) { return ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => pointInPolygon(point, lake.coordinates)); }
function isPhysicalLandPoint(point) { return LAND_POLYGONS.some((polygon) => pointInPolygon(point, polygon)) && !inLake(point); }
function nearestLandPoint(point) {
  if (isPhysicalLandPoint(point)) return point;
  let best = null; let bestDistance = Infinity;
  for (const polygon of LAND_POLYGONS) for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i]; const b = polygon[(i + 1) % polygon.length]; const dx = b[0] - a[0]; const dy = b[1] - a[1]; const d = dx * dx + dy * dy;
    const t = d < EPS ? 0 : Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / d));
    const candidate = [a[0] + dx * t, a[1] + dy * t]; const distance = Math.hypot(point[0] - candidate[0], point[1] - candidate[1]);
    if (distance < bestDistance) { bestDistance = distance; best = candidate; }
  }
  if (!best || bestDistance > MAX_ANCHOR_SNAP_DISTANCE) throw new Error(`Historical province anchor is too far from physical land: ${point.join(",")} (${bestDistance.toFixed(3)}°)`);
  return best;
}
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
  const site = sites[index].point; const ownWeight = weights[sites[index].provinceId] ?? 0;
  let polygon = [[BBOX[0], BBOX[1]], [BBOX[2], BBOX[1]], [BBOX[2], BBOX[3]], [BBOX[0], BBOX[3]]];
  for (let other = 0; other < sites.length; other += 1) {
    if (other === index) continue;
    const p = sites[other].point; const otherWeight = weights[sites[other].provinceId] ?? 0;
    polygon = halfPlane(polygon, 2 * (p[0] - site[0]), 2 * (p[1] - site[1]), p[0] ** 2 + p[1] ** 2 - site[0] ** 2 - site[1] ** 2 + ownWeight - otherWeight);
    if (polygon.length < 3) return [];
  }
  return polygon;
}
function clipLandByCell(land, cell) {
  let output = land.slice(); const clip = signedArea(cell) < 0 ? [...cell].reverse() : cell;
  for (let edge = 0; edge < clip.length; edge += 1) {
    if (!output.length) return [];
    const a = clip[edge]; const b = clip[(edge + 1) % clip.length]; const input = output; output = [];
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
function clipCellToLand(cell, anchorPoint) {
  const candidates = LAND_POLYGONS.map((land) => clipLandByCell(land, cell)).filter((polygon) => polygon.length >= 3 && area(polygon) >= MIN_AREA);
  const containing = candidates.filter((polygon) => pointInPolygon(anchorPoint, polygon));
  const selected = (containing.length ? containing : candidates).sort((a, b) => area(b) - area(a))[0];
  return selected ? [selected] : [];
}
function edgeOnPhysicalLand(polygon) {
  for (let i = 0; i < polygon.length; i += 1) {
    const start = polygon[i]; const end = polygon[(i + 1) % polygon.length];
    for (const fraction of EDGE_FRACTIONS) {
      const point = [start[0] + (end[0] - start[0]) * fraction, start[1] + (end[1] - start[1]) * fraction];
      if (!isPhysicalLandPoint(point)) return false;
    }
  }
  return true;
}
function buildControlSites() { return ANATOLIA_PROVINCE_METADATA.map((item) => ({ point: nearestLandPoint(rawAnchor(item)), historicalAnchor: rawAnchor(item), provinceId: item.id, kind: "province-anchor" })); }
function polygonCentroid(polygon) { return polygon.reduce((sum, [x, y]) => [sum[0] + x, sum[1] + y], [0, 0]).map((value) => value / polygon.length); }
function median(values) { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.floor(sorted.length / 2)]; }
function buildPartition(sites, weights) {
  const result = new Map();
  for (let index = 0; index < sites.length; index += 1) {
    const site = sites[index]; const cell = powerCell(index, sites, weights); if (!cell.length) throw new Error(`Phase 2D V13 empty power cell: ${site.provinceId}`);
    const polygon = clipCellToLand(cell, site.point)[0]; if (!polygon || !edgeOnPhysicalLand(polygon)) throw new Error(`Phase 2D V13 produced invalid physical-land geometry: ${site.provinceId}`);
    result.set(site.provinceId, polygon.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]));
  }
  return result;
}
function solveWeights(sites) {
  const weights = Object.fromEntries(sites.map((site) => [site.provinceId, 0])); let partition = buildPartition(sites, weights);
  for (let iteration = 0; iteration < MAX_WEIGHT_ITERATIONS; iteration += 1) {
    const summary = [...partition.entries()].map(([id, polygon]) => ({ id, area: area(polygon) })); const medianArea = median(summary.map((item) => item.area));
    const oversized = summary.filter((item) => item.area > medianArea * MAX_AREA_RATIO); if (!oversized.length) return { weights, partition, iterations: iteration };
    for (const item of oversized) { const ratio = item.area / medianArea; weights[item.id] -= Math.min(MAX_WEIGHT_STEP, Math.max(0.25, (ratio - MAX_AREA_RATIO) * 1.5)); }
    partition = buildPartition(sites, weights);
  }
  const summary = [...partition.values()].map(area); const medianArea = median(summary); const maxArea = Math.max(...summary);
  if (maxArea > medianArea * MAX_AREA_RATIO) throw new Error(`Phase 2D V13 could not bound province area ratio: max ${maxArea.toFixed(3)} vs median ${medianArea.toFixed(3)}`);
  return { weights, partition, iterations: MAX_WEIGHT_ITERATIONS };
}
function validateManifest() {
  const ids = new Set(ANATOLIA_PROVINCE_METADATA.map((item) => item.id));
  if (ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST.length !== ids.size) throw new Error("1300 Anatolia geometry manifest is not aligned with province metadata.");
  for (const entry of ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST) if (!ids.has(entry.id) || !ANATOLIA_1300_PROVINCE_GEOMETRY_KEYS[entry.id] || entry.clipToPhysicalLand !== true) throw new Error(`Invalid 1300 geometry manifest entry: ${entry.id}`);
}
function headers(item, type) { return { assetType: type, assetVersion: 14, generator: "Historia AI Phase 2D Geometry Builder V13", provider: "historia-ai-curated-cartography", dataset: "anatolia-province-geometry-1300", historicalDate: "1300-01-01", borderPrecision: item.borderConfidence === "high" ? 3 : 2, sourceFeatureId: item.id, sourceFeatureIndex: null }; }
function provinceAsset(item, polygon, holes, site) { return { header: headers(item, "province"), identity: { id: item.id, name: item.name }, references: { geometryId: item.id, countryId: item.countryId, capitalCityId: item.cityId }, ownership: { countryId: item.countryId, ownerId: item.historicalControl.controllerAt1300 ?? item.countryId }, historical: { sourceFeatureId: item.id, sourceFeatureIndex: null, sourceName: item.name, subject: item.countryId, partOf: item.regionId, borderPrecision: headers(item, "province").borderPrecision, classification: "phase2d-anatolia-province-geometry", precision: "single-anchor-weighted-land-partition-with-lake-holes", anchor: site.point, historicalAnchor: site.historicalAnchor, historicalControl: item.historicalControl }, geometry: { coastal: item.coastal, port: item.port, terrain: item.terrain, strategic: item.strategic }, polygons: [polygon], holes }; }
function geometryAsset(item, polygon, holes, site) { return { header: headers(item, "geometry"), identity: { id: item.id, provinceId: item.id }, metadata: { sourceFeatureId: item.id, sourceFeatureIndex: null, name: item.name, subject: item.countryId, partOf: item.regionId, borderPrecision: headers(item, "geometry").borderPrecision, classification: "phase2d-anatolia-province-geometry", precision: "single-anchor-weighted-land-partition-with-lake-holes", anchor: site.point, historicalAnchor: site.historicalAnchor }, polygons: [polygon], holes }; }
function samplingSiteCount() { let count = 0; for (let longitude = BBOX[0]; longitude <= BBOX[2] + EPS; longitude += SAMPLE_STEP) for (let latitude = BBOX[1]; latitude <= BBOX[3] + EPS; latitude += SAMPLE_STEP) if (isPhysicalLandPoint([longitude, latitude])) count += 1; return count; }

export function buildAnatoliaPhase2DAssets() {
  validateManifest(); const sites = buildControlSites();
  for (const site of sites) if (!isAnatoliaGeometryPoint(site.point) || !isPhysicalLandPoint(site.point)) throw new Error(`Invalid snapped 1300 province anchor: ${site.provinceId} ${site.point.join(",")}`);
  const solved = solveWeights(sites); const provinces = []; const geometries = [];
  for (const item of ANATOLIA_PROVINCE_METADATA) {
    const site = sites.find((candidate) => candidate.provinceId === item.id); const polygon = solved.partition.get(item.id); if (!polygon) throw new Error(`Phase 2D V13 produced no geometry for ${item.id}`);
    const holes = ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.filter((lake) => pointInPolygon(polygonCentroid(lake.coordinates), polygon)).map((lake) => lake.coordinates);
    provinces.push(provinceAsset(item, polygon, holes, site)); geometries.push(geometryAsset(item, polygon, holes, site));
  }
  const naturalFeatureSiteCount = [...ANATOLIA_STRATEGIC_PASSES, ...ANATOLIA_RIVER_CROSSINGS].reduce((count, feature) => count + (feature.provinces?.length ?? 0), 0); const physicalSamplingSiteCount = samplingSiteCount();
  return { schemaVersion: 1, geometryVersion: 16, historicalDate: "1300-01-01", provider: "historia-ai-curated-cartography", dataset: "anatolia-province-geometry-1300", projection: "EPSG:4326", method: "38 historical province identities, land-snapped historical anchors, deterministic weighted power partition, physical-land clipping, explicit lake holes, no support-control fragments", siteCount: physicalSamplingSiteCount + sites.length + naturalFeatureSiteCount, politicalSiteCount: sites.length, physicalSamplingSiteCount, barrierSiteCount: 0, naturalFeatureSiteCount, supportSiteCount: 0, fallbackProvinceCount: 0, provinceCount: provinces.length, polygonCount: geometries.length, weightIterations: solved.iterations, provinces, geometries };
}
export function isAnatoliaGeometryPoint([longitude, latitude]) {
  if (longitude < 26.5 || longitude > 44.8 || latitude < 35.7 || latitude > 42.2) return false;
  const exclusion = [[26.5, 42.2], [29.5, 42.2], [29.5, 41.25], [29.05, 40.72], [28.45, 40.48], [27.55, 40.45], [26.5, 40.65]];
  return !pointInPolygon([longitude, latitude], exclusion);
}
export { isPhysicalLandPoint };