const EPS = 1e-7;

function cross(a, b, point) {
  return (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]);
}

function pointOnSegment(point, a, b) {
  if (Math.abs(cross(a, b, point)) > EPS) return false;
  return point[0] >= Math.min(a[0], b[0]) - EPS && point[0] <= Math.max(a[0], b[0]) + EPS
    && point[1] >= Math.min(a[1], b[1]) - EPS && point[1] <= Math.max(a[1], b[1]) + EPS;
}

export function pointInPolygon(point, polygon) {
  if (!polygon?.length) return false;
  for (let index = 0; index < polygon.length; index += 1) if (pointOnSegment(point, polygon[index], polygon[(index + 1) % polygon.length])) return true;
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const a = polygon[index];
    const b = polygon[previous];
    if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / ((b[1] - a[1]) || EPS) + a[0]) inside = !inside;
  }
  return inside;
}

function segmentIntersection(a, b, c, d) {
  const r = [b[0] - a[0], b[1] - a[1]];
  const s = [d[0] - c[0], d[1] - c[1]];
  const denominator = r[0] * s[1] - r[1] * s[0];
  const q = [c[0] - a[0], c[1] - a[1]];
  if (Math.abs(denominator) <= EPS) return pointOnSegment(a, c, d) ? a : null;
  const t = (q[0] * s[1] - q[1] * s[0]) / denominator;
  const u = (q[0] * r[1] - q[1] * r[0]) / denominator;
  if (t < -EPS || t > 1 + EPS || u < -EPS || u > 1 + EPS) return null;
  return [a[0] + t * r[0], a[1] + t * r[1]];
}

function segmentParameter(point, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (Math.abs(dx) >= Math.abs(dy)) return Math.abs(dx) <= EPS ? 0 : (point[0] - a[0]) / dx;
  return Math.abs(dy) <= EPS ? 0 : (point[1] - a[1]) / dy;
}

function uniqueSorted(values) {
  return [...values].sort((a, b) => a - b).filter((value, index, sorted) => index === 0 || Math.abs(value - sorted[index - 1]) > EPS);
}

function splitBoundarySegments(source, other) {
  const segments = [];
  for (let index = 0; index < source.length; index += 1) {
    const a = source[index];
    const b = source[(index + 1) % source.length];
    const parameters = [0, 1];
    for (let otherIndex = 0; otherIndex < other.length; otherIndex += 1) {
      const intersection = segmentIntersection(a, b, other[otherIndex], other[(otherIndex + 1) % other.length]);
      if (intersection) parameters.push(Math.max(0, Math.min(1, segmentParameter(intersection, a, b))));
    }
    const sorted = uniqueSorted(parameters);
    for (let part = 0; part < sorted.length - 1; part += 1) {
      const start = sorted[part];
      const end = sorted[part + 1];
      if (end - start <= EPS) continue;
      const first = [a[0] + (b[0] - a[0]) * start, a[1] + (b[1] - a[1]) * start];
      const last = [a[0] + (b[0] - a[0]) * end, a[1] + (b[1] - a[1]) * end];
      const midpoint = [(first[0] + last[0]) / 2, (first[1] + last[1]) / 2];
      if (pointInPolygon(midpoint, other)) segments.push([first, last]);
    }
  }
  return segments;
}

function area(polygon) {
  let sum = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const a = polygon[index];
    const b = polygon[(index + 1) % polygon.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(sum) / 2;
}

function key(point) { return `${point[0].toFixed(7)},${point[1].toFixed(7)}`; }

function polygonCycles(segments) {
  const nodes = new Map();
  const edges = [];
  const addNode = (point) => {
    const nodeKey = key(point);
    if (!nodes.has(nodeKey)) nodes.set(nodeKey, { point, edges: [] });
    return nodeKey;
  };
  for (const [a, b] of segments) {
    const aKey = addNode(a);
    const bKey = addNode(b);
    if (aKey === bKey) continue;
    const edgeIndex = edges.length;
    edges.push([aKey, bKey]);
    nodes.get(aKey).edges.push(edgeIndex);
    nodes.get(bKey).edges.push(edgeIndex);
  }
  const visited = new Set();
  const cycles = [];
  for (let startEdge = 0; startEdge < edges.length; startEdge += 1) {
    if (visited.has(startEdge)) continue;
    const [start, next] = edges[startEdge];
    const polygon = [nodes.get(start).point];
    let current = start;
    let edge = startEdge;
    let previous = null;
    while (!visited.has(edge)) {
      visited.add(edge);
      const [a, b] = edges[edge];
      const destination = a === current ? b : a;
      polygon.push(nodes.get(destination).point);
      previous = current;
      current = destination;
      const candidates = nodes.get(current).edges.filter((candidate) => !visited.has(candidate));
      if (!candidates.length) break;
      if (candidates.length === 1) edge = candidates[0];
      else {
        const incoming = nodes.get(previous).point;
        const currentPoint = nodes.get(current).point;
        const incomingAngle = Math.atan2(currentPoint[1] - incoming[1], currentPoint[0] - incoming[0]);
        edge = candidates.reduce((best, candidate) => {
          const [ca, cb] = edges[candidate];
          const destinationKey = ca === current ? cb : ca;
          const destinationPoint = nodes.get(destinationKey).point;
          const angle = Math.atan2(destinationPoint[1] - currentPoint[1], destinationPoint[0] - currentPoint[0]);
          const delta = (angle - incomingAngle + Math.PI * 3) % (Math.PI * 2) - Math.PI;
          if (best === null) return { edge: candidate, delta };
          return Math.abs(delta) < Math.abs(best.delta) ? { edge: candidate, delta } : best;
        }, null).edge;
      }
    }
    if (polygon.length >= 4 && key(polygon[0]) === key(polygon[polygon.length - 1])) {
      polygon.pop();
      if (area(polygon) > EPS) cycles.push(polygon);
    }
  }
  return cycles;
}

export function convexCellMaskIntersection(cell, mask, anchor = null) {
  if (!cell?.length || !mask?.length) return [];
  const segments = [...splitBoundarySegments(cell, mask), ...splitBoundarySegments(mask, cell)];
  const cycles = polygonCycles(segments);
  if (!cycles.length) return [];
  const containing = anchor ? cycles.filter((polygon) => pointInPolygon(anchor, polygon)) : [];
  const candidates = containing.length ? containing : cycles;
  return [...candidates].sort((a, b) => area(b) - area(a))[0] ?? [];
}
