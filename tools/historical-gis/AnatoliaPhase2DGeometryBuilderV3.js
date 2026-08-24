import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST, ANATOLIA_1300_PROVINCE_GEOMETRY_KEYS } from "../../src/map/data/Anatolia1300ProvinceGeometryManifest.js";
import { ANATOLIA_PROVINCE_REFINEMENTS, ANATOLIA_ADJACENCY_HINTS, ANATOLIA_STRATEGIC_PASSES, ANATOLIA_RIVER_CROSSINGS } from "../../src/map/data/AnatoliaProvinceRefinement.js";

const BBOX = [25.45, 35.72, 44.85, 42.35];
const EPS = 1e-7;
const MIN_AREA = 0.00005;
const COAST_STEP = 0.16;
const CONTROL_RADII = [0.11, 0.22, 0.34];
const DIRECTIONS = 12;

const sq = (a, b) => ((a[0] - b[0]) ** 2) + ((a[1] - b[1]) ** 2);

function pointInPolygon(point, polygon) {
  let inside = false;
  const [x, y] = point;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i += 1) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / ((yj - yi) || EPS) + xi) inside = !inside;
  }
  return inside;
}

function inLand(point) {
  return ANATOLIA_PHYSICAL_ATLAS.landPolygons.some((polygon) => pointInPolygon(point, polygon));
}

function inLake(point) {
  return ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => pointInPolygon(point, lake.coordinates));
}

// Physical land is the authority: broad sea envelopes must never override land.
// Lakes remain explicit exclusions inside the land polygon.
function isPhysicalLandPoint(point) {
  return inLand(point) && !inLake(point);
}

function segmentDistanceSq(point, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (Math.abs(dx) < EPS && Math.abs(dy) < EPS) return sq(point, a);
  const t = Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / (dx * dx + dy * dy)));
  return sq(point, [a[0] + dx * t, a[1] + dy * t]);
}

function distanceToCoast(point) {
  let best = Infinity;
  for (const polygon of ANATOLIA_PHYSICAL_ATLAS.landPolygons) {
    for (let i = 0; i < polygon.length; i += 1) best = Math.min(best, segmentDistanceSq(point, polygon[i], polygon[(i + 1) % polygon.length]));
  }
  return Math.sqrt(best);
}

function politicalPoint(point) {
  const [lon, lat] = point;
  if (lon < 25.5 || lon > 44.9 || lat < 35.7 || lat > 42.4) return false;
  return isPhysicalLandPoint(point) || (!inLake(point) && distanceToCoast(point) <= 0.035);
}

function province(id) { return ANATOLIA_PROVINCE_METADATA.find((item) => item.id === id) ?? null; }
function rawAnchor(item) { return ANATOLIA_PROVINCE_REFINEMENTS[item.id]?.anchor ?? item.centroid; }

function resolveLandAnchor(point) {
  if (isPhysicalLandPoint(point)) return point;
  let best = null;
  let bestDistance = Infinity;
  for (let r = 0.01; r <= 0.35; r += 0.01) {
    for (let d = 0; d < 32; d += 1) {
      const angle = (d / 32) * Math.PI * 2;
      const candidate = [point[0] + Math.cos(angle) * r, point[1] + Math.sin(angle) * r];
      if (isPhysicalLandPoint(candidate) && sq(candidate, point) < bestDistance) { best = candidate; bestDistance = sq(candidate, point); }
    }
    if (best) return best;
  }
  throw new Error(`No physical-land anchor can be resolved for historical province coordinate ${point.join(",")}`);
}

function anchor(item) { return resolveLandAnchor(rawAnchor(item)); }

function jitter(index, seed) {
  const value = Math.sin((index * 92821 + seed * 68917) * 0.00017) * 43758.5453;
  return (value - Math.floor(value)) - 0.5;
}

function addSite(sites, seen, point, provinceId, kind) {
  if (!politicalPoint(point)) return;
  const key = `${point[0].toFixed(5)}:${point[1].toFixed(5)}:${provinceId}:${kind}`;
  if (seen.has(key)) return;
  seen.add(key);
  sites.push({ point, provinceId, kind });
}

function addProvinceControls(sites, seen) {
  let sequence = 0;
  for (const item of ANATOLIA_PROVINCE_METADATA) {
    const a = anchor(item);
    addSite(sites, seen, a, item.id, "province-anchor");
    for (const radius of CONTROL_RADII) {
      for (let d = 0; d < DIRECTIONS; d += 1) {
        const angle = (d / DIRECTIONS) * Math.PI * 2 + jitter(sequence++, item.id.length) * 0.10;
        const r = radius * (1 + jitter(sequence++, item.name.length) * 0.12);
        addSite(sites, seen, [a[0] + Math.cos(angle) * r, a[1] + Math.sin(angle) * r], item.id, "province-control");
      }
    }
  }
}

