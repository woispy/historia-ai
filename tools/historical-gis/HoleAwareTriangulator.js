import { triangulateSimpleRing } from "./DeterministicPolygonTriangulator.js";

const EPSILON = 1e-9;

/**
 * Deterministic multi-ring triangulation gate.
 *
 * Holes are bridged into the outer ring using deterministic visible bridges,
 * then the resulting simple polygon is ear-clipped. Islands are treated as
 * independent filled components. Source rings are never mutated.
 */
export function triangulateMultiRingPolygon({ outerRing, holes = [], islands = [] }) {
  const outer = cloneRing(outerRing);
  const normalizedHoles = holes.map(cloneRing).filter((ring) => ring.length >= 3);
  const normalizedIslands = islands.map(cloneRing).filter((ring) => ring.length >= 3);

  if (normalizedIslands.length) {
    return triangulateComponents([{ ring: outer, holes: normalizedHoles }, ...normalizedIslands.map((ring) => ({ ring, holes: [] }))]);
  }

  return triangulateComponents([{ ring: outer, holes: normalizedHoles }]);
}

function triangulateComponents(components) {
  const vertices = [];
  const indices = [];
  const rings = [];

  for (const component of components) {
    const ring = component.holes.length ? bridgeHoles(component.ring, component.holes) : component.ring;
    const base = vertices.length;
    vertices.push(...ring);
    const local = triangulateSimpleRing(ring);
    if (!local.length) throw new Error("Multi-ring triangulation failed");
    indices.push(...local.map((index) => index + base));
    rings.push(ring);
  }

  return Object.freeze({
    vertices: vertices.map((point) => [...point]),
    indices: Uint32Array.from(indices),
    componentCount: components.length,
    ringCount: rings.length,
  });
}

function bridgeHoles(outer, holes) {
  let result = cloneRing(outer);
  const orderedHoles = holes.map(cloneRing).sort((a, b) => leftmost(a)[0] - leftmost(b)[0]);

  for (const hole of orderedHoles) {
    const holeIndex = leftmostIndex(hole);
    const holePoint = hole[holeIndex];
    const outerIndex = findVisibleOuterVertex(result, holePoint);
    if (outerIndex < 0) throw new Error("Unable to find deterministic visible bridge for hole");

    const holePath = rotateRing(hole, holeIndex);
    const bridge = [];
    bridge.push(...result.slice(0, outerIndex + 1));
    bridge.push(holePoint);
    bridge.push(...holePath.slice(1));
    bridge.push(holePoint);
    bridge.push(...result.slice(outerIndex));
    result = removeAdjacentDuplicates(bridge);
  }

  return result;
}

function findVisibleOuterVertex(outer, holePoint) {
  const candidates = outer.map((point, index) => ({ point, index, distance: squaredDistance(point, holePoint) }))
    .filter(({ point }) => point[0] <= holePoint[0] + EPSILON)
    .sort((a, b) => a.distance - b.distance || a.index - b.index);
  return candidates.find(({ point }) => !segmentHitsRingInterior(holePoint, point, outer))?.index ?? -1;
}

function segmentHitsRingInterior(a, b, ring) {
  for (let i = 0; i < ring.length; i += 1) {
    const c = ring[i]; const d = ring[(i + 1) % ring.length];
    if (samePoint(a, c) || samePoint(a, d) || samePoint(b, c) || samePoint(b, d)) continue;
    if (segmentsIntersect(a, b, c, d)) return true;
  }
  return false;
}

function segmentsIntersect(a, b, c, d) {
  const ab1 = cross(a, b, c); const ab2 = cross(a, b, d); const cd1 = cross(c, d, a); const cd2 = cross(c, d, b);
  return ((ab1 > EPSILON && ab2 < -EPSILON) || (ab1 < -EPSILON && ab2 > EPSILON)) && ((cd1 > EPSILON && cd2 < -EPSILON) || (cd1 < -EPSILON && cd2 > EPSILON));
}
function cross(a, b, c) { return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]); }
function samePoint(a, b) { return Math.abs(a[0] - b[0]) <= EPSILON && Math.abs(a[1] - b[1]) <= EPSILON; }
function squaredDistance(a, b) { const x = a[0] - b[0]; const y = a[1] - b[1]; return x * x + y * y; }
function leftmost(ring) { return ring[leftmostIndex(ring)]; }
function leftmostIndex(ring) { return ring.reduce((best, point, index) => point[0] < ring[best][0] || (point[0] === ring[best][0] && point[1] < ring[best][1]) ? index : best, 0); }
function rotateRing(ring, index) { return ring.slice(index).concat(ring.slice(0, index)); }
function cloneRing(ring) { return (ring ?? []).map(([x, y]) => [Number(x), Number(y)]).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y)).filter((point, index, all) => index === 0 || !samePoint(point, all[index - 1])).filter((point, index, all) => index !== all.length - 1 || !samePoint(point, all[0])); }
function removeAdjacentDuplicates(ring) { return ring.filter((point, index) => index === 0 || !samePoint(point, ring[index - 1])); }
