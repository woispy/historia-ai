import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const TARGET = "pontus-amisos";
const TARGET_TINY = 2.27e-13;
const TINY_THRESHOLD = 1e-10;
const CHECKPOINTS = [
  "837ec8dd2d878ceb227f609c3da481610b54d0db",
  "bdf166a4",
  "3021b2d1",
  "7d895c99",
  "5be399d4",
  "6b7424125eee4a1c72925b7a1780c68e695e9ba3",
];

function git(args, cwd = process.cwd()) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function run(cmd, args, cwd) {
  return execFileSync(cmd, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 16 * 1024 * 1024,
  });
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

function inspectRuntime(worktree) {
  const runtimePath = resolve(worktree, "src/world/map/assets/historical/1300/runtime.json");
  const runtime = JSON.parse(readFileSync(runtimePath, "utf8"));
  const province = (runtime.provinces ?? []).find((entry) => (
    entry?.identity?.id === TARGET || entry?.id === TARGET
  ));
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

  const polygons = (geometry.polygons ?? []).map((polygon, polygonIndex) => {
    const area = signedArea(polygon);
    return {
      polygonIndex,
      vertices: polygon.length,
      signedArea: area,
      absArea: Math.abs(area),
      tiny: Math.abs(area) <= TINY_THRESHOLD,
      deltaFromTargetTiny: Math.abs(Math.abs(area) - TARGET_TINY),
    };
  });

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
const worktreeRoot = mkdtempSync(resolve(tmpdir(), "historia-a2-replay-"));
const rootRepo = process.cwd();
const originalHead = git(["rev-parse", "HEAD"]);

try {
  for (const checkpoint of CHECKPOINTS) {
    const worktree = resolve(worktreeRoot, checkpoint.slice(0, 8));
    let hydrographyFetchStatus = "skipped";
    let hydrographyFetchOutput = "";
    let hydrographyBuildStatus = "skipped";
    let hydrographyOutput = "";
    let buildStatus = "success";
    let buildOutput = "";
    let runtime = null;

    try {
      git(["worktree", "add", "--detach", worktree, checkpoint], rootRepo);
      const commit = git(["rev-parse", "HEAD"], worktree);
      const message = git(["log", "-1", "--pretty=%s"], worktree);

      try {
        // The Natural Earth source files are intentionally not tracked in git.
        // Recreate the exact pinned source inputs used by the historical builder.
        hydrographyFetchOutput = run(
          "node",
          ["tools/asset-builder/cli/fetch-natural-earth-hydrography-10m.js"],
          worktree,
        );
        hydrographyFetchStatus = "success";
      } catch (error) {
        hydrographyFetchStatus = "failed";
        hydrographyFetchOutput = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;
      }

      if (hydrographyFetchStatus === "success") {
        try {
          hydrographyOutput = run(
            "node",
            ["tools/asset-builder/cli/build-anatolia-hydrography-10m.js"],
            worktree,
          );
          hydrographyBuildStatus = "success";
        } catch (error) {
          hydrographyBuildStatus = "failed";
          hydrographyOutput = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;
        }
      } else {
        hydrographyBuildStatus = "blocked-by-fetch";
        hydrographyOutput = "Historical GIS replay skipped because pinned Natural Earth source inputs could not be fetched.";
      }

      if (hydrographyBuildStatus === "success") {
        try {
          buildOutput = run("npm", ["run", "build:historical-gis:1300"], worktree);
        } catch (error) {
          buildStatus = "failed";
          buildOutput = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;
        }
      } else {
        buildStatus = "blocked-by-hydrography";
        buildOutput = "Historical GIS replay skipped because the checkpoint hydrography dependency could not be rebuilt.";
      }

      if (buildStatus === "success") {
        try {
          runtime = inspectRuntime(worktree);
        } catch (error) {
          buildStatus = "runtime-read-failed";
          buildOutput += `\n${error.message}`;
        }
      }

      const phase2dMatch = buildOutput.match(/Phase 2D generated (\d+) Anatolia provinces from (\d+) cartographic sites\./);
      const fallbackMatches = [...buildOutput.matchAll(/\[Phase2D\]\[[^\]]+\]\[fallback-resolved\]/g)].length;
      const allAreas = runtime?.polygons?.map((polygon) => polygon.absArea) ?? [];
      const closest = allAreas.length
        ? Math.min(...allAreas.map((area) => Math.abs(area - TARGET_TINY)))
        : null;

      results.push({
        checkpoint,
        commit,
        message,
        hydrographyFetchStatus,
        hydrographyFetchOutputTail: hydrographyFetchOutput.slice(-2000),
        hydrographyBuildStatus,
        hydrographyOutputTail: hydrographyOutput.slice(-2000),
        buildStatus,
        phase2d: phase2dMatch ? { provinces: Number(phase2dMatch[1]), sites: Number(phase2dMatch[2]) } : null,
        fallbackResolvedCount: fallbackMatches,
        runtime,
        nearestTargetTinyDelta: closest,
        tinyTargetHit: allAreas.some((area) => Math.abs(area - TARGET_TINY) <= 1e-15),
        buildOutputTail: buildOutput.slice(-3000),
      });
    } catch (error) {
      results.push({
        checkpoint,
        buildStatus: "worktree-failed",
        error: error.message,
      });
    } finally {
      try {
        git(["worktree", "remove", "--force", worktree], rootRepo);
      } catch {
        // Preserve the forensic result even if cleanup has to be recovered manually.
      }
    }
  }
} finally {
  try {
    git(["checkout", "--detach", originalHead], rootRepo);
  } catch {
    // The root checkout was never intentionally changed; this is a defensive restore.
  }
  try {
    git(["worktree", "prune"], rootRepo);
  } catch {
    // Non-fatal forensic cleanup.
  }
  rmSync(worktreeRoot, { recursive: true, force: true });
}

const report = {
  target: TARGET,
  targetTinyArea: TARGET_TINY,
  tinyThreshold: TINY_THRESHOLD,
  areaToleranceForExactHit: 1e-15,
  harness: "immutable-root-checkout + detached git worktree per historical checkpoint + pinned Natural Earth source fetch + deterministic hydrography rebuild",
  geometryLookup: "runtime.geometries[].identity.provinceId / identity.id / province.references.geometryId",
  checkpoints: results,
};

writeFileSync("a2-amisos-checkpoint-replay.json", `${JSON.stringify(report, null, 2)}\n`);
console.log("A2_AMISOS_CHECKPOINT_REPLAY");
console.log(JSON.stringify(report, null, 2));
console.log("A2_AMISOS_CHECKPOINT_REPLAY_END");
