import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST } from "../../src/map/data/Anatolia1300ProvinceGeometryManifest.js";

const BBOX = [25.45, 35.72, 44.85, 42.35];
const SITE_EPSILON = 1e-6;
const COAST_SAMPLE_STEP = 0.12;
const COASTAL_TOLERANCE = 0.06;

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
    || ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => pointInPolygon(point, lake.coordinates));
}

function pointToSegmentDistanceSquared(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  if (dx === 0 && dy === 0) return distanceSquared(point, start);
  const t = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy)));
  return distanceSquared(point, [start[0] + t * dx, start[1] + t * dy]);
}

function distanceToLandBoundary(point) {
  let best = Number.POSITIVE_INFINITY;
  for (const polygon of ANATOLIA_PHYSICAL_ATLAS.landPolygons) {
    for (let index = 0; index < polygon.length; index += 1) {
      const distance = pointToSegmentDistanceSquared(point, polygon[index], polygon[(index + 1) % polygon.length]);
      if (distance < best) best = distance;
    }
  }
  return Math.sqrt(best);
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

function isPoliticalCartographicPoint(point) {
  return isWithinAnatoliaEnvelope(point) && !pointInWaterEnvelope(point);
}

function isPhysicalLandPoint(point) {
  return !pointInWaterEnvelope(point)
    && (pointInAnatoliaLand(point) || distanceToLandBoundary(point) <= COASTAL_TOLERANCE);
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
        if (isPoliticalCartographicPoint(point)) addSite(sites, seen, point, province.id, "province-micro-control");
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
        if (isPoliticalCartographicPoint(point)) addSite(sites, seen, point, province.id, "province-shape-control");
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

  for (const lake of ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes) {
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
      if (isPoliticalCartographicPoint(inward)) {
        addSite(sites, seen, inward, nearestProvinceId(inward), "coastline-interior");
      }
    }
  }
}

function validateGeometryManifest() {
  if (ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST.length !== ANATOLIA_PROVINCE_METADATA.length) {
    throw new Error(
      `Anatolia 1300 geometry manifest mismatch: ${ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST.length} manifest entries for ${ANATOLIA_PROVINCE_METADATA.length} province metadata entries.`,
    );
  }

  const metadataIds = new Set(ANATOLIA_PROVINCE_METADATA.map(({ id }) => id));
  for (const entry of ANATOLIA_1300_PROVINCE_GEOMETRY_MANIFEST) {
    if (!metadataIds.has(entry.id)) {
      throw new Error(`Anatolia 1300 geometry manifest references unknown province: ${entry.id}`);
    }
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

function polygonCentroid(polygon) {
  const sum = polygon.reduce(
    (total, [longitude, latitude]) => [total[0] + longitude, total[1] + latitude],
    [0, 0],
  );
  return [sum[0] / polygon.length, sum[1] / polygon.length];
}

function createAnchorFallbackPolygon(centroid) {
  if (!isWithinAnatoliaEnvelope(centroid)) return [];
  const radius = 0.002;
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (index / 6) * Math.PI * 2;
    return [centroid[0] + Math.cos(angle) * radius, centroid[1] + Math.sin(angle) * radius];
  });
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

export function buildAnatoliaPhase2DAssets() {
  validateGeometryManifest();

  const sites = [];
  const seen = new Set();
  addAnchorSites(sites, seen);
  addProvinceMicroSites(sites, seen);
  addProvinceShapeSites(sites, seen);
  addPhysicalBarrierSites(sites, seen);
  addCoastInteriorSites(sites, seen);

  const polygonsByProvince = Object.fromEntries(
    ANATOLIA_PROVINCE_METADATA.map((metadata) => [metadata.id, []]),
  );

  for (let siteIndex = 0; siteIndex < sites.length; siteIndex += 1) {
    if (!sites[siteIndex].provinceId) continue;
    const cell = buildVoronoiCell(siteIndex, sites);
    if (cell.length < 3 || polygonArea(cell) < 0.00005) continue;
    const centroid = polygonCentroid(cell);
    if (!isPhysicalLandPoint(centroid)) continue;
    if (!cell.every((point) => isPhysicalLandPoint(point))) continue;
    polygonsByProvince[sites[siteIndex].provinceId].push(roundPolygon(cell));
  }

  let fallbackCount = 0;
  const provinces = [];
  const geometries = [];
  for (const metadata of ANATOLIA_PROVINCE_METADATA) {
    let polygons = polygonsByProvince[metadata.id];
    if (!polygons.length) {
      const fallback = createAnchorFallbackPolygon(metadata.centroid);
      if (fallback.length < 3) throw new Error(`Phase 2D produced no geometry for ${metadata.id}`);
      polygons = [roundPolygon(fallback)];
      fallbackCount += 1;
    }
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
    fallbackProvinceCount: fallbackCount,
    provinceCount: provinces.length,
    polygonCount: geometries.reduce((sum, geometry) => sum + geometry.polygons.length, 0),
    provinces,
    geometries,
  };
}

export function isAnatoliaGeometryPoint(point) {
  return isWithinAnatoliaEnvelope(point);
}

export { isPhysicalLandPoint };
