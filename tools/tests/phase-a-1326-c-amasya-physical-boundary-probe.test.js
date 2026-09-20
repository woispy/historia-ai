import fs from "node:fs/promises";
import path from "node:path";
import { isPhysicalLandPoint } from "../historical-gis/AnatoliaPhase2DGeometryBuilder.js";

const START = [34.828390856782086, 41.01264370368176];
const END = [35.31959064327484, 41.25286549707603];
const SAMPLE_STEP = 0.005;

function pointAt(t) {
  return [
    START[0] + (END[0] - START[0]) * t,
    START[1] + (END[1] - START[1]) * t,
  ];
}

const length = Math.hypot(END[0] - START[0], END[1] - START[1]);
const sampleCount = Math.max(1, Math.ceil(length / SAMPLE_STEP));
const samples = [];
for (let index = 0; index <= sampleCount; index += 1) {
  const t = index / sampleCount;
  const point = pointAt(t);
  samples.push({
    index,
    t,
    point,
    isPhysicalLandPoint: isPhysicalLandPoint(point),
  });
}

const firstFailure = samples.find((item) => !item.isPhysicalLandPoint) ?? null;
const report = {
  schemaVersion: 1,
  provinceId: "pontus-amasya",
  edgeIndex: 3,
  historicalForensicObservation: {
    start: { point: START, isPhysicalLandPoint: true },
    end: { point: END, isPhysicalLandPoint: false },
    status: "historical-observation-only",
  },
  currentAuthority: {
    implementation: "tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js",
    predicate: "isPhysicalLandPoint",
    boundaryRecoverySemantic: "NOT_EXPOSED",
    note: "This probe intentionally does not import the old forensic boundary-recovery module and does not classify geometry-boundary semantics that the current authority does not expose.",
  },
  sampling: {
    stepDegrees: SAMPLE_STEP,
    segmentLengthDegrees: length,
    sampleCount: samples.length,
  },
  currentResult: {
    start: samples[0],
    end: samples[samples.length - 1],
    physicalLandFailureCount: samples.filter((item) => !item.isPhysicalLandPoint).length,
    firstFailure,
    allSamplesPhysicalLand: samples.every((item) => item.isPhysicalLandPoint),
  },
  mutationPolicy: {
    geometryModified: false,
    repairApplied: false,
    authorityModified: false,
    canonicalMapbinModified: false,
  },
  decision: {
    currentPhysicalLandContract: "BOUND",
    boundaryRecoveryContract: "OPEN",
    automaticRepair: "FORBIDDEN",
    promotion: "BLOCKED",
  },
};

const output = process.argv[2] ?? "data/build/gis/1326/c-amasya-physical-boundary-probe.json";
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
