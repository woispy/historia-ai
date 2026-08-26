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
const EDGE_FRACTIONS = [0, 0.25, 0.5, 0.75, 1];
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
    if (
      (a[1] > point[1]) !== (b[1] > point[1])
      && point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / ((b[1] - a[1]) || EPS) + a[0]
    ) inside = !inside;
    j = i;
  }
  return inside;
}

function distanceToSegment(point, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const d = dx * dx + dy * dy;
  const t = d < EPS
    ? 0
    : Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / d));
  return Math.hypot(point[0] - (a[0] + dx * t), point[1] - (a[1] + dy * t));
}

function distanceToPolygon(point, polygon) {
  let distance = Infinity;
  for (let i = 0; i < polygon.length; i += 1) {
    distance = Math.min(distance, distanceToSegment(point, polygon[i], polygon[(i + 1) % polygon.length]));
  }
  return distance;
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
  return ANATOLIA_PHYSICAL_ATLAS.landPolygons.filter((polygon) => area(polygon) >= MAINLAND_MIN_AREA);
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
  for (const polygon of ANATOLIA_PHYSICAL_ATLAS.landPolygons) distance = Math.min(distance, distanceToPolygon(point, polygon));
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
      output.push([
        current[0] + (next[0] - current[0]) * t,
        current[1] + (next[1] - current[1]) * t,
      ]);
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
    polygon = halfPlane(
      polygon,
      2 * (p[0] - site[0]),
      2 * (p[1] - site[1]),
      p[0] ** 2 + p[1] ** 2 - site[0] ** 2 - site[1] ** 2 + weight - otherWeight,
    );
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
        output.push([
          current[0] + (next[0] - current[0]) * t,
          current[1] + (next[1] - current[1]) * t,
        ]);
        if (!currentInside && nextInside) output.push(next);
      }
    }
  }
  return output;
}

function clipCellToMainland(cell) {
  return landPolygons()
    .map((land) => clipLandByCell(land, cell))
    .filter((polygon) => polygon.length >= 3 && area(polygon) >= MIN_AREA);
}

function filterPhysicalPolygons(polygons, provinceId) {
  const safe = polygons.filter((polygon) => polygon.length >= 3 && area(polygon) >= MIN_AREA);
  if (!safe.length) throw new Error(`Phase 2D V8 produced no physical-land geometry for ${provinceId}`);
  return safe;
}

function buildControlSites() {
  return ANATOLIA_PROVINCE_METADATA.map((item) => ({
    point: rawAnchor(item),
    provinceId: item.id,
    kind: "province-anchor",
  }));
}

function validateManifest() {
  const ids = new Set(ANATOLIA_PROVINCE_METADATA.map((item) => item.id));
  if (ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST.length !== ids.size) {
    throw new Error("1300 Anatolia geometry manifest is not aligned with province metadata.");
  }
  for (const entry of ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST) {
    if (!ids.has(entry.id) || !ANATOLIA_1300_PROVINCE_GEOMETRY_KEYS[entry.id] || entry.clipToPhysicalLand !== true) {
      throw new Error(`Invalid 1300 geometry manifest entry: ${entry.id}`);
    }
  }
}

function headers(item, type) {
  return {
    assetType: type,
    assetVersion: 9,
    generator: "Historia AI Phase 2D Geometry Builder",
    provider: "historia-ai-curated-cartography",
    dataset: "anatolia-province-geometry-1300",
    historicalDate: "1300-01-01",
    borderPrecision: item.borderConfidence === "high" ? 3 : 2,
    sourceFeatureId: item.id,
    sourceFeatureIndex: null,
  };
}

function provinceAsset(item, polygons) {
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
      precision: "single-anchor-weighted-land-partition",
      anchor: refinementFor(item)?.anchor ?? item.centroid,
      historicalControl: item.historicalControl,
    },
    geometry: { coastal: item.coastal, port: item.port, terrain: item.terrain, strategic: item.strategic },
    polygons,
  };
}

function geometryAsset(item, polygons) {
  return {
    header: headers(item, "geometry"),
    identity: { id: item.id, name: item.name },
    geometry: { type: "MultiPolygon", polygons },
  };
}

function buildPartition(sites, weights) {
  return sites.map((site, index) => {
    const cell = powerCell(index, sites, weights);
    const polygons = clipCellToMainland(cell);
    return {
      provinceId: site.provinceId,
      point: site.point,
      cell,
      polygons: filterPhysicalPolygons(polygons, site.provinceId),
    };
  });
}

function solveWeights(sites) {
  const weights = Object.fromEntries(sites.map((site) => [site.provinceId, 0]));
  let partitions = buildPartition(sites, weights);
  const target = Math.max(...partitions.map((entry) => area(entry.polygons[0])));
  for (let iteration = 0; iteration < MAX_WEIGHT_ITERATIONS; iteration += 1) {
    let changed = false;
    partitions = buildPartition(sites, weights);
    for (const partition of partitions) {
      const totalArea = partition.polygons.reduce((sum, polygon) => sum + area(polygon), 0);
      const desired = target / Math.max(1, sites.length / 2);
      const delta = Math.max(-MAX_WEIGHT_STEP, Math.min(MAX_WEIGHT_STEP, desired - totalArea));
      if (Math.abs(delta) > EPS) {
        weights[partition.provinceId] += delta;
        changed = true;
      }
    }
    if (!changed) break;
  }
  return buildPartition(sites, weights);
}

function validateAnchors(partitions) {
  for (const site of partitions) {
    if (!isPhysicalLandPoint(site.point)) {
      throw new Error(`Invalid 1300 province anchor: ${site.provinceId} ${site.point.join(",")}`);
    }
  }
}

export function buildAnatoliaPhase2DAssets() {
  validateManifest();
  const sites = buildControlSites();
  const partitions = solveWeights(sites);
  validateAnchors(partitions);
  const provinces = Object.fromEntries(partitions.map((entry) => {
    const item = ANATOLIA_PROVINCE_METADATA.find((candidate) => candidate.id === entry.provinceId);
    return [entry.provinceId, provinceAsset(item, entry.polygons)];
  }));
  const geometries = Object.fromEntries(partitions.map((entry) => {
    const item = ANATOLIA_PROVINCE_METADATA.find((candidate) => candidate.id === entry.provinceId);
    return [entry.provinceId, geometryAsset(item, entry.polygons)];
  }));
  return { provinces, geometries, partitions };
}
