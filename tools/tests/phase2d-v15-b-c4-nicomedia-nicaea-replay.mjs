import assert from "node:assert/strict";
import path from "node:path";
import {
  isPhysicalLandPoint,
  isPhysicalGeometryBoundaryPoint,
  resolvePhysicalGeometryBoundaryPoint,
} from "../historical-gis/recovery/physical-land-authority.mjs";
import { buildAnatoliaPhase2DAssets } from "../historical-gis/AnatoliaPhase2DGeometryBuilderV15.js";

const CANONICAL_ROOT = process.env.CANONICAL_ROOT;
assert.ok(CANONICAL_ROOT, "CANONICAL_ROOT is required");
const canonicalModule = await import(`file://${path.join(CANONICAL_ROOT, "tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js")}?b-c4=${process.pid}`);

const FAILURE_EDGES = [
  { caseId: "B-01", provinceId: "bithynia-nicomedia", start: [29.87953,40.72476], end: [29.88817,40.72993] },
  { caseId: "B-02", provinceId: "bithynia-nicomedia", start: [29.88817,40.72993], end: [29.91915,40.71851] },
  { caseId: "B-03", provinceId: "bithynia-nicomedia", start: [29.94879,40.71649], end: [29.96697,40.7418] },
  { caseId: "B-04", provinceId: "bithynia-nicomedia", start: [29.87953,40.72476], end: [29.85423,40.7623] },
  { caseId: "B-05", provinceId: "bithynia-nicomedia", start: [29.96697,40.7418], end: [29.94879,40.71649] },
  { caseId: "B-06", provinceId: "bithynia-nicomedia", start: [29.99643,40.72103], end: [30.01852,40.70688] },
  { caseId: "B-07", provinceId: "bithynia-nicomedia", start: [30.01852,40.70688], end: [29.99643,40.72103] },
  { caseId: "B-08", provinceId: "bithynia-nicomedia", start: [30.02342,40.70087], end: [30.06008,40.71516] },
  { caseId: "B-09", provinceId: "bithynia-nicaea", start: [29.91915,40.71851], end: [29.88817,40.72993] },
];
const SAMPLE_COUNT = 256;

function pointAt(edge, fraction) {
  return [edge.start[0] + (edge.end[0] - edge.start[0]) * fraction, edge.start[1] + (edge.end[1] - edge.start[1]) * fraction];
}

function replayEdge(edge) {
  const samples = [];
  for (let index = 0; index <= SAMPLE_COUNT; index += 1) {
    const fraction = index / SAMPLE_COUNT;
    const point = pointAt(edge, fraction);
    const canonicalLand = canonicalModule.isPhysicalLandPoint(point);
    const v15SupportBoundary = isPhysicalGeometryBoundaryPoint(point);
    const v15Land = isPhysicalLandPoint(point);
    const resolved = v15Land ? [...point] : resolvePhysicalGeometryBoundaryPoint(point);
    samples.push({ fraction, point, canonicalLand, v15SupportBoundary, v15Land, resolved });
  }
  const authorityDivergence = samples.filter((sample) => sample.canonicalLand !== sample.v15SupportBoundary);
  const finalAuthorityDivergence = samples.filter((sample) => sample.canonicalLand !== Boolean(sample.resolved));
  const unresolved = samples.filter((sample) => !sample.v15Land && !sample.resolved);
  return {
    ...edge,
    sampleCount: samples.length,
    authorityDivergenceCount: authorityDivergence.length,
    finalAuthorityDivergenceCount: finalAuthorityDivergence.length,
    unresolvedCount: unresolved.length,
    firstAuthorityDivergence: authorityDivergence[0] ?? null,
    firstFinalAuthorityDivergence: finalAuthorityDivergence[0] ?? null,
    lastUnresolved: unresolved.at(-1) ?? null,
  };
}

const matrix = FAILURE_EDGES.map(replayEdge);
const authorityDivergenceCases = matrix.filter((item) => item.authorityDivergenceCount > 0);
const finalDivergenceCases = matrix.filter((item) => item.finalAuthorityDivergenceCount > 0);
const unresolvedCases = matrix.filter((item) => item.unresolvedCount > 0);

let builderStatus = "success";
let builderError = null;
try {
  const assets = buildAnatoliaPhase2DAssets();
  assert.ok(assets.provinces.length > 0);
} catch (error) {
  builderStatus = "failed";
  builderError = String(error?.message ?? error);
}

console.log(JSON.stringify({
  phase: "B-C4 — Nicomedia/Nicaea production-equivalent authority replay",
  sampleCount: SAMPLE_COUNT,
  edgeCount: FAILURE_EDGES.length,
  counts: {
    authorityDivergenceCases: authorityDivergenceCases.length,
    finalDivergenceCases: finalDivergenceCases.length,
    unresolvedCases: unresolvedCases.length,
    allEdgesResolvedByV15Authority: unresolvedCases.length === 0,
  },
  builderStatus,
  builderError,
  matrix,
}, null, 2));
