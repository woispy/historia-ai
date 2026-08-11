import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";

const BBOX = [25.45, 35.72, 44.85, 42.35];
const GRID_STEP = 0.22;
const SITE_EPSILON = 1e-6;

function distanceSquared(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

function pointInPolygon(point, polygon) {
  let inside = false;
  const [x, y] = point;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i += 1) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersects = yi > y !== yj > y
      && x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInLand(point) {
  return ANATOLIA_PHYSICAL_ATLAS.landPolygons.some((polygon) => pointInPolygon(point, polygon));
}

function pointInWaterEnvelope(point) {
  return ANATOLIA_PHYSICAL_ATLAS.seas.some((sea) => pointInPolygon(point, sea.coordinates));
}

function isWithinAnatoliaEnvelope(point) {
  const [longitude, latitude] = point;
  if (longitude < 28.5) return latitude <= 40.78;
  if (longitude < 29.2) return latitude <= 40.88;
  return latitude <= 42.20;
}

function isUsableLandPoint(point) {
  return isWithinAnatoliaEnvelope(point)
    && pointInLand(point)
    && !pointInWaterEnvelope(point);
}

function nearestProvinceId(point) {
  let winner = ANATOLIA_PROVINCE_METADATA[0];
  let best = Number.POSITIVE_INFINITY;
  for (const province of ANATOLIA_PROVINCE_METADATA) {
    const distance = distanceSquared(point, province.centroid);
    if (distance < best) {
      best = distance;
      winner = province;
    }
  }
  return winner.id;
}

function deterministicJitter(xIndex, yIndex) {
  const seed = Math.sin((xIndex * 92821 + yIndex * 68917 + 1300) * 0.00017) * 43758.5453;
  return (seed - Math.floor(seed)) - 0.5;
}

function addSite(sites, seen, point, provinceId, kind) {
  const rounded = `${point[0].toFixed(4)}:${point[1].toFixed(4)}`;
  if (seen.has(rounded)) return;
  seen.add(rounded);
  sites.push({ point, provinceId, kind });
}

function addAnchorSites(sites, seen) {
  for (const province of ANATOLIA_PROVINCE_METADATA) {
    addSite(sites, seen, province.centroid, province.id, "province-anchor");
  }
}

function addGridSites(sites, seen) {
  let yIndex = 0;
  for (let y = BBOX[1]; y <= BBOX[3] + SITE_EPSILON; y += GRID_STEP) {
    let xIndex = 0;
    for (let x = BBOX[0]; x <= BBOX[2] + SITE_EPSILON; x += GRID_STEP) {
      const point = [
        x + deterministicJitter(xIndex, yIndex) * GRID_STEP * 0.22,
        y + deterministicJitter(xIndex + 17, yIndex + 31) * GRID_STEP * 0.22,
      ];
      if (isUsableLandPoint(point)) addSite(sites, seen, point, nearestProvinceId(point), "land-grid");
      xIndex += 1;
    }
    yIndex += 1;
  }
}

function addCoastSites(sites, seen) {
  for (const polygon of ANATOLIA_PHYSICAL_ATLAS.landPolygons) {
    for (let index = 0; index < polygon.length - 1; index += 1) {
      const start = polygon[index];
      const end = polygon[index + 1];
      const length = Math.sqrt(distanceSquared(start, end));
      const steps = Math.max(1, Math.ceil(length / 0.24));
      for (let step = 0; step <= steps; step += 1) {
        const t = step / steps;
        const point = [
          start[0] + (end[0] - start[0]) * t,
          start[1] + (end[1] - start[1]) * t,
        ];
        if (isUsableLandPoint(point)) addSite(sites, seen, point, nearestProvinceId(point), "coastline");
      }
    }
  }
}

function addSourceShapeSites(sites, seen, sourceRegions) {
  for (const region of sourceRegions ?? []) {
    const polygon = region?.polygons?.find((candidate) => Array.isArray(candidate) && candidate.length >= 3);
    if (!polygon) continue;
    const center = polygon.reduce(
      (sum, [x, y]) => [sum[0] + x, sum[1] + y],
      [0, 0],
    );
    const point = [center[0] / polygon.length, center[1] / polygon.length];
    if (isUsableLandPoint(point)) addSite(sites, seen, point, nearestProvinceId(point), "historical-source-anchor");
  }
}

function clipHalfPlane(polygon, a, b, c) {
  if (!polygon.length) return [];
  const output = [];
  const inside = (point) => a * point[0] + b * point[1] <= c + SITE_EPSILON;

  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    const currentInside = inside(current);
    const nextInside = inside(next);

    if (currentInside && nextInside) {
      output.push(next);
      continue;
    }

    if (currentInside !== nextInside) {
      const currentValue = a * current[0] + b * current[1] - c;
      const nextValue = a * next[0] + b * next[1] - c;
      const denominator = currentValue - nextValue;
      const t = Math.abs(denominator) < SITE_EPSILON ? 0 : currentValue / denominator;
      output.push([
        current[0] + (next[0] - current[0]) * t,
        current[1] + (next[1] - current[1]) * t,
      ]);
    }

    if (!currentInside && nextInside) output.push(next);
  }
  return output;
}

