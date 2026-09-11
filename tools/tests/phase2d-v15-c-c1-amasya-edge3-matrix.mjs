import assert from "node:assert/strict";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import * as authority from "../historical-gis/recovery/physical-land-authority.mjs";

const START = [34.828390856782086, 41.01264370368176];
const END = [35.31959064327484, 41.25286549707603];
const SAMPLE_COUNT = 256;
const { pointInPolygon, isLakeInteriorPoint, nearestLakeBoundaryPoint, isPhysicalLandPoint, isPhysicalGeometryBoundaryPoint, isFinalPhysicalGeometryBoundaryPoint, resolvePhysicalGeometryBoundaryPoint } = authority;

function lakeBoundary(point, lake) {
  const rings = lake.rings ?? [lake.coordinates];
  return rings.some((ring) => ring?.some((a, i) => authority.pointOnSegment(point, a, ring[(i + 1) % ring.length])));
}
function lakeIds(point) {
  return ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.filter((lake) => {
    const rings = lake.rings ?? [lake.coordinates];
    return rings.length && pointInPolygon(point, rings[0]) && !rings.slice(1).some((ring) => pointInPolygon(point, ring));
  }).map((lake) => lake.id ?? lake.name ?? null);
}
function pointAt(t) { return [START[0] + (END[0] - START[0]) * t, START[1] + (END[1] - START[1]) * t]; }
function dist(a,b) { return a && b ? Math.hypot(a[0]-b[0],a[1]-b[1]) : null; }

const samples = [];
for (let i = 0; i <= SAMPLE_COUNT; i += 1) {
  const fraction = i / SAMPLE_COUNT;
  const point = pointAt(fraction);
  const shoreline = nearestLakeBoundaryPoint(point);
  const resolver = resolvePhysicalGeometryBoundaryPoint(point);
  samples.push({ fraction, point, lakeInterior: isLakeInteriorPoint(point), lakeIds: lakeIds(point), lakeBoundary: ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => lakeBoundary(point, lake)), physicalLand: isPhysicalLandPoint(point), geometryBoundary: isPhysicalGeometryBoundaryPoint(point), finalBoundary: isFinalPhysicalGeometryBoundaryPoint(point), nearestLakeBoundary: shoreline.point, nearestLakeBoundaryDistance: shoreline.distance, resolver, resolverDistance: dist(point,resolver) });
}

const firstInvalid = samples.find((s) => !s.physicalLand);
const interiorSamples = samples.filter((s) => s.lakeInterior);
const resolverFailures = samples.filter((s) => !s.physicalLand && !s.resolver);
const shorelineResolutions = samples.filter((s) => !s.physicalLand && s.resolver && s.nearestLakeBoundary && dist(s.resolver,s.nearestLakeBoundary) <= 1e-9);

console.log(JSON.stringify({ phase: "C1 — Pontus-Amasya Edge 3 authority decision matrix", edge: { start: START, end: END }, sampleCount: SAMPLE_COUNT, firstInvalid, counts: { samples: samples.length, interiorSamples: interiorSamples.length, resolverFailures: resolverFailures.length, shorelineResolutions: shorelineResolutions.length }, endpointStart: samples[0], endpointEnd: samples.at(-1), samples }, null, 2));
