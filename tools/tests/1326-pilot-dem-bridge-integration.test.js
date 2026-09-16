import assert from "node:assert/strict";
import test from "node:test";

import { build1326CandidateEvidencePilot } from "../historical-gis/province/1326CandidateEvidencePilot.js";

const t3Result = {
  authoritative: false,
  scenarioDate: "1326-04-07",
  references: [{ id: "bursa-anchor", lon: 35, lat: 40, importance: 1, locked: true }],
};

const adjacencyGraph = {
  authoritative: false,
  nodes: [
    { id: "bursa", lon: 35, lat: 40 },
    { id: "nicaea", lon: 29.72, lat: 40.43 },
  ],
  edges: [{ id: "bursa-nicaea", source: "bursa", target: "nicaea" }],
};

function makeSampler() {
  return {
    elevation(lon, lat) {
      const dx = lon - 35;
      const dy = lat - 40;
      return 200 + 600 * Math.max(0, 1 - Math.abs(dx) * 20 - Math.abs(dy) * 20);
    },
  };
}

test("1326 pilot can consume a P6.2-compatible DEM sampler without becoming authoritative", () => {
  const result = build1326CandidateEvidencePilot({
    t3Result,
    adjacencyGraph,
    demSampler: makeSampler(),
  });

  assert.equal(result.scenarioDate, "1326-04-07");
  assert.equal(result.authoritative, false);
  assert.equal(result.terrainSource, "P6.2-CopernicusDemCostSampler");
  assert.equal(result.diagnostics.demSamplerConnected, true);
  assert.equal(result.layers.t3E.authoritative, false);
  assert.ok(result.layers.p61EdgeEvidence.length === 1);
});
