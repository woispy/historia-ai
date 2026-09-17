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
function area(ring) {
  if (!Array.isArray(ring) || ring.length < 3) return null;
  let sum = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
}
function stat(ring) {
  const signedArea = area(ring);
  return { vertices: Array.isArray(ring) ? ring.length : 0, signedArea, absArea: signedArea == null ? null : Math.abs(signedArea), tiny: signedArea != null && Math.abs(signedArea) <= TINY_EPS };
}

const INSTRUMENTATION = `
const __A2_TARGET = "${TARGET}";
function __a2Area(ring) {
  if (!Array.isArray(ring) || ring.length < 3) return null;
  let sum = 0;
  for (let i = 0; i < ring.length; i += 1) { const a = ring[i], b = ring[(i + 1) % ring.length]; sum += a[0] * b[1] - b[0] * a[1]; }
  return sum / 2;
}
function __a2Stat(ring) { const signedArea = __a2Area(ring); return { vertices: Array.isArray(ring) ? ring.length : 0, signedArea, absArea: signedArea == null ? null : Math.abs(signedArea), tiny: signedArea != null && Math.abs(signedArea) <= ${TINY_EPS} }; }
function __a2Stage(stage, payload) { console.log("A2_STAGE|" + JSON.stringify({ stage, ...payload })); }
`;

function findFunction(source, name) {
  const re = new RegExp(`function\\s+${name}\\s*\\(([^)]*)\\)\\s*\\{`, "m");
  const match = re.exec(source);
  if (!match) return null;
  const open = source.indexOf("{", match.index);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") { depth -= 1; if (depth === 0) return { start: match.index, open, end: i + 1, params: match[1].split(",").map((p) => p.trim()) }; }
  }
  return null;
}
function replaceFunctionBody(source, fn, transform) {
  const body = source.slice(fn.open + 1, fn.end - 1);
  const next = transform(body, fn.params);
  return source.slice(0, fn.open + 1) + next + source.slice(fn.end - 1);
}

function instrumentV15(worktree) {
  const file = resolve(worktree, "tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js");
  let source = readFileSync(file, "utf8");
  source = `${INSTRUMENTATION}\n${source}`;

  let fn = findFunction(source, "powerCell");
  if (!fn) throw new Error("V15 hook missing: powerCell");
  source = replaceFunctionBody(source, fn, (body) => {
    let next = `\n  const __a2Target = ${fn.params[1]}?.[${fn.params[0]}]?.provinceId === __A2_TARGET;\n${body}`;
    next = next.replace(/polygon=halfPlane\\(polygon,([^;]+)\\);/g, (m) => `${m} if(__a2Target)__a2Stage("A_POWER_CELL_ITERATION",{polygon:__a2Stat(polygon)});`);
    next = next.replace(/return polygon;/g, `if(__a2Target)__a2Stage("A_RAW_POWER_CELL",{polygon:__a2Stat(polygon)}); return polygon;`);
    next = next.replace(/return\s*\[\];/g, `if(__a2Target)__a2Stage("A_RAW_POWER_CELL_EMPTY",{polygon:__a2Stat(polygon)}); return [];`);
    return next;
  });

  fn = findFunction(source, "clipCellToLand");
  if (!fn) throw new Error("V15 hook missing: clipCellToLand");
  source = replaceFunctionBody(source, fn, (body) => {
    let next = `\n  const __a2Target = ${fn.params[1]}?.__a2TargetMarker === true;\n${body}`;
    next = next.replace(/const candidates=([^;]+);/, (m) => `${m} if(${fn.params[1]}?.__a2TargetMarker===true)__a2Stage("B_PHYSICAL_CLIP_CANDIDATES",{candidateCount:candidates.length,candidates:candidates.map(__a2Stat)});`);
    next = next.replace(/const selected=([^;]+);/, (m) => `${m} if(${fn.params[1]}?.__a2TargetMarker===true)__a2Stage("B_PHYSICAL_CLIP_SELECTED",{selected:__a2Stat(selected),candidateCount:candidates.length});`);
    return next;
  });

  fn = findFunction(source, "normalizePhysicalBoundary");
  if (!fn) throw new Error("V15 hook missing: normalizePhysicalBoundary");
  source = replaceFunctionBody(source, fn, (body) => `\n  const __a2InputStat = __a2Stat(${fn.params[0]});\n  if(__a2InputStat.tiny)__a2Stage("C_NORMALIZE_INPUT_TINY",{input:__a2InputStat});\n${body}`);

  fn = findFunction(source, "buildPartition");
  if (!fn) throw new Error("V15 hook missing: buildPartition");
  source = replaceFunctionBody(source, fn, (body) => {
    let next = `\n  const __a2Sites = ${fn.params[0]};\n  const __a2TargetIndex = __a2Sites.findIndex((site)=>site?.provinceId===__A2_TARGET);\n  if(__a2TargetIndex>=0)__a2Sites[__a2TargetIndex].point.__a2TargetMarker = true;\n${body}`;
    next = next.replace(/const rawPolygon=([^;]+);/, (m) => `${m} if(site.provinceId===__A2_TARGET)__a2Stage("B_RAW_AFTER_LAND_CLIP",{rawPolygon:__a2Stat(rawPolygon)});`);
    next = next.replace(/const normalizedPolygon=([^;]+);/, (m) => `${m} if(site.provinceId===__A2_TARGET)__a2Stage("C_NORMALIZED",{normalizedPolygon:__a2Stat(normalizedPolygon)});`);
    next = next.replace(/const polygon=([^;]+);/, (m) => `${m} if(site.provinceId===__A2_TARGET)__a2Stage("C_SELECTED",{rawPolygon:__a2Stat(rawPolygon),normalizedPolygon:__a2Stat(normalizedPolygon),selected:__a2Stat(polygon)});`);
    return next;
  });

  writeFileSync(file, source, "utf8");
}

