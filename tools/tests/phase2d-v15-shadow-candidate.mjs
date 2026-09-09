import { isPhysicalLandPoint as canonicalIsPhysicalLandPoint } from "./phase2d-v15-shadow-authority.mjs";

const EPS = 1e-9;
const RECOVERY_STEP = 0.001;
const MAX_RECOVERY_DISTANCE = 0.75;
const FINAL_EDGE_SAMPLE_COUNT = 64;
const MAX_EDGE_REPAIR_DEPTH = 12;
const MIN_AREA = 0.00005;

function roundPoint(point, digits = 7) {
  return point.map((value) => Number(value.toFixed(digits)));
}

function signedArea(polygon) {
  let sum = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const next = polygon[(index + 1) % polygon.length];
    sum += polygon[index][0] * next[1] - next[0] * polygon[index][1];
  }
  return sum / 2;
}

function area(polygon) {
  return Math.abs(signedArea(polygon));
}

function isCanonicalLandPoint(point) {
  return canonicalIsPhysicalLandPoint(point);
}

export function resolveGeometryAnchorCandidate(provinceId, sourceAnchor, authority) {
  if (isCanonicalLandPoint(sourceAnchor)) {
    return { point: [...sourceAnchor], authoritative: false, diagnostics: { provinceId, recoveryDistance: 0 } };
  }

  for (let distance = RECOVERY_STEP; distance <= MAX_RECOVERY_DISTANCE + EPS; distance += RECOVERY_STEP) {
    const samples = Math.max(96, Math.ceil((Math.PI * 2 * distance) / RECOVERY_STEP));
    for (let sample = 0; sample < samples; sample += 1) {
      const angle = (sample / samples) * Math.PI * 2;
      const candidate = [
        sourceAnchor[0] + Math.cos(angle) * distance,
        sourceAnchor[1] + Math.sin(angle) * distance,
      ];
      if (isCanonicalLandPoint(candidate)) {
        return { point: candidate, authoritative: false, diagnostics: { provinceId, recoveryDistance: distance, sampleIndex: sample, searchSamples: samples } };
      }
    }
  }

  const boundary = authority.nearestBoundaryLandPoint(sourceAnchor);
  if (boundary.point && boundary.distance <= MAX_RECOVERY_DISTANCE && isCanonicalLandPoint(boundary.point)) {
    return { point: [...boundary.point], authoritative: false, diagnostics: { provinceId, recoveryDistance: boundary.distance, fallback: "nearest-boundary" } };
  }

  return { point: null, authoritative: false, diagnostics: { provinceId, failure: "bounded-recovery-exhausted", maxRecoveryDistance: MAX_RECOVERY_DISTANCE } };
}

export function repairPhysicalEdgeCandidate(start, end, authority, options = {}) {
  const state = options.state ?? { recursionCalls: 0, maxDepthObserved: 0, sampleCount: 0, terminationReason: null };
  const depth = options.depth ?? 0;
  state.recursionCalls += 1;
  state.maxDepthObserved = Math.max(state.maxDepthObserved, depth);

  const interpolate = (fraction) => [
    start[0] + (end[0] - start[0]) * fraction,
    start[1] + (end[1] - start[1]) * fraction,
  ];

  let edgePhysical = true;
  for (let index = 0; index <= FINAL_EDGE_SAMPLE_COUNT; index += 1) {
    state.sampleCount += 1;
    if (!authority.isPhysicalGeometryBoundaryPoint(interpolate(index / FINAL_EDGE_SAMPLE_COUNT))) {
      edgePhysical = false;
      break;
    }
  }
  if (edgePhysical) {
    state.terminationReason = state.terminationReason ?? "physical-edge";
    return { points: [start, end], diagnostics: state, authoritative: false };
  }

  if (depth >= MAX_EDGE_REPAIR_DEPTH) {
    state.terminationReason = "max-depth";
    return { points: null, diagnostics: state, authoritative: false };
  }

  let invalidFraction = null;
  for (let index = 1; index < FINAL_EDGE_SAMPLE_COUNT; index += 1) {
    const fraction = index / FINAL_EDGE_SAMPLE_COUNT;
    if (!authority.isPhysicalGeometryBoundaryPoint(interpolate(fraction))) {
      invalidFraction = fraction;
      break;
    }
  }
  if (invalidFraction === null) {
    state.terminationReason = state.terminationReason ?? "physical-edge";
    return { points: [start, end], diagnostics: state, authoritative: false };
  }

  const boundary = authority.resolvePhysicalGeometryBoundaryPoint(interpolate(invalidFraction));
  if (!boundary) {
    state.terminationReason = "boundary-resolution-failed";
    return { points: null, diagnostics: state, authoritative: false };
  }
  const resolved = roundPoint(boundary);
  if (Math.hypot(resolved[0] - start[0], resolved[1] - start[1]) <= EPS
    || Math.hypot(resolved[0] - end[0], resolved[1] - end[1]) <= EPS) {
    state.terminationReason = "degenerate-resolution";
    return { points: null, diagnostics: state, authoritative: false };
  }

  const left = repairPhysicalEdgeCandidate(start, resolved, authority, { state, depth: depth + 1 });
  const right = repairPhysicalEdgeCandidate(resolved, end, authority, { state, depth: depth + 1 });
  if (!left.points || !right.points) return { points: null, diagnostics: state, authoritative: false };
  return { points: [...left.points.slice(0, -1), ...right.points], diagnostics: state, authoritative: false };
}

export function normalizePhysicalBoundaryCandidate(polygon, authority) {
  const normalized = [];
  const diagnostics = { edgeCount: polygon.length, repairedEdges: 0, failedEdges: 0, authoritative: false };

  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    const resolvedStart = isCanonicalLandPoint(start) ? [...start] : authority.resolvePhysicalGeometryBoundaryPoint(start);
    const resolvedEnd = isCanonicalLandPoint(end) ? [...end] : authority.resolvePhysicalGeometryBoundaryPoint(end);
    if (!resolvedStart || !resolvedEnd) {
      diagnostics.failedEdges += 1;
      return { polygon: null, diagnostics };
    }

    const repaired = repairPhysicalEdgeCandidate(resolvedStart, resolvedEnd, authority);
    if (!repaired.points) {
      diagnostics.failedEdges += 1;
      return { polygon: null, diagnostics };
    }
    if (repaired.points.length > 2) diagnostics.repairedEdges += 1;
    normalized.push(...repaired.points.slice(0, -1));
  }

  const deduplicated = [];
  for (const point of normalized) {
    const last = deduplicated[deduplicated.length - 1];
    if (!last || last[0] !== point[0] || last[1] !== point[1]) deduplicated.push(point);
  }
  if (deduplicated.length > 1) {
    const first = deduplicated[0];
    const last = deduplicated[deduplicated.length - 1];
    if (first[0] === last[0] && first[1] === last[1]) deduplicated.pop();
  }

  if (deduplicated.length < 3 || area(deduplicated) < MIN_AREA) {
    diagnostics.failedEdges += 1;
    return { polygon: null, diagnostics };
  }
  return { polygon: deduplicated, diagnostics };
}

export const V15_SHADOW_CONTRACT = Object.freeze({
  authoritative: false,
  MAX_RECOVERY_DISTANCE,
  RECOVERY_STEP,
  FINAL_EDGE_SAMPLE_COUNT,
  MAX_EDGE_REPAIR_DEPTH,
});
