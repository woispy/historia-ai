import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const TARGET = "pontus-amisos";
const TARGET_TINY = 2.27e-13;
const CHECKPOINTS = [
  "837ec8dd2d878ceb227f609c3da481610b54d0db",
  "bdf166a4",
  "3021b2d1",
  "7d895c99",
  "5be399d4",
  "6b7424125eee4a1c72925b7a1780c68e695e9ba3",
];

function git(args, cwd = process.cwd()) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function run(cmd, args, cwd) {
  return execFileSync(cmd, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 32 * 1024 * 1024 });
}

const INSTRUMENTATION = `
const __A2_TARGET = "${TARGET}";
function __a2Area(ring) {
  if (!Array.isArray(ring) || ring.length < 3) return null;
  let s = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
}
function __a2Stage(stage, payload) {
  console.log("A2_STAGE|" + JSON.stringify({ stage, ...payload }));
}
`;

function instrumentBuilder(worktree) {
  const file = resolve(worktree, "tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js");
  let source = readFileSync(file, "utf8");
  if (!source.includes('const __A2_TARGET = "pontus-amisos";')) {
    source = `${INSTRUMENTATION}\n${source}`;
  }

  const rawPowerAnchor = `  const politicalSites = sites.filter((site) => Boolean(site.provinceId));\n`;
  if (!source.includes(rawPowerAnchor)) throw new Error("A2 stage hook anchor missing: politicalSites");
  source = source.replace(rawPowerAnchor, `${rawPowerAnchor}  {\n    const targetIndex = politicalSites.findIndex((site) => site.provinceId === __A2_TARGET);\n    if (targetIndex >= 0) {\n      const rawPowerCell = buildVoronoiCell(targetIndex, politicalSites);\n      __a2Stage("A_RAW_POWER_CELL", { targetIndex, vertices: rawPowerCell.length, signedArea: __a2Area(rawPowerCell), absArea: Math.abs(__a2Area(rawPowerCell) ?? 0) });\n    }\n  }\n`);

  const landStart = `  const site = politicalSites[siteIndex].point;\n  const cells = [];\n  for (const landPolygon of ANATOLIA_PHYSICAL_ATLAS.landPolygons) {\n    let polygon = landPolygon.slice(0, -1);\n`;
  if (!source.includes(landStart)) throw new Error("A2 stage hook anchor missing: land cell start");
  source = source.replace(landStart, `  const site = politicalSites[siteIndex].point;\n  const cells = [];\n  const __a2TargetSite = politicalSites[siteIndex]?.provinceId === __A2_TARGET;\n  let __a2LandIndex = 0;\n  for (const landPolygon of ANATOLIA_PHYSICAL_ATLAS.landPolygons) {\n    let polygon = landPolygon.slice(0, -1);\n    if (__a2TargetSite) __a2Stage("B_PHYSICAL_CLIP_START", { landIndex: __a2LandIndex, vertices: polygon.length, signedArea: __a2Area(polygon), absArea: Math.abs(__a2Area(polygon) ?? 0) });\n`);

  const clipLine = `      polygon = clipHalfPlane(polygon, a, b, c);\n      if (polygon.length < 3) break;\n`;
  if (!source.includes(clipLine)) throw new Error("A2 stage hook anchor missing: physical clip iteration");
  source = source.replace(clipLine, `      polygon = clipHalfPlane(polygon, a, b, c);\n      if (__a2TargetSite) __a2Stage("B_POWER_CLIP_ITERATION", { landIndex: __a2LandIndex, otherIndex, vertices: polygon.length, signedArea: __a2Area(polygon), absArea: Math.abs(__a2Area(polygon) ?? 0) });\n      if (polygon.length < 3) break;\n`);

  const landEnd = `    if (polygon.length >= 3) cells.push(polygon);\n  }\n  return cells;\n}\n`;
  if (!source.includes(landEnd)) throw new Error("A2 stage hook anchor missing: physical clip end");
  source = source.replace(landEnd, `    if (__a2TargetSite) __a2Stage("B_PHYSICAL_CLIP_RESULT", { landIndex: __a2LandIndex, vertices: polygon.length, signedArea: __a2Area(polygon), absArea: Math.abs(__a2Area(polygon) ?? 0) });\n    if (polygon.length >= 3) cells.push(polygon);\n    __a2LandIndex += 1;\n  }\n  return cells;\n}\n`);

  const outerLoop = `      if (polygonArea(cell) < 0.00005) continue;\n      if (!isPhysicalLandPoint(polygonCentroid(cell))) continue;\n      const rounded = roundPolygon(cell);\n      if (!rounded.every(isPhysicalLandPoint) || !isPhysicalLandPolygon(rounded)) continue;\n      polygonsByProvince[sites[siteIndex].provinceId].push(rounded);\n`;
  if (!source.includes(outerLoop)) throw new Error("A2 stage hook anchor missing: canonicalization filter");
  source = source.replace(outerLoop, `      const __a2TargetCell = sites[siteIndex].provinceId === __A2_TARGET;\n      if (__a2TargetCell) __a2Stage("C_PRE_FILTER", { siteIndex, vertices: cell.length, signedArea: __a2Area(cell), absArea: Math.abs(__a2Area(cell) ?? 0), tiny: Math.abs(__a2Area(cell) ?? 0) <= ${1e-10} });\n      if (polygonArea(cell) < 0.00005) continue;\n      if (!isPhysicalLandPoint(polygonCentroid(cell))) continue;\n      const rounded = roundPolygon(cell);\n      if (__a2TargetCell) __a2Stage("C_ROUNDED", { siteIndex, vertices: rounded.length, signedArea: __a2Area(rounded), absArea: Math.abs(__a2Area(rounded) ?? 0), tiny: Math.abs(__a2Area(rounded) ?? 0) <= ${1e-10} });\n      if (!rounded.every(isPhysicalLandPoint) || !isPhysicalLandPolygon(rounded)) continue;\n      if (__a2TargetCell) __a2Stage("C_ACCEPTED", { siteIndex, vertices: rounded.length, signedArea: __a2Area(rounded), absArea: Math.abs(__a2Area(rounded) ?? 0) });\n      polygonsByProvince[sites[siteIndex].provinceId].push(rounded);\n`);

  writeFileSync(file, source, "utf8");
}

