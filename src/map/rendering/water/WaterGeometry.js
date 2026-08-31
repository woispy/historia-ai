export const DEFAULT_RIVER_WIDTH = Object.freeze({
  major: 0.018,
  minor: 0.010,
});

function finitePoint(point) {
  return Array.isArray(point)
    && Number.isFinite(Number(point[0]))
    && Number.isFinite(Number(point[1]));
}

function distance(a, b) {
  return Math.hypot(Number(b[0]) - Number(a[0]), Number(b[1]) - Number(a[1]));
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

/**
 * Expand centerline points in the vertex shader. Each point carries:
 * position, flow direction, cumulative UV, width and normalized depth.
 * The index buffer connects only vertices belonging to the same river.
 */
export function buildRiverRibbonGeometry(rivers = [], {
  majorWidth = DEFAULT_RIVER_WIDTH.major,
  minorWidth = DEFAULT_RIVER_WIDTH.minor,
} = {}) {
  const vertices = [];
  const indices = [];
  const riverRanges = [];
  let vertexBase = 0;

  for (const river of rivers ?? []) {
    const points = simplifyConsecutive(river?.coordinates ?? []);
    if (points.length < 2) continue;

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
    }));
    vertexBase += vertexCount;
  }

  return Object.freeze({
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
    stride: 8,
    riverRanges: Object.freeze(riverRanges),
  });
}

export function getRiverGpuDrawCount(geometry) {
  return geometry?.indices?.length ? 1 : 0;
}
