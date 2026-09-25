import fs from "node:fs/promises";
import path from "node:path";

const SCENARIO_DATE = "1326-04-07";
const SCENARIO_YEAR = 1326;
const SOURCE_ID = "cliopatria-v0.2.0";
const EARTH_RADIUS_KM = 6371.0088;

function readArg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i < 0 ? fallback : process.argv[i + 1] ?? fallback;
}

function requireArg(name) {
  const value = readArg(name);
  if (!value) throw new Error(`${name} <path> is required.`);
  return path.resolve(process.cwd(), value);
}

function assertCandidateReport(report) {
  if (report?.scenarioDate !== SCENARIO_DATE) throw new Error("Candidate scenario date mismatch.");
  if (report?.source?.sourceId !== SOURCE_ID) throw new Error("Candidate source identity mismatch.");
  if (!Array.isArray(report?.candidates)) throw new Error("Candidate report must contain candidates[].");
}

function assertAnchorReport(report) {
  if (report?.scenarioDate !== SCENARIO_DATE) throw new Error("Anchor scenario date mismatch.");
  if (!Array.isArray(report?.anchors) || report.anchors.length === 0) {
    throw new Error("Anchor report must contain a non-empty anchors[] array.");
  }
  for (const anchor of report.anchors) {
    if (!anchor?.id || !Array.isArray(anchor.coordinates) || anchor.coordinates.length !== 2) {
      throw new Error("Each anchor requires id and [longitude, latitude] coordinates.");
    }
    const [longitude, latitude] = anchor.coordinates;
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      throw new Error(`Anchor ${anchor.id} has non-finite coordinates.`);
    }
    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      throw new Error(`Anchor ${anchor.id} has out-of-range coordinates.`);
    }
  }
}

function walkCoordinates(value, visit) {
  if (!Array.isArray(value)) return;
  if (value.length >= 2 && Number.isFinite(value[0]) && Number.isFinite(value[1])) {
    visit(value[0], value[1]);
    return;
  }
  for (const child of value) walkCoordinates(child, visit);
}

function geometryBbox(geometry) {
  const bbox = [Infinity, Infinity, -Infinity, -Infinity];
  let count = 0;
  walkCoordinates(geometry?.coordinates, (longitude, latitude) => {
    bbox[0] = Math.min(bbox[0], longitude);
    bbox[1] = Math.min(bbox[1], latitude);
    bbox[2] = Math.max(bbox[2], longitude);
    bbox[3] = Math.max(bbox[3], latitude);
    count += 1;
  });
  return count === 0 ? null : bbox;
}

function bboxCenter(bbox) {
  return [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
}

function haversineKm(a, b) {
  const toRad = value => value * Math.PI / 180;
  const [lon1, lat1] = a.map(toRad);
  const [lon2, lat2] = b.map(toRad);
  const dLon = lon2 - lon1;
  const dLat = lat2 - lat1;
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function expandBboxAroundPoint([longitude, latitude], radiusKm) {
  const latRadius = radiusKm / 111.32;
  const cosLat = Math.max(Math.cos(latitude * Math.PI / 180), 0.2);
  const lonRadius = radiusKm / (111.32 * cosLat);
  return [
    longitude - lonRadius,
    latitude - latRadius,
    longitude + lonRadius,
    latitude + latRadius,
  ];
}

function bboxIntersects(a, b) {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

function distanceToBbox(point, bbox) {
  const longitude = Math.max(bbox[0], Math.min(point[0], bbox[2]));
  const latitude = Math.max(bbox[1], Math.min(point[1], bbox[3]));
  return haversineKm(point, [longitude, latitude]);
}

const candidatePath = requireArg("--input");
const anchorPath = requireArg("--anchors");
const outputPath = path.resolve(
  process.cwd(),
  readArg("--output", "data/build/gis/1326/cliopatria-candidate-surface-screening.json"),
);
const radiusKm = Number(readArg("--radius-km", "120"));
if (!Number.isFinite(radiusKm) || radiusKm <= 0) throw new Error("--radius-km must be a positive number.");

const candidates = JSON.parse(await fs.readFile(candidatePath, "utf8"));
const anchors = JSON.parse(await fs.readFile(anchorPath, "utf8"));
assertCandidateReport(candidates);
assertAnchorReport(anchors);

const screened = [];
const rejected = [];
for (const candidate of candidates.candidates) {
  const bbox = geometryBbox(candidate.geometry);
  if (!bbox) {
    rejected.push({ sourceFeatureIndex: candidate.sourceFeatureIndex, reason: "missing-coordinate-geometry" });
    continue;
  }

  const center = bboxCenter(bbox);
  const anchorHits = [];
  for (const anchor of anchors.anchors) {
    const influence = expandBboxAroundPoint(anchor.coordinates, radiusKm);
    if (!bboxIntersects(bbox, influence)) continue;
    anchorHits.push({
      anchorId: anchor.id,
      role: anchor.role ?? null,
      bboxDistanceKm: Number(distanceToBbox(anchor.coordinates, bbox).toFixed(3)),
    });
  }

  if (anchorHits.length === 0) {
    rejected.push({ sourceFeatureIndex: candidate.sourceFeatureIndex, reason: "outside-anchor-screening-window" });
    continue;
  }

  screened.push({
    sourceFeatureIndex: candidate.sourceFeatureIndex,
    sourceFeatureId: candidate.sourceFeatureId,
    name: candidate.name,
    fromYear: candidate.fromYear,
    toYear: candidate.toYear,
    type: candidate.type,
    wikidataId: candidate.wikidataId,
    seshatId: candidate.seshatId,
    geometryAuthorityStatus: candidate.geometryAuthorityStatus,
    // Preserve the exact source geometry in the evidence packet. This is not a reviewed
    // geometry and must never be mutated in-place; downstream reconciliation works on a
    // separate reviewedGeometry field.
    geometry: candidate.geometry,
    geometryBbox: bbox,
    geometryBboxCenter: center,
    anchorHits,
    screeningOnly: true,
    promotion: "BLOCKED",
  });
}

screened.sort((a, b) => {
  const da = Math.min(...a.anchorHits.map(hit => hit.bboxDistanceKm));
  const db = Math.min(...b.anchorHits.map(hit => hit.bboxDistanceKm));
  return da - db || a.sourceFeatureIndex - b.sourceFeatureIndex;
});

const report = {
  schemaVersion: 1,
  kind: "historical-1326-political-candidate-surface-screening",
  scenarioDate: SCENARIO_DATE,
  scenarioYear: SCENARIO_YEAR,
  source: candidates.source,
  anchorSource: {
    path: anchorPath.replace(/\\/g, "/"),
    anchorCount: anchors.anchors.length,
  },
  screening: {
    method: "candidate-geometry-bbox intersects anchor influence bbox",
    radiusKm,
    purpose: "narrow candidate evidence for manual geometry reconciliation",
    notGeometryAuthority: true,
    noSyntheticGeometry: true,
  },
  counts: {
    inputCandidates: candidates.candidates.length,
    screenedCandidates: screened.length,
    rejectedCandidates: rejected.length,
  },
  candidates: screened,
  rejected,
  promotion: "BLOCKED",
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\\n`, "utf8");
console.log(JSON.stringify({
  scenarioDate: SCENARIO_DATE,
  inputCandidates: candidates.candidates.length,
  screenedCandidates: screened.length,
  rejectedCandidates: rejected.length,
  outputPath,
  promotion: "BLOCKED",
}, null, 2));
