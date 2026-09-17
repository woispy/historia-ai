/**
 * Historia AI — Anatolia/Global Province Source Intake
 *
 * Converts a reviewed historical province boundary source document into the
 * single authoritative shared-edge Arc registry. Fail-closed by contract:
 *
 *  - Sources whose reviewStatus is not "reviewed" or "verified" are rejected.
 *  - Province rings must carry provenance (sourceRef + confidence).
 *  - A shared boundary segment is registered exactly once with both faces.
 *  - Provinces that traverse a shared segment in the same direction are
 *    rejected (inconsistent winding / overlapping geometry).
 *  - A segment incident to more than two provinces is rejected (non-manifold).
 *
 * This module never invents, snaps, or repairs boundary geometry. Any gap or
 * mismatch between neighboring reviewed rings surfaces as an explicit error
 * or as a topology failure downstream in full face assembly.
 */

const DEFAULT_TOLERANCE = 1e-7;
const WORLD_FACE_ID = "world";
const ALLOWED_REVIEW_STATUSES = new Set(["reviewed", "verified"]);

function canonicalLon(lon) {
  let n = Number(lon);
  if (!Number.isFinite(n)) return NaN;
  n = ((n + 180) % 360 + 360) % 360 - 180;
  return Object.is(n, -0) ? 0 : n;
}

function quantize(value, tolerance) {
  return Math.round(value / tolerance);
}

function pointKey(lon, lat, tolerance) {
  return `${quantize(canonicalLon(lon), tolerance)}:${quantize(Number(lat), tolerance)}`;
}

function segmentKey(a, b) {
  return a === b ? a : (a < b ? `${a}|${b}` : `${b}|${a}`);
}

function normalizeRing(ring, tolerance) {
  if (!Array.isArray(ring)) throw new Error("province ring must be an array");
  const keys = [];
  for (let i = 0; i < ring.length; i += 1) {
    const point = ring[i];
    const lon = canonicalLon(point?.[0]);
    const lat = Number(point?.[1]);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) throw new Error(`province ring point ${i} has non-finite coordinates`);
    if (lat < -90 || lat > 90) throw new Error(`province ring point ${i} latitude out of [-90, 90]`);
    const key = pointKey(lon, lat, tolerance);
    const previous = keys.at(-1);
    if (previous !== undefined && previous === key) continue;
    keys.push(key);
  }
  if (keys.length > 1 && keys[0] === keys.at(-1)) keys.pop();
  if (keys.length < 3) throw new Error("province ring needs at least three distinct points");
  return keys;
}

function validateDocument(document, tolerance, errors) {
  if (!document || typeof document !== "object") {
    errors.push("source document must be an object");
    return false;
  }
  const sourceId = document.sourceId;
  if (typeof sourceId !== "string" || !sourceId.trim()) {
    errors.push("source document needs a non-empty sourceId");
    return false;
  }
  if (!ALLOWED_REVIEW_STATUSES.has(document.reviewStatus)) {
    errors.push(`source ${sourceId} reviewStatus must be "reviewed" or "verified" (unreviewed sources are rejected by contract)`);
    return false;
  }
  if (typeof document.sourceRef !== "string" || !document.sourceRef.trim()) {
    errors.push(`source ${sourceId} needs a sourceRef citation`);
    return false;
  }
  if (!Array.isArray(document.provinces) || document.provinces.length === 0) {
    errors.push(`source ${sourceId} needs a non-empty provinces array`);
    return false;
  }
  const seen = new Set();
  let valid = true;
  for (const province of document.provinces) {
    const provinceId = province?.provinceId;
    if (typeof provinceId !== "string" || !provinceId.trim()) {
      errors.push(`source ${sourceId} contains a province without provinceId`);
      valid = false;
      continue;
    }
    if (seen.has(provinceId)) {
      errors.push(`source ${sourceId} declares duplicate provinceId ${provinceId}`);
      valid = false;
      continue;
    }
    seen.add(provinceId);
    const confidence = Number(province?.confidence);
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      errors.push(`province ${provinceId} needs confidence in [0, 1]`);
      valid = false;
    }
    if (typeof province?.sourceRef !== "string" || !province.sourceRef.trim()) {
      errors.push(`province ${provinceId} needs a sourceRef citation`);
      valid = false;
    }
    try {
      normalizeRing(province?.ring, tolerance);
    } catch (error) {
      errors.push(`province ${provinceId} ring invalid: ${error.message}`);
      valid = false;
    }
  }
  return valid;
}

