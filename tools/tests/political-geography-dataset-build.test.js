/**
 * Historia AI — Political Geography Dataset Build contract test.
 *
 * Proves the full authority pipeline end to end on the SYNTHETIC TEST-ONLY
 * proof-grid fixture: manifests + reviewed source -> shared-edge Arc registry
 * -> planar face assembly -> promoted dataset -> authority gate. Also proves
 * the fail-closed doors (ID mismatch, bbox violation, unreviewed source) and
 * that the real anatolia-1300 golden fixture stays blocked at ready=false.
 */

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPoliticalGeographyDataset } from "../historical-gis/province/PoliticalGeographyDatasetBuilder.js";
import { validatePoliticalGeographyAuthority } from "../historical-gis/province/PoliticalGeographyAuthorityValidator.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const fixtureDirectory = path.join(root, "tools/tests/fixtures/political-geography/proof-grid");
const goldenDirectory = path.join(root, "tools/tests/fixtures/political-geography/anatolia-1300");
const readFixture = async (directory, name) => JSON.parse(await readFile(path.join(directory, name), "utf8"));

const coverage = await readFixture(fixtureDirectory, "coverage.json");
const provinces = await readFixture(fixtureDirectory, "provinces.json");
const provenance = await readFixture(fixtureDirectory, "provenance.json");

const SOURCE_DOCUMENT = {
  sourceId: "synthetic-proof-grid-reviewed",
  sourceRef: "test-only fixture; not a historical authority",
  reviewStatus: "reviewed",
  provinces: [
    { provinceId: "proof-a", sourceRef: "test-only", confidence: 0.9, ring: [[0, 0], [1, 0], [1, 1], [0, 1]] },
    { provinceId: "proof-b", sourceRef: "test-only", confidence: 0.8, ring: [[1, 0], [2, 0], [2, 1], [1, 1]] },
    { provinceId: "proof-c", sourceRef: "test-only", confidence: 0.7, ring: [[2, 0], [3, 0], [3, 1], [2, 1]] },
  ],
};

let passed = 0;

assert.throws(
  () => buildPoliticalGeographyDataset({ coverage, provinces, provenance, sourceDocument: { ...SOURCE_DOCUMENT, reviewStatus: "draft" } }),
  /unreviewed sources are rejected by contract/,
  "unreviewed source must never reach promotion",
);
passed += 1;

assert.throws(
  () => buildPoliticalGeographyDataset({
    coverage,
    provinces,
    provenance,
    sourceDocument: { ...SOURCE_DOCUMENT, provinces: SOURCE_DOCUMENT.provinces.slice(0, 2) },
  }),
  /declared but missing from source: proof-c/,
  "source must exactly match the declared coverage manifest",
);
passed += 1;

const outsideBboxDocument = {
  ...SOURCE_DOCUMENT,
  provinces: SOURCE_DOCUMENT.provinces.map((province) => (
    province.provinceId === "proof-c"
      ? { ...province, ring: [[10, 0], [11, 0], [11, 1], [10, 1]] }
      : province
  )),
};
assert.throws(
  () => buildPoliticalGeographyDataset({ coverage, provinces, provenance, sourceDocument: outsideBboxDocument }),
  /outside declared coverage bbox: proof-c/,
  "province geometry outside the declared coverage bbox must be rejected",
);
passed += 1;

const { dataset, report } = buildPoliticalGeographyDataset({ coverage, provinces, provenance, sourceDocument: SOURCE_DOCUMENT });
assert.equal(report.coverageId, "proof-grid");
assert.equal(report.provinceCount, 3);
assert.equal(report.faceCount, 4, "three provinces plus the world face");
assert.equal(report.eulerCharacteristic, 2);
assert.equal(report.gateValid, true);
assert.equal(dataset.coverage.status, "ready");
assert.equal(dataset.coverage.promotion.ready, true);
assert.equal(dataset.provinces.geometryAuthority, "synthetic-proof-grid-reviewed");
for (const entry of dataset.provinces.provinces) {
  assert.equal(entry.geometryStatus, "authoritative");
  assert.equal(entry.reviewStatus, "reviewed");
  assert.ok(entry.geometry?.sourceId);
  assert.ok(Number.isFinite(entry.geometry?.confidence));
}
passed += 1;

const gate = validatePoliticalGeographyAuthority(dataset);
assert.equal(gate.valid, true, "promoted dataset must pass its own authority gate");
assert.equal(gate.provinceCount, 3);
passed += 1;

const goldenCoverage = await readFixture(goldenDirectory, "coverage.json");
const goldenProvinces = await readFixture(goldenDirectory, "provinces.json");
const goldenProvenance = await readFixture(goldenDirectory, "provenance.json");
const goldenGate = validatePoliticalGeographyAuthority({ coverage: goldenCoverage, provinces: goldenProvinces, provenance: goldenProvenance });
assert.equal(goldenGate.valid, false, "anatolia-1300 golden fixture must stay blocked at ready=false until a reviewed source exists");
assert.equal(goldenCoverage.status, "draft");
passed += 1;

console.log(`Political geography dataset build contract passed: ${passed} checks, proof-grid -> ${report.arcCount} arcs, ${report.faceCount} faces, Euler=${report.eulerCharacteristic}, gate valid; golden fixture remains blocked (ready=false).`);
