import fs from "node:fs";
import path from "node:path";

const roots = [path.resolve("src/map/rendering"), path.resolve("src/map/runtime")];
const forbidden = [
  { label: "temporary terrainRegions", pattern: /\bterrainRegions\b/ },
  { label: "temporary mountainRanges", pattern: /\bmountainRanges\b/ },
];
const productionCameraLocks = [
  { label: "production camera pitch lock", pattern: /pitch\s*:\s*0\b/ },
  { label: "production camera yaw lock", pattern: /yaw\s*:\s*0\b/ },
];
const expectedCameraDefaults = path.resolve("src/map/runtime/MapCameraRig.js");

const violations = [];
for (const root of roots) scan(root);
assertNoViolations();
console.log("phase-ah-legacy-cleanliness.test.js: PASS");

function scan(target) {
  if (!fs.existsSync(target)) return;
  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    for (const child of fs.readdirSync(target)) scan(path.join(target, child));
    return;
  }
  if (!/\.(js|jsx|ts|tsx)$/.test(target)) return;
  const text = fs.readFileSync(target, "utf8");
  for (const entry of forbidden) if (entry.pattern.test(text)) violations.push(`${entry.label}: ${path.relative(process.cwd(), target)}`);
  if (target === expectedCameraDefaults) return;
  for (const entry of productionCameraLocks) if (entry.pattern.test(text)) violations.push(`${entry.label}: ${path.relative(process.cwd(), target)}`);
}

function assertNoViolations() {
  if (violations.length) throw new Error(`Legacy cleanliness gate failed:\n${violations.join("\n")}`);
}
