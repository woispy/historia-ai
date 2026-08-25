import {
  AUTHORITATIVE_LAKES,
  PHYSICAL_LAND_POLYGONS,
  isPhysicalLandPoint,
  isFinalPhysicalGeometryBoundaryPoint,
  pointInPolygon,
  resolvePhysicalGeometryBoundaryPoint,
} from "./physical-land-authority.mjs";

const EPS = 1e-9;
const SAMPLES = 512;
const isPhysical = (point) => isPhysicalLandPoint(point) || isFinalPhysicalGeometryBoundaryPoint(point);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const area = (polygon) => Math.abs(polygon.reduce((sum, point, index) => {
  const next = polygon[(index + 1) % polygon.length];
  return sum + point[0] * next[1] - next[0] * point[1];
}, 0)) / 2;

const inside = (point, polygon) => !polygon || pointInPolygon(point, polygon);

const pathPhysical = (path) => {
  for (let index = 0; index < path.length - 1; index += 1) {
    const start = path[index];
    const end = path[index + 1];
    if (!isPhysical(start) || !isPhysical(end)) return false;
    const samples = Math.max(16, Math.ceil(dist(start, end) / 0.0025));
    for (let sample = 1; sample < samples; sample += 1) {
      const fraction = sample / samples;
      const point = [
        start[0] + (end[0] - start[0]) * fraction,
        start[1] + (end[1] - start[1]) * fraction,
      ];
      if (!isPhysical(point)) return false;
    }
  }
  return true;
};

const pathInside = (path, polygon) => {
  if (!polygon) return true;
  for (let index = 0; index < path.length - 1; index += 1) {
    const start = path[index];
    const end = path[index + 1];
    const samples = Math.max(8, Math.ceil(dist(start, end) / 0.0025));
    for (let sample = 0; sample <= samples; sample += 1) {
      const fraction = sample / samples;
      const point = [
        start[0] + (end[0] - start[0]) * fraction,
        start[1] + (end[1] - start[1]) * fraction,
      ];
      if (!inside(point, polygon)) return false;
    }
  }
  return true;
};

function intersection(a, b, c, d, segment) {
  const denominator = (a[0] - b[0]) * (c[1] - d[1]) - (a[1] - b[1]) * (c[0] - d[0]);
  if (Math.abs(denominator) < EPS) return null;
  const t = ((a[0] - c[0]) * (c[1] - d[1]) - (a[1] - c[1]) * (c[0] - d[0])) / denominator;
  const u = -((a[0] - b[0]) * (a[1] - c[1]) - (a[1] - b[1]) * (a[0] - c[0])) / denominator;
  if (t < -EPS || t > 1 + EPS || u < -EPS || u > 1 + EPS) return null;
  const clampedT = Math.max(0, Math.min(1, t));
  return {
    t: clampedT,
    u: Math.max(0, Math.min(1, u)),
    segment,
    point: [
      a[0] + (b[0] - a[0]) * clampedT,
      a[1] + (b[1] - a[1]) * clampedT,
    ],
  };
}

function nearestPointOnSegment(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const denominator = dx * dx + dy * dy;
  const t = denominator <= EPS
    ? 0
    : Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / denominator));
  const projected = [start[0] + dx * t, start[1] + dy * t];
  return { point: projected, distance: dist(point, projected), t };
}

function sourceConstrainedLakeBoundaryPoint(point, source) {
  let best = null;
  for (const lake of AUTHORITATIVE_LAKES) {
    for (const ring of lake.rings ?? [lake.coordinates]) {
      if (!Array.isArray(ring) || ring.length < 3) continue;
      for (let index = 0; index < ring.length; index += 1) {
        const start = ring[index];
        const end = ring[(index + 1) % ring.length];
        const direct = nearestPointOnSegment(point, start, end);
        const candidates = [direct.point];
        for (let sample = 0; sample <= 32; sample += 1) {
          const fraction = sample / 32;
          candidates.push([
            start[0] + (end[0] - start[0]) * fraction,
            start[1] + (end[1] - start[1]) * fraction,
          ]);
        }
        for (const candidate of candidates) {
          if (!inside(candidate, source)) continue;
          const distance = dist(point, candidate);
          if (!best || distance < best.distance) best = { point: candidate, distance, segment: index };
        }
      }
    }
  }
  return best;
}

function ringArcs(ring, a, b, ia, ib) {
  const paths = [];
  for (const direction of [1, -1]) {
    const path = [a];
    let index = direction === 1 ? (ia + 1) % ring.length : ia;
    const target = direction === 1 ? (ib + 1) % ring.length : ib;
    let guard = 0;
    while (index !== target && guard <= ring.length + 1) {
      path.push(ring[index]);
      index = (index + direction + ring.length) % ring.length;
      guard += 1;
    }
    path.push(b);
    paths.push(path);
  }
  return paths;
}