function addAdjacencyControls(sites, seen) {
  const emitted = new Set();
  for (const [id, neighbors] of Object.entries(ANATOLIA_ADJACENCY_HINTS)) {
    const a = province(id);
    if (!a) continue;
    for (const neighborId of neighbors) {
      const key = [id, neighborId].sort().join("|");
      if (emitted.has(key)) continue;
      const b = province(neighborId);
      if (!b) continue;
      emitted.add(key);
      const aa = anchor(a);
      const bb = anchor(b);
      const midpoint = [(aa[0] + bb[0]) / 2, (aa[1] + bb[1]) / 2];
      const dx = bb[0] - aa[0];
      const dy = bb[1] - aa[1];
      const length = Math.hypot(dx, dy) || 1;
      const normal = [-dy / length, dx / length];
      addSite(sites, seen, [midpoint[0] + normal[0] * 0.035, midpoint[1] + normal[1] * 0.035], a.id, "historical-border-control");
      addSite(sites, seen, [midpoint[0] - normal[0] * 0.035, midpoint[1] - normal[1] * 0.035], b.id, "historical-border-control");
    }
  }
}

function nearestProvince(point) {
  let winner = ANATOLIA_PROVINCE_METADATA[0];
  let best = Infinity;
  for (const item of ANATOLIA_PROVINCE_METADATA) {
    const d = sq(point, anchor(item));
    if (d < best) { best = d; winner = item; }
  }
  return winner;
}

function addCoastControls(sites, seen) {
  for (const polygon of ANATOLIA_PHYSICAL_ATLAS.landPolygons) {
    for (let i = 0; i < polygon.length - 1; i += 1) {
      const a = polygon[i];
      const b = polygon[i + 1];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const length = Math.hypot(dx, dy) || 1;
      const steps = Math.max(1, Math.ceil(length / COAST_STEP));
      const normal = [-dy / length, dx / length];
      for (let step = 0; step < steps; step += 1) {
        const t = (step + 0.5) / steps;
        const midpoint = [a[0] + dx * t, a[1] + dy * t];
        const candidates = [
          [midpoint[0] + normal[0] * 0.05, midpoint[1] + normal[1] * 0.05],
          [midpoint[0] - normal[0] * 0.05, midpoint[1] - normal[1] * 0.05],
        ];
        const inside = candidates.find((candidate) => politicalPoint(candidate));
        if (inside) addSite(sites, seen, inside, nearestProvince(inside).id, "coastline-interior");
      }
    }
  }
}

function addNaturalControls(sites, seen) {
  for (const feature of [...ANATOLIA_STRATEGIC_PASSES, ...ANATOLIA_RIVER_CROSSINGS]) {
    for (const id of feature.provinces ?? []) {
      const item = province(id);
      if (!item) continue;
      const a = anchor(item);
      const dx = a[0] - feature.coordinate[0];
      const dy = a[1] - feature.coordinate[1];
      const length = Math.hypot(dx, dy) || 1;
      addSite(sites, seen, [feature.coordinate[0] + dx / length * 0.045, feature.coordinate[1] + dy / length * 0.045], id, `natural-feature:${feature.id}`);
    }
  }
}

function clipHalfPlane(polygon, a, b, c) {
  if (!polygon.length) return [];
  const out = [];
  const inside = (p) => a * p[0] + b * p[1] <= c + EPS;
  for (let i = 0; i < polygon.length; i += 1) {
    const current = polygon[i];
    const next = polygon[(i + 1) % polygon.length];
    const ci = inside(current);
    const ni = inside(next);
    if (ci && ni) out.push(next);
    else if (ci !== ni) {
      const cv = a * current[0] + b * current[1] - c;
      const nv = a * next[0] + b * next[1] - c;
      const t = Math.abs(cv - nv) < EPS ? 0 : cv / (cv - nv);
      out.push([current[0] + (next[0] - current[0]) * t, current[1] + (next[1] - current[1]) * t]);
      if (!ci && ni) out.push(next);
    }
  }
  return out;
}

function voronoiCell(index, sites) {
  const site = sites[index].point;
  let polygon = [[BBOX[0], BBOX[1]], [BBOX[2], BBOX[1]], [BBOX[2], BBOX[3]], [BBOX[0], BBOX[3]]];
  for (let other = 0; other < sites.length; other += 1) {
    if (other === index) continue;
    const p = sites[other].point;
    const a = 2 * (p[0] - site[0]);
    const b = 2 * (p[1] - site[1]);
    const c = p[0] ** 2 + p[1] ** 2 - site[0] ** 2 - site[1] ** 2;
    polygon = clipHalfPlane(polygon, a, b, c);
    if (polygon.length < 3) return [];
  }
  return polygon;
}

function area(polygon) {
  let value = 0;
  for (let i = 0; i < polygon.length; i += 1) value += polygon[i][0] * polygon[(i + 1) % polygon.length][1] - polygon[(i + 1) % polygon.length][0] * polygon[i][1];
  return Math.abs(value) / 2;
}

function edgeSamplesAreLand(polygon) {
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    for (const fraction of [0, 0.25, 0.5, 0.75, 1]) {
      const p = [a[0] + (b[0] - a[0]) * fraction, a[1] + (b[1] - a[1]) * fraction];
      if (!isPhysicalLandPoint(p)) return false;
    }
  }
  return true;
}

