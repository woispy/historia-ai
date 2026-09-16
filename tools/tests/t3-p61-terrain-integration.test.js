import test from "node:test";
import assert from "node:assert/strict";
import { buildAdaptiveReferencePointGraph } from "../historical-gis/T3AdaptiveReferencePointEngine.js";
import { buildProvinceAdjacencyGraph, validateProvinceAdjacencyGraph } from "../historical-gis/province/ProvinceAdjacencyGraph.js";
import { associateT3ReferencePointsWithP61 } from "../historical-gis/province/T3P61ReferenceAssociation.js";
import { associateT3ReferencePointsWithTerrain } from "../historical-gis/province/T3TerrainConstraintAdapter.js";

test("T3-D associates reference points with P6.1 candidate nodes/edges without authority promotion", () => {
  const t3 = buildAdaptiveReferencePointGraph({
    source: { id: "synthetic-1326", detailLevel: "medium" },
    features: [{
      id: "sangarius",
      class: "RIVER",
      geometry: [[29.0, 40.0], [29.5, 40.1], [30.0, 40.3], [30.5, 40.4], [31.0, 40.6]],
    }],
  });
  const graph = buildProvinceAdjacencyGraph([
    { id: "bursa", identity: { name: "Bursa" }, position: { lon: 29.06, lat: 40.19 }, historical: { confidence: { overall: 1 } } },
    { id: "nicaea", identity: { name: "Nicaea" }, position: { lon: 29.72, lat: 40.43 }, historical: { confidence: { overall: 1 } } },
    { id: "nicomedia", identity: { name: "Nicomedia" }, position: { lon: 29.92, lat: 40.77 }, historical: { confidence: { overall: 1 } } },
  ]);
  assert.deepEqual(validateProvinceAdjacencyGraph(graph).valid, true);
  const association = associateT3ReferencePointsWithP61(t3, graph, { radiusKm: 100 });
  assert.equal(association.authoritative, false);
  assert.equal(association.phase, "T3-D");
  assert.ok(association.diagnostics.associatedPointCount > 0);
  assert.ok(association.edgeAssociations.every((edge) => edge.candidateOnly === true));
});

test("T3-E attaches terrain evidence without turning terrain into political authority", () => {
  const t3 = buildAdaptiveReferencePointGraph({
    source: { id: "synthetic-1326", detailLevel: "low" },
    features: [{
      id: "mountain-ridge",
      class: "RIDGE",
      geometry: [[29.0, 40.0], [29.2, 40.2], [29.4, 40.1], [29.6, 40.3]],
    }],
  });
  const result = associateT3ReferencePointsWithTerrain(t3, () => [
    { slopeDegrees: 28, ridgeAffinity: 0.9, mountainResistance: 0.85 },
    { slopeDegrees: 32, ridgeAffinity: 0.95, mountainResistance: 0.9 },
  ]);
  assert.equal(result.authoritative, false);
  assert.equal(result.phase, "T3-E");
  assert.equal(result.diagnostics.scoredPointCount, result.diagnostics.referencePointCount);
  assert.ok(result.associations.every((item) => item.physicalSupport !== null));
});

test("terrain evidence rejects invalid numeric inputs instead of silently converting them to zero", async () => {
  const { normalizeTerrainEvidence } = await import("../historical-gis/province/TerrainEvidenceAdapter.js");
  const result = normalizeTerrainEvidence({ slopeDegrees: "not-a-number", mountainResistance: "invalid" });
  assert.ok(result.channels.slope >= 0 && result.channels.slope <= 1);
  assert.ok(result.channels.mountain >= 0 && result.channels.mountain <= 1);
});
