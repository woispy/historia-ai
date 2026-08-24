import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PHYSICAL_COAST_CORRECTIONS } from "../../src/map/data/AnatoliaPhysicalCoastCorrections.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import {
  ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST,
  ANATOLIA_1300_PROVINCE_GEOMETRY_KEYS,
} from "../../src/map/data/Anatolia1300ProvinceGeometryManifest.js";
import {
  ANATOLIA_PROVINCE_REFINEMENTS,
  ANATOLIA_STRATEGIC_PASSES,
  ANATOLIA_RIVER_CROSSINGS,
} from "../../src/map/data/AnatoliaProvinceRefinement.js";

const BBOX = [25.45, 35.72, 44.85, 42.35];
const EPS = 1e-7;
const MIN_AREA = 0.00005;
const COAST_TOLERANCE = 0.055;
const SAMPLE_STEP = 0.12;
const LAKE_SHRINK_STEP = 0.02;

const province = (id) => ANATOLIA_PROVINCE_METADATA.find((item) => item.id === id) ?? null;
const rawAnchor = (item) => ANATOLIA_PROVINCE_REFINEMENTS[item.id]?.anchor ?? item.centroid;
const sq = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
const physicalLandPolygons = () => [
  ...ANATOLIA_PHYSICAL_ATLAS.landPolygons,
  ...ANATOLIA_PHYSICAL_COAST_CORRECTIONS.map((item) => item.coordinates),
];

function pointInPolygon(point, polygon) {
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
  const denominator = dx * dx + dy * dy;
  const t = denominator < EPS
    ? 0
    : Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / denominator));
  return Math.hypot(point[0] - (a[0] + dx * t), point[1] - (a[1] + dy * t));
}

function distanceToCoast(point) {
  let best = Infinity;
  for (const polygon of physicalLandPolygons()) {
    for (let i = 0; i < polygon.length; i += 1) {
      best = Math.min(best, distanceToSegment(point, polygon[i], polygon[(i + 1) % polygon.length]));
    }
  }
  return best;
}

function inLand(point) {
  return physicalLandPolygons().some((polygon) => pointInPolygon(point, polygon));
}

function inLake(point) {
  return ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => pointInPolygon(point, lake.coordinates));
}

function isPhysicalLandPoint(point) {
  return !inLake(point) && (inLand(point) || distanceToCoast(point) <= COAST_TOLERANCE);
}

function politicalPoint(point) {
  const [longitude, latitude] = point;
  return longitude >= BBOX[0]
    && longitude <= BBOX[2]
    && latitude >= BBOX[1]
    && latitude <= BBOX[3]
    && isPhysicalLandPoint(point);
}

function resolveAnchor(point) {
  if (politicalPoint(point)) return point;
  let best = null;
  let bestDistance = Infinity;
  for (let radius = 0.01; radius <= 0.45; radius += 0.01) {
    for (let direction = 0; direction < 36; direction += 1) {
      const angle = (direction / 36) * Math.PI * 2;
      const candidate = [
        point[0] + Math.cos(angle) * radius,
        point[1] + Math.sin(angle) * radius,
      ];
      if (!politicalPoint(candidate)) continue;
      const distance = sq(point, candidate);
      if (distance < bestDistance) {
        best = candidate;
        bestDistance = distance;
      }
    }
    if (best) return best;
  }
  throw new Error(`No physical-land anchor can be resolved for historical province coordinate ${point.join(",")}`);
}

function anchor(item) {
  return resolveAnchor(rawAnchor(item));
}

function halfPlane(polygon, a, b, c) {
  const out = [];
  if (!polygon.length) return out;
  const inside = (point) => a * point[0] + b * point[1] <= c + EPS;
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    const currentInside = inside(current);
    const nextInside = inside(next);
    if (currentInside && nextInside) {
      out.push(next);
    } else if (currentInside !== nextInside) {
      const currentValue = a * current[0] + b * current[1] - c;
      const nextValue = a * next[0] + b * next[1] - c;
      const denominator = currentValue - nextValue;
      const t = Math.abs(denominator) < EPS ? 0 : currentValue / denominator;
      out.push([
        current[0] + (next[0] - current[0]) * t,
        current[1] + (next[1] - current[1]) * t,
      ]);
      if (!currentInside && nextInside) out.push(next);
    }
  }
  return out;
}

