import assert from "node:assert/strict";
import {
  createDEMSamplerEvidenceProvider,
  DEM_SAMPLER_EVIDENCE_BRIDGE_CONTRACT,
} from "../historical-gis/province/DEMSamplerEvidenceBridge.js";

function createSampler() {
  return {
    elevation(lon, lat) {
      const dx = Math.round((lon - 30) * 3600);
      const dy = Math.round((lat - 40) * 3600);
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) return null;
      return 100 + dx * 20 + dy * 30;
    },
  };
}

const provider = createDEMSamplerEvidenceProvider(createSampler());
const first = provider.sample({ lon: 30, lat: 40 });
const second = provider.sample({ lon: 30, lat: 40 });

assert.equal(first.valid, true);
assert.equal(first.authoritative, false);
assert.equal(first.source, "Copernicus DEM GLO-30");
assert.deepEqual(first, second);
assert.ok(first.coverage >= 0 && first.coverage <= 1);
assert.ok(first.slopeNormalized >= 0 && first.slopeNormalized <= 1);
assert.ok(first.ridgeAffinity >= 0 && first.ridgeAffinity <= 1);
assert.ok(first.mountainResistance >= 0 && first.mountainResistance <= 1);

const invalid = createDEMSamplerEvidenceProvider({ elevation: () => null }).sample({ lon: 30, lat: 40 });
assert.equal(invalid.valid, false);
assert.equal(invalid.authoritative, false);
assert.equal(invalid.reliefMeters, null);

assert.equal(DEM_SAMPLER_EVIDENCE_BRIDGE_CONTRACT.authoritative, false);
assert.equal(DEM_SAMPLER_EVIDENCE_BRIDGE_CONTRACT.politicalAuthority, false);

console.log("DEM sampler evidence bridge contract passed.");
