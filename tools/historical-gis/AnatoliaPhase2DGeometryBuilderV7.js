import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
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
import { ANATOLIA_NATURAL_EARTH_LAND } from "./AnatoliaNaturalEarthLand.js";

const BBOX = [25.45, 35.72, 44.85, 42.35];
const EPS = 1e-7;
const MIN_AREA = 0.00005;
const COAST_TOLERANCE = 0.055;
const SAMPLE_STEP = 0.06;
const EDGE_FRACTIONS = [0, 0.25, 0.5, 0.75, 1];
const NEAR_COAST_LIMIT = 1.25;

// These are territorial control points, not extra provinces.  They reduce the
// giant Voronoi cells produced by sparse eastern anchors while keeping exactly
// 38 province identities.  Because all controls participate in the same
// Voronoi partition, provinces cannot overlap or leave inter-province gaps.
const PROVINCE_SUPPORT_CONTROLS = {
  "eastern-anatolia-erzurum": [[42.05, 39.55], [42.85, 39.20]],
  "eastern-anatolia-erzincan": [[40.35, 39.15]],
  "pontus-trebizond": [[40.75, 40.55], [41.35, 40.15]],
  "cappadocia-sivas": [[37.95, 39.35], [38.55, 39.10]],
  "cappadocia-kayseri": [[36.25, 38.45]],
  "pontus-amasya": [[36.35, 40.55]],
  "pontus-amisos": [[36.80, 40.85]],
  "pontus-kastamon": [[34.55, 41.05]],
  "galatia-ankara": [[33.55, 39.45]],
  "lycaonia-larende": [[33.70, 37.45]],
  "cilicia-sis": [[36.45, 37.25]],
  "cilicia-tarsos": [[35.35, 37.05]],
  "phrygia-afyon": [[30.10, 38.45]],
  "phrygia-denizli": [[28.85, 37.95]],
  "phrygia-eskisehir": [[30.75, 39.70]],
};

const province = (id) => ANATOLIA_PROVINCE_METADATA.find((item) => item.id === id) ?? null;
const rawAnchor = (item) => ANATOLIA_PROVINCE_REFINEMENTS[item.id]?.anchor ?? item.centroid;
const landPolygons = () => ANATOLIA_PHYSICAL_ATLAS.landPolygons;

function pointInPolygon(point, polygon) {
  if (!polygon?.length) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    if (
      (a[1] > point[1]) !== (b[1] > point[1])
      && point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / ((b[1] - a[1]) || EPS) + a[0]
    ) inside = !inside;
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

function supplementalLandForAnchor(anchorPoint) {
  return ANATOLIA_NATURAL_EARTH_LAND
    .map((land) => ({
      land,
      distance: pointInPolygon(anchorPoint, land) ? 0 : distanceToPolygon(anchorPoint, land),
    }))
    .filter((entry) => entry.distance <= NEAR_COAST_LIMIT)
    .sort((a, b) => a.distance - b.distance)
    .map((entry) => entry.land);
}

function inLake(point) {
  return ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => pointInPolygon(point, lake.coordinates));
}

function isStaticLandPoint(point) {
  if (landPolygons().some((polygon) => pointInPolygon(point, polygon))) return true;
  let distance = Infinity;
  for (const polygon of landPolygons()) distance = Math.min(distance, distanceToPolygon(point, polygon));
  return distance <= COAST_TOLERANCE;
}

function isPhysicalLandPoint(point) {
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
    const p = sites[other].point;
    polygon = halfPlane(
      polygon,
      2 * (p[0] - site[0]),
      2 * (p[1] - site[1]),
      p[0] ** 2 + p[1] ** 2 - site[0] ** 2 - site[1] ** 2,
    );
    if (polygon.length < 3) return [];
  }
  return polygon;
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

function clipCellToLand(cell, anchorPoint) {
  const primary = landPolygons()
    .map((land) => clipLandByCell(land, cell))
    .filter((polygon) => polygon.length >= 3 && area(polygon) >= MIN_AREA);
  if (primary.length) return primary;

  return supplementalLandForAnchor(anchorPoint)
    .map((land) => clipLandByCell(land, cell))
    .filter((polygon) => polygon.length >= 3 && area(polygon) >= MIN_AREA);
}

function edgeOnLand(polygon) {
  for (let i = 0; i < polygon.length; i += 1) {
    const start = polygon[i];
    const end = polygon[(i + 1) % polygon.length];
    for (const fraction of EDGE_FRACTIONS) {
      const point = [
        start[0] + (end[0] - start[0]) * fraction,
        start[1] + (end[1] - start[1]) * fraction,
      ];
      if (!isPhysicalLandPoint(point)) return false;
    }
  }
  return true;
}