function parseStages(output) {
  return output.split("\\n").flatMap((line) => line.startsWith("A2_STAGE|") ? (()=>{ try{return [JSON.parse(line.slice(9))];}catch{return[];} })() : []);
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
      instrumentV15(worktree);
      let status = "success", output = "";
      try { output = run("npm", ["run", "build:historical-gis:1300"], worktree); }
      catch (error) { status = "build-failed"; output = `${error.stdout ?? ""}\\n${error.stderr ?? ""}`; }
      const stages = parseStages(output);
      const numeric = stages.filter((x)=>Number.isFinite(x.absArea));
      const tinyHits = stages.filter((x)=>Number.isFinite(x.absArea) && Math.abs(x.absArea-TARGET_TINY)<=1e-15);
      const thresholdHits = stages.filter((x)=>Number.isFinite(x.absArea) && x.absArea<=TINY_EPS);
      const minArea = numeric.reduce((m,x)=>Math.min(m,x.absArea),Infinity);
      results.push({ checkpoint, status, stageCount:stages.length, minObservedAbsArea:Number.isFinite(minArea)?minArea:null, tinyHits, thresholdHits, stages, outputTail:output.slice(-5000) });
    } catch (error) { results.push({checkpoint,status:"harness-failed",error:error.message}); }
    finally { try{git(["worktree","remove","--force",worktree],root);}catch{} }
  }
} finally {
  try{git(["checkout","--detach",originalHead],root);}catch{}
  try{git(["worktree","prune"],root);}catch{}
  rmSync(rootTmp,{recursive:true,force:true});
}
const report={target:TARGET,targetTinyArea:TARGET_TINY,tinyThreshold:TINY_EPS,harness:"immutable detached checkpoint worktree + pinned Natural Earth + direct V15 producer instrumentation",checkpoints:results};
writeFileSync("a2-amisos-stage-replay.json",`${JSON.stringify(report,null,2)}\\n`);
console.log("A2_AMISOS_STAGE_REPLAY");
console.log(JSON.stringify(report,null,2));
console.log("A2_AMISOS_STAGE_REPLAY_END");
