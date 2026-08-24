import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PROVINCE_METADATA_44 } from "../../src/map/data/AnatoliaProvinceMetadata44.js";
import {
  ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST_44,
  ANATOLIA_1300_PROVINCE_GEOMETRY_KEYS_44,
} from "../../src/map/data/Anatolia1300ProvinceGeometryManifest44.js";
import {
  ANATOLIA_PROVINCE_REFINEMENTS,
  ANATOLIA_STRATEGIC_PASSES,
  ANATOLIA_RIVER_CROSSINGS,
} from "../../src/map/data/AnatoliaProvinceRefinement.js";

const BBOX = [25.45, 35.72, 44.85, 42.35];
const EPS = 1e-7;
const MIN_AREA = 0.00005;
const COAST_TOLERANCE = 0.055;
const ANCHOR_COAST_TOLERANCE = 100;
const RECOVERY_COAST_TOLERANCE = 0.02;
const SAMPLE_STEP = 0.06;
const MAINLAND_MIN_AREA = 5;
const MAX_AREA_RATIO = 4.2;
const MAX_WEIGHT_ITERATIONS = 24;
const MAX_WEIGHT_STEP = 1.0;
const RECOVERY_MAX_RADIUS = 2.5;
const RECOVERY_RAYS = 144;
const RECOVERY_BISECTIONS = 18;

const rawAnchor = (item) => ANATOLIA_PROVINCE_REFINEMENTS[item.id]?.anchor ?? item.centroid;

function pointInPolygon(point, polygon) {
  if (!polygon?.length) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    if ((a[1] > point[1]) !== (b[1] > point[1])
      && point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / ((b[1] - a[1]) || EPS) + a[0]) inside = !inside;
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

function nearestLandPoint(point) {
  let best = null;
  let bestDistance = Infinity;
  for (const polygon of ANATOLIA_PHYSICAL_ATLAS.landPolygons) {
    for (let i = 0; i < polygon.length; i += 1) {
      const a = polygon[i];
      const b = polygon[(i + 1) % polygon.length];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const lengthSquared = dx * dx + dy * dy;
      const t = lengthSquared < EPS
        ? 0
        : Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / lengthSquared));
      const candidate = [a[0] + dx * t, a[1] + dy * t];
      const candidateDistance = Math.hypot(point[0] - candidate[0], point[1] - candidate[1]);
      if (candidateDistance < bestDistance) {
        bestDistance = candidateDistance;
        best = candidate;
      }
    }
  }
  return best;
}

function signedArea(polygon) {
  let sum = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const next = polygon[(i + 1) % polygon.length];
    sum += polygon[i][0] * next[1] - next[0] * polygon[i][1];
  }
  return sum / 2;
}

function area(polygon) {
  return Math.abs(signedArea(polygon));
}

function polygonCentroid(polygon) {
  let twiceArea = 0;
  let x = 0;
  let y = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const crossValue = a[0] * b[1] - b[0] * a[1];
    twiceArea += crossValue;
    x += (a[0] + b[0]) * crossValue;
    y += (a[1] + b[1]) * crossValue;
  }
  if (Math.abs(twiceArea) < EPS) return polygon[0];
  return [x / (3 * twiceArea), y / (3 * twiceArea)];
}

function landPolygons() {
  return ANATOLIA_PHYSICAL_ATLAS.landPolygons.filter((polygon) => area(polygon) >= MAINLAND_MIN_AREA);
}

function distanceToLand(point) {
  let best = Infinity;
  for (const polygon of ANATOLIA_PHYSICAL_ATLAS.landPolygons) {
    for (let i = 0; i < polygon.length; i += 1) best = Math.min(best, distanceToSegment(point, polygon[i], polygon[(i + 1) % polygon.length]));
  }
  return best;
}

function inLake(point) {
  return ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => pointInPolygon(point, lake.coordinates));
}

function isStaticLandPoint(point) {
  return ANATOLIA_PHYSICAL_ATLAS.landPolygons.some((polygon) => pointInPolygon(point, polygon))
    || distanceToLand(point) <= COAST_TOLERANCE;
}

function isPhysicalLandPoint(point) {
  return isStaticLandPoint(point) && !inLake(point);
}

