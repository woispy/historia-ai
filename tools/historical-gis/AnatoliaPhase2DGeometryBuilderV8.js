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
const MAX_WEIGHT_ITERATIONS = 12;
const MAX_WEIGHT_STEP = 1.25;
const EDGE_FRACTIONS = [0, 0.25, 0.5, 0.75, 1];
const REPAIR_FACTOR = 0.92;
const MAX_REPAIR_ITERATIONS = 36;

const refinementFor = (item) => ANATOLIA_PROVINCE_REFINEMENTS[item.id] ?? null;
const rawAnchor = (item) => refinementFor(item)?.geometryAnchor ?? refinementFor(item)?.anchor ?? item.centroid;

function pointOnSegment(point, a, b) {
  const crossValue = Math.abs((b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]));
  if (crossValue > EPS) return false;
  return point[0] >= Math.min(a[0], b[0]) - EPS
    && point[0] <= Math.max(a[0], b[0]) + EPS
    && point[1] >= Math.min(a[1], b[1]) - EPS
    && point[1] <= Math.max(a[1], b[1]) + EPS;
}

function pointInPolygon(point, polygon) {
  if (!polygon?.length) return false;
  for (let i = 0; i < polygon.length; i += 1) {
    if (pointOnSegment(point, polygon[i], polygon[(i + 1) % polygon.length])) return true;
  }
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    if ((a[1] > point[1]) !== (b[1] > point[1])
      && point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / ((b[1] - a[1]) || EPS) + a[0]) inside = !inside;
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
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
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
  let x = 0;
  let y = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const factor = a[0] * b[1] - b[0] * a[1];
    x += (a[0] + b[0]) * factor;
    y += (a[1] + b[1]) * factor;
  }
  return [x / (6 * signed), y / (6 * signed)];
}

function exclusionPolygons() {
  return ANATOLIA_PHYSICAL_COAST_CORRECTIONS.flatMap((correction) => correction.exclusionCoordinates ?? [])
    .filter((polygon) => polygon?.length >= 3 && area(polygon) >= MIN_AREA);
}

function correctionLandPolygons() {
  return ANATOLIA_PHYSICAL_COAST_CORRECTIONS.map((correction) => correction.coordinates ?? [])
    .filter((polygon) => polygon.length >= 3 && area(polygon) >= MIN_AREA);
}

function explicitLandControlPoints() {
  return ANATOLIA_PHYSICAL_COAST_CORRECTIONS.flatMap((correction) => [
    ...(correction.landControlPoints ?? []),
    ...(correction.controlPoints ?? []),
  ]);
}

function isExplicitLandControlPoint(point) {
  return explicitLandControlPoints().some((controlPoint) => distanceToSegment(point, controlPoint, controlPoint) <= EPS);
}

function isCorrectionShorelineVertex(point) {
  return correctionLandPolygons().some((polygon) => polygon.some((vertex) => distanceToSegment(point, vertex, vertex) <= EPS));
}

function isAtlasLandBoundaryPoint(point) {
  return ANATOLIA_PHYSICAL_ATLAS.landPolygons.some((polygon) => polygon.some((vertex, index) => (
    pointOnSegment(point, vertex, polygon[(index + 1) % polygon.length])
  )));
}

function isExplicitExcludedWater(point) {
  return exclusionPolygons().some((polygon) => pointInPolygon(point, polygon));
}

function inCorrectionLandPatch(point) {
  return correctionLandPolygons().some((polygon) => pointInPolygon(point, polygon));
}

function inLake(point) {
  return ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => lake.rings
    ? lake.rings.some((ring) => pointInPolygon(point, ring))
    : pointInPolygon(point, lake.coordinates));
}

export function isPhysicalLandPoint(point) {
  if (!Array.isArray(point) || point.length !== 2) return false;
  // Physical authority is ordered: explicit water wins first; curated
  // terrestrial corrections then override generated hydrography; generated
  // lakes and the coarse atlas are fallbacks, never higher authority.
  if (isExplicitExcludedWater(point)) return false;
  if (isExplicitLandControlPoint(point) || isCorrectionShorelineVertex(point)) return true;
  if (inCorrectionLandPatch(point)) return true;
  if (inLake(point)) return false;
  if (isAtlasLandBoundaryPoint(point)) return true;
  if (ANATOLIA_PHYSICAL_ATLAS.landPolygons.some((polygon) => pointInPolygon(point, polygon))) return true;
  let distance = Infinity;
  for (const polygon of ANATOLIA_PHYSICAL_ATLAS.landPolygons) {
    for (let i = 0; i < polygon.length; i += 1) {
      distance = Math.min(distance, distanceToSegment(point, polygon[i], polygon[(i + 1) % polygon.length]));
    }
  }
  return distance <= COAST_TOLERANCE;
}

function physicalRepresentative(polygon) {
  const candidates = [polygonAreaCentroid(polygon), polygonVertexMean(polygon), ...polygon];
  return candidates.find((candidate) => isPhysicalLandPoint(candidate)) ?? null;
}