function boundaryArcs(ring, left, right) {
  const paths = [];
  const size = ring.length;
  for (const direction of [1, -1]) {
    const path = [left.point];
    let segment = left.segment;
    let guard = 0;
    const sameSegment = segment === right.segment;
    const orderedSameSegment = sameSegment && (direction === 1 ? right.t >= left.t : right.t <= left.t);
    if (orderedSameSegment) {
      path.push(right.point);
      paths.push(path);
      continue;
    }
    if (direction === 1) {
      path.push(ring[(segment + 1) % size]);
      segment = (segment + 1) % size;
      while (segment !== right.segment && guard <= size + 1) {
        path.push(ring[(segment + 1) % size]);
        segment = (segment + 1) % size;
        guard += 1;
      }
    } else {
      path.push(ring[segment]);
      segment = (segment - 1 + size) % size;
      while (segment !== right.segment && guard <= size + 1) {
        path.push(ring[segment]);
        segment = (segment - 1 + size) % size;
        guard += 1;
      }
    }
    path.push(right.point);
    paths.push(path);
  }
  return paths;
}

function lakeEndpointRoute(a, b, source) {
  let best = null;
  for (const lake of AUTHORITATIVE_LAKES) {
    for (const ring of lake.rings ?? [lake.coordinates]) {
      if (!Array.isArray(ring) || ring.length < 3) continue;
      const starts = [];
      const ends = [];
      for (let index = 0; index < ring.length; index += 1) {
        const start = ring[index];
        const end = ring[(index + 1) % ring.length];
        const from = nearestPointOnSegment(a, start, end);
        const to = nearestPointOnSegment(b, start, end);
        starts.push({ point: from.point, segment: index, t: from.t, distance: from.distance });
        ends.push({ point: to.point, segment: index, t: to.t, distance: to.distance });
      }
      for (const left of starts) {
        if (left.distance > 0.01 || !inside(left.point, source)) continue;
        for (const right of ends) {
          if (!inside(right.point, source)) continue;
          for (const arc of ringArcs(ring, left.point, right.point, left.segment, right.segment)) {
            if (!pathPhysical(arc)) continue;
            const cost = left.distance + arc.reduce((sum, point, index) => index ? sum + dist(arc[index - 1], point) : 0, 0) + right.distance + dist(right.point, b);
            if (!best || cost < best.cost) best = { cost, path: [a, ...arc, b] };
          }
        }
      }
    }
  }
  return best?.path ?? null;
}

function lakeRoute(a, b, source) {
  let best = null;
  for (const lake of AUTHORITATIVE_LAKES) {
    for (const ring of lake.rings ?? [lake.coordinates]) {
      if (!ring || ring.length < 3) continue;
      const hits = [];
      for (let index = 0; index < ring.length; index += 1) {
        const hit = intersection(a, b, ring[index], ring[(index + 1) % ring.length], index);
        if (hit) hits.push(hit);
      }
      const unique = [];
      for (const hit of hits.sort((left, right) => left.t - right.t)) {
        if (!unique.length || Math.abs(unique[unique.length - 1].t - hit.t) > 1e-7) unique.push(hit);
      }
      if (unique.length < 2) continue;
      for (let leftIndex = 0; leftIndex < unique.length - 1; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < unique.length; rightIndex += 1) {
          const left = unique[leftIndex];
          const right = unique[rightIndex];
          for (const arc of ringArcs(ring, left.point, right.point, left.segment, right.segment)) {
            const candidate = [[...a], left.point, ...arc.slice(1, -1), right.point, [...b]];
            if (!candidate.every((point) => inside(point, source)) || !pathInside(candidate, source) || !pathPhysical(candidate)) continue;
            const cost = candidate.reduce((sum, point, index) => index ? sum + dist(candidate[index - 1], point) : 0, 0);
            if (!best || cost < best.cost) best = { cost, path: candidate };
          }
        }
      }
    }
  }
  return best?.path ?? null;
}

function landBoundaryNodes(ring, source) {
  const nodes = [];
  for (let index = 0; index < ring.length; index += 1) {
    const start = ring[index];
    const end = ring[(index + 1) % ring.length];
    if (inside(start, source)) nodes.push({ point: [...start], segment: index, t: 0 });
    if (source) {
      for (let sourceIndex = 0; sourceIndex < source.length; sourceIndex += 1) {
        const hit = intersection(start, end, source[sourceIndex], source[(sourceIndex + 1) % source.length], index);
        if (hit && inside(hit.point, source)) nodes.push({ point: hit.point, segment: index, t: hit.t });
      }
    }
  }
  const unique = [];
  for (const node of nodes) {
    if (!unique.some((item) => dist(item.point, node.point) <= 1e-7)) unique.push(node);
  }
  return unique;
}