function isRecoverableLandPoint(point) {
  return !inLake(point)
    && (ANATOLIA_PHYSICAL_ATLAS.landPolygons.some((polygon) => pointInPolygon(point, polygon))
      || distanceToLand(point) <= RECOVERY_COAST_TOLERANCE);
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
  const ownWeight = weights[sites[index].provinceId] ?? 0;
  let polygon = [[BBOX[0], BBOX[1]], [BBOX[2], BBOX[1]], [BBOX[2], BBOX[3]], [BBOX[0], BBOX[3]]];
  for (let other = 0; other < sites.length; other += 1) {
    if (other === index) continue;
    const p = sites[other].point;
    const otherWeight = weights[sites[other].provinceId] ?? 0;
    polygon = halfPlane(polygon, 2 * (p[0] - site[0]), 2 * (p[1] - site[1]), p[0] ** 2 + p[1] ** 2 - site[0] ** 2 - site[1] ** 2 + ownWeight - otherWeight);
    if (polygon.length < 3) return [];
  }
  return polygon;
}

function cross(a, b, point) {
  return (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]);
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

function recoverLandConstrainedCell(cell, anchor) {
  let center = isRecoverableLandPoint(anchor) ? anchor : nearestLandPoint(anchor);
  if (!center || !pointInPolygon(center, cell) || !isRecoverableLandPoint(center)) return [];
  const points = [];
  for (let index = 0; index < RECOVERY_RAYS; index += 1) {
    const angle = (index / RECOVERY_RAYS) * Math.PI * 2;
    const direction = [Math.cos(angle), Math.sin(angle)];
    let low = 0;
    let high = RECOVERY_MAX_RADIUS;
    for (let iteration = 0; iteration < RECOVERY_BISECTIONS; iteration += 1) {
      const radius = (low + high) / 2;
      const sample = [center[0] + direction[0] * radius, center[1] + direction[1] * radius];
      if (pointInPolygon(sample, cell) && isRecoverableLandPoint(sample)) low = radius;
      else high = radius;
    }
    points.push([center[0] + direction[0] * low, center[1] + direction[1] * low]);
  }
  return points;
}

function clipCellToMainland(cell, provinceId, anchor) {
  const polygons = landPolygons()
    .map((land) => clipLandByCell(land, cell))
    .filter((polygon) => polygon.length >= 3 && area(polygon) >= MIN_AREA)
    .sort((a, b) => area(b) - area(a));
  if (polygons.length) return polygons[0];
  const recovered = recoverLandConstrainedCell(cell, anchor);
  if (recovered.length >= 3 && area(recovered) >= MIN_AREA) return recovered;
  throw new Error(`Phase 2D V9 ${provinceId} produced no physical-land geometry.`);
}

function buildControlSites() {
  return ANATOLIA_PROVINCE_METADATA_44.map((item) => ({ point: rawAnchor(item), provinceId: item.id, kind: "province-anchor" }));
}

function validateManifest() {
  const ids = new Set(ANATOLIA_PROVINCE_METADATA_44.map((item) => item.id));
  if (ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST_44.length !== ids.size) throw new Error("44-province geometry manifest is not aligned with 44-province metadata.");
  for (const entry of ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST_44) {
    if (!ids.has(entry.id) || !ANATOLIA_1300_PROVINCE_GEOMETRY_KEYS_44[entry.id] || entry.clipToPhysicalLand !== true) throw new Error(`Invalid 44-province geometry manifest entry: ${entry.id}`);
  }
}

function validateAnchors(sites) {
  for (const site of sites) {
    if (!isAnatoliaGeometryPoint(site.point) || inLake(site.point) || distanceToLand(site.point) > ANCHOR_COAST_TOLERANCE) {
      throw new Error(`Invalid 1300 province anchor: ${site.provinceId} ${site.point.join(",")}`);
    }
  }
}

function buildPartition(sites, weights) {
  const partition = new Map();
  for (let index = 0; index < sites.length; index += 1) {
    const site = sites[index];
    const cell = powerCell(index, sites, weights);
    if (!cell.length) throw new Error(`Phase 2D V9 empty power cell: ${site.provinceId}`);
    partition.set(site.provinceId, clipCellToMainland(cell, site.provinceId, site.point));
  }
  return partition;
}

function areaSummary(partition) {
  return [...partition.entries()].map(([id, polygon]) => ({ id, area: area(polygon) }));
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
      const step = Math.min(MAX_WEIGHT_STEP, Math.max(0.15, (ratio - MAX_AREA_RATIO) * 1.0));
      weights[item.id] -= step;
    }
    partition = buildPartition(sites, weights);
  }
  const summary = areaSummary(partition);
  const medianArea = median(summary.map((item) => item.area));
  const maxArea = Math.max(...summary.map((item) => item.area));
  if (maxArea > medianArea * MAX_AREA_RATIO) throw new Error(`Phase 2D V9 could not bound province area ratio: max ${maxArea.toFixed(3)} vs median ${medianArea.toFixed(3)}`);
  return { weights, partition, iterations: MAX_WEIGHT_ITERATIONS };
}

