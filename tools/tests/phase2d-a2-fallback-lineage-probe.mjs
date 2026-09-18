import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";

const root = process.env.CANONICAL_ROOT;
assert.ok(root, "CANONICAL_ROOT is required");
const worktree = "/tmp/a2-fallback-lineage";
const target = [36.33, 41.29];
const HISTORICAL_E67_CONTROL = [
  [35.96245, 41.13693],
  [35.96145, 41.13866],
  [35.95945, 41.13866],
  [35.95845, 41.13693],
  [35.95945, 41.13519],
  [35.96145, 41.13519],
];
const commits = [
  ["fallback-introduced", "0dd1dadb90103b5706fd87c470b8d4a6dc85f496"],
  ["tiny-anchor-allowance", "8fb70748e0da3624103b554c040c0a9d972c719b"],
  ["historical-candidate-search", "2fbab59d49825d122edabb31de86cc4ecdeb09b2"],
  ["physical-containment-fix", "e67cdd3f7a3b89631c497f0d2ec1ac9d24444364"],
];

function runGit(args, cwd = root) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  return r.stdout.trim();
}
function area(poly) {
  if (!Array.isArray(poly) || poly.length < 3) return null;
  let s = 0;
  for (let i = 0; i < poly.length; i += 1) {
    const n = poly[(i + 1) % poly.length];
    s += poly[i][0] * n[1] - n[0] * poly[i][1];
  }
  return Math.abs(s) / 2;
}
function round(poly, digits = 5) {
  return poly.map(([x, y]) => [Number(x.toFixed(digits)), Number(y.toFixed(digits))]);
}
function samePoint(a, b, epsilon = 1e-9) {
  return Math.abs(a[0] - b[0]) <= epsilon && Math.abs(a[1] - b[1]) <= epsilon;
}
function normalizeRingLikeImporter(ring) {
  const points = [];
  for (const coordinate of ring ?? []) {
    if (!Array.isArray(coordinate) || coordinate.length < 2) continue;
    const point = [Number(coordinate[0]), Number(coordinate[1])];
    if (!Number.isFinite(point[0]) || !Number.isFinite(point[1])) continue;
    const previous = points[points.length - 1];
    if (previous && samePoint(previous, point)) continue;
    points.push(point);
  }
  if (points.length > 1 && samePoint(points[0], points[points.length - 1])) points.pop();
  if (points.length < 3 || area(points) <= 1e-12) return [];
  points.push([...points[0]]);
  return points;
}
function normalizeMapBinLike(polygon) {
  const points = [];
  for (const point of polygon ?? []) {
    const x = Number(point?.[0]);
    const y = Number(point?.[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const normalized = [x, y];
    const previous = points[points.length - 1];
    if (previous && samePoint(previous, normalized, 1e-9)) continue;
    points.push(normalized);
  }
  if (points.length > 1 && samePoint(points[0], points[points.length - 1], 1e-9)) points.pop();
  if (points.length < 3 || area(points) <= 1e-12) return [];
  points.push([...points[0]]);
  return points;
}
function float32RoundTrip(polygon) {
  if (!polygon.length) return [];
  const flat = new Float32Array(polygon.flat());
  const result = [];
  for (let i = 0; i < flat.length; i += 2) result.push([flat[i], flat[i + 1]]);
  return result;
}
function representationTrace(polygon) {
  const rounded5 = round(polygon, 5);
  const importer = normalizeRingLikeImporter(rounded5);
  const mapbin = normalizeMapBinLike(importer);
  const float32 = float32RoundTrip(mapbin);
  return {
    raw: { vertexCount: polygon.length, area: area(polygon) },
    rounded5: { vertexCount: rounded5.length, area: area(rounded5) },
    importerNormalized: { vertexCount: importer.length, area: area(importer) },
    mapbinNormalized: { vertexCount: mapbin.length, area: area(mapbin) },
    float32: { vertexCount: float32.length, area: area(float32) },
    collapse: {
      rounded5: !Number.isFinite(area(rounded5)) || area(rounded5) <= 1e-10,
      importerNormalized: !Number.isFinite(area(importer)) || area(importer) <= 1e-10,
      mapbinNormalized: !Number.isFinite(area(mapbin)) || area(mapbin) <= 1e-10,
      float32: !Number.isFinite(area(float32)) || area(float32) <= 1e-10,
    },
  };
}
function checkpointGeometrySource(label, source) {
  const lines = source.split("\n");
  const fallbackLines = lines.filter((line) =>
    /createAnchorFallbackPolygon|resolvePhysicalFallback|FALLBACK_RADII|FALLBACK_DIRECTIONS|polygonRadii|searchPasses/.test(line),
  );
  return {
    label,
    fallbackSymbols: fallbackLines,
  };
}

function candidateFingerprint(candidate) {
  if (!candidate?.point) return null;
  const [x, y] = candidate.point;
  return {
    point: [Number(x.toFixed(5)), Number(y.toFixed(5))],
    source: candidate.source ?? null,
    expectedE67: Math.abs(x - HISTORICAL_E67_CONTROL[0][0] + 0.002) < 5e-5
      && Math.abs(y - HISTORICAL_E67_CONTROL[0][1]) < 5e-5,
  };
}
function normalizeResult(label, sha, result, api) {
  const polygon = result?.polygon ?? result ?? null;
  return {
    label,
    sha,
    api,
    candidate: result?.candidate ?? null,
    candidateFingerprint: candidateFingerprint(result?.candidate),
    diagnostics: result?.diagnostics ?? null,
    target,
    vertexCount: Array.isArray(polygon) ? polygon.length : 0,
    rawArea: Array.isArray(polygon) && polygon.length ? area(polygon) : null,
    roundedArea5: Array.isArray(polygon) && polygon.length ? area(round(polygon, 5)) : null,
    roundedArea6: Array.isArray(polygon) && polygon.length ? area(round(polygon, 6)) : null,
    representationTrace: Array.isArray(polygon) && polygon.length ? representationTrace(polygon) : null,
    polygon,
  };
}

rmSync(worktree, { recursive: true, force: true });
mkdirSync(join(root, "forensic-output"), { recursive: true });
const results = [];
try {
  for (const [label, sha] of commits) {
    runGit(["fetch", "--no-tags", "origin", sha]);
    rmSync(worktree, { recursive: true, force: true });
    runGit(["worktree", "add", "--detach", worktree, sha]);
    try {
      const file = join(worktree, "tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js");
      let source = readFileSync(file, "utf8");
      const sourceFingerprint = checkpointGeometrySource(label, source);\n      const hasAnchorFallback = source.includes("createAnchorFallbackPolygon");
      const hasPhysicalFallback = source.includes("resolvePhysicalFallback");
      if (!hasAnchorFallback && !hasPhysicalFallback) {
        results.push({ label, sha, status: "no-supported-fallback-api", sourceFingerprint });
        continue;
      }
      const exports = [];
      if (hasAnchorFallback) exports.push("createAnchorFallbackPolygon");
      if (hasPhysicalFallback) exports.push("resolvePhysicalFallback");
      source += `\nexport { ${exports.join(", ")} };\n`;
      writeFileSync(file, source);
      const mod = await import(`file://${file}?fallback=${sha}`);
      if (hasPhysicalFallback) {
        const result = normalizeResult(label, sha, mod.resolvePhysicalFallback({ id: "pontus-amisos", centroid: target }), "resolvePhysicalFallback");\n        result.sourceFingerprint = sourceFingerprint;\n        results.push(result);
      } else {
        const result = normalizeResult(label, sha, mod.createAnchorFallbackPolygon(target), "createAnchorFallbackPolygon");\n        result.sourceFingerprint = sourceFingerprint;\n        results.push(result);
      }
    } catch (error) {
      results.push({ label, sha, status: "error", error: String(error?.stack || error) });
    } finally {
      runGit(["worktree", "remove", "--force", worktree]);
    }
  }
} finally {
  rmSync(worktree, { recursive: true, force: true });
}

const controlTrace = representationTrace(HISTORICAL_E67_CONTROL);
const tiny = results.filter((r) => Number.isFinite(r.rawArea) && r.rawArea <= 1e-10);
const representationTiny = results.filter((r) => Object.values(r.representationTrace?.collapse ?? {}).some(Boolean));
const output = {
  probe: "A2 historical fallback API and representation-boundary lineage for Amisos metadata centroid",
  target,
  targetArea: 2.27e-13,
  tinyEpsilon: 1e-10,
  representationBoundary: ["raw", "round(5)", "HistoricalGeometryImporter.normalizeRing", "MapBin.normalizePolygon", "Float32Array"],
  historicalE67Control: {
    source: "35267020164 / e67cdd3f7a3b89631c497f0d2ec1ac9d24444364 retained fallback geometry",
    polygon: HISTORICAL_E67_CONTROL,
    trace: controlTrace,
  },
  results,
  tinyHits: tiny,
  representationTinyHits: representationTiny,
  rootCauseCandidate: tiny.length > 0 || representationTiny.length > 0 ? "historical fallback or representation boundary" : null,
  historicalCandidateConclusion: results.map((result) => ({
    label: result.label,
    candidate: result.candidateFingerprint,
    rawArea: result.rawArea,
    targetRatio: Number.isFinite(result.rawArea) && result.rawArea > 0 ? result.rawArea / 2.27e-13 : null,
  })),
};
writeFileSync(join(root, "forensic-output/a2-fallback-lineage.json"), JSON.stringify(output, null, 2));
process.stdout.write(JSON.stringify(output, null, 2));