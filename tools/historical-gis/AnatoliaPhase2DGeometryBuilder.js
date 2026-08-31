import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";

const BBOX = [25.45, 35.72, 44.85, 42.35];
const SITE_EPSILON = 1e-6;
const COAST_SAMPLE_STEP = 0.12;
const EDGE_SAMPLE_STEP = 0.03;
const COASTAL_TOLERANCE = 0.06;
const FALLBACK_RADII = [0.001, 0.002, 0.004, 0.008, 0.015, 0.025, 0.05, 0.1, 0.2, 0.4, 0.8];
const FALLBACK_DIRECTIONS = 64;

const PHYSICAL_LAND_ANCHORS = Object.freeze({
  "bithynia-nicomedia": [29.80, 40.70],
  "bithynia-nicaea": [29.95, 40.65],
  "pisidia-egirdir": [30.85, 37.98],
  "pisidia-beysehir": [31.72, 37.78],
});

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

function pointInAnatoliaLand(point) {
  return ANATOLIA_PHYSICAL_ATLAS.landPolygons.some((polygon) => pointInPolygon(point, polygon));
}

function pointInWaterEnvelope(point) {
  const inSea = ANATOLIA_PHYSICAL_ATLAS.seas.some((sea) => pointInPolygon(point, sea.coordinates));
  const inLand = pointInAnatoliaLand(point);
  const inLake = ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => pointInPolygon(point, lake.coordinates));
  return (inSea && !inLand) || inLake;
}

function pointToSegmentDistanceSquared(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  if (dx === 0 && dy === 0) return distanceSquared(point, start);
  const t = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy)));
  return distanceSquared(point, [start[0] + dx * t, start[1] + dy * t]);
}

function distanceToLandBoundary(point) {
  let best = Number.POSITIVE_INFINITY;
  for (const polygon of ANATOLIA_PHYSICAL_ATLAS.landPolygons) {
    for (let i = 0; i < polygon.length; i += 1) {
      best = Math.min(best, pointToSegmentDistanceSquared(point, polygon[i], polygon[(i + 1) % polygon.length]));
    }
  }
  return Math.sqrt(best);
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

function isPoliticalCartographicPoint(point) {
  return isWithinAnatoliaEnvelope(point) && !pointInWaterEnvelope(point);
}

function isPhysicalLandPoint(point) {
  return !pointInWaterEnvelope(point)
    && (pointInAnatoliaLand(point) || distanceToLandBoundary(point) <= COASTAL_TOLERANCE);
}

function isPhysicalLandPolygon(polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;
  for (let i = 0; i < polygon.length; i += 1) {
    const start = polygon[i];
    const end = polygon[(i + 1) % polygon.length];
    if (!isPhysicalLandPoint(start) || !isPhysicalLandPoint(end)) return false;
    const samples = Math.max(1, Math.ceil(Math.sqrt(distanceSquared(start, end)) / EDGE_SAMPLE_STEP));
    for (let sample = 1; sample < samples; sample += 1) {
      const t = sample / samples;
      if (!isPhysicalLandPoint([start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t])) return false;
    }
  }
  return true;
}

function deterministicJitter(index, seed = 1300) {
  const value = Math.sin((index * 92821 + seed * 68917) * 0.00017) * 43758.5453;
  return (value - Math.floor(value)) - 0.5;
}

function addSite(sites, seen, point, provinceId, kind) {
  const key = `${point[0].toFixed(4)}:${point[1].toFixed(4)}:${provinceId ?? "barrier"}`;
  if (seen.has(key)) return;
  seen.add(key);
  sites.push({ point, provinceId, kind });
}

function addProvinceSites(sites, seen) {
  let sequence = 0;
  for (const province of ANATOLIA_PROVINCE_METADATA) {
    addSite(sites, seen, province.centroid, province.id, "province-anchor");
    for (const radius of [0.04, 0.08, 0.12]) {
      for (let direction = 0; direction < 8; direction += 1) {
        const angle = (direction / 8) * Math.PI * 2 + deterministicJitter(sequence, province.centroid[0] * 100);
        const point = [province.centroid[0] + Math.cos(angle) * radius, province.centroid[1] + Math.sin(angle) * radius];
        if (isPoliticalCartographicPoint(point)) addSite(sites, seen, point, province.id, "province-control");
        sequence += 1;
      }
    }
  }
}

function addBarrierSites(sites, seen, polygon, kind) {
  if (!Array.isArray(polygon) || polygon.length < 2) return;
  for (let i = 0; i < polygon.length - 1; i += 1) {
    const start = polygon[i];
    const end = polygon[i + 1];
    const steps = Math.max(1, Math.ceil(Math.sqrt(distanceSquared(start, end)) / COAST_SAMPLE_STEP));
    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      addSite(sites, seen, [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t], null, kind);
    }
  }
}

