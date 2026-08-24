import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PHYSICAL_COAST_CORRECTIONS } from "../../src/map/data/AnatoliaPhysicalCoastCorrections.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST, ANATOLIA_1300_PROVINCE_GEOMETRY_KEYS } from "../../src/map/data/Anatolia1300ProvinceGeometryManifest.js";
import { ANATOLIA_PROVINCE_REFINEMENTS, ANATOLIA_STRATEGIC_PASSES, ANATOLIA_RIVER_CROSSINGS } from "../../src/map/data/AnatoliaProvinceRefinement.js";

const BBOX = [25.45, 35.72, 44.85, 42.35];
const EPS = 1e-7;
const MIN_AREA = 0.00005;
const EDGE_FRACTIONS = [0, 0.25, 0.5, 0.75, 1];
const BOUNDARY_SAMPLE_STEP = 0.06;
const MAX_AREA_RATIO = 4.2;
const MAX_WEIGHT_ITERATIONS = 24;
const MAX_WEIGHT_STEP = 4;
const FEATURE_WEIGHT_STEP = 0.01;
const ANCHOR_GRID_STEP = 0.005;
const ANCHOR_GRID_RADIUS = 0.35;
const MAX_ANCHOR_SNAP_DISTANCE = 1.2;

const rawAnchor = (item) => ANATOLIA_PROVINCE_REFINEMENTS[item.id]?.anchor ?? item.centroid;

function pointOnSegment(point, start, end) {
  const crossValue = (end[0] - start[0]) * (point[1] - start[1]) - (end[1] - start[1]) * (point[0] - start[0]);
  if (Math.abs(crossValue) > EPS) return false;
  return point[0] >= Math.min(start[0], end[0]) - EPS
    && point[0] <= Math.max(start[0], end[0]) + EPS
    && point[1] >= Math.min(start[1], end[1]) - EPS
    && point[1] <= Math.max(start[1], end[1]) + EPS;
}

function pointInPolygon(point, polygon) {
  if (!polygon?.length) return false;
  for (let index = 0; index < polygon.length; index += 1) {
    if (pointOnSegment(point, polygon[index], polygon[(index + 1) % polygon.length])) return true;
  }
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if ((a[1] > point[1]) !== (b[1] > point[1])
      && point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / ((b[1] - a[1]) || EPS) + a[0]) inside = !inside;
  }
  return inside;
}

function signedArea(polygon) {
  let sum = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const next = (index + 1) % polygon.length;
    sum += polygon[index][0] * polygon[next][1] - polygon[next][0] * polygon[index][1];
  }
  return sum / 2;
}

function area(polygon) { return Math.abs(signedArea(polygon)); }
function cross(a, b, point) { return (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]); }

function coreLandPolygons() {
  return [
    ...ANATOLIA_PHYSICAL_ATLAS.landPolygons,
    ...ANATOLIA_PHYSICAL_COAST_CORRECTIONS.map((item) => item.coordinates),
  ].filter((polygon) => polygon.length >= 3 && area(polygon) >= MIN_AREA);
}

const LAND_POLYGONS = coreLandPolygons();
const LAKES = ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.filter((lake) => lake.coordinates?.length >= 3);
const PHYSICAL_CORRECTION_POLYGONS = ANATOLIA_PHYSICAL_COAST_CORRECTIONS
  .map((item) => item.coordinates)
  .filter((polygon) => polygon.length >= 3 && area(polygon) >= MIN_AREA);

function inLake(point) { return LAKES.some((lake) => pointInPolygon(point, lake.coordinates)); }

function isPhysicalLandPoint(point) {
  if (PHYSICAL_CORRECTION_POLYGONS.some((polygon) => pointInPolygon(point, polygon))) return true;
  return LAND_POLYGONS.some((polygon) => pointInPolygon(point, polygon)) && !inLake(point);
}

function localLandRecovery(point) {
  if (isPhysicalLandPoint(point)) return point;
  for (let dx = -ANCHOR_GRID_RADIUS; dx <= ANCHOR_GRID_RADIUS + EPS; dx += ANCHOR_GRID_STEP) {
    for (let dy = -ANCHOR_GRID_RADIUS; dy <= ANCHOR_GRID_RADIUS + EPS; dy += ANCHOR_GRID_STEP) {
      const distance = Math.hypot(dx, dy);
      if (distance < ANCHOR_GRID_STEP * 0.5 || distance > ANCHOR_GRID_RADIUS) continue;
      const candidate = [point[0] + dx, point[1] + dy];
      if (isPhysicalLandPoint(candidate)) return candidate;
    }
  }
  return null;
}

