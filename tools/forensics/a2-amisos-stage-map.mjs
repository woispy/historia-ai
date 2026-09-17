import { readFileSync, writeFileSync } from "node:fs";

const TARGET = "pontus-amisos";
const needles = ["buildPartition", "clipLandByCell", "buildPhase2D", "Phase2D", "powerCell", "normalizeRing", "buildLodRings"];
const files = [
  "tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js",
  "src/map/rendering/gpu/ProvinceGpuPackStable.js",
];

const report = { target: TARGET, stages: {}, files: {} };
for (const path of files) {
  const text = readFileSync(path, "utf8");
  report.files[path] = {};
  for (const needle of needles) {
    const lines = text.split("\\n");
    const hits = [];
    lines.forEach((line, i) => { if (line.includes(needle)) hits.push(i + 1); });
    if (hits.length) report.files[path][needle] = hits.slice(0, 20);
  }
}
report.stages = {
  A: "Locate powerCell/buildPartition producer in Phase 2D builder; instrument its pontus-amisos site/cell before clipping.",
  B: "Locate clipLandByCell/physical clipping producer; instrument the exact polygon handed to runtime asset construction.",
  C: "Locate runtime adapter and GPU normalizeRing/buildLodRings; compare each transformation against TARGET_TINY.",
  gate: "No production behavior changes; instrumentation must be forensic-only and gated by A2 target."
};
writeFileSync("a2-amisos-stage-map.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
