import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";

const root = process.env.CANONICAL_ROOT;
assert.ok(root, "CANONICAL_ROOT is required");

const SOURCE_SHA = "3575c1bccf94a322fed175958ce786531b142497";
const worktree = "/tmp/a2-v15-normalization-probe";
const v15Path = join(worktree, "tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js");
const canonicalRaw = [
  [36.195925202539314, 41.09303359554889],
  [36.16912546432125, 41.02342700930536],
  [36.27531671907767, 40.98580004377039],
  [36.281324021356326, 41.02610241697239],
  [36.232226084653455, 41.07941786209945],
];
const canonicalRounded = canonicalRaw.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]);

function polygonArea(polygon) {
  let sum = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const next = polygon[(index + 1) % polygon.length];
    sum += polygon[index][0] * next[1] - next[0] * polygon[index][1];
  }
  return Math.abs(sum) / 2;
}

function runGit(args, cwd = root) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

rmSync(worktree, { recursive: true, force: true });
runGit(["fetch", "--no-tags", "origin", SOURCE_SHA]);
runGit(["worktree", "add", "--detach", worktree, SOURCE_SHA]);

try {
  const source = readFileSync(v15Path, "utf8");
  assert.ok(source.includes("function normalizePhysicalBoundary"), "V15 normalizePhysicalBoundary missing");
  writeFileSync(v15Path, `${source}\nexport { normalizePhysicalBoundary };\n`);

  const module = await import(`file://${v15Path}?a2normalize=${Date.now()}`);
  const normalizedRaw = module.normalizePhysicalBoundary(canonicalRaw);
  const normalizedRounded = module.normalizePhysicalBoundary(canonicalRounded);

  const result = {
    probe: "A2 canonical raw -> historical V15 normalizePhysicalBoundary",
    sourceSHA: SOURCE_SHA,
    targetArea: 2.27e-13,
    tinyEpsilon: 1e-10,
    input: {
      raw: { vertexCount: canonicalRaw.length, area: polygonArea(canonicalRaw), polygon: canonicalRaw },
      rounded: { vertexCount: canonicalRounded.length, area: polygonArea(canonicalRounded), polygon: canonicalRounded },
    },
    output: {
      raw: normalizedRaw
        ? { vertexCount: normalizedRaw.length, area: polygonArea(normalizedRaw), polygon: normalizedRaw }
        : null,
      rounded: normalizedRounded
        ? { vertexCount: normalizedRounded.length, area: polygonArea(normalizedRounded), polygon: normalizedRounded }
        : null,
    },
    collapseObserved: [normalizedRaw, normalizedRounded].some((polygon) => polygon && polygonArea(polygon) <= 1e-10),
  };
  writeFileSync(join(root, "forensic-output/a2-canonical-v15-normalization-probe.json"), JSON.stringify(result, null, 2));
  process.stdout.write(JSON.stringify(result, null, 2));
} finally {
  runGit(["worktree", "remove", "--force", worktree]);
}