function classifySegments(document, tolerance) {
  const errors = [];
  const segmentIndex = new Map();
  for (const province of document.provinces) {
    const keys = normalizeRing(province.ring, tolerance);
    for (let i = 0; i < keys.length; i += 1) {
      const from = keys[i];
      const to = keys[(i + 1) % keys.length];
      const key = segmentKey(from, to);
      const list = segmentIndex.get(key) ?? [];
      list.push({ provinceId: province.provinceId, confidence: Number(province.confidence), from, to });
      segmentIndex.set(key, list);
    }
  }
  const shared = [];
  const world = [];
  for (const [key, list] of segmentIndex) {
    if (list.length === 1) {
      world.push({ key, segment: list[0] });
      continue;
    }
    if (list.length > 2) {
      errors.push(`Non-manifold boundary segment ${key} is incident to ${list.length} provinces: ${list.map((entry) => entry.provinceId).join(", ")}`);
      continue;
    }
    const [first, second] = list;
    if (first.from === second.from) {
      errors.push(`Provinces ${first.provinceId} and ${second.provinceId} traverse shared segment ${key} in the same direction (inconsistent winding / overlapping geometry)`);
      continue;
    }
    shared.push({ key, first, second });
  }
  return { shared, world, errors };
}

function registerClassifiedSegments({ document, classified, registry, tolerance }) {
  const byPoint = new Map();
  for (const province of document.provinces) {
    for (const point of province.ring) {
      const key = pointKey(point[0], point[1], tolerance);
      if (!byPoint.has(key)) byPoint.set(key, { lon: canonicalLon(point[0]), lat: Number(point[1]) });
    }
  }

  const pointIncidence = new Map();
  for (const { from, to } of classified.world.map(({ segment }) => segment).concat(classified.shared.map(({ first }) => first))) {
    for (const key of [from, to]) pointIncidence.set(key, (pointIncidence.get(key) ?? 0) + 1);
  }
  const junctionKeys = [...pointIncidence.entries()].filter(([, count]) => count >= 3).map(([key]) => key);
  for (const { first } of classified.shared) {
    for (const key of [first.from, first.to]) if (!pointIncidence.has(key)) pointIncidence.set(key, 0);
  }

  let sharedCount = 0;
  let worldCount = 0;
  for (const { first, second } of classified.shared) {
    const path = [byPoint.get(first.from), byPoint.get(first.to)];
    registry.register({
      path,
      leftFace: first.provinceId,
      rightFace: second.provinceId,
      kind: "province",
      confidence: Math.min(first.confidence, second.confidence),
      nodeKind: "corner",
    });
    sharedCount += 1;
  }
  for (const { segment } of classified.world) {
    const path = [byPoint.get(segment.from), byPoint.get(segment.to)];
    registry.register({
      path,
      leftFace: segment.provinceId,
      rightFace: WORLD_FACE_ID,
      kind: "boundary",
      confidence: segment.confidence,
      nodeKind: "corner",
    });
    worldCount += 1;
  }
  for (const key of junctionKeys) {
    if (byPoint.has(key)) registry.ensureNode(byPoint.get(key), { kind: "triple-point" });
  }

  return {
    sourceId: document.sourceId,
    reviewStatus: document.reviewStatus,
    sourceRef: document.sourceRef,
    provinceCount: document.provinces.length,
    sharedEdgeCount: sharedCount,
    worldEdgeCount: worldCount,
    arcCount: registry.arcs.size,
    nodeCount: registry.nodes.size,
    triplePointCount: junctionKeys.filter((key) => byPoint.has(key)).length,
    worldFaceId: WORLD_FACE_ID,
  };
}

/**
 * One-shot: validate a reviewed source document, classify its boundary
 * segments, and register them into an AuthoritativeArcRegistry.
 *
 * Throws with a full error list when the document fails the fail-closed
 * contract; a rejected import never mutates the registry.
 */
export function importReviewedProvinceSource(document, { tolerance = DEFAULT_TOLERANCE, registry = null, createRegistry = null } = {}) {
  const errors = [];
  if (!validateDocument(document, tolerance, errors)) {
    throw new Error(`Province source rejected (${errors.length} error${errors.length === 1 ? "" : "s"}):\n- ${errors.join("\n- ")}`);
  }
  if (!registry && !createRegistry) throw new Error("importReviewedProvinceSource needs a registry or createRegistry factory");
  const target = registry ?? createRegistry({ tolerance });
  const classified = classifySegments(document, tolerance);
  if (classified.errors.length) {
    throw new Error(`Province source ${document.sourceId} failed boundary classification (${classified.errors.length} error${classified.errors.length === 1 ? "" : "s"}):\n- ${classified.errors.join("\n- ")}`);
  }
  const report = registerClassifiedSegments({ document, classified, registry: target, tolerance });
  return { registry: target, report };
}

export const provinceSourceWorldFaceId = WORLD_FACE_ID;

/**
 * Validate a single province ring against the intake contract without
 * requiring a full source document. Used by the dataset studio editor to
 * validate per-province entries during partial authoring.
 */
export function validateProvinceRing(ring, tolerance = DEFAULT_TOLERANCE) {
  try {
    normalizeRing(ring, tolerance);
    return { valid: true, errors: [] };
  } catch (error) {
    return { valid: false, errors: [error.message] };
  }
}