function shrinkCellToLand(cell, anchorPoint) {
  let result = cell;
  for (let iteration = 0; iteration < 36; iteration += 1) {
    if (result.length >= 3 && area(result) >= MIN_AREA && edgeSamplesAreLand(result)) return result;
    result = result.map((point) => [anchorPoint[0] + (point[0] - anchorPoint[0]) * 0.88, anchorPoint[1] + (point[1] - anchorPoint[1]) * 0.88]);
  }
  return [];
}

function manifestCheck() {
  const ids = new Set(ANATOLIA_PROVINCE_METADATA.map((item) => item.id));
  if (ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST.length !== ids.size) throw new Error("1300 Anatolia geometry manifest is not aligned with province metadata.");
  for (const entry of ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST) {
    if (!ids.has(entry.id) || !ANATOLIA_1300_PROVINCE_GEOMETRY_KEYS[entry.id] || entry.clipToPhysicalLand !== true) throw new Error(`Invalid 1300 geometry manifest entry: ${entry.id}`);
  }
}

function polygonForAsset(item, polygons) {
  const header = { assetType: "province", assetVersion: 6, generator: "Historia AI Phase 2D Geometry Builder", provider: "historia-ai-curated-cartography", dataset: "anatolia-province-geometry-1300", historicalDate: "1300-01-01", borderPrecision: item.borderConfidence === "high" ? 3 : 2, sourceFeatureId: item.id, sourceFeatureIndex: null };
  return { header, identity: { id: item.id, name: item.name }, references: { geometryId: item.id, countryId: item.countryId, capitalCityId: item.cityId }, ownership: { countryId: item.countryId, ownerId: item.historicalControl.controllerAt1300 ?? item.countryId }, historical: { sourceFeatureId: item.id, sourceFeatureIndex: null, sourceName: item.name, subject: item.countryId, partOf: item.regionId, borderPrecision: header.borderPrecision, classification: "phase2d-anatolia-province-geometry", precision: "cartographic-refinement", anchor: rawAnchor(item), historicalControl: item.historicalControl }, geometry: { coastal: item.coastal, port: item.port, terrain: item.terrain, strategic: item.strategic }, polygons };
}

function geometryForAsset(item, polygons) {
  return { header: { assetType: "geometry", assetVersion: 6, generator: "Historia AI Phase 2D Geometry Builder", provider: "historia-ai-curated-cartography", dataset: "anatolia-province-geometry-1300", historicalDate: "1300-01-01", borderPrecision: item.borderConfidence === "high" ? 3 : 2, sourceFeatureId: item.id, sourceFeatureIndex: null }, identity: { id: item.id, provinceId: item.id }, metadata: { sourceFeatureId: item.id, sourceFeatureIndex: null, name: item.name, subject: item.countryId, partOf: item.regionId, borderPrecision: item.borderConfidence === "high" ? 3 : 2, classification: "phase2d-anatolia-province-geometry", precision: "cartographic-refinement", anchor: rawAnchor(item) }, polygons };
}

export function buildAnatoliaPhase2DAssets() {
  manifestCheck();
  const sites = [];
  const seen = new Set();
  addProvinceControls(sites, seen);
  addAdjacencyControls(sites, seen);
  addNaturalControls(sites, seen);
  addCoastControls(sites, seen);

  const byProvince = Object.fromEntries(ANATOLIA_PROVINCE_METADATA.map((item) => [item.id, []]));
  for (let index = 0; index < sites.length; index += 1) {
    const cell = voronoiCell(index, sites);
    if (cell.length < 3) continue;
    const item = province(sites[index].provinceId);
    const clipped = shrinkCellToLand(cell, anchor(item));
    if (clipped.length >= 3 && area(clipped) >= MIN_AREA) byProvince[item.id].push(clipped.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]));
  }

  const provinces = [];
  const geometries = [];
  for (const item of ANATOLIA_PROVINCE_METADATA) {
    if (!byProvince[item.id].length) throw new Error(`Phase 2D produced no physical-land geometry for ${item.id}`);
    provinces.push(polygonForAsset(item, byProvince[item.id]));
    geometries.push(geometryForAsset(item, byProvince[item.id]));
  }

  const naturalFeatureSiteCount = sites.filter((site) => site.kind.startsWith("natural-feature:")).length;
  return { schemaVersion: 1, geometryVersion: 5, historicalDate: "1300-01-01", provider: "historia-ai-curated-cartography", dataset: "anatolia-province-geometry-1300", projection: "EPSG:4326", method: "historical-anchor-and-adjacency cartography with dense province controls, natural-feature controls and land-authoritative coastline controls followed by physical-land validation", siteCount: sites.length, politicalSiteCount: sites.length, barrierSiteCount: 0, naturalFeatureSiteCount, fallbackProvinceCount: 0, provinceCount: provinces.length, polygonCount: geometries.reduce((sum, item) => sum + item.polygons.length, 0), provinces, geometries };
}

export function isAnatoliaGeometryPoint([longitude, latitude]) {
  return longitude >= 26.5 && longitude <= 44.8 && latitude >= 35.7 && latitude <= 41.6;
}

export { isPhysicalLandPoint };
