import fs from "node:fs";
import path from "node:path";

const roots = [path.resolve("src/map/rendering"), path.resolve("src/map/runtime")];
const forbidden = [
  { label: "temporary terrainRegions", pattern: /\bterrainRegions\b/ },
  { label: "temporary mountainRanges", pattern: /\bmountainRanges\b/ },
];

// Camera defaults inside renderers are valid state. The legacy regression gate
// only checks the MapEngineV2 integration boundary for an explicit zero range.
const enginePath = path.resolve("src/map/rendering/MapEngineV2.jsx");
const engineCameraLocks = [
  { label: "MapEngineV2 production pitch lock", pattern: /pitchMin\s*:\s*0\b[\s\S]{0,120}?pitchMax\s*:\s*0\b/ },
  { label: "MapEngineV2 production yaw lock", pattern: /yawMin\s*:\s*0\b[\s\S]{0,120}?yawMax\s*:\s*0\b/ },
];

const violations = [];
for (const root of roots) scan(root);
scanEngineCameraLocks();
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
}

function scanEngineCameraLocks() {
  if (!fs.existsSync(enginePath)) return;
  const text = fs.readFileSync(enginePath, "utf8");
  for (const entry of engineCameraLocks) if (entry.pattern.test(text)) violations.push(`${entry.label}: ${path.relative(process.cwd(), enginePath)}`);
}

function assertNoViolations() {
  if (violations.length) throw new Error(`Legacy cleanliness gate failed:\n${violations.join("\n")}`);
}
