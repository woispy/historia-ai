import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const inputIndex = process.argv.indexOf("--input");
const inputPath = path.resolve(
  ROOT,
  inputIndex >= 0
    ? (process.argv[inputIndex + 1] ?? "data/gis/1326/anchor-candidate-registry.json")
    : (process.argv[2] ?? "data/gis/1326/anchor-candidate-registry.json"),
);
const report = JSON.parse(await fs.readFile(inputPath, "utf8"));

const SCENARIO_DATE = "1326-04-07";
const AUTHORITY = "research-candidate-registry";
const ANCHOR_AUTHORITY = "candidate-evidence-only";
const SOURCE_POLICY = "historical-evidence-plus-independent-coordinate";

const fail = message => { throw new Error(message); };
const finiteNumber = value => typeof value === "number" && Number.isFinite(value);

if (report.schemaVersion !== 1) fail("Anchor candidate registry schemaVersion must be 1.");
if (report.scenarioDate !== SCENARIO_DATE) fail("Anchor candidate registry scenario date must be 1326-04-07.");
if (report.authorityStatus !== AUTHORITY) fail("Anchor candidate registry authorityStatus must remain research-candidate-registry.");
if (report.policy?.sourcePolicy !== SOURCE_POLICY) fail("Anchor candidate registry sourcePolicy mismatch.");

for (const key of ["geometryGeneration", "controllerInference", "canonicalPromotion"]) {
  if (report.policy?.[key] !== false) fail(`Anchor candidate registry policy ${key} must be false.`);
}

if (!Array.isArray(report.anchors) || report.anchors.length === 0) fail("anchors[] is required and must not be empty.");

const ids = new Set();
for (const anchor of report.anchors) {
  if (!anchor || typeof anchor !== "object") fail("Anchor record must be an object.");
  if (!/^1326-[a-z0-9-]+$/.test(anchor.anchorId ?? "")) fail(`Invalid anchorId: ${anchor.anchorId}`);
  if (ids.has(anchor.anchorId)) fail(`Duplicate anchorId: ${anchor.anchorId}`);
  ids.add(anchor.anchorId);

  if (anchor.authorityStatus !== ANCHOR_AUTHORITY) fail(`Anchor ${anchor.anchorId} must remain candidate-evidence-only.`);
  if (!["PRE_SCENARIO", "SCENARIO_WINDOW", "SCENARIO_RELEVANT"].includes(anchor.historicalApplicability)) {
    fail(`Invalid historicalApplicability: ${anchor.anchorId}`);
  }

  const confidence = anchor.confidence ?? {};
  const confidenceFields = ["existence", "coordinate", "temporalApplicability"];
  for (const field of confidenceFields) {
    if (!["HIGH", "MEDIUM", "LOW", "UNKNOWN"].includes(confidence[field])) {
      fail(`Invalid confidence.${field}: ${anchor.anchorId}`);
    }
  }
  if (!["HIGH", "MEDIUM", "LOW", "UNKNOWN", "NOT_ASSERTED"].includes(confidence.controller)) {
    fail(`Invalid confidence.controller: ${anchor.anchorId}`);
  }
  if (confidence.geometry !== "NOT_ASSERTED") {
    fail(`Candidate anchor geometry confidence must remain NOT_ASSERTED: ${anchor.anchorId}`);
  }
  if (!["SOURCE_REPORTED", "APPROXIMATE", "REFERENCE_POINT_ONLY"].includes(anchor.coordinatePrecision)) {
    fail(`Invalid coordinatePrecision: ${anchor.anchorId}`);
  }

  const coords = anchor.geometry?.coordinates;
  if (anchor.geometry?.type !== "Point" || !Array.isArray(coords) || coords.length !== 2 ||
      !finiteNumber(coords[0]) || !finiteNumber(coords[1]) ||
      coords[0] < -180 || coords[0] > 180 || coords[1] < -90 || coords[1] > 90) {
    fail(`Invalid WGS84 point geometry: ${anchor.anchorId}`);
  }

  if (!Array.isArray(anchor.historicalEvidenceRefs) || anchor.historicalEvidenceRefs.length < 1) {
    fail(`Historical evidence is required: ${anchor.anchorId}`);
  }
  if (!anchor.historicalEvidenceRefs.some(ref => ["PRE_SCENARIO", "SCENARIO_WINDOW"].includes(ref?.temporalClass))) {
    fail(`No usable pre/scenario temporal evidence: ${anchor.anchorId}`);
  }

  if (!Array.isArray(anchor.coordinateEvidenceRefs) || anchor.coordinateEvidenceRefs.length < 2) {
    fail(`At least two coordinate evidence references are required: ${anchor.anchorId}`);
  }
  const coordinateSourceTypes = new Set(anchor.coordinateEvidenceRefs.map(ref => ref?.sourceType));
  if (coordinateSourceTypes.size < 2) {
    fail(`Coordinate evidence must contain at least two independent source types: ${anchor.anchorId}`);
  }

  for (const ref of anchor.coordinateEvidenceRefs) {
    const c = ref?.coordinates;
    if (!Array.isArray(c) || c.length !== 2 || !finiteNumber(c[0]) || !finiteNumber(c[1]) ||
        c[0] < -180 || c[0] > 180 || c[1] < -90 || c[1] > 90) {
      fail(`Invalid coordinate evidence point: ${anchor.anchorId}`);
    }
  }

  if (!anchor.coordinateEvidenceRefs.some(ref =>
    ["CITY_POINT", "SETTLEMENT_POINT", "HISTORICAL_SITE"].includes(ref?.referencePoint)
  )) {
    fail(`Coordinate evidence must declare a physical reference point: ${anchor.anchorId}`);
  }

  const matchesSource = anchor.coordinateEvidenceRefs.some(ref =>
    Math.abs(ref.coordinates[0] - coords[0]) < 1e-12 &&
    Math.abs(ref.coordinates[1] - coords[1]) < 1e-12
  );
  if (!matchesSource) fail(`Selected geometry coordinate is not copied from a declared source point: ${anchor.anchorId}`);

  if (anchor.confidence?.geometry !== "NOT_ASSERTED") {
    fail(`Candidate anchor geometry confidence must remain NOT_ASSERTED: ${anchor.anchorId}`);
  }
}

console.log(JSON.stringify({
  scenarioDate: report.scenarioDate,
  anchors: report.anchors.length,
  independentCoordinatePairs: report.anchors.filter(a => new Set(a.coordinateEvidenceRefs.map(r => r.sourceType)).size >= 2).length,
  authorityStatus: report.authorityStatus,
  canonicalPromotion: report.policy.canonicalPromotion,
  status: "PASS"
}, null, 2));
