import assert from "node:assert/strict";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import * as authority from "../historical-gis/recovery/physical-land-authority.mjs";

const START = [34.828390856782086, 41.01264370368176];
const END = [35.31959064327484, 41.25286549707603];
const SAMPLE_COUNT = 256;
const { pointInPolygon, isLakeInteriorPoint, nearestLakeBoundaryPoint, nearestBoundaryLandPoint, isPhysicalLandPoint } = authority;

function pointAt(t) { return [START[0] + (END[0] - START[0]) * t, START[1] + (END[1] - START[1]) * t]; }
function dist(a, b) { return a && b ? Math.hypot(a[0] - b[0], a[1] - b[1]) : Infinity; }
function lakeRings(lake) { return lake.rings ?? [lake.coordinates]; }
function isLakeBoundaryPoint(point) {
  return ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => lakeRings(lake).some((ring) => ring?.some((vertex, index) => authority.pointOnSegment(point, vertex, ring[(index + 1) % ring.length]))));
}
function lakeIds(point) {
  return ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.filter((lake) => {
    const rings = lakeRings(lake);
    return rings.length > 0 && pointInPolygon(point, rings[0]) && !rings.slice(1).some((ring) => pointInPolygon(point, ring));
  }).map((lake) => lake.id ?? lake.name ?? null);
}

// C2-A model: for a lake-interior source point, authoritative lake shoreline wins
// over the enclosing land boundary, irrespective of which boundary is geometrically nearer.
function resolveC2A(point) {
  if (isPhysicalLandPoint(point)) return [...point];
  const shoreline = nearestLakeBoundaryPoint(point);
  if (isLakeInteriorPoint(point) && shoreline.point && shoreline.distance <= 0.75) return [...shoreline.point];
  const land = nearestBoundaryLandPoint(point);
  if (land.point && land.distance <= 0.75 && !isLakeInteriorPoint(point)) return [...land.point];
  return null;
}

// C2-B model: recovered authoritative lake shoreline is final-valid, but lake interior is not.
function isFinalC2B(point) {
  return isPhysicalLandPoint(point) || isLakeBoundaryPoint(point);
}

const samples = [];
for (let i = 0; i <= SAMPLE_COUNT; i += 1) {
  const fraction = i / SAMPLE_COUNT;
  const point = pointAt(fraction);
  const shoreline = nearestLakeBoundaryPoint(point);
  const land = nearestBoundaryLandPoint(point);
  const c2aResolver = resolveC2A(point);
  const c2aFinal = c2aResolver ? isFinalC2B(c2aResolver) : false;
  samples.push({ fraction, point, lakeInterior: isLakeInteriorPoint(point), lakeIds: lakeIds(point), physicalLand: isPhysicalLandPoint(point), shoreline: shoreline.point, shorelineDistance: shoreline.distance, landBoundary: land.point, landDistance: land.distance, c2aResolver, c2aFinal });
}

const aOnlyFailures = samples.filter((s) => !s.physicalLand && !s.c2aResolver);
const bOnlyFailures = samples.filter((s) => !s.physicalLand && s.lakeInterior && !isFinalC2B(s.point));
const abFailures = samples.filter((s) => !s.physicalLand && !s.c2aFinal);
const interior = samples.filter((s) => s.lakeInterior);
const recoveredShoreline = samples.filter((s) => !s.physicalLand && s.c2aResolver && dist(s.c2aResolver, s.shoreline) <= 1e-9);

assert.equal(samples.length, 257);
console.log(JSON.stringify({
  phase: "C2 — Pontus-Amasya Edge 3 controlled shoreline semantics",
  edge: { start: START, end: END },
  sampleCount: SAMPLE_COUNT,
  counts: {
    samples: samples.length,
    lakeInterior: interior.length,
    aOnlyResolverFailures: aOnlyFailures.length,
    bOnlyInteriorFinalFailures: bOnlyFailures.length,
    aPlusBFinalFailures: abFailures.length,
    recoveredShoreline: recoveredShoreline.length,
  },
  endpointStart: samples[0],
  endpointEnd: samples.at(-1),
  aOnlyFailures,
  bOnlyFailures,
  abFailures,
  samples,
}, null, 2));
