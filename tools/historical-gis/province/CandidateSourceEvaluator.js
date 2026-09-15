/**
 * Historia AI — P3 Candidate Source Evaluator
 *
 * Evidence-based evaluation of candidate historical GIS sources for the
 * anatolia-1300 province boundary authority. Fail-closed by contract:
 *
 *  - Reports feature granularity evidence (bbox-filtered candidate count,
 *    vertex density, geometry types, name properties) — but the actual
 *    usableAsProvinceBoundary verdict stays false until a HUMAN review
 *    sets licenseReview and confirms the granularity.
 *  - updateProvenanceCandidate registers a candidate in the provenance
 *    manifest WITHOUT ever changing requiredSource status or promotion
 *    gates. Provenance is documentation; promotion is a separate,
 *    reviewed decision.
 *
 * This module never invents, snaps, or repairs geometry and never writes
 * to the golden fixture.
 */

const ANATOLIA_BBOX = Object.freeze([25.45, 35.72, 44.85, 42.35]);

function featureName(properties, nameKeys) {
  for (const key of nameKeys) {
    const value = properties?.[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

function ringCoordinateCount(geometry) {
  if (!geometry) return 0;
  if (geometry.type === "Polygon") return (geometry.coordinates ?? []).reduce((sum, ring) => sum + ring.length, 0);
  if (geometry.type === "MultiPolygon") return (geometry.coordinates ?? []).reduce((sum, polygon) => sum + polygon.reduce((inner, ring) => inner + ring.length, 0), 0);
  if (geometry.type === "LineString") return (geometry.coordinates ?? []).length;
  if (geometry.type === "MultiLineString") return (geometry.coordinates ?? []).reduce((sum, line) => sum + line.length, 0);
  if (geometry.type === "Point") return 1;
  return 0;
}

function geometryBbox(geometry) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const visit = (coords) => {
    if (typeof coords?.[0] === "number" && typeof coords?.[1] === "number") {
      minX = Math.min(minX, coords[0]); maxX = Math.max(maxX, coords[0]);
      minY = Math.min(minY, coords[1]); maxY = Math.max(maxY, coords[1]);
      return;
    }
    for (const item of coords ?? []) visit(item);
  };
  visit(geometry?.coordinates);
  if (!Number.isFinite(minX)) return null;
  return { minX, minY, maxX, maxY };
}

function bboxIntersects(a, b) {
  return !(a.maxX < b[0] || a.minX > b[2] || a.maxY < b[1] || a.minY > b[3]);
}

/**
 * Evaluate a candidate GeoJSON source against the Anatolia bbox.
 * Returns evidence-based granularity report. Verdict stays fail-closed.
 */
export function evaluateCandidateSource({ geojson, bbox = ANATOLIA_BBOX, nameKeys = ["name", "NAME", "NAME_EN", "name_en", "admin", "ADMIN", "subject", "SUBJECT", "CNTRY_NAME", "country"] } = {}) {
  if (!geojson || geojson.type !== "FeatureCollection" || !Array.isArray(geojson.features)) {
    throw new Error("candidate source must be a GeoJSON FeatureCollection");
  }

  const features = geojson.features;
  const candidates = [];
  let totalVertices = 0;

  for (const feature of features) {
    const geometry = feature?.geometry;
    if (!geometry) continue;
    const fb = geometryBbox(geometry);
    if (!fb || !bboxIntersects(fb, bbox)) continue;
    const name = featureName(feature.properties, nameKeys);
    const coordinateCount = ringCoordinateCount(geometry);
    totalVertices += coordinateCount;
    candidates.push({
      name,
      geometryType: geometry.type,
      coordinateCount,
      properties: feature.properties ?? {},
    });
  }

  // Evidence-based granularity signals. These are HINTS for the human
  // reviewer, not verdicts.
  const hints = {
    anatoliaCandidateCount: candidates.length,
    totalVerticesInBbox: totalVertices,
    averageVerticesPerCandidate: candidates.length ? Math.round(totalVertices / candidates.length) : 0,
    geometryTypes: [...new Set(candidates.map((candidate) => candidate.geometryType))].sort(),
    namedCandidateCount: candidates.filter((candidate) => candidate.name != null).length,
  };

  // Fail-closed: a source is NEVER assessed usable by this tool alone.
  // Typical coarse-polity sources have few candidates and low vertex density;
  // a province-granularity source would show many candidates with high vertex
  // counts. The reviewer uses these hints plus the actual historical content.
  return {
    featureCount: features.length,
    anatoliaCandidateCount: candidates.length,
    candidates: candidates.slice(0, 50),
    hints,
    bbox,
    verdict: {
      usableAsProvinceBoundary: false,
      reason: "fail-closed: usableAsProvinceBoundary requires human review of license and historical granularity; this tool reports evidence only",
    },
  };
}

/**
 * Register an evaluated candidate in a provenance manifest WITHOUT changing
 * requiredSource status, promotion gates, or any other field. Existing
 * candidates with the same sourceId are replaced; others are preserved.
 */
export function updateProvenanceCandidate({ provenance, sourceId, url, licenseReview = "pending", evaluation }) {
  if (!provenance || typeof provenance !== "object") throw new Error("provenance must be an object");
  if (!Array.isArray(provenance.sourceCandidates)) throw new Error("provenance.sourceCandidates must be an array");
  if (typeof sourceId !== "string" || !sourceId.trim()) throw new Error("sourceId is required");

  const candidate = {
    sourceId,
    url: url ?? null,
    licenseReview,
    featureCount: evaluation?.featureCount ?? null,
    anatoliaCandidateCount: evaluation?.anatoliaCandidateCount ?? null,
    totalVerticesInBbox: evaluation?.hints?.totalVerticesInBbox ?? null,
    averageVerticesPerCandidate: evaluation?.hints?.averageVerticesPerCandidate ?? null,
    usableAsProvinceBoundary: false,
    evaluatedAt: new Date().toISOString(),
    reason: "Evidence collected by candidate evaluator; usableAsProvinceBoundary requires human review.",
  };

  const others = provenance.sourceCandidates.filter((item) => item?.sourceId !== sourceId);
  return {
    ...provenance,
    sourceCandidates: [...others, candidate],
    // Deliberately untouched: requiredSource, policy, status, everything else.
  };
}

export const candidateEvaluationBbox = ANATOLIA_BBOX;