function voronoiCell(index, sites) {
  const site = sites[index].point;
  let polygon = [
    [BBOX[0], BBOX[1]],
    [BBOX[2], BBOX[1]],
    [BBOX[2], BBOX[3]],
    [BBOX[0], BBOX[3]],
  ];
  for (let other = 0; other < sites.length; other += 1) {
    if (other === index) continue;
    const point = sites[other].point;
    const a = 2 * (point[0] - site[0]);
    const b = 2 * (point[1] - site[1]);
    const c = point[0] ** 2 + point[1] ** 2 - site[0] ** 2 - site[1] ** 2;
    polygon = halfPlane(polygon, a, b, c);
    if (polygon.length < 3) return [];
  }
  return polygon;
}

function cross(a, b, point) {
  return (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]);
}

function polygonAreaSigned(polygon) {
  let sum = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const a = polygon[index];
    const b = polygon[(index + 1) % polygon.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
}

function polygonArea(polygon) {
  return Math.abs(polygonAreaSigned(polygon));
}

function polygonCentroid(polygon) {
  let twiceArea = 0;
  let x = 0;
  let y = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const a = polygon[index];
    const b = polygon[(index + 1) % polygon.length];
    const determinant = a[0] * b[1] - b[0] * a[1];
    twiceArea += determinant;
    x += (a[0] + b[0]) * determinant;
    y += (a[1] + b[1]) * determinant;
  }
  if (Math.abs(twiceArea) < EPS) return polygon[0];
  return [x / (3 * twiceArea), y / (3 * twiceArea)];
}

function normalizeWinding(polygon) {
  return polygonAreaSigned(polygon) < 0 ? [...polygon].reverse() : polygon;
}

function clipSubjectByConvexClip(subject, clip) {
  let output = subject.slice();
  const normalizedClip = normalizeWinding(clip);
  for (let edgeIndex = 0; edgeIndex < normalizedClip.length; edgeIndex += 1) {
    if (!output.length) return [];
    const a = normalizedClip[edgeIndex];
    const b = normalizedClip[(edgeIndex + 1) % normalizedClip.length];
    const input = output;
    output = [];
    const inside = (point) => cross(a, b, point) >= -EPS;
    for (let index = 0; index < input.length; index += 1) {
      const current = input[index];
      const next = input[(index + 1) % input.length];
      const currentInside = inside(current);
      const nextInside = inside(next);
      if (currentInside && nextInside) {
        output.push(next);
      } else if (currentInside !== nextInside) {
        const currentCross = cross(a, b, current);
        const nextCross = cross(a, b, next);
        const denominator = currentCross - nextCross;
        const t = Math.abs(denominator) < EPS ? 0 : currentCross / denominator;
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

function clipCellToPhysicalLand(cell) {
  const pieces = [];
  for (const landPolygon of physicalLandPolygons()) {
    const clipped = clipSubjectByConvexClip(landPolygon, cell);
    if (clipped.length >= 3 && polygonArea(clipped) >= MIN_AREA) pieces.push(clipped);
  }
  return pieces;
}

function lakeTouchesPolygon(polygon, lake) {
  if (lake.coordinates.some((point) => pointInPolygon(point, polygon))) return true;
  const lakeCenter = polygonCentroid(lake.coordinates);
  if (pointInPolygon(lakeCenter, polygon)) return true;
  return polygon.some((point) => pointInPolygon(point, lake.coordinates));
}

function protectLakeInterior(polygon, anchorPoint) {
  let result = polygon;
  for (let iteration = 0; iteration < 12; iteration += 1) {
    const touchingLake = ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.find((lake) => lakeTouchesPolygon(result, lake));
    if (!touchingLake) return result;
    const lakeCenter = polygonCentroid(touchingLake.coordinates);
    if (!pointInPolygon(lakeCenter, result) && !result.some((point) => pointInPolygon(point, touchingLake.coordinates))) return result;
    result = result.map((point) => [
      anchorPoint[0] + (point[0] - anchorPoint[0]) * (1 - LAKE_SHRINK_STEP),
      anchorPoint[1] + (point[1] - anchorPoint[1]) * (1 - LAKE_SHRINK_STEP),
    ]);
  }
  return result;
}

function buildPhysicalSamplingSites() {
  const sites = [];
  for (let longitude = BBOX[0]; longitude <= BBOX[2] + EPS; longitude += SAMPLE_STEP) {
    for (let latitude = BBOX[1]; latitude <= BBOX[3] + EPS; latitude += SAMPLE_STEP) {
      const point = [Number(longitude.toFixed(5)), Number(latitude.toFixed(5))];
      if (isPhysicalLandPoint(point)) sites.push(point);
    }
  }
  return sites;
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
    assetVersion: 8,
    generator: "Historia AI Phase 2D Geometry Builder V6",
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
      precision: "anchor-constrained-land-intersection",
      anchor: rawAnchor(item),
      historicalControl: item.historicalControl,
    },
    geometry: { coastal: item.coastal, port: item.port, terrain: item.terrain, strategic: item.strategic },
    polygons,
  };
}

function geometryAsset(item, polygons) {
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
      precision: "anchor-constrained-land-intersection",
      anchor: rawAnchor(item),
    },
    polygons,
  };
}

