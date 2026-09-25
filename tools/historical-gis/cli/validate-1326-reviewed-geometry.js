import fs from "node:fs/promises";
import path from "node:path";

const SCENARIO_DATE = "1326-04-07";
const SOURCE_ID = "cliopatria-v0.2.0";

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i < 0 ? fallback : process.argv[i + 1] ?? fallback;
}
function required(name) {
  const value = arg(name);
  if (!value) throw new Error(`${name} <path> is required.`);
  return path.resolve(process.cwd(), value);
}
function isPosition(value) {
  return Array.isArray(value) && value.length >= 2
    && Number.isFinite(value[0]) && Number.isFinite(value[1]);
}
function ringIsValid(ring) {
  if (!Array.isArray(ring) || ring.length < 4) return false;
  if (!ring.every(isPosition)) return false;
  const first = ring[0];
  const last = ring[ring.length - 1];
  return first[0] === last[0] && first[1] === last[1];
}
function geometryIsValid(geometry) {
  if (!geometry || !["Polygon", "MultiPolygon"].includes(geometry.type)) return false;
  if (geometry.type === "Polygon") {
    return Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0
      && geometry.coordinates.every(ringIsValid);
  }
  return Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0
    && geometry.coordinates.every(polygon =>
      Array.isArray(polygon) && polygon.length > 0 && polygon.every(ringIsValid));
}

const inputPath = required("--input");
const report = JSON.parse(await fs.readFile(inputPath, "utf8"));

if (report?.kind !== "historical-1326-political-geometry-reconciliation-queue") {
  throw new Error("Unexpected reconciliation queue kind.");
}
if (report.scenarioDate !== SCENARIO_DATE) throw new Error("Scenario date mismatch.");
if (report.source?.sourceId !== SOURCE_ID) throw new Error("Source identity mismatch.");
if (report.authorityStatus !== "candidate-review-only") throw new Error("Queue is not candidate-review-only.");
if (report.promotion !== "BLOCKED") throw new Error("Queue promotion must remain blocked.");

const reviewed = [];
for (const item of report.reviewQueue ?? []) {
  if (item.reviewedGeometry !== null) {
    if (!geometryIsValid(item.reviewedGeometry)) {
      throw new Error(`Invalid reviewed geometry for ${item.reviewId}.`);
    }
    reviewed.push(item.reviewId);
  }
}

console.log(JSON.stringify({
  scenarioDate: SCENARIO_DATE,
  sourceId: SOURCE_ID,
  queueItems: (report.reviewQueue ?? []).length,
  reviewedGeometryItems: reviewed.length,
  reviewIdsWithGeometry: reviewed,
  status: "STRUCTURAL_ONLY",
  promotion: "BLOCKED",
  note: "Reviewed geometry is accepted only as externally supplied evidence; this validator does not generate or approve it."
}, null, 2));