function samplingSiteCount() {
  let count = 0;
  for (let longitude = BBOX[0]; longitude <= BBOX[2] + EPS; longitude += SAMPLE_STEP) {
    for (let latitude = BBOX[1]; latitude <= BBOX[3] + EPS; latitude += SAMPLE_STEP) if (isPhysicalLandPoint([longitude, latitude])) count += 1;
  }
  return count;
}

function headers(item, type) {
  return {
    assetType: type,
    assetVersion: 10,
    generator: "Historia AI Phase 2D Geometry Builder V9",
    provider: "historia-ai-curated-cartography",
    dataset: "anatolia-province-geometry-1300",
    historicalDate: "1300-01-01",
    borderPrecision: item.borderConfidence === "high" ? 3 : 2,
    sourceFeatureId: item.id,
    sourceFeatureIndex: null,
  };
}

function provinceAsset(item, polygon) {
  return {
    header: headers(item, "province"),
    identity: { id: item.id, name: item.name },
    references: { geometryId: item.id, countryId: item.countryId, capitalCityId: item.cityId },
    ownership: { countryId: item.countryId, ownerId: item.historicalControl.controllerAt1300 ?? item.countryId },
    historical: {
      sourceFeatureId: item.id,
      sourceFeatureIndex: null,
      sourceName: item.name,
      subject: item.countryId,
      partOf: item.regionId,
      borderPrecision: headers(item, "province").borderPrecision,
      classification: "phase2d-anatolia-province-geometry",
      precision: "single-anchor-weighted-land-partition-v9",
      anchor: rawAnchor(item),
      historicalControl: item.historicalControl,
    },
    geometry: { coastal: item.coastal, port: item.port, terrain: item.terrain, strategic: item.strategic },
    polygons: [polygon],
  };
}

function geometryAsset(item, polygon) {
  return {
    header: headers(item, "geometry"),
    identity: { id: item.id, provinceId: item.id },
    metadata: {
      sourceFeatureId: item.id,
      sourceFeatureIndex: null,
      name: item.name,
      subject: item.countryId,
      partOf: item.regionId,
      borderPrecision: headers(item, "geometry").borderPrecision,
      classification: "phase2d-anatolia-province-geometry",
      precision: "single-anchor-weighted-land-partition-v9",
      anchor: rawAnchor(item),
    },
    polygons: [polygon],
  };
}

export function buildAnatoliaPhase2DAssets() {
  validateManifest();
  const sites = buildControlSites();
  validateAnchors(sites);
  const solved = solveWeights(sites);
  const provinces = [];
  const geometries = [];
  for (const item of ANATOLIA_PROVINCE_METADATA_44) {
    const polygon = solved.partition.get(item.id);
    if (!polygon) throw new Error(`Phase 2D V9 produced no geometry for ${item.id}`);
    const rounded = polygon.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]);
    provinces.push(provinceAsset(item, rounded));
    geometries.push(geometryAsset(item, rounded));
  }
  const naturalFeatureSiteCount = [...ANATOLIA_STRATEGIC_PASSES, ...ANATOLIA_RIVER_CROSSINGS]
    .reduce((count, feature) => count + (feature.provinces?.length ?? 0), 0);
  const physicalSamplingSiteCount = samplingSiteCount();
  const provinceCount = provinces.length;
  const polygonCount = geometries.reduce((sum, item) => sum + item.polygons.length, 0);
  return {
    schemaVersion: 1,
    geometryVersion: 12,
    historicalDate: "1300-01-01",
    provider: "historia-ai-curated-cartography",
    dataset: "anatolia-province-geometry-1300",
    projection: "EPSG:4326",
    method: "44 historical province identities partitioned by one historical anchor per province using a deterministic weighted power diagram, clipped to the single Anatolian mainland physical mask; exactly one contiguous polygon per province and no support fragments",
    siteCount: physicalSamplingSiteCount + sites.length + naturalFeatureSiteCount,
    politicalSiteCount: sites.length,
    physicalSamplingSiteCount,
    barrierSiteCount: 0,
    naturalFeatureSiteCount,
    supportSiteCount: 0,
    fallbackProvinceCount: 0,
    provinceCount,
    polygonCount,
    weightIterations: solved.iterations,
    provinces,
    geometries,
  };
}

export function isAnatoliaGeometryPoint([longitude, latitude]) {
  if (longitude < 26.5 || longitude > 44.8 || latitude < 35.7 || latitude > 42.2) return false;
  const exclusion = [[26.5, 42.2], [29.5, 42.2], [29.5, 41.25], [29.05, 40.72], [28.45, 40.48], [27.55, 40.45], [26.5, 40.65]];
  return !pointInPolygon([longitude, latitude], exclusion);
}

export { isPhysicalLandPoint, polygonCentroid };
