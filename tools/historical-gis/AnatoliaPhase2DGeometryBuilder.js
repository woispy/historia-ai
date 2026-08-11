import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";

const BBOX = [25.45, 35.72, 44.85, 42.35];
const SITE_EPSILON = 1e-6;
const COAST_SAMPLE_STEP = 0.12;

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

function pointInWaterEnvelope(point) {
  return ANATOLIA_PHYSICAL_ATLAS.seas.some((sea) => pointInPolygon(point, sea.coordinates))
    || ANATOLIA_PHYSICAL_ATLAS.lakes.some((lake) => pointInPolygon(point, lake.coordinates));
}

function pointInAnatoliaLand(point) {
  return ANATOLIA_PHYSICAL_ATLAS.landPolygons.some((polygon) => pointInPolygon(point, polygon));
}

function isWithinAnatoliaEnvelope(point) {
  const [longitude, latitude] = point;
  if (longitude < 28.5) return latitude <= 40.78;
  if (longitude < 29.2) return latitude <= 40.88;
  return latitude <= 42.20;
}

function isUsableCartographicPoint(point) {
  return isWithinAnatoliaEnvelope(point)
    && pointInAnatoliaLand(point)
    && !pointInWaterEnvelope(point);
}

function isPhysicalLandPoint(point) {
  return pointInAnatoliaLand(point) && !pointInWaterEnvelope(point);
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

function deterministicJitter(index, seed = 1300) {
  const value = Math.sin((index * 92821 + seed * 68917) * 0.00017) * 43758.5453;
  return (value - Math.floor(value)) - 0.5;
}

function addSite(sites, seen, point, provinceId, kind) {
  const rounded = `${point[0].toFixed(4)}:${point[1].toFixed(4)}:${provinceId ?? "barrier"}`;
  if (seen.has(rounded)) return;
  seen.add(rounded);
  sites.push({ point, provinceId, kind });
}

function addAnchorSites(sites, seen) {
  for (const province of ANATOLIA_PROVINCE_METADATA) {
    addSite(sites, seen, province.centroid, province.id, "province-anchor");
  }
}

function addProvinceMicroSites(sites, seen) {
  const radii = [0.04, 0.08, 0.12];
  const directions = 8;
  let sequence = 0;

  for (const province of ANATOLIA_PROVINCE_METADATA) {
    for (const radius of radii) {
      for (let direction = 0; direction < directions; direction += 1) {
        const angle = (direction / directions) * Math.PI * 2
          + deterministicJitter(sequence, province.centroid[0] * 100);
        const point = [
          province.centroid[0] + Math.cos(angle) * radius,
          province.centroid[1] + Math.sin(angle) * radius,
        ];
        if (isUsableCartographicPoint(point)) addSite(sites, seen, point, province.id, "province-micro-control");
        sequence += 1;
      }
    }
  }
}

function addProvinceShapeSites(sites, seen) {
  const radii = [0.12, 0.24, 0.38];
  const directions = 12;
  let sequence = 0;

  for (const province of ANATOLIA_PROVINCE_METADATA) {
    for (let ring = 0; ring < radii.length; ring += 1) {
      for (let direction = 0; direction < directions; direction += 1) {
        const angle = (direction / directions) * Math.PI * 2
          + deterministicJitter(sequence, province.centroid[0] * 100);
        const radius = radii[ring] * (1 + deterministicJitter(sequence + 11, province.centroid[1] * 100) * 0.18);
        const point = [
          province.centroid[0] + Math.cos(angle) * radius,
          province.centroid[1] + Math.sin(angle) * radius,
        ];
        if (isUsableCartographicPoint(point)) addSite(sites, seen, point, province.id, "province-shape-control");
        sequence += 1;
      }
    }
  }
}

function addBarrierSitesAlongPolygon(sites, seen, polygon, kind) {
  if (!Array.isArray(polygon) || polygon.length < 3) return;

  for (let index = 0; index < polygon.length - 1; index += 1) {
    const start = polygon[index];
    const end = polygon[index + 1];
    const length = Math.sqrt(distanceSquared(start, end));
    const steps = Math.max(1, Math.ceil(length / COAST_SAMPLE_STEP));

    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      const point = [
        start[0] + (end[0] - start[0]) * t,
        start[1] + (end[1] - start[1]) * t,
      ];
      addSite(sites, seen, point, null, kind);
    }
  }
}

function addPhysicalBarrierSites(sites, seen) {
  for (const polygon of ANATOLIA_PHYSICAL_ATLAS.landPolygons) {
    addBarrierSitesAlongPolygon(sites, seen, polygon, "coastline-barrier");
  }

  for (const sea of ANATOLIA_PHYSICAL_ATLAS.seas) {
    addBarrierSitesAlongPolygon(sites, seen, sea.coordinates, "water-barrier");
  }

  for (const lake of ANATOLIA_PHYSICAL_ATLAS.lakes) {
    addBarrierSitesAlongPolygon(sites, seen, lake.coordinates, "lake-barrier");
  }
}

