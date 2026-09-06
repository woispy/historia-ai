/** Historia AI — Geometric topology guardrails. */

function finite(value, name) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`${name} must be finite`);
  return n;
}

function canonicalLon(lon) {
  let n = finite(lon, "longitude");
  n = ((n + 180) % 360 + 360) % 360 - 180;
  return Object.is(n, -0) ? 0 : n;
}

function unwrapLongitudes(points) {
  if (!points.length) return [];
  const result = [{ lon: canonicalLon(points[0].lon), lat: finite(points[0].lat, "latitude") }];
  for (let i = 1; i < points.length; i += 1) {
    let lon = canonicalLon(points[i].lon);
    const previous = result[i - 1].lon;
    while (lon - previous > 180) lon -= 360;
    while (lon - previous < -180) lon += 360;
    result.push({ lon, lat: finite(points[i].lat, "latitude") });
  }
  return result;
}

function orient(a, b, c, epsilon) {
  const value = (b.lon - a.lon) * (c.lat - a.lat) - (b.lat - a.lat) * (c.lon - a.lon);
  if (Math.abs(value) <= epsilon) return 0;
  return value > 0 ? 1 : -1;
}

function between(a, b, p, epsilon) {
  return p.lon >= Math.min(a.lon, b.lon) - epsilon && p.lon <= Math.max(a.lon, b.lon) + epsilon
    && p.lat >= Math.min(a.lat, b.lat) - epsilon && p.lat <= Math.max(a.lat, b.lat) + epsilon;
}

function segmentsIntersect(a, b, c, d, epsilon) {
  const o1 = orient(a, b, c, epsilon);
  const o2 = orient(a, b, d, epsilon);
  const o3 = orient(c, d, a, epsilon);
  const o4 = orient(c, d, b, epsilon);
  if (o1 !== o2 && o3 !== o4) return true;
  return (o1 === 0 && between(a, b, c, epsilon))
    || (o2 === 0 && between(a, b, d, epsilon))
    || (o3 === 0 && between(c, d, a, epsilon))
    || (o4 === 0 && between(c, d, b, epsilon));
}

function signedArea(points) {
  let area2 = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area2 += a.lon * b.lat - b.lon * a.lat;
  }
  return area2 / 2;
}

export function ringGeometryPoints(arcs, ring) {
  const get = (id) => (arcs instanceof Map ? arcs.get(id) : arcs?.[id]);
  const points = [];
  for (const raw of ring ?? []) {
    const entry = typeof raw === "string" ? { arcId: raw, forward: true } : raw;
    const arc = get(entry?.arcId);
    if (!arc || !Array.isArray(arc.geometry) || arc.geometry.length < 2) {
      throw new Error(`Arc ${entry?.arcId} has no usable geometry`);
    }
    const geometry = entry.forward === false ? [...arc.geometry].reverse() : arc.geometry;
    for (const point of geometry) {
      const previous = points.at(-1);
      if (!previous || previous.lon !== point.lon || previous.lat !== point.lat) points.push({ lon: point.lon, lat: point.lat });
    }
  }
  if (points.length >= 2) {
    const first = points[0];
    const last = points.at(-1);
    if (first.lon === last.lon && first.lat === last.lat) points.pop();
  }
  return points;
}

export function validateRingGeometry(arcs, ring, { epsilon = 1e-9, expectedWinding = null } = {}) {
  const points = unwrapLongitudes(ringGeometryPoints(arcs, ring));
  if (points.length < 3) return { valid: false, errors: ["Ring geometry needs at least three distinct points"], signedArea: 0, winding: "degenerate", points };

  const errors = [];
  const area = signedArea(points);
  const scale = Math.max(1, ...points.map((p) => Math.abs(p.lon)), ...points.map((p) => Math.abs(p.lat)));
  const areaEpsilon = epsilon * scale * scale;
  const winding = area > areaEpsilon ? "ccw" : area < -areaEpsilon ? "cw" : "degenerate";
  if (winding === "degenerate") errors.push("Ring has zero/near-zero signed area");
  if (expectedWinding && winding !== expectedWinding) errors.push(`Ring winding is ${winding}, expected ${expectedWinding}`);

  const segmentCount = points.length;
  for (let i = 0; i < segmentCount; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % segmentCount];
    for (let j = i + 1; j < segmentCount; j += 1) {
      const c = points[j];
      const d = points[(j + 1) % segmentCount];
      const adjacent = j === i + 1 || (i === 0 && j === segmentCount - 1);
      if (adjacent) continue;
      if (segmentsIntersect(a, b, c, d, epsilon)) {
        errors.push(`Ring self-intersects between segments ${i}-${(i + 1) % segmentCount} and ${j}-${(j + 1) % segmentCount}`);
      }
    }
  }
  return { valid: errors.length === 0, errors, signedArea: area, winding, points };
}

export function validateArcGeometry(arc, { epsilon = 1e-9 } = {}) {
  const geometry = Array.isArray(arc?.geometry) ? arc.geometry : [];
  if (geometry.length < 2) return { valid: false, errors: [`Arc ${arc?.id ?? "unknown"} needs at least two geometry points`] };
  const points = unwrapLongitudes(geometry);
  const errors = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    for (let j = i + 2; j < points.length - 1; j += 1) {
      if (segmentsIntersect(points[i], points[i + 1], points[j], points[j + 1], epsilon)) {
        errors.push(`Arc ${arc.id} self-intersects between segments ${i}-${i + 1} and ${j}-${j + 1}`);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}