function cross(a, b, point) {
  return (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]);
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

function powerCell(index, sites, weights, forceUnweighted = false) {
  const site = sites[index].point;
  const weight = forceUnweighted ? 0 : (weights[sites[index].provinceId] ?? 0);
  let polygon = [[BBOX[0], BBOX[1]], [BBOX[2], BBOX[1]], [BBOX[2], BBOX[3]], [BBOX[0], BBOX[3]]];
  for (let other = 0; other < sites.length; other += 1) {
    if (other === index) continue;
    const point = sites[other].point;
    const otherWeight = forceUnweighted ? 0 : (weights[sites[other].provinceId] ?? 0);
    const next = halfPlane(
      polygon,
      2 * (point[0] - site[0]),
      2 * (point[1] - site[1]),
      point[0] ** 2 + point[1] ** 2 - site[0] ** 2 - site[1] ** 2 + weight - otherWeight,
    );
    if (next.length >= 3 && pointInPolygon(site, next)) polygon = next;
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

function edgeOnPhysicalLand(polygon) {
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    for (const fraction of EDGE_FRACTIONS) {
      const point = [a[0] + (b[0] - a[0]) * fraction, a[1] + (b[1] - a[1]) * fraction];
      if (!isPhysicalLandPoint(point)) return false;
    }
  }
  return true;
}

function polygonIsSafe(polygon) {
  return polygon.length >= 3
    && area(polygon) >= MIN_AREA
    && physicalRepresentative(polygon)
    && edgeOnPhysicalLand(polygon)
    && polygon.every((point) => isPhysicalLandPoint(point));
}

function repairPolygon(polygon, anchorPoint) {
  if (polygonIsSafe(polygon)) return polygon;
  const centerCandidates = [anchorPoint, polygonAreaCentroid(polygon), polygonVertexMean(polygon), ...polygon];
  const center = centerCandidates.find((point) => point && isPhysicalLandPoint(point) && pointInPolygon(point, polygon))
    ?? centerCandidates.find((point) => point && isPhysicalLandPoint(point));
  if (!center) return [];
  let result = polygon;
  for (let iteration = 0; iteration < MAX_REPAIR_ITERATIONS; iteration += 1) {
    result = result.map((point) => [
      center[0] + (point[0] - center[0]) * REPAIR_FACTOR,
      center[1] + (point[1] - center[1]) * REPAIR_FACTOR,
    ]);
    if (polygonIsSafe(result)) return result;
    if (area(result) < MIN_AREA) break;
  }
  return [];
}

function clipCellToPhysicalLand(cell, anchorPoint) {
  const landSources = [
    ...ANATOLIA_PHYSICAL_ATLAS.landPolygons,
    ...correctionLandPolygons(),
  ];
  const candidates = landSources
    .map((land) => clipLandByCell(land, cell))
    .filter((polygon) => polygon.length >= 3 && area(polygon) >= MIN_AREA);
  const anchored = candidates.filter((polygon) => pointInPolygon(anchorPoint, polygon));
  const ordered = [...anchored, ...candidates.filter((polygon) => !anchored.includes(polygon))]
    .sort((a, b) => area(b) - area(a));
  return ordered
    .map((polygon) => repairPolygon(polygon, anchorPoint))
    .filter((polygon) => polygon.length >= 3 && area(polygon) >= MIN_AREA && polygonIsSafe(polygon));
}

function filterPhysicalPolygons(polygons, provinceId) {
  const safe = polygons.filter((polygon) => polygon.length >= 3 && area(polygon) >= MIN_AREA && polygonIsSafe(polygon));
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

function validateCorrectionTopology() {
  for (const correction of ANATOLIA_PHYSICAL_COAST_CORRECTIONS) {
    const exclusions = correction.exclusionCoordinates ?? [];
    const controls = [
      ...(correction.landControlPoints ?? []),
      ...(correction.controlPoints ?? []),
    ];
    for (const controlPoint of controls) {
      if (exclusions.some((polygon) => pointInPolygon(controlPoint, polygon)) && !isExplicitLandControlPoint(controlPoint)) {
        throw new Error(`Physical correction ${correction.id} marks a land control point inside an exclusion polygon: ${controlPoint.join(",")}`);
      }
    }
  }
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
    assetVersion: 10,
    generator: "Historia AI Phase 2D Geometry Builder V8",
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
    ownership: {
      countryId: item.countryId,
      ownerId: item.historicalControl.controllerAt1300 ?? item.countryId,
    },
    historical: {
      sourceFeatureId: item.id,
      sourceFeatureIndex: null,
      sourceName: item.name,
      subject: item.countryId,
      partOf: item.regionId,
      borderPrecision: headers(item, "province").borderPrecision,
      classification: "phase2d-anatolia-province-geometry",
      precision: "anchor-safe-power-cell-physical-land-intersection",
      anchor: refinementFor(item)?.anchor ?? item.centroid,
      historicalControl: item.historicalControl,
    },
    geometry: {
      coastal: item.coastal,
      port: item.port,
      terrain: item.terrain,
      strategic: item.strategic,
    },
    polygons,
  };
}

function geometryAsset(item, polygons) {
  return {
    header: headers(item, "geometry"),
    identity: { provinceId: item.id, name: item.name },
    references: { provinceId: item.id, countryId: item.countryId },
    ownership: {
      countryId: item.countryId,
      ownerId: item.historicalControl.controllerAt1300 ?? item.countryId,
    },
    geometry: {
      type: "MultiPolygon",
      coordinates: polygons.map((polygon) => [polygon]),
      polygons,
    },
    historical: {
      sourceFeatureId: item.id,
      sourceFeatureIndex: null,
      historicalDate: "1300-01-01",
      borderPrecision: headers(item, "geometry").borderPrecision,
    },
  };
}

function areaSummary(partition) {
  return ANATOLIA_PROVINCE_METADATA.map((item) => ({
    provinceId: item.id,
    area: (partition.get(item.id) ?? []).reduce((sum, polygon) => sum + area(polygon), 0),
  })).filter((item) => item.area > 0);
}

function buildPartition(sites, weights) {
  const polygonsByProvince = new Map(ANATOLIA_PROVINCE_METADATA.map((item) => [item.id, []]));
  for (let index = 0; index < sites.length; index += 1) {
    const site = sites[index];
    let cell = powerCell(index, sites, weights);
    if (!pointInPolygon(site.point, cell)) cell = powerCell(index, sites, weights, true);
    let polygons = clipCellToPhysicalLand(cell, site.point);
    if (!polygons.length) {
      const safeCell = powerCell(index, sites, weights, true);
      polygons = clipCellToPhysicalLand(safeCell, site.point);
    }
    polygonsByProvince.set(
      site.provinceId,
      filterPhysicalPolygons(polygons, site.provinceId)
        .map((polygon) => polygon.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))])),
    );
  }
  return polygonsByProvince;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

