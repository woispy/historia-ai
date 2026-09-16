import { triangulateSimpleRing } from "./DeterministicPolygonTriangulator.js";

/**
 * Topology gate for renderer mesh generation.
 *
 * This stage intentionally does not triangulate holes yet. It validates the
 * ring model and refuses unsafe input rather than silently filling holes.
 */
export function classifyPolygonRings({ outerRing, holes = [], islands = [] }) {
  const outer = normalize(outerRing);
  const normalizedHoles = holes.map(normalize).filter((ring) => ring.length >= 3);
  const normalizedIslands = islands.map(normalize).filter((ring) => ring.length >= 3);

  if (outer.length < 3) return { status: "invalid", reason: "outer-ring-too-small" };
  if (normalizedHoles.some((ring) => !isInsideRing(ring[0], outer))) {
    return { status: "invalid", reason: "hole-outside-outer-ring" };
  }
  if (normalizedIslands.some((ring) => !isInsideRing(ring[0], outer))) {
    return { status: "invalid", reason: "island-outside-outer-ring" };
  }

  if (normalizedHoles.length || normalizedIslands.length) {
    return {
      status: "requires-multiring-triangulation",
      outerRing: outer,
      holes: normalizedHoles,
      islands: normalizedIslands,
    };
  }

  return { status: "simple", outerRing: outer };
}

export function buildMultiRingMesh(input) {
  const classification = classifyPolygonRings(input);
  if (classification.status === "invalid") throw new Error(`Invalid polygon topology: ${classification.reason}`);
  if (classification.status !== "simple") throw new Error("Multi-ring polygon requires hole-aware triangulation");

  const indices = triangulateSimpleRing(classification.outerRing);
  if (!indices.length) throw new Error("Unable to triangulate simple polygon");

  const vertices = Float32Array.from(classification.outerRing.flat());
  return Object.freeze({
    provinceId: input.provinceId,
    geometryId: input.geometryId,
    ringCount: 1,
    holeCount: 0,
    islandCount: 0,
    vertices,
    indices: Uint32Array.from(indices),
  });
}

function normalize(ring) {
  const points = [];
  for (const point of ring ?? []) {
    if (!Array.isArray(point) || point.length < 2) continue;
    const p = [Number(point[0]), Number(point[1])];
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) continue;
    const previous = points.at(-1);
    if (!previous || previous[0] !== p[0] || previous[1] !== p[1]) points.push(p);
  }
  if (points.length > 1 && points[0][0] === points.at(-1)[0] && points[0][1] === points.at(-1)[1]) points.pop();
  return points;
}

function isInsideRing(point, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i += 1) {
    const a = ring[i]; const b = ring[j];
    const crosses = (a[1] > point[1]) !== (b[1] > point[1]);
    if (crosses && point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