function filterLakeSafePolygons(polygons, provinceId) {
  const safe = [];
  for (const polygon of polygons) {
    if (polygon.length < 3 || area(polygon) < MIN_AREA) continue;
    if (!edgeOnLand(polygon)) continue;
    safe.push(polygon);
  }
  if (!safe.length) throw new Error(`Phase 2D produced no physical-land geometry for ${provinceId}`);
  return safe;
}

function samplingSiteCount() {
  let count = 0;
  for (let longitude = BBOX[0]; longitude <= BBOX[2] + EPS; longitude += SAMPLE_STEP) {
    for (let latitude = BBOX[1]; latitude <= BBOX[3] + EPS; latitude += SAMPLE_STEP) {
      if (isPhysicalLandPoint([longitude, latitude])) count += 1;
    }
  }
  return count;
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
      precision: "multi-control-land-partition",
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
      precision: "multi-control-land-partition",
      anchor: rawAnchor(item),
    },
    polygons,
  };
}

function buildControlSites() {
  const sites = [];
  for (const item of ANATOLIA_PROVINCE_METADATA) {
    sites.push({ point: rawAnchor(item), provinceId: item.id, kind: "province-anchor" });
    for (const point of PROVINCE_SUPPORT_CONTROLS[item.id] ?? []) {
      sites.push({ point, provinceId: item.id, kind: "province-support-control" });
    }
  }
  return sites;
}

export function buildAnatoliaPhase2DAssets() {
  validateManifest();
  const controlSites = buildControlSites();
  for (const site of controlSites) {
    if (!isAnatoliaGeometryPoint(site.point) || !isPhysicalLandPoint(site.point)) {
      throw new Error(`Invalid 1300 province control site: ${site.provinceId} ${site.point.join(",")}`);
    }
  }

  const naturalFeatureSiteCount = [...ANATOLIA_STRATEGIC_PASSES, ...ANATOLIA_RIVER_CROSSINGS]
    .reduce((count, feature) => count + (feature.provinces?.length ?? 0), 0);
  const polygonsByProvince = new Map(ANATOLIA_PROVINCE_METADATA.map((item) => [item.id, []]));

  for (let index = 0; index < controlSites.length; index += 1) {
    const site = controlSites[index];
    const cell = voronoiCell(index, controlSites);
    const clipped = clipCellToLand(cell, site.point);
    const safe = filterLakeSafePolygons(clipped, site.provinceId);
    const target = polygonsByProvince.get(site.provinceId);
    for (const polygon of safe) {
      target.push(polygon.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]));
    }
  }

  const provinces = [];
  const geometries = [];
  for (const item of ANATOLIA_PROVINCE_METADATA) {
    const polygons = polygonsByProvince.get(item.id) ?? [];
    if (!polygons.length) throw new Error(`Phase 2D produced no geometry for ${item.id}`);
    provinces.push(provinceAsset(item, polygons));
    geometries.push(geometryAsset(item, polygons));
  }

  const physicalSamplingSiteCount = samplingSiteCount();
  const supportSiteCount = controlSites.length - ANATOLIA_PROVINCE_METADATA.length;
  return {
    schemaVersion: 1,
    geometryVersion: 10,
    historicalDate: "1300-01-01",
    provider: "historia-ai-curated-cartography",
    dataset: "anatolia-province-geometry-1300",
    projection: "EPSG:4326",
    method: "38 historical province identities partitioned by one anchor plus deterministic territorial support controls, clipped to the curated physical land mask, with Natural Earth used only as a coastal fallback; no per-province shrink pass",
    siteCount: physicalSamplingSiteCount + controlSites.length + naturalFeatureSiteCount,
    politicalSiteCount: controlSites.length,
    physicalSamplingSiteCount,
    barrierSiteCount: 0,
    naturalFeatureSiteCount,
    supportSiteCount,
    fallbackProvinceCount: 0,
    provinceCount: provinces.length,
    polygonCount: geometries.reduce((sum, item) => sum + item.polygons.length, 0),
    provinces,
    geometries,
  };
}

export function isAnatoliaGeometryPoint([longitude, latitude]) {
  if (longitude < 26.5 || longitude > 44.8 || latitude < 35.7 || latitude > 42.2) return false;
  const exclusion = [
    [26.5, 42.2], [29.5, 42.2], [29.5, 41.25], [29.05, 40.72],
    [28.45, 40.48], [27.55, 40.45], [26.5, 40.65],
  ];
  return !pointInPolygon([longitude, latitude], exclusion);
}

export { isPhysicalLandPoint };
