import assert from "node:assert/strict";
import test from "node:test";

import {
  createDEMSamplerEvidenceProvider,
  DEM_SAMPLER_EVIDENCE_BRIDGE_CONTRACT,
} from "../historical-gis/province/DEMSamplerEvidenceBridge.js";

function makeSampler(elevationAt) {
  return { elevation: elevationAt };
}

test("DEM sampler bridge produces bounded candidate physical evidence", () => {
  const sampler = makeSampler((lon, lat) => {
    const dx = lon - 35;
    const dy = lat - 40;
    return 200 + 500 * Math.max(0, 1 - Math.abs(dx) * 20 - Math.abs(dy) * 20);
  });
  const provider = createDEMSamplerEvidenceProvider(sampler);
  const result = provider.sample({ id: "bursa", lon: 35, lat: 40 });

  assert.equal(result.authoritative, false);
  assert.equal(result.valid, true);
  assert.ok(result.coverage > 0);
  assert.ok(result.slopeNormalized >= 0 && result.slopeNormalized <= 1);
  assert.ok(result.ridgeAffinity >= 0 && result.ridgeAffinity <= 1);
  assert.ok(result.mountainResistance >= 0 && result.mountainResistance <= 1);
  assert.ok(Number.isFinite(result.reliefMeters));
});

test("DEM sampler bridge preserves nodata as invalid evidence", () => {
  const sampler = makeSampler(() => null);
  const provider = createDEMSamplerEvidenceProvider(sampler);
  const result = provider.sample({ id: "nodata", lon: 35, lat: 40 });

  assert.equal(result.valid, false);
  assert.equal(result.authoritative, false);
  assert.equal(result.reliefMeters, null);
  assert.equal(result.ridgeProminenceMeters, null);
  assert.equal(result.coverage, 0);
});

test("DEM sampler bridge is deterministic for identical elevation access", () => {
  const sampler = makeSampler((lon, lat) => 1000 + (lon - 35) * 100 + (lat - 40) * 200);
  const provider = createDEMSamplerEvidenceProvider(sampler);
  const first = provider.sample({ lon: 35, lat: 40 });
  const second = provider.sample({ lon: 35, lat: 40 });

  assert.deepEqual(first, second);
});

test("DEM sampler bridge contract remains non-authoritative", () => {
  assert.equal(DEM_SAMPLER_EVIDENCE_BRIDGE_CONTRACT.schemaVersion, 1);
  assert.equal(DEM_SAMPLER_EVIDENCE_BRIDGE_CONTRACT.authoritative, false);
  assert.equal(DEM_SAMPLER_EVIDENCE_BRIDGE_CONTRACT.politicalAuthority, false);
});