function addPhysicalBarriers(sites, seen) {
  for (const polygon of ANATOLIA_PHYSICAL_ATLAS.landPolygons) addBarrierSites(sites, seen, polygon, "coastline-barrier");
  for (const sea of ANATOLIA_PHYSICAL_ATLAS.seas) addBarrierSites(sites, seen, sea.coordinates, "water-barrier");
  for (const lake of ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes) addBarrierSites(sites, seen, lake.coordinates, "lake-barrier");
}

function addSourceSites(sites, seen, sourceRegions) {
  for (const region of sourceRegions ?? []) {
    const polygon = region?.polygons?.find((candidate) => Array.isArray(candidate) && candidate.length >= 3);
    if (!polygon) continue;
    const center = polygon.reduce((sum, [x, y]) => [sum[0] + x, sum[1] + y], [0, 0]);
    const point = [center[0] / polygon.length, center[1] / polygon.length];
    if (isUsableCartographicPoint(point)) addSite(sites, seen, point, null, "historical-source-anchor");
  }
}

function clipHalfPlane(polygon, a, b, c) {
  if (!polygon.length) return [];
  const output = [];
  const inside = (point) => a * point[0] + b * point[1] <= c + SITE_EPSILON;
  for (let i = 0; i < polygon.length; i += 1) {
    const current = polygon[i];
    const next = polygon[(i + 1) % polygon.length];
    const currentInside = inside(current);
    const nextInside = inside(next);
    if (currentInside && nextInside) output.push(next);
    else if (currentInside !== nextInside) {
      const currentValue = a * current[0] + b * current[1] - c;
      const nextValue = a * next[0] + b * next[1] - c;
      const denominator = currentValue - nextValue;
      const t = Math.abs(denominator) < SITE_EPSILON ? 0 : currentValue / denominator;
      output.push([current[0] + (next[0] - current[0]) * t, current[1] + (next[1] - current[1]) * t]);
    }
  }
  return output;
}

function buildVoronoiCell(siteIndex, sites) {
  const site = sites[siteIndex].point;
  let polygon = [[BBOX[0], BBOX[1]], [BBOX[2], BBOX[1]], [BBOX[2], BBOX[3]], [BBOX[0], BBOX[3]]];
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
  for (let i = 0; i < polygon.length; i += 1) {
    const current = polygon[i];
    const next = polygon[(i + 1) % polygon.length];
    area += current[0] * next[1] - next[0] * current[1];
  }
  return Math.abs(area) / 2;
}

function polygonCentroid(polygon) {
  const sum = polygon.reduce((total, [x, y]) => [total[0] + x, total[1] + y], [0, 0]);
  return [sum[0] / polygon.length, sum[1] / polygon.length];
}

function buildFallbackPolygon(center) {
  if (!isUsableCartographicPoint(center)) return [];
  for (const radius of [0.002, 0.001, 0.0005, 0.00025, 0.0001, 0.00005]) {
    const polygon = Array.from({ length: 6 }, (_, index) => {
      const angle = (index / 6) * Math.PI * 2;
      return [center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius];
    });
    if (isPhysicalLandPolygon(polygon)) return polygon;
  }
  return [];
}

function candidateStatus(point) {
  return {
    inEnvelope: isWithinAnatoliaEnvelope(point),
    inLand: pointInAnatoliaLand(point),
    inWater: pointInWaterEnvelope(point),
    boundaryDistance: Number(distanceToLandBoundary(point).toFixed(6)),
  };
}

