import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";

const root = process.env.CANONICAL_ROOT;
assert.ok(root, "CANONICAL_ROOT is required");
const worktree = "/tmp/a2-clip-lineage";
const commit = "3db105afb857be55e0ce7696f3d7e904185fc5f8";
const targetId = "pontus-amisos";
const target = [36.33, 41.29];

function runGit(args, cwd = root) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
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
function shoelaceDiagnostics(poly) {
  if (!Array.isArray(poly) || poly.length < 3) return null;
  const terms = [];
  let positiveSum = 0;
  let negativeSum = 0;
  for (let i = 0; i < poly.length; i += 1) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const term = a[0] * b[1] - b[0] * a[1];
    terms.push(term);
    if (term >= 0) positiveSum += term;
    else negativeSum += term;
  }
  const signedSum = positiveSum + negativeSum;
  const grossSum = positiveSum + Math.abs(negativeSum);
  return {
    signedSum,
    positiveSum,
    negativeSum,
    grossSum,
    residualToGrossRatio: grossSum > 0 ? Math.abs(signedSum) / grossSum : null,
    maxAbsTerm: Math.max(...terms.map(Math.abs)),
    minAbsTerm: Math.min(...terms.map(Math.abs)),
    termCount: terms.length,
    terms,
  };
}

function round(poly, digits = 5) {
  return poly.map(([x, y]) => [Number(x.toFixed(digits)), Number(y.toFixed(digits))]);
}
function translatedArea(poly) {
  if (!Array.isArray(poly) || poly.length < 3) return null;
  const origin = poly[0];
  let s = 0;
  for (let i = 0; i < poly.length; i += 1) {
    const a = [poly[i][0] - origin[0], poly[i][1] - origin[1]];
    const b = [poly[(i + 1) % poly.length][0] - origin[0], poly[(i + 1) % poly.length][1] - origin[1]];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(s) / 2;
}
function orientation(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}
function properSegmentIntersection(a, b, c, d) {
  const abC = orientation(a, b, c);
  const abD = orientation(a, b, d);
  const cdA = orientation(c, d, a);
  const cdB = orientation(c, d, b);
  return ((abC > 1e-12 && abD < -1e-12) || (abC < -1e-12 && abD > 1e-12))
    && ((cdA > 1e-12 && cdB < -1e-12) || (cdA < -1e-12 && cdB > 1e-12));
}
function bbox(poly) {
  if (!Array.isArray(poly) || poly.length === 0) return null;
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys), spanX: Math.max(...xs) - Math.min(...xs), spanY: Math.max(...ys) - Math.min(...ys) };
}
function convexHull(points) {
  if (!Array.isArray(points) || points.length < 3) return points ?? [];
  const pts = [...points].map((p) => [p[0], p[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i -= 1) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}
function polygonEquivalent(a, b, epsilon = 1e-12) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  const samePoint = (p, q) => Math.abs(p[0] - q[0]) <= epsilon && Math.abs(p[1] - q[1]) <= epsilon;
  for (let offset = 0; offset < b.length; offset += 1) {
    if (!samePoint(a[0], b[offset])) continue;
    let forward = true;
    for (let i = 0; i < a.length; i += 1) {
      if (!samePoint(a[i], b[(offset + i) % b.length])) { forward = false; break; }
    }
    if (forward) return true;
    let reverse = true;
    for (let i = 0; i < a.length; i += 1) {
      const index = (offset - i + b.length) % b.length;
      if (!samePoint(a[i], b[index])) { reverse = false; break; }
    }
    if (reverse) return true;
  }
  return false;
}

function cancellationRatio(poly) {
  const a = area(poly);
  const hull = convexHull(poly);
  const h = area(hull);
  return h > 0 ? a / h : null;
}
function orderLikeClipCellToLand(points) {
  const unique = [];
  const seen = new Set();
  for (const point of points ?? []) {
    const key = `${point[0].toFixed(6)}:${point[1].toFixed(6)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(point);
  }
  if (unique.length < 3) return unique;
  const center = unique.reduce(
    (sum, [x, y]) => [sum[0] + x, sum[1] + y],
    [0, 0],
  );
  center[0] /= unique.length;
  center[1] /= unique.length;
  unique.sort((a, b) => Math.atan2(a[1] - center[1], a[0] - center[0]) - Math.atan2(b[1] - center[1], a[0] - center[0]));
  return unique;
}

function selfIntersections(poly) {
  const hits = [];
  if (!Array.isArray(poly) || poly.length < 4) return hits;
  for (let i = 0; i < poly.length; i += 1) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    for (let j = i + 1; j < poly.length; j += 1) {
      if (j === i || (j + 1) % poly.length === i || (i + 1) % poly.length === j) continue;
      const c = poly[j];
      const d = poly[(j + 1) % poly.length];
      if (properSegmentIntersection(a, b, c, d)) hits.push([i, j]);
    }
  }
  return hits;
}
function trace(poly) {
  const rounded = round(poly);
  return {
    raw: { vertexCount: poly.length, area: area(poly), translatedArea: translatedArea(poly), bbox: bbox(poly), polygon: poly, selfIntersections: selfIntersections(poly), convexHullArea: area(convexHull(poly)), cancellationRatio: cancellationRatio(poly), shoelace: shoelaceDiagnostics(poly) },
    rounded5: { vertexCount: rounded.length, area: area(rounded), translatedArea: translatedArea(rounded), bbox: bbox(rounded), polygon: rounded, selfIntersections: selfIntersections(rounded), convexHullArea: area(convexHull(rounded)), cancellationRatio: cancellationRatio(rounded), shoelace: shoelaceDiagnostics(rounded) },
  };
}

rmSync(worktree, { recursive: true, force: true });
mkdirSync(join(root, "forensic-output"), { recursive: true });
let output;
try {
  runGit(["fetch", "--no-tags", "origin", commit]);
  runGit(["worktree", "add", "--detach", worktree, commit]);
  const file = join(worktree, "tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js");
  let source = readFileSync(file, "utf8");
  source += "\nexport { addAnchorSites, addProvinceMicroSites, addProvinceShapeSites, addPhysicalBarrierSites, addCoastInteriorSites, addSourceShapeSites, buildVoronoiCell, clipCellToLand, polygonArea, pointOnSegment, segmentIntersection, uniquePoints, pointInPolygon, ANATOLIA_PHYSICAL_ATLAS };\n";
  writeFileSync(file, source);
  const mod = await import(`file://${file}?clip=${commit}`);
  const sites = [];
  const seen = new Set();
  mod.addAnchorSites(sites, seen);
  mod.addProvinceMicroSites(sites, seen);
  mod.addProvinceShapeSites(sites, seen);
  mod.addPhysicalBarrierSites(sites, seen);
  mod.addCoastInteriorSites(sites, seen);
  mod.addSourceShapeSites(sites, seen, []);
  const candidates = [];
  for (let index = 0; index < sites.length; index += 1) {
    if (sites[index].provinceId !== targetId) continue;
    const cell = mod.buildVoronoiCell(index, sites);
    if (cell.length < 3) continue;
    const rawArea = mod.polygonArea(cell);
    const land = mod.ANATOLIA_PHYSICAL_ATLAS.landPolygons[0];
    const rawClipPoints = [];
    for (const point of cell) {
      if (mod.pointInPolygon(point, land) || land.some((_, landIndex) => mod.pointOnSegment(point, land[landIndex], land[(landIndex + 1) % land.length]))) rawClipPoints.push({ source: "cell", point });
    }
    for (const point of land) {
      if (mod.pointInPolygon(point, cell)) rawClipPoints.push({ source: "land", point });
    }
    for (let cellIndex = 0; cellIndex < cell.length; cellIndex += 1) {
      const a = cell[cellIndex];
      const b = cell[(cellIndex + 1) % cell.length];
      for (let landIndex = 0; landIndex < land.length; landIndex += 1) {
        const c = land[landIndex];
        const d = land[(landIndex + 1) % land.length];
        const intersection = mod.segmentIntersection(a, b, c, d);
        if (intersection) rawClipPoints.push({ source: "intersection", point: intersection });
      }
    }
    const uniqueClipPoints = mod.uniquePoints(rawClipPoints.map((entry) => entry.point));
    const orderedUniqueClipPoints = orderLikeClipCellToLand(uniqueClipPoints);
    const clipped = mod.clipCellToLand(cell);
    candidates.push({
      siteIndex: index,
      site: sites[index],
      rawCell: trace(cell),
      clipRepresentation: {
        preUniqueCount: rawClipPoints.length,
        unique6DecimalCount: uniqueClipPoints.length,
        unique6Decimal: uniqueClipPoints,
        unique6DecimalArea: area(uniqueClipPoints),
        unique6DecimalTranslatedArea: translatedArea(uniqueClipPoints),
        unique6DecimalOrderedArea: area(orderedUniqueClipPoints),
        unique6DecimalOrderedTranslatedArea: translatedArea(orderedUniqueClipPoints),
        unique6DecimalOrderedSelfIntersections: selfIntersections(orderedUniqueClipPoints),
        unique6DecimalOrderedConvexHullArea: area(convexHull(orderedUniqueClipPoints)),
        unique6DecimalOrderedCancellationRatio: cancellationRatio(orderedUniqueClipPoints),
        unique6DecimalOrderedShoelace: shoelaceDiagnostics(orderedUniqueClipPoints),
        canonicalClipPolygonEquivalent: polygonEquivalent(clipped, orderedUniqueClipPoints),
        canonicalClipAreaDelta: clipped.length >= 3 ? mod.polygonArea(clipped) - area(orderedUniqueClipPoints) : null,
        canonicalClipTranslatedAreaDelta: clipped.length >= 3 ? translatedArea(clipped) - translatedArea(orderedUniqueClipPoints) : null,
        unique6DecimalConvexHullArea: area(convexHull(uniqueClipPoints)),
        unique6DecimalCancellationRatio: cancellationRatio(uniqueClipPoints),
        unique6DecimalShoelace: shoelaceDiagnostics(uniqueClipPoints),
        duplicateReduction: rawClipPoints.length - uniqueClipPoints.length,
      },
      clipped: clipped.length >= 3 ? trace(clipped) : { vertexCount: clipped.length, area: null, polygon: clipped },
      collapse: {
        raw: rawArea <= 1e-10,
        clipped: clipped.length < 3 || mod.polygonArea(clipped) <= 1e-10,
        roundedClipped: clipped.length < 3 || area(round(clipped)) <= 1e-10,
        filterBeforeRoundButTinyAfter: clipped.length >= 3 && mod.polygonArea(clipped) >= 0.00005 && area(round(clipped)) <= 1e-10,
      },
    });
  }
  const qualifying = candidates.filter((c) => c.clipped.vertexCount >= 3 && c.clipped.area >= 0.00005);
  const smallest = [...candidates].sort((a, b) => (a.clipped.area ?? Infinity) - (b.clipped.area ?? Infinity))[0] ?? null;
  output = {
    probe: "A2 historical clipCellToLand lineage",
    commit,
    targetId,
    target,
    siteCount: sites.length,
    targetSiteCount: candidates.length,
    qualifyingCount: qualifying.length,
    smallest,
    tinyHits: candidates.filter((c) => c.collapse.clipped || c.collapse.roundedClipped),
    filterBeforeRoundButTinyAfter: candidates.filter((c) => c.collapse.filterBeforeRoundButTinyAfter),
    candidates,
  };
} catch (error) {
  output = { probe: "A2 historical clipCellToLand lineage", commit, targetId, target, status: "error", error: String(error?.stack || error) };
} finally {
  try { runGit(["worktree", "remove", "--force", worktree]); } catch {}
  rmSync(worktree, { recursive: true, force: true });
}
writeFileSync(join(root, "forensic-output/a2-clip-lineage.json"), JSON.stringify(output, null, 2));
process.stdout.write(JSON.stringify(output, null, 2));