function parseStages(output) {
  return output.split("\\n").flatMap((line) => {
    if (!line.startsWith("A2_STAGE|")) return [];
    try { return [JSON.parse(line.slice("A2_STAGE|".length))]; } catch { return []; }
  });
}

const results = [];
const root = process.cwd();
const originalHead = git(["rev-parse", "HEAD"]);
const rootTmp = mkdtempSync(resolve(tmpdir(), "historia-a2-stage-replay-"));
try {
  for (const checkpoint of CHECKPOINTS) {
    const worktree = resolve(rootTmp, checkpoint.slice(0, 8));
    let status = "success";
    let output = "";
    try {
      git(["worktree", "add", "--detach", worktree, checkpoint], root);
      run("node", ["tools/asset-builder/cli/fetch-natural-earth-hydrography-10m.js"], worktree);
      run("node", ["tools/asset-builder/cli/build-anatolia-hydrography-10m.js"], worktree);
      instrumentBuilder(worktree);
      try { output = run("npm", ["run", "build:historical-gis:1300"], worktree); }
      catch (error) { status = "build-failed"; output = `${error.stdout ?? ""}\\n${error.stderr ?? ""}`; }
      const stages = parseStages(output);
      const tinyHits = stages.filter((entry) => Number.isFinite(entry.absArea) && Math.abs(entry.absArea - TARGET_TINY) <= 1e-15);
      const minArea = stages.filter((entry) => Number.isFinite(entry.absArea)).reduce((m, entry) => Math.min(m, entry.absArea), Number.POSITIVE_INFINITY);
      results.push({ checkpoint, status, stageCount: stages.length, minObservedAbsArea: Number.isFinite(minArea) ? minArea : null, tinyHits, stages, outputTail: output.slice(-5000) });
    } catch (error) {
      results.push({ checkpoint, status: "harness-failed", error: error.message });
    } finally {
      try { git(["worktree", "remove", "--force", worktree], root); } catch {}
    }
  }
} finally {
  try { git(["checkout", "--detach", originalHead], root); } catch {}
  try { git(["worktree", "prune"], root); } catch {}
  rmSync(rootTmp, { recursive: true, force: true });
}

const report = {
  target: TARGET,
  targetTinyArea: TARGET_TINY,
  harness: "immutable detached checkpoint worktree + pinned Natural Earth preparation + non-production builder instrumentation",
  stages: ["A_RAW_POWER_CELL", "B_PHYSICAL_CLIP_START", "B_POWER_CLIP_ITERATION", "B_PHYSICAL_CLIP_RESULT", "C_PRE_FILTER", "C_ROUNDED", "C_ACCEPTED"],
  checkpoints: results,
};
writeFileSync("a2-amisos-stage-replay.json", `${JSON.stringify(report, null, 2)}\\n`);
console.log("A2_AMISOS_STAGE_REPLAY");
console.log(JSON.stringify(report, null, 2));
console.log("A2_AMISOS_STAGE_REPLAY_END");
