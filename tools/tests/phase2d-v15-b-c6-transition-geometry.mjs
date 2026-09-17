import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const V15_ROOT = process.env.V15_ROOT;
assert.ok(V15_ROOT, "V15_ROOT is required");
const FAILURE_EDGES = [
  { caseId: "B-01", start: [29.87953, 40.72476], end: [29.88817, 40.72993] },
  { caseId: "B-02", start: [29.88817, 40.72993], end: [29.91915, 40.71851] },
  { caseId: "B-03", start: [29.94879, 40.71649], end: [29.96697, 40.7418] },
  { caseId: "B-04", start: [29.87953, 40.72476], end: [29.85423, 40.7623] },
  { caseId: "B-05", start: [29.96697, 40.7418], end: [29.94879, 40.71649] },
  { caseId: "B-06", start: [29.99643, 40.72103], end: [30.01852, 40.70688] },
  { caseId: "B-07", start: [30.01852, 40.70688], end: [29.99643, 40.72103] },
  { caseId: "B-08", start: [30.02342, 40.70087], end: [30.06008, 40.71516] },
  { caseId: "B-09", start: [29.91915, 40.71851], end: [29.88817, 40.72993] },
];
const SAMPLE_COUNT = 64;
const EPS = 1e-7;
const TOL = 1e-4;
const interpolate = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const pointSegmentProjection = (p, a, b) => {
  const dx = b[0] - a[0]; const dy = b[1] - a[1];
  const denom = dx * dx + dy * dy;
  const t = denom <= EPS ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / denom));
  const q = interpolate(a, b, t);
  return { t, point: q, distance: dist(p, q) };
};
const segmentIntersection = (a, b, c, d) => {
  const r = [b[0] - a[0], b[1] - a[1]];
  const s = [d[0] - c[0], d[1] - c[1]];
  const den = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(den) <= EPS) return null;
  const ca = [c[0] - a[0], c[1] - a[1]];
  const t = (ca[0] * s[1] - ca[1] * s[0]) / den;
  const u = (ca[0] * r[1] - ca[1] * r[0]) / den;
  if (t < -EPS || t > 1 + EPS || u < -EPS || u > 1 + EPS) return null;
  return { t: Math.max(0, Math.min(1, t)), u: Math.max(0, Math.min(1, u)), point: interpolate(a, b, t) };
};
const dedupeIntersections = (items) => {
  const result = [];
  for (const item of items) {
    if (!result.some((existing) => dist(existing.point, item.point) <= EPS)) result.push(item);
  }
  return result.sort((a, b) => a.t - b.t);
};

async function instrumentV15() {
  const sourcePath = path.join(V15_ROOT, "tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js");
  const source = fs.readFileSync(sourcePath, "utf8");
  const marker = "function buildPartition(sites, weights) {";
  const injected = source.replace(marker, "export { resolvePhysicalGeometryBoundaryPoint, PHYSICAL_LAND_POLYGONS, ANATOLIA_PHYSICAL_ATLAS_RUNTIME };\n\n" + marker);
  assert.notEqual(injected, source, "V15 instrumentation failed");
  const temp = path.join(path.dirname(sourcePath), `.b-c6-v15.${process.pid}.mjs`);
  fs.writeFileSync(temp, injected, "utf8");
  try { return await import(`file://${temp}?c6=${process.pid}`); } finally { fs.rmSync(temp, { force: true }); }
}

const v15 = await instrumentV15();
const lakeRings = (lake) => lake.rings ?? [lake.coordinates];
const boundarySegments = [
  ...v15.PHYSICAL_LAND_POLYGONS.flatMap((polygon) => polygon.map((point, index) => ({ kind: "land", start: point, end: polygon[(index + 1) % polygon.length] }))),
  ...v15.ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.flatMap((lake) => lakeRings(lake).flatMap((ring) => ring.map((point, index) => ({ kind: "lake", start: point, end: ring[(index + 1) % ring.length] })))),
];

const rows = FAILURE_EDGES.map((edge) => {
  const intersections = dedupeIntersections(
    boundarySegments.map((boundary) => {
      const hit = segmentIntersection(edge.start, edge.end, boundary.start, boundary.end);
      return hit ? { ...hit, kind: boundary.kind } : null;
    }).filter(Boolean),
  );
  const samples = Array.from({ length: SAMPLE_COUNT - 1 }, (_, i) => (i + 1) / SAMPLE_COUNT).map((fraction) => ({ fraction, point: interpolate(edge.start, edge.end, fraction) }));
  const resolvedSamples = samples.map(({ fraction, point }) => {
    const boundary = v15.resolvePhysicalGeometryBoundaryPoint(point);
    if (!boundary) return { fraction, sample: point, boundary: null };
    const projection = pointSegmentProjection(boundary, edge.start, edge.end);
    const nearestIntersection = intersections.length ? intersections.reduce((best, hit) => dist(point, hit.point) < dist(point, best.point) ? hit : best) : null;
    return {
      fraction,
      sample: point,
      boundary,
      projectionT: projection.t,
      offEdgeDistance: projection.distance,
      nearestIntersectionT: nearestIntersection?.t ?? null,
      nearestIntersectionDistance: nearestIntersection ? dist(point, nearestIntersection.point) : null,
      resolverToIntersectionDistance: nearestIntersection ? dist(boundary, nearestIntersection.point) : null,
    };
  });
  const resolved = resolvedSamples.filter((item) => item.boundary);
  const maxResolverToIntersection = resolved.reduce((m, item) => Math.max(m, item.resolverToIntersectionDistance ?? 0), 0);
  const minResolverToIntersection = resolved.reduce((m, item) => Math.min(m, item.resolverToIntersectionDistance ?? Infinity), Infinity);
  return {
    ...edge,
    boundaryIntersectionCount: intersections.length,
    boundaryIntersections: intersections,
    resolvedSampleCount: resolved.length,
    exactOnEdge: resolved.filter((x) => x.offEdgeDistance <= EPS).length,
    withinAuthorityTolerance: resolved.filter((x) => x.offEdgeDistance <= TOL).length,
    minResolverToIntersectionDistance: Number.isFinite(minResolverToIntersection) ? minResolverToIntersection : null,
    maxResolverToIntersectionDistance: maxResolverToIntersection,
    samples: resolvedSamples.slice(0, 12),
  };
});

console.log(JSON.stringify({ phase: "B-C6.1 — exact edge/authoritative-boundary intersections", tolerance: TOL, rows }, null, 2));
