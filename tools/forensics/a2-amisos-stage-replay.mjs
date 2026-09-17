import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const TARGET = "pontus-amisos";
const TARGET_TINY = 2.27e-13;
const TINY_EPS = 1e-10;
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
function __a2IsTiny(area) {
  return Number.isFinite(area) && Math.abs(area) <= ${TINY_EPS};
}
`;

function findFunctionBounds(source, name) {
  const re = new RegExp(`function\\s+${name}\\s*\\(([^)]*)\\)\\s*\\{`, "m");
  const match = re.exec(source);
  if (!match) return null;
  const open = source.indexOf("{", match.index);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return { start: match.index, open, end: i + 1, params: match[1].split(",").map((p) => p.trim()).filter(Boolean) };
    }
  }
  return null;
}

function targetExpression(params) {
  const index = params.find((p) => /Index$/i.test(p) || /index/i.test(p));
  const sites = params.find((p) => /sites/i.test(p));
  if (index && sites) return `${sites}[${index}]?.provinceId === __A2_TARGET`;
  if (params.length >= 2) return `${params[1]}[${params[0]}]?.provinceId === __A2_TARGET`;
  return "false";
}

function instrumentBuilder(worktree) {
  const file = resolve(worktree, "tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js");
  let source = readFileSync(file, "utf8");
  if (!source.includes('const __A2_TARGET = "pontus-amisos";')) source = `${INSTRUMENTATION}\n${source}`;

  const rawFn = findFunctionBounds(source, "buildVoronoiCell");
  if (!rawFn) throw new Error("A2 stage hook anchor missing: buildVoronoiCell");
  {
    const body = source.slice(rawFn.open + 1, rawFn.end - 1);
    const target = targetExpression(rawFn.params);
    let nextBody = `\n  const __a2TargetSite = ${target};\n  if (__a2TargetSite) __a2Stage("A_RAW_POWER_CELL_START", { params: ${JSON.stringify(rawFn.params)} });\n${body}`;
    nextBody = nextBody.replace(/return\\s+polygon\\s*;/g, `if (__a2TargetSite) __a2Stage("A_RAW_POWER_CELL", { vertices: polygon.length, signedArea: __a2Area(polygon), absArea: Math.abs(__a2Area(polygon) ?? 0), tiny: __a2IsTiny(__a2Area(polygon)) });\n    return polygon;`);
    source = `${source.slice(0, rawFn.open + 1)}${nextBody}${source.slice(rawFn.end - 1)}`;
  }

  const landFn = findFunctionBounds(source, "buildLandVoronoiCells");
  if (landFn) {
    const body = source.slice(landFn.open + 1, landFn.end - 1);
    const target = targetExpression(landFn.params);
    let nextBody = `\n  const __a2TargetSite = ${target};\n${body}`;
    nextBody = nextBody.replace(/polygon\\s*=\\s*clipHalfPlane\\(polygon,\\s*a,\\s*b,\\s*c\\);/g, (match) => `${match}\n      if (__a2TargetSite) __a2Stage("B_POWER_CLIP_ITERATION", { vertices: polygon.length, signedArea: __a2Area(polygon), absArea: Math.abs(__a2Area(polygon) ?? 0), tiny: __a2IsTiny(__a2Area(polygon)) });`);
    nextBody = nextBody.replace(/return\\s+cells\\s*;/g, `if (__a2TargetSite) __a2Stage("B_PHYSICAL_CLIP_RESULT", { cellCount: cells.length, cellAreas: cells.map((ring) => ({ vertices: ring.length, signedArea: __a2Area(ring), absArea: Math.abs(__a2Area(ring) ?? 0), tiny: __a2IsTiny(__a2Area(ring)) })) });\n  return cells;`);
    source = `${source.slice(0, landFn.open + 1)}${nextBody}${source.slice(landFn.end - 1)}`;
  }

  const before = source;
  source = source.replace(/polygon\\s*=\\s*clipHalfPlane\\(polygon,\\s*a,\\s*b,\\s*c\\);/g, (match) => `${match}\n      if (typeof __a2TargetSite !== "undefined" && __a2TargetSite) __a2Stage("B_POWER_CLIP_ITERATION_GLOBAL", { vertices: polygon.length, signedArea: __a2Area(polygon), absArea: Math.abs(__a2Area(polygon) ?? 0), tiny: __a2IsTiny(__a2Area(polygon)) });`);
  if (source === before && !landFn) throw new Error("A2 stage hook anchor missing: no clipHalfPlane call found");

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
    try {
      git(["worktree", "add", "--detach", worktree, checkpoint], root);
      run("node", ["tools/asset-builder/cli/fetch-natural-earth-hydrography-10m.js"], worktree);
      run("node", ["tools/asset-builder/cli/build-anatolia-hydrography-10m.js"], worktree);
      instrumentBuilder(worktree);
      let status = "success";
      let output = "";
      try { output = run("npm", ["run", "build:historical-gis:1300"], worktree); }
      catch (error) { status = "build-failed"; output = `${error.stdout ?? ""}\n${error.stderr ?? ""}`; }
      const stages = parseStages(output);
      const tinyHits = stages.filter((entry) => Number.isFinite(entry.absArea) && Math.abs(entry.absArea - TARGET_TINY) <= 1e-15);
      const thresholdHits = stages.filter((entry) => Number.isFinite(entry.absArea) && entry.absArea <= TINY_EPS);
      const minArea = stages.filter((entry) => Number.isFinite(entry.absArea)).reduce((m, entry) => Math.min(m, entry.absArea), Number.POSITIVE_INFINITY);
      results.push({ checkpoint, status, stageCount: stages.length, minObservedAbsArea: Number.isFinite(minArea) ? minArea : null, tinyHits, thresholdHits, stages, outputTail: output.slice(-5000) });
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
  tinyThreshold: TINY_EPS,
  harness: "immutable detached checkpoint worktree + pinned Natural Earth preparation + signature-resilient non-production instrumentation",
  checkpoints: results,
};
writeFileSync("a2-amisos-stage-replay.json", `${JSON.stringify(report, null, 2)}\n`);
console.log("A2_AMISOS_STAGE_REPLAY");
console.log(JSON.stringify(report, null, 2));
console.log("A2_AMISOS_STAGE_REPLAY_END");