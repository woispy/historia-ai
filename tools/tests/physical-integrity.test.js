import assert from "node:assert/strict";
import { buildAnatoliaPhase2DAssets, isPhysicalLandPoint } from "../historical-gis/AnatoliaPhase2DGeometryBuilder.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";

const result = buildAnatoliaPhase2DAssets([
  { polygons: [[[29.9, 40.7], [30.1, 40.7], [30.1, 40.9], [29.9, 40.7]]] },
  { polygons: [[[27.4, 38.4], [27.7, 38.4], [27.7, 38.7], [27.4, 38.4]]] },
]);

const EDGE_STEP = 0.01;
const AREA_EPSILON = 1e-7;
const KEY_DIGITS = 6;
const BOUNDARY_EPSILON = 1e-9;

function polygonArea(polygon) {
  let sum = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    sum += current[0] * next[1] - next[0] * current[1];
  }
  return Math.abs(sum) / 2;
}

function orientation(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function pointOnSegment(point, start, end) {
  const cross = orientation(start, end, point);
  if (Math.abs(cross) > BOUNDARY_EPSILON) return false;
  return point[0] >= Math.min(start[0], end[0]) - BOUNDARY_EPSILON
    && point[0] <= Math.max(start[0], end[0]) + BOUNDARY_EPSILON
    && point[1] >= Math.min(start[1], end[1]) - BOUNDARY_EPSILON
    && point[1] <= Math.max(start[1], end[1]) + BOUNDARY_EPSILON;
}

function pointInPolygonStrict(point, polygon) {
  for (let index = 0; index < polygon.length; index += 1) {
    if (pointOnSegment(point, polygon[index], polygon[(index + 1) % polygon.length])) return false;
  }
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index += 1) {
    const current = polygon[index];
    const prior = polygon[previous];
    const crosses = (current[1] > point[1]) !== (prior[1] > point[1])
      && point[0] < ((prior[0] - current[0]) * (point[1] - current[1]))
        / (prior[1] - current[1] || Number.EPSILON) + current[0];
    if (crosses) inside = !inside;
  }
  return inside;
}

function segmentIntersection(a, b, c, d) {
  const abC = orientation(a, b, c);
  const abD = orientation(a, b, d);
  const cdA = orientation(c, d, a);
  const cdB = orientation(c, d, b);
  const epsilon = 1e-9;
  return ((abC > epsilon && abD < -epsilon) || (abC < -epsilon && abD > epsilon))
    && ((cdA > epsilon && cdB < -epsilon) || (cdA < -epsilon && cdB > epsilon));
}

function polygonsOverlapPositiveArea(left, right) {
  const leftArea = polygonArea(left);
  const rightArea = polygonArea(right);
  if (leftArea <= AREA_EPSILON || rightArea <= AREA_EPSILON) return false;

  const leftMinX = Math.min(...left.map(([x]) => x));
  const leftMaxX = Math.max(...left.map(([x]) => x));
  const leftMinY = Math.min(...left.map(([, y]) => y));
  const leftMaxY = Math.max(...left.map(([, y]) => y));
  const rightMinX = Math.min(...right.map(([x]) => x));
  const rightMaxX = Math.max(...right.map(([x]) => x));
  const rightMinY = Math.min(...right.map(([, y]) => y));
  const rightMaxY = Math.max(...right.map(([, y]) => y));
  if (leftMaxX <= rightMinX || rightMaxX <= leftMinX || leftMaxY <= rightMinY || rightMaxY <= leftMinY) return false;

  for (let leftIndex = 0; leftIndex < left.length; leftIndex += 1) {
    const leftStart = left[leftIndex];
    const leftEnd = left[(leftIndex + 1) % left.length];
    for (let rightIndex = 0; rightIndex < right.length; rightIndex += 1) {
      const rightStart = right[rightIndex];
      const rightEnd = right[(rightIndex + 1) % right.length];
      if (segmentIntersection(leftStart, leftEnd, rightStart, rightEnd)) return true;
    }
  }

  return pointInPolygonStrict(left[0], right) || pointInPolygonStrict(right[0], left);
}