function addCoastInteriorSites(sites, seen) {
  for (const polygon of ANATOLIA_PHYSICAL_ATLAS.landPolygons) {
    for (let index = 0; index < polygon.length - 1; index += 1) {
      const start = polygon[index];
      const end = polygon[index + 1];
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const length = Math.sqrt(dx * dx + dy * dy) || 1;
      const left = [-dy / length, dx / length];
      const midpoint = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
      const candidateA = [midpoint[0] + left[0] * 0.045, midpoint[1] + left[1] * 0.045];
      const candidateB = [midpoint[0] - left[0] * 0.045, midpoint[1] - left[1] * 0.045];
      const inward = pointInAnatoliaLand(candidateA) ? candidateA : candidateB;
      if (isUsableCartographicPoint(inward)) {
        addSite(sites, seen, inward, nearestProvinceId(inward), "coastline-interior");
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
    if (isUsableCartographicPoint(point)) addSite(sites, seen, point, nearestProvinceId(point), "historical-source-anchor");
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

function pointOnSegment(point, start, end) {
  const cross = (point[1] - start[1]) * (end[0] - start[0])
    - (point[0] - start[0]) * (end[1] - start[1]);
  if (Math.abs(cross) > 1e-7) return false;
  return point[0] >= Math.min(start[0], end[0]) - SITE_EPSILON
    && point[0] <= Math.max(start[0], end[0]) + SITE_EPSILON
    && point[1] >= Math.min(start[1], end[1]) - SITE_EPSILON
    && point[1] <= Math.max(start[1], end[1]) + SITE_EPSILON;
}

function segmentIntersection(a, b, c, d) {
  const denominator = (a[0] - b[0]) * (c[1] - d[1]) - (a[1] - b[1]) * (c[0] - d[0]);
  if (Math.abs(denominator) < 1e-10) return null;
  const t = ((a[0] - c[0]) * (c[1] - d[1]) - (a[1] - c[1]) * (c[0] - d[0])) / denominator;
  const u = -((a[0] - b[0]) * (a[1] - c[1]) - (a[1] - b[1]) * (a[0] - c[0])) / denominator;
  if (t < -SITE_EPSILON || t > 1 + SITE_EPSILON || u < -SITE_EPSILON || u > 1 + SITE_EPSILON) return null;
  return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
}

function uniquePoints(points) {
  const seen = new Set();
  const result = [];
  for (const point of points) {
    const key = `${point[0].toFixed(6)}:${point[1].toFixed(6)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(point);
  }
  return result;
}

function clipCellToLand(cell) {
  const land = ANATOLIA_PHYSICAL_ATLAS.landPolygons[0];
  if (!land || land.length < 3) return cell;

  const points = [];
  for (const point of cell) {
    if (pointInPolygon(point, land) || land.some((_, index) => pointOnSegment(point, land[index], land[(index + 1) % land.length]))) {
      points.push(point);
    }
  }

  for (const point of land) {
    if (pointInPolygon(point, cell)) points.push(point);
  }

  for (let cellIndex = 0; cellIndex < cell.length; cellIndex += 1) {
    const a = cell[cellIndex];
    const b = cell[(cellIndex + 1) % cell.length];
    for (let landIndex = 0; landIndex < land.length; landIndex += 1) {
      const c = land[landIndex];
      const d = land[(landIndex + 1) % land.length];
      const intersection = segmentIntersection(a, b, c, d);
      if (intersection) points.push(intersection);
    }
  }

  const unique = uniquePoints(points);
  if (unique.length < 3) return [];
  const center = unique.reduce(
    (sum, [x, y]) => [sum[0] + x, sum[1] + y],
    [0, 0],
  );
  center[0] /= unique.length;
  center[1] /= unique.length;
  unique.sort((a, b) => Math.atan2(a[1] - center[1], a[0] - center[0]) - Math.atan2(b[1] - center[1], b[0] - center[0]));
  return unique;
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

function polygonCentroid(polygon) {
  const sum = polygon.reduce(
    (total, [longitude, latitude]) => [total[0] + longitude, total[1] + latitude],
    [0, 0],
  );
  return [sum[0] / polygon.length, sum[1] / polygon.length];
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
  addProvinceMicroSites(sites, seen);
  addProvinceShapeSites(sites, seen);
  addPhysicalBarrierSites(sites, seen);
  addCoastInteriorSites(sites, seen);
  addSourceShapeSites(sites, seen, sourceRegions);

  const polygonsByProvince = Object.fromEntries(
    ANATOLIA_PROVINCE_METADATA.map((metadata) => [metadata.id, []]),
  );

  for (let siteIndex = 0; siteIndex < sites.length; siteIndex += 1) {
    if (!sites[siteIndex].provinceId) continue;
    const cell = buildVoronoiCell(siteIndex, sites);
    if (cell.length < 3 || polygonArea(cell) < 0.00005) continue;
    const clipped = clipCellToLand(cell);
    if (clipped.length < 3 || polygonArea(clipped) < 0.00005) continue;
    if (!isPhysicalLandPoint(polygonCentroid(clipped))) continue;
    polygonsByProvince[sites[siteIndex].provinceId].push(roundPolygon(clipped));
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
    geometryVersion: 2,
    historicalDate: "1300-01-01",
    provider: "historia-ai-curated-cartography",
    dataset: "anatolia-province-geometry-1300",
    projection: "EPSG:4326",
    method: "deterministic multi-site Voronoi cartography constrained by physical coastline and internal water barriers",
    siteCount: sites.length,
    politicalSiteCount: sites.filter((site) => Boolean(site.provinceId)).length,
    barrierSiteCount: sites.filter((site) => !site.provinceId).length,
    provinceCount: provinces.length,
    polygonCount: geometries.reduce((sum, geometry) => sum + geometry.polygons.length, 0),
    provinces,
    geometries,
  };
}

export function isAnatoliaGeometryPoint(point) {
  return isUsableCartographicPoint(point);
}

export { isPhysicalLandPoint };
