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

function unique(points) {
  const result = [];
  for (const point of points) if (!result.some((candidate) => Math.hypot(candidate[0] - point[0], candidate[1] - point[1]) <= 1e-7)) result.push(point);
  return result;
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

function ordered(points) {
  const values = unique(points);
  if (values.length < 3) return [];
  const cx = values.reduce((sum, point) => sum + point[0], 0) / values.length;
  const cy = values.reduce((sum, point) => sum + point[1], 0) / values.length;
  return values.sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx));
}

export function convexCellMaskIntersection(cell, mask) {
  if (!cell?.length || !mask?.length) return [];
  const points = [];
  for (const point of mask) if (pointInPolygon(point, cell)) points.push(point);
  for (const point of cell) if (pointInPolygon(point, mask)) points.push(point);
  for (let i = 0; i < mask.length; i += 1) {
    const a = mask[i];
    const b = mask[(i + 1) % mask.length];
    for (let j = 0; j < cell.length; j += 1) {
      const intersection = segmentIntersection(a, b, cell[j], cell[(j + 1) % cell.length]);
      if (intersection) points.push(intersection);
    }
  }
  const polygon = ordered(points);
  return area(polygon) > EPS ? polygon : [];
}
