const EPSILON = 1e-10;

/**
 * Presentation-only deterministic ear-clipping triangulator.
 *
 * Input rings are canonical polygon coordinates. The returned indices are a
 * derivative mesh representation and must never be fed back into historical
 * geometry authority.
 */
export function triangulateSimpleRing(ring) {
  const points = normalizeRing(ring);
  if (points.length < 3) return [];
  if (hasSelfIntersection(points)) throw new Error("Cannot triangulate self-intersecting ring");

  const area = signedArea(points);
  if (Math.abs(area) <= EPSILON) return [];

  const indices = points.map((_, index) => index);
  if (area < 0) indices.reverse();

  const triangles = [];
  let guard = indices.length * indices.length;

  while (indices.length > 3 && guard-- > 0) {
    let clipped = false;
    for (let cursor = 0; cursor < indices.length; cursor += 1) {
      const previous = indices[(cursor - 1 + indices.length) % indices.length];
      const current = indices[cursor];
      const next = indices[(cursor + 1) % indices.length];
      const a = points[previous];
      const b = points[current];
      const c = points[next];

      if (cross(a, b, c) <= EPSILON) continue;
      if (indices.some((candidate) => candidate !== previous && candidate !== current && candidate !== next && pointInTriangle(points[candidate], a, b, c))) continue;

      triangles.push(previous, current, next);
      indices.splice(cursor, 1);
      clipped = true;
      break;
    }
    if (!clipped) return [];
  }

  if (indices.length === 3) triangles.push(indices[0], indices[1], indices[2]);
  return triangles;
}

export function triangulatePolygonRings(outerRing, holes = []) {
  if (holes.length) throw new Error("Polygon holes require the multi-ring triangulation stage; simple-ring triangulation refuses them");
  return triangulateSimpleRing(outerRing);
}

function normalizeRing(ring) {
  const points = [];
  for (const point of ring ?? []) {
    if (!Array.isArray(point) || point.length < 2) continue;
    const p = [Number(point[0]), Number(point[1])];
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) continue;
    const previous = points[points.length - 1];
    if (previous && samePoint(previous, p)) continue;
    points.push(p);
  }
  if (points.length > 1 && samePoint(points[0], points[points.length - 1])) points.pop();
  return points;
}

function signedArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i]; const b = points[(i + 1) % points.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  return area * 0.5;
}

function cross(a, b, c) { return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]); }
function samePoint(a, b) { return Math.abs(a[0] - b[0]) <= EPSILON && Math.abs(a[1] - b[1]) <= EPSILON; }
function pointInTriangle(p, a, b, c) {
  const c1 = cross(a, b, p); const c2 = cross(b, c, p); const c3 = cross(c, a, p);
  return c1 >= -EPSILON && c2 >= -EPSILON && c3 >= -EPSILON;
}
function hasSelfIntersection(points) {
  for (let i = 0; i < points.length; i += 1) {
    const a1 = points[i]; const a2 = points[(i + 1) % points.length];
    for (let j = i + 1; j < points.length; j += 1) {
      if (j === i || (j + 1) % points.length === i || (i + 1) % points.length === j) continue;
      if (segmentsIntersect(a1, a2, points[j], points[(j + 1) % points.length])) return true;
    }
  }
  return false;
}
function segmentsIntersect(a, b, c, d) {
  const ab1 = cross(a, b, c); const ab2 = cross(a, b, d); const cd1 = cross(c, d, a); const cd2 = cross(c, d, b);
  return ((ab1 > EPSILON && ab2 < -EPSILON) || (ab1 < -EPSILON && ab2 > EPSILON)) && ((cd1 > EPSILON && cd2 < -EPSILON) || (cd1 < -EPSILON && cd2 > EPSILON));
}
