import assert from "node:assert/strict";
import {
  createDEMSamplerEvidenceProvider,
  DEM_SAMPLER_EVIDENCE_BRIDGE_CONTRACT,
} from "../historical-gis/province/DEMSamplerEvidenceBridge.js";

let elevationCalls = 0;
function createSampler() {
  return {
    elevation(lon, lat) {
      elevationCalls += 1;
      const dx = Math.round((lon - 30) * 3600);
      const dy = Math.round((lat - 40) * 3600);
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) return null;
      return 100 + dx * 20 + dy * 30;
    },
  };
}

const provider = createDEMSamplerEvidenceProvider(createSampler());
const first = provider.sample({ lon: 30, lat: 40 });
const firstCallCount = elevationCalls;
const second = provider.sample({ lon: 30, lat: 40 });

assert.equal(first.valid, true);
assert.equal(first.authoritative, false);
assert.equal(first.source, "Copernicus DEM GLO-30");
assert.deepEqual(first, second);
assert.equal(elevationCalls, firstCallCount);
assert.deepEqual(provider.getCacheStats(), {
  enabled: true,
  entries: 1,
  sampleCount: 1,
  cacheHits: 1,
});
assert.ok(first.coverage >= 0 && first.coverage <= 1);
assert.ok(first.slopeNormalized >= 0 && first.slopeNormalized <= 1);
assert.ok(first.ridgeAffinity >= 0 && first.ridgeAffinity <= 1);
assert.ok(first.mountainResistance >= 0 && first.mountainResistance <= 1);

const uncached = createDEMSamplerEvidenceProvider(createSampler(), { cache: false });
const uncachedFirst = uncached.sample({ lon: 30, lat: 40 });
const uncachedSecond = uncached.sample({ lon: 30, lat: 40 });
assert.deepEqual(uncachedFirst, uncachedSecond);
assert.deepEqual(uncached.getCacheStats(), {
  enabled: false,
  entries: 0,
  sampleCount: 2,
  cacheHits: 0,
});

const invalid = createDEMSamplerEvidenceProvider({ elevation: () => null }).sample({ lon: 30, lat: 40 });
assert.equal(invalid.valid, false);
assert.equal(invalid.authoritative, false);
assert.equal(invalid.reliefMeters, null);

assert.equal(DEM_SAMPLER_EVIDENCE_BRIDGE_CONTRACT.authoritative, false);
assert.equal(DEM_SAMPLER_EVIDENCE_BRIDGE_CONTRACT.politicalAuthority, false);
assert.equal(DEM_SAMPLER_EVIDENCE_BRIDGE_CONTRACT.caching, "coordinate-keyed evidence cache by default");

console.log("DEM sampler evidence bridge cache contract passed.");