function buildVoronoiCell(siteIndex, sites) {
  const site = sites[siteIndex].point;
  let polygon = [
    [BBOX[0], BBOX[1]],
    [BBOX[2], BBOX[1]],
    [BBOX[2], BBOX[3]],
    [BBOX[0], BBOX[3]],
  ];

  for (let otherIndex = 0; otherIndex < sites.length; otherIndex += 1) {
    if (siteIndex === otherIndex) continue;
    const other = sites[otherIndex].point;
    const a = 2 * (other[0] - site[0]);
    const b = 2 * (other[1] - site[1]);
    const c = other[0] ** 2 + other[1] ** 2 - site[0] ** 2 - site[1] ** 2;
    polygon = clipHalfPlane(polygon, a, b, c);
    if (polygon.length < 3) return [];
  }
  return polygon;
}

function roundPolygon(polygon) {
  return polygon.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]);
}

function polygonArea(polygon) {
  let area = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    area += current[0] * next[1] - next[0] * current[1];
  }
  return Math.abs(area) / 2;
}

function createProvinceAsset(metadata, polygons) {
  return {
    header: {
      assetType: "province",
      assetVersion: 5,
      generator: "Historia AI Phase 2D Geometry Builder",
      provider: "historia-ai-curated-cartography",
      dataset: "anatolia-province-geometry-1300",
      historicalDate: "1300-01-01",
      borderPrecision: metadata.borderConfidence === "high" ? 3 : 2,
      sourceFeatureId: metadata.id,
      sourceFeatureIndex: null,
    },
    identity: { id: metadata.id, name: metadata.name },
    references: { geometryId: metadata.id, countryId: metadata.countryId, capitalCityId: metadata.cityId },
    ownership: {
      countryId: metadata.countryId,
      ownerId: metadata.historicalControl.controllerAt1300 ?? metadata.countryId,
    },
    historical: {
      sourceFeatureId: metadata.id,
      sourceFeatureIndex: null,
      sourceName: metadata.name,
      subject: metadata.countryId,
      partOf: metadata.regionId,
      borderPrecision: metadata.borderConfidence === "high" ? 3 : 2,
      classification: "phase2d-anatolia-province-geometry",
      precision: "cartographic-refinement",
      anchor: metadata.centroid,
      historicalControl: metadata.historicalControl,
    },
    administration: { governorId: null },
    population: { total: 0 },
    economy: { development: 0, wealth: 0 },
    military: { supplyLimit: 0 },
    culture: { primaryCulture: null },
    religion: { primaryReligion: null },
    geometry: { coastal: metadata.coastal, port: metadata.port, terrain: metadata.terrain, strategic: metadata.strategic },
    polygons,
  };
}

function createGeometryAsset(metadata, polygons) {
  return {
    header: {
      assetType: "geometry",
      assetVersion: 5,
      generator: "Historia AI Phase 2D Geometry Builder",
      provider: "historia-ai-curated-cartography",
      dataset: "anatolia-province-geometry-1300",
      historicalDate: "1300-01-01",
      borderPrecision: metadata.borderConfidence === "high" ? 3 : 2,
      sourceFeatureId: metadata.id,
      sourceFeatureIndex: null,
    },
    identity: { id: metadata.id, provinceId: metadata.id },
    metadata: {
      sourceFeatureId: metadata.id,
      sourceFeatureIndex: null,
      name: metadata.name,
      subject: metadata.countryId,
      partOf: metadata.regionId,
      borderPrecision: metadata.borderConfidence === "high" ? 3 : 2,
      classification: "phase2d-anatolia-province-geometry",
      precision: "cartographic-refinement",
    },
    polygons,
  };
}

export function buildAnatoliaPhase2DAssets(sourceRegions = []) {
  const sites = [];
  const seen = new Set();
  addAnchorSites(sites, seen);
  addGridSites(sites, seen);
  addCoastSites(sites, seen);
  addSourceShapeSites(sites, seen, sourceRegions);

  const polygonsByProvince = Object.fromEntries(
    ANATOLIA_PROVINCE_METADATA.map((metadata) => [metadata.id, []]),
  );

  for (let siteIndex = 0; siteIndex < sites.length; siteIndex += 1) {
    const cell = buildVoronoiCell(siteIndex, sites);
    if (cell.length < 3 || polygonArea(cell) < 0.00005) continue;
    polygonsByProvince[sites[siteIndex].provinceId].push(roundPolygon(cell));
  }

  const provinces = [];
  const geometries = [];
  for (const metadata of ANATOLIA_PROVINCE_METADATA) {
    const polygons = polygonsByProvince[metadata.id];
    if (!polygons.length) throw new Error(`Phase 2D produced no geometry for ${metadata.id}`);
    provinces.push(createProvinceAsset(metadata, polygons));
    geometries.push(createGeometryAsset(metadata, polygons));
  }

  return {
    schemaVersion: 1,
    geometryVersion: 1,
    historicalDate: "1300-01-01",
    provider: "historia-ai-curated-cartography",
    dataset: "anatolia-province-geometry-1300",
    projection: "EPSG:4326",
    method: "deterministic multi-site Voronoi cartography constrained by the Phase 2 physical land envelope",
    siteCount: sites.length,
    provinceCount: provinces.length,
    polygonCount: geometries.reduce((sum, geometry) => sum + geometry.polygons.length, 0),
    provinces,
    geometries,
  };
}

export function isAnatoliaGeometryPoint(point) {
  return isUsableLandPoint(point);
}
