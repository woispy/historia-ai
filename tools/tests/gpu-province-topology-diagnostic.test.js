import fs from "node:fs/promises";
import { buildLodRings, normalizeRing, triangulateRing } from "../../src/map/rendering/gpu/ProvinceGpuPackBuilderV2.js";

const runtime = JSON.parse(await fs.readFile("src/world/map/assets/historical/1300/runtime.json", "utf8"));
const geometries = new Map((runtime.geometries ?? []).map((geometry) => [String(geometry.identity?.provinceId ?? geometry.identity?.id), geometry]));
const failures = [];
let rings = 0;
let sourceVertices = 0;
let canonicalized = 0;

const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
const same = (a, b) => Math.abs(a[0] - b[0]) <= 1e-10 && Math.abs(a[1] - b[1]) <= 1e-10;
const onSegment = (a, b, p) => Math.abs(cross(a, b, p)) <= 1e-10 && p[0] >= Math.min(a[0], b[0]) - 1e-10 && p[0] <= Math.max(a[0], b[0]) + 1e-10 && p[1] >= Math.min(a[1], b[1]) - 1e-10 && p[1] <= Math.max(a[1], b[1]) + 1e-10;
const properCross = (a, b, c, d) => {
  const abC = Math.sign(cross(a, b, c));
  const abD = Math.sign(cross(a, b, d));
  const cdA = Math.sign(cross(c, d, a));
  const cdB = Math.sign(cross(c, d, b));
  return abC !== 0 && abD !== 0 && cdA !== 0 && cdB !== 0 && abC !== abD && cdA !== cdB;
};
const diagnostics = (ring) => {
  const points = normalizeRing(ring);
  let duplicatePairs = 0;
  let properCrossings = 0;
  let touchingIntersections = 0;
  let collinearVertices = 0;
  for (let i = 0; i < points.length; i += 1) {
    const prev = points[(i - 1 + points.length) % points.length];
    const next = points[(i + 1) % points.length];
    if (Math.abs(cross(prev, points[i], next)) <= 1e-10) collinearVertices += 1;
    for (let j = i + 1; j < points.length; j += 1) if (same(points[i], points[j])) duplicatePairs += 1;
    const a = points[i];
    const b = points[(i + 1) % points.length];
    for (let j = i + 2; j < points.length; j += 1) {
      if (i === 0 && j === points.length - 1) continue;
      const c = points[j];
      const d = points[(j + 1) % points.length];
      if (properCross(a, b, c, d)) properCrossings += 1;
      else if (onSegment(a, b, c) || onSegment(a, b, d) || onSegment(c, d, a) || onSegment(c, d, b)) touchingIntersections += 1;
    }
  }
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  return { normalizedVertices: points.length, duplicatePairs, properCrossings, touchingIntersections, collinearVertices, signedArea: area / 2 };
};

for (const province of runtime.provinces ?? []) {
  const id = String(province.identity?.id);
  const polygons = geometries.get(id)?.polygons ?? [];
  for (const [polygonIndex, source] of polygons.entries()) {
    sourceVertices += Array.isArray(source) ? source.length : 0;
    for (const [lod, ring] of buildLodRings(source).entries()) {
      rings += 1;
      if (ring.length !== source.length) canonicalized += 1;
      try {
        triangulateRing(ring, { provinceId: id, polygonIndex, lod, maxOperations: 250_000 });
      } catch (error) {
        failures.push({ id, polygonIndex, lod, before: source.length, after: ring.length, code: error?.code ?? "GPU_TOPOLOGY_UNKNOWN", message: error instanceof Error ? error.message : String(error), diagnostics: diagnostics(ring) });
      }
    }
  }
}

console.log(`GPU topology diagnostic: provinces=${runtime.provinces?.length ?? 0}, polygons=${(runtime.geometries ?? []).reduce((count, geometry) => count + (geometry.polygons?.length ?? 0), 0)}, lodRings=${rings}, sourceVertices=${sourceVertices}, canonicalizedRings=${canonicalized}, failures=${failures.length}`);

if (failures.length) {
  for (const failure of failures.slice(0, 50)) {
    const d = failure.diagnostics;
    console.error(`GPU TOPOLOGY FAILURE code=${failure.code} province=${failure.id} polygon=${failure.polygonIndex} lod=${failure.lod} vertices=${failure.before}->${failure.after} normalized=${d.normalizedVertices} duplicatePairs=${d.duplicatePairs} properCrossings=${d.properCrossings} touchingIntersections=${d.touchingIntersections} collinearVertices=${d.collinearVertices} area=${d.signedArea}: ${failure.message}`);
  }
  throw new Error(`GPU topology diagnostic found ${failures.length} failing rings; firstCode=${failures[0].code}; firstProvince=${failures[0].id}; firstPolygon=${failures[0].polygonIndex}; firstLod=${failures[0].lod}`);
}

console.log("GPU topology diagnostic passed: every runtime province ring is triangulable across all four LODs within the deterministic operation budget.");
