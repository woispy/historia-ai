import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";

const BBOX = [25.45, 35.72, 44.85, 42.35];
const SITE_EPSILON = 1e-6;
const COAST_SAMPLE_STEP = 0.12;
const EDGE_SAMPLE_STEP = 0.03;
const COASTAL_TOLERANCE = 0.06;

// Historical city anchors can legitimately sit on or beside water. Physical
// reconciliation anchors are deliberately separate from historical centroids.
// They are only used to seed a tiny land-safe fallback when a Voronoi cell cannot
// be reconciled. Keep these points on the curated physical land mask itself.
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
  const inSeaEnvelope = ANATOLIA_PHYSICAL_ATLAS.seas.some((sea) => pointInPolygon(point, sea.coordinates));
  const inLand = pointInAnatoliaLand(point);
  const inLake = ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => pointInPolygon(point, lake.coordinates));
  return (inSeaEnvelope && !inLand) || inLake;
}

function pointToSegmentDistanceSquared(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  if (dx === 0 && dy === 0) return distanceSquared(point, start);
  const t = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy)));
  return distanceSquared(point, [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t]);
}

function closestPointOnSegment(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  if (dx === 0 && dy === 0) return start;
  const t = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy)));
  return [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t];
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
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    if (!isPhysicalLandPoint(start) || !isPhysicalLandPoint(end)) return false;
    const length = Math.sqrt(distanceSquared(start, end));
    const samples = Math.max(1, Math.ceil(length / EDGE_SAMPLE_STEP));
    for (let sample = 1; sample < samples; sample += 1) {
      const fraction = sample / samples;
      const point = [
        start[0] + (end[0] - start[0]) * fraction,
        start[1] + (end[1] - start[1]) * fraction,
      ];
      if (!isPhysicalLandPoint(point)) return false;
    }
  }
  return true;
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
    for (const radius of radii) {
      for (let direction = 0; direction < directions; direction += 1) {
        const angle = (direction / directions) * Math.PI * 2
          + deterministicJitter(sequence, province.centroid[1] * 100);
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
      addSite(sites, seen, [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t], null, kind);
    }
  }
}

function addPhysicalBarrierSites(sites, seen) {
  for (const polygon of ANATOLIA_PHYSICAL_ATLAS.landPolygons) addBarrierSitesAlongPolygon(sites, seen, polygon, "coastline-barrier");
  for (const sea of ANATOLIA_PHYSICAL_ATLAS.seas) addBarrierSitesAlongPolygon(sites, seen, sea.coordinates, "water-barrier");
  for (const lake of ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes) addBarrierSitesAlongPolygon(sites, seen, lake.coordinates, "lake-barrier");
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
      if (isPoliticalCartographicPoint(inward)) addSite(sites, seen, inward, nearestProvinceId(inward), "coastline-interior");
    }
  }
}

function addSourceShapeSites(sites, seen, sourceRegions) {
  for (const region of sourceRegions ?? []) {
    const polygon = region?.polygons?.find((candidate) => Array.isArray(candidate) && candidate.length >= 3);
    if (!polygon) continue;
    const center = polygon.reduce((sum, [x, y]) => [sum[0] + x, sum[1] + y], [0, 0]);
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
      output.push([current[0] + (next[0] - current[0]) * t, current[1] + (next[1] - current[1]) * t]);
    }
  }
  return output;
}

function buildVoronoiCell(site, sites) {
  let polygon = [[BBOX[0], BBOX[1]], [BBOX[2], BBOX[1]], [BBOX[2], BBOX[3]], [BBOX[0], BBOX[3]]];
  for (const other of sites) {
    if (other === site) continue;
    const dx = other.point[0] - site.point[0];
    const dy = other.point[1] - site.point[1];
    if (Math.abs(dx) < SITE_EPSILON && Math.abs(dy) < SITE_EPSILON) continue;
    const a = dx;
    const b = dy;
    const c = (other.point[0] ** 2 + other.point[1] ** 2 - site.point[0] ** 2 - site.point[1] ** 2) / 2;
    polygon = clipHalfPlane(polygon, a, b, c);
    if (!polygon.length) break;
  }
  return polygon;
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
  const sum = polygon.reduce((total, [longitude, latitude]) => [total[0] + longitude, total[1] + latitude], [0, 0]);
  return [sum[0] / polygon.length, sum[1] / polygon.length];
}

function buildFallbackPolygon(center, polygonRadii) {
  for (const polygonRadius of polygonRadii) {
    const polygon = Array.from({ length: 6 }, (_, index) => {
      const polygonAngle = (index / 6) * Math.PI * 2;
      return [center[0] + Math.cos(polygonAngle) * polygonRadius, center[1] + Math.sin(polygonAngle) * polygonRadius];
    });
    if (isPhysicalLandPolygon(polygon)) return polygon;
  }
  return [];
}