function landBoundaryRoute(a, b, source) {
  let best = null;
  for (const ring of PHYSICAL_LAND_POLYGONS) {
    if (!Array.isArray(ring) || ring.length < 3) continue;
    const nodes = landBoundaryNodes(ring, source);
    if (nodes.length < 2) continue;

    const starts = [];
    const ends = [];
    for (let index = 0; index < ring.length; index += 1) {
      const start = ring[index];
      const end = ring[(index + 1) % ring.length];
      const from = nearestPointOnSegment(a, start, end);
      const to = nearestPointOnSegment(b, start, end);
      const left = { point: from.point, segment: index, t: from.t, distance: from.distance };
      const right = { point: to.point, segment: index, t: to.t, distance: to.distance };
      if (inside(left.point, source) && pathPhysical([a, left.point]) && pathInside([a, left.point], source)) starts.push(left);
      if (inside(right.point, source) && pathPhysical([right.point, b]) && pathInside([right.point, b], source)) ends.push(right);
    }
    for (const node of nodes) {
      if (pathPhysical([a, node.point]) && pathInside([a, node.point], source)) starts.push({ ...node, distance: dist(a, node.point) });
      if (pathPhysical([node.point, b]) && pathInside([node.point, b], source)) ends.push({ ...node, distance: dist(node.point, b) });
    }

    starts.sort((left, right) => left.distance - right.distance);
    ends.sort((left, right) => left.distance - right.distance);

    for (const left of starts.slice(0, 32)) {
      for (const right of ends.slice(0, 32)) {
        for (const arc of boundaryArcs(ring, left, right)) {
          if (!pathInside(arc, source) || !pathPhysical(arc)) continue;
          const full = [a, ...arc, b];
          if (!pathInside(full, source) || !pathPhysical(full)) continue;
          const cost = left.distance + arc.reduce((sum, point, index) => index ? sum + dist(arc[index - 1], point) : 0, 0) + right.distance;
          if (!best || cost < best.cost) best = { cost, path: full };
        }
      }
    }
  }
  return best?.path ?? null;
}

function sampled(a, b, source) {
  const out = [];
  for (let index = 0; index <= SAMPLES; index += 1) {
    const fraction = index / SAMPLES;
    const point = [a[0] + (b[0] - a[0]) * fraction, a[1] + (b[1] - a[1]) * fraction];
    if (!inside(point, source)) return null;
    let resolved = point;
    if (!isPhysical(point)) {
      resolved = resolvePhysicalGeometryBoundaryPoint(point);
      if (!resolved || !inside(resolved, source)) resolved = sourceConstrainedLakeBoundaryPoint(point, source)?.point;
      if (!resolved || !inside(resolved, source)) return null;
    }
    if (!out.length || dist(out[out.length - 1], resolved) > EPS) out.push(resolved);
  }
  return pathPhysical(out) ? out : null;
}

function normalizeVertex(point, source) {
  if (isPhysical(point)) return point;
  const direct = resolvePhysicalGeometryBoundaryPoint(point);
  if (direct && inside(direct, source)) return direct;
  const lake = sourceConstrainedLakeBoundaryPoint(point, source);
  if (lake?.point && inside(lake.point, source)) return lake.point;
  return null;
}

export function repairPhysicalPolygon(polygon, options = {}) {
  if (!Array.isArray(polygon) || polygon.length < 3) throw new Error("Physical polygon repair requires a polygon with at least three vertices.");
  const source = options.containmentPolygon ?? null;
  const original = area(polygon);
  const vertices = polygon.map((point) => normalizeVertex(point, source));
  if (vertices.some((point) => !point)) throw new Error("Physical vertex recovery failed: no authoritative land or lake boundary point inside the source partition.");
  if (vertices.every(isPhysical) && vertices.every((point, index) => pathPhysical([point, vertices[(index + 1) % vertices.length]]) && inside(point, source))) return vertices;

  const out = [];
  for (let index = 0; index < vertices.length; index += 1) {
    const a = vertices[index];
    const b = vertices[(index + 1) % vertices.length];
    let route;
    if (pathPhysical([a, b]) && inside(a, source)) route = [a, b];
    else route = lakeRoute(a, b, source) || lakeEndpointRoute(a, b, source) || landBoundaryRoute(a, b, source) || sampled(a, b, source);
    if (!route) throw new Error(`Physical edge recovery failed (${a.join(",")} → ${b.join(",")}).`);
    for (const point of route) if (!out.length || dist(out[out.length - 1], point) > EPS) out.push([...point]);
  }

  if (out.length > 1 && dist(out[0], out[out.length - 1]) <= EPS) out.pop();
  if (out.length < 3 || !pathPhysical([...out, out[0]])) throw new Error("Physical polygon repair produced a non-physical boundary path.");
  if (area(out) < original * 0.05) throw new Error("Physical polygon repair collapsed more than 95% of the source area.");
  if (source && !out.every((point) => inside(point, source))) throw new Error("Physical polygon repair escaped the source partition cell.");
  return out;
}
