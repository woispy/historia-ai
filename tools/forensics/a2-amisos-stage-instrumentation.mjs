import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const TARGET = "pontus-amisos";
const TARGET_TINY = 2.27e-13;
const THRESHOLD = 1e-10;

function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 32 * 1024 * 1024 });
}
function area(ring) {
  let s = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
}
function stats(label, ring) {
  if (!Array.isArray(ring) || ring.length < 3) return { label, vertices: ring?.length ?? 0, signedArea: null, absArea: null, tiny: false };
  const signedArea = area(ring);
  const xs = ring.map(p => p[0]), ys = ring.map(p => p[1]);
  return { label, vertices: ring.length, signedArea, absArea: Math.abs(signedArea), tiny: Math.abs(signedArea) <= THRESHOLD, deltaFromTargetTiny: Math.abs(Math.abs(signedArea) - TARGET_TINY), bbox: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] };
}

const runtimePath = resolve("src/world/map/assets/historical/1300/runtime.json");
run("npm", ["run", "build:historical-gis:1300"]);
const runtime = JSON.parse(readFileSync(runtimePath, "utf8"));
const province = (runtime.provinces ?? []).find(e => e?.identity?.id === TARGET || e?.id === TARGET);
const geometryId = province?.references?.geometryId ?? TARGET;
const geometry = (runtime.geometries ?? []).find(e => e?.identity?.provinceId === TARGET || e?.identity?.id === TARGET || e?.identity?.id === geometryId);
const runtimeRings = geometry?.polygons ?? [];

const report = {
  target: TARGET,
  targetTinyArea: TARGET_TINY,
  threshold: THRESHOLD,
  stageA: { status: "not directly instrumented", note: "Use runtime provenance below; raw power-cell and physical-clip producers require builder-level hooks." },
  stageB: { status: "not directly instrumented", note: "Use runtime provenance below; raw power-cell and physical-clip producers require builder-level hooks." },
  stageC: { runtime: runtimeRings.map((r, i) => stats(`runtime[${i}]`, r)) },
  lineage: {
    provinceFound: Boolean(province),
    geometryFound: Boolean(geometry),
    geometryId,
    provinceGeometryReference: province?.references?.geometryId ?? null,
    geometryProvinceId: geometry?.identity?.provinceId ?? null,
  },
  interpretation: "This is intentionally a non-mutating runtime-side probe. It must not be used to claim Stage A/B producer attribution unless the builder is instrumented separately."
};
writeFileSync("a2-amisos-stage-instrumentation.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
