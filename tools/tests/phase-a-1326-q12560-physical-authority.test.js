import fs from "node:fs/promises";
import path from "node:path";
import { isPhysicalLandPoint } from "../historical-gis/AnatoliaPhase2DGeometryBuilder.js";

const INPUT = process.argv[2] ?? "data/build/gis/1326/cliopatria-1326-candidates.json";
const OUTPUT = process.argv[3] ?? "data/build/gis/1326/ottoman-q12560-physical-authority.json";
const EDGE_SAMPLE_STEP = 0.03;

function distance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

const candidates = JSON.parse(await fs.readFile(INPUT, "utf8"));
const candidate = (candidates.candidates ?? candidates.records ?? []).find(
  (item) => item.wikidataId === "Q12560" || item?.identity?.wikidataId === "Q12560",
);

if (!candidate) throw new Error("Q12560 candidate was not found.");
const ring = candidate.geometry?.coordinates?.[0] ?? candidate.geometry?.[0] ?? candidate.polygon;
if (!Array.isArray(ring) || ring.length < 4) throw new Error("Q12560 candidate does not expose a polygon ring.");

const vertices = ring.slice(0, -1).map(([x, y]) => [Number(x), Number(y)]);
const vertexResults = vertices.map((point, index) => ({
  index,
  point,
  isPhysicalLandPoint: isPhysicalLandPoint(point),
}));

const edgeResults = [];
for (let edgeIndex = 0; edgeIndex < vertices.length; edgeIndex += 1) {
  const start = vertices[edgeIndex];
  const end = vertices[(edgeIndex + 1) % vertices.length];
  const length = distance(start, end);
  const samples = Math.max(1, Math.ceil(length / EDGE_SAMPLE_STEP));
  const failures = [];
  for (let sample = 1; sample < samples; sample += 1) {
    const fraction = sample / samples;
    const point = [
      start[0] + (end[0] - start[0]) * fraction,
      start[1] + (end[1] - start[1]) * fraction,
    ];
    if (!isPhysicalLandPoint(point)) failures.push({ sampleIndex: sample, sampleCount: samples, point });
  }
  edgeResults.push({
    edgeIndex,
    start,
    end,
    sampleCount: Math.max(0, samples - 1),
    physicalFailureCount: failures.length,
    failures: failures.slice(0, 20),
  });
}

const vertexFailures = vertexResults.filter((result) => !result.isPhysicalLandPoint);
const edgeFailures = edgeResults.filter((result) => result.physicalFailureCount > 0);
const report = {
  schemaVersion: 1,
  scenarioDate: "1326-04-07",
  entityId: "ottoman-beylik",
  sourceIdentity: {
    sourceId: "cliopatria-v0.2.0",
    wikidataId: "Q12560",
    sourceFeatureIndex: candidate.sourceFeatureIndex ?? 6204,
  },
  authorityBinding: {
    implementation: "tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js",
    predicate: "isPhysicalLandPoint",
    atlas: "src/map/data/AnatoliaPhysicalAtlas.js",
    runtime: "src/map/data/AnatoliaPhysicalAtlasRuntime.js",
    semantics: "current production-side physical-land predicate; no older forensic recovery authority imported",
  },
  candidateIntegrity: {
    geometryType: "Polygon",
    ringVertexCountIncludingClosure: ring.length,
    distinctVertexCount: vertices.length,
    mutated: false,
  },
  sampling: {
    edgeSampleStepDegrees: EDGE_SAMPLE_STEP,
    vertexCount: vertexResults.length,
    edgeCount: edgeResults.length,
  },
  result: {
    vertexFailureCount: vertexFailures.length,
    edgeFailureCount: edgeFailures.length,
    allVerticesPhysicalLand: vertexFailures.length === 0,
    allSampledEdgesPhysicalLand: edgeFailures.length === 0,
    gate: vertexFailures.length === 0 && edgeFailures.length === 0 ? "PASS" : "FAIL",
  },
  vertexFailures,
  edgeFailures,
  promotion: "BLOCKED",
  canonicalMapbinMutation: false,
};

await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
await fs.writeFile(OUTPUT, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
