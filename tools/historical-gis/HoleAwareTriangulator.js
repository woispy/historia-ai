import { triangulateSimpleRing } from "./DeterministicPolygonTriangulator.js";
import { validateHoleBridge } from "./HoleBridgeValidator.js";

const EPSILON = 1e-9;

export function triangulateMultiRingPolygon({ outerRing, holes = [], islands = [] }) {
  const outer = cloneRing(outerRing);
  const normalizedHoles = holes.map(cloneRing).filter((ring) => ring.length >= 3);
  const normalizedIslands = islands.map(cloneRing).filter((ring) => ring.length >= 3);
  if (normalizedIslands.length) return triangulateComponents([{ ring: outer, holes: normalizedHoles }, ...normalizedIslands.map((ring) => ({ ring, holes: [] }))]);
  return triangulateComponents([{ ring: outer, holes: normalizedHoles }]);
}

function triangulateComponents(components) {
  const vertices = []; const indices = []; const rings = [];
  for (const component of components) {
    const ring = component.holes.length ? bridgeHoles(component.ring, component.holes) : component.ring;
    const base = vertices.length; vertices.push(...ring);
    const local = triangulateSimpleRing(ring);
    if (!local.length) throw new Error("Multi-ring triangulation failed");
    indices.push(...local.map((index) => index + base)); rings.push(ring);
  }
  return Object.freeze({ vertices: vertices.map((point) => [...point]), indices: Uint32Array.from(indices), componentCount: components.length, ringCount: rings.length });
}

function bridgeHoles(outer, holes) {
  let result = cloneRing(outer);
  const orderedHoles = holes.map(cloneRing).sort(compareRings);
  for (const hole of orderedHoles) {
    const holeIndex = leftmostIndex(hole); const holePoint = hole[holeIndex];
    const candidates = enumerateBridgeCandidates(result, holePoint);
    let accepted = null;
    for (const candidate of candidates) {
      const validation = validateHoleBridge({ outerRing: result, holeRing: hole, outerIndex: candidate.index, holeIndex });
      if (!validation.valid) continue;
      const candidateRing = spliceHoleBridge(result, hole, holeIndex, candidate.index);
      try { if (triangulateSimpleRing(candidateRing).length) { accepted = candidateRing; break; } } catch { /* try next deterministic candidate */ }
    }
    if (!accepted) throw new Error("Unable to find deterministic valid bridge for hole");
    result = accepted;
  }
  return result;
}

function enumerateBridgeCandidates(outer, holePoint) {
  return outer.map((point, index) => ({ point, index, distance: squaredDistance(point, holePoint) }))
    .filter(({ point }) => point[0] <= holePoint[0] + EPSILON)
    .sort((a, b) => a.distance - b.distance || a.point[0] - b.point[0] || a.point[1] - b.point[1] || a.index - b.index);
}

function spliceHoleBridge(outer, hole, holeIndex, outerIndex) {
  const holePath = rotateRing(hole, holeIndex); const bridge = [];
  bridge.push(...outer.slice(0, outerIndex + 1)); bridge.push(...holePath); bridge.push(holePath[0]); bridge.push(...outer.slice(outerIndex));
  return removeAdjacentDuplicates(bridge);
}
function compareRings(a, b) { const ap = leftmost(a); const bp = leftmost(b); return ap[0] - bp[0] || ap[1] - bp[1] || a.length - b.length; }
function squaredDistance(a, b) { const x = a[0] - b[0]; const y = a[1] - b[1]; return x * x + y * y; }
function leftmost(ring) { return ring[leftmostIndex(ring)]; }
function leftmostIndex(ring) { return ring.reduce((best, point, index) => point[0] < ring[best][0] || (point[0] === ring[best][0] && point[1] < ring[best][1]) ? index : best, 0); }
function rotateRing(ring, index) { return ring.slice(index).concat(ring.slice(0, index)); }
function cloneRing(ring) { return (ring ?? []).map(([x, y]) => [Number(x), Number(y)]).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y)).filter((point, index, all) => index === 0 || !samePoint(point, all[index - 1])).filter((point, index, all) => index !== all.length - 1 || !samePoint(point, all[0])); }
function removeAdjacentDuplicates(ring) { return ring.filter((point, index) => index === 0 || !samePoint(point, ring[index - 1])); }
function samePoint(a, b) { return Math.abs(a[0] - b[0]) <= EPSILON && Math.abs(a[1] - b[1]) <= EPSILON; }
