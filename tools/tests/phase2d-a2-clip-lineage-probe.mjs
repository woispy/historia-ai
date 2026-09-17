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
function round(poly, digits = 5) {
  return poly.map(([x, y]) => [Number(x.toFixed(digits)), Number(y.toFixed(digits))]);
}
function trace(poly) {
  const rounded = round(poly);
  return {
    raw: { vertexCount: poly.length, area: area(poly), polygon: poly },
    rounded5: { vertexCount: rounded.length, area: area(rounded), polygon: rounded },
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
        duplicateReduction: rawClipPoints.length - uniqueClipPoints.length,
      },
      clipped: clipped.length >= 3 ? trace(clipped) : { vertexCount: clipped.length, area: null, polygon: clipped },
      collapse: {
        raw: rawArea <= 1e-10,
        clipped: clipped.length < 3 || mod.polygonArea(clipped) <= 1e-10,
        roundedClipped: clipped.length < 3 || area(round(clipped)) <= 1e-10,
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