function nearestLandPoint(point) {
  if (PHYSICAL_CORRECTION_POLYGONS.some((polygon) => pointInPolygon(point, polygon))) return point;
  const recovered = localLandRecovery(point);
  if (recovered) return recovered;
  let best = null;
  let bestDistance = Infinity;
  for (const polygon of LAND_POLYGONS) {
    for (let index = 0; index < polygon.length; index += 1) {
      const start = polygon[index];
      const end = polygon[(index + 1) % polygon.length];
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const denominator = dx * dx + dy * dy;
      const t = denominator < EPS ? 0 : Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / denominator));
      const candidate = [start[0] + dx * t, start[1] + dy * t];
      const distance = Math.hypot(point[0] - candidate[0], point[1] - candidate[1]);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = candidate;
      }
    }
  }
  if (!best || bestDistance > MAX_ANCHOR_SNAP_DISTANCE) throw new Error(`Historical province anchor is too far from physical land: ${point.join(",")} (${bestDistance.toFixed(3)}°)`);
  const inward = localLandRecovery(best);
  if (inward) return inward;
  throw new Error(`Historical province anchor has no physical-land recovery: ${point.join(",")} (${bestDistance.toFixed(3)}°)`);
}

function addBoundarySites(sites, polygon, kind) {
  for (let index = 0; index < polygon.length - 1; index += 1) {
    const start = polygon[index];
    const end = polygon[index + 1];
    const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
    const steps = Math.max(1, Math.ceil(length / BOUNDARY_SAMPLE_STEP));
    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      sites.push({ point: [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t], provinceId: null, kind });
    }
  }
}

function buildPhysicalBoundarySites() {
  const sites = [];
  for (const polygon of ANATOLIA_PHYSICAL_ATLAS.landPolygons) addBoundarySites(sites, polygon, "physical-land-boundary");
  for (const correction of PHYSICAL_CORRECTION_POLYGONS) addBoundarySites(sites, correction, "physical-coast-correction-boundary");
  for (const lake of LAKES) addBoundarySites(sites, lake.coordinates, "lake-boundary");
  return sites;
}

function halfPlane(polygon, a, b, c) {
  const output = [];
  const inside = (point) => a * point[0] + b * point[1] <= c + EPS;
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    const currentInside = inside(current);
    const nextInside = inside(next);
    if (currentInside && nextInside) output.push(next);
    else if (currentInside !== nextInside) {
      const currentValue = a * current[0] + b * current[1] - c;
      const nextValue = a * next[0] + b * next[1] - c;
      const denominator = currentValue - nextValue;
      const t = Math.abs(denominator) < EPS ? 0 : currentValue / denominator;
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
    if (other === index || !sites[other].provinceId) continue;
    const p = sites[other].point;
    const otherWeight = weights[sites[other].provinceId] ?? 0;
    polygon = halfPlane(polygon, 2 * (p[0] - site[0]), 2 * (p[1] - site[1]), p[0] ** 2 + p[1] ** 2 - site[0] ** 2 - site[1] ** 2 + ownWeight - otherWeight);
    if (polygon.length < 3) return [];
  }
  return polygon;
}

