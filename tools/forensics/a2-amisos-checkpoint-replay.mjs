import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
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

function git(args) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function signedArea(polygon) {
  let area = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  return area / 2;
}

function extractRuntime() {
  const runtimePath = resolve("src/world/map/assets/historical/1300/runtime.json");
  const runtime = JSON.parse(readFileSync(runtimePath, "utf8"));
  const province = (runtime.provinces ?? []).find((entry) => entry?.identity?.id === TARGET || entry?.id === TARGET);
  const geometryId = province?.references?.geometryId ?? TARGET;
  const geometry = (runtime.geometries ?? []).find((entry) => (
    entry?.identity?.provinceId === TARGET
    || entry?.identity?.id === TARGET
    || entry?.identity?.id === geometryId
  ));
  if (!geometry) {
    return {
      provinceFound: Boolean(province),
      geometryFound: false,
      geometryId,
      runtimePolygonCount: 0,
      polygons: [],
    };
  }

  const polygons = (geometry.polygons ?? []).map((polygon, polygonIndex) => ({
    polygonIndex,
    vertices: polygon.length,
    signedArea: signedArea(polygon),
    absArea: Math.abs(signedArea(polygon)),
    tiny: Math.abs(signedArea(polygon)) <= 1e-10,
  }));
  return {
    provinceFound: Boolean(province),
    geometryFound: true,
    geometryId: geometry.identity?.id ?? geometryId,
    provinceGeometryReference: province?.references?.geometryId ?? null,
    geometryProvinceId: geometry.identity?.provinceId ?? null,
    runtimePolygonCount: polygons.length,
    polygons,
  };
}

const results = [];
const original = git(["rev-parse", "HEAD"]);
try {
  for (const checkpoint of CHECKPOINTS) {
    git(["checkout", "--detach", checkpoint]);
    const commit = git(["rev-parse", "HEAD"]);
    const message = git(["log", "-1", "--pretty=%s"]);
    let buildStatus = "success";
    let buildOutput = "";
    try {
      buildOutput = execFileSync("npm", ["run", "build:historical-gis:1300"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        maxBuffer: 8 * 1024 * 1024,
      });
    } catch (error) {
      buildStatus = "failed";
      buildOutput = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;
    }

    let runtime = null;
    if (buildStatus === "success") {
      try {
        runtime = extractRuntime();
      } catch (error) {
        buildStatus = "runtime-read-failed";
        buildOutput += `\n${error.message}`;
      }
    }

    const phase2dMatch = buildOutput.match(/Phase 2D generated (\d+) Anatolia provinces from (\d+) cartographic sites\./);
    const fallbackMatches = [...buildOutput.matchAll(/\[Phase2D\]\[[^\]]+\]\[fallback-resolved\]/g)].length;
    const allAreas = runtime?.polygons?.map((polygon) => polygon.absArea) ?? [];
    results.push({
      checkpoint,
      commit,
      message,
      buildStatus,
      phase2d: phase2dMatch ? { provinces: Number(phase2dMatch[1]), sites: Number(phase2dMatch[2]) } : null,
      fallbackResolvedCount: fallbackMatches,
      runtime,
      nearestTargetDistance: allAreas.length ? Math.min(...allAreas.map((area) => Math.abs(area - TARGET_TINY))) : null,
      tinyTargetHit: allAreas.some((area) => Math.abs(area - TARGET_TINY) <= 1e-15),
      buildOutputTail: buildOutput.slice(-2000),
    });
  }
} finally {
  git(["checkout", "--detach", original]);
}

const report = {
  target: TARGET,
  targetTinyArea: TARGET_TINY,
  areaToleranceForExactHit: 1e-15,
  geometryLookup: "runtime.geometries[].identity.provinceId / identity.id / province.references.geometryId",
  checkpoints: results,
};

writeFileSync("a2-amisos-checkpoint-replay.json", `${JSON.stringify(report, null, 2)}\n`);
console.log("A2_AMISOS_CHECKPOINT_REPLAY");
console.log(JSON.stringify(report, null, 2));
console.log("A2_AMISOS_CHECKPOINT_REPLAY_END");
