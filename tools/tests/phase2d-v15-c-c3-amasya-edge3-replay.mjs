import assert from "node:assert/strict";
import { isLakeInteriorPoint, isPhysicalLandPoint, isFinalPhysicalGeometryBoundaryPoint, nearestLakeBoundaryPoint, resolvePhysicalGeometryBoundaryPoint } from "../historical-gis/recovery/physical-land-authority.mjs";
import { buildAnatoliaPhase2DAssets } from "../historical-gis/AnatoliaPhase2DGeometryBuilderV15.js";

const START = [34.828390856782086, 41.01264370368176];
const END = [35.31959064327484, 41.25286549707603];
const SAMPLE_COUNT = 256;

function pointAt(t) {
  return [START[0] + (END[0] - START[0]) * t, START[1] + (END[1] - START[1]) * t];
}

function distance(a, b) {
  return a && b ? Math.hypot(a[0] - b[0], a[1] - b[1]) : Infinity;
}

const samples = [];
for (let index = 0; index <= SAMPLE_COUNT; index += 1) {
  const fraction = index / SAMPLE_COUNT;
  const point = pointAt(fraction);
  const shoreline = nearestLakeBoundaryPoint(point);
  const resolved = isPhysicalLandPoint(point) ? [...point] : resolvePhysicalGeometryBoundaryPoint(point);
  samples.push({
    fraction,
    point,
    lakeInterior: isLakeInteriorPoint(point),
    physicalLand: isPhysicalLandPoint(point),
    shoreline: shoreline.point,
    shorelineDistance: shoreline.distance,
    resolved,
    resolvedIsFinal: resolved ? isFinalPhysicalGeometryBoundaryPoint(resolved) : false,
  });
}

const invalid = samples.filter((sample) => !sample.physicalLand && (!sample.resolved || !sample.resolvedIsFinal));
const interior = samples.filter((sample) => sample.lakeInterior);
const shorelineRecoveries = samples.filter((sample) => sample.lakeInterior && sample.resolved && distance(sample.resolved, sample.shoreline) <= 1e-9);

assert.equal(samples.length, 257);
assert.equal(interior.length, 9);
assert.equal(invalid.length, 0);
assert.equal(shorelineRecoveries.length, 9);

let builderStatus = "success";
let builderError = null;
try {
  const assets = buildAnatoliaPhase2DAssets();
  assert.ok(assets.provinces.length > 0);
} catch (error) {
  builderStatus = "failed";
  builderError = String(error?.message ?? error);
}

// C3 must eliminate the previously proven Pontus-Amasya Edge 3 failure.
// A later V15 failure may still exist elsewhere; if so it is a separate blocker.
if (builderStatus === "failed") assert.ok(!builderError.includes("pontus-amasya"), builderError);

console.log(JSON.stringify({
  phase: "C3 — Pontus-Amasya Edge 3 production-equivalent replay",
  edge: { start: START, end: END },
  sampleCount: SAMPLE_COUNT,
  counts: {
    samples: samples.length,
    lakeInterior: interior.length,
    invalidAfterC3: invalid.length,
    shorelineRecoveries: shorelineRecoveries.length,
  },
  builderStatus,
  builderError,
  endpointStart: samples[0],
  endpointEnd: samples.at(-1),
  interiorSamples: interior,
}, null, 2));
