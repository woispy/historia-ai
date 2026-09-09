import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const MIN_AREA = 0.00005;
const TARGET_PROVINCES = [
  "lydia-smyrna",
  "ionia-ayasuluk",
  "caria-pecin",
  "caria-halikarnassos",
  "pontus-sinop",
  "pontus-amisos",
];

const NICOMEDIA_FAILURE_EDGES = [
  { provinceId: "bithynia-nicomedia", edgeIndex: 0, start: [29.87953, 40.72476], end: [29.88817, 40.72993] },
  { provinceId: "bithynia-nicomedia", edgeIndex: 3, start: [29.88817, 40.72993], end: [29.91915, 40.71851] },
  { provinceId: "bithynia-nicomedia", edgeIndex: 0, start: [29.94879, 40.71649], end: [29.96697, 40.7418] },
  { provinceId: "bithynia-nicomedia", edgeIndex: 2, start: [29.87953, 40.72476], end: [29.85423, 40.7623] },
  { provinceId: "bithynia-nicomedia", edgeIndex: 1, start: [29.96697, 40.7418], end: [29.94879, 40.71649] },
  { provinceId: "bithynia-nicomedia", edgeIndex: 3, start: [29.99643, 40.72103], end: [30.01852, 40.70688] },
  { provinceId: "bithynia-nicomedia", edgeIndex: 3, start: [30.01852, 40.70688], end: [29.99643, 40.72103] },
  { provinceId: "bithynia-nicomedia", edgeIndex: 1, start: [30.02342, 40.70087], end: [30.06008, 40.71516] },
  { provinceId: "bithynia-nicaea", edgeIndex: 0, start: [29.91915, 40.71851], end: [29.88817, 40.72993] },
];

function area(polygon) {
  let sum = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const next = polygon[(index + 1) % polygon.length];
    sum += polygon[index][0] * next[1] - next[0] * polygon[index][1];
  }
  return Math.abs(sum) / 2;
}

function pointSegmentDistance(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const denominator = dx * dx + dy * dy;
  const t = denominator === 0 ? 0 : Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / denominator));
  const candidate = [start[0] + dx * t, start[1] + dy * t];
  return { distance: Math.hypot(point[0] - candidate[0], point[1] - candidate[1]), candidate };
}

function edgeDistance(targetStart, targetEnd, start, end) {
  const a = pointSegmentDistance(targetStart, start, end).distance;
  const b = pointSegmentDistance(targetEnd, start, end).distance;
  const c = pointSegmentDistance(start, targetStart, targetEnd).distance;
  const d = pointSegmentDistance(end, targetStart, targetEnd).distance;
  return Math.min(a, b, c, d);
}

async function runBuilder(rawMode) {
  const code = `
    if (${rawMode ? "true" : "false"}) {
      const original = Number.prototype.toFixed;
      Number.prototype.toFixed = function(digits) {
        if (digits === 5) return String(Number(this));
        return original.call(this, digits);
      };
    }
    const { buildAnatoliaPhase2DAssets } = await import("./tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js");
    const result = buildAnatoliaPhase2DAssets();
    const metrics = Object.fromEntries(result.geometries.map((geometry) => [
      geometry.identity.provinceId,
      {
        vertexCount: geometry.polygons[0].length,
        area: ${area.toString()}(geometry.polygons[0]),
        polygon: geometry.polygons[0],
      },
    ]));
    process.stdout.write(JSON.stringify({ geometryCount: result.geometries.length, metrics }));
  `;
  const child = spawnSync(process.execPath, ["--input-type=module", "-e", code], {
    cwd: process.cwd(),
    env: { ...process.env },
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (child.status !== 0) {
    throw new Error(`V15 builder ${rawMode ? "raw" : "serialized"} execution failed:\n${child.stderr}`);
  }
  return JSON.parse(child.stdout);
}

const serialized = await runBuilder(false);
const raw = await runBuilder(true);

assert.equal(serialized.geometryCount, 38, "V15 serialized geometry count must remain 38");
assert.equal(raw.geometryCount, 38, "V15 raw geometry count must remain 38");

const roundingDelta = {};
for (const provinceId of TARGET_PROVINCES) {
  const before = raw.metrics[provinceId];
  const after = serialized.metrics[provinceId];
  assert.ok(before && after, `Missing V15 metrics for ${provinceId}`);
  roundingDelta[provinceId] = {
    rawArea: before.area,
    serializedArea: after.area,
    rawVertexCount: before.vertexCount,
    serializedVertexCount: after.vertexCount,
    rawMeetsMinArea: before.area >= MIN_AREA,
    serializedMeetsMinArea: after.area >= MIN_AREA,
    areaDelta: after.area - before.area,
    vertexDelta: after.vertexCount - before.vertexCount,
  };
}

const boundaryMatches = NICOMEDIA_FAILURE_EDGES.map((failure) => {
  const polygon = raw.metrics[failure.provinceId]?.polygon ?? [];
  const midpoint = [(failure.start[0] + failure.end[0]) / 2, (failure.start[1] + failure.end[1]) / 2];
  let best = null;
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    const candidate = pointSegmentDistance(midpoint, start, end);
    const pairDistance = edgeDistance(failure.start, failure.end, start, end);
    const score = Math.min(candidate.distance, pairDistance);
    if (!best || score < best.score) best = { edgeIndex: index, score, midpointDistance: candidate.distance, pairDistance, start, end };
  }
  return { ...failure, match: best };
});

const report = {
  contract: { minArea: MIN_AREA, v15GeometryCount: 38 },
  serializedMode: { geometryCount: serialized.geometryCount },
  rawMode: { geometryCount: raw.geometryCount },
  roundingDelta,
  nicomediaBoundaryMatches: boundaryMatches,
};

console.log(JSON.stringify(report, null, 2));
