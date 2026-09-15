/**
 * Historia AI — Political Mapbin Build contract test.
 *
 * Proves the P6 build chain end to end on the SYNTHETIC TEST-ONLY
 * proof-grid fixture: reviewed source -> promoted dataset -> authority gate
 * -> mapbin transport -> zero-copy runtime round-trip. Also proves the gate
 * blocks the pending anatolia-1300 golden fixture from ever being encoded.
 */

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPoliticalGeographyDataset } from "../historical-gis/province/PoliticalGeographyDatasetBuilder.js";
import { buildPoliticalMapbin } from "../build/political-mapbin-builder.js";
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

const { dataset, report: buildReport } = buildPoliticalGeographyDataset({ coverage, provinces, provenance, sourceDocument: SOURCE_DOCUMENT });
const { buffer, source, idMap, report } = buildPoliticalMapbin(dataset);
passed += 1;

assert.equal(report.provinces, 3, "world face must be excluded from the transport");
assert.equal(source.provinceCount, 3);
assert.equal(report.geometryPointCount, source.geometryPointCount);
assert.ok(source.geometryPointCount > 0);
assert.equal(source.ids.buffer, buffer, "runtime source must be zero-copy over the encoded buffer");
assert.equal(report.authoritySourceId, "synthetic-proof-grid-reviewed");
passed += 1;

const expectedIds = ["proof-a", "proof-b", "proof-c"];
for (let index = 0; index < idMap.length; index += 1) {
  assert.equal(idMap[index].numericId, index + 1, "numeric identities must be stable in declared order");
  assert.equal(idMap[index].provinceId, expectedIds[index]);
  assert.equal(source.getProvinceId(index), index + 1);
  assert.equal(source.indexOf(index + 1), index);
  assert.equal(idMap[index].geometrySourceId, "synthetic-proof-grid-reviewed");
  assert.ok(Number.isFinite(idMap[index].confidence));
}
passed += 1;

// The assembler picks the cycle start by arcId order, not by source ring
// order, so decoded rings may be rotated cyclically. The authority contract
// only requires the same closed polygon — same vertices, same direction,
// same shared edges — so canonicalize before comparing.
function canonicalizeRing(ring) {
  const open = ring.length > 1 && ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1] ? ring.slice(0, -1) : ring;
  let best = 0;
  for (let i = 1; i < open.length; i += 1) {
    if (open[i][0] < open[best][0] || (open[i][0] === open[best][0] && open[i][1] < open[best][1])) best = i;
  }
  return [...open.slice(best), ...open.slice(0, best)];
}

const sourceDocumentRing = SOURCE_DOCUMENT.provinces.find((province) => province.provinceId === idMap[0].provinceId).ring;
const geometryView = source.geometryView(0, source.tileRecord(0)[1]);
const decoded = Array.from(geometryView);
assert.equal(source.tileRecord(0)[1], sourceDocumentRing.length + 1, "tile must store the closed ring");
assert.equal(decoded.length, (sourceDocumentRing.length + 1) * 2, "decoded ring must store the closed ring (first vertex repeated)");

const decodedRing = [];
for (let index = 0; index < decoded.length; index += 2) decodedRing.push([decoded[index], decoded[index + 1]]);
const canonicalSource = canonicalizeRing(sourceDocumentRing);
const canonicalDecoded = canonicalizeRing(decodedRing);
assert.deepEqual(canonicalDecoded, canonicalSource, "decoded ring must match the reviewed source ring up to canonical rotation");
passed += 1;

const goldenCoverage = await readFixture(goldenDirectory, "coverage.json");
const goldenProvinces = await readFixture(goldenDirectory, "provinces.json");
const goldenProvenance = await readFixture(goldenDirectory, "provenance.json");
assert.throws(
  () => buildPoliticalMapbin({ coverage: goldenCoverage, provinces: goldenProvinces, provenance: goldenProvenance, topology: null }),
  /dataset failed the authority gate/,
  "pending golden fixture must never reach the mapbin transport",
);
passed += 1;

console.log(`Political mapbin build contract passed: ${passed} checks, proof-grid -> ${report.provinces} provinces, ${report.geometryPointCount} points, ${report.totalByteLength} bytes, zero-copy round-trip verified; golden fixture blocked at the gate.`);