function resolvePhysicalFallback(province) {
  const seeds = [];
  const explicit = PHYSICAL_LAND_ANCHORS[province.id];
  if (explicit) seeds.push({ point: explicit, source: "physical-anchor" });
  seeds.push({ point: province.centroid, source: "historical-centroid" });

  const candidates = [];
  const seen = new Set();
  const addCandidate = (point, source) => {
    const key = `${point[0].toFixed(6)}:${point[1].toFixed(6)}`;
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push({ point, source });
  };

  for (const seed of seeds) addCandidate(seed.point, seed.source);
  for (const seed of seeds) {
    for (const radius of FALLBACK_RADII) {
      for (let direction = 0; direction < FALLBACK_DIRECTIONS; direction += 1) {
        const angle = (direction / FALLBACK_DIRECTIONS) * Math.PI * 2;
        addCandidate(
          [seed.point[0] + Math.cos(angle) * radius, seed.point[1] + Math.sin(angle) * radius],
          `${seed.source}-radial-${radius}`,
        );
      }
    }
  }

  let usableCandidateCount = 0;
  let polygonCandidateCount = 0;
  const firstUsable = [];
  for (const candidate of candidates) {
    if (!isUsableCartographicPoint(candidate.point)) continue;
    usableCandidateCount += 1;
    if (firstUsable.length < 5) firstUsable.push({ ...candidate, status: candidateStatus(candidate.point) });
    const polygon = buildFallbackPolygon(candidate.point);
    if (polygon.length >= 3) {
      polygonCandidateCount += 1;
      return {
        polygon,
        candidate,
        diagnostics: {
          candidateCount: candidates.length,
          usableCandidateCount,
          polygonCandidateCount,
          firstUsable,
        },
      };
    }
  }
  return {
    polygon: [],
    candidate: null,
    diagnostics: {
      candidateCount: candidates.length,
      usableCandidateCount,
      polygonCandidateCount,
      firstUsable,
    },
  };
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
    ownership: { countryId: metadata.countryId, ownerId: metadata.historicalControl.controllerAt1300 ?? metadata.countryId },
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
  addProvinceSites(sites, seen);
  addPhysicalBarriers(sites, seen);
  addSourceSites(sites, seen, sourceRegions);

  const polygonsByProvince = Object.fromEntries(ANATOLIA_PROVINCE_METADATA.map((province) => [province.id, []]));
  for (let siteIndex = 0; siteIndex < sites.length; siteIndex += 1) {
    if (!sites[siteIndex].provinceId) continue;
    const cell = buildVoronoiCell(siteIndex, sites);
    if (cell.length < 3 || polygonArea(cell) < 0.00005) continue;
    if (!isPhysicalLandPoint(polygonCentroid(cell))) continue;
    if (!cell.every(isPhysicalLandPoint)) continue;
    const rounded = roundPolygon(cell);
    if (!rounded.every(isPhysicalLandPoint)) continue;
    polygonsByProvince[sites[siteIndex].provinceId].push(rounded);
  }

  let fallbackCount = 0;
  const diagnostics = [];
  const provinces = [];
  const geometries = [];
  for (const metadata of ANATOLIA_PROVINCE_METADATA) {
    let polygons = polygonsByProvince[metadata.id];
    if (!polygons.length) {
      const resolved = resolvePhysicalFallback(metadata);
      diagnostics.push({
        provinceId: metadata.id,
        status: resolved.polygon.length ? "fallback" : "failure",
        candidate: resolved.candidate,
        ...resolved.diagnostics,
      });
      if (!resolved.polygon.length) {
        const physicalAnchor = PHYSICAL_LAND_ANCHORS[metadata.id] ?? metadata.centroid;
        throw new Error(
          `Phase 2D produced no physically valid geometry for ${metadata.id}`
          + `; centroid=${metadata.centroid.join(",")}`
          + `; physicalAnchor=${physicalAnchor.join(",")}`
          + `; anchorStatus=${JSON.stringify(candidateStatus(physicalAnchor))}`
          + `; candidates=${resolved.diagnostics.candidateCount}`
          + `; usableCandidates=${resolved.diagnostics.usableCandidateCount}`,
        );
      }
      polygons = [roundPolygon(resolved.polygon)];
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
    diagnostics,
    provinces,
    geometries,
  };
}

export function isAnatoliaGeometryPoint(point) {
  return isWithinAnatoliaEnvelope(point);
}

export { isPhysicalLandPoint };