function solveWeights(sites) {
  const weights = Object.fromEntries(sites.map((site) => [site.provinceId, 0]));
  let partition = buildPartition(sites, weights);
  for (let iteration = 0; iteration < MAX_WEIGHT_ITERATIONS; iteration += 1) {
    const summary = areaSummary(partition);
    const medianArea = median(summary.map((item) => item.area));
    if (!medianArea) return { weights, partition, iterations: iteration };
    for (const item of summary) {
      const delta = Math.max(
        -MAX_WEIGHT_STEP,
        Math.min(MAX_WEIGHT_STEP, (medianArea - item.area) / Math.max(medianArea, EPS)),
      );
      weights[item.provinceId] += delta;
    }
    const next = buildPartition(sites, weights);
    const converged = summary.every((item) => Math.abs(
      (next.get(item.provinceId) ?? []).reduce((sum, polygon) => sum + area(polygon), 0) - item.area,
    ) < medianArea * 0.005);
    partition = next;
    if (converged) return { weights, partition, iterations: iteration + 1 };
  }
  return { weights, partition, iterations: MAX_WEIGHT_ITERATIONS };
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
  validateCorrectionTopology();
  const sites = buildControlSites();
  for (const site of sites) {
    if (!isAnatoliaGeometryPoint(site.point) || !isPhysicalLandPoint(site.point)) {
      throw new Error(`Invalid 1300 province anchor: ${site.provinceId} ${site.point.join(",")}`);
    }
  }

  const solved = solveWeights(sites);
  const provinces = [];
  const geometries = [];
  for (const item of ANATOLIA_PROVINCE_METADATA) {
    const polygons = solved.partition.get(item.id) ?? [];
    if (!polygons.length) throw new Error(`Phase 2D produced no polygons for ${item.id}`);
    provinces.push(provinceAsset(item, polygons));
    geometries.push(geometryAsset(item, polygons));
  }

  const polygonCount = geometries.reduce((sum, geometry) => sum + geometry.geometry.polygons.length, 0);
  const fallbackProvinceCount = geometries.filter((geometry) => geometry.geometry.polygons.some((polygon) => area(polygon) < MIN_AREA)).length;

  return {
    historicalDate: "1300-01-01",
    provinceCount: provinces.length,
    provinces,
    geometries,
    polygonCount,
    siteCount: sites.length + ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.length + ANATOLIA_PHYSICAL_ATLAS_RUNTIME.rivers.length,
    politicalSiteCount: sites.length,
    barrierSiteCount: 0,
    fallbackProvinceCount,
    iterations: solved.iterations,
    sites,
    diagnostics: {
      generator: "AnatoliaPhase2DGeometryBuilderV8",
      source: "historia-ai-curated-cartography",
      physicalLandAuthority: "anchor-safe-weighted-cell-intersection-with-boundary-repair-and-explicit-corrections",
      iterations: solved.iterations,
    },
  };
}