function findNearestLakeShore(point) {
  let winner = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const lake of ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes) {
    const coordinates = lake.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) continue;
    for (let index = 0; index < coordinates.length - 1; index += 1) {
      const shore = closestPointOnSegment(point, coordinates[index], coordinates[index + 1]);
      const distance = distanceSquared(point, shore);
      if (distance < bestDistance) {
        bestDistance = distance;
        winner = { shore, lakeCenter: polygonCentroid(coordinates) };
      }
    }
  }
  return winner;
}

function createAnchorFallbackPolygon(centroid, requiresLandSafe = false, physicalLandAnchor = null) {
  const polygonRadii = [0.002, 0.001, 0.0005, 0.00025, 0.0001, 0.00005];
  const searchPasses = [
    { radialStep: 0.0025, maxRadius: 0.25, directions: 32 },
    { radialStep: 0.005, maxRadius: 0.75, directions: 32 },
    { radialStep: 0.01, maxRadius: 1.5, directions: 32 },
  ];
  if (!requiresLandSafe) return buildFallbackPolygon(centroid, polygonRadii.slice(0, 2));

  const explicitAnchor = physicalLandAnchor;
  if (explicitAnchor && isWithinAnatoliaEnvelope(explicitAnchor) && isUsableCartographicPoint(explicitAnchor)) {
    const polygon = buildFallbackPolygon(explicitAnchor, polygonRadii);
    if (polygon.length >= 3) return polygon;
  }

  const shore = findNearestLakeShore(centroid);
  if (shore) {
    const outward = [shore.shore[0] - shore.lakeCenter[0], shore.shore[1] - shore.lakeCenter[1]];
    const length = Math.hypot(outward[0], outward[1]) || 1;
    const unit = [outward[0] / length, outward[1] / length];
    const shoreDistances = [0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.35, 0.5, 0.75];
    for (const sign of [1, -1]) {
      for (const distance of shoreDistances) {
        const center = [shore.shore[0] + unit[0] * distance * sign, shore.shore[1] + unit[1] * distance * sign];
        if (!isWithinAnatoliaEnvelope(center) || !isUsableCartographicPoint(center)) continue;
        const polygon = buildFallbackPolygon(center, polygonRadii);
        if (polygon.length >= 3) return polygon;
      }
    }
  }

  for (const search of searchPasses) {
    for (let radius = 0; radius <= search.maxRadius; radius += search.radialStep) {
      for (let direction = 0; direction < search.directions; direction += 1) {
        const angle = (direction / search.directions) * Math.PI * 2;
        const center = [centroid[0] + Math.cos(angle) * radius, centroid[1] + Math.sin(angle) * radius];
        if (!isWithinAnatoliaEnvelope(center) || !isUsableCartographicPoint(center)) continue;
        const polygon = buildFallbackPolygon(center, polygonRadii);
        if (polygon.length >= 3) return polygon;
      }
    }
  }
  return [];
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
    geometry: { type: "Polygon", coordinates: polygons },
    properties: {
      cityId: metadata.cityId,
      regionId: metadata.regionId,
      countryId: metadata.countryId,
      coastal: metadata.coastal,
      terrain: metadata.terrain,
      strategic: metadata.strategic,
      port: metadata.port,
      historicalControl: metadata.historicalControl,
    },
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

  const provinceAssets = [];
  const geometryAssets = [];
  for (const province of ANATOLIA_PROVINCE_METADATA) {
    const provinceSite = sites.find((site) => site.provinceId === province.id && site.kind === "province-anchor");
    let polygon = provinceSite ? buildVoronoiCell(provinceSite, sites) : [];
    if (polygon.length < 3 || !polygon.every(isPoliticalCartographicPoint)) {
      polygon = createAnchorFallbackPolygon(
        province.centroid,
        true,
        PHYSICAL_LAND_ANCHORS[province.id] ?? null,
      );
    }
    if (polygon.length < 3) {
      const physicalAnchor = PHYSICAL_LAND_ANCHORS[province.id] ?? province.centroid;
      throw new Error(
        `Phase 2D produced no physically valid geometry for ${province.id}`
        + `; centroid=${province.centroid.join(",")}`
        + `; physicalAnchor=${physicalAnchor.join(",")}`
        + `; land=${pointInAnatoliaLand(physicalAnchor)}`
        + `; water=${pointInWaterEnvelope(physicalAnchor)}`
        + `; boundaryDistance=${distanceToLandBoundary(physicalAnchor).toFixed(6)}`,
      );
    }
    const asset = createProvinceAsset(province, [polygon]);
    provinceAssets.push(asset);
    geometryAssets.push({ ...asset, header: { ...asset.header, assetType: "geometry" } });
  }

  return { provinces: provinceAssets, geometries: geometryAssets };
}
