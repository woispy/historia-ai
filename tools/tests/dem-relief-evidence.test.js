import test from "node:test";
import assert from "node:assert/strict";
import { extractDEMReliefEvidence } from "../historical-gis/province/DEMReliefEvidence.js";

test("DEM relief evidence produces bounded deterministic terrain signals", () => {
  const grid = {
    width: 5,
    height: 5,
    cellSizeMeters: 1000,
    elevations: [
      100, 100, 100, 100, 100,
      100, 300, 500, 300, 100,
      100, 500, 900, 500, 100,
      100, 300, 500, 300, 100,
      100, 100, 100, 100, 100,
    ],
  };
  const a = extractDEMReliefEvidence(grid);
  const b = extractDEMReliefEvidence(grid);
  assert.deepEqual(a, b);
  const center = a.samples[12];
  assert.equal(center.valid, true);
  assert.ok(center.reliefMeters > 0);
  assert.ok(center.ridgeAffinity >= 0 && center.ridgeAffinity <= 1);
  assert.ok(center.mountainResistance >= 0 && center.mountainResistance <= 1);
  assert.ok(a.samples.every((sample) => sample.valid === false || (
    sample.slopeNormalized >= 0 && sample.slopeNormalized <= 1
    && sample.ridgeAffinity >= 0 && sample.ridgeAffinity <= 1
    && sample.mountainResistance >= 0 && sample.mountainResistance <= 1
  )));
});

test("DEM relief evidence fails on malformed grids", () => {
  assert.throws(() => extractDEMReliefEvidence({ width: 2, height: 2, cellSizeMeters: 10, elevations: [1] }), /length/);
  assert.throws(() => extractDEMReliefEvidence({ width: 2, height: 2, cellSizeMeters: 0, elevations: [1, 1, 1, 1] }), /positive/);
});
