/**
 * Historia AI — Province Source Studio contract test.
 *
 * Proves the P8 dataset editor core: template generation, per-province
 * fail-closed progress validation, and the promotion door — partial
 * progress is authoring state and can NEVER promote, while a fully
 * reviewed synthetic document flows end to end into the dataset builder.
 * Uses the SYNTHETIC TEST-ONLY proof-grid fixture.
 */

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSourceDocumentTemplate, validateSourceDocumentProgress } from "../historical-gis/province/ProvinceSourceStudio.js";
import { buildPoliticalGeographyDataset } from "../historical-gis/province/PoliticalGeographyDatasetBuilder.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const fixtureDirectory = path.join(root, "tools/tests/fixtures/political-geography/proof-grid");
const goldenDirectory = path.join(root, "tools/tests/fixtures/political-geography/anatolia-1300");
const readFixture = async (directory, name) => JSON.parse(await readFile(path.join(directory, name), "utf8"));

const coverage = await readFixture(fixtureDirectory, "coverage.json");
const provinces = await readFixture(fixtureDirectory, "provinces.json");
const provenance = await readFixture(fixtureDirectory, "provenance.json");

let passed = 0;

const template = createSourceDocumentTemplate({
  coverage,
  provinces,
  sourceId: "synthetic-proof-grid-editorial",
  sourceRef: "test-only editorial template",
});
assert.equal(template.provinces.length, 3);
assert.equal(template.coverageId, "proof-grid");
for (const entry of template.provinces) {
  assert.equal(entry.geometryStatus, "pending");
  assert.deepEqual(entry.ring, [], "template geometry must stay empty");
}
passed += 1;

const emptyProgress = validateSourceDocumentProgress({ coverage, provinces, sourceDocument: template });
assert.equal(emptyProgress.ready, 0);
assert.equal(emptyProgress.pending, 3);
assert.equal(emptyProgress.promotable, false, "an empty template must never be promotable");
passed += 1;

const REVIEWED_RINGS = {
  "proof-a": [[0, 0], [1, 0], [1, 1], [0, 1]],
  "proof-b": [[1, 0], [2, 0], [2, 1], [1, 1]],
  "proof-c": [[2, 0], [3, 0], [3, 1], [2, 1]],
};
function fillDocument(readyIds) {
  return {
    ...template,
    reviewStatus: "reviewed",
    provinces: template.provinces.map((entry) => (
      readyIds.includes(entry.provinceId)
        ? { ...entry, reviewStatus: "reviewed", confidence: 0.9, sourceRef: "test-only reviewed boundary", ring: REVIEWED_RINGS[entry.provinceId] }
        : entry
    )),
  };
}

const partial = validateSourceDocumentProgress({ coverage, provinces, sourceDocument: fillDocument(["proof-a"]) });
assert.equal(partial.ready, 1);
assert.equal(partial.pending, 2);
assert.equal(partial.promotable, false, "partial progress is authoring state and must never be promotable");
const pendingProvince = partial.provinces.find((item) => item.provinceId === "proof-b");
assert.equal(pendingProvince.ready, false);
assert.ok(pendingProvince.errors.some((message) => message.includes("reviewStatus")), "pending province must list its violations");
passed += 1;

assert.throws(
  () => buildPoliticalGeographyDataset({ coverage, provinces, provenance, sourceDocument: fillDocument(["proof-a", "proof-b"]) }),
  /province proof-c ring invalid: province ring needs at least three distinct points/,
  "a partial document (pending provinces with empty rings) must be rejected by the promotion gate (fail-closed)",
);
passed += 1;

const complete = validateSourceDocumentProgress({ coverage, provinces, sourceDocument: fillDocument(["proof-a", "proof-b", "proof-c"]) });
assert.equal(complete.ready, 3);
assert.equal(complete.pending, 0);
assert.equal(complete.promotable, true, "a fully reviewed document must be promotable");
passed += 1;

const { dataset, report } = buildPoliticalGeographyDataset({
  coverage,
  provinces,
  provenance,
  sourceDocument: fillDocument(["proof-a", "proof-b", "proof-c"]),
});
assert.equal(report.gateValid, true);
assert.equal(dataset.coverage.promotion.ready, true);
passed += 1;

const outsideBboxDocument = {
  ...fillDocument(["proof-a", "proof-b", "proof-c"]),
  provinces: (await Promise.resolve(fillDocument(["proof-a", "proof-b", "proof-c"]))).provinces.map((entry) => (
    entry.provinceId === "proof-c" ? { ...entry, ring: [[10, 0], [11, 0], [11, 1], [10, 1]] } : entry
  )),
};
const bboxProgress = validateSourceDocumentProgress({ coverage, provinces, sourceDocument: outsideBboxDocument });
const bboxProvince = bboxProgress.provinces.find((item) => item.provinceId === "proof-c");
assert.equal(bboxProvince.ready, false);
assert.ok(bboxProvince.errors.some((message) => message.includes("outside the declared coverage bbox")));
assert.equal(bboxProgress.promotable, false);
passed += 1;

const anatoliaCoverage = await readFixture(goldenDirectory, "coverage.json");
const anatoliaProvinces = await readFixture(goldenDirectory, "provinces.json");
const anatoliaTemplate = createSourceDocumentTemplate({
  coverage: anatoliaCoverage,
  provinces: anatoliaProvinces,
  sourceId: "anatolia-1300-editorial",
  sourceRef: "editorial reconstruction; reviewed boundary sources pending",
});
assert.equal(anatoliaTemplate.provinces.length, 38, "anatolia template must pre-fill all 38 declared province IDs");
assert.equal(anatoliaTemplate.provinces.every((entry) => entry.geometryStatus === "pending"), true);
passed += 1;

console.log(`Province source studio contract passed: ${passed} checks, template + partial-progress authoring + promotion door verified (38-province anatolia template ready; test-only geometry, never golden dataset).`);
