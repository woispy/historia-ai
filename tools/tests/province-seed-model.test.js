import assert from "node:assert/strict";
import { assertProvinceSeed, validateProvinceSeed } from "../../src/map/province/ProvinceSeedModel.js";

const valid = {
  id: 1842,
  identity: { key: "nicaea", name: "Nicaea", type: "province" },
  position: { lon: 29.7199, lat: 40.4286 },
  historical: {
    validFrom: 1299,
    validTo: 1320,
    sourceIds: ["source-01"],
    confidence: { existence: 0.98, location: 0.97, extent: 0.72, boundary: 0.44, ownership: 0.91 },
    evidence: "cartographic",
  },
  hierarchy: { parentId: 17, level: "province", ancestry: [2, 17, 1842] },
  generation: { weight: 1.15, source: "historical", method: "historical-anchor" },
};

const result = validateProvinceSeed(valid);
assert.equal(result.valid, true, result.errors.join("; "));
assert.deepEqual(result.seed.historical.sourceIds, ["source-01"]);

const legacyConfidence = validateProvinceSeed({ ...valid, historical: { ...valid.historical, confidence: 0.8 } });
assert.equal(legacyConfidence.valid, true);
assert.deepEqual(legacyConfidence.seed.historical.confidence, {
  existence: 0.8, location: 0.8, extent: 0.8, boundary: 0.8, ownership: 0.8,
});

assert.equal(validateProvinceSeed({ ...valid, position: { lon: 180, lat: 0 } }).valid, false);
assert.equal(validateProvinceSeed({ ...valid, historical: { ...valid.historical, confidence: { ...valid.historical.confidence, boundary: 1.1 } } }).valid, false);
assert.equal(validateProvinceSeed({ ...valid, historical: { ...valid.historical, evidence: "primary", sourceIds: [] } }).valid, false);
assert.equal(validateProvinceSeed({ ...valid, generation: { ...valid.generation, weight: 0 } }).valid, false);

assert.doesNotThrow(() => assertProvinceSeed(valid));
console.log("Province seed model contracts passed.");
