import assert from "node:assert/strict";
import {
  T3_POINT_TYPES,
  T3_DETAIL_LEVELS,
  assertT3Candidate,
  buildAdaptiveReferencePointGraph,
  deriveSourceDetailProfile,
} from "../historical-gis/T3AdaptiveReferencePointEngine.js";

const medium = deriveSourceDetailProfile({ scaleDenominator: 200_000, pixelSizeMeters: 10 });
assert.equal(medium.detailLevel, T3_DETAIL_LEVELS.MEDIUM);

const explicit = deriveSourceDetailProfile({ detailLevel: T3_DETAIL_LEVELS.VERY_HIGH });
assert.equal(explicit.detailLevel, T3_DETAIL_LEVELS.VERY_HIGH);
assert.equal(explicit.derivation, "explicit");

const graph = buildAdaptiveReferencePointGraph({
  source: {
    id: "pilot-bursa-nicaea-reference",
    date: "1326",
    scaleDenominator: 100_000,
    pixelSizeMeters: 5,
  },
  features: [
    {
      id: "bursa_nicaea_candidate",
      class: "POLITICAL",
      sourceWeight: 0.9,
      geometry: [
        [29.05, 40.20],
        [29.15, 40.18],
        [29.25, 40.10],
        [29.40, 40.08],
        [29.55, 40.12],
        [29.70, 40.20],
        [29.82, 40.30],
        [29.95, 40.42],
        [30.10, 40.50],
      ],
      mandatoryIndices: [4],
      constraintIndices: [7],
    },
  ],
  anchors: [
    {
      id: "anchor_bursa_nicaea_midpoint",
      featureId: "bursa_nicaea_candidate",
      sourceIndex: 4,
      point: [29.55, 40.12],
      confidence: "MEDIUM",
    },
  ],
  constraints: [
    {
      id: "constraint_sangarius_corridor",
      featureId: "bursa_nicaea_candidate",
      sourceIndex: 7,
      point: [29.95, 40.42],
      kind: "ROUTE_CORRIDOR",
      confidence: "MEDIUM",
    },
  ],
});

assertT3Candidate(graph);
assert.equal(graph.phase, "T3-C");
assert.equal(graph.engine, "EARG/ARPG");
assert.equal(graph.authoritative, false);
assert.equal(graph.source.detailLevel, T3_DETAIL_LEVELS.HIGH);
assert.equal(graph.features.length, 1);
assert.equal(graph.features[0].points.some((item) => item.pointType === T3_POINT_TYPES.MANDATORY), true);
assert.equal(graph.features[0].points.some((item) => item.pointType === T3_POINT_TYPES.CONSTRAINT), true);
assert.equal(graph.features[0].points.some((item) => item.locked === true), true);

const output = JSON.stringify(graph);
assert.match(output, /"politicalTruth":"not inferred from geometry"/);
assert.match(output, /"canonicalTruth":"not produced by this engine"/);

console.log("T3 adaptive reference point engine: PASS");
