import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validatePoliticalGeographyAuthority } from "../historical-gis/province/PoliticalGeographyAuthorityValidator.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const fixtureDirectory = path.join(root, "tools/tests/fixtures/political-geography/anatolia-1300");
const readJson = async (name) => JSON.parse(await fs.readFile(path.join(fixtureDirectory, name), "utf8"));

const coverage = await readJson("coverage.json");
const provinces = await readJson("provinces.json");
const provenance = await readJson("provenance.json");
const ids = provinces.provinces.map((province) => province.provinceId);

assert.equal(coverage.schemaVersion, 1);
assert.equal(coverage.coverageId, "anatolia-1300");
assert.equal(coverage.declaredProvinceCount, 38);
assert.equal(provinces.coverageId, coverage.coverageId);
assert.equal(provenance.coverageId, coverage.coverageId);
assert.equal(provenance.status, "source-gap");
assert.equal(provenance.requiredSource.status, "missing");
assert.equal(provenance.sourceCandidates.every((candidate) => candidate.usableAsProvinceBoundary === false), true);
assert.equal(provinces.provinces.length, coverage.declaredProvinceCount);
assert.equal(new Set(ids).size, ids.length, "Golden fixture province IDs must be unique.");
assert.ok(provinces.provinces.every((province) => province.geometryId.startsWith("anatolia-1300-v1:")));
assert.ok(provinces.provinces.every((province) => province.geometryStatus === "pending"));
assert.equal(coverage.promotion.ready, false, "Golden fixture cannot be promoted without authoritative geometry.");
assert.equal(coverage.promotion.fallbackProvinceCount, 0);
assert.equal(coverage.promotion.overlapCount, 0);
assert.equal(coverage.promotion.internalGapCount, 0);
assert.equal(coverage.promotion.sharedEdgeMismatchCount, 0);
assert.equal(coverage.promotion.provenanceErrorCount, 0);

const authorityResult = validatePoliticalGeographyAuthority({ coverage, provinces, provenance });
assert.equal(authorityResult.valid, false, "Draft fixture must fail the production authority gate.");
assert.ok(authorityResult.errors.some((error) => error.message.includes("required historical province source")));
assert.ok(authorityResult.errors.some((error) => error.message.includes("authoritative political topology")));

console.log(`Political Geography Authority fixture contract passed: ${ids.length} declared provinces, ready=${coverage.promotion.ready}, geometryStatus=pending.`);
