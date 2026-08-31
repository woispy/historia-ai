export const DEFAULT_RIVER_WIDTH = Object.freeze({
  major: 0.018,
  minor: 0.010,
});

export const DEFAULT_RIVER_SIMPLIFICATION = Object.freeze({
  major: 0.010,
  minor: 0.028,
  detail: 0.006,
});

function finitePoint(point) {
  return Array.isArray(point)
    && Number.isFinite(Number(point[0]))
    && Number.isFinite(Number(point[1]));
}

function distance(a, b) {
  return Math.hypot(Number(b[0]) - Number(a[0]), Number(b[1]) - Number(a[1]));
}

function perpendicularDistance(point, start, end) {
  const px = Number(point[0]);
  const py = Number(point[1]);
  const sx = Number(start[0]);
  const sy = Number(start[1]);
  const ex = Number(end[0]);
  const ey = Number(end[1]);
  const dx = ex - sx;
  const dy = ey - sy;
  if (dx === 0 && dy === 0) return Math.hypot(px - sx, py - sy);
  const t = Math.max(0, Math.min(1, ((px - sx) * dx + (py - sy) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (sx + t * dx), py - (sy + t * dy));
}

function normalize(x, y) {
  const length = Math.hypot(x, y);
  if (!length) return [0, 0];
  return [x / length, y / length];
}

function simplifyConsecutive(points) {
  const result = [];
  for (const point of points) {
    if (!finitePoint(point)) continue;
    const next = [Number(point[0]), Number(point[1])];
    const previous = result[result.length - 1];
    if (!previous || previous[0] !== next[0] || previous[1] !== next[1]) result.push(next);
  }
  return result;
}

function simplifyRdp(points, tolerance) {
  if (points.length <= 2 || tolerance <= 0) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  const toleranceSquared = tolerance * tolerance;
  while (stack.length) {
    const [startIndex, endIndex] = stack.pop();
    let farthest = -1;
    let maxDistanceSquared = toleranceSquared;
    for (let i = startIndex + 1; i < endIndex; i += 1) {
      const distanceValue = perpendicularDistance(points[i], points[startIndex], points[endIndex]);
      const distanceSquared = distanceValue * distanceValue;
      if (distanceSquared > maxDistanceSquared) {
        maxDistanceSquared = distanceSquared;
        farthest = i;
      }
    }
    if (farthest >= 0) {
      keep[farthest] = 1;
      if (farthest - startIndex > 1) stack.push([startIndex, farthest]);
      if (endIndex - farthest > 1) stack.push([farthest, endIndex]);
    }
  }
  return points.filter((_, index) => keep[index]);
}

function getSimplificationTolerance(river, options) {
  if (Number(river?.simplificationTolerance) >= 0) return Number(river.simplificationTolerance);
  const rank = Number(river?.rank);
  if (rank === 1) return Number(options.majorTolerance);
  if (rank === 2) return Number(options.minorTolerance);
  return Number(options.detailTolerance);
}

/**
 * Expand centerline points into a single packed ribbon buffer. Geometry is
 * simplified only for rendering; source hydrography remains untouched.
 */
export function buildRiverRibbonGeometry(rivers = [], {
  majorWidth = DEFAULT_RIVER_WIDTH.major,
  minorWidth = DEFAULT_RIVER_WIDTH.minor,
  majorTolerance = DEFAULT_RIVER_SIMPLIFICATION.major,
  minorTolerance = DEFAULT_RIVER_SIMPLIFICATION.minor,
  detailTolerance = DEFAULT_RIVER_SIMPLIFICATION.detail,
} = {}) {
  const vertices = [];
  const indices = [];
  const riverRanges = [];
  let vertexBase = 0;
  let sourcePointCount = 0;
  let renderedPointCount = 0;

  for (const river of rivers ?? []) {
    const sourcePoints = simplifyConsecutive(river?.coordinates ?? []);
    if (sourcePoints.length < 2) continue;
    sourcePointCount += sourcePoints.length;
    const points = simplifyRdp(sourcePoints, getSimplificationTolerance(river, {
      majorTolerance,
      minorTolerance,
      detailTolerance,
    }));
    if (points.length < 2) continue;
    renderedPointCount += points.length;

    const width = Number(river?.width) > 0
      ? Number(river.width)
      : Number(river?.rank) === 1 ? majorWidth : minorWidth;
    const cumulative = [0];
    for (let i = 1; i < points.length; i += 1) {
      cumulative.push(cumulative[i - 1] + distance(points[i - 1], points[i]));
    }
    const totalLength = cumulative[cumulative.length - 1] || 1;
    const riverVertexStart = vertices.length / 8;
    const riverIndexStart = indices.length;

    for (let i = 0; i < points.length; i += 1) {
      const previous = points[Math.max(0, i - 1)];
      const next = points[Math.min(points.length - 1, i + 1)];
      const flow = normalize(next[0] - previous[0], next[1] - previous[1]);
      const uv = cumulative[i] / totalLength;
      const depth = Number(river?.depth ?? (Number(river?.rank) === 1 ? 0.72 : 0.45));
      const x = points[i][0];
      const y = points[i][1];
      vertices.push(x, y, flow[0], flow[1], -1, uv, width, depth);
      vertices.push(x, y, flow[0], flow[1], 1, uv, width, depth);
    }

    for (let i = 0; i < points.length - 1; i += 1) {
      const left = vertexBase + i * 2;
      const right = left + 1;
      const nextLeft = left + 2;
      const nextRight = right + 2;
      indices.push(left, right, nextLeft, right, nextRight, nextLeft);
    }

    const vertexCount = points.length * 2;
    const indexCount = (points.length - 1) * 6;
    riverRanges.push(Object.freeze({
      id: river?.id ?? river?.name ?? `river-${riverRanges.length}`,
      vertexStart: riverVertexStart,
      vertexCount,
      indexStart: riverIndexStart,
      indexCount,
      pointCount: points.length,
      sourcePointCount: sourcePoints.length,
    }));
    vertexBase += vertexCount;
  }

  return Object.freeze({
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
    stride: 8,
    riverRanges: Object.freeze(riverRanges),
    sourcePointCount,
    renderedPointCount,
    reductionRatio: sourcePointCount ? 1 - renderedPointCount / sourcePointCount : 0,
  });
}

export function getRiverGpuDrawCount(geometry) {
  return geometry?.indices?.length ? 1 : 0;
}