function edgeKey(a, b) {
  const round = (point) => point.map((value) => Number(value.toFixed(KEY_DIGITS)));
  const first = round(a);
  const second = round(b);
  const left = `${first[0]}:${first[1]}`;
  const right = `${second[0]}:${second[1]}`;
  return left < right ? `${left}|${right}` : `${right}|${left}`;
}

assert.equal(result.provinceCount, ANATOLIA_PROVINCE_METADATA.length);
assert.equal(result.provinceCount, 38);
assert.equal(result.provinces.length, 38);
assert.equal(result.geometries.length, 38);

const allPolygons = [];
const provinceIds = new Set();
let edgeCount = 0;
const sharedEdges = new Map();

for (const geometry of result.geometries) {
  const provinceId = geometry.identity.provinceId;
  assert.ok(!provinceIds.has(provinceId), `Duplicate physical-integrity province: ${provinceId}`);
  provinceIds.add(provinceId);

  for (const polygon of geometry.polygons) {
    assert.ok(polygon.length >= 3, `${provinceId}: polygon must have at least three vertices`);
    assert.ok(polygonArea(polygon) > AREA_EPSILON, `${provinceId}: polygon must have positive area`);
    for (const point of polygon) {
      assert.ok(isPhysicalLandPoint(point), `${provinceId}: vertex leaves authoritative physical land at ${point.join(",")}`);
    }

    for (let index = 0; index < polygon.length; index += 1) {
      const start = polygon[index];
      const end = polygon[(index + 1) % polygon.length];
      const distance = Math.hypot(end[0] - start[0], end[1] - start[1]);
      const samples = Math.max(2, Math.ceil(distance / EDGE_STEP));
      for (let sample = 1; sample < samples; sample += 1) {
        const fraction = sample / samples;
        const point = [start[0] + (end[0] - start[0]) * fraction, start[1] + (end[1] - start[1]) * fraction];
        assert.ok(isPhysicalLandPoint(point), `${provinceId}: edge ${index} leaves authoritative physical land at ${point.join(",")}`);
      }
      const key = edgeKey(start, end);
      const entries = sharedEdges.get(key) ?? [];
      entries.push({ provinceId, start, end });
      sharedEdges.set(key, entries);
      edgeCount += 1;
    }
    allPolygons.push({ provinceId, polygon });
  }
}

assert.equal(provinceIds.size, 38);
assert.ok(edgeCount > 150, "Physical-integrity audit must inspect a substantial edge field");

for (const provinceId of ["bithynia-nicaea", "pisidia-egirdir", "pisidia-beysehir"]) {
  const provincePolygons = allPolygons.filter(({ provinceId: candidate }) => candidate === provinceId);
  assert.ok(provincePolygons.length > 0, `${provinceId}: lake-city reconciliation must emit a physical polygon`);
  assert.ok(provincePolygons.every(({ polygon }) => polygon.every(isPhysicalLandPoint)), `${provinceId}: reconciliation polygon must remain on physical land`);
}

for (let index = 0; index < allPolygons.length; index += 1) {
  for (let otherIndex = index + 1; otherIndex < allPolygons.length; otherIndex += 1) {
    const left = allPolygons[index];
    const right = allPolygons[otherIndex];
    if (left.provinceId === right.provinceId) continue;
    const overlap = polygonsOverlapPositiveArea(left.polygon, right.polygon);
    if (overlap && left.provinceId === "caria-mylasa" && right.provinceId === "caria-halikarnassos") {
      console.error("PHYSICAL_OVERLAP_DIAGNOSTIC", JSON.stringify({ left, right }, null, 2));
    }
    assert.equal(
      overlap,
      false,
      `Positive-area overlap detected between ${left.provinceId} and ${right.provinceId}`,
    );
  }
}

for (const [key, entries] of sharedEdges) {
  assert.ok(entries.length <= 2, `A partition boundary cannot belong to more than two cells: ${key}`);
  if (entries.length !== 2) continue;
  assert.notEqual(entries[0].provinceId, entries[1].provinceId, `A shared edge must separate two provinces: ${key}`);
}

console.log(
  `Physical integrity passed: ${provinceIds.size} provinces, ${allPolygons.length} polygons, `
  + `${edgeCount} audited edges, ${[...sharedEdges.values()].filter((entries) => entries.length === 2).length} shared boundaries.`,
);