/**
 * Historia AI — Phase C GPU province geometry.
 *
 * Converts authoritative runtime province polygons into triangle lists suitable
 * for a WebGL/WebGL2 vertex buffer. The source geometry remains lon/lat in
 * Float64 until the final GPU packing step; no raster atlas is involved.
 *
 * Province polygons are simple outer rings in the current historical runtime
 * schema. Rings with a repeated closing point are normalized before triangulation.
 */

const EPSILON = 1e-10;

function finitePoint(point) {
  return Array.isArray(point)
    && point.length >= 2
    && Number.isFinite(Number(point[0]))
    && Number.isFinite(Number(point[1]));
}

function samePoint(left, right) {
  return Math.abs(left[0] - right[0]) <= EPSILON
    && Math.abs(left[1] - right[1]) <= EPSILON;
}

function cross(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1])
    - (b[1] - a[1]) * (c[0] - a[0]);
}

function signedArea(points) {
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current[0] * next[1] - next[0] * current[1];
  }
  return area / 2;
}

function pointInTriangle(point, a, b, c) {
  const ab = cross(a, b, point);
  const bc = cross(b, c, point);
  const ca = cross(c, a, point);
  const hasNegative = ab < -EPSILON || bc < -EPSILON || ca < -EPSILON;
  const hasPositive = ab > EPSILON || bc > EPSILON || ca > EPSILON;
  return !(hasNegative && hasPositive);
}

function parseHexColor(hex, fallback = [111, 118, 95]) {
  const value = String(hex ?? "").trim().replace(/^#/, "");
  if (!/^[0-9a-f]{6}$/i.test(value)) return fallback;
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

/** Removes invalid/duplicate vertices and returns an open ring. */
export function normalizeProvinceRing(ring) {
  if (!Array.isArray(ring)) return [];

  const points = [];
  for (const rawPoint of ring) {
    if (!finitePoint(rawPoint)) continue;
    const point = [Number(rawPoint[0]), Number(rawPoint[1])];
    if (!points.length || !samePoint(points[points.length - 1], point)) {
      points.push(point);
    }
  }

  if (points.length > 1 && samePoint(points[0], points[points.length - 1])) {
    points.pop();
  }

  return points;
}

/** Deterministic ear-clipping triangulation for one simple outer ring. */
export function triangulateProvinceRing(ring) {
  const normalized = normalizeProvinceRing(ring);
  if (normalized.length < 3) return [];
  const area = signedArea(normalized);
  if (Math.abs(area) <= EPSILON) {
    throw new Error("Province polygon is degenerate and cannot be triangulated.");
  }

  const points = area > 0 ? normalized : [...normalized].reverse();
  const originalIndices = area > 0
    ? points.map((_, index) => index)
    : points.map((_, index) => normalized.length - 1 - index);
  const remaining = points.map((_, index) => index);
  const triangles = [];
  let guard = 0;

  while (remaining.length > 3) {
    let clipped = false;

    for (let cursor = 0; cursor < remaining.length; cursor += 1) {
      const previous = remaining[(cursor - 1 + remaining.length) % remaining.length];
      const current = remaining[cursor];
      const next = remaining[(cursor + 1) % remaining.length];
      const a = points[previous];
      const b = points[current];
      const c = points[next];
      if (cross(a, b, c) <= EPSILON) continue;

      let containsVertex = false;
      for (const candidate of remaining) {
        if (candidate === previous || candidate === current || candidate === next) continue;
        if (pointInTriangle(points[candidate], a, b, c)) {
          containsVertex = true;
          break;
        }
      }
      if (containsVertex) continue;

      triangles.push(
        originalIndices[previous],
        originalIndices[current],
        originalIndices[next],
      );
      remaining.splice(cursor, 1);
      clipped = true;
      break;
    }

    guard += 1;
    if (!clipped || guard > points.length * points.length) {
      throw new Error("Province polygon triangulation failed; geometry may be self-intersecting.");
    }
  }

  triangles.push(
    originalIndices[remaining[0]],
    originalIndices[remaining[1]],
    originalIndices[remaining[2]],
  );
  return triangles;
}

function normalizeProvinceEntry(entry) {
  if (entry?.province && entry?.geometry) return entry;
  if (entry?.identity && entry?.polygons) {
    return { province: entry, geometry: entry };
  }
  return null;
}

/**
 * Packs province geometry into non-indexed triangle buffers.
 *
 * Non-indexed triangles are intentional here: WebGL2 can consume the result
 * directly with drawArrays, avoiding 16/32-bit index capability differences
 * across WebGL implementations while keeping province identity per vertex.
 */
export function buildProvinceGpuGeometry(entries, colorResolver = ({ country }) => country?.color) {
  const normalizedEntries = (entries ?? [])
    .map(normalizeProvinceEntry)
    .filter(Boolean);

  const positions = [];
  const provinceIndices = [];
  const colors = [];
  const provinceIds = [];
  const drawRanges = [];
  const bounds = [];
  let vertexOffset = 0;

  normalizedEntries.forEach(({ province, country, geometry }, provinceIndex) => {
    const polygons = Array.isArray(geometry?.polygons) ? geometry.polygons : [];
    const start = vertexOffset;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const rgb = parseHexColor(colorResolver({ province, country, geometry }));

    for (const polygon of polygons) {
      const ring = normalizeProvinceRing(polygon);
      if (ring.length < 3) continue;
      const triangles = triangulateProvinceRing(ring);
      for (const triangleIndex of triangles) {
        const point = ring[triangleIndex];
        positions.push(point[0], point[1]);
        provinceIndices.push(provinceIndex);
        colors.push(rgb[0], rgb[1], rgb[2], 255);
        minX = Math.min(minX, point[0]);
        minY = Math.min(minY, point[1]);
        maxX = Math.max(maxX, point[0]);
        maxY = Math.max(maxY, point[1]);
      }
      vertexOffset += triangles.length;
    }

    if (vertexOffset > start) {
      drawRanges.push({
        provinceIndex,
        provinceId: province?.id ?? province?.identity?.id ?? String(provinceIndex),
        first: start,
        count: vertexOffset - start,
      });
      bounds.push({ minX, minY, maxX, maxY });
    } else {
      bounds.push(null);
    }

    provinceIds.push(province?.id ?? province?.identity?.id ?? String(provinceIndex));
  });

  return Object.freeze({
    positions: new Float32Array(positions),
    provinceIndices: new Uint32Array(provinceIndices),
    colors: new Uint8Array(colors),
    provinceIds: Object.freeze(provinceIds),
    drawRanges: Object.freeze(drawRanges),
    bounds: Object.freeze(bounds),
    vertexCount: positions.length / 2,
    triangleCount: positions.length / 6,
  });
}

export function getGpuProvinceIndex(buffer, provinceId) {
  return buffer?.provinceIds?.indexOf(provinceId) ?? -1;
}
