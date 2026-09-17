import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";

const root = process.env.CANONICAL_ROOT;
assert.ok(root, "CANONICAL_ROOT is required");
const worktree = "/tmp/a2-fallback-lineage";
const target = [36.33, 41.29];
const commits = [
  ["fallback-introduced", "0dd1dadb90103b5706fd87c470b8d4a6dc85f496"],
  ["tiny-fallback-radius", "2edad3f3a5c5c4f6d6d5f0c5f7f4b0f6c4c5d6e7"],
  ["centroid-only-acceptance", "8fb70748e0da3624103b554c040c0a9d972c719b"],
  ["envelope-anchor", "38ecea26143b69c04e4411c0bbd7a7071333538b"],
  ["tiny-invariant", "535d6a6bd6a8599f3bb6c69ac4897ef5806c2652"],
  ["historical-candidate-search", "2fbab59d49825d122edabb31de86cc4ecdeb09b2"],
  ["physical-containment-fix", "e67cdd3f7a3b89631c497f0d2ec1ac9d24444364"],
];

function runGit(args, cwd = root) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  return r.stdout.trim();
}
function area(poly) {
  let s = 0;
  for (let i = 0; i < poly.length; i += 1) {
    const n = poly[(i + 1) % poly.length];
    s += poly[i][0] * n[1] - n[0] * poly[i][1];
  }
  return Math.abs(s) / 2;
}
function round(poly) { return poly.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]); }

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
      if (!source.includes("createAnchorFallbackPolygon")) {
        results.push({ label, sha, status: "no-fallback-function" });
        continue;
      }
      source += "\nexport { createAnchorFallbackPolygon };\n";
      writeFileSync(file, source);
      const mod = await import(`file://${file}?fallback=${sha}`);
      const polygon = mod.createAnchorFallbackPolygon(target);
      results.push({
        label,
        sha,
        target,
        vertexCount: polygon?.length ?? 0,
        rawArea: polygon?.length ? area(polygon) : null,
        roundedArea: polygon?.length ? area(round(polygon)) : null,
        polygon: polygon ?? null,
      });
    } catch (error) {
      results.push({ label, sha, status: "error", error: String(error?.stack || error) });
    } finally {
      runGit(["worktree", "remove", "--force", worktree]);
    }
  }
} finally {
  rmSync(worktree, { recursive: true, force: true });
}

const hits = results.filter((r) => Number.isFinite(r.rawArea) && r.rawArea <= 1e-10);
const output = {
  probe: "A2 historical fallback lineage for Amisos metadata centroid",
  target,
  targetArea: 2.27e-13,
  tinyEpsilon: 1e-10,
  results,
  tinyHits: hits,
  rootCauseCandidate: hits.length > 0 ? "fallback-clipping representation" : null,
};
writeFileSync(join(root, "forensic-output/a2-fallback-lineage.json"), JSON.stringify(output, null, 2));
process.stdout.write(JSON.stringify(output, null, 2));