export function buildAnatoliaPhase2DAssets() {
  validateManifest();
  const politicalSites = ANATOLIA_PROVINCE_METADATA.map((item) => ({
    point: anchor(item),
    provinceId: item.id,
    kind: "province-anchor",
  }));
  const physicalSamplingSites = buildPhysicalSamplingSites();
  const naturalFeatureSiteCount = [...ANATOLIA_STRATEGIC_PASSES, ...ANATOLIA_RIVER_CROSSINGS]
    .reduce((count, feature) => count + (feature.provinces?.length ?? 0), 0);

  const provinces = [];
  const geometries = [];
  for (let index = 0; index < politicalSites.length; index += 1) {
    const site = politicalSites[index];
    const item = province(site.provinceId);
    const cell = voronoiCell(index, politicalSites);
    const clippedPieces = clipCellToPhysicalLand(cell)
      .map((polygon) => protectLakeInterior(polygon, site.point))
      .filter((polygon) => polygon.length >= 3 && polygonArea(polygon) >= MIN_AREA)
      .map((polygon) => polygon.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]));
    if (!clippedPieces.length) throw new Error(`Phase 2D produced no physical-land geometry for ${item.id}`);
    const polygons = clippedPieces.filter((polygon) => isPhysicalLandPoint(polygonCentroid(polygon)));
    if (!polygons.length) throw new Error(`Phase 2D produced no valid centroid geometry for ${item.id}`);
    provinces.push(provinceAsset(item, polygons));
    geometries.push(geometryAsset(item, polygons));
  }

  return {
    schemaVersion: 1,
    geometryVersion: 9,
    historicalDate: "1300-01-01",
    provider: "historia-ai-curated-cartography",
    dataset: "anatolia-province-geometry-1300",
    projection: "EPSG:4326",
    method: "one historical province anchor per political cell, convex-cell intersection against the physical Anatolia land authority, explicit lake-aware validation, and dense physical sampling",
    siteCount: physicalSamplingSites.length + politicalSites.length + naturalFeatureSiteCount,
    politicalSiteCount: politicalSites.length,
    physicalSamplingSiteCount: physicalSamplingSites.length,
    barrierSiteCount: 0,
    naturalFeatureSiteCount,
    fallbackProvinceCount: 0,
    provinceCount: provinces.length,
    polygonCount: geometries.reduce((sum, item) => sum + item.polygons.length, 0),
    provinces,
    geometries,
  };
}

export function isAnatoliaGeometryPoint([longitude, latitude]) {
  const [minLongitude, minLatitude, maxLongitude, maxLatitude] = [26.5, 35.7, 44.8, 41.6];
  if (longitude < minLongitude || longitude > maxLongitude || latitude < minLatitude || latitude > maxLatitude) return false;
  const marmaraThraceExclusion = [
    [26.5, 42.2], [29.5, 42.2], [29.5, 41.25], [29.05, 40.72],
    [28.45, 40.48], [27.55, 40.45], [26.5, 40.65],
  ];
  return !pointInPolygon([longitude, latitude], marmaraThraceExclusion);
}

export { isPhysicalLandPoint };
