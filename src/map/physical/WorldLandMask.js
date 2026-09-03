export function normalizeGeometryModule(module) {
  return module?.default ?? module ?? null;
}

export function isPhysicalLandGeometry(geometry) {
  if (!geometry?.id || !Array.isArray(geometry?.polygons)) return false;
  if (geometry.id === "geometry_country_ata") return false;
  if (geometry.name === "Antarctica") return false;
  return true;
}

export function collectWorldLandPolygons(modules = {}) {
  return Object.values(modules)
    .map(normalizeGeometryModule)
    .filter(isPhysicalLandGeometry)
    .flatMap((geometry) => geometry.polygons)
    .filter((polygon) => Array.isArray(polygon) && polygon.length >= 3)
    .flatMap(splitAntimeridianPolygon);
}

export function buildWorldPath(polygons = []) {
  return polygons
    .filter((polygon) => Array.isArray(polygon) && polygon.length >= 3)
    .map((polygon) => {
      const [first, ...rest] = polygon;
      return [
        `M ${first[0]} ${first[1]}`,
        ...rest.map(([x, y]) => `L ${x} ${y}`),
        "Z",
      ].join(" ");
    })
    .join(" ");
}

function splitAntimeridianPolygon(polygon) {
  const points = unwrapLongitudes(polygon);
  if (points.length < 3) return [];

  // Always clip the unwrapped ring into the canonical [-180, 180] domain.
  // A ring such as 170..190 has a span < 180 after unwrapping, but normalizing
  // 190 -> -170 without clipping creates a false 340-degree edge and produces
  // giant triangles when the polygon is triangulated in world space.
  const pieces = [];
  for (const shift of [-360, 0, 360]) {
    const shifted = points.map(([x, y]) => [x + shift, y]);
    const clipped = clipPolygonX(shifted, -180, 180);
    if (clipped.length < 3) continue;
    const normalized = clipped.map(([x, y]) => [normalizeLongitude(x), y]);
    if (Math.abs(signedArea(normalized)) <= 1e-12) continue;
    if (!pieces.some((piece) => samePolygon(piece, normalized))) pieces.push(normalized);
  }
  return pieces;
}

function unwrapLongitudes(polygon) {
  const result = [];
  let previous = null;
  for (const point of polygon) {
    const x = Number(point?.[0]);
    const y = Number(point?.[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    let unwrapped = x;
    if (previous !== null) {
      while (unwrapped - previous > 180) unwrapped -= 360;
      while (unwrapped - previous < -180) unwrapped += 360;
    }
    result.push([unwrapped, y]);
    previous = unwrapped;
  }
  if (result.length > 1 && samePoint(result[0], result[result.length - 1])) result.pop();
  return result;
}

function clipPolygonX(polygon, minX, maxX) {
  let output = polygon;
  output = clipAgainstX(output, minX, true);
  output = clipAgainstX(output, maxX, false);
  return output;
}

function clipAgainstX(polygon, boundary, keepGreater) {
  if (!polygon.length) return [];
  const output = [];
  for (let i = 0; i < polygon.length; i += 1) {
    const current = polygon[i];
    const previous = polygon[(i - 1 + polygon.length) % polygon.length];
    const currentInside = keepGreater ? current[0] >= boundary : current[0] <= boundary;
    const previousInside = keepGreater ? previous[0] >= boundary : previous[0] <= boundary;
    if (currentInside !== previousInside) output.push(intersectAtX(previous, current, boundary));
    if (currentInside) output.push(current);
  }
  return output;
}

function intersectAtX(a, b, x) {
  const dx = b[0] - a[0];
  const t = Math.abs(dx) <= 1e-12 ? 0 : (x - a[0]) / dx;
  return [x, a[1] + (b[1] - a[1]) * t];
}

function normalizeLongitude(x) {
  let value = Number(x);
  while (value > 180) value -= 360;
  while (value < -180) value += 360;
  return value;
}

function samePoint(a, b) {
  return Math.abs(a[0] - b[0]) <= 1e-9 && Math.abs(a[1] - b[1]) <= 1e-9;
}

function signedArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  return area * 0.5;
}

function samePolygon(a, b) {
  if (a.length !== b.length) return false;
  return a.every((point, index) => samePoint(point, b[index]));
}
