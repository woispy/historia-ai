import assert from "node:assert/strict";

function buildLineGeometry(features, simplified = false, closed = false) {
  const vertices = [];
  for (const feature of features ?? []) {
    const coordinates = Array.isArray(feature?.coordinates)
      ? feature.coordinates
      : Array.isArray(feature?.rings?.[0])
        ? feature.rings[0]
        : Array.isArray(feature)
          ? feature
          : [];
    if (!Array.isArray(coordinates) || coordinates.length < 2) continue;
    const points = simplified ? simplifyLine(coordinates, 2) : coordinates;
    for (let i = 1; i < points.length; i += 1) {
      const a = points[i - 1];
      const b = points[i];
      if (!a || !b) continue;
      vertices.push(Number(a[0]), Number(a[1]), Number(b[0]), Number(b[1]));
    }
    if (closed && coordinates.length > 2) {
      const a = coordinates[coordinates.length - 1];
      const b = coordinates[0];
      vertices.push(Number(a[0]), Number(a[1]), Number(b[0]), Number(b[1]));
    }
  }
  return { vertices: Float32Array.from(vertices), indices: null };
}

function simplifyLine(points, stride) {
  if (points.length <= 2) return points;
  const result = [points[0]];
  for (let i = stride; i < points.length - 1; i += stride) result.push(points[i]);
  result.push(points[points.length - 1]);
  return result;
}

const coordinates = [[30, 40], [31, 41], [32, 42], [33, 43]];
const openRiver = buildLineGeometry([{ coordinates }]);
assert.deepEqual(Array.from(openRiver.vertices), [30,40,31,41,31,41,32,42,32,42,33,43]);

const closedCoast = buildLineGeometry([{ coordinates }], false, true);
assert.deepEqual(Array.from(closedCoast.vertices), [30,40,31,41,31,41,32,42,32,42,33,43,33,43,30,40]);

console.log("River open-polyline + closed-coast geometry regression: PASS");
