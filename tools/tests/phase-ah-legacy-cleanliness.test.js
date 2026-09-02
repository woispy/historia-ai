import fs from "node:fs";
import path from "node:path";

const roots = [path.resolve("src/map/rendering"), path.resolve("src/map/runtime")];
const forbidden = [
  { label: "temporary terrainRegions", pattern: /terrainRegions/ },
  { label: "temporary mountainRanges", pattern: /mountainRanges/ },
  { label: "zero-pitch production lock", pattern: /pitch\s*:\s*0\b/ },
  { label: "zero-yaw production lock", pattern: /yaw\s*:\s*0\b/ },
];

const violations = [];
for (const root of roots) scan(root);
assertNoViolations();
console.log("phase-ah-legacy-cleanliness.test.js: PASS");

function scan(target) {
  if (!fs.existsSync(target)) return;
  const stat = fs.statSync(target);
  if (stat.isDirectory()) for (const child of fs.readdirSync(target)) scan(path.join(target, child));
  else if (/\.(js|jsx|ts|tsx)$/.test(target)) {
    const text = fs.readFileSync(target, "utf8");
    for (const entry of forbidden) if (entry.pattern.test(text)) violations.push(`${entry.label}: ${path.relative(process.cwd(), target)}`);
  }
}
function assertNoViolations() { if (violations.length) throw new Error(`Legacy cleanliness gate failed:\n${violations.join("\n")}`); }