function clipLandByCell(land, cell) {
  let output = land.slice();
  const clip = signedArea(cell) < 0 ? [...cell].reverse() : cell;
  for (let edge = 0; edge < clip.length; edge += 1) {
    if (!output.length) return [];
    const start = clip[edge];
    const end = clip[(edge + 1) % clip.length];
    const input = output;
    output = [];
    const inside = (point) => cross(start, end, point) >= -EPS;
    for (let index = 0; index < input.length; index += 1) {
      const current = input[index];
      const next = input[(index + 1) % input.length];
      const currentInside = inside(current);
      const nextInside = inside(next);
      if (currentInside && nextInside) output.push(next);
      else if (currentInside !== nextInside) {
        const currentValue = cross(start, end, current);
        const nextValue = cross(start, end, next);
        const denominator = currentValue - nextValue;
        const t = Math.abs(denominator) < EPS ? 0 : currentValue / denominator;
        output.push([current[0] + (next[0] - current[0]) * t, current[1] + (next[1] - current[1]) * t]);
        if (!currentInside && nextInside) output.push(next);
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
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    for (const fraction of EDGE_FRACTIONS) {
      const point = [start[0] + (end[0] - start[0]) * fraction, start[1] + (end[1] - start[1]) * fraction];
      if (!isPhysicalLandPoint(point) && !inLake(point)) return false;
    }
  }
  return true;
}

function buildControlSites() {
  return ANATOLIA_PROVINCE_METADATA.map((item) => {
    const historicalAnchor = rawAnchor(item);
    return { point: nearestLandPoint(historicalAnchor), historicalAnchor, provinceId: item.id, kind: "province-anchor" };
  });
}

function polygonCentroid(polygon) {
  return polygon.reduce((sum, [x, y]) => [sum[0] + x, sum[1] + y], [0, 0]).map((value) => value / polygon.length);
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function featureWeightBias() {
  const bias = Object.fromEntries(ANATOLIA_PROVINCE_METADATA.map((item) => [item.id, 0]));
  for (const feature of [...ANATOLIA_STRATEGIC_PASSES, ...ANATOLIA_RIVER_CROSSINGS]) {
    for (const provinceId of feature.provinces ?? []) if (provinceId in bias) bias[provinceId] += FEATURE_WEIGHT_STEP;
  }
  return bias;
}

function buildPartition(sites, weights) {
  const result = new Map();
  for (let index = 0; index < sites.length; index += 1) {
    if (!sites[index].provinceId) continue;
    const site = sites[index];
    const cell = powerCell(index, sites, weights);
    if (!cell.length) throw new Error(`Phase 2D V16 empty power cell: ${site.provinceId}`);
    const polygon = clipCellToLand(cell, site.point)[0];
    if (!polygon || !edgeOnPhysicalLand(polygon)) throw new Error(`Phase 2D V16 produced invalid physical-land geometry: ${site.provinceId}`);
    result.set(site.provinceId, polygon.map(([x, y]) => [Number(x.toFixed(7)), Number(y.toFixed(7))]));
  }
  return result;
}

function solveWeights(sites) {
  const featureBias = featureWeightBias();
  const weights = Object.fromEntries(sites.filter((site) => site.provinceId).map((site) => [site.provinceId, featureBias[site.provinceId] ?? 0]));
  let partition = buildPartition(sites, weights);
  for (let iteration = 0; iteration < MAX_WEIGHT_ITERATIONS; iteration += 1) {
    const summary = [...partition.entries()].map(([id, polygon]) => ({ id, area: area(polygon) }));
    const medianArea = median(summary.map((item) => item.area));
    for (const item of summary) {
      const ratio = medianArea > EPS ? item.area / medianArea : 1;
      const correction = Math.max(-MAX_WEIGHT_STEP, Math.min(MAX_WEIGHT_STEP, Math.log(Math.max(0.25, Math.min(MAX_AREA_RATIO, ratio))) * MAX_WEIGHT_STEP));
      weights[item.id] = (weights[item.id] ?? 0) + correction;
    }
    const next = buildPartition(sites, weights);
    const maxDelta = Math.max(...summary.map((item) => Math.abs(area(next.get(item.id)) - item.area)));
    partition = next;
    if (maxDelta < 0.0005) break;
  }
  return partition;
}

function manifestGeometry(provinceId) {
  const key = ANATOLIA_1300_PROVINCE_GEOMETRY_KEYS[provinceId];
  return key ? ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST[key] : null;
}

function buildProvinceGeometry(item, polygon, site) {
  const manifest = manifestGeometry(item.id);
  const historicalAnchor = site.historicalAnchor;
  const identity = {
    id: item.id,
    provinceId: item.id,
    name: item.name,
    historicalAnchor,
    classification: "phase2d-anatolia-province-geometry",
    sourceFeatureId: item.id,
  };
  const rings = [polygon];
  const holeRings = [];
  for (const lake of LAKES) {
    const lakeRing = lake.coordinates;
    const clippedLake = clipLandByCell(lakeRing, polygon);
    if (clippedLake.length >= 3 && area(clippedLake) >= MIN_AREA && pointInPolygon(lakeRing[0], polygon)) holeRings.push(clippedLake);
  }
  const polygons = [rings[0], ...holeRings];
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: polygons },
    identity,
    properties: {
      provinceId: item.id,
      provinceName: item.name,
      historicalAnchor,
      borderConfidence: item.borderConfidence,
      manifest,
      cartographicCentroid: polygonCentroid(polygon),
    },
  };
}

export function buildAnatoliaPhase2DAssets(regions) {
  const sites = buildControlSites();
  const partition = solveWeights(sites);
  const geometries = ANATOLIA_PROVINCE_METADATA.map((item) => {
    const site = sites.find((candidate) => candidate.provinceId === item.id);
    const polygon = partition.get(item.id);
    if (!polygon || polygon.length < 3) throw new Error(`Phase 2D V16 missing geometry: ${item.id}`);
    return buildProvinceGeometry(item, polygon, site);
  });
  const physicalSites = buildPhysicalBoundarySites();
  const siteCount = sites.length + physicalSites.length;
  const fallbackProvinceCount = geometries.filter((geometry) => !manifestGeometry(geometry.identity.provinceId)).length;
  const polygonCount = geometries.reduce((total, geometry) => total + geometry.geometry.coordinates.length, 0);
  const vertexCount = geometries.reduce((total, geometry) => total + geometry.geometry.coordinates.reduce((count, ring) => count + ring.length, 0), 0);
  return {
    version: 16,
    historicalDate: "1300-01-01",
    regions,
    geometries,
    provinces: geometries,
    siteCount,
    barrierSiteCount: 0,
    politicalSiteCount: sites.length,
    fallbackProvinceCount,
    polygonCount,
    vertexCount,
    source: "curated-voronoi-power-cells-clipped-to-physical-land",
  };
}

export { isPhysicalLandPoint, isAnatoliaGeometryPoint };

function isAnatoliaGeometryPoint(point) {
  return Array.isArray(point) && point.length === 2 && point[0] >= BBOX[0] && point[0] <= BBOX[2] && point[1] >= BBOX[1] && point[1] <= BBOX[3];
}
