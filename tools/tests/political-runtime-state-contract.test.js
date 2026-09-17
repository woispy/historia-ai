/**
 * Historia AI — P7 Runtime State contract test.
 *
 * Proves the static-geometry / dynamic-state separation end to end on the
 * SYNTHETIC TEST-ONLY proof-grid fixture:
 *
 *  - Mapbin sections are disjoint (province fields never overlap geometry).
 *  - Dynamic state (owner) mutates freely; static geometry authority stays
 *    byte-identical.
 *  - ids are the immutable identity layer; the numericId -> provinceId
 *    sidecar stays valid after gameplay mutation.
 *  - flags are derived runtime data, not binary authority.
 *  - Runtime loading is deterministic.
 */

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPoliticalGeographyDataset } from "../historical-gis/province/PoliticalGeographyDatasetBuilder.js";
import { buildPoliticalMapbin } from "../build/political-mapbin-builder.js";
import { BinaryMapAssetSource } from "../../src/map/runtime/BinaryMapAssetSource.js";
import { ProvinceSoA } from "../../src/map/runtime/ProvinceSoA.js";
import {
  assertMapbinSectionsDisjoint,
  captureStaticGeometryChecksum,
  assertStaticGeometryUnchanged,
  regionChecksum,
} from "../../src/map/runtime/RuntimeStateIntegrity.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const fixtureDirectory = path.join(root, "tools/tests/fixtures/political-geography/proof-grid");
const readFixture = async (name) => JSON.parse(await readFile(path.join(fixtureDirectory, name), "utf8"));

const coverage = await readFixture("coverage.json");
const provinces = await readFixture("provinces.json");
const provenance = await readFixture("provenance.json");

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

const { dataset } = buildPoliticalGeographyDataset({ coverage, provinces, provenance, sourceDocument: SOURCE_DOCUMENT });
const { buffer, idMap } = buildPoliticalMapbin(dataset);
const assetSource = BinaryMapAssetSource.fromArrayBuffer(buffer);
const header = assetSource.header;
passed += 1;

const sections = assertMapbinSectionsDisjoint(header);
assert.ok(sections.length >= 4, "layout must describe every mapbin section");
passed += 1;

const soa = ProvinceSoA.fromBinary(buffer, header);
assert.equal(soa.count, 3);
for (const field of ["ids", "owner", "minX", "minY", "maxX", "maxY", "centerX", "centerY"]) {
  assert.equal(soa[field].buffer, buffer, `${field} must be zero-copy over the runtime buffer`);
}
assert.notEqual(soa.flags.buffer, buffer, "flags are derived runtime data and must never alias binary authority");
passed += 1;

const staticSnapshot = captureStaticGeometryChecksum(buffer, header);
assert.ok(Object.keys(staticSnapshot).includes("geometry"), "snapshot must cover the static geometry region");
assert.equal(Object.keys(staticSnapshot).includes("provinceFields"), false, "snapshot must exclude the mutable province fields region");
const idsChecksumBefore = regionChecksum(buffer, header.provinceOffset, 3 * 4);
const boundsChecksumBefore = regionChecksum(buffer, header.provinceOffset + 3 * 8, 3 * 16);
passed += 1;

for (let i = 0; i < soa.owner.length; i += 1) soa.owner[i] = (i + 11) * 7;
assertStaticGeometryUnchanged(buffer, header, staticSnapshot);
assert.equal(regionChecksum(buffer, header.provinceOffset, 3 * 4), idsChecksumBefore, "ids are the immutable identity layer and must never be mutated by gameplay state");
assert.equal(regionChecksum(buffer, header.provinceOffset + 3 * 8, 3 * 16), boundsChecksumBefore, "bounds are static geometry authority and must never be mutated by gameplay state");
for (let i = 0; i < soa.owner.length; i += 1) assert.equal(soa.owner[i], (i + 11) * 7, "owner is the dynamic state layer and must carry gameplay mutation");
passed += 1;

for (let i = 0; i < idMap.length; i += 1) {
  const index = soa.indexOf(idMap[i].numericId);
  assert.notEqual(index, -1, `numeric identity ${idMap[i].numericId} must survive state mutation`);
  assert.equal(assetSource.getProvinceId(index), idMap[i].numericId);
  assert.equal(idMap[i].provinceId, ["proof-a", "proof-b", "proof-c"][i]);
}
passed += 1;

const soaAgain = ProvinceSoA.fromBinary(buffer, header);
assert.deepEqual(Array.from(soaAgain.ids), Array.from(soa.ids));
assert.deepEqual(Array.from(soaAgain.minX), Array.from(soa.minX));
assert.deepEqual(Array.from(soaAgain.centerX), Array.from(soa.centerX));
assertStaticGeometryUnchanged(buffer, header, staticSnapshot);
passed += 1;

console.log(`Political runtime state contract passed: ${passed} checks, proof-grid -> ${soa.count} provinces, sections disjoint, owner mutated freely, static geometry authority byte-identical (test-only geometry, never golden dataset).`);
