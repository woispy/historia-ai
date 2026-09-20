import assert from "node:assert/strict";
import { aggregateTerrainEvidence, evaluateTerrainEvidence } from "../historical-gis/province/TerrainEvidenceAdapter.js";

const mountain = evaluateTerrainEvidence({ slopeDegrees: 38, ridgeAffinity: 0.9, mountainResistance: 0.8 });
assert.ok(mountain.terrain.slope > 0.8);
assert.ok(mountain.terrain.ridge < 0.2);
assert.ok(mountain.terrain.mountain > 0.7);
assert.ok(mountain.totalCost >= 0);

const flat = evaluateTerrainEvidence({ slopeDegrees: 2, ridgeAffinity: 0.1, mountainResistance: 0.05 });
assert.ok(flat.terrain.slope < mountain.terrain.slope);
assert.ok(flat.terrain.mountain < mountain.terrain.mountain);

const aggregate = aggregateTerrainEvidence([
  { slopeDegrees: 2, ridgeAffinity: 0.1, mountainResistance: 0.05 },
  { slopeDegrees: 30, ridgeAffinity: 0.8, mountainResistance: 0.7 },
  { slopeDegrees: 10, ridgeAffinity: 0.4, mountainResistance: 0.2, riverPenalty: 0.5 },
]);
assert.equal(aggregate.sampleCount, 3);
assert.ok(aggregate.meanCost >= 0);
assert.ok(aggregate.averageChannels.river > 0);
console.log("Terrain evidence adapter contract passed.");
